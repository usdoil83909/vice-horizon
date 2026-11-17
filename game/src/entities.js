import { TYPES, CITY, WEAPONS, clamp, distance, angleDiff } from './config.js';
import { pick } from './random.js';
import { move, solid } from './world.js';

export function createPlayer() {
  return { x: 945, y: 1040, angle: -Math.PI / 2, hp: 100, armor: 60, money: 750, weapon: 1, ammo: WEAPONS.map(w => w.ammo), vehicle: null, cooldown: 0, step: 0, invulnerable: 0 };
}
export function createCar(world, type, x, y, angle = 0) {
  return { type, x, y, angle, speed: 0, vx: 0, vy: 0, hp: TYPES[type].hp, maxHp: TYPES[type].hp, color: type === 'taxi' ? '#e9bb56' : type === 'police' ? '#e7e8dc' : pick(world.rng, ['#bce3d8', '#e98486', '#b2abc9', '#ebd0a0', '#587786', '#ab5268', '#77a2a1']), stolen: false, driver: true, ai: true, turn: 0, ramCooldown: 0 };
}
export function createPed(world, x, y) {
  if (solid(world, x, y, 8)) y = clamp(Math.floor(y / CITY.block) * CITY.block + 110, 12, CITY.height - 12);
  return { x, y, angle: world.rng() * Math.PI * 2, hp: 55, flee: 0, timer: world.rng() * 4, color: pick(world.rng, ['#e3b477', '#b1d2c1', '#d7839b', '#e6dbb9', '#88a5c3']), step: 0, deadTime: 0 };
}
export function populate(state) {
  const { world } = state;
  for (let i = 0; i < 95; i++) {
    const gx = Math.floor(world.rng() * 8), gy = Math.floor(world.rng() * 8);
    const x = gx * 440 + 110 + world.rng() * 290, y = gy * 440 + (world.rng() < .5 ? 110 : 425);
    state.peds.push(createPed(world, x, Math.min(y, CITY.height - 15)));
  }
  for (let i = 0; i < 65; i++) {
    const vertical = world.rng() < .5, a = Math.floor(world.rng() * 8) * 440, b = world.rng() * 3400 + 80;
    const car = createCar(world, pick(world.rng, ['sedan', 'sedan', 'sports', 'taxi', 'truck']), vertical ? a + 72 : b, vertical ? b : a + 28, vertical ? Math.PI / 2 : 0);
    car.speed = 60 + world.rng() * 40; state.cars.push(car);
  }
  for (const [type, x, y, angle] of [['sports', 995, 973, 0], ['sedan', 850, 970, 0], ['truck', 1830, 3150, Math.PI / 2]]) {
    const car = createCar(world, type, x, y, angle); car.ai = false; car.driver = false; state.cars.push(car);
  }
}
export function enterExit(state) {
  const p = state.player;
  if (p.vehicle) {
    const car = p.vehicle;
    for (const side of [1, -1]) {
      const test = { x: car.x, y: car.y };
      if (!move(state.world, test, Math.cos(car.angle + Math.PI / 2) * 35 * side, Math.sin(car.angle + Math.PI / 2) * 35 * side, 10)) {
        p.x = test.x; p.y = test.y; p.vehicle = null; car.speed *= .4; car.ai = false; state.notice = { text: 'Back on the street', time: 2 }; return;
      }
    }
    return;
  }
  const car = state.cars.filter(c => c.hp > 0 && distance(c, p) < 72).sort((a, b) => distance(a, p) - distance(b, p))[0];
  if (car) {
    p.vehicle = car; car.ai = false;
    if (!car.stolen) { car.stolen = true; state.crime(car.type === 'police' ? 2 : .8, 'VEHICLE THEFT'); }
    car.driver = false; p.x = car.x; p.y = car.y;
    state.audio.blip(); state.notice = { text: `${TYPES[car.type].name}  /  W accelerate · S reverse · Shift drift`, time: 4 };
  }
}
export function updatePlayer(state, dt, controls) {
  const p = state.player, axis = controls.axes(); p.cooldown = Math.max(0, p.cooldown - dt); p.invulnerable = Math.max(0, p.invulnerable - dt);
  if (controls.tap('KeyF')) enterExit(state);
  if (controls.tap('KeyQ')) p.weapon = (p.weapon + 2) % 3;
  if (controls.tap('KeyE')) p.weapon = (p.weapon + 1) % 3;
  for (let i = 0; i < 3; i++) if (controls.tap(`Digit${i + 1}`)) p.weapon = i;
  const pointer = controls.pointer;
  if (p.vehicle) {
    const car = p.vehicle, spec = TYPES[car.type];
    const handbrake = controls.held('ShiftLeft', 'ShiftRight');
    car.speed += -axis.y * spec.accel * dt;
    car.speed *= Math.pow(handbrake ? .97 : .994, dt * 60);
    car.speed = clamp(car.speed, -spec.max * .38, spec.max);
    car.angle += axis.x * Math.min(1, Math.abs(car.speed) / 55) * Math.sign(car.speed || 1) * (handbrake ? 3.4 : 2.1) * dt;
    const blend = 1 - Math.exp(-(handbrake ? 2.1 : 9) * dt);
    car.vx += (Math.cos(car.angle) * car.speed - car.vx) * blend;
    car.vy += (Math.sin(car.angle) * car.speed - car.vy) * blend;
    if (move(state.world, car, car.vx * dt, car.vy * dt, 19)) {
      if (Math.abs(car.speed) > 55) { car.hp -= Math.abs(car.speed) * .055; state.shake = 5; state.spark(car.x, car.y, 5); }
      car.speed *= -.22; car.vx *= -.2; car.vy *= -.2;
    }
    if (handbrake && Math.abs(car.speed) > 65 && state.ticks % 4 === 0) state.skids.push({ x: car.x, y: car.y, angle: car.angle, life: 12 });
    p.x = car.x; p.y = car.y; p.angle = car.angle;
    if (car.hp <= 0) { p.vehicle = null; p.hp -= 45; state.spark(car.x, car.y, 40); state.shake = 15; }
  } else {
    const length = Math.hypot(axis.x, axis.y) || 1, speed = controls.held('ShiftLeft', 'ShiftRight') ? 170 : 100;
    move(state.world, p, axis.x / length * speed * dt, axis.y / length * speed * dt, 9);
    if (axis.x || axis.y) { p.angle += angleDiff(Math.atan2(axis.y, axis.x), p.angle) * .3; p.step += dt * speed / 12; }
    if (pointer.active) {
      const cam = state.camera || { x: p.x, y: p.y, zoom: 1.05 };
      p.angle = Math.atan2(cam.y + (pointer.y - state.view.h / 2) / cam.zoom - p.y, cam.x + (pointer.x - state.view.w / 2) / cam.zoom - p.x);
    }
  }
}
export function updatePeds(state, dt) {
  const p = state.player;
  for (const ped of state.peds) {
    if (ped.hp <= 0) { ped.deadTime += dt; continue; }
    if (distance(ped, p) > 1000) continue;
    ped.timer -= dt; ped.flee = Math.max(0, ped.flee - dt);
    if (ped.flee) ped.angle = Math.atan2(ped.y - p.y, ped.x - p.x);
    else if (ped.timer < 0) { ped.angle += (state.world.rng() - .5) * 1.6; ped.timer = 2 + state.world.rng() * 4; }
    const speed = ped.flee ? 110 : 23;
    if (move(state.world, ped, Math.cos(ped.angle) * speed * dt, Math.sin(ped.angle) * speed * dt, 7)) ped.angle += Math.PI / 2;
    ped.step += dt * speed / 12;
    for (const car of state.cars) {
      if (car.hp > 0 && Math.abs(car.speed) > 65 && distance(car, ped) < 25) {
        ped.hp = 0; state.blood(ped.x, ped.y, 10);
        if (p.vehicle === car) state.crime(1, 'HIT AND RUN');
        break;
      }
    }
  }
  state.peds = state.peds.filter(ped => ped.deadTime < 45);
}

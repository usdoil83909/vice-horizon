import { ARMS, FLEET, gap, limit, turnTo } from './config.js';
import { choose } from './random.js';
import { travel, blocked, nearestNode } from './world.js';

export function protagonist() { return { x: 1580, y: 1072, angle: -.5, health: 100, armor: 65, cash: 1250, displayCash: 1250, gun: 1, ammo: ARMS.map(a => a.stock), car: null, fireWait: 0, grace: 0, stride: 0 }; }
export function automobile(city, kind, x, y, angle = 0) {
  const spec = FLEET[kind];
  return { id: `car-${Math.floor(city.rng() * 0x10000000).toString(16)}`, kind, x, y, angle, velocity: 0, vx: 0, vy: 0, health: spec.hull, maxHealth: spec.hull, paint: kind === 'cab' ? '#ebbf62' : kind === 'cruiser' ? '#dde5dc' : choose(city.rng, ['#84ddcb', '#df859c', '#e9c8a1', '#94a7d2', '#ae526d', '#578a93', '#bdc8b7']), auto: true, occupied: true, stolen: false, node: null, previous: -1, ramWait: 0, wreck: false, age: 0 };
}
export function citizen(city, x, y) { return { x, y, angle: city.rng() * Math.PI * 2, health: 60, panic: 0, rethink: city.rng() * 3, stride: 0, age: 0, paint: choose(city.rng, ['#d6b580', '#dfa3af', '#afceb8', '#98b7d0', '#e3ddbc', '#c89fce']) }; }
export function seedPopulation(s) {
  for (let i = 0; i < 74; i++) {
    const node = choose(s.city.rng, s.city.graph), target = s.city.graph[choose(s.city.rng, node.links)];
    const vertical = target.x === node.x, direction = vertical ? Math.sign(target.y - node.y) : Math.sign(target.x - node.x), progress = .15 + s.city.rng() * .7;
    const car = automobile(s.city, choose(s.city.rng, ['saloon', 'saloon', 'coupe', 'cab', 'van', 'muscle']), node.x + (target.x - node.x) * progress + (vertical ? -direction * 24 : 0), node.y + (target.y - node.y) * progress + (vertical ? 0 : direction * 24), Math.atan2(target.y - node.y, target.x - node.x));
    car.node = target.id; car.previous = node.id; car.velocity = 65 + s.city.rng() * 40; s.cars.push(car);
  }
  for (let i = 0; i < 130; i++) { const col = Math.floor(s.city.rng() * 9), row = Math.floor(s.city.rng() * 9); s.people.push(citizen(s.city, col * 480 + 130 + s.city.rng() * 310, row * 480 + 114)); }
  for (const entry of [['coupe', 1600, 1038], ['muscle', 1690, 1038], ['van', 2550, 3438]]) { const c = automobile(s.city, ...entry); c.auto = false; c.occupied = false; s.cars.push(c); }
}
export function switchCar(s) {
  const p = s.hero;
  if (p.car) {
    const c = p.car;
    for (const offset of [Math.PI / 2, -Math.PI / 2, Math.PI]) { const x = c.x + Math.cos(c.angle + offset) * 43, y = c.y + Math.sin(c.angle + offset) * 43; if (!blocked(s.city, x, y, 10)) { p.x = x; p.y = y; p.car = null; c.auto = false; c.velocity *= .3; return; } }
    s.tell('The door is blocked. Move the car first.'); return;
  }
  const c = s.cars.filter(v => v.health > 0 && gap(v, p) < 76).sort((a, b) => gap(a, p) - gap(b, p))[0];
  if (!c) { s.tell('Get closer to a vehicle.'); return; }
  if (c.occupied) { const driver = citizen(s.city, c.x, c.y + 37); driver.panic = 9; s.people.push(driver); }
  p.car = c; c.auto = false; c.occupied = false;
  if (!c.stolen) { c.stolen = true; s.offense(c.kind === 'cruiser' ? 1.8 : .7, 'GRAND THEFT AUTO'); }
  p.x = c.x; p.y = c.y; s.sound.note(430, .12, 'triangle'); s.tell(`${FLEET[c.kind].label} · W accelerate · S brake / reverse · SHIFT drift`, 5);
}
export function driveHero(s, dt, input) {
  const p = s.hero, axis = input.axes(); p.fireWait = Math.max(0, p.fireWait - dt); p.grace = Math.max(0, p.grace - dt); p.displayCash += (p.cash - p.displayCash) * Math.min(1, dt * 5);
  if (input.pressed('KeyF')) switchCar(s);
  if (input.pressed('KeyQ')) p.gun = (p.gun + 2) % 3;
  if (input.pressed('KeyE')) p.gun = (p.gun + 1) % 3;
  for (let i = 0; i < 3; i++) if (input.pressed(`Digit${i + 1}`)) p.gun = i;
  if (p.car) {
    const c = p.car, spec = FLEET[c.kind], drift = input.held('ShiftLeft', 'ShiftRight'), braking = axis.y > 0 && c.velocity > 12;
    c.velocity += -axis.y * spec.power * (braking ? 2.4 : 1) * dt; c.velocity *= Math.exp(-(drift ? 1.05 : .32) * dt); c.velocity = limit(c.velocity, -spec.top * .32, spec.top);
    c.angle += axis.x * Math.sign(c.velocity || 1) * Math.min(1, Math.abs(c.velocity) / 65) * (drift ? 3.1 : 2.05) * dt;
    const traction = 1 - Math.exp(-(drift ? 1.9 : spec.grip) * dt); c.vx += (Math.cos(c.angle) * c.velocity - c.vx) * traction; c.vy += (Math.sin(c.angle) * c.velocity - c.vy) * traction;
    if (travel(s.city, c, c.vx * dt, c.vy * dt, 20)) { if (Math.abs(c.velocity) > 65) { c.health -= Math.abs(c.velocity) * .065; s.burst(c.x, c.y, 9, '#ffd99c'); s.trauma = 6; s.sound.note(80, .08, 'sawtooth'); } c.velocity *= -.24; c.vx *= -.2; c.vy *= -.2; }
    if (drift && Math.abs(c.velocity) > 65 && s.tick % 3 === 0) s.tracks.push({ x: c.x, y: c.y, angle: c.angle, ttl: 18 });
    for (const other of s.cars) if (other !== c && gap(other, c) < 43 && Math.abs(c.velocity) > 40) { const force = Math.abs(c.velocity) * .045; c.health -= force; other.health -= force * 1.3; other.velocity *= .5; c.velocity *= -.25; s.burst(c.x, c.y, 8, '#ffcc87'); s.trauma = 5; if (other.kind === 'cruiser') s.offense(.4, 'HIT A PATROL VEHICLE'); }
    p.x = c.x; p.y = c.y; p.angle = c.angle;
  } else {
    const length = Math.hypot(axis.x, axis.y) || 1, pace = input.held('ShiftLeft', 'ShiftRight') ? 183 : 108;
    travel(s.city, p, axis.x / length * pace * dt, axis.y / length * pace * dt);
    if (axis.x || axis.y) { p.angle += turnTo(Math.atan2(axis.y, axis.x), p.angle) * .35; p.stride += dt * pace * .11; }
    if (input.mouse.aim) { const cam = s.camera || { x: p.x, y: p.y, zoom: 1 }; p.angle = Math.atan2(cam.y + (input.mouse.y - s.viewport.h / 2) / cam.zoom - p.y, cam.x + (input.mouse.x - s.viewport.w / 2) / cam.zoom - p.x); }
  }
}
export function walkCitizens(s, dt) {
  for (const p of s.people) {
    if (p.health <= 0) { p.age += dt; continue; } if (gap(p, s.hero) > 1050) continue;
    p.rethink -= dt; p.panic = Math.max(0, p.panic - dt);
    if (p.panic > 0) p.angle = Math.atan2(p.y - s.hero.y, p.x - s.hero.x); else if (p.rethink < 0) { p.angle += (s.city.rng() - .5) * 1.7; p.rethink = 2 + s.city.rng() * 4; }
    const pace = p.panic ? 132 : 25; if (travel(s.city, p, Math.cos(p.angle) * pace * dt, Math.sin(p.angle) * pace * dt, 7)) p.angle += 1.6; p.stride += dt * pace * .1;
    for (const c of s.cars) if (c.health > 0 && Math.abs(c.velocity) > 75 && gap(c, p) < 26) { p.health = 0; s.burst(p.x, p.y, 10, '#b76073'); c.velocity *= .85; if (s.hero.car === c) s.offense(1, 'HIT AND RUN'); break; }
  }
  s.people = s.people.filter(p => p.age < 35);
  if (s.tick % 120 === 0) { const nearby = s.people.filter(p => gap(p, s.hero) < 900).length; if (nearby < 25 && s.people.length < 155) { const node = nearestNode(s.city, { x: s.hero.x + (s.city.rng() - .5) * 1400, y: s.hero.y + (s.city.rng() - .5) * 1000 }); for (let i = 0; i < 4; i++) s.people.push(citizen(s.city, node.x + 75 + s.city.rng() * 260, node.y + 62)); } }
}

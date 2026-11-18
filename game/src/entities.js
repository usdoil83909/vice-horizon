import { clamp, tuning, carNames, dist, angleTo } from './config.js';
import { between, choose, chance, angle } from './random.js';

export function createPlayer() {
  return { x: 640, y: 610, angle: 0, health: tuning.player.maxHealth, armor: 35, state: 'foot', car: null, cash: 1250, sprint: false, invuln: 0 };
}
export function createEntities(city, rng) {
  const cars = [], peds = [], pickups = [];
  for (let i = 0; i < 26; i++) cars.push(createCar(choose(rng, carNames.slice(0, 5)), between(rng, 250, 2850), between(rng, 220, 2100), angle(rng)));
  for (let i = 0; i < 42; i++) {
    peds.push({ x: between(rng, 180, 2860), y: between(rng, 170, 2060), angle: angle(rng), speed: between(rng, .35, .9), mood: 'calm', health: 40, panic: 0, color: choose(rng, ['#ffcfaa', '#b87958', '#f1c4a8']), shirt: choose(rng, ['#50e9ff', '#ff4e9d', '#ffd45a', '#9c84ff']) });
  }
  for (let i = 0; i < 14; i++) pickups.push({ x: between(rng, 220, 2800), y: between(rng, 200, 2050), type: i % 3 ? 'cash' : 'armor', taken: false });
  return { cars, peds, pickups, particles: [], projectiles: [], skid: [] };
}
export function createCar(type, x, y, rotation = 0) {
  const spec = tuning.cars[type] || tuning.cars.sedan;
  return { type, x, y, rotation, speed: 0, health: 100, color: spec.color, occupied: false, reckless: false, braking: false, dead: false };
}
export function updatePlayer(player, input, city, dt) {
  if (player.invuln > 0) player.invuln -= dt;
  if (player.state === 'drive') return;
  const horizontal = Number(input.is('right')) - Number(input.is('left'));
  const vertical = Number(input.is('down')) - Number(input.is('up'));
  player.sprint = input.is('sprint');
  if (!horizontal && !vertical) return;
  const speed = player.sprint ? tuning.player.sprint : tuning.player.speed;
  const step = speed * dt / (Math.hypot(horizontal, vertical) || 1);
  const x = player.x + horizontal * step, y = player.y + vertical * step;
  if (!city.blocked?.(x, player.y)) player.x = x;
  if (!city.blocked?.(player.x, y)) player.y = y;
  player.angle = Math.atan2(vertical, horizontal);
}
export function tryCarjack(player, entities) {
  const vehicle = entities.cars.find(car => !car.occupied && !car.dead && dist(player, car) < 48);
  if (!vehicle) return false;
  vehicle.occupied = true;
  Object.assign(player, { state: 'drive', car: vehicle, x: vehicle.x, y: vehicle.y });
  return true;
}
export function exitCar(player) {
  if (player.state !== 'drive' || !player.car) return false;
  const vehicle = player.car;
  vehicle.occupied = false;
  player.state = 'foot';
  player.x += Math.cos(vehicle.rotation + Math.PI / 2) * 28;
  player.y += Math.sin(vehicle.rotation + Math.PI / 2) * 28;
  player.car = null;
  return true;
}
export function updateCar(player, car, input, dt, city) {
  const spec = tuning.cars[car.type] || tuning.cars.sedan;
  const throttle = input.is('up') ? 1 : input.is('down') ? -.6 : 0;
  car.speed = clamp(car.speed + throttle * .22 * dt, -2.5, spec.speed) * Math.pow(.93, dt);
  const turn = spec.turn * dt * (1 + Math.abs(car.speed) / 5);
  if (input.is('left')) car.rotation -= turn;
  if (input.is('right')) car.rotation += turn;
  const x = car.x + Math.cos(car.rotation) * car.speed * dt;
  const y = car.y + Math.sin(car.rotation) * car.speed * dt;
  if (city.blocked?.(x, y)) car.speed *= -.3;
  else { car.x = x; car.y = y; }
  player.x = car.x;
  player.y = car.y;
}
export function updatePeds(entities, player, dt, rng) {
  for (const person of entities.peds) {
    if (dist(person, player) < 130 && player.state === 'drive') {
      person.mood = 'panic'; person.panic = 80; person.angle = angleTo(player, person);
    } else if (person.panic > 0) person.panic -= dt;
    else {
      person.mood = 'calm';
      if (chance(rng, .01)) person.angle += between(rng, -.8, .8);
    }
    const speed = person.mood === 'panic' ? 2.2 : person.speed;
    person.x += Math.cos(person.angle) * speed * dt;
    person.y += Math.sin(person.angle) * speed * dt;
    if (person.x < 90 || person.x > 2900) person.angle = Math.PI - person.angle;
    if (person.y < 90 || person.y > 2150) person.angle = -person.angle;
  }
}
export function collectPickups(player, entities) {
  for (const pickup of entities.pickups) {
    if (pickup.taken || dist(player, pickup) >= 26) continue;
    pickup.taken = true;
    if (pickup.type === 'cash') player.cash += 250;
    else player.armor = clamp(player.armor + 30, 0, tuning.player.maxArmor);
  }
}

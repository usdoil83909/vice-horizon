import { clamp, dist, tuning } from './config.js';
import { choose } from './random.js';
import { createCar } from './entities.js';

export const createPolice = () => ({ wanted: 0, heat: 0, cruisers: [], blocks: [], helicopters: [], busted: false, wasted: false });
export function addHeat(police, amount = 1) {
  police.heat = clamp(police.heat + Math.max(0, amount), 0, 100);
  police.wanted = clamp(Math.ceil(police.heat / 20), 0, 5);
}
export function updatePolice(police, player, entities, city, dt, rng) {
  if (police.wanted > 0) police.heat = Math.max(0, police.heat - tuning.wanted.decay * dt);
  police.wanted = clamp(Math.ceil(police.heat / 20), 0, 5);
  const fleetSize = police.wanted + (police.wanted > 2 ? 1 : 0);
  while (police.cruisers.length < fleetSize) {
    const cruiser = createCar('police', choose(rng, [260, 600, 920, 1240, 1560, 1880, 2200, 2520]), choose(rng, [280, 600, 920, 1240, 1560, 1880]), 0);
    cruiser.police = true;
    police.cruisers.push(cruiser);
    entities.cars.push(cruiser);
  }
  if (police.wanted >= 4) {
    while (police.blocks.length < 4) {
      const i = police.blocks.length;
      police.blocks.push({ x: [600, 1240, 1880, 2520][i], y: [600, 920, 1560, 1880][i], active: true });
    }
  }
  if (police.wanted >= 3) {
    while (police.helicopters.length < 3) police.helicopters.push({ x: player.x + 300 * (police.helicopters.length - 1), y: player.y - 260, angle: 0 });
  }
  for (const cruiser of police.cruisers) {
    if (cruiser.dead) continue;
    cruiser.rotation = Math.atan2(player.y - cruiser.y, player.x - cruiser.x);
    cruiser.speed = tuning.cars.police.speed * (player.state === 'drive' ? .72 : .55);
    cruiser.x += Math.cos(cruiser.rotation) * cruiser.speed * dt;
    cruiser.y += Math.sin(cruiser.rotation) * cruiser.speed * dt;
    if (dist(cruiser, player) < 48) {
      player.health = clamp(player.health - .18 * dt, 0, 100);
      cruiser.speed *= -.4;
    }
  }
  for (const aircraft of police.helicopters) {
    aircraft.x += (player.x - aircraft.x) * .006 * dt;
    aircraft.y += (player.y - aircraft.y) * .006 * dt;
  }
  if (player.health <= 0) police.wasted = true;
  if (police.wanted > 0 && police.cruisers.some(car => !car.dead && dist(car, player) < 42) && player.health < 18) police.busted = true;
}
export function clearPolice(police, entities) {
  for (const car of police.cruisers) car.dead = true;
  for (const collection of [police.cruisers, police.blocks, police.helicopters]) collection.length = 0;
  Object.assign(police, { heat: 0, wanted: 0, busted: false, wasted: false });
}

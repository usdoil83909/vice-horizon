import { roadXs, roadYs, tuning, clamp } from './config.js';
import { choose, chance } from './random.js';

export function updateTraffic(entities, player, dt, rng) {
  for (const car of entities.cars) {
    if (car.occupied || car.dead) continue;
    if (!car.target || Math.hypot(car.x - car.target.x, car.y - car.target.y) < 35) {
      car.target = { x: choose(rng, roadXs), y: choose(rng, roadYs) };
    }
    const dx = car.target.x - car.x, dy = car.target.y - car.y;
    const heading = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? Math.PI : 0) : (dy < 0 ? -Math.PI / 2 : Math.PI / 2);
    const turn = Math.atan2(Math.sin(heading - car.rotation), Math.cos(heading - car.rotation));
    car.rotation += turn * .04 * dt;
    const spec = tuning.cars[car.type] || tuning.cars.sedan;
    const queued = entities.cars.some(other => other !== car && !other.dead && Math.hypot(other.x - car.x, other.y - car.y) < 65);
    car.braking = queued;
    const speed = car.reckless ? spec.speed * 1.18 : spec.speed * (queued ? .25 : .7);
    car.speed += (speed - car.speed) * .03 * dt;
    if (chance(rng, .002)) car.reckless = !car.reckless;
    car.x += Math.cos(car.rotation) * car.speed * dt;
    car.y += Math.sin(car.rotation) * car.speed * dt;
    if (car.x < 100 || car.x > 2900) car.target = { x: choose(rng, roadXs), y: car.y };
    if (car.y < 100 || car.y > 2150) car.target = { x: car.x, y: choose(rng, roadYs) };
    if (Math.hypot(car.x - player.x, car.y - player.y) < 30 && player.state === 'foot') player.health = clamp(player.health - .15 * dt, 0, 100);
  }
}
export function roadLane(x, y) {
  const closest = (values, target) => values.reduce((best, value) => Math.abs(value - target) < Math.abs(best - target) ? value : best);
  const laneX = closest(roadXs, x), laneY = closest(roadYs, y);
  return Math.abs(laneX - x) < Math.abs(laneY - y) ? { x: laneX, y, axis: 'y' } : { x, y: laneY, axis: 'x' };
}

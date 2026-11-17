import { gap, turnTo, limit } from './config.js';
import { choose } from './random.js';
import { greenLight, nearestNode, travel } from './world.js';
import { automobile } from './entities.js';

export function flowTraffic(s, dt) {
  for (const car of s.cars) {
    car.age += dt; car.ramWait = Math.max(0, car.ramWait - dt);
    if (!car.auto || car.health <= 0 || car === s.hero.car || car.pursuit || gap(car, s.hero) > 1400) continue;
    const node = s.city.graph[car.node] || nearestNode(s.city, car); if (car.node === null) car.node = node.id;
    const vertical = Math.abs(Math.sin(car.angle)) > .7, direction = vertical ? Math.sign(node.y - car.y) : Math.sign(node.x - car.x);
    const target = { x: node.x + (vertical ? -direction * 24 : 0), y: node.y + (vertical ? 0 : direction * 24) }, distance = gap(car, target);
    if (distance < 31) { const options = node.links.filter(id => id !== car.previous); car.previous = node.id; car.node = choose(s.city.rng, options.length ? options : node.links); }
    let desired = car.kind === 'van' || car.kind === 'truck' ? 75 : 110; const forward = { x: Math.cos(car.angle), y: Math.sin(car.angle) };
    if (distance < 100 && distance > 31 && !greenLight(node, s.clock, vertical)) desired = 0;
    for (const other of s.cars) { if (other === car || other.health <= 0) continue; const dx = other.x - car.x, dy = other.y - car.y, ahead = dx * forward.x + dy * forward.y, side = Math.abs(dx * forward.y - dy * forward.x); if (ahead > 0 && ahead < 93 && side < 31) desired = Math.min(desired, Math.max(0, (ahead - 42) * 1.4)); }
    if (!s.hero.car && gap(car, s.hero) < 65) desired = 0;
    if (car.reckless) desired *= 1.42;
    if (distance < 70 && desired < 5 && s.city.rng() < dt * .12) car.honk = .7;
    car.honk = Math.max(0, (car.honk || 0) - dt);
    car.velocity += limit(desired - car.velocity, -160 * dt, 65 * dt); car.angle += limit(turnTo(Math.atan2(target.y - car.y, target.x - car.x), car.angle), -2.5 * dt, 2.5 * dt);
    if (travel(s.city, car, Math.cos(car.angle) * car.velocity * dt, Math.sin(car.angle) * car.velocity * dt, 18)) { car.velocity = 0; car.node = nearestNode(s.city, car).id; }
  }
  if (s.tick % 240 === 0 && s.cars.length < 105 && s.cars.filter(c => c.health > 0 && gap(c, s.hero) < 850).length < 13) {
    const node = nearestNode(s.city, { x: s.hero.x + (s.city.rng() < .5 ? -750 : 750), y: s.hero.y });
    const kind = choose(s.city.rng, ['saloon', 'cab', 'coupe', 'muscle', 'van', 'truck', 'sports']); const car = automobile(s.city, kind, node.x + 170, node.y + 24); car.reckless = s.city.rng() < .09;
    car.node = node.links.find(id => id === node.id + 1) ?? node.id; car.previous = node.id; car.velocity = 80; s.cars.push(car);
  }
  s.cars = s.cars.filter(c => c === s.hero.car || c === s.job.vehicle || c.pursuit || gap(c, s.hero) < 1800 || (!c.wreck && c.age < 150));
}

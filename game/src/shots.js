import { automobile, citizen } from './entities.js';
import { accept } from './missions.js';

export function composeScene(s, scene) {
  s.capture = scene; s.clock = 82; s.tick = 4920;
  s.mode = scene === 'start' ? 'title' : 'play';
  s.hero.x = 3970; s.hero.y = 1516; s.hero.angle = -.08;
  s.hero.cash = 24750; s.hero.displayCash = 24750;
  s.people = s.people.filter(p => Math.hypot(p.x - 3970, p.y - 1516) > 600);
  s.cars = s.cars.filter(p => Math.hypot(p.x - 3970, p.y - 1516) > 600);
  const heroCar = automobile(s.city, 'coupe', 3970, 1516, -.08);
  heroCar.paint = '#91e7c9'; heroCar.auto = false; heroCar.stolen = true; heroCar.occupied = false; heroCar.velocity = 135;
  s.cars.push(heroCar); s.hero.car = heroCar;
  for (const [kind, x, y, a] of [['cab', 3760, 1468, Math.PI], ['saloon', 3892, 1320, Math.PI / 2], ['muscle', 4200, 1468, Math.PI], ['van', 3892, 1740, -Math.PI / 2], ['saloon', 3510, 1516, 0]]) {
    const c = automobile(s.city, kind, x, y, a); c.velocity = 80; s.cars.push(c);
  }
  for (let i = 0; i < 24; i++) {
    const person = citizen(s.city, 3550 + s.city.rng() * 780, i % 2 ? 1557 + s.city.rng() * 10 : 1420 - s.city.rng() * 15);
    person.angle = i % 2 ? 0 : Math.PI; s.people.push(person);
  }
  s.job.index = scene === 'mission' ? 11 : 7; s.job.completed = Array.from({ length: s.job.index }, (_, i) => i);
  accept(s); s.job.dialogue = scene === 'mission' ? 9 : 0;
  s.toast.ttl = 0;
  if (scene === 'chase' || scene === 'mission') {
    s.stars = scene === 'chase' ? 4 : 3; s.heat = s.stars; s.seen = true;
    for (const [x, y, a] of [[3775, 1520, 0], [3900, 1690, -1.35], [4140, 1468, 2.85]]) {
      const c = automobile(s.city, 'cruiser', x, y, a); c.pursuit = true; c.auto = false; c.velocity = 170; s.cars.push(c);
    }
    s.chopper = { x: 4120, y: 1260, angle: 2.3, health: 450 };
    for (let i = 0; i < 16; i++) s.tracks.push({ x: 3970 - i * 13, y: 1516 + Math.sin(i * .3) * 14, angle: -.08, ttl: 15 });
    for (const p of s.people) p.panic = 10;
  }
  if (scene === 'mission') { s.hero.car = s.job.vehicle; s.job.vehicle.x = 3970; s.job.vehicle.y = 1516; s.job.vehicle.angle = -.08; s.job.vehicle.velocity = 155; s.job.phase = 1; }
  if (scene === 'start') { s.hero.car = heroCar; s.job.active = false; }
}

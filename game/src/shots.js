import { automobile, citizen } from './entities.js';

export function composeScene(s, scene) {
  s.mode = scene === 'start' ? 'title' : 'play'; s.capture = true;
  if (scene === 'chase') {
    s.stars = 4; s.heat = 4; s.hero.x = 2050; s.hero.y = 1140; s.hero.cash = 8420;
    const car = automobile(s.city, 'muscle', s.hero.x, s.hero.y, .12); car.auto = false; car.occupied = false; car.velocity = 165; s.cars.push(car); s.hero.car = car;
    for (let i = 0; i < 5; i++) { const cop = automobile(s.city, 'cruiser', s.hero.x - 140 - i * 54, s.hero.y - 65 + i * 25, .12); cop.pursuit = true; cop.auto = false; cop.velocity = 130; s.cars.push(cop); }
    s.chopper = { x: s.hero.x - 160, y: s.hero.y - 240, angle: .5, health: 450, shotWait: 2 };
  } else if (scene === 'mission') {
    s.mode = 'play'; s.job.index = 4; s.job.active = true; s.job.dialogue = 0; s.hero.x = 980; s.hero.y = 2900; s.hero.cash = 18350;
    s.hostiles = Array.from({ length: 4 }, (_, i) => ({ x: 1070 + i * 31, y: 2910 + (i % 2) * 37, angle: 0, health: 85, wait: .3 + i * .2, paint: '#e47d92', stride: 0 }));
  } else if (scene === 'play') {
    s.mode = 'play'; s.hero.x = 1580; s.hero.y = 1072; s.job.active = false; s.hero.cash = 3620;
    for (let i = 0; i < 17; i++) { const c = automobile(s.city, ['cab', 'coupe', 'saloon', 'van'][i % 4], 1450 + i % 5 * 122, 925 + Math.floor(i / 5) * 115, i % 2 ? 0 : Math.PI / 2); c.auto = false; c.occupied = false; s.cars.push(c); }
    for (let i = 0; i < 12; i++) s.people.push(citizen(s.city, 1450 + s.city.rng() * 700, 890 + s.city.rng() * 510));
  }
}

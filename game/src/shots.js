import { automobile, citizen } from './entities.js';

export function composeScene(s, scene) {
  s.mode = scene === 'start' ? 'title' : 'play'; s.capture = true;
  if (scene === 'chase') {
    s.stars = 4; s.heat = 4; s.hero.x = 2900; s.hero.y = 1180; s.hero.cash = 8420;
    const car = automobile(s.city, 'sports', s.hero.x, s.hero.y, 0); car.auto = false; car.occupied = false; car.stolen = true; car.velocity = 165; s.cars.push(car); s.hero.car = car;
    for (let i = 0; i < 5; i++) { const cop = automobile(s.city, 'cruiser', s.hero.x + 95 + i * 64, s.hero.y - 72 + i * 31, Math.PI); cop.pursuit = true; cop.auto = false; cop.velocity = 130; s.cars.push(cop); }
    s.chopper = { x: s.hero.x - 160, y: s.hero.y - 240, angle: .5, health: 450, shotWait: 2 }; s.job.index = 13; s.job.active = true;
  } else if (scene === 'mission') {
    s.mode = 'play'; s.job.index = 4; s.job.active = true; s.job.dialogue = 0; s.hero.x = 1000; s.hero.y = 2980; s.hero.cash = 18350; s.job.phase = 0; s.city.landmarks.find(place => place.kind === 'depot').x = 1036; s.city.landmarks.find(place => place.kind === 'depot').y = 2990;
    s.hostiles = Array.from({ length: 4 }, (_, i) => ({ x: 1070 + i * 31, y: 2910 + (i % 2) * 37, angle: 0, health: 85, wait: .3 + i * .2, paint: '#e47d92', stride: 0 }));
    s.job.remaining = 74; s.job.completed = [0, 1, 2, 3];
    s.hero.x = 1036; s.hero.y = 2990;
  } else if (scene === 'play') {
    s.mode = 'play'; s.hero.x = 1580; s.hero.y = 1072; s.job.active = false; s.hero.cash = 3620; s.hero.gun = 0;
    for (let i = 0; i < 17; i++) { const c = automobile(s.city, ['cab', 'coupe', 'saloon', 'van'][i % 4], 1450 + i % 5 * 122, 925 + Math.floor(i / 5) * 115, i % 2 ? 0 : Math.PI / 2); c.auto = false; c.occupied = false; s.cars.push(c); }
    for (let i = 0; i < 32; i++) s.people.push(citizen(s.city, 1450 + s.city.rng() * 700, 890 + s.city.rng() * 510));
  }
  s.hero.displayCash = s.hero.cash;
}

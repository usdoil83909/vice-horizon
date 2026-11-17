const keyFor = s => `vice-horizon-${s.city.seed >>> 0}`;
export function store(s) {
  try {
    const data = { seed: s.city.seed, hero: { ...s.hero, car: s.hero.car?.id || null }, job: { ...s.job, vehicle: s.job.vehicle?.id || null }, stars: s.stars, heat: s.heat, clock: s.clock };
    localStorage.setItem(keyFor(s), JSON.stringify(data)); return true;
  } catch { return false; }
}
export function restore(s) {
  try {
    const data = JSON.parse(localStorage.getItem(keyFor(s)) || 'null'); if (!data || data.seed !== s.city.seed) return false;
    Object.assign(s.hero, data.hero); s.hero.car = s.cars.find(c => c.id === data.hero.car) || null;
    Object.assign(s.job, data.job); s.job.vehicle = s.cars.find(c => c.id === data.job.vehicle) || null;
    s.stars = data.stars; s.heat = data.heat; s.clock = data.clock; return true;
  } catch { return false; }
}

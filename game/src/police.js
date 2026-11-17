import { distance, angleDiff, clamp } from './config.js';
import { createCar } from './entities.js';
import { move, solid, lineOfSight } from './world.js';

export function crime(state, amount, label) {
  state.heat = clamp(state.heat + amount, 0, 5);
  state.wanted = Math.ceil(state.heat); state.lastCrime = state.time; state.hidden = 0;
  state.notice = { text: `${label}  /  PCPD alerted`, time: 3 };
}
export function hurtPlayer(state, damage) {
  const p = state.player;
  if (p.invulnerable > 0) return;
  const absorb = Math.min(p.armor, damage * .7); p.armor -= absorb; p.hp -= damage - absorb;
  p.invulnerable = .25; state.shake = Math.max(state.shake, 4);
}
export function updatePolice(state, dt) {
  const p = state.player, cops = state.cars.filter(c => c.type === 'police' && c.hp > 0);
  state.policeTimer -= dt;
  if (state.wanted && cops.length < state.wanted + 1 && state.policeTimer <= 0) {
    const angle = state.world.rng() * Math.PI * 2;
    let x = clamp(p.x + Math.cos(angle) * 650, 50, 3750), y = clamp(p.y + Math.sin(angle) * 650, 50, 3500);
    if (state.world.rng() < .5) x = Math.round((x - 50) / 440) * 440 + 50; else y = Math.round((y - 50) / 440) * 440 + 50;
    if (!solid(state.world, x, y, 20)) state.cars.push(createCar(state.world, 'police', x, y, Math.atan2(p.y - y, p.x - x)));
    state.policeTimer = 3;
  }
  let seen = false;
  for (const car of cops) {
    if (car === p.vehicle || !car.ai) continue;
    car.ramCooldown = Math.max(0, car.ramCooldown - dt);
    if (!state.wanted) { car.speed *= .97; continue; }
    const d = distance(car, p);
    if (d < 460 && lineOfSight(state.world, car, p)) seen = true;
    if (d > 1500) { car.hp = 0; continue; }
    // Chase along intersections until the suspect is close, then ram directly.
    let tx = p.x, ty = p.y;
    if (d > 230) {
      const nx = Math.round((car.x - 50) / 440) * 440 + 50, ny = Math.round((car.y - 50) / 440) * 440 + 50;
      if (Math.abs(car.x - nx) > 28 && Math.abs(car.y - ny) < 65) { ty = ny; }
      else if (Math.abs(car.y - ny) > 28 && Math.abs(car.x - nx) < 65) { tx = nx; }
    }
    car.angle += clamp(angleDiff(Math.atan2(ty - car.y, tx - car.x), car.angle), -2.6 * dt, 2.6 * dt);
    car.speed += ((p.vehicle ? 210 + state.wanted * 12 : 120) - car.speed) * dt;
    if (move(state.world, car, Math.cos(car.angle) * car.speed * dt, Math.sin(car.angle) * car.speed * dt, 19)) { car.angle += 1.25; car.speed *= .65; }
    if (d < 42 && car.ramCooldown <= 0) {
      hurtPlayer(state, p.vehicle ? 7 : 9); if (p.vehicle) p.vehicle.hp -= 8;
      state.spark(p.x, p.y, 8); car.speed *= -.35; car.ramCooldown = 1;
    }
    if (!p.vehicle && d < 80) state.bust += dt * .45;
  }
  if (!seen) state.bust = Math.max(0, state.bust - dt);
  if (state.wanted && !seen && state.time - state.lastCrime > 10) {
    state.hidden += dt;
    if (state.hidden > 9) { state.heat = Math.max(0, state.wanted - 1); state.wanted = Math.ceil(state.heat); state.hidden = 0; state.notice = { text: state.wanted ? 'Losing the heat… stay out of sight' : 'PURSUIT EVADED  /  Back to business', time: 4 }; }
  } else if (seen) state.hidden = 0;
  if (p.hp <= 0) { p.hp = 0; state.screen = 'wasted'; state.endTimer = 0; state.audio.blip(120); }
  else if (state.bust > 1) { state.screen = 'busted'; state.endTimer = 0; state.audio.blip(160); }
}

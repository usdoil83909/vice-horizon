import { WEAPONS, distance } from './config.js';
import { solid } from './world.js';
import { hurtPlayer } from './police.js';

export function fire(state) {
  const p = state.player, w = WEAPONS[p.weapon];
  if (p.cooldown > 0 || p.ammo[p.weapon] <= 0) return;
  p.cooldown = w.rate; p.ammo[p.weapon]--;
  const angle = p.angle + (state.world.rng() - .5) * w.spread;
  if (p.weapon === 0) {
    const victim = state.peds.find(v => v.hp > 0 && distance(p, v) < 46);
    if (victim) { victim.hp -= w.damage; victim.flee = 12; state.blood(victim.x, victim.y, 3); state.crime(.3, 'ASSAULT'); }
    state.punch = .15; state.audio.shot(true); return;
  }
  state.bullets.push({ x: p.x + Math.cos(angle) * 20, y: p.y + Math.sin(angle) * 20, vx: Math.cos(angle) * 980, vy: Math.sin(angle) * 980, life: w.range / 980, damage: w.damage });
  state.flash = .065; state.shake = p.weapon === 2 ? 2 : 3; state.audio.shot();
  state.crime(.09, 'SHOTS FIRED');
  for (const ped of state.peds) if (distance(p, ped) < 500) ped.flee = 10;
}
export function updateCombat(state, dt, controls) {
  if (controls.held('Space') || controls.pointer.firing) fire(state);
  for (const bullet of state.bullets) {
    const steps = 3;
    for (let i = 0; i < steps && bullet.life > 0; i++) {
      bullet.x += bullet.vx * dt / steps; bullet.y += bullet.vy * dt / steps;
      if (solid(state.world, bullet.x, bullet.y, 1)) { bullet.life = 0; state.spark(bullet.x, bullet.y, 4); break; }
      const ped = state.peds.find(v => v.hp > 0 && Math.hypot(v.x - bullet.x, v.y - bullet.y) < 12);
      if (ped) { ped.hp -= bullet.damage; ped.flee = 15; bullet.life = 0; state.blood(ped.x, ped.y, 7); if (ped.hp <= 0) state.crime(.6, 'CIVILIAN DOWN'); }
      const car = state.cars.find(c => c !== state.player.vehicle && c.hp > 0 && Math.hypot(c.x - bullet.x, c.y - bullet.y) < 24);
      if (car && bullet.life > 0) { car.hp -= bullet.damage; bullet.life = 0; state.spark(bullet.x, bullet.y, 7); if (car.type === 'police') state.crime(.35, 'OFFICER UNDER FIRE'); }
      for (const enemy of state.enemies) {
        if (enemy.hp > 0 && Math.hypot(enemy.x - bullet.x, enemy.y - bullet.y) < 14 && bullet.life > 0) { enemy.hp -= bullet.damage; bullet.life = 0; state.blood(enemy.x, enemy.y, 7); }
      }
    }
    bullet.life -= dt;
  }
  state.bullets = state.bullets.filter(b => b.life > 0);
  for (const enemy of state.enemies) {
    if (enemy.hp <= 0) continue;
    enemy.cooldown -= dt;
    if (distance(enemy, state.player) < 260 && enemy.cooldown <= 0) {
      enemy.cooldown = 1.3;
      const angle = Math.atan2(state.player.y - enemy.y, state.player.x - enemy.x);
      let blocked = false;
      for (let t = 0; t < distance(enemy, state.player); t += 15) if (solid(state.world, enemy.x + Math.cos(angle) * t, enemy.y + Math.sin(angle) * t, 2)) { blocked = true; break; }
      if (!blocked) { hurtPlayer(state, 7); state.particles.push({ x: enemy.x, y: enemy.y, vx: 0, vy: 0, life: .12, color: '#ffdb8c', size: 10 }); }
    }
  }
}

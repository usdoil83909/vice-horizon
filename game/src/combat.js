import { tuning, clamp, dist } from './config.js';

export function fire(state, input, audio) {
  if (state.cooldown > 0 || !input.is('attack')) return false;
  const spec = tuning.weapons[state.weapon] || tuning.weapons.pistol;
  state.cooldown = spec.cooldown;
  state.entities.projectiles.push({
    x: state.player.x, y: state.player.y, angle: state.player.angle,
    life: spec.range, damage: spec.damage, speed: state.weapon === 'smg' ? 15 : 19,
  });
  audio.shot();
  return true;
}

export function updateCombat(state, dt, audio) {
  state.cooldown = Math.max(0, state.cooldown - dt);
  for (const bullet of state.entities.projectiles) {
    const step = bullet.speed * dt;
    bullet.x += Math.cos(bullet.angle) * step;
    bullet.y += Math.sin(bullet.angle) * step;
    bullet.life -= step;
    for (const person of state.entities.peds) {
      if (bullet.life <= 0 || person.health <= 0 || dist(bullet, person) >= 18) continue;
      person.health -= bullet.damage;
      bullet.life = 0;
      if (person.health <= 0) state.police.heat = Math.min(100, state.police.heat + 12);
    }
    for (const vehicle of state.entities.cars) {
      if (bullet.life <= 0 || vehicle.health <= 0 || dist(bullet, vehicle) >= 22) continue;
      vehicle.health -= bullet.damage;
      bullet.life = 0;
      if (vehicle.health <= 0) {
        vehicle.dead = true;
        audio.explosion();
        for (let i = 0; i < 18; i++) state.entities.particles.push({ x: vehicle.x, y: vehicle.y, life: 40, color: '#ff9c52' });
      }
    }
  }
  state.entities.projectiles = state.entities.projectiles.filter(bullet => bullet.life > 0);
  state.player.health = clamp(state.player.health, 0, 100);
}

export function takeDamage(player, amount) {
  if (player.invuln > 0 || amount <= 0) return false;
  const armorHit = Math.min(player.armor, amount * .55);
  player.armor -= armorHit;
  player.health -= amount - armorHit;
  player.invuln = 20;
  return true;
}

import { ARMS, gap, turnTo } from './config.js';
import { blocked, sight, travel } from './world.js';
import { hurtHero } from './police.js';

function hit(s, target, damage) {
  const before = target.health; target.health -= damage;
  if (target.kind) s.burst(target.x, target.y, 5, '#ffe0a0');
  else { target.panic = 10; s.burst(target.x, target.y, 6, '#bd687c'); }
  if (target.pursuit && before > 0) s.offense(.16, 'ASSAULT ON POLICE');
  else if (s.people.includes(target) && before > 0) s.offense(target.health <= 0 ? .8 : .35, 'ARMED ASSAULT');
}
export function battle(s, dt, controls) {
  const p = s.hero, weapon = ARMS[p.gun];
  if ((controls.held('Space') || controls.mouse.fire) && p.fireWait <= 0) {
    p.fireWait = weapon.delay;
    if (p.gun === 0) {
      s.fist = .17;
      const targets = [...s.people, ...s.hostiles, ...s.cars].filter(t => t.health > 0 && gap(t, p) < weapon.range + (t.kind ? 16 : 0) && Math.abs(turnTo(Math.atan2(t.y - p.y, t.x - p.x), p.angle)) < 1.1);
      if (targets.length) { hit(s, targets[0], weapon.harm); s.sound.note(90, .07, 'triangle'); }
    } else if (p.ammo[p.gun] > 0) {
      p.ammo[p.gun]--; s.muzzle = .075; s.trauma = p.gun === 2 ? 2.5 : 1.8;
      const heading = p.angle + (s.city.rng() - .5) * weapon.scatter * 2;
      s.projectiles.push({ x: p.x + Math.cos(heading) * 26, y: p.y + Math.sin(heading) * 26, vx: Math.cos(heading) * 850, vy: Math.sin(heading) * 850, ttl: weapon.range / 850, harm: weapon.harm, hostile: false });
      s.sound.gun(p.gun); s.offense(.09, 'SHOTS FIRED');
    } else if (controls.pressed('Space')) s.tell('Out of ammunition. Complete a job or visit the hospital supply point.');
  }
  for (const e of s.hostiles) {
    if (e.health <= 0) continue;
    const d = gap(e, p); e.angle = Math.atan2(p.y - e.y, p.x - e.x); e.wait -= dt;
    if (d > 180 && d < 850) travel(s.city, e, Math.cos(e.angle) * 47 * dt, Math.sin(e.angle) * 47 * dt, 9);
    if (d < 480 && e.wait <= 0 && sight(s.city, e, p)) {
      e.wait = 1 + s.city.rng(); const angle = e.angle + (s.city.rng() - .5) * .18;
      s.projectiles.push({ x: e.x, y: e.y, vx: Math.cos(angle) * 510, vy: Math.sin(angle) * 510, ttl: 1, harm: 10, hostile: true });
    }
  }
  for (const shot of s.projectiles) {
    shot.ttl -= dt;
    const dx = shot.vx * dt, dy = shot.vy * dt, count = Math.ceil(Math.hypot(dx, dy) / 6);
    for (let i = 0; i < count && shot.ttl > 0; i++) {
      shot.x += dx / count; shot.y += dy / count;
      if (blocked(s.city, shot.x, shot.y, 2)) { s.burst(shot.x, shot.y, 3, '#ffe2a4'); shot.ttl = 0; break; }
      if (shot.hostile) {
        if (gap(shot, p) < (p.car ? 24 : 11)) { if (p.car) p.car.health -= shot.harm; else hurtHero(s, shot.harm); shot.ttl = 0; }
      } else {
        const targets = [...s.people, ...s.hostiles, ...s.cars, ...(s.chopper ? [s.chopper] : [])];
        for (const t of targets) if (t.health > 0 && t !== p.car && gap(t, shot) < (t.kind ? 25 : t === s.chopper ? 28 : 11)) { hit(s, t, shot.harm); shot.ttl = 0; break; }
      }
    }
  }
  s.projectiles = s.projectiles.filter(b => b.ttl > 0).slice(-110);
  for (const c of s.cars) {
    if (c.health > 0 || c.wreck) continue;
    c.wreck = true; c.health = 0; c.auto = false; c.velocity = 0;
    s.burst(c.x, c.y, 65, '#ffa260', 2); s.burst(c.x, c.y, 28, '#3b4248', 3); s.trauma = 17; s.sound.explosion();
    if (p.car === c) { p.car = null; hurtHero(s, 48); p.y += 39; }
    else if (gap(p, c) < 120) hurtHero(s, 34 * (1 - gap(p, c) / 130));
    for (const other of s.cars) if (other !== c && gap(c, other) < 105) other.health -= 95;
    for (const person of [...s.people, ...s.hostiles]) if (gap(person, c) < 95) person.health -= 100;
    if (c.pursuit) s.offense(.5, 'PATROL VEHICLE DESTROYED');
  }
  if (s.chopper?.health <= 0 && !s.chopper.down) { s.chopper.down = true; s.burst(s.chopper.x, s.chopper.y, 90, '#ffb778', 2); s.trauma = 14; s.hero.cash += 500; }
}

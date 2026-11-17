import { gap, limit, turnTo } from './config.js';
import { automobile } from './entities.js';
import { nearestNode, sight, travel } from './world.js';

export function reportCrime(s, severity, label) {
  s.heat = limit(s.heat + severity, 0, 5); s.stars = Math.max(s.stars, Math.ceil(s.heat)); s.lastOffense = s.clock; s.unseen = 0;
  s.tell(`${label} · WANTED BY VHPD`, 3); for (const person of s.people) if (gap(person, s.hero) < 330) person.panic = 9;
}
export function hurtHero(s, damage) {
  const p = s.hero; if (p.grace > 0 || s.mode !== 'play') return;
  const shield = Math.min(p.armor, damage * .72); p.armor -= shield; p.health = Math.max(0, p.health - (damage - shield)); s.trauma = Math.max(s.trauma, 3);
  if (p.health <= 0) { s.mode = 'wasted'; s.endClock = 0; s.endReason = 'WASTED'; }
}
export function pursuit(s, dt) {
  s.spawnWait -= dt; const cops = s.cars.filter(c => c.pursuit && c.health > 0);
  if (s.stars > 0 && cops.length < Math.min(10, s.stars * 2) && s.spawnWait <= 0) {
    const a = s.city.rng() * Math.PI * 2, node = nearestNode(s.city, { x: s.hero.x + Math.cos(a) * 800, y: s.hero.y + Math.sin(a) * 800 });
    const c = automobile(s.city, 'cruiser', node.x + 24, node.y); c.pursuit = true; c.auto = false; c.velocity = 110; c.shotWait = 1; s.cars.push(c); s.spawnWait = Math.max(1.2, 5 - s.stars * .6);
  }
  let observed = false, arresting = false;
  for (const c of cops) {
    const d = gap(c, s.hero), visible = d < 650 && sight(s.city, c, s.hero); if (visible) { observed = true; c.lastSeen = { x: s.hero.x, y: s.hero.y }; }
    let destination = visible ? s.hero : c.lastSeen || nearestNode(s.city, s.hero);
    const nearby = cops.filter(other => other !== c && gap(other, s.hero) < 210);
    if (s.stars >= 2 && nearby.length) { const flank = c.id.charCodeAt(c.id.length - 1) % 2 ? 1 : -1; destination = { x: s.hero.x + Math.cos(s.hero.angle + Math.PI / 2 * flank) * 90, y: s.hero.y + Math.sin(s.hero.angle + Math.PI / 2 * flank) * 90 }; }
    let aim = Math.atan2(destination.y - c.y, destination.x - c.x);
    if (!sight(s.city, c, { x: c.x + Math.cos(aim) * 80, y: c.y + Math.sin(aim) * 80 })) { const node = nearestNode(s.city, c), options = node.links.map(id => s.city.graph[id]).sort((a, b) => gap(a, destination) - gap(b, destination)); const route = gap(c, node) > 110 ? node : options[0] || node; aim = Math.atan2(route.y - c.y, route.x - c.x); }
    c.angle += limit(turnTo(aim, c.angle), -2.6 * dt, 2.6 * dt); const speed = s.stars ? (d < 65 ? 75 : 125 + s.stars * 23) : 65; c.velocity += limit(speed - c.velocity, -150 * dt, 95 * dt);
    if (travel(s.city, c, Math.cos(c.angle) * c.velocity * dt, Math.sin(c.angle) * c.velocity * dt, 19)) { c.angle += 1.1; c.velocity *= -.2; }
    if (d < 68 && s.stars >= 2 && s.hero.car && c.ramWait <= 0) { s.hero.car.health -= 10 + s.stars * 3; c.health -= 7; s.hero.car.velocity *= .72; c.ramWait = 1.25; s.trauma = 7; s.burst(c.x, c.y, 10, '#ffc591'); }
    if (d < 46 && s.stars && (!s.hero.car || Math.abs(s.hero.car.velocity) < 22)) arresting = true;
    if (s.stars >= 4 && d < 300 && (c.blockWait || 0) <= 0) { c.blockWait = 7; c.roadblock = s.city.graph.filter(n => gap(n, s.hero) < 420).sort((a, b) => gap(a, s.hero) - gap(b, s.hero))[1] || nearestNode(s.city, s.hero); }
    if (c.roadblock && gap(c.roadblock, s.hero) > 500) c.roadblock = null; c.blockWait = Math.max(0, (c.blockWait || 0) - dt);
    c.shotWait = (c.shotWait || 0) - dt;
    if (visible && d < 280 && s.stars >= 2 && c.shotWait <= 0) { c.shotWait = 1.7 - s.stars * .16; s.projectiles.push({ x: c.x, y: c.y, vx: Math.cos(aim) * 530, vy: Math.sin(aim) * 530, ttl: .8, harm: 8, hostile: true }); }
    if (!s.stars && d > 1000) c.pursuit = false;
  }
  if (s.stars >= 3) {
    if (!s.chopper) s.chopper = { x: s.hero.x - 400, y: s.hero.y - 450, angle: 0, health: 450, shotWait: 2 };
    const h = s.chopper; if (h.health > 0) { const target = { x: s.hero.x + Math.cos(s.clock * .21) * 200, y: s.hero.y - 160 + Math.sin(s.clock * .21) * 110 }; h.x += (target.x - h.x) * dt * .9; h.y += (target.y - h.y) * dt * .9; h.angle = Math.atan2(s.hero.y - h.y, s.hero.x - h.x); if (gap(h, s.hero) < 450 && sight(s.city, h, s.hero)) { observed = true; h.shotWait -= dt; if (h.shotWait < 0) { h.shotWait = 2.3; hurtHero(s, 5); } } }
  } else s.chopper = null;
  s.seen = observed; s.bustMeter = limit(s.bustMeter + (arresting ? dt : -dt * 1.6), 0, 3.5);
  if (s.bustMeter >= 3.5) { s.mode = 'busted'; s.endReason = 'BUSTED'; s.endClock = 0; }
  if (s.stars && s.clock - s.lastOffense > 12) { s.unseen = observed ? 0 : s.unseen + dt; if (s.unseen > 11 + s.stars * 2) { s.stars--; s.heat = s.stars; s.unseen = 0; s.tell(s.stars ? 'Search perimeter shrinking. Stay out of sight.' : 'HEAT CLEARED · You lost them.', 4); } }
}
export function recover(s) {
  const landmark = s.city.landmarks.find(l => l.kind === (s.endReason === 'BUSTED' ? 'police' : 'hospital'));
  s.hero.x = landmark.x; s.hero.y = landmark.y; s.hero.car = null; s.hero.health = 100; s.hero.armor = 30; s.hero.grace = 5;
  const fee = s.endReason === 'BUSTED' ? 450 : 300; s.hero.cash = Math.max(0, s.hero.cash - fee); s.stars = 0; s.heat = 0; s.bustMeter = 0;
  for (const c of s.cars) c.pursuit = false; s.job.active = false; s.job.failed = true; s.hostiles = []; s.chopper = null; s.mode = 'play'; s.tell(`Back on your feet · fees $${fee} · ENTER retries the current job.`, 7);
}

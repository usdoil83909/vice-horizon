import { PALETTE } from './config.js';

export function render(ctx, state) {
  const { w, h } = state.viewport;
  const p = state.player;
  const zoom = p.inCar ? Math.max(0.65, 1 - Math.abs(p.inCar.speed) / 900) : 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = PALETTE.sky; ctx.fillRect(0, 0, w, h);
  ctx.save(); ctx.translate(w / 2 - p.x * zoom, h / 2 - p.y * zoom); ctx.scale(zoom, zoom);
  ctx.fillStyle = PALETTE.water; ctx.fillRect(4000, 0, 800, 4800);
  ctx.fillStyle = PALETTE.sand; ctx.fillRect(3960, 0, 40, 4800);
  for (const park of state.world.parks) { ctx.fillStyle = PALETTE.grass; ctx.fillRect(park.x, park.y, park.w, park.h); }
  for (const road of state.world.roads) {
    ctx.fillStyle = PALETTE.sidewalk; ctx.fillRect(road.x - 10, road.y - 10, road.w + 20, road.h + 20);
    ctx.fillStyle = PALETTE.road; ctx.fillRect(road.x, road.y, road.w, road.h);
    ctx.strokeStyle = PALETTE.lane; ctx.lineWidth = 3; ctx.setLineDash([22, 26]); ctx.beginPath();
    if (road.vertical) { ctx.moveTo(road.x + road.w / 2, road.y); ctx.lineTo(road.x + road.w / 2, road.y + road.h); }
    else { ctx.moveTo(road.x, road.y + road.h / 2); ctx.lineTo(road.x + road.w, road.y + road.h / 2); }
    ctx.stroke(); ctx.setLineDash([]);
  }
  for (const building of state.world.buildings) {
    ctx.fillStyle = '#0c1620aa'; ctx.fillRect(building.x + 12, building.y + 14, building.w, building.h);
    ctx.fillStyle = building.color; ctx.fillRect(building.x, building.y, building.w, building.h);
    ctx.fillStyle = '#f5c96899';
    for (let y = building.y + 16; y < building.y + building.h - 8; y += 22) for (let x = building.x + 13; x < building.x + building.w - 8; x += 24) ctx.fillRect(x, y, 8, 7);
  }
  for (const lm of state.world.landmarks) { ctx.fillStyle = lm.color; ctx.fillRect(lm.x, lm.y, lm.w, lm.h); ctx.fillStyle = '#101823'; ctx.font = 'bold 15px Arial'; ctx.fillText(lm.name, lm.x + 10, lm.y + 60); }
  for (const palm of state.world.palms) { ctx.strokeStyle = '#51372d'; ctx.lineWidth = 8 * palm.s; ctx.beginPath(); ctx.moveTo(palm.x, palm.y + 35); ctx.lineTo(palm.x - 8, palm.y - 22); ctx.stroke(); ctx.strokeStyle = '#63c17b'; ctx.lineWidth = 5; for (let a = -2.5; a < 2.5; a += .8) { ctx.beginPath(); ctx.moveTo(palm.x - 8, palm.y - 22); ctx.lineTo(palm.x - 8 + Math.cos(a) * 32, palm.y - 22 + Math.sin(a) * 22); ctx.stroke(); } }
  for (const c of state.entities.cars) drawCar(ctx, c);
  for (const u of state.police.units) drawCar(ctx, u, true);
  for (const q of state.entities.peds) { if (q.down) continue; ctx.fillStyle = q.shirt; ctx.fillRect(q.x - 7, q.y - 8, 14, 20); ctx.fillStyle = q.color; ctx.beginPath(); ctx.arc(q.x, q.y - 15, 7, 0, 7); ctx.fill(); }
  if (!p.inCar) { ctx.fillStyle = PALETTE.cyan; ctx.beginPath(); ctx.arc(p.x, p.y, 13, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(p.x + Math.cos(p.angle) * 22, p.y + Math.sin(p.angle) * 22); ctx.lineTo(p.x + Math.cos(p.angle + 2.4) * 8, p.y + Math.sin(p.angle + 2.4) * 8); ctx.lineTo(p.x + Math.cos(p.angle - 2.4) * 8, p.y + Math.sin(p.angle - 2.4) * 8); ctx.fill(); }
  for (const particle of state.entities.particles) { ctx.globalAlpha = Math.max(0, particle.life * 6); ctx.fillStyle = '#ffe783'; ctx.fillRect(particle.x - 8, particle.y - 8, 16, 16); } ctx.globalAlpha = 1; ctx.restore();
  const vignette = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .25, w / 2, h / 2, Math.max(w, h) * .75); vignette.addColorStop(0, 'transparent'); vignette.addColorStop(1, '#0009'); ctx.fillStyle = vignette; ctx.fillRect(0, 0, w, h);
}
function drawCar(ctx, c, police = false) { ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.angle); ctx.fillStyle = '#07101888'; ctx.fillRect(-28, 14, 56, 12); ctx.fillStyle = police ? '#243d8c' : c.color; ctx.fillRect(-32, -16, 64, 32); ctx.fillStyle = '#162431'; ctx.fillRect(-13, -12, 25, 24); ctx.fillStyle = '#f8e1a5'; ctx.fillRect(23, -11, 5, 7); ctx.fillRect(23, 4, 5, 7); ctx.fillStyle = '#e54a58'; ctx.fillRect(-29, -11, 5, 7); ctx.fillRect(-29, 4, 5, 7); if (police) { ctx.fillStyle = '#ee4b68'; ctx.fillRect(-5, -20, 10, 5); ctx.fillStyle = '#4ce2ed'; ctx.fillRect(5, -20, 10, 5); } ctx.restore(); }

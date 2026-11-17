import { COLORS, WEAPONS, TYPES, distance } from './config.js';
import { districtAt } from './world.js';
import { currentMission, missionTarget, objective } from './missions.js';

export function text(ctx, value, x, y, size = 12, color = '#edf0e5', weight = '500', align = 'left', font = 'sans-serif') {
  ctx.font = `${weight} ${size}px ${font}`; ctx.fillStyle = color; ctx.textAlign = align; ctx.fillText(value, x, y);
}
export function panel(ctx, x, y, w, h, alpha = .88) {
  ctx.fillStyle = `rgba(13,25,34,${alpha})`; ctx.beginPath(); ctx.roundRect(x, y, w, h, 6); ctx.fill();
  ctx.strokeStyle = '#a4c2bb20'; ctx.lineWidth = 1; ctx.stroke();
}
export function star(ctx, x, y, size, color) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? size * .44 : size; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
  ctx.closePath(); ctx.fillStyle = color; ctx.fill();
}
export function renderMinimap(ctx, state, mapImage) {
  const { h } = state.view, x = 30, y = h - 249, mw = 234, mh = 154, p = state.player;
  panel(ctx, x - 1, y - 1, mw + 2, mh + 38, .96);
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, mw, mh); ctx.clip();
  ctx.fillStyle = '#1a3b43'; ctx.fillRect(x, y, mw, mh);
  const scale = .22, spanX = mw / scale, spanY = mh / scale;
  ctx.drawImage(mapImage, 0, 0, mapImage.width, mapImage.height, x + mw / 2 - p.x * scale, y + mh / 2 - p.y * scale, 4400 * scale, 3600 * scale);
  const mark = (v, color, radius) => {
    const mx = x + mw / 2 + (v.x - p.x) * scale, my = y + mh / 2 + (v.y - p.y) * scale;
    if (Math.abs(v.x - p.x) > spanX / 2 || Math.abs(v.y - p.y) > spanY / 2) return;
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(mx, my, radius, 0, Math.PI * 2); ctx.fill();
  };
  for (const car of state.cars) if (car.type === 'police' && car.hp > 0) mark(car, '#ff7687', 3.2);
  const target = missionTarget(state);
  if (target) {
    const dx = (target.x - p.x) * scale, dy = (target.y - p.y) * scale;
    const k = Math.min(1, (mw / 2 - 12) / Math.max(1, Math.abs(dx)), (mh / 2 - 12) / Math.max(1, Math.abs(dy)));
    ctx.save(); ctx.translate(x + mw / 2 + dx * k, y + mh / 2 + dy * k); ctx.rotate(Math.PI / 4); ctx.fillStyle = COLORS.gold; ctx.fillRect(-4, -4, 8, 8); ctx.restore();
  }
  ctx.save(); ctx.translate(x + mw / 2, y + mh / 2); ctx.rotate(p.angle + Math.PI / 2);
  ctx.shadowColor = '#7ce8d3'; ctx.shadowBlur = 9; ctx.fillStyle = '#c0ffec'; ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(5, 6); ctx.lineTo(0, 3); ctx.lineTo(-5, 6); ctx.fill(); ctx.restore();
  ctx.restore();
  text(ctx, 'N', x + 13, y + 19, 11, '#d7e6db', '800');
  text(ctx, '◆', x + 12, y + mh + 23, 12, COLORS.mint);
  text(ctx, districtAt(p.x, p.y).name, x + 32, y + mh + 23, 10, '#d4dfd7', '700');
  text(ctx, 'GPS', x + mw - 12, y + mh + 23, 9, '#789a9b', '600', 'right');
}
export function renderHUD(ctx, state, mapImage) {
  const { w, h } = state.view, p = state.player, m = currentMission(state);
  const top = ctx.createLinearGradient(0, 0, 0, 160); top.addColorStop(0, '#0b1828dc'); top.addColorStop(1, '#0b182800'); ctx.fillStyle = top; ctx.fillRect(0, 0, w, 160);
  ctx.fillStyle = COLORS.mint; ctx.fillRect(30, 28, 4, 25);
  text(ctx, 'VICE HORIZON', 45, 47, 20, '#f0e9d9', '900');
  text(ctx, 'FREE ROAM', 46, 66, 9, COLORS.mint, '700');
  text(ctx, ' /  THE CITY IS YOURS', 108, 66, 9, '#a1b6b7', '500');
  text(ctx, `$${Math.floor(p.money).toLocaleString('en-US')}`, w - 30, 48, 28, COLORS.mint, '700', 'right', 'monospace');
  for (let i = 0; i < 5; i++) star(ctx, w - 142 + i * 25, 73, 8, i < state.wanted ? COLORS.gold : '#87979550');
  if (state.wanted) text(ctx, state.hidden > 1 ? 'SEARCHING  ·  STAY HIDDEN' : 'PCPD  /  IN PURSUIT', w - 30, 99, 9, '#ffb2a8', '700', 'right');
  else text(ctx, 'OFF THE RADAR', w - 30, 98, 9, '#a3b6ad', '600', 'right');
  // Compact objective card with a contact monogram and a clear destination.
  panel(ctx, 30, 91, 352, state.mission.dialog > 0 ? 137 : 89, .9);
  ctx.fillStyle = COLORS.gold; ctx.fillRect(30, 105, 3, 32);
  text(ctx, m ? `${String(state.mission.index + 1).padStart(2, '0')}  /  ${m.contact.toUpperCase()}` : 'VICE LEGEND', 47, 113, 9, COLORS.gold, '700');
  text(ctx, m?.title || 'THE CITY IS YOURS', 47, 136, 16, '#f4ecde', '800');
  const line = objective(state);
  text(ctx, line.length > 49 ? line.slice(0, 47) + '…' : line, 47, 159, 11, '#b7c8c3', '500');
  if (state.mission.dialog > 0 && m) {
    const words = m.text.split(' '); let row = '', yy = 184;
    for (const word of words) {
      if ((row + word).length > 49) { text(ctx, row, 47, yy, 11, '#dbd7cc'); yy += 16; row = ''; }
      row += word + ' ';
    }
    text(ctx, row, 47, yy, 11, '#dbd7cc');
  }
  if (m?.seconds && state.mission.active) {
    panel(ctx, w / 2 - 59, 28, 118, 41);
    const secs = Math.max(0, Math.ceil(state.mission.timer));
    text(ctx, `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`, w / 2, 56, 24, secs < 15 ? '#ff8c91' : COLORS.gold, '700', 'center', 'monospace');
  }
  renderMinimap(ctx, state, mapImage);
  // Health and armor tracks under the map are readable without numerical clutter.
  const by = h - 45;
  for (const [value, color, x] of [[p.hp, COLORS.mint, 30], [p.armor, '#8ab8e5', 152]]) {
    ctx.fillStyle = '#162a31'; ctx.fillRect(x, by, 112, 5); ctx.fillStyle = color; ctx.fillRect(x, by, 112 * value / 100, 5);
  }
  text(ctx, '+', 30, h - 20, 14, COLORS.mint, '700'); text(ctx, `${Math.ceil(p.hp)}`, 45, h - 21, 10, '#c7d7ce', '600');
  text(ctx, '◈', 152, h - 21, 12, '#8ab8e5'); text(ctx, `${Math.ceil(p.armor)}`, 168, h - 21, 10, '#c7d7ce', '600');
  const wx = w - 234, wy = h - 107;
  panel(ctx, wx, wy, 204, 77, .91);
  text(ctx, WEAPONS[p.weapon].name, wx + 18, wy + 26, 11, '#f1eadc', '800');
  text(ctx, p.weapon ? String(p.ammo[p.weapon]).padStart(3, '0') : '∞', wx + 18, wy + 57, 24, COLORS.gold, '700', 'left', 'monospace');
  text(ctx, 'Q / E  SWITCH', wx + 185, wy + 56, 9, '#859e9d', '600', 'right');
  if (p.vehicle) {
    text(ctx, `${Math.round(Math.abs(p.vehicle.speed) * .45)}`, w - 30, h - 157, 49, '#f2e8d6', '800', 'right', 'monospace');
    text(ctx, 'KM/H', w - 30, h - 137, 9, COLORS.mint, '700', 'right');
    text(ctx, TYPES[p.vehicle.type].name.toUpperCase(), w - 30, h - 120, 10, '#c1cec5', '600', 'right');
    ctx.fillStyle = '#f3c780'; ctx.fillRect(w - 141, h - 113, 111 * p.vehicle.hp / p.vehicle.maxHp, 2);
  }
  const target = missionTarget(state);
  if (target && state.mission.active) {
    text(ctx, '◆', 290, h - 65, 15, COLORS.gold, '700');
    text(ctx, `${Math.round(distance(p, target))} m`, 313, h - 65, 12, '#e7ddca', '700');
    text(ctx, 'TO DESTINATION', 313, h - 47, 8, '#92a7a3', '700');
  }
  if (!p.vehicle && state.cars.some(c => c.hp > 0 && distance(c, p) < 72)) {
    panel(ctx, w / 2 - 109, h - 109, 218, 35); text(ctx, 'F   ENTER / STEAL VEHICLE', w / 2, h - 87, 11, COLORS.gold, '700', 'center');
  }
  if (state.notice.time > 0) {
    const width = Math.min(w - 580, Math.max(330, state.notice.text.length * 6.1 + 40));
    panel(ctx, (w - width) / 2, h - 51, width, 29, .92);
    text(ctx, state.notice.text, w / 2, h - 32, 10, COLORS.gold, '600', 'center');
  }
  text(ctx, 'H  HELP   ·   P  PAUSE   ·   M  ' + (state.audio.muted ? 'UNMUTE' : 'MUTE'), w / 2, h - 10, 9, '#c9d5ccaa', '600', 'center');
  if (state.bust > 0) { panel(ctx, w / 2 - 100, 95, 200, 31); ctx.fillStyle = '#e8828b'; ctx.fillRect(w / 2 - 94, 118, 188 * Math.min(1, state.bust), 3); text(ctx, 'ARREST IN PROGRESS', w / 2, 112, 10, '#ffb1b2', '700', 'center'); }
}

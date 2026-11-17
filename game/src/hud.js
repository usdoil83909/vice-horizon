import { ARMS, CITY, INK, FLEET, limit, gap } from './config.js';
import { borough } from './world.js';
import { contract, destination, objectiveLine, CONTRACTS } from './missions.js';

export function lettering(c, value, x, y, size = 12, color = INK.white, weight = 500, align = 'left') {
  c.font = `${weight} ${size}px "Trebuchet MS", Arial, sans-serif`; c.textAlign = align; c.fillStyle = color; c.fillText(String(value), x, y);
}
export function box(c, x, y, w, h, opacity = .9) {
  c.fillStyle = `rgba(11,29,40,${opacity})`; c.beginPath(); c.roundRect(x, y, w, h, 5); c.fill();
  c.strokeStyle = '#a9c7c022'; c.lineWidth = 1; c.stroke();
}
function meter(c, x, y, w, amount, color) {
  c.fillStyle = '#d4ebdf18'; c.fillRect(x, y, w, 4); c.fillStyle = color; c.fillRect(x, y, w * limit(amount / 100, 0, 1), 4);
}
export function miniAtlas(c, s, atlas) {
  const { w, h } = s.viewport, zoom = s.hero.car && Math.abs(s.hero.car.velocity) > 180 ? .09 : .13, size = 154, x = 24, y = h - 194, scale = zoom, p = s.hero;
  box(c, x - 8, y - 8, size + 16, size + 36, .93);
  c.save(); c.beginPath(); c.roundRect(x, y, size, size, 3); c.clip();
  c.fillStyle = '#1b5964'; c.fillRect(x, y, size, size);
  c.drawImage(atlas, p.x * .16 - size / 2 / scale * .16, p.y * .16 - size / 2 / scale * .16, size / scale * .16, size / scale * .16, x, y, size, size);
  const marker = (body, color, radius) => { const px = x + size / 2 + (body.x - p.x) * scale, py = y + size / 2 + (body.y - p.y) * scale; c.fillStyle = color; c.beginPath(); c.arc(px, py, radius * ui, 0, Math.PI * 2); c.fill(); };
  for (const car of s.cars) if (car.pursuit && car.health > 0) marker(car, INK.rose, 3);
  for (const e of s.hostiles) if (e.health > 0) marker(e, '#fa987e', 3);
  const goal = destination(s); if (goal) marker(goal, INK.gold, 4.5);
  for (const landmark of s.city.landmarks) marker(landmark, landmark.kind === 'hospital' ? '#83ecbf' : '#b8b9e1', 2.4);
  c.save(); c.translate(x + size / 2, y + size / 2); c.rotate(p.angle + Math.sin(s.clock * 2.1) * .015); c.fillStyle = '#f5f3df'; c.beginPath(); c.moveTo(8, 0); c.lineTo(-5, -5); c.lineTo(-2, 0); c.lineTo(-5, 5); c.closePath(); c.fill(); c.restore();
  c.restore();
  lettering(c, 'N', x + size - 9, y + 15, 9, INK.mint, 800, 'center');
  lettering(c, borough(p.x, p.y).name, x + 4, y + size + 18, 9, '#c4d5ca', 700);
}
export function dashboard(c, s, atlas) {
  const { w: screenW, h: screenH } = s.viewport, p = s.hero, m = contract(s), ui = limit(Math.min(screenW / 780, screenH / 500), .72, 1.3), w = screenW / ui, h = screenH / ui;
  c.save(); c.scale(ui, ui);
  lettering(c, 'VICE / HORIZON', 30, 37, 15, INK.white, 900);
  lettering(c, 'PEARL CITY  /  FLORIDA', 31, 56, 9, '#a5c3bd', 700);
  const minute = (18 * 60 + 42 + Math.floor(s.clock / 2)) % 1440;
  lettering(c, `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}   /   ${s.sound.muted ? 'RADIO OFF' : 'HORIZON FM'}`, 31, 75, 9, INK.mint, 600);
  box(c, w - 276, 22, 246, 144, .9);
  lettering(c, '$' + Math.round(p.displayCash).toLocaleString('en-US'), w - 46, 56, 28, INK.mint, 800, 'right');
  for (let i = 0; i < 5; i++) lettering(c, '★', w - 171 + i * 25, 83 + (i < s.stars ? Math.sin(s.clock * 5 + i) * 2 : 0), 21, i < s.stars ? (s.unseen > 2 && Math.floor(s.clock * 3) % 2 ? '#c7bca0' : INK.gold) : '#6b7c824f', 700);
  lettering(c, 'HEALTH', w - 260, 106, 8, '#c9d4c6', 700); meter(c, w - 205, 101, 120, p.health, '#a7e3b0');
  lettering(c, Math.ceil(p.health), w - 46, 107, 9, '#cbe4c7', 600, 'right');
  lettering(c, 'ARMOR', w - 260, 125, 8, '#b5cbcc', 700); meter(c, w - 205, 120, 120, p.armor, '#84bcdb');
  lettering(c, Math.ceil(p.armor), w - 46, 126, 9, '#b7d2de', 600, 'right');
  lettering(c, ARMS[p.gun].label, w - 260, 149, 9, '#d3dacb', 700);
  lettering(c, p.gun ? p.ammo[p.gun] + ' RDS' : '∞', w - 46, 150, 10, INK.white, 700, 'right');
  miniAtlas(c, s, atlas);
  const bannerX = Math.max(245, w * .26), bannerW = Math.min(620, w - bannerX - 30);
  box(c, bannerX, h - 109, bannerW, 77, .94); c.fillStyle = INK.gold; c.fillRect(bannerX, h - 109, 3, 77);
  lettering(c, m ? `${s.job.active ? 'ACTIVE CONTRACT' : 'NEXT CONTRACT'}  /  ${String(s.job.index + 1).padStart(2, '0')} OF ${CONTRACTS.length}` : 'THE STORY IS YOURS', bannerX + 18, h - 89, 8, INK.gold, 800);
  lettering(c, m?.name || 'BEYOND THE HORIZON', bannerX + 18, h - 68, 17, INK.white, 800);
  lettering(c, objectiveLine(s), bannerX + 18, h - 48, 10, '#b6cec6', 500);
  if (s.job.active && destination(s)) lettering(c, `${Math.round(gap(destination(s), p))} m`, bannerX + bannerW - 18, h - 48, 9, INK.gold, 700, 'right');
  if (s.job.active && m?.seconds) lettering(c, Math.ceil(s.job.remaining) + 's', bannerX + bannerW - 18, h - 69, 19, s.job.remaining < 20 ? INK.rose : INK.gold, 800, 'right');
  const target = destination(s);
  if (target && gap(target, p) > 300) {
    const angle = Math.atan2(target.y - p.y, target.x - p.x);
    const px = w / 2 + Math.cos(angle) * Math.min(w * .35, 370), py = h / 2 + Math.sin(angle) * Math.min(h * .28, 190);
    c.save(); c.translate(px, py); c.rotate(angle); c.fillStyle = INK.gold; c.beginPath(); c.moveTo(10, 0); c.lineTo(-7, -5); c.lineTo(-4, 0); c.lineTo(-7, 5); c.fill(); c.restore();
    lettering(c, Math.round(gap(target, p)) + ' m', px, py + 22, 10, INK.gold, 700, 'center');
  }
  if (p.car) {
    box(c, w - 226, h - 107, 196, 75);
    lettering(c, Math.round(Math.abs(p.car.velocity) * .48), w - 159, h - 58, 34, INK.white, 700, 'right');
    lettering(c, 'KM/H', w - 149, h - 58, 9, '#9dbcb5', 700);
    lettering(c, FLEET[p.car.kind].label.toUpperCase(), w - 211, h - 88, 8, INK.mint, 700);
    meter(c, w - 211, h - 45, 164, p.car.health / p.car.maxHealth * 100, '#c4d8ad');
  } else lettering(c, 'F  TAKE A CAR   /   SHIFT  SPRINT', w - 30, h - 47, 9, '#b5c9bf', 600, 'right');
  lettering(c, 'WASD MOVE / DRIVE     F ENTER / EXIT     SPACE ATTACK     ENTER JOB     H HELP     P PAUSE', w / 2, h - 13, 8, '#acc6bf', 600, 'center');
  if (s.toast.ttl > 0) {
    const toastW = Math.min(w - 80, Math.max(400, s.toast.message.length * 6.4 + 36));
    box(c, w / 2 - toastW / 2, 27, toastW, 37, .95); lettering(c, s.toast.message, w / 2, 51, 11, INK.gold, 700, 'center');
  }
  if (s.job.dialogue > 0 && m) {
    const left = 260, top = h - 193;
    box(c, left, top, Math.min(680, w - 300), 63, .94);
    lettering(c, m.contact.toUpperCase(), left + 15, top + 21, 10, INK.mint, 800);
    lettering(c, m.line, left + 15, top + 43, 11, '#dedfc9');
  }
  if (s.stars) lettering(c, s.seen ? 'POLICE HAVE VISUAL' : 'SEARCHING · STAY OUT OF SIGHT', w - 30, 187, 9, s.seen ? INK.rose : INK.gold, 800, 'right');
  if (s.bustMeter > 0) { box(c, w / 2 - 130, 100, 260, 32); lettering(c, 'ARREST IN PROGRESS', w / 2, 120, 11, INK.rose, 800, 'center'); meter(c, w / 2 - 120, 129, 240, s.bustMeter / 3.5 * 100, INK.rose); }
  c.restore();
}
export function overlay(c, s, mode) {
  const { w, h } = s.viewport;
  c.fillStyle = '#0a1e2de8'; c.fillRect(0, 0, w, h);
  box(c, w / 2 - 320, h / 2 - 236, 640, 472, .85);
  if (mode === 'help') {
    lettering(c, 'KNOW THE STREETS', w / 2, h / 2 - 185, 29, INK.white, 800, 'center');
    const rows = [['WASD / ARROWS', 'Walk, accelerate, brake, steer'], ['SHIFT', 'Sprint on foot / handbrake drift'], ['F', 'Take the nearest car / exit safely'], ['MOUSE / SPACE', 'Aim and shoot / punch'], ['1 · 2 · 3 / Q · E', 'Fists, pistol, SMG / cycle weapon'], ['ENTER', 'Accept or retry the next contract'], ['F5 / F9 / L', 'Save / load / continue'], ['P / ESC · M · H', 'Pause · toggle audio · close help']];
    rows.forEach(([key, action], i) => { lettering(c, key, w / 2 - 277, h / 2 - 132 + i * 33, 11, INK.mint, 800); lettering(c, action, w / 2 - 90, h / 2 - 132 + i * 33, 12, '#ccdbcf'); });
    lettering(c, 'Gold: objectives. Pink: police. Green: hospital resupply.', w / 2, h / 2 + 170, 11, INK.gold, 600, 'center');
    lettering(c, 'Lose stars by breaking line of sight. Buildings provide cover.', w / 2, h / 2 + 198, 11, '#a7c2b8', 500, 'center');
  } else if (mode === 'pause') {
    lettering(c, 'CITY ON HOLD', w / 2, h / 2 - 100, 42, INK.white, 900, 'center');
    lettering(c, 'P / ESC   RESUME', w / 2, h / 2 - 30, 16, INK.mint, 700, 'center');
    lettering(c, 'F5 SAVE    /    F9 LOAD    /    H CONTROLS', w / 2, h / 2 + 20, 12, '#cbdacb', 600, 'center');
    lettering(c, 'R   START A NEW STORY', w / 2, h / 2 + 80, 12, INK.gold, 700, 'center');
    lettering(c, s.job.completed.length + ' / ' + CONTRACTS.length + ' CONTRACTS COMPLETE', w / 2, h / 2 + 145, 10, '#9ab4af', 700, 'center');
  } else {
    lettering(c, s.endReason, w / 2, h / 2 + 5, 78, INK.rose, 900, 'center');
    lettering(c, 'The city always collects.', w / 2, h / 2 + 50, 17, '#d9c7b5', 500, 'center');
    if (s.mode === 'over') lettering(c, 'ENTER  BACK TO THE STREETS    /    F9  LOAD SAVE', w / 2, h / 2 + 113, 12, INK.mint, 700, 'center');
  }
}

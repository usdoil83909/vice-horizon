import { palette, clamp } from './config.js';

export const hudScale = () => Math.min(1.5, globalThis.devicePixelRatio || 1);
export const createHud = () => ({ toast: '', toastTime: 0, banner: '', bannerTime: 0 });
export function toast(hud, text) { Object.assign(hud, { toast: text, toastTime: 180 }); }
export function banner(hud, text) { Object.assign(hud, { banner: text, bannerTime: 250 }); }
export function updateHud(hud, dt) {
  hud.toastTime = Math.max(0, hud.toastTime - dt);
  hud.bannerTime = Math.max(0, hud.bannerTime - dt);
}

export function drawHud(ctx, state, hud, mode) {
  const width = ctx.canvas.width / (devicePixelRatio || 1);
  const height = ctx.canvas.height / (devicePixelRatio || 1);
  ctx.save();
  ctx.font = 'bold 14px Arial';
  ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(5,9,23,.78)';
  ctx.fillRect(18, 18, 240, 92);
  ctx.strokeStyle = palette.neon;
  ctx.strokeRect(18, 18, 240, 92);
  ctx.fillStyle = palette.white;
  ctx.fillText(`CASH  $${String(state.player.cash).padStart(5, '0')}`, 32, 32);
  ctx.fillStyle = palette.danger;
  ctx.fillText('WANTED  ' + '★'.repeat(state.police.wanted) + '☆'.repeat(5 - state.police.wanted), 32, 55);
  meter(ctx, 32, 80, 190, state.player.health / 100, palette.danger, 'HP');
  meter(ctx, 32, 96, 190, state.player.armor / 100, palette.neon, 'ARM');
  ctx.fillStyle = palette.yellow;
  ctx.fillText(state.weapon.toUpperCase(), width - 160, 24);
  if (state.mission.active) {
    const mission = state.mission.active;
    ctx.fillStyle = 'rgba(9,15,31,.9)';
    ctx.fillRect(width / 2 - 230, 18, 460, 58);
    ctx.strokeStyle = palette.pink;
    ctx.strokeRect(width / 2 - 230, 18, 460, 58);
    ctx.textAlign = 'center';
    ctx.fillStyle = palette.pink;
    ctx.fillText(mission.name, width / 2, 28);
    ctx.font = '12px Arial';
    ctx.fillStyle = palette.white;
    ctx.fillText(`${mission.contact}: ${mission.dialogue}`, width / 2, 49);
    ctx.textAlign = 'left';
  }
  minimap(ctx, state, width - 170, height - 170, 140);
  if (hud.toastTime) {
    ctx.fillStyle = palette.yellow;
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(hud.toast, width / 2, height - 60);
    ctx.textAlign = 'left';
  }
  const panels = {
    title: ['VICE HORIZON', 'A neon city waits beyond the horizon', 'PRESS ENTER TO START'],
    pause: ['PAUSED', 'The tide is holding its breath.', 'PRESS P TO RESUME'],
    help: ['FIELD GUIDE', 'WASD move  |  F enter/exit  |  SPACE fire  |  SHIFT sprint', 'P pause  |  M mute  |  L load'],
    busted: ['BUSTED', 'The city caught your signal.', 'PRESS ENTER TO RESTART'],
    wasted: ['WASTED', 'The horizon goes dark.', 'PRESS ENTER TO RESTART'],
  };
  if (panels[mode]) panel(ctx, width, height, ...panels[mode]);
  ctx.restore();
}

function meter(ctx, x, y, width, fraction, color, label) {
  ctx.fillStyle = '#20263a';
  ctx.fillRect(x, y, width, 8);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width * clamp(fraction, 0, 1), 8);
  ctx.fillStyle = palette.white;
  ctx.font = '9px Arial';
  ctx.fillText(label, x + width + 8, y - 1);
}
function minimap(ctx, state, x, y, size) {
  ctx.fillStyle = 'rgba(5,9,23,.86)';
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = palette.neon;
  ctx.strokeRect(x, y, size, size);
  ctx.strokeStyle = '#536078';
  for (let line = 1; line < 6; line++) {
    ctx.beginPath(); ctx.moveTo(x + line * 23, y); ctx.lineTo(x + line * 23, y + size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y + line * 23); ctx.lineTo(x + size, y + line * 23); ctx.stroke();
  }
  point(ctx, x + state.player.x / 3200 * size, y + state.player.y / 2400 * size, palette.white, 4);
  for (const car of state.entities.cars.slice(0, 12)) point(ctx, x + car.x / 3200 * size, y + car.y / 2400 * size, car.police ? palette.danger : palette.yellow, 2);
  if (state.mission.active) point(ctx, x + state.mission.marker.x / 3200 * size, y + state.mission.marker.y / 2400 * size, palette.pink, 4);
}
function point(ctx, x, y, color, radius) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
}
function panel(ctx, width, height, title, subtitle, action) {
  ctx.fillStyle = 'rgba(5,8,21,.82)';
  ctx.fillRect(0, 0, width, height);
  ctx.textAlign = 'center';
  ctx.fillStyle = palette.neon;
  ctx.font = 'bold 56px Arial';
  ctx.fillText(title, width / 2, height / 2 - 95);
  ctx.fillStyle = palette.white;
  ctx.font = '18px Arial';
  ctx.fillText(subtitle, width / 2, height / 2 - 30);
  ctx.fillStyle = palette.pink;
  ctx.font = 'bold 15px Arial';
  ctx.fillText(action, width / 2, height / 2 + 40);
  ctx.textAlign = 'left';
}

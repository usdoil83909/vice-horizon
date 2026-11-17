import { generateCity } from './world.js';
import { createInput } from './input.js';
import { createPlayer, spawnEntities, updatePlayer } from './entities.js';
import { updateTraffic } from './traffic.js';
import { createPolice, updatePolice } from './police.js';
import { updateCombat, fire } from './combat.js';
import { createMissions, acceptMission, updateMissions } from './missions.js';
import { createHud } from './hud.js';
import { render } from './render.js';
import { createAudio } from './audio.js';

const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const input = createInput();
const audio = createAudio();
const params = new URLSearchParams(location.search);
const shot = params.get('shot') || 'start';
const seed = Number(params.get('seed') || 1);
const hud = createHud();
const state = { shot, world: generateCity(seed), player: createPlayer(), entities: spawnEntities(seed), police: createPolice(), missions: createMissions(), viewport: { w: innerWidth, h: innerHeight }, paused: false, frame: 0 };
state.world.entities = state.entities;
if (shot === 'chase') {
  state.player.x = 2800; state.player.y = 2200;
  state.player.inCar = state.entities.cars[0];
  state.entities.cars[0].type = 'sports';
  state.police.wanted = 4;
}
if (shot === 'mission') { acceptMission(state.missions); state.player.x = 1800; state.player.y = 1500; }
let title = shot === 'start';
let ticks = 0;
let last = 0;

function resize() {
  const dpr = Math.min(2, devicePixelRatio || 1);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  state.viewport = { w: innerWidth, h: innerHeight };
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener('resize', resize);
resize();

function frame(now) {
  const dt = Math.min(0.033, (now - last) / 1000 || 0.016);
  last = now;
  if (!title && !state.paused) {
    if (shot === 'chase') input.keys.add('w');
    updatePlayer(state.player, input, dt, state.world);
    updateTraffic(state, dt);
    updatePolice(state.police, state, dt);
    updateCombat(state, dt);
    updateMissions(state.missions, state, dt);
    if (input.down(' ') || input.mouse.down) fire(state);
  }
  render(ctx, state);
  if (!title) hud.draw(ctx, state, null, state.viewport.w, state.viewport.h);
  if (title) {
    ctx.fillStyle = '#061017cc'; ctx.fillRect(0, 0, state.viewport.w, state.viewport.h);
    ctx.fillStyle = '#ff4f9a'; ctx.font = '900 76px Arial'; ctx.fillText('VICE', state.viewport.w / 2 - 170, state.viewport.h / 2 - 38);
    ctx.fillStyle = '#48e4df'; ctx.fillText('HORIZON', state.viewport.w / 2 - 170, state.viewport.h / 2 + 40);
    ctx.fillStyle = '#e8fbf6'; ctx.font = '16px Arial'; ctx.fillText('PEARL CITY / FLORIDA  •  PRESS ENTER TO RIDE', state.viewport.w / 2 - 170, state.viewport.h / 2 + 90);
    if (input.down('enter')) title = false;
  }
  ticks++;
  state.frame++;
  if (ticks === 2) window.__shotReady = true;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

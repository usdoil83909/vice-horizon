import { STEP, CITY } from './config.js';
import { querySeed } from './random.js';
import { Input } from './input.js';
import { createWorld, solid } from './world.js';
import { createPlayer, populate, updatePlayer, updatePeds, createPed, createCar } from './entities.js';
import { updateTraffic } from './traffic.js';
import { crime, updatePolice } from './police.js';
import { updateCombat } from './combat.js';
import { updateMissions } from './missions.js';
import { saveGame, loadGame } from './save.js';
import { Audio } from './audio.js';
import { Renderer } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game'), input = new Input(canvas), audio = new Audio();
export function createState(seed, sound = audio) {
  const state = {
    world: createWorld(seed), player: createPlayer(), cars: [], peds: [], enemies: [], bullets: [], particles: [], skids: [],
    mission: { index: 0, active: false, phase: 0, checkpoint: 0, timer: 0, dialog: 0 },
    screen: 'title', help: false, time: 0, ticks: 0, wanted: 0, heat: 0, hidden: 0, lastCrime: -20, policeTimer: 0, bust: 0,
    shake: 0, flash: 0, punch: 0, endTimer: 0, endReason: '', view: { w: innerWidth, h: innerHeight },
    notice: { text: 'Welcome to Vice Horizon. Press ENTER to take Rosa’s first job.', time: 8 }, audio: sound,
  };
  state.crime = (amount, label) => crime(state, amount, label);
  state.save = () => saveGame(state);
  function particles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
      const a = state.world.rng() * Math.PI * 2, speed = 25 + state.world.rng() * 100;
      state.particles.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: .2 + state.world.rng() * .6, color, size: 2 + state.world.rng() * 3 });
    }
  }
  state.spark = (x, y, n) => particles(x, y, n, '#ffd28c');
  state.blood = (x, y, n) => particles(x, y, n, '#b65a6c');
  populate(state); return state;
}
export function step(state, dt, controls) {
  state.time += dt; state.ticks++;
  updatePlayer(state, dt, controls); updateTraffic(state, dt); updatePeds(state, dt);
  updateCombat(state, dt, controls); updatePolice(state, dt);
  if (state.screen === 'playing') updateMissions(state, dt, controls);
  state.shake *= .85; state.flash = Math.max(0, state.flash - dt); state.punch = Math.max(0, state.punch - dt);
  state.notice.time = Math.max(0, state.notice.time - dt);
  for (const p of state.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .94; p.vy *= .94; p.life -= dt; }
  state.particles = state.particles.filter(p => p.life > 0).slice(-220);
  for (const skid of state.skids) skid.life -= dt;
  state.skids = state.skids.filter(s => s.life > 0).slice(-180);
  // Refresh the sidewalks near the player without growing the population indefinitely.
  if (state.ticks % 180 === 0 && state.peds.length < 100) {
    const gx = Math.floor(state.player.x / 440), gy = Math.floor(state.player.y / 440);
    const x = Math.max(120, Math.min(3700, gx * 440 + 120 + state.world.rng() * 280));
    const y = Math.max(110, Math.min(3500, gy * 440 + 110));
    if (!solid(state.world, x, y, 9)) state.peds.push(createPed(state.world, x, y));
  }
  state.cars = state.cars.filter(c => c.hp > 0 || c === state.mission.car || Math.hypot(c.x - state.player.x, c.y - state.player.y) < 900);
  if (state.ticks % 180 === 0 && state.cars.length < 90) {
    const p = state.player;
    const nearby = state.cars.filter(c => c.hp > 0 && Math.hypot(c.x - p.x, c.y - p.y) < 800).length;
    if (nearby < 9) {
      const x = Math.max(72, Math.min(CITY.coast - 72, Math.floor(p.x / CITY.block) * CITY.block + 72));
      const y = Math.max(50, Math.min(CITY.height - 50, p.y + (state.world.rng() < .5 ? -650 : 650)));
      if (!solid(state.world, x, y, 22)) {
        const car = createCar(state.world, ['sedan', 'taxi', 'sports', 'truck'][state.ticks / 180 % 4], x, y, Math.PI / 2);
        car.speed = 75; state.cars.push(car);
      }
    }
  }
}

let state = createState(querySeed()), renderer = new Renderer(canvas, state.world);
const shot = new URLSearchParams(location.search).get('shot');
if (shot) { state.shot = shot; stageShot(shot, state, step); }
window.__vice = { get state() { return state; }, step: (n = 1) => { for (let i = 0; i < n; i++) step(state, STEP, input); renderer.render(state); }, save: () => saveGame(state), load: () => loadGame(state) };
function restart() { state = createState(querySeed()); state.screen = 'playing'; renderer = new Renderer(canvas, state.world); }
function globalInput() {
  if (input.pressed.size || input.pointer.firing) audio.unlock();
  if (input.tap('KeyM')) audio.toggle();
  if (input.tap('KeyH')) state.help = !state.help;
  if (input.tap('F5')) state.notice = { text: saveGame(state) ? 'GAME SAVED  /  Your place in the city is safe.' : 'Save unavailable in this browser.', time: 4 };
  if (input.tap('F9') || input.tap('KeyL')) {
    if (loadGame(state)) { state.screen = 'playing'; state.notice = { text: 'SAVE LOADED  /  Welcome back.', time: 4 }; }
    else state.notice = { text: 'No saved game found.', time: 3 };
  }
  if (input.tap('KeyP') || input.tap('Escape')) {
    if (state.help) state.help = false;
    else if (state.screen === 'playing') state.screen = 'paused';
    else if (state.screen === 'paused') state.screen = 'playing';
  }
  if (state.screen === 'title' && input.tap('Enter')) { state.screen = 'playing'; input.pressed.delete('Enter'); }
  if (state.screen === 'paused' && input.tap('KeyR')) restart();
  if (state.screen === 'gameover' && input.tap('Enter')) {
    state.player.hp = 100; state.player.armor = 25; state.player.money = Math.max(0, state.player.money - 250);
    state.player.x = 945; state.player.y = 1040; state.player.vehicle = null; state.wanted = 0; state.heat = 0; state.bust = 0;
    state.mission.active = false; state.enemies = []; state.screen = 'playing'; state.notice = { text: 'Hospital & legal fees  /  −$250. Press Enter to retry your job.', time: 6 };
    state.player.invulnerable = 4; input.pressed.delete('Enter');
  }
  // Consume global shortcuts once, while gameplay taps survive until a fixed step.
  for (const key of ['KeyM', 'KeyH', 'F5', 'F9', 'KeyL', 'KeyP', 'Escape', 'KeyR']) input.pressed.delete(key);
}
let previous = 0, accumulator = 0, paints = 0;
function frame(stamp) {
  const elapsed = previous ? Math.min(.1, (stamp - previous) / 1000) : STEP; previous = stamp;
  if (!shot) {
    globalInput();
    if (state.screen === 'playing' && !state.help) {
      accumulator += elapsed;
      while (accumulator >= STEP) { step(state, STEP, input); accumulator -= STEP; input.clear(); }
    } else {
      accumulator = 0;
      if (['busted', 'wasted'].includes(state.screen)) { state.endTimer += elapsed; if (state.endTimer > 2.4) { state.endReason = state.screen; state.screen = 'gameover'; } }
    }
    if (state.screen !== 'playing' || state.help) input.clear();
    audio.update(state);
  }
  renderer.render(state, elapsed);
  document.getElementById('status').textContent = `${state.screen} | ${state.wanted} stars | ${Math.ceil(state.player.hp)} health | job ${state.mission.index + 1}`;
  if (shot && ++paints === 2) { window.__shotReady = true; document.documentElement.dataset.shotReady = 'true'; }
  // The composed scene stays frozen; headless capture needs no further work.
  if (!shot || paints < 2) requestAnimationFrame(frame);
}
addEventListener('resize', () => { if (shot) renderer.render(state); });
requestAnimationFrame(frame);

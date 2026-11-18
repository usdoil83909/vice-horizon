import { WORLD_SEED } from './config.js';
import { seeded } from './random.js';
import { generateCity } from './world.js';
import { createPlayer, createEntities, updatePlayer, updatePeds, tryCarjack, exitCar, updateCar, collectPickups } from './entities.js';
import { createInput } from './input.js';
import { updateTraffic } from './traffic.js';
import { createPolice, updatePolice, addHeat } from './police.js';
import { createMissionState, startMission, updateMission } from './missions.js';
import { fire, updateCombat } from './combat.js';
import { createRenderer } from './render.js';
import { createHud, toast, banner, updateHud, drawHud } from './hud.js';
import { createAudio } from './audio.js';
import { loadGame, applySave, saveGame } from './save.js';
import { readShot, stageShot, markReady } from './shots.js';

export function boot(canvas) {
  const shot = readShot();
  const seed = shot.seed || WORLD_SEED;
  const rng = seeded(seed, 'runtime');
  const city = generateCity(seed);
  const input = createInput(canvas), audio = createAudio(), renderer = createRenderer(canvas);
  const state = {
    mode: 'play', shot: shot.mode, city, player: createPlayer(), entities: createEntities(city, rng),
    police: createPolice(), mission: createMissionState(), weapon: 'pistol', cooldown: 0,
    cash: 1250, hud: createHud(), rng,
  };
  applySave(state, loadGame());
  stageShot(state, shot);
  if (shot.mode === 'start') state.mode = 'title';
  if (shot.mode === 'mission' && !state.mission.active) startMission(state.mission, 4);
  let last = 0, elapsed = 0;
  const interval = 1000 / 60;
  function frame(now) {
    if (!last) last = now;
    elapsed += Math.min(100, Math.max(0, now - last));
    last = now;
    while (elapsed >= interval) {
      tick(state, input, audio, interval / 16.6667);
      elapsed -= interval;
    }
    renderer.draw(state, state.mode);
    drawHud(renderer.ctx, state, state.hud, state.mode);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  markReady();
  return state;
}

function tick(state, input, audio, dt) {
  if (input.take('mute')) audio.toggle();
  if (input.take('help')) state.mode = state.mode === 'help' ? 'play' : 'help';
  if (input.take('pause')) state.mode = state.mode === 'pause' ? 'play' : 'pause';
  if (state.mode === 'title') {
    if (input.take('accept')) state.mode = 'play';
    return;
  }
  if (state.mode === 'pause' || state.mode === 'help') return;
  if (state.mode === 'busted' || state.mode === 'wasted') {
    if (input.take('accept')) location.reload();
    return;
  }
  if (input.take('load')) applySave(state, loadGame());
  if (input.take('weapon1')) state.weapon = 'fists';
  if (input.take('weapon2')) state.weapon = 'pistol';
  if (input.take('weapon3')) state.weapon = 'smg';
  if (input.take('enterCar')) {
    if (state.player.state === 'drive') exitCar(state.player);
    else if (tryCarjack(state.player, state.entities)) {
      addHeat(state.police, 16);
      toast(state.hud, 'VEHICLE ACQUIRED');
    }
  }
  if (state.player.state === 'drive') updateCar(state.player, state.player.car, input, dt, state.city);
  else updatePlayer(state.player, input, {
    blocked: (x, y) => state.city.buildings.some(building => x > building.x - 10 && x < building.x + building.w + 10 && y > building.y - 10 && y < building.y + building.h + 10),
  }, dt);
  updateTraffic(state.entities, state.player, dt, state.rng);
  updatePeds(state.entities, state.player, dt, state.rng);
  updatePolice(state.police, state.player, state.entities, state.city, dt, state.rng);
  fire(state, input, audio);
  updateCombat(state, dt, audio);
  collectPickups(state.player, state.entities);
  if (updateMission(state.mission, state.player, state.police, dt) === 'complete') {
    banner(state.hud, 'CONTRACT COMPLETE');
    toast(state.hud, 'PAYMENT RECEIVED');
    saveGame(state);
  }
  if (!state.mission.active && input.take('accept')) startMission(state.mission);
  if (state.police.busted) state.mode = 'busted';
  if (state.police.wasted) state.mode = 'wasted';
  updateHud(state.hud, dt);
}

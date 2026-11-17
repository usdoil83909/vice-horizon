// Seeded scene scripts use the same fixed-step update as play. Once composed,
// main.js holds simulation still and signals readiness after two painted frames.
import { STEP } from './config.js';
import { createCar, createPed } from './entities.js';
import { startMission } from './missions.js';

const idle = { axes: () => ({ x: 0, y: 0 }), held: () => false, tap: () => false, pointer: { active: false, firing: false } };
export function stageShot(mode, state, step) {
  state.screen = mode === 'start' ? 'title' : 'playing';
  state.player.x = 945; state.player.y = 1040;
  // Add street life in the camera's neighborhood; all are genuine entities.
  for (let i = 0; i < 16; i++) {
    const x = 570 + state.world.rng() * 1000, y = i % 2 ? 990 : 1420;
    state.peds.push(createPed(state.world, x, y));
  }
  for (const [type, x, y, a] of [['taxi', 1190, 952, 0], ['sedan', 721, 905, Math.PI], ['sports', 908, 1230, -Math.PI / 2], ['truck', 1385, 1110, Math.PI / 2]]) {
    const car = createCar(state.world, type, x, y, a); car.speed = 65; state.cars.push(car);
  }
  if (mode === 'chase') {
    const car = createCar(state.world, 'sports', 930, 1135, -Math.PI / 2);
    car.stolen = true; car.ai = false; car.speed = 155; state.cars.push(car); state.player.vehicle = car; state.player.x = car.x; state.player.y = car.y;
    state.crime(2, 'VEHICLE THEFT'); state.policeTimer = 10;
    for (const [x, y] of [[919, 1330], [975, 1435], [930, 745]]) { const cop = createCar(state.world, 'police', x, y, -Math.PI / 2); cop.speed = 130; state.cars.push(cop); }
    startMission(state);
  } else if (mode === 'mission') {
    state.mission.index = 1; startMission(state);
    state.player.x = 1290; state.player.y = 1045;
  } else if (mode === 'play') startMission(state);
  const steps = mode === 'chase' ? 26 : 70;
  const drive = { ...idle, axes: () => ({ x: 0, y: -1 }) };
  for (let i = 0; i < steps; i++) step(state, STEP, mode === 'chase' ? drive : idle);
  state.player.angle = mode === 'mission' ? -.55 : -.9;
  state.notice = { text: mode === 'chase' ? 'PCPD DISPATCH  /  Suspect heading north on Palm Avenue' : mode === 'mission' ? 'ROSA  /  “Find the mint Aurora. Bring it back in one piece.”' : 'DOWNTOWN  /  A little ambition goes a long way.', time: 9 };
  state.mission.dialog = 0;
  if (mode === 'start') { state.player.x = 1180; state.player.y = 1090; }
}

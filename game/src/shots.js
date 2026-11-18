export function readShot() {
  const query = new URLSearchParams(globalThis.location?.search || '');
  const requested = query.get('shot');
  const mode = ['start', 'play', 'chase', 'mission'].includes(requested) ? requested : 'play';
  const candidate = Number(query.get('seed') || 1);
  const seed = Number.isSafeInteger(candidate) && candidate > 0 && candidate <= 1000000 ? candidate : 1;
  return { mode, seed };
}
export function stageShot(state, shot) {
  state.shot = shot.mode;
  if (shot.mode === 'start') state.mode = 'title';
  if (shot.mode === 'chase') {
    state.mode = 'play';
    state.player.x = 1540;
    state.player.y = 920;
    state.police.heat = 90;
    state.player.state = 'drive';
    state.player.car = state.entities.cars[0];
    state.player.car.occupied = true;
  }
  if (shot.mode === 'mission') {
    state.mode = 'play';
    Object.assign(state.player, { x: 1240, y: 920 });
    state.mission.active = {
      id: 5, name: 'Midnight Circuit', contact: 'Mia Sol', kind: 'race',
      payout: 2400, dialogue: 'The city pays for nerve.',
    };
    state.mission.marker = { x: 1880, y: 1560 };
  }
}
export function markReady() {
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}

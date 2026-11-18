const dialogue = [
  'Keep it clean, keep it moving.', 'The city pays for nerve.', 'Meet me under the pink lights.',
  'Bring the package intact.', 'One last favor, then we are even.',
];
export const contracts = [
  ['Neon Introduction', 'Roxie Vale', 'goto', 900],
  ['Borrowed Wheels', 'Manny Cruz', 'steal', 1200],
  ['Harbor Handoff', 'Juno Six', 'deliver', 1600],
  ['Quiet Exit', 'Cobalt', 'survive', 1900],
  ['Midnight Circuit', 'Mia Sol', 'race', 2400],
  ['Loose Ends', 'The Broker', 'eliminate', 2200],
  ['Palm Escort', 'Vega', 'escort', 2600],
  ['Glass Run', 'Roxie Vale', 'goto', 2900],
  ['Vice Relay', 'Manny Cruz', 'deliver', 3200],
  ['Five Alarm', 'Juno Six', 'survive', 3500],
  ['Speed Dial', 'Cobalt', 'race', 3800],
  ['Pier Pressure', 'Mia Sol', 'steal', 4100],
  ['Cypress Keys', 'The Broker', 'eliminate', 4600],
  ['Last Light', 'Vega', 'escort', 5200],
  ['Horizon Finale', 'Roxie Vale', 'goto', 10000],
].map(([name, contact, kind, payout], index) => ({
  id: index + 1, name, contact, kind, payout, dialogue: dialogue[index % dialogue.length], complete: false, checkpoint: index % 2,
}));

export const createMissionState = () => ({ index: 0, active: null, marker: { x: 900, y: 600 }, timer: 0, completed: [], finale: false });
export const currentMission = state => contracts[state.index] || null;
export function startMission(state, index = state.index) {
  if (!contracts[index]) return null;
  state.active = { ...contracts[index] };
  state.timer = 0;
  state.marker = { x: [900, 1270, 1850, 2450][index % 4], y: [600, 920, 1400, 1880][index % 4] };
  return state.active;
}
export function updateMission(state, player, police, dt) {
  const mission = state.active;
  if (!mission) return null;
  state.timer += dt;
  const atMarker = Math.hypot(player.x - state.marker.x, player.y - state.marker.y) < 58;
  const survived = mission.kind === 'survive' && state.timer > 900;
  const eliminated = mission.kind === 'eliminate' && police.wanted >= 2;
  if ((atMarker && mission.kind !== 'survive') || survived || eliminated) {
    mission.complete = true;
    state.completed.push(mission.id);
    player.cash += mission.payout;
    state.index = Math.min(contracts.length - 1, state.index + 1);
    state.active = null;
    state.finale = state.index >= contracts.length - 1;
    return 'complete';
  }
  const deadline = mission.kind === 'survive' ? 840 : mission.kind === 'race' ? 720 : Infinity;
  if (state.timer > deadline) return 'failed';
  return null;
}
export const missionMarker = state => state.active ? state.marker : null;

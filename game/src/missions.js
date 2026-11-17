export const CONTRACTS = [
  ['01', 'Lola', 'Neon Package', 'goto', 'Bodega', 350], ['02', 'Mick', 'Borrowed Heat', 'steal', 'Auto Club', 600],
  ['03', 'Juno', 'Beach Run', 'timed', 'Marina', 850], ['04', 'Lola', 'Quiet Exit', 'deliver', 'Palm Hotel', 1000],
  ['05', 'Mick', 'Vinyl Static', 'eliminate', 'Vinyl', 1200], ['06', 'Juno', 'Fast Lane', 'timed', 'Downtown', 1400],
  ['07', 'Lola', 'Southbound', 'goto', 'Sunset Motel', 1500], ['08', 'Mick', 'Heavy Weather', 'steal', 'Truck', 1700],
  ['09', 'Juno', 'Blue Lights', 'chase', 'Police HQ', 1900], ['10', 'Lola', 'High Tide', 'deliver', 'Marina', 2100],
  ['11', 'Mick', 'House Edge', 'eliminate', 'Casino', 2400], ['12', 'Juno', 'Palm Lines', 'timed', 'Palm Grove', 2800],
  ['13', 'Lola', 'Last Signal', 'survive', 'Pearl Hospital', 3200], ['14', 'Mick', 'VICE HORIZON', 'finale', 'Pearl City', 5000]
];
export function createMissions() { return { index: 0, active: false, done: false, failed: false, progress: 0, contracts: CONTRACTS }; }
export function currentMission(missions) { return missions.contracts[Math.min(missions.index, missions.contracts.length - 1)]; }
export function acceptMission(missions) { missions.active = true; missions.done = false; missions.failed = false; missions.progress = 0; }
export function updateMissions(missions, state, dt) { if (!missions.active) return; const mission = currentMission(missions); missions.progress += dt / (mission[3] === 'survive' ? 22 : 12); if (missions.progress >= 1) { missions.active = false; missions.done = true; state.player.money += mission[5]; missions.index = Math.min(missions.index + 1, missions.contracts.length - 1); } }

const storageKey = 'vice-horizon-save-v1';

export function saveGame(state) {
  try {
    const snapshot = {
      cash: Math.max(0, state.player.cash | 0), weapon: state.weapon,
      x: Math.round(state.player.x), y: Math.round(state.player.y),
      health: state.player.health, armor: state.player.armor,
      mission: state.mission?.active?.id || 0,
    };
    localStorage.setItem(storageKey, JSON.stringify(snapshot));
    return true;
  } catch { return false; }
}
export function loadGame() {
  try {
    const value = localStorage.getItem(storageKey);
    return value ? JSON.parse(value) : null;
  } catch { return null; }
}
export function clearSave() {
  try { localStorage.removeItem(storageKey); } catch {}
}
export function applySave(state, data) {
  if (!data || typeof data !== 'object') return state;
  const player = state.player;
  if (Number.isFinite(data.cash)) player.cash = Math.max(0, data.cash | 0);
  if (['fists', 'pistol', 'smg'].includes(data.weapon)) state.weapon = data.weapon;
  for (const coordinate of ['x', 'y']) {
    if (Number.isFinite(data[coordinate])) player[coordinate] = Math.max(0, data[coordinate]);
  }
  for (const resource of ['health', 'armor']) {
    if (Number.isFinite(data[resource])) player[resource] = Math.max(0, Math.min(100, data[resource]));
  }
  return state;
}

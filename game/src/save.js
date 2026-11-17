import { clamp, CITY } from './config.js';
import { solid } from './world.js';
const KEY = 'vice-horizon-save-v1';
export function saveGame(state) {
  try {
    const p = state.player;
    localStorage.setItem(KEY, JSON.stringify({ version: 1, seed: state.world.seed, x: p.x, y: p.y, money: p.money, hp: p.hp, armor: p.armor, weapon: p.weapon, ammo: p.ammo.slice(1), mission: state.mission.index }));
    return true;
  } catch { return false; }
}
export function hasSave() { try { return !!localStorage.getItem(KEY); } catch { return false; } }
export function loadGame(state) {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (!s || s.version !== 1 || ![s.x, s.y, s.money, s.mission, s.hp, s.armor].every(Number.isFinite) || !Array.isArray(s.ammo)) return false;
    const p = state.player;
    p.x = clamp(s.x, 20, CITY.coast - 20); p.y = clamp(s.y, 20, CITY.height - 20);
    if (solid(state.world, p.x, p.y, 10)) { p.x = 945; p.y = 1040; }
    p.money = Math.max(0, s.money); p.hp = clamp(s.hp, 1, 100); p.armor = clamp(s.armor, 0, 100);
    p.weapon = clamp(Math.floor(s.weapon || 0), 0, 2); p.ammo = [Infinity, ...s.ammo.slice(0, 2).map(n => Number.isFinite(n) ? clamp(n, 0, 9999) : 96)];
    p.vehicle = null; state.mission = { index: clamp(Math.floor(s.mission), 0, 8), active: false, phase: 0, checkpoint: 0, timer: 0, dialog: 0 };
    state.heat = 0; state.wanted = 0; state.bust = 0; state.enemies = []; return true;
  } catch { return false; }
}

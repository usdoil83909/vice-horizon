import { CONTRACTS } from './missions.js';
import { blocked } from './world.js';
import { limit } from './config.js';

const SLOT = 'vice-horizon-story-v2';
export function store(s) {
  try {
    const h = s.hero;
    const payload = { version: 2, seed: s.city.seed, x: h.x, y: h.y, health: h.health, armor: h.armor, cash: h.cash, gun: h.gun, ammo: h.ammo, index: s.job.index, completed: s.job.completed, clock: s.clock };
    localStorage.setItem(SLOT, JSON.stringify(payload)); return true;
  } catch { return false; }
}
export function restore(s) {
  try {
    const v = JSON.parse(localStorage.getItem(SLOT));
    if (!v || v.version !== 2 || ![v.x, v.y, v.cash, v.index, v.clock, v.health, v.armor, v.gun].every(Number.isFinite) || !Array.isArray(v.ammo) || v.ammo.length !== 3 || !v.ammo.every(Number.isFinite) || v.seed !== s.city.seed) return false;
    if (blocked(s.city, v.x, v.y, 10)) { v.x = 1580; v.y = 1072; }
    Object.assign(s.hero, { x: v.x, y: v.y, health: limit(v.health, 1, 100), armor: limit(v.armor, 0, 100), cash: limit(v.cash, 0, 99999999), displayCash: v.cash, gun: limit(Math.floor(v.gun), 0, 2), ammo: v.ammo.map(n => limit(Math.floor(n), 0, 99999)), car: null, grace: 4 });
    Object.assign(s.job, { index: limit(Math.floor(v.index), 0, CONTRACTS.length), completed: Array.isArray(v.completed) ? v.completed.filter(n => Number.isInteger(n) && n >= 0 && n < CONTRACTS.length) : [], active: false, phase: 0, gate: 0, failed: false, vehicle: null });
    s.clock = Math.max(0, v.clock); s.stars = 0; s.heat = 0; s.hostiles = []; s.projectiles = []; s.bustMeter = 0; s.chopper = null;
    for (const c of s.cars) c.pursuit = false;
    s.mode = 'play'; return true;
  } catch { return false; }
}

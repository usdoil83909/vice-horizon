export function mulberry32(seed) { let value = seed >>> 0; return () => { value = value + 0x6D2B79F5 | 0; let t = Math.imul(value ^ value >>> 15, 1 | value); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export function choose(rng, list) { return list.length ? list[Math.floor(rng() * list.length) % list.length] : undefined; }
export function between(rng, low, high) { return low + (high - low) * rng(); }
export function intBetween(rng, low, high) { return Math.floor(between(rng, low, high + 1)); }
export function chance(rng, probability) { return rng() < Math.max(0, Math.min(1, probability)); }
export function pick(rng, list, count) { const copy = list.slice(); const result = []; while (copy.length && result.length < count) result.push(copy.splice(Math.floor(rng() * copy.length), 1)[0]); return result; }
export function sign(rng) { return rng() < .5 ? -1 : 1; }
export function angle(rng) { return rng() * Math.PI * 2; }
export function shuffle(rng, list) { for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; } return list; }
export function hashText(text) { let hash = 2166136261; for (const char of String(text)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619); return hash >>> 0; }
export function seeded(seed, label = '') { return mulberry32((seed ^ hashText(label)) >>> 0); }

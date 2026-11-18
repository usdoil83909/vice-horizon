export function mulberry32(seed) {
  let value = seed >>> 0;
  return function next() {
    value = value + 0x6D2B79F5 | 0;
    let part = Math.imul(value ^ value >>> 15, 1 | value);
    part ^= part + Math.imul(part ^ part >>> 7, 61 | part);
    return ((part ^ part >>> 14) >>> 0) / 4294967296;
  };
}
export const choose = (rng, list) => list.length ? list[Math.floor(rng() * list.length) % list.length] : undefined;
export const between = (rng, low, high) => low + (high - low) * rng();
export const intBetween = (rng, low, high) => Math.floor(between(rng, low, high + 1));
export const chance = (rng, probability) => rng() < Math.max(0, Math.min(1, probability));
export function pick(rng, list, count) {
  const remaining = list.slice(), result = [];
  while (remaining.length && result.length < count) result.push(remaining.splice(Math.floor(rng() * remaining.length), 1)[0]);
  return result;
}
export const sign = rng => rng() < .5 ? -1 : 1;
export const angle = rng => rng() * Math.PI * 2;
export function shuffle(rng, list) {
  for (let i = list.length - 1; i > 0; i--) {
    const other = Math.floor(rng() * (i + 1));
    [list[i], list[other]] = [list[other], list[i]];
  }
  return list;
}
export function hashText(text) {
  let hash = 2166136261;
  for (const character of String(text)) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return hash >>> 0;
}
export const seeded = (seed, label = '') => mulberry32((seed ^ hashText(label)) >>> 0);

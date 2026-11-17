export function random(seed = 1) {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let t = value;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
export function querySeed() {
  const value = Number(new URLSearchParams(location.search).get('seed') ?? 1);
  return Number.isFinite(value) ? value >>> 0 : 1;
}
export const pick = (rng, values) => values[Math.floor(rng() * values.length)];

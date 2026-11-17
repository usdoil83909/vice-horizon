export function seeded(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let n = state;
    n = Math.imul(n ^ n >>> 15, n | 1);
    n ^= n + Math.imul(n ^ n >>> 7, n | 61);
    return ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
}
export function seedFromURL() {
  const value = new URLSearchParams(location.search).get('seed') || 'vice-horizon';
  if (/^\d+$/.test(value)) return Number(value) >>> 0;
  let hash = 0x811c9dc5;
  for (const char of value) hash = Math.imul(hash ^ char.charCodeAt(0), 0x01000193);
  return hash >>> 0;
}
export const choose = (rng, values) => values[Math.floor(rng() * values.length)];
export const between = (rng, low, high) => low + (high - low) * rng();

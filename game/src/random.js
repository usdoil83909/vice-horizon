export function seeded(value) {
  let word = value >>> 0;
  return () => {
    word = (word + 0x9e3779b9) >>> 0;
    let mixed = Math.imul(word ^ (word >>> 16), 0x21f0aaad);
    mixed = Math.imul(mixed ^ (mixed >>> 15), 0x735a2d97);
    return ((mixed ^ (mixed >>> 15)) >>> 0) / 4294967296;
  };
}
export function seedFromURL() {
  const value = new URLSearchParams(location.search).get('seed') ?? 'horizon';
  if (/^\d+$/.test(value)) return Number(value) >>> 0;
  let hash = 2166136261;
  for (const letter of value) hash = Math.imul(hash ^ letter.charCodeAt(0), 16777619);
  return hash >>> 0;
}
export const choose = (rng, list) => list[Math.floor(rng() * list.length)];
export const between = (rng, low, high) => low + (high - low) * rng();

import { WIDTH, HEIGHT, ROAD, districts, landmarks, roadXs, roadYs } from './config.js';
import { seeded, between, intBetween, chance, choose } from './random.js';

export function generateCity(seed = 1) {
  const rng = seeded(Number.isSafeInteger(seed) ? seed : 1, 'city');
  const city = {
    width: WIDTH, height: HEIGHT, roads: [], buildings: [], parks: [], palms: [], lights: [],
    landmarks: [], water: { x: 2960, y: 0, w: 240, h: HEIGHT }, foam: [],
  };
  for (const x of roadXs) city.roads.push({ x: x - ROAD / 2, y: 0, w: ROAD, h: HEIGHT, vertical: true });
  for (const y of roadYs) city.roads.push({ x: 0, y: y - ROAD / 2, w: WIDTH, h: ROAD, vertical: false });
  const blocks = [];
  for (let column = 0; column < roadXs.length - 1; column++) {
    for (let row = 0; row < roadYs.length - 1; row++) {
      blocks.push({
        left: roadXs[column] + ROAD / 2 + 12, top: roadYs[row] + ROAD / 2 + 12,
        right: roadXs[column + 1] - ROAD / 2 - 12, bottom: roadYs[row + 1] - ROAD / 2 - 12,
      });
    }
  }
  for (let index = 0; index < 220; index++) {
    const block = blocks[index % blocks.length];
    const w = between(rng, 52, Math.max(70, block.right - block.left - 14));
    const h = between(rng, 50, Math.max(70, block.bottom - block.top - 14));
    const x = between(rng, block.left, block.right - w), y = between(rng, block.top, block.bottom - h);
    city.buildings.push({
      x, y, w, h, height: intBetween(rng, 1, 5),
      tone: choose(rng, ['#242844', '#313657', '#3d405e', '#273e57', '#45405b']),
      windows: windows(x, y, w, h, rng),
    });
  }
  for (const district of districts) {
    if (chance(rng, .7)) city.parks.push({ x: district.x + 32, y: district.y + district.h - 110, w: Math.min(190, district.w - 64), h: 66, tone: district.tone });
  }
  for (let i = 0; i < 46; i++) city.palms.push({ x: between(rng, 180, 2890), y: between(rng, 90, 2120), lean: between(rng, -.18, .18) });
  for (const x of roadXs) for (const y of roadYs) city.lights.push({ x: x + 25, y: y + 25 });
  for (const [name, x, y] of landmarks) city.landmarks.push({ name, x, y, w: 150, h: 92 });
  for (let i = 0; i < 32; i++) city.foam.push({ x: 2970 + between(rng, 0, 190), y: between(rng, 30, HEIGHT - 30), w: between(rng, 20, 80) });
  return city;
}
function windows(x, y, width, height, rng) {
  const result = [];
  for (let row = y + 13; row < y + height - 8; row += 19) {
    for (let column = x + 12; column < x + width - 8; column += 17) {
      if (chance(rng, .72)) result.push({ x: column, y: row, on: chance(rng, .37) });
    }
  }
  return result;
}
export const isRoad = (city, x, y) => city.roads.some(road => x >= road.x && x <= road.x + road.w && y >= road.y && y <= road.y + road.h);
export function blocked(city, x, y, radius = 10) {
  if (x < 20 || y < 20 || x > city.width - 20 || y > city.height - 20) return true;
  return city.buildings.some(building => x + radius > building.x && x - radius < building.x + building.w && y + radius > building.y && y - radius < building.y + building.h);
}
export function nearestRoad(city, x, y) {
  let result = { x: roadXs[0], y: roadYs[0], d: Infinity };
  for (const road of roadXs) {
    const distance = Math.abs(road - x);
    if (distance < result.d) result = { x: road, y, d: distance };
  }
  for (const road of roadYs) {
    const distance = Math.abs(road - y);
    if (distance < result.d) result = { x, y: road, d: distance };
  }
  return result;
}
export const roadPoint = rng => ({ x: choose(rng, roadXs), y: choose(rng, roadYs) });

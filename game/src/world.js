import { CITY, COLORS, clamp } from './config.js';
import { random, pick } from './random.js';

export const DISTRICTS = [
  { name: 'DOWNTOWN', subtitle: 'Where ambition has an address', x: 0, y: 0, w: 1760, h: 1760, color: '#9ea1b2' },
  { name: 'CORAL QUARTER', subtitle: 'Old streets. New trouble.', x: 0, y: 1760, w: 1760, h: 880, color: '#cf9c84' },
  { name: 'PORT MERIDIAN', subtitle: 'Every container has a story', x: 1760, y: 2640, w: 2060, h: 960, color: '#81a2a1' },
  { name: 'IRONWORKS', subtitle: 'Made after midnight', x: 0, y: 2640, w: 1760, h: 960, color: '#a9947b' },
  { name: 'PALM GROVE', subtitle: 'A little room to breathe', x: 1760, y: 880, w: 880, h: 1760, color: '#8fbc94' },
  { name: 'SUNSET HEIGHTS', subtitle: 'The quiet side of the city', x: 1760, y: 0, w: 1760, h: 880, color: '#c1a593' },
  { name: 'OCEAN BEACH', subtitle: 'Chase the last light', x: 2640, y: 880, w: 1760, h: 1760, color: '#7bc1be' },
];
export function districtAt(x, y) { return DISTRICTS.find(d => x >= d.x && y >= d.y && x < d.x + d.w && y < d.y + d.h) || DISTRICTS[6]; }
export function createWorld(seed) {
  const rng = random(seed), buildings = [], props = [], parks = [], roads = [], nodes = [];
  for (let x = 0; x < CITY.coast; x += CITY.block) roads.push({ x, y: 0, w: CITY.road, h: CITY.height, vertical: true });
  for (let y = 0; y < CITY.height; y += CITY.block) roads.push({ x: 0, y, w: CITY.coast, h: CITY.road, vertical: false });
  for (let x = 50; x < CITY.coast; x += CITY.block) for (let y = 50; y < CITY.height; y += CITY.block) {
    nodes.push({ x, y, neighbors: [] });
  }
  for (const n of nodes) n.neighbors = nodes.filter(m => Math.abs(m.x - n.x) + Math.abs(m.y - n.y) === CITY.block);
  for (let gx = 0; gx < 8; gx++) for (let gy = 0; gy < 8; gy++) {
    const x = gx * CITY.block + 120, y = gy * CITY.block + 120;
    const district = districtAt(x, y);
    const park = district.name === 'PALM GROVE' || (gx === 1 && gy === 2);
    if (park) {
      parks.push({ x, y, w: 300, h: 300 });
      for (let i = 0; i < 22; i++) props.push({ type: 'tree', x: x + 18 + rng() * 270, y: y + 18 + rng() * 270, size: 12 + rng() * 12 });
    } else {
      const industrial = gy >= 6;
      const count = industrial ? 2 : 4;
      for (let i = 0; i < count; i++) {
        const bx = x + (i % 2) * 156 + rng() * 7, by = y + Math.floor(i / 2) * 155 + rng() * 8;
        buildings.push({ x: bx, y: by, w: 114 + rng() * 23, h: industrial ? 260 : 110 + rng() * 24,
          height: district.name === 'DOWNTOWN' ? 18 + rng() * 22 : 7 + rng() * 13,
          color: pick(rng, COLORS.buildings), floors: 2 + Math.floor(rng() * 5), sign: pick(rng, ['HOTEL', 'VICE', '24 / 7', 'MOTEL', 'CAFÉ', 'RECORDS', 'AUTO', '']) });
      }
    }
    for (let i = 0; i < 4; i++) {
      props.push({ type: 'palm', x: gx * 440 + 112 + i * 90, y: gy * 440 + 108, size: 21 + rng() * 8 });
      props.push({ type: 'lamp', x: gx * 440 + 100, y: gy * 440 + 150 + i * 75, size: 8 });
    }
    props.push({ type: 'bench', x: x + 65, y: gy * 440 + 109, size: 15 });
    props.push({ type: 'hydrant', x: gx * 440 + 108, y: gy * 440 + 400, size: 5 });
    props.push({ type: 'planter', x: gx * 440 + 280, y: gy * 440 + 108, size: 12 });
  }
  for (let y = 140; y < CITY.height; y += 90) {
    props.push({ type: 'palm', x: 3750 + rng() * 70, y, size: 29 });
    if (y % 180 < 90) {
      props.push({ type: 'bench', x: 3725, y: y + 30, size: 15 });
      props.push({ type: 'lamp', x: 3790, y: y + 35, size: 8 });
    }
  }
  const buckets = new Map();
  for (const b of buildings) {
    const key = `${Math.floor(b.x / 440)},${Math.floor(b.y / 440)}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(b);
  }
  return { seed, rng, buildings, props, parks, roads, nodes, buckets };
}
export function solid(world, x, y, radius = 10) {
  if (x < radius || y < radius || x > CITY.coast - radius || y > CITY.height - radius) return true;
  const gx = Math.floor(x / 440), gy = Math.floor(y / 440);
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
    for (const b of world.buckets.get(`${gx + dx},${gy + dy}`) || []) {
      if (x + radius > b.x && x - radius < b.x + b.w && y + radius > b.y && y - radius < b.y + b.h) return true;
    }
  }
  return false;
}
export function move(world, entity, dx, dy, radius = 10) {
  let hit = false;
  // Short sweeps prevent fast vehicles crossing a corner between fixed steps.
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / Math.max(4, radius)));
  for (let i = 0; i < steps; i++) {
    if (!solid(world, entity.x + dx / steps, entity.y, radius)) entity.x += dx / steps; else hit = true;
    if (!solid(world, entity.x, entity.y + dy / steps, radius)) entity.y += dy / steps; else hit = true;
  }
  entity.x = clamp(entity.x, radius, CITY.coast - radius); entity.y = clamp(entity.y, radius, CITY.height - radius);
  return hit;
}
export function lineOfSight(world, a, b) {
  const length = Math.hypot(b.x - a.x, b.y - a.y), steps = Math.ceil(length / 20);
  for (let i = 1; i < steps; i++) if (solid(world, a.x + (b.x - a.x) * i / steps, a.y + (b.y - a.y) * i / steps, 1)) return false;
  return true;
}

import { CITY, limit, nearRect } from './config.js';
import { seeded, choose, between } from './random.js';

export const BOROUGHS = [
  { name: 'GLASS DISTRICT', tag: 'Money never sleeps', x: 0, y: 0, w: 1920, h: 1440, tone: '#82989c' },
  { name: 'SUNSET VILLAS', tag: 'Behind the white fences', x: 1920, y: 0, w: 2400, h: 960, tone: '#bd9c8e' },
  { name: 'LITTLE HAVANA', tag: 'Family comes first', x: 0, y: 1440, w: 1920, h: 1440, tone: '#c4957b' },
  { name: 'PALMETTO GARDENS', tag: 'A quieter kind of trouble', x: 1920, y: 960, w: 1440, h: 1920, tone: '#7f9d7e' },
  { name: 'OCEAN DRIVE', tag: 'The beautiful, the damned', x: 3360, y: 960, w: 960, h: 2880, tone: '#83b8af' },
  { name: 'FOUNDRY ROW', tag: 'Built on borrowed time', x: 0, y: 2880, w: 1920, h: 1440, tone: '#9b8e7c' },
  { name: 'PORT SERENA', tag: 'Nothing to declare', x: 1920, y: 2880, w: 2400, h: 1440, tone: '#829c9d' },
];
export const borough = (x, y) => BOROUGHS.find(d => x >= d.x && y >= d.y && x < d.x + d.w && y < d.y + d.h) || BOROUGHS[4];

export function generateCity(seed) {
  const rng = seeded(seed), blocks = [], buildings = [], parks = [], props = [], roads = [], graph = [], bins = new Map();
  for (let c = 0; c < CITY.columns; c++) roads.push({ x: c * CITY.span, y: 0, w: CITY.road, h: CITY.height, vertical: true });
  for (let r = 0; r < CITY.rows; r++) roads.push({ x: 0, y: r * CITY.span, w: CITY.shore, h: CITY.road, vertical: false });
  for (let row = 0; row < CITY.rows; row++) for (let col = 0; col < CITY.columns; col++) {
    const id = row * CITY.columns + col;
    graph.push({ id, x: col * CITY.span + CITY.road / 2, y: row * CITY.span + CITY.road / 2, links: [col ? id - 1 : -1, col < CITY.columns - 1 ? id + 1 : -1, row ? id - CITY.columns : -1, row < CITY.rows - 1 ? id + CITY.columns : -1].filter(n => n >= 0), signal: (col + row) % 2 === 0 });
  }
  const landmarks = [
    { col: 7, row: 2, name: 'MIRAGE CASINO', kind: 'casino', color: '#ad849e' },
    { col: 2, row: 2, name: 'VHPD CENTRAL', kind: 'police', color: '#789cae' },
    { col: 2, row: 3, name: 'SAINT MARIA', kind: 'hospital', color: '#c4c7b1' },
    { col: 3, row: 2, name: 'CAFE LUCIA', kind: 'cafe', color: '#c89b7e' },
    { col: 5, row: 7, name: 'SERENA FREIGHT', kind: 'depot', color: '#8a9b9d' },
    { col: 8, row: 6, name: 'PEARL MARINA', kind: 'marina', color: '#739ca1' },
    { col: 6, row: 3, name: 'PALMETTO AUTO CLUB', kind: 'garage', color: '#b29076' },
  ];
  for (let row = 0; row < CITY.rows; row++) for (let col = 0; col < CITY.columns; col++) {
    const x = col * CITY.span + 129, y = row * CITY.span + 129, district = borough(x, y), landmark = landmarks.find(l => l.col === col && l.row === row);
    const park = !landmark && ((col >= 4 && col <= 5 && row >= 3 && row <= 5) || (col === 1 && row === 1));
    blocks.push({ x: x - 17, y: y - 17, w: 357, h: 357, tone: district.tone });
    if (park) { parks.push({ x, y, w: 320, h: 320 }); for (let n = 0; n < 17; n++) props.push({ kind: 'tree', x: x + between(rng, 15, 305), y: y + between(rng, 15, 305), size: between(rng, 16, 28) }); }
    else if (landmark) { buildings.push({ x: x + 16, y: y + 26, w: 285, h: 235, rise: 30, tone: landmark.color, sign: landmark.name, kind: landmark.kind, windows: 7 }); landmark.x = x + 157; landmark.y = y + 301; }
    else for (let n = 0; n < (row >= 6 ? 3 : 6); n++) buildings.push({ x: x + n % 3 * 108 + between(rng, 0, 7), y: y + Math.floor(n / 3) * 168 + between(rng, 0, 7), w: between(rng, 88, 102), h: row >= 6 ? 296 : between(rng, 120, 143), rise: between(rng, 10, district === BOROUGHS[0] ? 48 : 22), tone: choose(rng, [district.tone, '#a5b3a4', '#b9aa95', '#8b9ca5', '#c1a0a1', '#d0ad88', '#879c8b']), sign: choose(rng, ['PALM HOTEL', 'VINYL', 'BODEGA', 'AUTO CLUB', 'SUNDOWN', '24H', 'MOTEL', 'TROPIC', '']), kind: row >= 6 ? 'warehouse' : 'shop', windows: 4 + Math.floor(rng() * 3) });
    for (let n = 0; n < 4; n++) props.push({ kind: 'palm', x: col * CITY.span + 126 + n * 92, y: row * CITY.span + 114, size: between(rng, 23, 33) }, { kind: 'lamp', x: col * CITY.span + 112, y: row * CITY.span + 150 + n * 83, size: 7 });
    props.push({ kind: 'bench', x: x + 62, y: y - 17, size: 15 }, { kind: 'hydrant', x: x - 15, y: y + 292, size: 5 }, { kind: 'flowers', x: x + 252, y: y - 16, size: 13 });
  }
  for (let y = 50; y < CITY.height; y += 100) props.push({ kind: 'palm', x: 4300, y, size: 36 }, { kind: 'umbrella', x: 4400 + rng() * 92, y: y + 28, size: 19 });
  for (const building of buildings) { const key = `${Math.floor(building.x / CITY.span)}:${Math.floor(building.y / CITY.span)}`; if (!bins.has(key)) bins.set(key, []); bins.get(key).push(building); }
  return { seed: seed >>> 0, rng, blocks, buildings, parks, props, roads, graph, bins, landmarks };
}
export function blocked(city, x, y, radius = 9) {
  if (x < radius || y < radius || x > CITY.shore + 125 - radius || y > CITY.height - radius) return true;
  const col = Math.floor(x / CITY.span), row = Math.floor(y / CITY.span);
  for (let a = col - 1; a <= col + 1; a++) for (let b = row - 1; b <= row + 1; b++) for (const box of city.bins.get(`${a}:${b}`) || []) if (nearRect(x, y, radius, box)) return true;
  return false;
}
export function travel(city, body, dx, dy, radius = 9) {
  let impact = false; const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 7));
  for (let i = 0; i < steps; i++) { const sx = dx / steps, sy = dy / steps; if (blocked(city, body.x + sx, body.y, radius)) impact = true; else body.x += sx; if (blocked(city, body.x, body.y + sy, radius)) impact = true; else body.y += sy; }
  return impact;
}
export function sight(city, a, b) { const steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 16); for (let i = 1; i < steps; i++) if (blocked(city, a.x + (b.x - a.x) * i / steps, a.y + (b.y - a.y) * i / steps, 2)) return false; return true; }
export function nearestNode(city, body) { const col = limit(Math.round((body.x - CITY.road / 2) / CITY.span), 0, CITY.columns - 1), row = limit(Math.round((body.y - CITY.road / 2) / CITY.span), 0, CITY.rows - 1); return city.graph[row * CITY.columns + col]; }
export function greenLight(node, clock, vertical) { return !node.signal || ((Math.floor(clock / 9) + node.id) % 2 === (vertical ? 1 : 0)); }

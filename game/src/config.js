export const WIDTH = 3200, HEIGHT = 2400, TILE = 96, ROAD = 30, WORLD_SEED = 6101;
export const palette = {
  night: '#080b17', ink: '#11152b', asphalt: '#24283a', asphalt2: '#30364b',
  sidewalk: '#77798b', concrete: '#9b9aa4', neon: '#50e9ff', pink: '#ff4e9d',
  yellow: '#ffd45a', lime: '#b7ef64', water: '#102a49', foam: '#65d6d0',
  grass: '#234b42', palm: '#67b36e', white: '#e8f4f5', danger: '#ff5b62',
};
export const districts = [
  { name: 'Neon Mile', x: 160, y: 160, w: 780, h: 820, tone: '#ff4e9d' },
  { name: 'Glass Harbor', x: 980, y: 160, w: 940, h: 640, tone: '#50e9ff' },
  { name: 'Palm Vista', x: 160, y: 1030, w: 700, h: 850, tone: '#b7ef64' },
  { name: 'Old Port', x: 880, y: 850, w: 640, h: 950, tone: '#ffd45a' },
  { name: 'Mirage Heights', x: 1550, y: 850, w: 610, h: 920, tone: '#c994ff' },
  { name: 'South Beach', x: 2200, y: 160, w: 760, h: 900, tone: '#ff9c74' },
  { name: 'Cypress Point', x: 2200, y: 1120, w: 760, h: 900, tone: '#65d6d0' },
];
export const tuning = {
  player: { speed: 3.1, sprint: 5.2, turn: .14, maxHealth: 100, maxArmor: 100 },
  cars: {
    sedan: { speed: 6, turn: .09, color: '#ef526f' },
    coupe: { speed: 7, turn: .1, color: '#50e9ff' },
    van: { speed: 4.6, turn: .07, color: '#d5b17a' },
    taxi: { speed: 5.4, turn: .08, color: '#ffd45a' },
    sport: { speed: 8.2, turn: .12, color: '#a978ff' },
    police: { speed: 8.8, turn: .13, color: '#f3f5fa' },
  },
  weapons: {
    fists: { damage: 18, range: 42, cooldown: 18 },
    pistol: { damage: 28, range: 520, cooldown: 18 },
    smg: { damage: 12, range: 460, cooldown: 5 },
  },
  wanted: { decay: .004, tiers: [0, 1, 2, 3, 4, 5] },
};
export const landmarks = [
  ['Vice Tower', 610, 380], ['Moonlight Mall', 1270, 360], ['Sunset Speedway', 2010, 610],
  ['Horizon Pier', 2530, 390], ['Pink Flamingo', 470, 1330], ['Civic Forum', 1170, 1180],
  ['Cypress Casino', 1840, 1390], ['Ocean Drive Club', 2510, 1530],
];
export const colors = Object.values(palette);
export const clamp = (value, low, high) => Math.max(low, Math.min(value, high));
export const dist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
export const worldBounds = (x, y, radius = 0) => x >= radius && y >= radius && x <= WIDTH - radius && y <= HEIGHT - radius;
export const angleTo = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
export const roadXs = [280, 600, 920, 1240, 1560, 1880, 2200, 2520, 2840];
export const roadYs = [280, 600, 920, 1240, 1560, 1880, 2180];
export const carNames = ['sedan', 'coupe', 'van', 'taxi', 'sport', 'police'];

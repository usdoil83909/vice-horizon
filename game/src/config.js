export const FIXED = 1 / 60;
export const CITY = Object.freeze({ span: 480, road: 104, columns: 9, rows: 9, shore: 4320, width: 4920, height: 4320 });
export const INK = { sea: '#126b79', sand: '#d9bd8c', lawn: '#647e64', road: '#283c47', mint: '#88f3ce', rose: '#ff849f', gold: '#ffd494', white: '#f4ead5', dark: '#0d202d' };
export const FLEET = {
  coupe: { label: 'Comet Cabrio', length: 49, width: 25, top: 330, power: 190, grip: 7.5, hull: 150 },
  saloon: { label: 'Regent Executive', length: 53, width: 27, top: 245, power: 133, grip: 10, hull: 190 },
  cab: { label: 'Sunline Taxi', length: 54, width: 27, top: 255, power: 140, grip: 9, hull: 185 },
  van: { label: 'Atlas Delivery', length: 69, width: 31, top: 190, power: 95, grip: 6, hull: 290 },
  cruiser: { label: 'VHPD Interceptor', length: 56, width: 28, top: 295, power: 167, grip: 11, hull: 235 },
  muscle: { label: 'Coyote V8', length: 57, width: 28, top: 305, power: 180, grip: 5.8, hull: 215 },
};
export const ARMS = [
  { label: 'BARE KNUCKLES', delay: .36, harm: 29, range: 40, pellets: 0, scatter: 0, stock: 0 },
  { label: '9MM PISTOL', delay: .25, harm: 31, range: 760, pellets: 1, scatter: .035, stock: 96 },
  { label: 'COMPACT SMG', delay: .083, harm: 17, range: 650, pellets: 1, scatter: .12, stock: 210 },
];
export const limit = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
export const gap = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const turnTo = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
export const nearRect = (x, y, r, b) => x + r > b.x && x - r < b.x + b.w && y + r > b.y && y - r < b.y + b.h;

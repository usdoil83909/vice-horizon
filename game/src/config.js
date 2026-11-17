export const STEP = 1 / 60;
export const CITY = { width: 4400, height: 3600, block: 440, road: 100, coast: 3820 };
export const COLORS = {
  asphalt: '#25343d', sidewalk: '#777b78', land: '#39494a', ocean: '#143e4b',
  sand: '#b39c7c', pink: '#ff729c', mint: '#83ead4', gold: '#ffd68d', ink: '#101e28',
  buildings: ['#8b787a', '#697b83', '#8c8578', '#637c7e', '#a08682', '#75758c'],
};
export const TYPES = {
  sedan: { name: 'Solara LX', length: 48, width: 24, max: 225, accel: 125, hp: 110 },
  sports: { name: 'Aurora GT', length: 47, width: 25, max: 335, accel: 200, hp: 95 },
  truck: { name: 'Atlas Cargo', length: 65, width: 29, max: 165, accel: 85, hp: 210 },
  taxi: { name: 'City Cab', length: 50, width: 25, max: 220, accel: 120, hp: 120 },
  police: { name: 'PCPD Interceptor', length: 51, width: 25, max: 285, accel: 165, hp: 165 },
};
export const WEAPONS = [
  { name: 'FISTS', rate: .38, damage: 22, range: 42, ammo: Infinity, spread: .2 },
  { name: '9MM PISTOL', rate: .26, damage: 29, range: 650, ammo: 96, spread: .035 },
  { name: 'MICRO SMG', rate: .085, damage: 14, range: 560, ammo: 240, spread: .12 },
];
export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const angleDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

import { CITY, COLORS, TYPES, clamp } from './config.js';
import { missionTarget, currentMission } from './missions.js';
import { renderHUD, panel, text } from './hud.js';

const TAU = Math.PI * 2;
export class Renderer {
  constructor(canvas, world) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d', { alpha: false });
    this.camera = { x: 945, y: 1040, zoom: 1 }; this.map = this.makeMap(world);
  }
  resize(state) {
    const w = innerWidth, h = innerHeight, dpr = Math.min(devicePixelRatio || 1, 2);
    if (this.canvas.width !== Math.round(w * dpr) || this.canvas.height !== Math.round(h * dpr)) {
      this.canvas.width = Math.round(w * dpr); this.canvas.height = Math.round(h * dpr);
    }
    state.view = { w, h, dpr };
  }
  makeMap(world) {
    const map = document.createElement('canvas'); map.width = 880; map.height = 720;
    const c = map.getContext('2d'); c.scale(.2, .2);
    c.fillStyle = '#194651'; c.fillRect(0, 0, CITY.width, CITY.height);
    c.fillStyle = '#767a67'; c.fillRect(0, 0, CITY.coast + 100, CITY.height);
    c.fillStyle = '#344d4c'; c.fillRect(0, 0, CITY.coast, CITY.height);
    for (const road of world.roads) { c.fillStyle = '#79918c'; c.fillRect(road.x, road.y, road.w, road.h); c.fillStyle = '#263e42'; c.fillRect(road.x + 5, road.y + 5, road.w - 10, road.h - 10); }
    for (const b of world.buildings) { c.fillStyle = '#526967'; c.fillRect(b.x, b.y, b.w, b.h); }
    for (const p of world.parks) { c.fillStyle = '#4b765e'; c.fillRect(p.x, p.y, p.w, p.h); }
    return map;
  }
  render(state, dt = 1 / 60) {
    this.resize(state);
    const c = this.ctx, { w, h, dpr } = state.view, p = state.player;
    const zoom = p.vehicle ? .86 : 1.05;
    const blend = 1 - Math.exp(-dt * 5);
    const look = p.vehicle ? clamp(p.vehicle.speed * .32, -35, 95) : 0;
    const targetX = clamp(p.x + Math.cos(p.angle) * look, 180, CITY.width - 180);
    const targetY = clamp(p.y + Math.sin(p.angle) * look, 180, CITY.height - 180);
    this.camera.x += (targetX - this.camera.x) * blend;
    this.camera.y += (targetY - this.camera.y) * blend;
    this.camera.zoom += (zoom - this.camera.zoom) * blend;
    if (state.shot || state.ticks < 2 || Math.hypot(p.x - this.camera.x, p.y - this.camera.y) > 1000) { this.camera.x = p.x; this.camera.y = p.y; this.camera.zoom = zoom; }
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.fillStyle = COLORS.ocean; c.fillRect(0, 0, w, h);
    c.save();
    const shake = state.shake * Math.sin(state.ticks * 2.37);
    c.translate(w / 2 + shake, h / 2 + shake * .4); c.scale(this.camera.zoom, this.camera.zoom); c.translate(-this.camera.x, -this.camera.y);
    const bounds = { x: this.camera.x - w / 2 / this.camera.zoom - 100, y: this.camera.y - h / 2 / this.camera.zoom - 100, w: w / this.camera.zoom + 200, h: h / this.camera.zoom + 200 };
    const visible = (o, r = 80) => o.x + (o.w || r) > bounds.x && o.x - r < bounds.x + bounds.w && o.y + (o.h || r) > bounds.y && o.y - r < bounds.y + bounds.h;
    this.ground(c, state, bounds, visible);
    for (const skid of state.skids) { c.save(); c.translate(skid.x, skid.y); c.rotate(skid.angle); c.strokeStyle = `rgba(9,19,24,${Math.min(.6, skid.life / 10)})`; c.lineWidth = 3; c.beginPath(); c.moveTo(-8, -10); c.lineTo(8, -10); c.moveTo(-8, 10); c.lineTo(8, 10); c.stroke(); c.restore(); }
    for (const b of state.world.buildings) if (visible(b)) this.building(c, b, state);
    this.marker(c, state);
    for (const ped of state.peds) if (visible(ped, 20)) this.person(c, ped, false, state);
    for (const enemy of state.enemies) if (visible(enemy)) this.person(c, enemy, false, state, true);
    for (const car of state.cars) if (visible(car)) this.car(c, car, state);
    if (!p.vehicle) this.person(c, p, true, state);
    for (const prop of state.world.props) if (visible(prop)) this.prop(c, prop, state);
    for (const bullet of state.bullets) {
      c.strokeStyle = '#fff3c2'; c.lineWidth = 2; c.beginPath(); c.moveTo(bullet.x, bullet.y); c.lineTo(bullet.x - bullet.vx * .018, bullet.y - bullet.vy * .018); c.stroke();
    }
    for (const pt of state.particles) { c.globalAlpha = Math.min(1, pt.life * 3); c.fillStyle = pt.color; c.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size); } c.globalAlpha = 1;
    if (state.flash > 0) { c.save(); c.translate(p.x, p.y); c.rotate(p.angle); c.fillStyle = '#ffecac'; c.shadowColor = '#ffc56a'; c.shadowBlur = 25; c.beginPath(); c.moveTo(19, -5); c.lineTo(44, 0); c.lineTo(19, 5); c.fill(); c.restore(); }
    c.restore();
    // A slow, deterministic dusk-to-night cycle preserves the warm city lights.
    const darkness = .045 + (Math.sin(state.time / 100 - .7) + 1) * .055;
    c.fillStyle = `rgba(20,21,54,${darkness})`; c.fillRect(0, 0, w, h);
    const sunset = c.createLinearGradient(0, h, w, 0); sunset.addColorStop(0, '#e9966e09'); sunset.addColorStop(1, '#fa98ae09'); c.fillStyle = sunset; c.fillRect(0, 0, w, h);
    const vignette = c.createRadialGradient(w / 2, h / 2, h * .2, w / 2, h / 2, w * .72);
    vignette.addColorStop(0, '#101d2200'); vignette.addColorStop(1, '#071c2c86'); c.fillStyle = vignette; c.fillRect(0, 0, w, h);
    if (state.screen === 'title') this.title(c, state);
    else { renderHUD(c, state, this.map); if (state.screen === 'paused') this.pause(c, state); if (['wasted', 'busted', 'gameover'].includes(state.screen)) this.gameover(c, state); }
    if (state.help) this.help(c, state);
    state.camera = { ...this.camera };
  }
  ground(c, state, b, visible) {
    c.fillStyle = COLORS.land; c.fillRect(0, 0, CITY.coast, CITY.height);
    c.fillStyle = COLORS.sand; c.fillRect(CITY.coast, 0, 150, CITY.height);
    c.fillStyle = '#417c7d'; c.fillRect(CITY.coast + 150, 0, 35, CITY.height);
    c.fillStyle = '#c9b58f'; c.fillRect(CITY.coast - 120, 0, 32, CITY.height);
    c.fillStyle = '#9a92762c';
    for (let y = Math.max(0, Math.floor(b.y / 18) * 18); y < Math.min(CITY.height, b.y + b.h); y += 18) c.fillRect(CITY.coast - 120, y, 32, 1);
    for (let y = Math.floor(b.y / 38) * 38; y < b.y + b.h; y += 38) {
      c.strokeStyle = '#a6d9bd2b'; c.lineWidth = 2; c.beginPath();
      for (let x = CITY.coast + 184; x < CITY.width + 200; x += 12) { const yy = y + Math.sin(x / 47 + y / 60 + state.time * .4) * 5; if (x === CITY.coast + 184) c.moveTo(x, yy); else c.lineTo(x, yy); } c.stroke();
    }
    for (const park of state.world.parks) if (visible(park)) {
      c.fillStyle = '#4c6b56'; c.fillRect(park.x - 10, park.y - 10, park.w + 20, park.h + 20);
      c.strokeStyle = '#a59c7d'; c.lineWidth = 15; c.beginPath(); c.moveTo(park.x + 20, park.y + 150); c.lineTo(park.x + 280, park.y + 150); c.moveTo(park.x + 150, park.y + 20); c.lineTo(park.x + 150, park.y + 280); c.stroke();
      c.fillStyle = '#2f686b'; c.beginPath(); c.arc(park.x + 150, park.y + 150, 32, 0, TAU); c.fill(); c.strokeStyle = '#bcba9e'; c.lineWidth = 4; c.stroke();
      c.fillStyle = '#b3d9c1'; c.beginPath(); c.arc(park.x + 150, park.y + 150, 8, 0, TAU); c.fill();
    }
    for (const road of state.world.roads) {
      if (!visible(road)) continue;
      c.fillStyle = '#99978a'; c.fillRect(road.x - 16, road.y - 16, road.w + 32, road.h + 32);
      c.fillStyle = '#b2aa941f';
      if (road.vertical) for (let y = Math.max(0, Math.floor(b.y / 24) * 24); y < Math.min(CITY.height, b.y + b.h); y += 24) { c.fillRect(road.x - 14, y, 12, 1); c.fillRect(road.x + 102, y, 12, 1); }
      c.fillStyle = COLORS.asphalt; c.fillRect(road.x, road.y, road.w, road.h);
    }
    // Lane markings and crossings are separate from paving so every junction stays clear.
    for (let gx = 0; gx < 9; gx++) for (let gy = 0; gy < 9; gy++) {
      const x = gx * 440, y = gy * 440;
      if (!visible({ x, y, w: 440, h: 440 })) continue;
      c.strokeStyle = '#cebb826f'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(x + 48, y + 120); c.lineTo(x + 48, y + 420); c.moveTo(x + 52, y + 120); c.lineTo(x + 52, y + 420);
      c.moveTo(x + 120, y + 48); c.lineTo(x + 420, y + 48); c.moveTo(x + 120, y + 52); c.lineTo(x + 420, y + 52); c.stroke();
      c.fillStyle = '#c5c9b262';
      for (let i = 0; i < 8; i++) { c.fillRect(x + 7 + i * 11, y + 107, 6, 13); c.fillRect(x + 107, y + 7 + i * 11, 13, 6); }
      c.fillStyle = '#d0d4c12b'; c.fillRect(x + 20, y + 196, 2, 36); c.fillRect(x + 77, y + 196, 2, 36); c.fillRect(x + 196, y + 20, 36, 2); c.fillRect(x + 196, y + 77, 36, 2);
      c.save(); c.translate(x + 240, y + 88); text(c, ['OCEAN DRIVE', 'PALM AVENUE', 'MERIDIAN BLVD', 'SAN MARCO ST'][gy % 4], 0, 0, 8, '#ccd1bd66', '600', 'center'); c.restore();
      // Corner bollards and traffic signals.
      c.fillStyle = '#263d3d'; c.fillRect(x + 102, y + 101, 6, 13); c.fillStyle = (Math.floor(state.time / 8) + gx + gy) % 2 ? '#f4c773' : '#87e5ae'; c.fillRect(x + 103, y + 103, 4, 4);
    }
  }
  building(c, b, state) {
    const lift = b.height * .4;
    c.fillStyle = '#0a192c66'; c.beginPath(); c.moveTo(b.x, b.y); c.lineTo(b.x + b.w + b.height, b.y + 10); c.lineTo(b.x + b.w + b.height, b.y + b.h + b.height); c.lineTo(b.x + 14, b.y + b.h + b.height); c.closePath(); c.fill();
    c.fillStyle = '#46494f'; c.fillRect(b.x, b.y, b.w, b.h + lift);
    c.fillStyle = b.color; c.fillRect(b.x, b.y - lift, b.w, b.h);
    c.fillStyle = '#f6e6c01c'; c.fillRect(b.x, b.y - lift, b.w, 4); c.fillRect(b.x, b.y - lift, 4, b.h);
    c.strokeStyle = '#202f3a77'; c.lineWidth = 3; c.strokeRect(b.x + 7, b.y - lift + 7, b.w - 14, b.h - 14);
    c.fillStyle = '#263b4360'; c.fillRect(b.x + 18, b.y - lift + 19, b.w - 36, b.h - 38);
    // Rooftop service details: air conditioning, vents, skylights and water tanks.
    c.fillStyle = '#304451'; c.fillRect(b.x + 22, b.y - lift + 23, 29, 21); c.fillStyle = '#a6ac9b'; c.fillRect(b.x + 20, b.y - lift + 20, 29, 21);
    c.strokeStyle = '#4d676a'; c.lineWidth = 2; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(b.x + 24, b.y - lift + 24 + i * 4); c.lineTo(b.x + 45, b.y - lift + 24 + i * 4); c.stroke(); }
    c.fillStyle = '#253b46'; c.fillRect(b.x + b.w - 42, b.y - lift + 24, 21, 32); c.fillStyle = '#6b9b9d'; c.fillRect(b.x + b.w - 40, b.y - lift + 26, 17, 26);
    c.fillStyle = '#c6c3a24a'; c.fillRect(b.x + 23, b.y - lift + b.h - 33, 39, 13);
    const neon = b.sign === 'HOTEL' || b.sign === 'MOTEL' ? COLORS.pink : COLORS.mint;
    for (let x = b.x + 12; x < b.x + b.w - 8; x += 18) { c.fillStyle = Math.floor(x + b.y) % 3 ? '#ebc285' : '#344651'; c.fillRect(x, b.y + b.h + 1, 8, 4); }
    if (b.sign) {
      c.fillStyle = '#1b3038'; c.fillRect(b.x + 13, b.y + b.h - 13, b.w - 26, 15);
      c.save(); c.shadowColor = neon; c.shadowBlur = 8; text(c, b.sign, b.x + b.w / 2, b.y + b.h - 2, 9, neon, '800', 'center'); c.restore();
      c.strokeStyle = neon + '88'; c.lineWidth = 1; c.beginPath(); c.moveTo(b.x + 8, b.y + b.h + 6); c.lineTo(b.x + b.w - 8, b.y + b.h + 6); c.stroke();
    }
  }
  car(c, car, state) {
    const spec = TYPES[car.type], l = spec.length, w = spec.width;
    c.save(); c.translate(car.x, car.y); c.rotate(car.angle);
    if (car.hp > 0 && (car.speed || car === state.player.vehicle) && Math.sin(state.time / 100 - .7) > -.9) {
      const g = c.createLinearGradient(l / 2, 0, l / 2 + 150, 0); g.addColorStop(0, '#ffe6af25'); g.addColorStop(1, '#ffe6af00'); c.fillStyle = g;
      c.beginPath(); c.moveTo(l / 2, -8); c.lineTo(l / 2 + 150, -58); c.lineTo(l / 2 + 150, 58); c.lineTo(l / 2, 8); c.fill();
    }
    c.fillStyle = '#07151c77'; c.beginPath(); c.roundRect(-l / 2 + 4, -w / 2 + 5, l, w, 5); c.fill();
    c.fillStyle = '#13242b'; c.fillRect(-l / 2 + 6, -w / 2 - 2, 10, w + 4); c.fillRect(l / 2 - 16, -w / 2 - 2, 10, w + 4);
    c.fillStyle = car.hp <= 0 ? '#303a3d' : car.color; c.beginPath(); c.roundRect(-l / 2, -w / 2, l, w, 5); c.fill();
    c.strokeStyle = '#e9ead44f'; c.lineWidth = 1; c.stroke();
    c.fillStyle = '#1c3643'; c.beginPath(); c.roundRect(-l * .24, -w / 2 + 2, l * .49, w - 4, 3); c.fill();
    c.fillStyle = car.hp <= 0 ? '#3a4142' : car.type === 'police' ? '#233b46' : car.color; c.fillRect(-l * .15, -w / 2 + 3, l * .23, w - 6);
    c.fillStyle = '#a4d2ce55'; c.fillRect(l * .12, -w / 2 + 4, 5, w - 8);
    c.fillStyle = '#b4dbd2'; c.fillRect(l / 2 - 3, -w / 2 + 3, 3, 5); c.fillRect(l / 2 - 3, w / 2 - 8, 3, 5);
    c.fillStyle = '#f18379'; c.fillRect(-l / 2, -w / 2 + 3, 2, 5); c.fillRect(-l / 2, w / 2 - 8, 2, 5);
    if (car.type === 'police') {
      c.fillStyle = '#e0e9df'; c.fillRect(-4, -5, 3, 10);
      const flash = Math.floor(state.time * 8) % 2;
      c.shadowBlur = state.wanted ? 16 : 0; c.shadowColor = '#ff5e81'; c.fillStyle = flash ? '#ff7184' : '#783e54'; c.fillRect(-3, -9, 5, 8);
      c.shadowColor = '#61b4ff'; c.fillStyle = flash ? '#3b5e8a' : '#70c5ff'; c.fillRect(-3, 1, 5, 8); c.shadowBlur = 0;
      text(c, 'POLICE', -13, 3, 5, '#f3ecdb', '800');
    }
    if (car.type === 'taxi') { c.fillStyle = '#ffe7a1'; c.fillRect(-5, -5, 11, 10); text(c, 'TAXI', 0, 2, 4, '#22333b', '800', 'center'); }
    if (car.type === 'truck') { c.fillStyle = '#b0b1a3'; c.fillRect(-l / 2 + 3, -w / 2 + 2, l * .6, w - 4); c.strokeStyle = '#858f8b'; for (let x = -l / 2 + 7; x < 4; x += 6) c.strokeRect(x, -w / 2 + 4, 1, w - 8); }
    if (car.hp < car.maxHp * .3) { c.fillStyle = '#ced1be44'; c.beginPath(); c.arc(l / 2 - 4, -3, 8 + Math.sin(state.time * 5) * 3, 0, TAU); c.fill(); }
    c.restore();
  }
  person(c, p, player, state, enemy = false) {
    c.save(); c.translate(p.x, p.y); c.rotate(p.angle);
    if (p.hp <= 0) { c.fillStyle = '#8b49556b'; c.beginPath(); c.ellipse(0, 0, 14, 9, 0, 0, TAU); c.fill(); c.fillStyle = p.color; c.fillRect(-10, -4, 20, 8); c.restore(); return; }
    c.fillStyle = '#071e2c65'; c.beginPath(); c.ellipse(4, 5, 10, 7, 0, 0, TAU); c.fill();
    const gait = Math.sin(p.step || 0) * 3;
    c.fillStyle = '#213a47'; c.fillRect(-7 + gait, -6, 9, 4); c.fillRect(-7 - gait, 2, 9, 4);
    c.fillStyle = player ? '#f0e2b8' : p.color; c.beginPath(); c.ellipse(0, 0, 6, 9, 0, 0, TAU); c.fill();
    c.fillStyle = '#c6906c'; c.beginPath(); c.arc(2, 0, 4.3, 0, TAU); c.fill(); c.fillStyle = '#263139'; c.beginPath(); c.arc(0, 0, 3.7, Math.PI / 2, Math.PI * 1.5); c.fill();
    if (player || enemy) { c.fillStyle = '#c99775'; c.fillRect(2, 5, 10 + (state.punch > 0 ? 9 : 0), 3); c.fillStyle = '#172c35'; if (!player || state.player.weapon > 0) c.fillRect(10, 5, 9, 3); }
    c.restore();
    if (player) { c.strokeStyle = '#a7f8d9aa'; c.lineWidth = 1.3; c.beginPath(); c.arc(p.x, p.y, 15, .15, 1.2); c.arc(p.x, p.y, 15, 3.3, 4.35); c.stroke(); }
  }
  prop(c, p, state) {
    if (p.type === 'planter') {
      c.fillStyle = '#253b4266'; c.fillRect(p.x - 13, p.y - 6, 30, 21);
      c.fillStyle = '#be9c83'; c.fillRect(p.x - 15, p.y - 10, 30, 19);
      c.fillStyle = '#42785e'; c.fillRect(p.x - 12, p.y - 8, 24, 13);
      c.fillStyle = '#efb5ab'; for (let i = 0; i < 4; i++) c.fillRect(p.x - 9 + i * 6, p.y - 5 + i % 2 * 3, 3, 3);
      return;
    }
    if (p.type === 'bench') {
      c.fillStyle = '#172f3d66'; c.fillRect(p.x - 14, p.y + 2, 31, 8);
      c.fillStyle = '#bd9a77'; c.fillRect(p.x - 15, p.y - 4, 30, 3); c.fillRect(p.x - 15, p.y + 1, 30, 3);
      c.fillStyle = '#304b50'; c.fillRect(p.x - 11, p.y - 6, 3, 12); c.fillRect(p.x + 9, p.y - 6, 3, 12); return;
    }
    if (p.type === 'hydrant') {
      c.fillStyle = '#263b4166'; c.beginPath(); c.ellipse(p.x + 3, p.y + 4, 6, 4, 0, 0, TAU); c.fill();
      c.fillStyle = '#e9b076'; c.fillRect(p.x - 3, p.y - 4, 6, 9); c.fillRect(p.x - 5, p.y - 1, 10, 3); return;
    }
    if (p.type === 'lamp') {
      const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, 57); g.addColorStop(0, '#ffd5971c'); g.addColorStop(1, '#ffd59700'); c.fillStyle = g; c.fillRect(p.x - 57, p.y - 57, 114, 114);
      c.strokeStyle = '#263f46'; c.lineWidth = 3; c.beginPath(); c.moveTo(p.x + 5, p.y + 4); c.lineTo(p.x - 7, p.y - 12); c.stroke(); c.fillStyle = '#ffe2a5'; c.fillRect(p.x - 10, p.y - 14, 7, 4); return;
    }
    c.save(); c.translate(p.x, p.y);
    c.fillStyle = '#102d3266'; c.beginPath(); c.ellipse(15, 14, p.size, p.size * .6, .6, 0, TAU); c.fill();
    if (p.type === 'tree') {
      c.fillStyle = '#365c4d'; c.beginPath(); c.arc(0, 0, p.size, 0, TAU); c.fill();
      c.fillStyle = '#54795b'; c.beginPath(); c.arc(-4, -5, p.size * .72, 0, TAU); c.fill();
    } else {
      c.strokeStyle = '#847b5d'; c.lineWidth = 4; c.beginPath(); c.moveTo(7, 10); c.quadraticCurveTo(2, 3, 0, -5); c.stroke();
      c.translate(0, -7);
      for (let i = 0; i < 7; i++) {
        c.save(); c.rotate(i * TAU / 7 + Math.sin(p.x) * .4);
        c.fillStyle = i % 2 ? '#5c8971' : '#467565'; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(p.size * .7, -10, p.size, 3); c.quadraticCurveTo(p.size * .45, -2, 0, 0); c.fill();
        c.strokeStyle = '#81a07a66'; c.lineWidth = .8; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(p.size * .6, -5, p.size, 3); c.stroke(); c.restore();
      }
    }
    c.restore();
  }
  marker(c, state) {
    const target = missionTarget(state); if (!target) return;
    const pulse = 1 + Math.sin(state.time * 3) * .1;
    c.save(); c.translate(target.x, target.y); c.scale(pulse, pulse);
    const g = c.createRadialGradient(0, 0, 5, 0, 0, 49); g.addColorStop(0, '#ffd88635'); g.addColorStop(1, '#ffd88600'); c.fillStyle = g; c.fillRect(-50, -50, 100, 100);
    c.strokeStyle = '#ffdc96'; c.lineWidth = 2; c.beginPath(); c.ellipse(0, 0, 27, 14, 0, 0, TAU); c.stroke();
    c.translate(0, -31); c.rotate(Math.PI / 4); c.fillStyle = '#ffda8e'; c.fillRect(-7, -7, 14, 14); c.fillStyle = '#354349'; c.fillRect(-3, -3, 6, 6); c.restore();
    const m = currentMission(state); text(c, state.mission.active ? m?.contact.toUpperCase() || 'DESTINATION' : 'JOB', target.x, target.y - 53, 9, '#fff0c8', '800', 'center');
  }
  title(c, state) {
    const { w, h } = state.view;
    const g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#0a1a2af5'); g.addColorStop(.52, '#0e2334d9'); g.addColorStop(1, '#162d3b22'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    text(c, 'A CITY OF SECOND CHANCES', 69, 83, 11, COLORS.mint, '700');
    c.fillStyle = COLORS.mint; c.fillRect(69, 104, 47, 2);
    c.save(); c.transform(1, 0, -.12, 1, 0, 0);
    text(c, 'VICE', 95, h * .39, Math.min(124, w * .11), '#ff9ba8', '900');
    text(c, 'HORIZON', 105, h * .39 + 99, Math.min(97, w * .085), '#f5e4c7', '900'); c.restore();
    text(c, 'Neon nights. Dirty money. An open road.', 70, h * .39 + 147, 16, '#b6c6c1', '400');
    panel(c, 70, h - 203, 252, 51, .88); c.strokeStyle = '#91d8c880'; c.strokeRect(70.5, h - 202.5, 251, 50);
    text(c, 'ENTER', 88, h - 171, 12, COLORS.mint, '800'); text(c, 'START YOUR STORY', 155, h - 171, 11, '#e4e9d9', '800');
    text(c, 'L  CONTINUE SAVED GAME', 71, h - 122, 10, '#b0c1bb', '600');
    text(c, 'WASD  MOVE    F  STEAL A CAR    SPACE  FIRE    H  ALL CONTROLS', 70, h - 56, 10, '#8da6a6', '600');
    text(c, 'PEARL CITY, FL  /  22:14', w - 35, h - 57, 11, COLORS.gold, '600', 'right');
    text(c, 'OFFLINE OPEN WORLD  /  VOL. 01', w - 35, h - 34, 9, '#b6c8c0', '600', 'right');
    text(c, 'VH', w - 35, 58, 23, '#f1dec1', '900', 'right');
  }
  pause(c, state) {
    const { w, h } = state.view; c.fillStyle = '#0d1d2cbb'; c.fillRect(0, 0, w, h); panel(c, w / 2 - 230, h / 2 - 155, 460, 310, .96);
    text(c, 'TAKE A BREATHER', w / 2, h / 2 - 90, 30, '#f5dfbd', '900', 'center');
    text(c, 'P / ESC   RESUME', w / 2, h / 2 - 35, 13, COLORS.mint, '700', 'center');
    text(c, 'F5  SAVE     F9  LOAD', w / 2, h / 2 + 2, 12, '#bdcbc4', '600', 'center');
    text(c, 'H  CONTROLS     M  MUTE', w / 2, h / 2 + 38, 12, '#bdcbc4', '600', 'center');
    text(c, 'R  RESTART CITY', w / 2, h / 2 + 94, 11, '#e8b8a3', '600', 'center');
  }
  gameover(c, state) {
    const { w, h } = state.view, label = state.screen === 'gameover' ? state.endReason : state.screen;
    c.fillStyle = '#17202fcc'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#071726bb'; c.fillRect(0, h / 2 - 80, w, 162);
    text(c, label.toUpperCase(), w / 2, h / 2 + 2, 76, '#ff8c9c', '900', 'center');
    text(c, state.screen === 'gameover' ? 'ENTER  /  BACK TO THE STREETS     ·     L  /  LOAD SAVE' : 'The city always collects its debts.', w / 2, h / 2 + 46, 12, '#dfcfc3', '600', 'center');
  }
  help(c, state) {
    const { w, h } = state.view; c.fillStyle = '#081b2ce8'; c.fillRect(0, 0, w, h); panel(c, w / 2 - 310, h / 2 - 265, 620, 530, .95);
    text(c, 'THE STREETS ARE YOURS', w / 2, h / 2 - 214, 25, '#f3dfbd', '900', 'center');
    const rows = [['WASD / ARROWS', 'Walk / accelerate, brake, steer'], ['SHIFT', 'Run on foot / handbrake & drift'], ['F', 'Steal a nearby car / exit vehicle'], ['MOUSE', 'Aim on foot · left click fires'], ['SPACE', 'Fire weapon / throw a punch'], ['1 / 2 / 3 · Q / E', 'Fists / pistol / SMG · cycle'], ['ENTER', 'Accept the next contact’s job'], ['P / ESC', 'Pause / resume'], ['F5 / F9 · L', 'Save / load · continue from title'], ['M · H', 'Mute audio · close this help']];
    rows.forEach(([key, value], i) => { text(c, key, w / 2 - 270, h / 2 - 161 + i * 31, 11, COLORS.mint, '700'); text(c, value, w / 2 - 85, h / 2 - 161 + i * 31, 12, '#c5d0c7'); });
    text(c, 'Gold diamonds mark jobs. Pink blips mean police.', w / 2, h / 2 + 188, 12, COLORS.gold, '600', 'center');
    text(c, 'Stay out of sight to lose your stars. Complete jobs for cash & supplies.', w / 2, h / 2 + 214, 11, '#a7bab2', '500', 'center');
  }
}

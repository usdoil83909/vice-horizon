import { CITY, FLEET, INK, limit } from './config.js';
import { greenLight, borough } from './world.js';
import { destination, contract } from './missions.js';
import { lettering, dashboard, overlay, box } from './hud.js';

const CIRCLE = Math.PI * 2;
function rectangle(c, x, y, w, h, color) { c.fillStyle = color; c.fillRect(x, y, w, h); }
function disk(c, x, y, radius, color) { c.fillStyle = color; c.beginPath(); c.arc(x, y, radius, 0, CIRCLE); c.fill(); }
function line(c, x, y, xx, yy, color, width = 1) { c.strokeStyle = color; c.lineWidth = width; c.beginPath(); c.moveTo(x, y); c.lineTo(xx, yy); c.stroke(); }
export class CityRenderer {
  constructor(surface, city) {
    this.surface = surface; this.context = surface.getContext('2d', { alpha: false });
    this.camera = { x: 1580, y: 1072, zoom: 1 }; this.atlas = this.cartography(city);
  }
  cartography(city) {
    const map = document.createElement('canvas'); map.width = Math.ceil(CITY.width * .16); map.height = Math.ceil(CITY.height * .16);
    const c = map.getContext('2d'); c.scale(.16, .16);
    rectangle(c, 0, 0, CITY.width, CITY.height, '#1b5a66'); rectangle(c, 0, 0, CITY.shore, CITY.height, '#57665e');
    rectangle(c, CITY.shore, 0, 140, CITY.height, '#baa47e');
    for (const b of city.blocks) rectangle(c, b.x, b.y, b.w, b.h, '#748477');
    for (const r of city.roads) { rectangle(c, r.x - 10, r.y - 10, r.w + 20, r.h + 20, '#a2aa8f'); rectangle(c, r.x, r.y, r.w, r.h, '#2c424a'); }
    for (const b of city.buildings) rectangle(c, b.x, b.y, b.w, b.h, '#92a494');
    for (const p of city.parks) rectangle(c, p.x, p.y, p.w, p.h, '#4c8a65');
    return map;
  }
  paint(s, dt = 1 / 60) {
    const w = innerWidth, h = innerHeight, dpr = Math.min(2, devicePixelRatio || 1);
    if (this.surface.width !== Math.round(w * dpr) || this.surface.height !== Math.round(h * dpr)) { this.surface.width = Math.round(w * dpr); this.surface.height = Math.round(h * dpr); }
    s.viewport = { w, h, dpr };
    const p = s.hero, c = this.context, zoom = p.car ? .87 : 1.04, blend = 1 - Math.exp(-dt * 6);
    const lead = p.car ? limit(p.car.velocity * .22, -25, 70) : 0;
    this.camera.x += (p.x + Math.cos(p.angle) * lead - this.camera.x) * blend;
    this.camera.y += (p.y + Math.sin(p.angle) * lead - this.camera.y) * blend;
    this.camera.zoom += (zoom - this.camera.zoom) * blend;
    if (s.capture || s.tick < 2 || Math.hypot(p.x - this.camera.x, p.y - this.camera.y) > 950) Object.assign(this.camera, { x: p.x, y: p.y, zoom });
    const cam = this.camera, bounds = { x: cam.x - w / cam.zoom / 2 - 130, y: cam.y - h / cam.zoom / 2 - 130, w: w / cam.zoom + 260, h: h / cam.zoom + 260 };
    const visible = b => b.x + (b.w || 90) > bounds.x && b.x - 90 < bounds.x + bounds.w && b.y + (b.h || 90) > bounds.y && b.y - 90 < bounds.y + bounds.h;
    c.setTransform(dpr, 0, 0, dpr, 0, 0); rectangle(c, 0, 0, w, h, INK.sea);
    c.save(); c.translate(w / 2 + Math.sin(s.tick * 2.6) * s.trauma, h / 2 + Math.cos(s.tick * 1.8) * s.trauma * .5); c.scale(cam.zoom, cam.zoom); c.translate(-cam.x, -cam.y);
    this.pavement(c, s, bounds, visible);
    for (const mark of s.tracks) if (visible(mark)) {
      c.save(); c.translate(mark.x, mark.y); c.rotate(mark.angle);
      const ink = `rgba(9,22,30,${Math.min(.65, mark.ttl / 20)})`; line(c, -9, -11, 9, -11, ink, 3); line(c, -9, 11, 9, 11, ink, 3); c.restore();
    }
    for (const b of s.city.buildings) if (visible(b)) this.structure(c, b, s);
    this.beacon(c, s);
    for (const p of s.people) if (visible(p)) this.human(c, p, s, false);
    for (const e of s.hostiles) if (visible(e)) this.human(c, e, s, false, true);
    for (const v of s.cars) if (visible(v)) this.vehicle(c, v, s);
    if (!p.car) this.human(c, p, s, true);
    for (const prop of s.city.props) if (visible(prop)) this.furniture(c, prop, s);
    for (const bullet of s.projectiles) if (visible(bullet)) line(c, bullet.x, bullet.y, bullet.x - bullet.vx * .022, bullet.y - bullet.vy * .022, bullet.hostile ? '#ffa1a0' : '#ffe5ac', 2);
    for (const mote of s.motes) if (visible(mote)) { c.globalAlpha = Math.min(1, mote.ttl * 3); rectangle(c, mote.x, mote.y, mote.size, mote.size, mote.color); }
    c.globalAlpha = 1;
    if (s.muzzle) {
      c.save(); c.translate(p.x, p.y); c.rotate(p.angle); c.shadowColor = '#ffcf8c'; c.shadowBlur = 25;
      c.fillStyle = '#ffe9af'; c.beginPath(); c.moveTo(20, -5); c.lineTo(45, -3); c.lineTo(31, 1); c.lineTo(42, 8); c.lineTo(20, 5); c.fill(); c.restore();
    }
    if (s.chopper?.health > 0) this.helicopter(c, s.chopper, s);
    c.restore();
    const night = .06 + (Math.sin(s.clock / 145 - .3) + 1) * .075;
    rectangle(c, 0, 0, w, h, `rgba(18,20,55,${night})`);
    const dusk = c.createLinearGradient(0, h, w, 0); dusk.addColorStop(0, '#efb16d09'); dusk.addColorStop(1, '#ff82ac13'); c.fillStyle = dusk; c.fillRect(0, 0, w, h);
    const vignette = c.createRadialGradient(w * .5, h * .45, h * .2, w * .5, h * .5, w * .68); vignette.addColorStop(0, '#061c2800'); vignette.addColorStop(1, '#05172585'); c.fillStyle = vignette; c.fillRect(0, 0, w, h);
    if (s.mode === 'title') this.cover(c, s);
    else { dashboard(c, s, this.atlas); if (s.mode === 'pause') overlay(c, s, 'pause'); if (['wasted', 'busted', 'over'].includes(s.mode)) overlay(c, s, 'end'); }
    if (s.help) overlay(c, s, 'help');
    s.camera = { ...this.camera };
  }
  pavement(c, s, bounds, visible) {
    rectangle(c, 0, 0, CITY.shore, CITY.height, '#718374');
    rectangle(c, CITY.shore, 0, 144, CITY.height, '#d8bd8c');
    rectangle(c, CITY.shore - 74, 0, 45, CITY.height, '#c3b395');
    rectangle(c, CITY.shore + 144, 0, 18, CITY.height, '#91bca5');
    const water = c.createLinearGradient(CITY.shore + 150, 0, CITY.width, 0); water.addColorStop(0, '#399a9d'); water.addColorStop(.5, '#227c8d'); water.addColorStop(1, '#14576f'); c.fillStyle = water; c.fillRect(CITY.shore + 162, 0, 600, CITY.height);
    for (let y = Math.floor(bounds.y / 36) * 36; y < bounds.y + bounds.h; y += 36) {
      c.strokeStyle = '#c7f0d737'; c.lineWidth = 1.5; c.beginPath();
      for (let x = CITY.shore + 150; x < CITY.width + 200; x += 18) { const yy = y + Math.sin(x / 45 + y / 71 + s.clock * .3) * 5; if (x === CITY.shore + 150) c.moveTo(x, yy); else c.lineTo(x, yy); } c.stroke();
      line(c, CITY.shore - 73, y, CITY.shore - 29, y, '#877f6644');
    }
    for (const b of s.city.blocks) if (visible(b)) {
      rectangle(c, b.x, b.y, b.w, b.h, '#aaa58d');
      for (let y = b.y; y < b.y + b.h; y += 22) line(c, b.x, y, b.x + b.w, y, '#e5d6b51c');
    }
    for (const r of s.city.roads) if (visible(r)) {
      rectangle(c, r.x - 15, r.y - 15, r.w + 30, r.h + 30, '#b8b19a');
      rectangle(c, r.x - 2, r.y - 2, r.w + 4, r.h + 4, '#6d807d');
      rectangle(c, r.x, r.y, r.w, r.h, '#30444e');
    }
    for (const node of s.city.graph) {
      const x = node.x - 52, y = node.y - 52;
      if (!visible({ x, y, w: 480, h: 480 })) continue;
      line(c, x + 50, y + 125, x + 50, y + 457, '#e0c38488', 1.4); line(c, x + 54, y + 125, x + 54, y + 457, '#e0c38488', 1.4);
      line(c, x + 125, y + 50, x + 457, y + 50, '#e0c38488', 1.4); line(c, x + 125, y + 54, x + 457, y + 54, '#e0c38488', 1.4);
      for (let i = 0; i < 7; i++) { rectangle(c, x + 10 + i * 13, y + 111, 7, 14, '#d5d4b891'); rectangle(c, x + 111, y + 10 + i * 13, 14, 7, '#d5d4b891'); }
      for (let i = 0; i < 3; i++) { rectangle(c, x + 25, y + 190 + i * 86, 2, 28, '#c8d1bd3e'); rectangle(c, x + 77, y + 190 + i * 86, 2, 28, '#c8d1bd3e'); rectangle(c, x + 190 + i * 86, y + 25, 28, 2, '#c8d1bd3e'); rectangle(c, x + 190 + i * 86, y + 77, 28, 2, '#c8d1bd3e'); }
      lettering(c, ['SERENA BOULEVARD', 'SAN MARCO STREET', 'OCEAN DRIVE', 'PALMETTO AVENUE'][Math.floor(node.id / 9) % 4], x + 278, y + 91, 8, '#d4d7bc68', 700, 'center');
      if (node.signal) {
        rectangle(c, x + 108, y + 102, 7, 19, '#15343b');
        disk(c, x + 111.5, y + 107, 2.3, greenLight(node, s.clock, false) ? '#8de5ad' : '#ff8987');
        disk(c, x + 111.5, y + 115, 2.3, greenLight(node, s.clock, true) ? '#8de5ad' : '#ff8987');
      }
      c.save(); c.translate(x + 28, y + 251); c.rotate(Math.PI / 2); lettering(c, '↑', 0, 0, 17, '#d9dfca5c', 600, 'center'); c.restore();
    }
    for (const park of s.city.parks) if (visible(park)) {
      rectangle(c, park.x, park.y, park.w, park.h, '#527d60');
      line(c, park.x + 13, park.y + 160, park.x + 307, park.y + 160, '#b6aa83', 16); line(c, park.x + 160, park.y + 13, park.x + 160, park.y + 307, '#b6aa83', 16);
      disk(c, park.x + 160, park.y + 160, 37, '#b2b596'); disk(c, park.x + 160, park.y + 160, 30, '#488d92'); disk(c, park.x + 160, park.y + 160, 9, '#c3e6d5');
      lettering(c, 'PALMETTO GARDENS', park.x + 160, park.y + 290, 11, '#d6dfba', 700, 'center');
    }
    const hospital = s.city.landmarks.find(l => l.kind === 'hospital');
    if (visible(hospital)) { disk(c, hospital.x, hospital.y, 23, '#83e6b52a'); lettering(c, '+', hospital.x, hospital.y + 8, 27, '#a1f0c8', 800, 'center'); }
  }
  structure(c, b, s) {
    const lift = b.rise * .65;
    c.fillStyle = '#10232f55'; c.beginPath(); c.moveTo(b.x + 7, b.y + 4); c.lineTo(b.x + b.w + b.rise, b.y + 16); c.lineTo(b.x + b.w + b.rise, b.y + b.h + b.rise); c.lineTo(b.x + 13, b.y + b.h + b.rise); c.closePath(); c.fill();
    rectangle(c, b.x, b.y, b.w, b.h + 4, '#57616a');
    rectangle(c, b.x, b.y - lift, b.w, b.h, b.tone);
    rectangle(c, b.x + 4, b.y - lift + 4, b.w - 8, 3, '#eae3c352');
    rectangle(c, b.x + 4, b.y - lift + 4, 3, b.h - 8, '#ecdfbd40');
    c.strokeStyle = '#293d4f6b'; c.lineWidth = 4; c.strokeRect(b.x + 10, b.y - lift + 10, b.w - 20, b.h - 20);
    rectangle(c, b.x + 19, b.y - lift + 19, b.w - 38, b.h - 38, '#283f452c');
    if (b.kind === 'casino') {
      rectangle(c, b.x + 30, b.y - lift + 30, b.w - 60, b.h - 60, '#5d6877');
      c.strokeStyle = INK.rose; c.lineWidth = 2; c.strokeRect(b.x + 22, b.y - lift + 22, b.w - 44, b.h - 44);
      lettering(c, 'M', b.x + b.w / 2, b.y + b.h / 2 - lift + 25, 95, '#d7b3b6', 900, 'center');
      for (let i = 0; i < 5; i++) disk(c, b.x + 40 + i * 50, b.y + b.h - 21, 4, INK.gold);
    } else if (b.kind === 'hospital') {
      rectangle(c, b.x + b.w / 2 - 11, b.y + 52, 22, 75, '#d9e6cf'); rectangle(c, b.x + b.w / 2 - 37, b.y + 79, 74, 22, '#d9e6cf');
      disk(c, b.x + 50, b.y + 42, 23, '#344e5a'); lettering(c, 'H', b.x + 50, b.y + 49, 22, '#b2d6cf', 800, 'center');
    } else {
      rectangle(c, b.x + 26, b.y - lift + 26, 37, 27, '#465b65'); rectangle(c, b.x + 23, b.y - lift + 23, 37, 27, '#b5baaa');
      for (let n = 0; n < 5; n++) line(c, b.x + 28, b.y - lift + 28 + n * 4, b.x + 54, b.y - lift + 28 + n * 4, '#667d7d', 1.5);
      rectangle(c, b.x + b.w - 54, b.y - lift + 28, 29, 40, '#344f5c'); rectangle(c, b.x + b.w - 51, b.y - lift + 31, 23, 34, '#78a7ab');
      rectangle(c, b.x + 26, b.y - lift + b.h - 43, b.w * .32, 17, '#e0d7a734');
      if (b.kind === 'warehouse') for (let n = 0; n < 8; n++) line(c, b.x + 19, b.y + 60 + n * 24, b.x + b.w - 19, b.y + 60 + n * 24, '#e5dcc11c');
    }
    for (let n = 0; n < b.windows; n++) rectangle(c, b.x + 15 + n * (b.w - 30) / b.windows, b.y + b.h - 4, (b.w - 40) / b.windows - 6, 7, n % 3 ? '#e5c18b' : '#365564');
    if (b.sign) {
      const color = ['casino', 'shop'].includes(b.kind) ? INK.rose : INK.mint;
      rectangle(c, b.x + 12, b.y + b.h - 22, b.w - 24, 18, '#19313d');
      c.save(); c.shadowColor = color; c.shadowBlur = 9;
      lettering(c, b.sign, b.x + b.w / 2, b.y + b.h - 9, b.w > 200 ? 13 : 9, color, 800, 'center'); c.restore();
      line(c, b.x + 9, b.y + b.h + 6, b.x + b.w - 9, b.y + b.h + 6, color + '90', 1.5);
    }
    if (b.kind === 'police') lettering(c, '★  VHPD  ★', b.x + b.w / 2, b.y + 130, 28, '#c2d4d0', 800, 'center');
  }
  vehicle(c, v, s) {
    const spec = FLEET[v.kind], l = spec.length, w = spec.width;
    c.save(); c.translate(v.x, v.y); c.rotate(v.angle);
    if (v.health > 0 && (v.velocity || v === s.hero.car)) {
      const beam = c.createLinearGradient(l / 2, 0, l / 2 + 160, 0); beam.addColorStop(0, '#ffeab42d'); beam.addColorStop(1, '#ffeab400'); c.fillStyle = beam;
      c.beginPath(); c.moveTo(l / 2, -9); c.lineTo(l / 2 + 160, -63); c.lineTo(l / 2 + 160, 63); c.lineTo(l / 2, 9); c.fill();
    }
    c.fillStyle = '#07172170'; c.beginPath(); c.roundRect(-l / 2 + 5, -w / 2 + 6, l, w, 6); c.fill();
    rectangle(c, -l / 2 + 7, -w / 2 - 2, 11, w + 4, '#11232d'); rectangle(c, l / 2 - 17, -w / 2 - 2, 11, w + 4, '#11232d');
    c.fillStyle = v.wreck ? '#3b4548' : v.paint; c.beginPath(); c.roundRect(-l / 2, -w / 2, l, w, 5); c.fill();
    c.strokeStyle = '#edf0d76b'; c.lineWidth = 1; c.stroke();
    rectangle(c, -l * .24, -w / 2 + 2, l * .5, w - 4, '#244653');
    rectangle(c, -l * .14, -w / 2 + 3, l * .25, w - 6, v.wreck ? '#454e50' : v.paint);
    rectangle(c, l * .13, -w / 2 + 3, 4, w - 6, '#a4d7cd75');
    line(c, -l * .14, -w / 2 + 2, l * .06, -w / 2 + 2, '#f2ecc875', 1);
    for (const side of [-1, 1]) { rectangle(c, l / 2 - 3, side * (w / 2 - 6) - 2, 3, 5, '#d6f1ce'); rectangle(c, -l / 2, side * (w / 2 - 6) - 2, 2, 5, '#fd9290'); }
    rectangle(c, l / 2 - 7, -w / 2 - 3, 4, 3, v.paint); rectangle(c, l / 2 - 7, w / 2, 4, 3, v.paint);
    if (v.kind === 'cab') { rectangle(c, -5, -5, 11, 10, '#f9e7ad'); lettering(c, 'TAXI', 0, 2, 4, '#243c44', 800, 'center'); }
    if (v.kind === 'van') {
      rectangle(c, -l / 2 + 3, -w / 2 + 2, l * .63, w - 4, v.wreck ? '#42494b' : '#bcc2b3');
      for (let n = 0; n < 6; n++) line(c, -l / 2 + 8 + n * 6, -w / 2 + 5, -l / 2 + 8 + n * 6, w / 2 - 5, '#6d83876e');
    }
    if (v.kind === 'cruiser') {
      rectangle(c, -8, -w / 2 + 2, 14, w - 4, '#284754');
      const phase = Math.floor(s.clock * 9) % 2;
      c.shadowBlur = v.pursuit && s.stars ? 19 : 0; c.shadowColor = '#ff6f91'; rectangle(c, -3, -9, 6, 8, phase ? '#ff759a' : '#8d4764');
      c.shadowColor = '#78baff'; rectangle(c, -3, 1, 6, 8, phase ? '#486b9d' : '#78caff'); c.shadowBlur = 0;
      lettering(c, 'POLICE', -15, 2, 5, '#eff3db', 800, 'center');
    }
    if (v.health < v.maxHealth * .3) {
      disk(c, l / 2 - 6, -4, 9 + Math.sin(s.clock * 6) * 3, '#c8cbbb40');
      if (v.wreck) { line(c, -12, -8, 14, 8, '#101f28', 3); line(c, -10, 10, 15, -7, '#17272f', 2); }
    }
    c.restore();
  }
  human(c, p, s, player, hostile = false) {
    c.save(); c.translate(p.x, p.y); c.rotate(p.angle);
    if (p.health <= 0) { c.fillStyle = '#a4536966'; c.beginPath(); c.ellipse(0, 0, 14, 9, 0, 0, CIRCLE); c.fill(); rectangle(c, -11, -4, 21, 8, p.paint || '#d3c5a3'); c.restore(); return; }
    c.fillStyle = '#0e263368'; c.beginPath(); c.ellipse(5, 5, 10, 7, 0, 0, CIRCLE); c.fill();
    const gait = Math.sin(p.stride) * 3;
    rectangle(c, -8 + gait, -6, 9, 4, '#273c4d'); rectangle(c, -8 - gait, 2, 9, 4, '#273c4d');
    c.fillStyle = player ? '#eee3bc' : p.paint; c.beginPath(); c.ellipse(-1, 0, 6.5, 9, 0, 0, CIRCLE); c.fill();
    disk(c, 2, 0, 4.7, '#c99679'); disk(c, 0, -1, 3.6, '#30313a');
    if (player || hostile) { rectangle(c, 1, 5, player && s.fist ? 22 : 13, 3, '#d1a382'); if (hostile || s.hero.gun) rectangle(c, 12, 5, 9, 3, '#182d38'); }
    c.restore();
    if (player) { c.strokeStyle = INK.mint; c.lineWidth = 1.4; c.beginPath(); c.arc(p.x, p.y, 17, .2, 1.4); c.arc(p.x, p.y, 17, 3.35, 4.55); c.stroke(); }
  }
  furniture(c, p, s) {
    if (p.kind === 'bench') { rectangle(c, p.x - 16, p.y + 4, 35, 8, '#15323b55'); rectangle(c, p.x - 17, p.y - 4, 34, 3, '#c3a17b'); rectangle(c, p.x - 17, p.y + 1, 34, 3, '#c3a17b'); rectangle(c, p.x - 12, p.y - 7, 3, 14, '#304d52'); rectangle(c, p.x + 10, p.y - 7, 3, 14, '#304d52'); return; }
    if (p.kind === 'hydrant') { disk(c, p.x + 3, p.y + 4, 6, '#17353e55'); rectangle(c, p.x - 3, p.y - 5, 6, 11, '#e0aa78'); rectangle(c, p.x - 5, p.y - 1, 10, 3, '#efbd8a'); return; }
    if (p.kind === 'flowers') { rectangle(c, p.x - 17, p.y - 9, 34, 20, '#bf9a7e'); rectangle(c, p.x - 14, p.y - 7, 28, 14, '#4b7f62'); for (let n = 0; n < 5; n++) disk(c, p.x - 11 + n * 6, p.y - 3 + n % 2 * 5, 2.2, '#efa3b5'); return; }
    if (p.kind === 'lamp') {
      const glow = c.createRadialGradient(p.x, p.y, 1, p.x, p.y, 63); glow.addColorStop(0, '#ffdb9a22'); glow.addColorStop(1, '#ffdb9a00'); c.fillStyle = glow; c.fillRect(p.x - 63, p.y - 63, 126, 126);
      line(c, p.x + 5, p.y + 5, p.x - 7, p.y - 13, '#314b51', 3); rectangle(c, p.x - 11, p.y - 16, 8, 4, '#fbe2ac'); return;
    }
    if (p.kind === 'umbrella') {
      disk(c, p.x + 9, p.y + 10, p.size, '#5e765e33');
      for (let n = 0; n < 8; n++) { c.fillStyle = n % 2 ? '#f1d8a7' : '#cf8d91'; c.beginPath(); c.moveTo(p.x, p.y); c.arc(p.x, p.y, p.size, n * CIRCLE / 8, (n + 1) * CIRCLE / 8); c.closePath(); c.fill(); }
      rectangle(c, p.x - 7, p.y + 25, 13, 26, '#efe0b2'); line(c, p.x, p.y + 28, p.x, p.y + 48, '#ac9c77'); return;
    }
    c.save(); c.translate(p.x, p.y);
    c.fillStyle = '#123b3b4f'; c.beginPath(); c.ellipse(17, 17, p.size, p.size * .65, .6, 0, CIRCLE); c.fill();
    if (p.kind === 'tree') { disk(c, 0, 0, p.size, '#355e4d'); disk(c, -5, -6, p.size * .78, '#5c8962'); disk(c, 4, -10, p.size * .45, '#76996b'); }
    else {
      line(c, 7, 11, -1, -6, '#96876a', 4); c.translate(0, -7);
      for (let n = 0; n < 8; n++) {
        c.save(); c.rotate(n * CIRCLE / 8 + Math.sin(p.x) * .4 + Math.sin(s.clock * .6 + p.y) * .025);
        c.fillStyle = n % 2 ? '#72a180' : '#4b856c'; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(p.size * .65, -13, p.size, 3); c.quadraticCurveTo(p.size * .5, -1, 0, 0); c.fill();
        c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(p.size * .6, -6, p.size, 3); c.strokeStyle = '#b0bf8055'; c.lineWidth = .8; c.stroke(); c.restore();
      }
    }
    c.restore();
  }
  beacon(c, s) {
    const goal = destination(s); if (!goal) return;
    c.save(); c.translate(goal.x, goal.y);
    const pulse = 1 + Math.sin(s.clock * 3) * .12;
    const glow = c.createRadialGradient(0, 0, 1, 0, 0, 60); glow.addColorStop(0, '#ffdb8e38'); glow.addColorStop(1, '#ffdb8e00'); c.fillStyle = glow; c.fillRect(-60, -60, 120, 120);
    c.strokeStyle = INK.gold; c.lineWidth = 2; c.beginPath(); c.ellipse(0, 0, 31 * pulse, 17 * pulse, 0, 0, CIRCLE); c.stroke();
    c.save(); c.translate(0, -36); c.rotate(Math.PI / 4); rectangle(c, -8, -8, 16, 16, INK.gold); rectangle(c, -3, -3, 6, 6, '#425453'); c.restore();
    lettering(c, s.job.active ? 'DESTINATION' : 'NEW CONTACT', 0, -57, 9, '#ffe4ab', 800, 'center'); c.restore();
  }
  helicopter(c, h, s) {
    c.save(); c.translate(h.x, h.y);
    c.fillStyle = '#122a3547'; c.beginPath(); c.ellipse(42, 75, 48, 23, .3, 0, CIRCLE); c.fill();
    const beam = c.createRadialGradient(s.hero.x - h.x, s.hero.y - h.y, 0, s.hero.x - h.x, s.hero.y - h.y, 90); beam.addColorStop(0, '#fff5c82b'); beam.addColorStop(1, '#fff5c800'); c.fillStyle = beam; c.beginPath(); c.arc(s.hero.x - h.x, s.hero.y - h.y, 90, 0, CIRCLE); c.fill();
    c.rotate(h.angle); rectangle(c, -60, -4, 57, 8, '#879b9d'); rectangle(c, -62, -17, 8, 34, '#bed0c4');
    c.fillStyle = '#b5c9c0'; c.beginPath(); c.ellipse(0, 0, 28, 14, 0, 0, CIRCLE); c.fill(); c.fillStyle = '#2a5266'; c.beginPath(); c.ellipse(12, 0, 12, 11, 0, 0, CIRCLE); c.fill();
    line(c, -24, -21, 20, -21, '#1d3842', 3); line(c, -24, 21, 20, 21, '#1d3842', 3);
    c.rotate(s.clock * 40); line(c, -65, 0, 65, 0, '#cedbd38a', 4); line(c, 0, -65, 0, 65, '#cedbd38a', 4); disk(c, 0, 0, 6, '#3f616b'); c.restore();
  }
  cover(c, s) {
    const { w, h } = s.viewport;
    const gradient = c.createLinearGradient(0, 0, w, 0); gradient.addColorStop(0, '#0a1f30fa'); gradient.addColorStop(.52, '#132b3bde'); gradient.addColorStop(1, '#18344216'); c.fillStyle = gradient; c.fillRect(0, 0, w, h);
    lettering(c, 'AN OPEN WORLD. A SECOND CHANCE.', 66, 80, 11, INK.mint, 800);
    rectangle(c, 66, 101, 52, 3, INK.mint);
    c.save(); c.transform(1, 0, -.14, 1, 0, 0);
    lettering(c, 'VICE', 99, h * .4, Math.min(132, w * .113), INK.rose, 900);
    lettering(c, 'HORIZON', 112, h * .4 + 100, Math.min(99, w * .087), '#f6e2bf', 900); c.restore();
    lettering(c, 'Fast cars. Bad company. One way out.', 68, h * .4 + 145, 17, '#c0d0c5');
    box(c, 68, h - 198, 291, 53, .96); c.strokeStyle = '#8bdbbd80'; c.strokeRect(68.5, h - 197.5, 290, 52);
    lettering(c, 'ENTER', 87, h - 165, 13, INK.mint, 800); lettering(c, 'BEGIN YOUR STORY', 163, h - 165, 12, INK.white, 800);
    lettering(c, 'L  CONTINUE SAVED STORY', 69, h - 116, 11, '#b5c9bd', 600);
    lettering(c, '7 DISTRICTS   /   14 CONTRACTS   /   NO CLEAN GETAWAYS', 69, h - 69, 9, INK.gold, 700);
    lettering(c, 'WASD MOVE    F TAKE A CAR    SPACE ATTACK    H CONTROLS', 69, h - 39, 9, '#9bbab2', 600);
    lettering(c, 'PEARL CITY, FL', w - 36, h - 55, 13, INK.gold, 800, 'right');
    lettering(c, 'THE CITY ALWAYS COLLECTS.', w - 36, h - 34, 9, '#c2d2c7', 700, 'right');
    lettering(c, 'VH / 01', w - 36, 54, 22, '#e9d8bb', 900, 'right');
  }
}

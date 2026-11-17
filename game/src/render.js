import { CITY, FLEET, INK, limit } from './config.js';
import { greenLight } from './world.js';
import { destination } from './missions.js';
import { lettering, dashboard, overlay, box } from './hud.js';

const TAU = Math.PI * 2;
const rect = (c, x, y, w, h, color) => { c.fillStyle = color; c.fillRect(x, y, w, h); };
const dot = (c, x, y, r, color) => { c.fillStyle = color; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); };
const stroke = (c, x, y, xx, yy, color, width = 1) => {
  c.strokeStyle = color; c.lineWidth = width; c.beginPath(); c.moveTo(x, y); c.lineTo(xx, yy); c.stroke();
};
const inside = (item, view) => item && item.x + (item.w || 90) > view.x && item.x - 90 < view.x + view.w && item.y + (item.h || 90) > view.y && item.y - 90 < view.y + view.h;

export class CityRenderer {
  constructor(surface, city) {
    this.surface = surface;
    this.context = surface.getContext('2d', { alpha: false });
    this.camera = { x: 1580, y: 1072, zoom: 1 };
    this.atlas = this.cartography(city);
    this.city = city;
    this.session = null;
  }

  cartography(city) {
    const map = document.createElement('canvas');
    map.width = Math.ceil(CITY.width * .16);
    map.height = Math.ceil(CITY.height * .16);
    const c = map.getContext('2d');
    c.scale(.16, .16);
    rect(c, 0, 0, CITY.width, CITY.height, '#1b5a66');
    rect(c, 0, 0, CITY.shore, CITY.height, '#57665e');
    rect(c, CITY.shore, 0, 140, CITY.height, '#baa47e');
    for (const block of city.blocks) rect(c, block.x, block.y, block.w, block.h, '#748477');
    for (const road of city.roads) {
      rect(c, road.x - 10, road.y - 10, road.w + 20, road.h + 20, '#a2aa8f');
      rect(c, road.x, road.y, road.w, road.h, '#2c424a');
    }
    for (const building of city.buildings) rect(c, building.x, building.y, building.w, building.h, '#92a494');
    for (const park of city.parks) rect(c, park.x, park.y, park.w, park.h, '#4c8a65');
    return map;
  }

  paint(s, dt = 1 / 60) {
    const w = innerWidth;
    const h = innerHeight;
    const dpr = Math.min(2, devicePixelRatio || 1);
    if (this.surface.width !== Math.round(w * dpr) || this.surface.height !== Math.round(h * dpr)) {
      this.surface.width = Math.round(w * dpr);
      this.surface.height = Math.round(h * dpr);
    }
    s.viewport = { w, h, dpr };
    this.session = s;
    const player = s.hero;
    const c = this.context;
    const fit = Math.min(w / 780, h / 500);
    const zoom = (player.car ? .87 : 1.04) * limit(fit, .7, 2);
    const blend = 1 - Math.exp(-dt * 6);
    const lead = player.car ? limit(player.car.velocity * .22, -25, 70) : 0;
    this.camera.x += (player.x + Math.cos(player.angle) * lead - this.camera.x) * blend;
    this.camera.y += (player.y + Math.sin(player.angle) * lead - this.camera.y) * blend;
    this.camera.zoom += (zoom - this.camera.zoom) * blend;
    if (s.capture || s.tick < 2 || Math.hypot(player.x - this.camera.x, player.y - this.camera.y) > 950) {
      Object.assign(this.camera, { x: player.x, y: player.y, zoom });
    }
    const cam = this.camera;
    const view = { x: cam.x - w / cam.zoom / 2 - 130, y: cam.y - h / cam.zoom / 2 - 130, w: w / cam.zoom + 260, h: h / cam.zoom + 260 };
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    rect(c, 0, 0, w, h, INK.sea);
    c.save();
    c.translate(w / 2 + Math.sin(s.tick * 2.6) * s.trauma, h / 2 + Math.cos(s.tick * 1.8) * s.trauma * .5);
    c.scale(cam.zoom, cam.zoom);
    c.translate(-cam.x, -cam.y);
    this.pavement(c, s, view);
    for (const mark of s.tracks) if (inside(mark, view)) this.skid(c, mark);
    for (const building of s.city.buildings) if (inside(building, view)) this.structure(c, building);
    this.beacon(c, s);
    for (const person of s.people) if (inside(person, view)) this.human(c, person, false);
    for (const person of s.hostiles) if (inside(person, view)) this.human(c, person, false, true);
    for (const car of s.cars) if (inside(car, view)) this.vehicle(c, car, s);
    if (!player.car) this.human(c, player, true);
    for (const prop of s.city.props) if (inside(prop, view)) this.furniture(c, prop, s);
    for (const shot of s.projectiles) if (inside(shot, view)) {
      stroke(c, shot.x, shot.y, shot.x - shot.vx * .022, shot.y - shot.vy * .022, shot.hostile ? '#ffa1a0' : '#ffe5ac', 2);
    }
    for (const mote of s.motes) if (inside(mote, view)) {
      c.save();
      c.globalAlpha = Math.min(1, mote.ttl * 3);
      rect(c, mote.x, mote.y, mote.size, mote.size, mote.color);
      c.restore();
    }
    if (s.muzzle) this.flash(c, player);
    if (s.chopper?.health > 0) this.helicopter(c, s.chopper, s);
    c.restore();
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
    c.filter = 'none';
    c.save();
    this.ambient(c, w, h, s);
    if (s.mode === 'title') this.cover(c, s);
    else {
      dashboard(c, s, this.atlas);
      if (s.mode === 'pause') overlay(c, s, 'pause');
      if (['wasted', 'busted', 'over'].includes(s.mode)) overlay(c, s, 'end');
    }
    if (s.help) overlay(c, s, 'help');
    c.restore();
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
    c.filter = 'none';
    s.camera = { ...this.camera };
  }

  ambient(c, w, h, s) {
    const darkness = .06 + (Math.sin(s.clock / 145 - .3) + 1) * .075;
    rect(c, 0, 0, w, h, `rgba(18,20,55,${darkness})`);
    const shade = c.createRadialGradient(w / 2, h / 2, h * .2, w / 2, h / 2, w * .68);
    shade.addColorStop(0, '#061c2800');
    shade.addColorStop(1, '#05172585');
    c.fillStyle = shade;
    c.fillRect(0, 0, w, h);
  }

  pavement(c, s, view) {
    rect(c, 0, 0, CITY.shore, CITY.height, '#718374');
    rect(c, CITY.shore, 0, 144, CITY.height, '#d8bd8c');
    rect(c, CITY.shore - 74, 0, 45, CITY.height, '#c3b395');
    rect(c, CITY.shore + 144, 0, 18, CITY.height, '#91bca5');
    const water = c.createLinearGradient(CITY.shore + 150, 0, CITY.width, 0);
    water.addColorStop(0, '#399a9d'); water.addColorStop(.5, '#227c8d'); water.addColorStop(1, '#14576f');
    c.fillStyle = water;
    c.fillRect(CITY.shore + 162, 0, CITY.width - CITY.shore - 162, CITY.height);
    for (let y = Math.floor(view.y / 36) * 36; y < view.y + view.h; y += 36) {
      c.strokeStyle = '#c7f0d737'; c.lineWidth = 1.5; c.beginPath();
      for (let x = CITY.shore + 150; x < CITY.width + 200; x += 18) {
        const py = y + Math.sin(x / 45 + y / 71 + s.clock * .3) * 5;
        if (x === CITY.shore + 150) c.moveTo(x, py); else c.lineTo(x, py);
      }
      c.stroke();
    }
    for (const block of s.city.blocks) if (inside(block, view)) {
      rect(c, block.x, block.y, block.w, block.h, '#aaa58d');
      for (let y = block.y; y < block.y + block.h; y += 22) stroke(c, block.x, y, block.x + block.w, y, '#e5d6b51c');
    }
    for (const road of s.city.roads) if (inside(road, view)) {
      rect(c, road.x - 15, road.y - 15, road.w + 30, road.h + 30, '#b8b19a');
      rect(c, road.x - 2, road.y - 2, road.w + 4, road.h + 4, '#6d807d');
      rect(c, road.x, road.y, road.w, road.h, '#30444e');
      c.save(); c.strokeStyle = '#e7d39c99'; c.lineWidth = 2; c.setLineDash([22, 24]); c.beginPath();
      if (road.vertical) {
        c.moveTo(road.x + road.w / 2, Math.max(0, view.y));
        c.lineTo(road.x + road.w / 2, Math.min(CITY.height, view.y + view.h));
      } else {
        c.moveTo(Math.max(0, view.x), road.y + road.h / 2);
        c.lineTo(Math.min(CITY.width, view.x + view.w), road.y + road.h / 2);
      }
      c.stroke(); c.setLineDash([]); c.restore();
      for (const node of s.city.graph) if (node.x > view.x - 80 && node.x < view.x + view.w + 80 && node.y > view.y - 80 && node.y < view.y + view.h + 80) this.crossing(c, node);
    }
    for (const node of s.city.graph) {
      const x = node.x - 52, y = node.y - 52;
      if (!inside({ x, y, w: 480, h: 480 }, view)) continue;
      stroke(c, x + 50, y + 125, x + 50, y + 457, '#e0c38488', 1.4);
      stroke(c, x + 54, y + 125, x + 54, y + 457, '#e0c38488', 1.4);
      stroke(c, x + 125, y + 50, x + 457, y + 50, '#e0c38488', 1.4);
      stroke(c, x + 125, y + 54, x + 457, y + 54, '#e0c38488', 1.4);
      if (node.signal) {
        rect(c, x + 108, y + 102, 7, 19, '#15343b');
        dot(c, x + 111.5, y + 107, 2.3, greenLight(node, s.clock, false) ? '#8de5ad' : '#ff8987');
        dot(c, x + 111.5, y + 115, 2.3, greenLight(node, s.clock, true) ? '#8de5ad' : '#ff8987');
      }
      c.save(); c.translate(x + 78, y + 75); c.rotate(-Math.PI / 2);
      rect(c, -22, -3, 44, 8, '#203943'); rect(c, -20, -2, 40, 1, '#d9c18f');
      lettering(c, node.id % 2 ? `BAY ${node.id + 1}` : `PALM ${node.id + 1}`, 0, 3, 4.5, '#e1d7bd', 700, 'center');
      c.restore();
    }
    for (const park of s.city.parks) if (inside(park, view)) {
      rect(c, park.x, park.y, park.w, park.h, '#527d60');
      stroke(c, park.x + 13, park.y + 160, park.x + 307, park.y + 160, '#b6aa83', 16);
      stroke(c, park.x + 160, park.y + 13, park.x + 160, park.y + 307, '#b6aa83', 16);
      dot(c, park.x + 160, park.y + 160, 37, '#b2b596');
      dot(c, park.x + 160, park.y + 160, 30, '#488d92');
      dot(c, park.x + 160, park.y + 160, 19, '#65aeb0');
      lettering(c, 'PALMETTO GARDENS', park.x + 160, park.y + 290, 11, '#d6dfba', 700, 'center');
    }
  }

  crossing(c, node) {
    const x = node.x, y = node.y, half = 52;
    for (let i = -3; i <= 3; i++) {
      rect(c, x - half + i * 12, y - 46, 7, 20, '#e4dcc0a0');
      rect(c, x - half + i * 12, y + 26, 7, 20, '#e4dcc0a0');
      rect(c, x - 46, y - half + i * 12, 20, 7, '#e4dcc0a0');
      rect(c, x + 26, y - half + i * 12, 20, 7, '#e4dcc0a0');
    }
    rect(c, x - 62, y - 62, 8, 2, '#f7e6bb');
    rect(c, x + 54, y + 60, 8, 2, '#f7e6bb');
  }

  structure(c, b) {
    const lift = b.rise * .65;
    rect(c, b.x + 7, b.y + 5, b.w + b.rise, b.h + b.rise, '#10232f55');
    rect(c, b.x, b.y, b.w, b.h + 4, '#57616a');
    rect(c, b.x, b.y - lift, b.w, b.h, b.tone);
    rect(c, b.x + 4, b.y - lift + 4, b.w - 8, 3, '#eae3c352');
    c.strokeStyle = '#293d4f6b'; c.lineWidth = 4; c.strokeRect(b.x + 10, b.y - lift + 10, b.w - 20, b.h - 20);
    if (b.kind === 'casino') {
      rect(c, b.x + 30, b.y - lift + 30, b.w - 60, b.h - 60, '#5d6877');
      c.strokeStyle = INK.rose; c.lineWidth = 2; c.strokeRect(b.x + 22, b.y - lift + 22, b.w - 44, b.h - 44);
      lettering(c, 'M', b.x + b.w / 2, b.y + b.h / 2 - lift + 25, 95, '#d7b3b6', 900, 'center');
    } else if (b.kind === 'hospital') {
      rect(c, b.x + b.w / 2 - 11, b.y + 52, 22, 75, '#d9e6cf');
      rect(c, b.x + b.w / 2 - 37, b.y + 79, 74, 22, '#d9e6cf');
    } else {
      rect(c, b.x + 22, b.y + 22, 42, 28, '#b5baaa');
      rect(c, b.x + b.w - 54, b.y + 28, 29, 40, '#78a7ab');
    }
    const night = .42 + (Math.sin((this.session?.clock || 0) / 145 - .3) + 1) * .27;
    for (let n = 0; n < b.windows; n++) {
      const wx = b.x + 12 + n * (b.w - 26) / b.windows;
      const ww = Math.max(5, (b.w - 36) / b.windows - 5);
      const rows = Math.max(2, Math.floor((b.h - 36) / 35));
      for (let r = 0; r < rows; r++) {
        const lit = ((n * 7 + r * 3 + Math.floor(b.x / 9)) % 5) < Math.round(night * 5);
        rect(c, wx, b.y - lift + 16 + r * 30, ww, 17, lit ? '#f2c98c' : '#35515c');
        rect(c, wx + 2, b.y - lift + 18 + r * 30, 1, 13, '#f5ddb44f');
      }
    }
    if (b.kind === 'shop' && b.sign) {
      rect(c, b.x + 7, b.y + b.h - 30, b.w - 14, 23, '#173541');
      rect(c, b.x + 8, b.y + b.h - 30, b.w - 16, 3, '#f5ac8d');
      c.fillStyle = '#f0b17d66'; c.beginPath(); c.moveTo(b.x + 8, b.y + b.h - 7);
      c.lineTo(b.x + 21, b.y + b.h + 7); c.lineTo(b.x + b.w - 21, b.y + b.h + 7); c.lineTo(b.x + b.w - 8, b.y + b.h - 7); c.fill();
    }
    for (let n = 0; n < b.windows; n++) rect(c, b.x + 15 + n * (b.w - 30) / b.windows, b.y + b.h - 4, (b.w - 40) / b.windows - 6, 7, n % 3 ? '#e5c18b' : '#365564');
    if (b.sign) {
      rect(c, b.x + 12, b.y + b.h - 22, b.w - 24, 18, '#19313d');
      lettering(c, b.sign, b.x + b.w / 2, b.y + b.h - 9, b.w > 200 ? 13 : 9, b.kind === 'casino' ? INK.rose : INK.mint, 800, 'center');
    }
  }

  vehicle(c, v, s) {
    const spec = FLEET[v.kind], length = spec.length, width = spec.width;
    c.save(); c.translate(v.x, v.y); c.rotate(v.angle);
    if (v.health > 0 && (v.velocity || v === s.hero.car)) {
      const beam = c.createLinearGradient(length / 2, 0, length / 2 + 160, 0);
      beam.addColorStop(0, '#ffeab42d'); beam.addColorStop(1, '#ffeab400'); c.fillStyle = beam;
      c.beginPath(); c.moveTo(length / 2, -9); c.lineTo(length / 2 + 160, -63); c.lineTo(length / 2 + 160, 63); c.lineTo(length / 2, 9); c.fill();
    }
    c.fillStyle = v.wreck ? '#3b4548' : v.paint;
    c.beginPath(); c.roundRect(-length / 2, -width / 2, length, width, v.kind === 'truck' || v.kind === 'van' ? 3 : 7); c.fill();
    c.strokeStyle = '#edf0d76b'; c.lineWidth = 1.5; c.stroke();
    const cabin = v.kind === 'truck' || v.kind === 'van' ? length * .34 : length * .48;
    rect(c, -length * .16, -width / 2 + 2, cabin, width - 4, '#254a57');
    rect(c, length * .17, -width / 2 + 4, length * .18, width - 8, '#8eb3b766');
    stroke(c, -length * .18, -width * .35, -length * .18, width * .35, '#d5dfd878', 1.3);
    rect(c, -length * .43, -width / 2 - 3, length * .17, 3, '#192c32');
    rect(c, length * .25, width / 2, length * .17, 3, '#192c32');
    rect(c, -length * .4, -width * .32, length * .27, 2, '#f3deb873');
    rect(c, -length * .4, width * .32, length * .27, 2, '#f3deb873');
    for (const side of [-1, 1]) {
      rect(c, length / 2 - 3, side * (width / 2 - 6) - 2, 3, 5, '#d6f1ce');
      rect(c, -length / 2, side * (width / 2 - 6) - 2, 2, 5, '#fd9290');
    }
    if (v.kind === 'cab') { rect(c, -5, -4, 13, 8, '#f5dc92'); lettering(c, 'TAXI', 1, 3, 5, '#293843', 800, 'center'); }
    if (v.kind === 'truck') rect(c, -length * .47, -width * .38, length * .3, width * .76, '#8b9991');
    if (v.kind === 'cruiser') {
      rect(c, -3, -9, 6, 8, Math.floor(s.clock * 9) % 2 ? '#ff759a' : '#8d4764');
      rect(c, -3, 1, 6, 8, '#78caff');
    }
    if (v.health < v.maxHealth * .3) dot(c, length / 2 - 6, -4, 9 + Math.sin(s.clock * 6) * 3, '#c8cbbb40');
    c.restore();
  }

  human(c, p, player, hostile = false) {
    c.save(); c.translate(p.x, p.y); c.rotate(p.angle);
    if (p.health <= 0) {
      c.fillStyle = '#a4536966'; c.beginPath(); c.ellipse(0, 0, 14, 9, 0, 0, TAU); c.fill(); c.restore(); return;
    }
    const bob = Math.sin((p.stride || 0) * 11) * 2;
    stroke(c, -5, -4, -9 - bob, -7, '#252e32', 2);
    stroke(c, -5, 4, -9 + bob, 7, '#252e32', 2);
    c.fillStyle = player ? '#eee3bc' : hostile ? '#e47d92' : p.paint;
    c.beginPath(); c.ellipse(-1, 0, 7, 9, 0, 0, TAU); c.fill();
    c.fillStyle = '#314550'; c.beginPath(); c.ellipse(-2, 0, 4.7, 6.6, 0, 0, TAU); c.fill();
    dot(c, 4, 0, 4.6, '#c99679'); dot(c, 5.5, -1.2, .8, '#28353b');
    stroke(c, 1, 5, player || hostile ? 19 : 8, 5 + bob, '#d1a382', 2.5);
    c.restore();
    if (player) {
      c.strokeStyle = INK.mint; c.lineWidth = 1.4; c.beginPath();
      c.arc(p.x, p.y, 17, .2, 1.4); c.arc(p.x, p.y, 17, 3.35, 4.55); c.stroke();
    }
  }

  furniture(c, p) {
    if (p.kind === 'lamp') { stroke(c, p.x + 5, p.y + 5, p.x - 7, p.y - 13, '#314b51', 3); dot(c, p.x - 8, p.y - 15, 3, '#fbe2ac'); return; }
    if (p.kind === 'hydrant') { rect(c, p.x - 3, p.y - 5, 6, 11, '#e0aa78'); return; }
    if (p.kind === 'bench') { rect(c, p.x - 17, p.y - 4, 34, 7, '#c3a17b'); return; }
    if (p.kind === 'flowers') {
      rect(c, p.x - 14, p.y - 8, 28, 16, '#4b7f62');
      for (let i = 0; i < 5; i++) dot(c, p.x - 11 + i * 6, p.y - 3 + i % 2 * 5, 2, '#efa3b5');
      return;
    }
    c.save(); c.translate(p.x, p.y); dot(c, 0, 0, p.size, '#5c8962');
    if (p.kind === 'palm') for (let i = 0; i < 7; i++) { c.save(); c.rotate(i * TAU / 7); stroke(c, 0, 0, p.size, 0, '#72a180', 3); c.restore(); }
    c.restore();
  }

  skid(c, mark) {
    c.save(); c.translate(mark.x, mark.y); c.rotate(mark.angle);
    const alpha = `rgba(9,22,30,${Math.min(.65, mark.ttl / 20)})`;
    stroke(c, -9, -11, 9, -11, alpha, 3); stroke(c, -9, 11, 9, 11, alpha, 3); c.restore();
  }

  flash(c, p) {
    c.save(); c.translate(p.x, p.y); c.rotate(p.angle); c.shadowColor = '#ffcf8c'; c.shadowBlur = 25; c.fillStyle = '#ffe9af';
    c.beginPath(); c.moveTo(20, -5); c.lineTo(45, -3); c.lineTo(31, 1); c.lineTo(42, 8); c.lineTo(20, 5); c.fill(); c.restore();
  }

  beacon(c, s) {
    const target = destination(s);
    if (!target) return;
    c.save(); c.translate(target.x, target.y); c.strokeStyle = INK.gold; c.lineWidth = 2;
    c.beginPath(); c.ellipse(0, 0, 31, 17, 0, 0, TAU); c.stroke();
    c.save(); c.translate(0, -36); c.rotate(Math.PI / 4); rect(c, -8, -8, 16, 16, INK.gold); c.restore();
    lettering(c, s.job.active ? 'DESTINATION' : 'NEW CONTACT', 0, -57, 9, '#ffe4ab', 800, 'center'); c.restore();
  }

  helicopter(c, h, s) {
    c.save(); c.translate(h.x, h.y); c.rotate(h.angle); c.fillStyle = '#b5c9c0';
    c.beginPath(); c.ellipse(0, 0, 28, 14, 0, 0, TAU); c.fill();
    c.fillStyle = '#91bac0'; c.beginPath(); c.ellipse(7, -1, 13, 8, 0, 0, TAU); c.fill();
    rect(c, -60, -4, 35, 8, '#879b9d'); stroke(c, -68, 0, 68, 0, '#cedbd38a', 3);
    stroke(c, -2, -25, -2, 25, '#cedbd38a', 2); c.restore();
    if (s.stars >= 3) {
      c.save(); c.translate(h.x, h.y); c.rotate(h.angle); c.fillStyle = '#e7f0b619'; c.beginPath();
      c.moveTo(20, 8); c.lineTo(150, -75); c.lineTo(280, 8); c.lineTo(150, 82); c.closePath(); c.fill(); c.restore();
    }
  }

  cover(c, s) {
    const { w, h } = s.viewport;
    c.fillStyle = '#0b2232c9'; c.fillRect(0, 0, w, h);
    lettering(c, 'AN OPEN WORLD. A SECOND CHANCE.', 66, 80, 11, INK.mint, 800);
    c.save(); c.transform(1, 0, -.14, 1, 0, 0);
    lettering(c, 'VICE', 99, h * .4, Math.min(132, w * .113), INK.rose, 900);
    lettering(c, 'HORIZON', 112, h * .4 + 100, Math.min(99, w * .087), '#f6e2bf', 900); c.restore();
    lettering(c, 'Fast cars. Bad company. One way out.', 68, h * .4 + 145, 17, '#c0d0c5');
    box(c, 68, h - 198, 291, 53, .96);
    lettering(c, 'ENTER', 87, h - 165, 13, INK.mint, 800);
    lettering(c, 'BEGIN YOUR STORY', 163, h - 165, 12, INK.white, 800);
    lettering(c, 'L  CONTINUE SAVED STORY', 69, h - 116, 11, '#b5c9bd', 600);
    lettering(c, '7 DISTRICTS  /  14 CONTRACTS  /  NO CLEAN GETAWAYS', 69, h - 69, 9, INK.gold, 700);
    lettering(c, 'WASD MOVE    F TAKE A CAR    SPACE ATTACK    H CONTROLS', 69, h - 39, 9, '#9bbab2', 600);
    lettering(c, 'PEARL CITY, FL', w - 36, h - 55, 13, INK.gold, 800, 'right');
  }
}

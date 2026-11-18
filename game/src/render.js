import { palette, districts, WIDTH, HEIGHT } from './config.js';

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  return {
    ctx, camera: { x: 0, y: 0, zoom: 1 },
    draw(state, mode) {
      const scale = Math.min(1.5, devicePixelRatio || 1);
      const width = canvas.width / scale, height = canvas.height / scale;
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const driving = state.player.state === 'drive';
      const lead = driving ? 180 : 70;
      const camera = this.camera;
      camera.x += (state.player.x + Math.cos(state.player.angle) * lead - camera.x) * .08;
      camera.y += (state.player.y + Math.sin(state.player.angle) * lead - camera.y) * .08;
      camera.zoom += ((driving ? .82 : 1) - camera.zoom) * .04;
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.scale(camera.zoom, camera.zoom);
      ctx.translate(-camera.x, -camera.y);
      ctx.fillStyle = palette.grass;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      water(ctx, state.city);
      for (const district of districts) {
        ctx.fillStyle = district.tone + '12';
        ctx.fillRect(district.x, district.y, district.w, district.h);
      }
      roads(ctx, state.city);
      signs(ctx, state.city);
      buildings(ctx, state.city, camera, width, height);
      greenery(ctx, state.city);
      vehicles(ctx, state.entities.cars, camera, width, height);
      pedestrians(ctx, state.entities.peds, camera, width, height);
      for (const item of state.entities.pickups) {
        if (!item.taken) circle(ctx, item.x, item.y, 7, item.type === 'cash' ? palette.yellow : palette.neon);
      }
      ctx.strokeStyle = palette.yellow;
      ctx.lineWidth = 3;
      for (const bullet of state.entities.projectiles) line(ctx, bullet.x, bullet.y, bullet.x - Math.cos(bullet.angle) * 10, bullet.y - Math.sin(bullet.angle) * 10);
      particles(ctx, state.entities.particles);
      actor(ctx, state.player);
      if (state.mission.active) {
        const marker = state.mission.marker;
        ctx.strokeStyle = palette.pink;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(marker.x, marker.y, 24, 0, Math.PI * 2); ctx.stroke();
        line(ctx, marker.x, marker.y - 35, marker.x, marker.y - 14);
      }
      ctx.restore();
      const shade = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * .25, width / 2, height / 2, Math.max(width, height) * .7);
      shade.addColorStop(0, 'transparent');
      shade.addColorStop(1, state.police.wanted ? 'rgba(255,35,80,.22)' : 'rgba(0,0,0,.42)');
      ctx.fillStyle = shade;
      ctx.fillRect(0, 0, width, height);
    },
  };
}

function visible(item, camera, width, height, padding = 120) {
  return item.x > camera.x - width / 2 - padding && item.x < camera.x + width / 2 + padding && item.y > camera.y - height / 2 - padding && item.y < camera.y + height / 2 + padding;
}
function line(ctx, x, y, endX, endY) {
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(endX, endY); ctx.stroke();
}
function circle(ctx, x, y, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
}
function water(ctx, city) {
  ctx.fillStyle = palette.water;
  ctx.fillRect(city.x, city.y, city.w, city.h);
  ctx.strokeStyle = palette.foam;
  ctx.lineWidth = 2;
  for (const foam of city.foam) line(ctx, foam.x, foam.y, foam.x + foam.w, foam.y);
}
function roads(ctx, city) {
  ctx.fillStyle = palette.asphalt;
  for (const road of city.roads) ctx.fillRect(road.x, road.y, road.w, road.h);
  ctx.strokeStyle = '#8b8290';
  ctx.lineWidth = 2;
  ctx.setLineDash([15, 15]);
  for (const road of city.roads) {
    if (road.vertical) line(ctx, road.x + road.w / 2, road.y, road.x + road.w / 2, road.y + road.h);
    else line(ctx, road.x, road.y + road.h / 2, road.x + road.w, road.y + road.h / 2);
  }
  ctx.setLineDash([]);
}
function signs(ctx, city) {
  ctx.font = 'bold 12px Arial';
  for (const sign of city.landmarks) {
    ctx.fillStyle = '#14182c';
    ctx.fillRect(sign.x - sign.w / 2, sign.y - sign.h / 2, sign.w, sign.h);
    ctx.strokeStyle = palette.pink;
    ctx.strokeRect(sign.x - sign.w / 2, sign.y - sign.h / 2, sign.w, sign.h);
    ctx.fillStyle = palette.neon;
    ctx.textAlign = 'center';
    ctx.fillText(sign.name, sign.x, sign.y + 4);
  }
  ctx.textAlign = 'left';
}
function buildings(ctx, city, camera, width, height) {
  for (const building of city.buildings) {
    if (!visible(building, camera, width, height)) continue;
    ctx.fillStyle = 'rgba(0,0,0,.32)';
    ctx.fillRect(building.x + 10, building.y + 13, building.w, building.h);
    ctx.fillStyle = building.tone;
    ctx.fillRect(building.x, building.y, building.w, building.h);
    ctx.strokeStyle = '#61657b';
    ctx.strokeRect(building.x, building.y, building.w, building.h);
    for (const window of building.windows) {
      ctx.fillStyle = window.on ? '#ffd76a' : '#17253d';
      ctx.fillRect(window.x, window.y, 7, 9);
    }
  }
}
function greenery(ctx, city) {
  for (const park of city.parks) {
    ctx.fillStyle = park.tone + '44';
    ctx.fillRect(park.x, park.y, park.w, park.h);
    for (let x = park.x + 15; x < park.x + park.w; x += 35) circle(ctx, x, park.y + 30, 11, palette.palm);
  }
  for (const palm of city.palms) {
    ctx.strokeStyle = '#8d694e'; ctx.lineWidth = 4;
    line(ctx, palm.x, palm.y + 22, palm.x + palm.lean * 15, palm.y - 14);
    ctx.fillStyle = palette.palm;
    for (let leaf = 0; leaf < 5; leaf++) {
      ctx.beginPath(); ctx.ellipse(palm.x + palm.lean * 15, palm.y - 16, 19, 5, leaf * 1.25, 0, Math.PI * 2); ctx.fill();
    }
  }
}
function vehicles(ctx, cars, camera, width, height) {
  for (const car of cars) {
    if (car.dead || !visible(car, camera, width, height)) continue;
    ctx.save(); ctx.translate(car.x, car.y); ctx.rotate(car.rotation);
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(-17, -8, 38, 22);
    ctx.fillStyle = car.color; ctx.fillRect(-19, -10, 38, 19);
    ctx.fillStyle = car.police ? '#243c82' : '#c9d1da'; ctx.fillRect(-5, -7, 13, 13);
    if (car.police) { ctx.fillStyle = '#ff5365'; ctx.fillRect(-4, -13, 8, 3); }
    ctx.restore();
  }
}
function pedestrians(ctx, people, camera, width, height) {
  for (const person of people) {
    if (person.health <= 0 || !visible(person, camera, width, height)) continue;
    ctx.fillStyle = person.shirt; ctx.fillRect(person.x - 5, person.y - 7, 10, 14);
    circle(ctx, person.x, person.y - 11, 5, person.color);
  }
}
function particles(ctx, items) {
  for (const item of items) {
    item.life--;
    ctx.fillStyle = item.color; ctx.globalAlpha = Math.max(0, item.life / 40);
    ctx.fillRect(item.x, item.y, 5, 5);
  }
  ctx.globalAlpha = 1;
  for (let i = items.length - 1; i >= 0; i--) if (items[i].life <= 0) items.splice(i, 1);
}
function actor(ctx, player) {
  if (player.state === 'drive') return;
  ctx.save(); ctx.translate(player.x, player.y); ctx.rotate(player.angle);
  circle(ctx, 0, -9, 7, '#f5f2df');
  ctx.fillStyle = palette.pink; ctx.fillRect(-7, -2, 14, 18);
  ctx.fillStyle = palette.neon; ctx.fillRect(7, 2, 12, 3);
  ctx.restore();
}

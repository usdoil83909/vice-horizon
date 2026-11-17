import { angleDiff, distance, clamp } from './config.js';
import { move } from './world.js';

function chooseNext(state, car, node) {
  let options = node.neighbors.filter(n => n !== car.previousNode);
  if (!options.length) options = node.neighbors;
  const straight = options.find(n => Math.abs(angleDiff(Math.atan2(n.y - node.y, n.x - node.x), car.angle)) < .5);
  return straight && state.world.rng() < .7 ? straight : options[Math.floor(state.world.rng() * options.length)];
}
export function updateTraffic(state, dt) {
  for (const car of state.cars) {
    if (!car.ai || car.type === 'police' || car.hp <= 0 || distance(car, state.player) > 1450) continue;
    if (!car.targetNode) {
      // Select the next real intersection ahead in the current travel direction.
      const ahead = state.world.nodes.filter(n => {
        const dx = n.x - car.x, dy = n.y - car.y;
        return dx * Math.cos(car.angle) + dy * Math.sin(car.angle) > 5 && Math.abs(-dx * Math.sin(car.angle) + dy * Math.cos(car.angle)) < 65;
      });
      car.targetNode = (ahead.length ? ahead : state.world.nodes).reduce((a, b) => distance(a, car) < distance(b, car) ? a : b);
    }
    const target = car.targetNode;
    const heading = car.routeAngle ?? (Math.round(car.angle / (Math.PI / 2)) * Math.PI / 2);
    const tx = target.x - Math.sin(heading) * 22, ty = target.y + Math.cos(heading) * 22;
    if (Math.hypot(tx - car.x, ty - car.y) < 16) {
      const next = chooseNext(state, car, target);
      car.previousNode = target; car.targetNode = next;
      car.routeAngle = Math.atan2(next.y - target.y, next.x - target.x);
      continue;
    }
    const desired = Math.atan2(ty - car.y, tx - car.x);
    const turn = angleDiff(desired, car.angle);
    car.angle += clamp(turn, -2.8 * dt, 2.8 * dt);
    let targetSpeed = (car.type === 'truck' ? 68 : 100) * (Math.abs(turn) > .5 ? .55 : 1);
    for (const other of state.cars) {
      if (other === car || other.hp <= 0) continue;
      const dx = other.x - car.x, dy = other.y - car.y;
      const ahead = dx * Math.cos(car.angle) + dy * Math.sin(car.angle), side = Math.abs(-dx * Math.sin(car.angle) + dy * Math.cos(car.angle));
      if (ahead > 0 && ahead < 85 && side < 26) targetSpeed = Math.min(targetSpeed, Math.max(0, (ahead - 42) * 1.5));
    }
    car.speed += (targetSpeed - car.speed) * Math.min(1, dt * 2);
    if (move(state.world, car, Math.cos(car.angle) * car.speed * dt, Math.sin(car.angle) * car.speed * dt, 18)) {
      car.angle += Math.PI / 2; car.speed = 12; car.targetNode = null; car.routeAngle = undefined;
    }
  }
}

import { distance } from './config.js';
import { createCar } from './entities.js';

export const MISSIONS = [
  { title: 'A FRESH START', contact: 'Rosa', text: 'Welcome back. Come see me at the café. We have work to do.', type: 'goto', target: { x: 1100, y: 990 }, reward: 500, objective: 'Meet Rosa at Café Palma' },
  { title: 'BORROWED TIME', contact: 'Rosa', text: 'That mint Aurora on 9th? The owner owes us. Bring it to my garage.', type: 'steal', target: { x: 1390, y: 970 }, delivery: { x: 1810, y: 1410 }, reward: 1800, objective: 'Steal the marked Aurora GT' },
  { title: 'SOUTHBOUND', contact: 'Nico', text: 'Take the package to the port. Seventy-five seconds. No questions.', type: 'timed', target: { x: 2250, y: 3130 }, seconds: 75, reward: 2400, objective: 'Deliver Nico’s package to Port Meridian' },
  { title: 'COAST TO COAST', contact: 'Val', text: 'Four checkpoints, one city. Show me you can drive.', type: 'race', target: { x: 3130, y: 2250 }, route: [{ x: 3130, y: 2250 }, { x: 3570, y: 1810 }, { x: 3570, y: 930 }, { x: 2690, y: 490 }], seconds: 110, reward: 3500, objective: 'Cross the coastal race checkpoints' },
  { title: 'LOOSE ENDS', contact: 'Nico', text: 'The Ironworks crew took our money. Clear their lookout at the warehouse.', type: 'eliminate', target: { x: 930, y: 2780 }, reward: 4200, objective: 'Take out the Ironworks lookouts' },
  { title: 'HEAT WAVE', contact: 'Val', text: 'They made your plate. Shake the cops and lay low in Palm Grove.', type: 'escape', target: { x: 2250, y: 1810 }, reward: 5000, objective: 'Lose the two-star wanted level, then reach Palm Grove' },
  { title: 'HEAVY FREIGHT', contact: 'Rosa', text: 'One last pickup: a cargo truck at the docks. Bring it home in one piece.', type: 'steal', vehicle: 'truck', target: { x: 2690, y: 3150 }, delivery: { x: 1370, y: 2250 }, reward: 6500, objective: 'Steal the marked Atlas Cargo' },
  { title: 'THE HORIZON JOB', contact: 'Rosa', text: 'Everyone gets a cut. Get the handoff to Ocean Beach. The city is yours.', type: 'timed', target: { x: 3570, y: 1370 }, seconds: 95, reward: 12000, objective: 'Make the final handoff at Ocean Beach' },
];
export function currentMission(state) { return MISSIONS[state.mission.index] || null; }
export function missionTarget(state) {
  const m = currentMission(state); if (!m) return null;
  if (m.type === 'steal' && state.mission.phase === 1) return m.delivery;
  if (m.type === 'race') return m.route[state.mission.checkpoint] || m.target;
  return m.target;
}
export function startMission(state) {
  const m = currentMission(state); if (!m) return;
  state.mission.active = true; state.mission.phase = 0; state.mission.checkpoint = 0; state.mission.timer = m.seconds || 0;
  state.mission.dialog = 8; state.mission.failed = false;
  if (m.type === 'steal') {
    const car = createCar(state.world, m.vehicle || 'sports', m.target.x, m.target.y, 0);
    car.ai = false; car.driver = false; car.color = '#90e9cc'; state.cars.push(car); state.mission.car = car;
  }
  if (m.type === 'eliminate') {
    state.enemies = Array.from({ length: 4 }, (_, i) => ({ x: m.target.x + (i % 2) * 55, y: m.target.y + Math.floor(i / 2) * 45, hp: 65, cooldown: 1 + i * .3, angle: 0, color: '#d36b74' }));
  }
  if (m.type === 'escape') state.crime(2, 'WANTED FOR QUESTIONING');
  state.notice = { text: `NEW JOB  /  ${m.title}`, time: 5 }; state.audio.blip(700);
}
export function updateMissions(state, dt, controls) {
  const m = currentMission(state); if (!m) return;
  state.mission.dialog = Math.max(0, state.mission.dialog - dt);
  if (!state.mission.active) { if (controls.tap('Enter')) startMission(state); return; }
  const p = state.player, target = missionTarget(state);
  if (m.seconds) {
    state.mission.timer -= dt;
    if (state.mission.timer <= 0) { failMission(state, 'Time ran out. Press Enter to retry.'); return; }
  }
  if (m.type === 'steal') {
    if (state.mission.car.hp <= 0) { failMission(state, 'Vehicle destroyed. Press Enter to retry.'); return; }
    if (p.vehicle === state.mission.car && state.mission.phase === 0) { state.mission.phase = 1; state.notice = { text: 'Vehicle acquired. Deliver it to Rosa’s garage.', time: 5 }; }
    if (state.mission.phase === 1 && p.vehicle === state.mission.car && distance(p, target) < 70) completeMission(state);
  } else if (m.type === 'eliminate') {
    if (state.enemies.length && state.enemies.every(e => e.hp <= 0)) completeMission(state);
  } else if (m.type === 'escape') {
    if (state.wanted === 0 && distance(p, target) < 80) completeMission(state);
  } else if (distance(p, target) < 65) {
    if (m.type === 'race') {
      if (!p.vehicle) { state.notice = { text: 'You need a vehicle to race.', time: 2 }; return; }
      state.mission.checkpoint++; state.audio.blip(880);
      if (state.mission.checkpoint >= m.route.length) completeMission(state);
    } else completeMission(state);
  }
}
export function failMission(state, message) {
  state.mission.active = false; state.mission.failed = true; state.enemies = [];
  state.notice = { text: message, time: 7 };
}
function completeMission(state) {
  const m = currentMission(state); state.player.money += m.reward;
  state.notice = { text: `JOB COMPLETE  /  ${m.title}  /  +$${m.reward.toLocaleString('en-US')}`, time: 7 };
  state.mission.index++; state.mission.active = false; state.enemies = []; state.audio.blip(1100);
  state.player.hp = Math.min(100, state.player.hp + 25); state.player.armor = Math.min(100, state.player.armor + 15);
  state.player.ammo[1] += 36; state.player.ammo[2] += 60;
  state.save();
}
export function objective(state) {
  const m = currentMission(state);
  if (!m) return 'All eight jobs complete. The city is yours. Explore freely.';
  if (!state.mission.active) return `${state.mission.failed ? 'Retry job' : 'New contact'}: ${m.contact}  ·  Press ENTER to accept`;
  if (m.type === 'steal' && state.mission.phase === 1) return 'Deliver the vehicle to Rosa’s garage';
  if (m.type === 'race') return `${m.objective}  ·  ${state.mission.checkpoint + 1} / ${m.route.length}`;
  return m.objective;
}

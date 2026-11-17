import { gap } from './config.js';
import { automobile } from './entities.js';

const point = (x, y) => ({ x, y });
export const CONTRACTS = [
  { name: 'WELCOME TO PARADISE', contact: 'Lucia Reyes', chapter: 'THE ARRIVAL', kind: 'meet', goal: point(1706, 1070), pay: 650, line: 'You came back. Good. Meet me outside the café. We start small.', objective: 'Meet Lucia at Café Lucia' },
  { name: 'SOMEBODY ELSE’S KEYS', contact: 'Lucia Reyes', chapter: 'THE ARRIVAL', kind: 'theft', goal: point(1980, 1037), drop: point(2460, 1550), pay: 1600, line: 'Mint green Comet, parked on Palmetto. Bring it to the garage. No scratches.', objective: 'Take the marked Comet Cabrio' },
  { name: 'SPECIAL DELIVERY', contact: 'Nico Santos', chapter: 'THE ARRIVAL', kind: 'courier', goal: point(2950, 3470), seconds: 115, pay: 2300, line: 'The manifest says flowers. Let’s keep it that way. Get to the port.', objective: 'Deliver the sealed case to Port Serena' },
  { name: 'AFTER HOURS', contact: 'Jade Chen', chapter: 'FAST COMPANY', kind: 'race', goal: point(3916, 1996), route: [point(3916, 1996), point(3916, 1036), point(2956, 1036), point(2476, 556)], seconds: 125, pay: 3400, line: 'Four corners. One winner. Bring something fast.', objective: 'Drive through Jade’s street race gates' },
  { name: 'COLLECTION NOTICE', contact: 'Nico Santos', chapter: 'FAST COMPANY', kind: 'fight', goal: point(1036, 2990), pay: 4200, line: 'Foundry crew kept our cut. Their lookouts are at the loading yard.', objective: 'Clear the Foundry lookouts' },
  { name: 'DISAPPEARING ACT', contact: 'Detective Vega', chapter: 'FAST COMPANY', kind: 'escape', goal: point(2476, 2030), heat: 2, pay: 4800, line: 'Someone gave them your plate. Lose the tail. Then meet me in the gardens.', objective: 'Clear your wanted stars, then reach the garden entrance' },
  { name: 'HEAVY WEATHER', contact: 'Lucia Reyes', chapter: 'THE BIG LEAGUES', kind: 'theft', vehicle: 'van', goal: point(2950, 3916), drop: point(1516, 2510), pay: 5600, line: 'That Atlas is carrying the casino’s new security system. We need it first.', objective: 'Steal the Atlas security van' },
  { name: 'HOUSE MONEY', contact: 'Mara Voss', chapter: 'THE BIG LEAGUES', kind: 'meet', goal: point(3646, 1390), pay: 6500, line: 'The Mirage owns half this town. Walk up to the casino entrance. Look expensive.', objective: 'Meet Mara outside the Mirage Casino' },
  { name: 'FALSE ALARM', contact: 'Detective Vega', chapter: 'THE BIG LEAGUES', kind: 'courier', goal: point(1246, 1390), seconds: 95, pay: 7200, line: 'A copy of their response codes. Central precinct. Ninety-five seconds.', objective: 'Deliver the codes outside VHPD Central' },
  { name: 'THE LONG WAY HOME', contact: 'Jade Chen', chapter: 'THE HORIZON JOB / I', kind: 'race', goal: point(556, 3436), route: [point(556, 3436), point(1996, 3436), point(3916, 3436), point(3916, 1996)], seconds: 150, pay: 8000, line: 'Run the escape route. Every turn. We only get one shot at this.', objective: 'Scout all four getaway checkpoints' },
  { name: 'BURN THE LEDGER', contact: 'Mara Voss', chapter: 'THE HORIZON JOB / II', kind: 'fight', goal: point(2956, 3470), guards: 6, pay: 9500, line: 'The real ledger is at the freight office. Their private security will be waiting.', objective: 'Defeat the freight office security team' },
  { name: 'NEON BLACKOUT', contact: 'Nico Santos', chapter: 'THE HORIZON JOB / III', kind: 'theft', vehicle: 'muscle', goal: point(3436, 1038), drop: point(3916, 2476), heat: 3, pay: 12000, line: 'Take the Coyote from the casino valet. The whole city will hear about it.', objective: 'Take the Coyote getaway car and deliver it' },
  { name: 'NO LOOSE ENDS', contact: 'Detective Vega', chapter: 'THE HORIZON JOB / IV', kind: 'escape', goal: point(2476, 2510), heat: 4, pay: 15000, line: 'They’ve sealed the exits. Stay out of sight. I can erase the rest.', objective: 'Lose four stars and reach Vega’s safe house' },
  { name: 'BEYOND THE HORIZON', contact: 'Lucia Reyes', chapter: 'THE HORIZON JOB / FINALE', kind: 'courier', goal: point(4350, 1550), seconds: 140, pay: 25000, line: 'The boat is waiting at Ocean Drive. One final handoff. Then we’re free.', objective: 'Bring the ledger to Lucia at the beach' },
];
export const contract = s => CONTRACTS[s.job.index] || null;
export function destination(s) {
  const m = contract(s); if (!m) return null;
  if (m.kind === 'theft' && s.job.phase === 1) return m.drop;
  if (m.kind === 'race') return m.route[s.job.gate] || m.goal;
  return m.goal;
}
export function accept(s) {
  const m = contract(s); if (!m) return;
  Object.assign(s.job, { active: true, phase: 0, gate: 0, remaining: m.seconds || 0, failed: false, dialogue: 9 });
  if (m.kind === 'theft') {
    const c = automobile(s.city, m.vehicle || 'coupe', m.goal.x, m.goal.y, 0);
    c.auto = false; c.occupied = false; c.paint = '#8aebcd'; s.cars.push(c); s.job.vehicle = c;
  }
  if (m.kind === 'fight') s.hostiles = Array.from({ length: m.guards || 4 }, (_, i) => ({ x: m.goal.x + (i % 3) * 32, y: m.goal.y + Math.floor(i / 3) * 32, angle: 0, health: 85, wait: 1 + i * .25, paint: '#e47d92', stride: 0 }));
  if (m.heat) s.offense(m.heat, 'A CITYWIDE ALERT');
  s.tell('CONTRACT ACCEPTED · ' + m.name, 5); s.sound.note(660, .16, 'triangle');
}
export function fail(s, reason) {
  s.job.active = false; s.job.failed = true; s.hostiles = []; s.tell(reason + ' · ENTER to retry', 7);
}
export function finish(s) {
  const m = contract(s);
  s.hero.cash += m.pay; s.job.completed.push(s.job.index); s.job.index++;
  s.job.active = false; s.job.vehicle = null; s.hostiles = [];
  s.hero.health = Math.min(100, s.hero.health + 30); s.hero.armor = Math.min(100, s.hero.armor + 22); s.hero.ammo[1] += 36; s.hero.ammo[2] += 75;
  s.tell('CONTRACT COMPLETE · ' + m.name + ' · +$' + m.pay.toLocaleString('en-US'), 8);
  s.sound.note(990, .3, 'triangle'); s.persist();
}
export function contractsTick(s, dt, input) {
  const m = contract(s); if (!m) return;
  s.job.dialogue = Math.max(0, s.job.dialogue - dt);
  if (!s.job.active) { if (input.pressed('Enter')) accept(s); return; }
  if (m.seconds && (s.job.remaining -= dt) <= 0) { fail(s, 'The window closed'); return; }
  const goal = destination(s), close = gap(s.hero, goal) < 68;
  if (m.kind === 'theft') {
    if (!s.job.vehicle || s.job.vehicle.health <= 0) { fail(s, 'The delivery vehicle was destroyed'); return; }
    if (s.hero.car === s.job.vehicle && !s.job.phase) { s.job.phase = 1; s.tell('Vehicle acquired · Follow the gold marker to the delivery.', 5); }
    if (s.job.phase && s.hero.car === s.job.vehicle && close) finish(s);
  } else if (m.kind === 'fight') {
    if (s.hostiles.length && s.hostiles.every(e => e.health <= 0)) finish(s);
  } else if (m.kind === 'escape') {
    if (!s.stars && close) finish(s);
  } else if (close) {
    if (m.kind === 'race') {
      if (!s.hero.car) { s.tell('You need a car for this run.', 2); return; }
      s.job.gate++; s.sound.note(820, .1, 'triangle');
      if (s.job.gate >= m.route.length) finish(s);
    } else finish(s);
  }
}
export function objectiveLine(s) {
  const m = contract(s);
  if (!m) return 'Story complete · Pearl City is yours. Keep exploring.';
  if (!s.job.active) return (s.job.failed ? 'Retry ' : 'Call ') + m.contact + ' · ENTER to accept';
  if (m.kind === 'theft' && s.job.phase) return 'Deliver the marked vehicle · Keep it in one piece';
  if (m.kind === 'race') return m.objective + ' · ' + (s.job.gate + 1) + '/' + m.route.length;
  if (m.kind === 'fight') return m.objective + ' · ' + s.hostiles.filter(e => e.health > 0).length + ' left';
  return m.objective;
}

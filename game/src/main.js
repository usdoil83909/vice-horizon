import { FIXED, gap } from './config.js';
import { seedFromURL } from './random.js';
import { Controls } from './input.js';
import { generateCity } from './world.js';
import { protagonist, seedPopulation, driveHero, walkCitizens } from './entities.js';
import { flowTraffic } from './traffic.js';
import { reportCrime, pursuit, recover } from './police.js';
import { battle } from './combat.js';
import { contractsTick } from './missions.js';
import { store, restore } from './save.js';
import { Soundscape } from './audio.js';
import { CityRenderer } from './render.js';
import { composeScene } from './shots.js';

const canvas = document.querySelector('#city'), controls = new Controls(canvas), sound = new Soundscape();
export function newSession(seed, audio = sound) {
  const session = {
    city: generateCity(seed), hero: protagonist(), cars: [], people: [], hostiles: [], projectiles: [], motes: [], tracks: [],
    job: { index: 0, active: false, phase: 0, gate: 0, remaining: 0, dialogue: 0, completed: [], vehicle: null, failed: false },
    clock: 0, tick: 0, mode: 'title', help: false, stars: 0, heat: 0, lastOffense: -100, unseen: 0, seen: false, spawnWait: 0, bustMeter: 0,
    trauma: 0, muzzle: 0, fist: 0, endClock: 0, endReason: '', chopper: null, viewport: { w: innerWidth, h: innerHeight, dpr: 1 }, toast: { message: '', ttl: 0 }, sound: audio, resupplyWait: 0,
  };
  session.tell = (message, seconds = 3) => { session.toast = { message, ttl: seconds }; };
  session.offense = (severity, label) => reportCrime(session, severity, label);
  session.persist = () => store(session);
  session.burst = (x, y, count, color, multiplier = 1) => {
    for (let i = 0; i < count; i++) { const angle = session.city.rng() * Math.PI * 2, speed = (25 + session.city.rng() * 100) * multiplier; session.motes.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, ttl: (.25 + session.city.rng() * .65) * multiplier, color, size: 2 + session.city.rng() * 4 * multiplier }); }
  };
  seedPopulation(session); return session;
}
export function simulate(session, dt, input) {
  session.clock += dt; session.tick++; driveHero(session, dt, input); flowTraffic(session, dt); walkCitizens(session, dt); battle(session, dt, input); pursuit(session, dt);
  if (session.mode === 'play') contractsTick(session, dt, input);
  session.trauma *= Math.exp(-dt * 9); session.muzzle = Math.max(0, session.muzzle - dt); session.fist = Math.max(0, session.fist - dt); session.toast.ttl = Math.max(0, session.toast.ttl - dt);
  for (const mote of session.motes) { mote.x += mote.vx * dt; mote.y += mote.vy * dt; mote.vx *= .97; mote.vy *= .97; mote.ttl -= dt; }
  session.motes = session.motes.filter(m => m.ttl > 0).slice(-360); for (const mark of session.tracks) mark.ttl -= dt; session.tracks = session.tracks.filter(mark => mark.ttl > 0).slice(-260);
  session.resupplyWait = Math.max(0, session.resupplyWait - dt); const hospital = session.city.landmarks.find(place => place.kind === 'hospital');
  if (gap(session.hero, hospital) < 65 && !session.stars && session.resupplyWait === 0) { session.hero.health = 100; session.hero.armor = Math.max(60, session.hero.armor); session.hero.ammo[1] = Math.max(96, session.hero.ammo[1]); session.hero.ammo[2] = Math.max(180, session.hero.ammo[2]); session.resupplyWait = 25; session.tell('SAINT MARIA · Health restored and supplies replenished.', 4); }
}
let session = newSession(seedFromURL()), renderer = new CityRenderer(canvas, session.city);
const shot = new URLSearchParams(location.search).get('shot');
if (shot) composeScene(session, ['start', 'play', 'chase', 'mission'].includes(shot) ? shot : 'play');
window.__vice = { get state() { return session; }, simulate: (count = 1, input = controls) => { for (let i = 0; i < count; i++) simulate(session, FIXED, input); renderer.paint(session, FIXED); }, save: () => store(session), load: () => restore(session), newSession };
function shortcuts() {
  if (controls.edges.size || controls.mouse.fire) sound.awaken();
  if (controls.take('KeyM')) { sound.toggle(); session.tell(sound.muted ? 'Audio muted' : 'Horizon FM · back on air'); }
  if (controls.take('KeyH')) session.help = !session.help;
  if (controls.take('F5')) session.tell(store(session) ? 'STORY SAVED · F9 to return' : 'Save storage unavailable', 4);
  if (controls.take('F9') || controls.take('KeyL')) session.tell(restore(session) ? 'STORY LOADED · Welcome back' : 'No matching save for this city seed', 4);
  if (controls.take('Escape') || controls.take('KeyP')) { if (session.help) session.help = false; else if (session.mode === 'play') session.mode = 'pause'; else if (session.mode === 'pause') session.mode = 'play'; }
  if (session.mode === 'title' && controls.take('Enter')) { session.mode = 'play'; session.tell('Lucia is waiting. ENTER to accept your first contract.', 7); }
  if (session.mode === 'over' && controls.take('Enter')) recover(session);
  if (session.mode === 'pause' && controls.take('KeyR')) { session = newSession(seedFromURL()); session.mode = 'play'; renderer = new CityRenderer(canvas, session.city); }
}
let previous = null, accumulator = 0, paintedFrames = 0;
function frame(timestamp) {
  const elapsed = previous === null ? FIXED : Math.min(.1, (timestamp - previous) / 1000); previous = timestamp;
  if (!shot) {
    shortcuts();
    if (session.mode === 'play' && !session.help) { accumulator += elapsed; while (accumulator >= FIXED) { simulate(session, FIXED, controls); controls.flush(); accumulator -= FIXED; } }
    else { accumulator = 0; controls.flush(); if (session.mode === 'wasted' || session.mode === 'busted') { session.endClock += elapsed; if (session.endClock > 2.1) session.mode = 'over'; } }
    sound.tick(session);
  }
  renderer.paint(session, elapsed); document.querySelector('#announcement').textContent = `${session.mode}. Health ${Math.ceil(session.hero.health)}. Wanted ${session.stars}. Contract ${session.job.index + 1}.`;
  if (shot && ++paintedFrames === 2) { window.__shotReady = true; document.documentElement.dataset.shotReady = 'true'; }
  if (!shot || paintedFrames < 2) requestAnimationFrame(frame);
}
addEventListener('resize', () => renderer.paint(session, FIXED)); requestAnimationFrame(frame);

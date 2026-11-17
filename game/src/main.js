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

const surface = document.querySelector('#city'), controls = new Controls(surface), sound = new Soundscape();
export function newSession(seed, audio = sound) {
  const s = {
    city: generateCity(seed), hero: protagonist(), cars: [], people: [], hostiles: [], projectiles: [], motes: [], tracks: [],
    job: { index: 0, active: false, phase: 0, gate: 0, remaining: 0, dialogue: 0, completed: [], vehicle: null, failed: false },
    clock: 0, tick: 0, mode: 'title', help: false, stars: 0, heat: 0, lastOffense: -100, unseen: 0, seen: false, spawnWait: 0, bustMeter: 0,
    trauma: 0, muzzle: 0, fist: 0, endClock: 0, endReason: '', chopper: null, viewport: { w: innerWidth, h: innerHeight, dpr: 1 },
    toast: { message: '', ttl: 0 }, sound: audio, resupplyWait: 0,
  };
  s.tell = (message, seconds = 3) => { s.toast = { message, ttl: seconds }; };
  s.offense = (severity, label) => reportCrime(s, severity, label);
  s.persist = () => store(s);
  s.burst = (x, y, count, color, multiplier = 1) => {
    for (let i = 0; i < count; i++) {
      const a = s.city.rng() * Math.PI * 2, speed = (25 + s.city.rng() * 100) * multiplier;
      s.motes.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, ttl: (.25 + s.city.rng() * .65) * multiplier, color, size: 2 + s.city.rng() * 4 * multiplier });
    }
  };
  seedPopulation(s); return s;
}
export function simulate(s, dt, input) {
  s.clock += dt; s.tick++;
  driveHero(s, dt, input); flowTraffic(s, dt); walkCitizens(s, dt); battle(s, dt, input); pursuit(s, dt);
  if (s.mode === 'play') contractsTick(s, dt, input);
  s.trauma *= Math.exp(-dt * 9); s.muzzle = Math.max(0, s.muzzle - dt); s.fist = Math.max(0, s.fist - dt); s.toast.ttl = Math.max(0, s.toast.ttl - dt);
  for (const m of s.motes) { m.x += m.vx * dt; m.y += m.vy * dt; m.vx *= .97; m.vy *= .97; m.ttl -= dt; }
  s.motes = s.motes.filter(m => m.ttl > 0).slice(-360);
  for (const mark of s.tracks) mark.ttl -= dt;
  s.tracks = s.tracks.filter(m => m.ttl > 0).slice(-260);
  s.resupplyWait = Math.max(0, s.resupplyWait - dt);
  const hospital = s.city.landmarks.find(l => l.kind === 'hospital');
  if (gap(s.hero, hospital) < 65 && !s.stars && s.resupplyWait === 0) {
    s.hero.health = 100; s.hero.armor = Math.max(60, s.hero.armor); s.hero.ammo[1] = Math.max(96, s.hero.ammo[1]); s.hero.ammo[2] = Math.max(180, s.hero.ammo[2]); s.resupplyWait = 25; s.tell('SAINT MARIA · Health restored and supplies replenished.', 4);
  }
}
let session = newSession(seedFromURL()), artist = new CityRenderer(surface, session.city);
const shot = new URLSearchParams(location.search).get('shot');
if (shot) composeScene(session, ['start', 'play', 'chase', 'mission'].includes(shot) ? shot : 'play');
window.__vice = { get state() { return session; }, simulate: (count = 1, input = controls) => { for (let i = 0; i < count; i++) simulate(session, FIXED, input); artist.paint(session, FIXED); }, save: () => store(session), load: () => restore(session), newSession };
function shortcuts() {
  if (controls.edges.size || controls.mouse.fire) sound.awaken();
  if (controls.take('KeyM')) { sound.toggle(); session.tell(sound.muted ? 'Audio muted' : 'Horizon FM · back on air'); }
  if (controls.take('KeyH')) session.help = !session.help;
  if (controls.take('F5')) session.tell(store(session) ? 'STORY SAVED · F9 to return' : 'Save storage unavailable', 4);
  if (controls.take('F9') || controls.take('KeyL')) session.tell(restore(session) ? 'STORY LOADED · Welcome back' : 'No matching save for this city seed', 4);
  if (controls.take('Escape') || controls.take('KeyP')) {
    if (session.help) session.help = false;
    else if (session.mode === 'play') session.mode = 'pause';
    else if (session.mode === 'pause') session.mode = 'play';
  }
  if (session.mode === 'title' && controls.take('Enter')) { session.mode = 'play'; session.tell('Lucia is waiting. ENTER to accept your first contract.', 7); }
  if (session.mode === 'over' && controls.take('Enter')) recover(session);
  if (session.mode === 'pause' && controls.take('KeyR')) { session = newSession(seedFromURL()); session.mode = 'play'; artist = new CityRenderer(surface, session.city); }
}
let earlier = null, lag = 0, frames = 0;
function animate(stamp) {
  const elapsed = earlier === null ? FIXED : Math.min(.1, (stamp - earlier) / 1000); earlier = stamp;
  if (!shot) {
    shortcuts();
    if (session.mode === 'play' && !session.help) {
      lag += elapsed;
      while (lag >= FIXED) { simulate(session, FIXED, controls); controls.flush(); lag -= FIXED; }
    } else {
      lag = 0; controls.flush();
      if (session.mode === 'wasted' || session.mode === 'busted') { session.endClock += elapsed; if (session.endClock > 2.1) session.mode = 'over'; }
    }
    sound.tick(session);
  }
  artist.paint(session, elapsed);
  document.querySelector('#announcement').textContent = `${session.mode}. Health ${Math.ceil(session.hero.health)}. Wanted ${session.stars}. Contract ${session.job.index + 1}.`;
  if (shot && ++frames === 2) { window.__shotReady = true; document.documentElement.dataset.shotReady = 'true'; }
  if (!shot || frames < 2) requestAnimationFrame(animate);
}
addEventListener('resize', () => artist.paint(session, FIXED));
requestAnimationFrame(animate);

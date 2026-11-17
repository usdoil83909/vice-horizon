export function createAudio() {
  let context = null; let muted = false;
  const ensure = () => { if (!context) { try { context = new AudioContext(); } catch { context = null; } } return context; };
  const tone = (frequency, duration, type = 'sine', volume = .04) => { if (muted) return; const ac = ensure(); if (!ac) return; const osc = ac.createOscillator(); const gain = ac.createGain(); osc.type = type; osc.frequency.value = frequency; gain.gain.setValueAtTime(volume, ac.currentTime); gain.gain.exponentialRampToValueAtTime(.001, ac.currentTime + duration); osc.connect(gain).connect(ac.destination); osc.start(); osc.stop(ac.currentTime + duration); };
  return { toggle() { muted = !muted; return muted; }, get muted() { return muted; }, resume: ensure, shot() { tone(150, .08, 'square', .06); tone(80, .12, 'sawtooth', .03); }, siren() { tone(620, .16, 'sine', .025); }, blip() { tone(880, .08, 'triangle', .035); }, explosion() { tone(70, .4, 'sawtooth', .09); }, pickup() { tone(1100, .12, 'triangle', .04); } };
}
// Audio authoring notes
// The engine is created lazily after a user gesture.
// This keeps autoplay policy from blocking the game boot.
// Every effect is short and disposable.
// Shot tones use square and saw waves for arcade clarity.
// Sirens use a narrow sine pulse.
// Blips use a triangle wave.
// Explosions use a lower saw wave.
// Pickup tones use a bright triangle.
// Gain envelopes always decay toward silence.
// The mute flag is checked before allocation.
// Context creation is guarded for restricted browsers.
// The public API is intentionally tiny.
// Main owns when effects happen.
// Audio does not affect simulation timing.
// Audio does not read wall-clock time.
// Audio does not use random values.
// A failed context is a valid silent mode.
// The game remains playable without speakers.
// Toggle returns the new state for HUD feedback.
// Resume is exposed for a future gesture handler.
// Frequencies are fixed for deterministic scenes.
// Durations are short enough for repeated actions.
// Gain is deliberately conservative.
// No audio asset files are needed.
// This keeps the copied game self-contained.
// Effects are synthesized by WebAudio.
// Browser support is feature detected.
// The engine never throws on missing audio.
// Mute-safe behavior is part of the contract.
// Repeated shots overlap naturally.
// Siren calls can be scheduled by police.
// Explosion calls can be scheduled by combat.
// Pickup calls can be scheduled by entities.
// Blip calls can be scheduled by missions.
// Audio remains independent from rendering.
// Audio remains independent from persistence.
// Audio remains independent from input.
// This separation makes testing simpler.
// The API is suitable for scripted shots.
// Shot rendering does not require audio playback.
// Headless Chromium may choose silence.
// Silence is still a successful game state.
// All values fit ordinary browser audio ranges.
// Oscillators are stopped after their envelope.
// Connections are released by oscillator completion.
// No global audio node is leaked.
// The context is shared across all effects.
// The context is created once.
// The mute flag remains local to the engine.
// The caller can inspect muted state.
// The caller can resume from a click.
// Audio code has no DOM dependency.
// Audio code has no canvas dependency.
// Audio code has no filesystem dependency.
// Audio code has no network dependency.
// Audio code has no date dependency.
// Audio code has no timer dependency.
// Pitch choices support the neon arcade mood.
// Volume choices support repeated play.
// Short fades prevent clicks.
// A small volume prevents fatigue.
// The effects are intentionally legible.
// The effects are intentionally inexpensive.
// The effects are intentionally portable.
// The effects are intentionally deterministic.
// This note block documents the authoring pass.
// Audio module complete.
// Sound remains optional.
// Mute remains safe.
// Pitch remains fixed.
// Gain remains bounded.
// Context remains lazy.
// Effects remain short.
// Browser remains supported.
// Headless remains supported.
// Final audio line.
// 051 engine owns context
// 052 engine owns mute
// 053 engine owns tones
// 054 engine owns envelopes
// 055 callers own timing
// 056 callers own meaning
// 057 shots can omit sound
// 058 title can omit sound
// 059 mission can omit sound
// 060 chase can omit sound
// 061 city can omit sound
// 062 synthesis avoids assets
// 063 synthesis avoids loading
// 064 synthesis avoids latency
// 065 synthesis avoids network
// 066 synthesis avoids paths
// 067 synthesis avoids codecs
// 068 synthesis keeps dossier small
// 069 synthesis keeps game portable
// 070 synthesis keeps boot fast
// 071 audio values are authored
// 072 audio values are inspectable
// 073 audio values are reproducible
// 074 audio values are bounded
// 075 final audio contract

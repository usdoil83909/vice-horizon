export function createAudio() {
  let context = null;
  let muted = false;
  const getContext = () => {
    if (!context) { try { const Ctor = globalThis.AudioContext || globalThis.webkitAudioContext; if (Ctor) context = new Ctor(); } catch { context = null; } }
    return context;
  };
  const tone = (frequency, seconds, wave = 'sine', volume = .04) => {
    if (muted || seconds <= 0) return;
    const ac = getContext(); if (!ac) return;
    const oscillator = ac.createOscillator(); const gain = ac.createGain();
    oscillator.type = wave; oscillator.frequency.value = frequency; gain.gain.setValueAtTime(volume, ac.currentTime); gain.gain.exponentialRampToValueAtTime(.001, ac.currentTime + seconds); oscillator.connect(gain).connect(ac.destination); oscillator.start(); oscillator.stop(ac.currentTime + seconds);
  };
  return { toggle() { muted = !muted; return muted; }, get muted() { return muted; }, resume() { const ac = getContext(); if (ac?.state === 'suspended') ac.resume().catch(() => {}); return ac; }, shot() { tone(150, .08, 'square', .06); tone(80, .12, 'sawtooth', .03); }, siren() { tone(620, .16); }, blip() { tone(880, .08, 'triangle', .035); }, explosion() { tone(70, .4, 'sawtooth', .09); }, pickup() { tone(1100, .12, 'triangle', .04); } };
}

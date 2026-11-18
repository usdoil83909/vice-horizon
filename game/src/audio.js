export function createAudio() {
  let context;
  let muted = false;
  function acquire() {
    if (!context) {
      try {
        const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (Audio) context = new Audio();
      } catch { context = null; }
    }
    return context;
  }
  function play(hz, duration, waveform = 'sine', level = .04) {
    if (muted || duration <= 0) return;
    const audio = acquire();
    if (!audio) return;
    const voice = audio.createOscillator();
    const envelope = audio.createGain();
    voice.type = waveform;
    voice.frequency.value = hz;
    envelope.gain.setValueAtTime(level, audio.currentTime);
    envelope.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration);
    voice.connect(envelope).connect(audio.destination);
    voice.start();
    voice.stop(audio.currentTime + duration);
  }
  return {
    toggle() { muted = !muted; return muted; },
    get muted() { return muted; },
    resume() { const audio = acquire(); if (audio?.state === 'suspended') audio.resume().catch(() => {}); return audio; },
    shot() { play(150, .08, 'square', .06); play(80, .12, 'sawtooth', .03); },
    siren() { play(620, .16); },
    blip() { play(880, .08, 'triangle', .035); },
    explosion() { play(70, .4, 'sawtooth', .09); },
    pickup() { play(1100, .12, 'triangle', .04); },
  };
}

export class Audio {
  constructor() { this.context = null; this.muted = false; }
  unlock() {
    if (!this.context) {
      const Ctx = window.AudioContext || window.webkitAudioContext; if (!Ctx) return;
      this.context = new Ctx();
      this.master = this.context.createGain(); this.master.gain.value = .18; this.master.connect(this.context.destination);
      this.engine = this.context.createOscillator(); this.engine.type = 'sawtooth';
      this.engineGain = this.context.createGain(); this.engineGain.gain.value = 0; this.engine.connect(this.engineGain); this.engineGain.connect(this.master); this.engine.start();
      this.siren = this.context.createOscillator(); this.siren.type = 'sine'; this.sirenGain = this.context.createGain(); this.sirenGain.gain.value = 0;
      this.siren.connect(this.sirenGain); this.sirenGain.connect(this.master); this.siren.start();
    }
    this.context.resume();
  }
  toggle() { this.muted = !this.muted; if (this.master) this.master.gain.value = this.muted ? 0 : .18; }
  blip(frequency = 550) { this.tone(frequency, .12, 'sine', .4); }
  shot(fist = false) { this.tone(fist ? 100 : 165, fist ? .07 : .1, 'sawtooth', .65); }
  tone(frequency, duration, type, volume) {
    if (!this.context) return;
    const c = this.context, o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(frequency, c.currentTime); o.frequency.exponentialRampToValueAtTime(30, c.currentTime + duration);
    g.gain.setValueAtTime(volume, c.currentTime); g.gain.exponentialRampToValueAtTime(.001, c.currentTime + duration);
    o.connect(g); g.connect(this.master); o.start(); o.stop(c.currentTime + duration);
  }
  update(state) {
    if (!this.context) return;
    const active = state.screen === 'playing';
    this.engine.frequency.value = 38 + Math.abs(state.player.vehicle?.speed || 0) * .65;
    this.engineGain.gain.value = active && state.player.vehicle ? .15 : 0;
    this.siren.frequency.value = 620 + Math.sin(state.time * 7) * 220;
    this.sirenGain.gain.value = active && state.wanted ? .045 : 0;
  }
}

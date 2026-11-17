export class Soundscape {
  constructor() { this.context = null; this.muted = false; this.lastGun = 0; }
  awaken() {
    if (!this.context) {
      const Constructor = window.AudioContext || window.webkitAudioContext;
      if (!Constructor) return;
      this.context = new Constructor();
      this.master = this.context.createGain(); this.master.gain.value = .16; this.master.connect(this.context.destination);
      this.motor = this.context.createOscillator(); this.motor.type = 'sawtooth';
      this.motorGain = this.context.createGain(); this.motorGain.gain.value = 0;
      this.filter = this.context.createBiquadFilter(); this.filter.frequency.value = 260;
      this.motor.connect(this.filter); this.filter.connect(this.motorGain); this.motorGain.connect(this.master); this.motor.start();
      this.siren = this.context.createOscillator(); this.siren.type = 'sine';
      this.sirenGain = this.context.createGain(); this.sirenGain.gain.value = 0;
      this.siren.connect(this.sirenGain); this.sirenGain.connect(this.master); this.siren.start();
    }
    if (this.context.state === 'suspended') this.context.resume();
  }
  toggle() { this.muted = !this.muted; if (this.master) this.master.gain.value = this.muted ? 0 : .16; }
  note(hz = 600, seconds = .1, shape = 'sine', volume = .35) {
    if (!this.context || this.muted) return;
    const t = this.context.currentTime, oscillator = this.context.createOscillator(), amp = this.context.createGain();
    oscillator.type = shape; oscillator.frequency.setValueAtTime(hz, t); oscillator.frequency.exponentialRampToValueAtTime(Math.max(25, hz * .45), t + seconds);
    amp.gain.setValueAtTime(volume, t); amp.gain.exponentialRampToValueAtTime(.0001, t + seconds);
    oscillator.connect(amp); amp.connect(this.master); oscillator.start(t); oscillator.stop(t + seconds);
  }
  noise(seconds, volume, cutoff) {
    if (!this.context || this.muted) return;
    const rate = this.context.sampleRate, buffer = this.context.createBuffer(1, Math.ceil(rate * seconds), rate), data = buffer.getChannelData(0);
    let sequence = 4127;
    for (let i = 0; i < data.length; i++) { sequence = Math.imul(sequence, 1664525) + 1013904223 | 0; data[i] = ((sequence >>> 0) / 2147483648 - 1) * (1 - i / data.length); }
    const source = this.context.createBufferSource(), filter = this.context.createBiquadFilter(), gain = this.context.createGain();
    source.buffer = buffer; filter.type = 'lowpass'; filter.frequency.value = cutoff; gain.gain.value = volume;
    source.connect(filter); filter.connect(gain); gain.connect(this.master); source.start();
  }
  gun(kind) { this.noise(kind === 2 ? .07 : .12, .65, 1900); this.note(120, .065, 'square', .4); }
  explosion() { this.noise(.65, 1.2, 600); this.note(70, .4, 'sawtooth', .7); }
  tick(s) {
    if (!this.context) return;
    const now = this.context.currentTime, active = s.mode === 'play';
    const speed = Math.abs(s.hero.car?.velocity || 0);
    this.motor.frequency.setTargetAtTime(38 + speed * .75, now, .08);
    this.motorGain.gain.setTargetAtTime(active && s.hero.car ? .09 + speed / 1800 : 0, now, .06);
    this.siren.frequency.setTargetAtTime(620 + Math.sin(s.clock * 5) * 250, now, .02);
    this.sirenGain.gain.setTargetAtTime(active && s.stars && s.seen ? .065 : 0, now, .1);
  }
}

export class Soundscape {
  constructor() { this.context = null; this.muted = false; this.motor = null; this.gain = null; }
  awaken() { if (!this.context) { const Audio = window.AudioContext || window.webkitAudioContext; if (Audio) this.context = new Audio(); } if (this.context?.state === 'suspended') this.context.resume(); }
  note(frequency, duration = .12, type = 'sine') {
    if (this.muted || !this.context) return;
    const now = this.context.currentTime, oscillator = this.context.createOscillator(), volume = this.context.createGain();
    oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, now); volume.gain.setValueAtTime(.055, now); volume.gain.exponentialRampToValueAtTime(.001, now + duration);
    oscillator.connect(volume); volume.connect(this.context.destination); oscillator.start(now); oscillator.stop(now + duration);
  }
  gun(kind) { this.note(kind === 2 ? 140 : 205, .09, 'square'); this.note(65, .12, 'triangle'); }
  explosion() { this.note(48, .55, 'sawtooth'); this.note(90, .35, 'triangle'); }
  toggle() { this.muted = !this.muted; if (!this.muted) this.awaken(); return this.muted; }
  tick(s) {
    if (this.muted || !this.context) return;
    if (s.hero.car && Math.abs(s.hero.car.velocity) > 5) { const pitch = 48 + Math.abs(s.hero.car.velocity) * .55; if (!this.motor) { this.motor = this.context.createOscillator(); this.gain = this.context.createGain(); this.motor.type = 'sawtooth'; this.gain.gain.value = .012; this.motor.connect(this.gain); this.gain.connect(this.context.destination); this.motor.start(); } this.motor.frequency.setTargetAtTime(pitch, this.context.currentTime, .08); }
    else if (this.motor) { this.motor.stop(); this.motor = null; this.gain = null; }
    if (s.stars && Math.floor(s.clock * 1.4) !== Math.floor((s.clock - 1 / 60) * 1.4)) this.note(Math.floor(s.clock * 1.4) % 2 ? 720 : 560, .13, 'square');
  }
}

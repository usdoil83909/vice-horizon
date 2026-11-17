export class Input {
  constructor(canvas) {
    this.down = new Set(); this.pressed = new Set();
    this.pointer = { x: 0, y: 0, active: false, firing: false };
    addEventListener('keydown', e => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'F5', 'F9', 'Tab'].includes(e.code)) e.preventDefault();
      if (!this.down.has(e.code)) this.pressed.add(e.code);
      this.down.add(e.code);
    });
    addEventListener('keyup', e => this.down.delete(e.code));
    addEventListener('blur', () => { this.down.clear(); this.pointer.firing = false; });
    canvas.addEventListener('pointermove', e => { this.pointer.x = e.clientX; this.pointer.y = e.clientY; this.pointer.active = true; });
    canvas.addEventListener('pointerdown', () => { this.pointer.firing = true; this.pressed.add('Enter'); canvas.focus(); });
    addEventListener('pointerup', () => { this.pointer.firing = false; });
    canvas.addEventListener('contextmenu', e => e.preventDefault());
  }
  held(...codes) { return codes.some(c => this.down.has(c)); }
  tap(code) { return this.pressed.has(code); }
  clear() { this.pressed.clear(); }
  axes() { return { x: Number(this.held('KeyD', 'ArrowRight')) - Number(this.held('KeyA', 'ArrowLeft')), y: Number(this.held('KeyS', 'ArrowDown')) - Number(this.held('KeyW', 'ArrowUp')) }; }
}

export class Controls {
  constructor(surface) {
    this.down = new Set(); this.edges = new Set();
    this.mouse = { x: 0, y: 0, aim: false, fire: false };
    const captured = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'F5', 'F9', 'Tab']);
    addEventListener('keydown', event => {
      if (captured.has(event.code)) event.preventDefault();
      if (!this.down.has(event.code)) this.edges.add(event.code);
      this.down.add(event.code);
    });
    addEventListener('keyup', event => this.down.delete(event.code));
    addEventListener('blur', () => { this.down.clear(); this.edges.clear(); this.mouse.fire = false; });
    surface.addEventListener('pointermove', event => { this.mouse.x = event.clientX; this.mouse.y = event.clientY; this.mouse.aim = true; });
    surface.addEventListener('pointerdown', event => { this.mouse.fire = event.button === 0; surface.focus(); });
    addEventListener('pointerup', () => { this.mouse.fire = false; });
    surface.addEventListener('contextmenu', event => event.preventDefault());
  }
  held(...codes) { return codes.some(code => this.down.has(code)); }
  pressed(code) { return this.edges.has(code); }
  take(code) { const yes = this.edges.has(code); this.edges.delete(code); return yes; }
  axes() { return { x: +this.held('KeyD', 'ArrowRight') - +this.held('KeyA', 'ArrowLeft'), y: +this.held('KeyS', 'ArrowDown') - +this.held('KeyW', 'ArrowUp') }; }
  flush() { this.edges.clear(); }
}
export const idleControls = () => ({ held: () => false, pressed: () => false, axes: () => ({ x: 0, y: 0 }), mouse: { aim: false, fire: false } });

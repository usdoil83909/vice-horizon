const controls = {
  KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down', KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right', KeyF: 'enterCar', Space: 'attack', ShiftLeft: 'sprint',
  ShiftRight: 'sprint', Digit1: 'weapon1', Digit2: 'weapon2', Digit3: 'weapon3', Enter: 'accept',
  KeyP: 'pause', KeyM: 'mute', KeyL: 'load', KeyH: 'help',
};

export function createInput(canvas) {
  const held = new Set(), pressed = new Set();
  const mouse = { x: 0, y: 0, down: false };
  function keydown(event) {
    const action = controls[event.code];
    if (!action) return;
    event.preventDefault();
    if (!held.has(action)) pressed.add(action);
    held.add(action);
  }
  function keyup(event) {
    const action = controls[event.code];
    if (!action) return;
    event.preventDefault();
    held.delete(action);
    pressed.delete(action);
  }
  function move(event) {
    const bounds = canvas.getBoundingClientRect();
    mouse.x = event.clientX - bounds.left;
    mouse.y = event.clientY - bounds.top;
  }
  function down(event) { event.preventDefault(); mouse.down = true; }
  function up() { mouse.down = false; }
  addEventListener('keydown', keydown, { passive: false });
  addEventListener('keyup', keyup, { passive: false });
  canvas.addEventListener('mousemove', move);
  canvas.addEventListener('mousedown', down);
  addEventListener('mouseup', up);
  return {
    held, mouse,
    is: action => held.has(action),
    take(action) { const wasPressed = pressed.has(action); pressed.delete(action); return wasPressed; },
    clear: () => pressed.clear(),
    dispose() {
      removeEventListener('keydown', keydown); removeEventListener('keyup', keyup);
      removeEventListener('mouseup', up); canvas.removeEventListener('mousemove', move);
      canvas.removeEventListener('mousedown', down);
    },
  };
}

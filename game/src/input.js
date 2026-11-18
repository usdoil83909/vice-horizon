const bindings = { KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right', KeyF: 'enterCar', Space: 'attack', ShiftLeft: 'sprint', ShiftRight: 'sprint', Digit1: 'weapon1', Digit2: 'weapon2', Digit3: 'weapon3', Enter: 'accept', KeyP: 'pause', KeyM: 'mute', KeyL: 'load', KeyH: 'help' };
export function createInput(canvas) {
  const held = new Set(); const pressed = new Set(); const mouse = { x: 0, y: 0, down: false };
  const keydown = event => { const action = bindings[event.code]; if (!action) return; event.preventDefault(); if (!held.has(action)) pressed.add(action); held.add(action); };
  const keyup = event => { const action = bindings[event.code]; if (!action) return; event.preventDefault(); held.delete(action); pressed.delete(action); };
  addEventListener('keydown', keydown, { passive: false }); addEventListener('keyup', keyup, { passive: false });
  const move = event => { const box = canvas.getBoundingClientRect(); mouse.x = event.clientX - box.left; mouse.y = event.clientY - box.top; };
  const down = event => { event.preventDefault(); mouse.down = true; }; const up = () => { mouse.down = false; };
  canvas.addEventListener('mousemove', move); canvas.addEventListener('mousedown', down); addEventListener('mouseup', up);
  return { held, mouse, is: key => held.has(key), take: key => { const result = pressed.has(key); pressed.delete(key); return result; }, clear: () => pressed.clear(), dispose: () => { removeEventListener('keydown', keydown); removeEventListener('keyup', keyup); removeEventListener('mouseup', up); canvas.removeEventListener('mousemove', move); canvas.removeEventListener('mousedown', down); } };
}

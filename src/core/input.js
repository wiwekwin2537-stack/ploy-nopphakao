// อินพุตทุกแบบรวมที่เดียว: คีย์บอร์ด เมาส์ จอสัมผัส และจอยเกม
// getLayout() มาจาก ui/layout.js บอกตำแหน่งจอยสัมผัสและปุ่มบนจอ
const ACTIONS = ['attack', 'dash', 'skill', 'skill2', 'interact', 'pause', 'bag'];

const KEYMAP = {
  KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
  KeyJ: 'attack', Space: 'dash', ShiftLeft: 'dash', KeyK: 'skill', KeyQ: 'skill', Digit1: 'skill', KeyL: 'skill2', Digit2: 'skill2', KeyB: 'bag', KeyI: 'bag', Tab: 'bag',
  KeyE: 'interact', Enter: 'interact', Escape: 'pause',
};

export function createInput(target, getLayout) {
  const keys = new Set();
  const held = {}; const pressed = {};
  ACTIONS.forEach((a) => { held[a] = false; pressed[a] = false; });
  const move = { x: 0, y: 0 };
  const taps = [];           // จุดที่แตะ/คลิก ที่ไม่ได้โดนปุ่มบนจอ
  const touch = { joyId: null, joyX: 0, joyY: 0, dx: 0, dy: 0, buttons: new Map() };
  let mode = 'keyboard';     // keyboard | touch | pad  (HUD ใช้ตัดสินว่าจะแสดงปุ่มสัมผัสไหม)
  let mouseHeld = null;      // ค้างคลิกซ้ายเพื่อเดินตามเมาส์
  let padPrev = {};

  function press(a) { if (!held[a]) pressed[a] = true; held[a] = true; }
  function release(a) { held[a] = false; }

  window.addEventListener('keydown', (e) => {
    const k = KEYMAP[e.code];
    if (!k) return;
    e.preventDefault();
    mode = 'keyboard';
    keys.add(k);
    if (ACTIONS.includes(k)) press(k);
  });
  window.addEventListener('keyup', (e) => {
    const k = KEYMAP[e.code];
    if (!k) return;
    keys.delete(k);
    if (ACTIONS.includes(k)) release(k);
  });
  window.addEventListener('blur', () => { keys.clear(); ACTIONS.forEach(release); mouseHeld = null; });

  function hitButton(x, y) {
    const L = getLayout();
    if (!L) return null;
    for (const b of L.buttons) {
      if (b.locked) continue;
      if ((x - b.x) ** 2 + (y - b.y) ** 2 <= (b.r * 1.15) ** 2) return b.id;
    }
    return null;
  }

  target.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const x = e.offsetX, y = e.offsetY;
    if (e.pointerType === 'touch' || e.pointerType === 'pen') {
      mode = 'touch';
      const L = getLayout();
      const b = hitButton(x, y);
      if (b) { touch.buttons.set(e.pointerId, b); press(b); return; }
      if (L && x < L.joyZoneW && touch.joyId === null) {
        touch.joyId = e.pointerId; touch.joyX = x; touch.joyY = y; touch.dx = 0; touch.dy = 0;
        return;
      }
      taps.push({ sx: x, sy: y, kind: 'touch' });
    } else {
      mode = mode === 'touch' ? 'keyboard' : mode;
      const hb = e.button === 0 ? hitButton(x, y) : null;
      if (hb) { touch.buttons.set(e.pointerId, hb); press(hb); return; }
      if (e.button === 0) { taps.push({ sx: x, sy: y, kind: 'mouse' }); mouseHeld = { sx: x, sy: y }; }
      if (e.button === 2) { press('skill'); }
    }
    target.setPointerCapture?.(e.pointerId);
  });
  target.addEventListener('pointermove', (e) => {
    if (e.pointerId === touch.joyId) {
      const L = getLayout();
      const max = L ? L.joyR : 60;
      let dx = e.offsetX - touch.joyX, dy = e.offsetY - touch.joyY;
      const d = Math.hypot(dx, dy);
      if (d > max) { dx = dx / d * max; dy = dy / d * max; }
      touch.dx = dx / max; touch.dy = dy / max;
    } else if (mouseHeld && e.pointerType === 'mouse') {
      mouseHeld.sx = e.offsetX; mouseHeld.sy = e.offsetY;
    }
  });
  const end = (e) => {
    if (e.pointerId === touch.joyId) { touch.joyId = null; touch.dx = 0; touch.dy = 0; }
    const b = touch.buttons.get(e.pointerId);
    if (b) { touch.buttons.delete(e.pointerId); release(b); }
    if (e.pointerType === 'mouse') { mouseHeld = null; if (e.button === 2) release('skill'); }
  };
  target.addEventListener('pointerup', end);
  target.addEventListener('pointercancel', end);
  target.addEventListener('contextmenu', (e) => e.preventDefault());

  function pollPad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const p = pads && Array.from(pads).find((g) => g && g.connected);
    if (!p) return { x: 0, y: 0 };
    const b = (i) => !!(p.buttons[i] && p.buttons[i].pressed);
    const map = { attack: b(0) || b(7), dash: b(1) || b(4), skill: b(2) || b(5), skill2: b(6), interact: b(3), pause: b(9), bag: b(8) };
    let any = false;
    for (const a of ACTIONS) {
      if (map[a] && !padPrev[a]) { press(a); any = true; }
      if (!map[a] && padPrev[a]) release(a);
    }
    padPrev = map;
    let x = p.axes[0] || 0, y = p.axes[1] || 0;
    if (b(14)) x = -1; if (b(15)) x = 1; if (b(12)) y = -1; if (b(13)) y = 1;
    if (Math.hypot(x, y) < 0.2) { x = 0; y = 0; } else any = true;
    if (any) mode = 'pad';
    return { x, y };
  }

  return {
    move, held, pressed, taps,
    get mode() { return mode; },
    get joystick() { return touch.joyId === null ? null : { x: touch.joyX, y: touch.joyY, dx: touch.dx, dy: touch.dy }; },
    get mouseHeld() { return mouseHeld; },
    beginFrame() {
      const pad = pollPad();
      let x = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0);
      let y = (keys.has('down') ? 1 : 0) - (keys.has('up') ? 1 : 0);
      if (touch.joyId !== null) { x = touch.dx; y = touch.dy; }
      if (pad.x || pad.y) { x = pad.x; y = pad.y; }
      const d = Math.hypot(x, y);
      if (d > 1) { x /= d; y /= d; }
      move.x = x; move.y = y;
    },
    endFrame() { ACTIONS.forEach((a) => { pressed[a] = false; }); taps.length = 0; },
    // ใช้ในเทสต์และ UI: สั่งกดปุ่มแบบเดียวกับผู้เล่น
    tap(action) { press(action); release(action); },
    setMode(m) { mode = m; },
  };
}

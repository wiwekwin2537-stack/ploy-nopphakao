// หมอกดำบนแผนที่เล็กแบบ PoE: พื้นที่ที่ยังไม่เคยเดินผ่านจะมืด · เดินไปถึงแล้วเปิดถาวร (ตลอดอายุพื้นที่ — zoneInstance)
// ตาราง 1 ช่อง = 1 ช่องพื้น (32px) · เมือง (safe) เปิดทั้งหมด
const T = 32;

export function exploreGrid(game, z) {
  const inst = game.instances && game.instances[z.id];
  if (!inst) return null;
  if (!inst.explored) {
    const cols = Math.ceil(z.W / T), rows = Math.ceil(z.H / T);
    inst.explored = { cols, rows, cells: new Uint8Array(cols * rows).fill(z.safe ? 1 : 0), canvas: null, dirty: true };
  }
  return inst.explored;
}

// เปิดหมอกรอบตัวผู้เล่น (รัศมี revealRadius ช่อง) — เรียกทุกเฟรมตอนเล่น (ทำงานจริงเมื่อขยับข้ามช่อง)
export function updateExplore(game) {
  const z = game.world.zone, E = exploreGrid(game, z), p = game.player;
  if (!E) return;
  const cx = Math.floor(p.x / T), cy = Math.floor(p.y / T), key = cx + ',' + cy;
  if (E.last === key) return;
  E.last = key;
  const R = game.data.balance.instance.revealRadius;
  for (let y = Math.max(0, cy - R); y <= Math.min(E.rows - 1, cy + R); y++) {
    for (let x = Math.max(0, cx - R); x <= Math.min(E.cols - 1, cx + R); x++) {
      if ((x - cx) ** 2 + (y - cy) ** 2 > R * R) continue;
      const i = y * E.cols + x;
      if (!E.cells[i]) { E.cells[i] = 1; E.dirty = true; }
    }
  }
}

export function isExplored(game, x, y) {
  const z = game.world.zone, E = exploreGrid(game, z);
  if (!E) return true;
  const cx = Math.floor(x / T), cy = Math.floor(y / T);
  return cx < 0 || cy < 0 || cx >= E.cols || cy >= E.rows ? false : !!E.cells[cy * E.cols + cx];
}

// สัดส่วนที่สำรวจแล้ว (0–1)
export function exploredRatio(game) {
  const E = exploreGrid(game, game.world.zone);
  if (!E) return 1;
  let n = 0; for (const c of E.cells) n += c;
  return n / E.cells.length;
}

// ภาพหมอก (1 พิกเซลต่อช่อง ดำ = ยังไม่สำรวจ) สำหรับวาดทับแผนที่เล็ก
export function fogCanvas(game) {
  const E = exploreGrid(game, game.world.zone);
  if (!E || typeof document === 'undefined') return null;
  if (!E.canvas) { E.canvas = document.createElement('canvas'); E.canvas.width = E.cols; E.canvas.height = E.rows; E.dirty = true; }
  if (E.dirty) {
    const g = E.canvas.getContext('2d'), img = g.createImageData(E.cols, E.rows);
    for (let i = 0; i < E.cells.length; i++) { img.data[i * 4 + 3] = E.cells[i] ? 0 : 255; img.data[i * 4] = 8; img.data[i * 4 + 1] = 6; img.data[i * 4 + 2] = 10; }
    g.putImageData(img, 0, 0); E.dirty = false;
  }
  return E.canvas;
}

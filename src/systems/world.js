// โลก: โหลดพื้นที่ (zone) จาก data/zones.json สิ่งกีดขวาง และทางออก
import { createRng } from '../core/rng.js';

export const T = 32;

// ขนาดฐาน (หน่วยช่อง) ของของที่สุ่มวาง และว่าชนได้ไหม
const SCATTER_FOOT = {
  tree_big: { w: 0.7, h: 0.45, solid: true },
  tree_palm: { w: 0.4, h: 0.3, solid: true },
  tree_banana: { w: 0.4, h: 0.3, solid: true },
  bush: { w: 0.9, h: 0.5, solid: false },
  rock: { w: 0.8, h: 0.5, solid: true },
  haystack: { w: 1.1, h: 0.7, solid: true },
  flower: { w: 0.4, h: 0.3, solid: false },
  jar: { w: 0.7, h: 0.4, solid: true },
  basket: { w: 0.6, h: 0.35, solid: false },
};
const NON_SOLID_TYPES = new Set(['gate', 'bridge', 'lantern']);

function rectsOverlap(a, b, pad = 0) {
  return a.x - pad < b.x + b.w && a.x + a.w + pad > b.x && a.y - pad < b.y + b.h && a.y + a.h + pad > b.y;
}

export function buildZone(id, def) {
  const px = (r) => ({ x: r.x * T, y: r.y * T, w: r.w * T, h: r.h * T });
  const objects = [];
  for (const o of def.objects || []) {
    objects.push({ type: o.type, ...px(o), solid: o.solid === undefined ? !NON_SOLID_TYPES.has(o.type) : o.solid, untilFlag: o.untilFlag || null, label: o.label || null });
  }
  const roads = (def.roads || []).map(px);
  const water = (def.water || []).map(px);
  const exits = (def.exits || []).map((e) => ({ ...px(e), to: e.to, tx: e.tx * T, ty: e.ty * T }));
  const start = { x: def.start.x * T, y: def.start.y * T };
  const keepClear = [
    { x: start.x - 2 * T, y: start.y - 2 * T, w: 4 * T, h: 4 * T },
    ...exits.map((e) => ({ x: e.tx - 2 * T, y: e.ty - 2 * T, w: 4 * T, h: 4 * T })),
    ...exits.map((e) => ({ x: e.x - T, y: e.y - T, w: e.w + 2 * T, h: e.h + 2 * T })),
    ...(def.npcs || []).map((n) => ({ x: (n.x - 1) * T, y: (n.y - 1) * T, w: 2 * T, h: 2 * T })),
  ];
  const rng = createRng(def.seed || 1);
  for (const s of def.scatter || []) {
    const foot = SCATTER_FOOT[s.type] || { w: 0.6, h: 0.4, solid: true };
    const solid = s.solid === undefined ? foot.solid : s.solid;
    let placed = 0, tries = 0;
    while (placed < s.count && tries < s.count * 40) {
      tries++;
      const cx = (s.area.x + rng.next() * s.area.w) * T;
      const cy = (s.area.y + rng.next() * s.area.h) * T;
      const r = { x: cx - foot.w * T / 2, y: cy - foot.h * T, w: foot.w * T, h: foot.h * T };
      if (roads.some((q) => rectsOverlap(r, q, 6))) continue;
      if (water.some((q) => rectsOverlap(r, q, 8))) continue;
      if (keepClear.some((q) => rectsOverlap(r, q))) continue;
      const pad = s.type === 'flower' ? 4 : 18;
      if (objects.some((q) => q.type !== 'thicket' && rectsOverlap(r, q, pad))) continue;
      objects.push({ type: s.type, ...r, solid, untilFlag: null, seed: rng.int(0, 9999) });
      placed++;
    }
  }
  return {
    id, def, name: def.name, W: def.w * T, H: def.h * T, safe: !!def.safe, music: def.music,
    objects, roads, water, exits, start,
    paddies: (def.paddies || []).map((p) => ({ ...px(p), cell: p.cell * T })),
    npcs: (def.npcs || []).map((n) => ({ ...n, x: n.x * T, y: n.y * T })),
    spawns: (def.spawns || []).map((s) => ({ ...s, area: px(s.area) })),
  };
}

export function createWorld(zonesData, hasFlag) {
  const cache = new Map();
  let zone = null;
  let grid = null; const CELL = 128;

  function solids() {
    return zone.objects.filter((o) => o.solid && !(o.untilFlag && hasFlag(o.untilFlag))).concat(zone.water);
  }
  function rebuildGrid() {
    const cols = Math.ceil(zone.W / CELL), rows = Math.ceil(zone.H / CELL);
    grid = { cols, rows, cells: Array.from({ length: cols * rows }, () => []) };
    for (const s of solids()) {
      const c0 = Math.max(0, Math.floor(s.x / CELL)), c1 = Math.min(cols - 1, Math.floor((s.x + s.w) / CELL));
      const r0 = Math.max(0, Math.floor(s.y / CELL)), r1 = Math.min(rows - 1, Math.floor((s.y + s.h) / CELL));
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) grid.cells[r * cols + c].push(s);
    }
  }
  function near(x, y, rad) {
    const out = new Set();
    const c0 = Math.max(0, Math.floor((x - rad) / CELL)), c1 = Math.min(grid.cols - 1, Math.floor((x + rad) / CELL));
    const r0 = Math.max(0, Math.floor((y - rad) / CELL)), r1 = Math.min(grid.rows - 1, Math.floor((y + rad) / CELL));
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) for (const s of grid.cells[r * grid.cols + c]) out.add(s);
    return out;
  }

  return {
    get zone() { return zone; },
    load(id) {
      if (!zonesData[id]) throw new Error('ไม่มีพื้นที่ ' + id);
      if (!cache.has(id)) cache.set(id, buildZone(id, zonesData[id]));
      zone = cache.get(id);
      rebuildGrid();
      return zone;
    },
    refreshFlags() { rebuildGrid(); },
    isVisible(o) { return !(o.untilFlag && hasFlag(o.untilFlag)); },
    // ขยับวงกลมแบบแยกแกน แล้วดันออกจากสิ่งกีดขวาง คืนค่าตำแหน่งใหม่
    moveCircle(x, y, r, dx, dy) {
      let nx = x + dx, ny = y;
      nx = this.resolve(nx, ny, r, 'x', dx);
      ny = y + dy;
      ny = this.resolve(nx, ny, r, 'y', dy);
      nx = Math.max(r, Math.min(zone.W - r, nx));
      ny = Math.max(r, Math.min(zone.H - r, ny));
      return { x: nx, y: ny };
    },
    resolve(x, y, r, axis, d) {
      for (const s of near(x, y, r + 4)) {
        const cx = Math.max(s.x, Math.min(x, s.x + s.w));
        const cy = Math.max(s.y, Math.min(y, s.y + s.h));
        const ddx = x - cx, ddy = y - cy;
        if (ddx * ddx + ddy * ddy < r * r) {
          if (axis === 'x') x = d > 0 ? s.x - r : d < 0 ? s.x + s.w + r : x;
          else y = d > 0 ? s.y - r : d < 0 ? s.y + s.h + r : y;
        }
      }
      return axis === 'x' ? x : y;
    },
    blocked(x, y, r) {
      for (const s of near(x, y, r + 2)) {
        const cx = Math.max(s.x, Math.min(x, s.x + s.w)), cy = Math.max(s.y, Math.min(y, s.y + s.h));
        if ((x - cx) ** 2 + (y - cy) ** 2 < r * r) return true;
      }
      return x < r || y < r || x > zone.W - r || y > zone.H - r;
    },
    lineClear(x0, y0, x1, y1) {
      const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 16);
      for (let i = 1; i < steps; i++) {
        const t = i / steps;
        if (this.blocked(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, 2)) return false;
      }
      return true;
    },
    exitAt(x, y) {
      return zone.exits.find((e) => x >= e.x && x <= e.x + e.w && y >= e.y && y <= e.y + e.h) || null;
    },
  };
}

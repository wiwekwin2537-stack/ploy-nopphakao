// พื้นดิน: วาดเป็นชิ้น (chunk) ครั้งเดียวแล้วเก็บไว้ ไม่วาดใหม่ทุกเฟรม
import { C, hash2 } from './draw.js';
import { T } from '../systems/world.js';

const CHUNK = 256;
const MAX_CHUNKS = 40;
const BASE = {
  forest: ['#4c6e34', '#476830', '#527538'],
  town: ['#86a653', '#7fa04e', '#8cad58'],
  field: ['#8fae55', '#86a64f', '#97b55c'],
};

function classify(zone) {
  const cols = Math.ceil(zone.W / T), rows = Math.ceil(zone.H / T);
  const t = new Uint8Array(cols * rows);
  const inside = (r, x, y) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
  for (let ty = 0; ty < rows; ty++) for (let tx = 0; tx < cols; tx++) {
    const x = tx * T + T / 2, y = ty * T + T / 2;
    let v = 0;
    if (zone.paddies.some((p) => inside(p, x, y))) v = 3;
    if (zone.roads.some((r) => inside(r, x, y))) v = 1;
    if (zone.water.some((r) => inside(r, x, y))) v = 2;
    t[ty * cols + tx] = v;
  }
  return { cols, rows, t };
}

export function createGround(zone, scale) {
  const map = classify(zone);
  const cache = new Map();
  const base = BASE[zone.def.ground] || BASE.field;
  const isTown = zone.def.ground === 'town';
  const at = (tx, ty) => (tx < 0 || ty < 0 || tx >= map.cols || ty >= map.rows ? -1 : map.t[ty * map.cols + tx]);

  function drawTile(g, tx, ty, ox, oy) {
    const v = at(tx, ty), x = tx * T - ox, y = ty * T - oy;
    const h = hash2(tx, ty, 7);
    if (v === 0) {
      g.fillStyle = base[Math.floor(h * 3)]; g.fillRect(x, y, T, T);
      for (let i = 0; i < 5; i++) {                                   // ใบหญ้า
        const hx = hash2(tx, ty, i * 3 + 1), hy = hash2(tx, ty, i * 3 + 2);
        g.fillStyle = hash2(tx, ty, i + 40) > 0.5 ? C.leafHi : C.leafDark;
        g.fillRect(x + hx * 30, y + hy * 30, 1.2, 3);
        g.fillRect(x + hx * 30 + 1.5, y + hy * 30 + 1, 1.2, 2);
      }
      if (zone.def.ground === 'forest' && h > 0.7) { g.fillStyle = '#6a5a2e'; g.fillRect(x + h * 20, y + hash2(tx, ty, 9) * 24, 3, 2); }
    } else if (v === 1) {
      if (isTown) {                                                    // ทางหินในเวียง
        g.fillStyle = '#c4ae86'; g.fillRect(x, y, T, T);
        g.strokeStyle = 'rgba(90,70,40,0.35)'; g.lineWidth = 1;
        const off = ty % 2 ? 8 : 0;
        for (let i = 0; i < 3; i++) g.strokeRect(x + ((i * 16 + off) % 32), y + 0.5, 16, 16);
        for (let i = 0; i < 3; i++) g.strokeRect(x + ((i * 16 + off + 8) % 32), y + 16.5, 16, 15);
      } else {
        g.fillStyle = h > 0.5 ? C.dirt : '#b3844f'; g.fillRect(x, y, T, T);
        g.fillStyle = C.dirtDark;
        for (let i = 0; i < 3; i++) g.fillRect(x + hash2(tx, ty, i + 11) * 28, y + hash2(tx, ty, i + 21) * 28, 2.5, 2);
        g.fillStyle = 'rgba(80,55,30,0.25)';                            // รอยล้อเกวียน
        if (!isTown && zone.def.ground === 'forest') { g.fillRect(x, y + 6, T, 2); g.fillRect(x, y + 24, T, 2); }
      }
      // ขอบทางกลืนกับหญ้า
      const edges = [[0, -1], [0, 1], [-1, 0], [1, 0]];
      for (const [dx, dy] of edges) {
        if (at(tx + dx, ty + dy) === 0) {
          g.fillStyle = 'rgba(60,90,30,0.45)';
          if (dy) g.fillRect(x, dy < 0 ? y : y + T - 3, T, 3); else g.fillRect(dx < 0 ? x : x + T - 3, y, 3, T);
        }
      }
    } else if (v === 2) {
      g.fillStyle = C.water; g.fillRect(x, y, T, T);
      g.fillStyle = 'rgba(255,255,255,0.18)';
      g.fillRect(x + h * 18, y + hash2(tx, ty, 3) * 26, 9, 1.4);
      g.fillRect(x + hash2(tx, ty, 5) * 18, y + hash2(tx, ty, 6) * 26, 6, 1.2);
      const edges = [[0, -1], [0, 1], [-1, 0], [1, 0]];
      for (const [dx, dy] of edges) {
        if (at(tx + dx, ty + dy) !== 2 && at(tx + dx, ty + dy) !== -1) {
          g.fillStyle = '#6b5a35';
          if (dy) g.fillRect(x, dy < 0 ? y : y + T - 4, T, 4); else g.fillRect(dx < 0 ? x : x + T - 4, y, 4, T);
          g.fillStyle = 'rgba(255,255,255,0.25)';
          if (dy) g.fillRect(x, dy < 0 ? y + 4 : y + T - 6, T, 1.5); else g.fillRect(dx < 0 ? x + 4 : x + T - 6, y, 1.5, T);
        }
      }
    } else if (v === 3) {
      g.fillStyle = '#78a660'; g.fillRect(x, y, T, T);                 // นาข้าว
      g.fillStyle = 'rgba(90,150,150,0.22)'; g.fillRect(x, y, T, T);
      g.fillStyle = 'rgba(200,230,240,0.25)'; g.fillRect(x + h * 16, y + hash2(tx, ty, 4) * 28, 10, 1.4);
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {        // กอข้าวเป็นแถว
        const sx = x + 4 + c * 8, sy = y + 6 + r * 8;
        g.fillStyle = 'rgba(30,60,40,0.35)'; g.fillRect(sx - 2, sy + 3, 5, 1.5);
        g.fillStyle = '#3f7a2a'; g.fillRect(sx, sy - 3, 1.5, 6);
        g.fillStyle = '#5f9c38'; g.fillRect(sx - 2, sy - 1, 1.4, 4); g.fillRect(sx + 2, sy - 1, 1.4, 4);
        g.fillStyle = '#8cc24a'; g.fillRect(sx, sy - 3, 1.5, 1.5);
      }
    }
  }

  function drawDikes(g, ox, oy) {
    for (const p of zone.paddies) {
      // คันนา: ดินนูน มีเงาด้านล่าง และหญ้าบนสัน
      g.fillStyle = 'rgba(40,50,30,0.35)';
      for (let y = p.y; y <= p.y + p.h + 1; y += p.cell) g.fillRect(p.x - ox, y - oy + 4, p.w, 3);
      g.fillStyle = '#a8955a';
      for (let x = p.x; x <= p.x + p.w + 1; x += p.cell) g.fillRect(x - ox - 4, p.y - oy - 4, 8, p.h + 8);
      for (let y = p.y; y <= p.y + p.h + 1; y += p.cell) g.fillRect(p.x - ox - 4, y - oy - 4, p.w + 8, 8);
      g.fillStyle = '#86a64f';
      for (let x = p.x; x <= p.x + p.w + 1; x += p.cell) g.fillRect(x - ox - 2, p.y - oy - 4, 4, p.h + 8);
      for (let y = p.y; y <= p.y + p.h + 1; y += p.cell) g.fillRect(p.x - ox - 4, y - oy - 2, p.w + 8, 4);
    }
  }

  function build(cx, cy) {
    const c = document.createElement('canvas');
    c.width = CHUNK * scale; c.height = CHUNK * scale;
    const g = c.getContext('2d');
    g.scale(scale, scale);
    const ox = cx * CHUNK, oy = cy * CHUNK;
    const t0x = Math.floor(ox / T), t0y = Math.floor(oy / T);
    for (let ty = t0y; ty < t0y + CHUNK / T; ty++) for (let tx = t0x; tx < t0x + CHUNK / T; tx++) drawTile(g, tx, ty, ox, oy);
    g.save(); g.beginPath(); g.rect(0, 0, CHUNK, CHUNK); g.clip(); drawDikes(g, ox, oy); g.restore();
    return c;
  }

  return {
    // วาดชิ้นพื้นที่มองเห็น สร้างชิ้นใหม่ได้ไม่เกิน budget ชิ้นต่อเฟรม เพื่อไม่ให้กระตุก
    draw(ctx, b, budget = 3) {
      const c0 = Math.max(0, Math.floor(b.l / CHUNK)), c1 = Math.min(Math.ceil(zone.W / CHUNK) - 1, Math.floor(b.r / CHUNK));
      const r0 = Math.max(0, Math.floor(b.t / CHUNK)), r1 = Math.min(Math.ceil(zone.H / CHUNK) - 1, Math.floor(b.b / CHUNK));
      for (let cy = r0; cy <= r1; cy++) for (let cx = c0; cx <= c1; cx++) {
        const key = cx + ',' + cy;
        let ch = cache.get(key);
        if (ch) { cache.delete(key); cache.set(key, ch); }              // ย้ายไปท้ายสุด = ใช้ล่าสุด
        else if (budget > 0) {
          ch = build(cx, cy); cache.set(key, ch); budget--;
          if (cache.size > MAX_CHUNKS) cache.delete(cache.keys().next().value); // ทิ้งชิ้นที่ไม่ได้ใช้นานสุด
        }
        if (ch) ctx.drawImage(ch, cx * CHUNK, cy * CHUNK, CHUNK + 0.6, CHUNK + 0.6);
        else { ctx.fillStyle = base[0]; ctx.fillRect(cx * CHUNK, cy * CHUNK, CHUNK, CHUNK); }
      }
    },
    get size() { return cache.size; },
    dispose() { cache.clear(); },
  };
}

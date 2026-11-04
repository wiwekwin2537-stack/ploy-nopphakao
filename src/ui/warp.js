// หน้าเลือกศาลวาร์ป: รายชื่อพื้นที่ ที่ปลดล็อกแล้วแตะเพื่อวาร์ป ที่ยังไม่ปลดล็อกเป็นสีจาง
import { C, kanokFrame, rrect, circle } from '../art/draw.js';
import { uiText as text } from './hud.js';
import { allWaypoints, warpTo } from '../systems/waypoint.js';

export function warpLayout(w, h, s, n) {
  const pw = Math.min(w - 20, 340 * s), rh = 34 * s, ph = Math.min(h - 16, 70 * s + n * rh), x = w / 2 - pw / 2, y = h / 2 - ph / 2;
  return { x, y, w: pw, h: ph, s, rows: Array.from({ length: n }, (_, i) => ({ x: x + 16 * s, y: y + 46 * s + i * rh, w: pw - 32 * s, h: rh - 4 * s })), close: { x: x + pw - 20 * s, y: y + 20 * s, r: 14 * s } };
}

export function drawWarp(ctx, game, L, w, h) {
  const list = allWaypoints(game), B = warpLayout(w, h, L.s, list.length), s = B.s, here = game.world.zone.id;
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, w, h);
  kanokFrame(ctx, B.x, B.y, B.w, B.h, 12);
  text(ctx, 'ศาลวาร์ป', B.x + 20 * s, B.y + 20 * s, 16 * s, C.goldHi);
  circle(ctx, B.close.x, B.close.y, B.close.r, 'rgba(120,30,20,0.9)', C.gold, 1.5);
  text(ctx, '✕', B.close.x, B.close.y + 1, 13 * s, '#fff', 'center');
  list.forEach((wp, i) => {
    const r = B.rows[i], cur = wp.id === here;
    ctx.fillStyle = cur ? 'rgba(217,166,48,0.3)' : wp.open ? 'rgba(40,90,140,0.45)' : 'rgba(0,0,0,0.3)'; rrect(ctx, r.x, r.y, r.w, r.h, 8 * s); ctx.fill();
    ctx.strokeStyle = wp.open ? '#8ad8ff' : 'rgba(184,154,88,0.4)'; ctx.lineWidth = 1.2; ctx.stroke();
    text(ctx, wp.open ? wp.name : '???  (ยังไม่เคยไปถึง)', r.x + 12 * s, r.y + r.h / 2 + 0.5, 12 * s, wp.open ? C.cream : 'rgba(244,230,200,0.4)', 'left', '600');
    if (cur) text(ctx, 'อยู่ที่นี่', r.x + r.w - 10 * s, r.y + r.h / 2 + 0.5, 10 * s, C.goldHi, 'right', '600');
  });
}

// คืน true ถ้าควรปิด
export function updateWarp(game, L, w, h) {
  const list = allWaypoints(game), B = warpLayout(w, h, L.s, list.length);
  if (game.input.pressed.pause || game.input.pressed.interact || game.input.pressed.bag) return true;
  for (const t of game.input.taps) {
    if (t.consumed) continue;
    t.consumed = true;
    if (Math.hypot(t.sx - B.close.x, t.sy - B.close.y) < B.close.r * 1.4) return true;
    if (t.sx < B.x || t.sx > B.x + B.w || t.sy < B.y || t.sy > B.y + B.h) return true;
    const i = B.rows.findIndex((r) => t.sx >= r.x && t.sx <= r.x + r.w && t.sy >= r.y && t.sy <= r.y + r.h);
    if (i >= 0 && list[i].open && list[i].id !== game.world.zone.id) { warpTo(game, list[i].id); return false; }
  }
  return false;
}

// แผนที่ใหญ่เต็มจอ (แบบ PoE กด Tab / แตะแผนที่เล็ก): ทั้งพื้นที่ + หมอกดำส่วนที่ยังไม่สำรวจ
// แสดง ทางออก (ชื่อพื้นที่ปลายทาง) · ศาลวาร์ป (ปลดแล้วสีฟ้า/ยังไม่ปลดสีเทา) · ชาวบ้าน · มอน (เฉพาะที่สำรวจแล้ว) · ตัวเรา
import { C, rrect, circle, poly } from '../art/draw.js';
import { uiText as text, miniMap } from './hud.js';
import { fogCanvas, isExplored, exploredRatio } from '../systems/explore.js';

export function bigMapLayout(w, h, s) {
  return { close: { x: w - 26 * s, y: 26 * s, r: 15 * s }, box: { x: 16 * s, y: 40 * s, w: w - 32 * s, h: h - 56 * s } };
}

export function drawBigMap(ctx, game, L, w, h) {
  const s = L.s, z = game.world.zone, p = game.player, B = bigMapLayout(w, h, s), mm = miniMap(z);
  ctx.fillStyle = 'rgba(6,5,8,0.96)'; ctx.fillRect(0, 0, w, h);
  const k = Math.min(B.box.w / z.W, B.box.h / z.H), ox = B.box.x + (B.box.w - z.W * k) / 2, oy = B.box.y + (B.box.h - z.H * k) / 2;
  const X = (x) => ox + x * k, Y = (y) => oy + y * k;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(mm.c, ox, oy, z.W * k, z.H * k);
  const fog = fogCanvas(game);
  if (fog) ctx.drawImage(fog, ox, oy, z.W * k, z.H * k);
  ctx.strokeStyle = C.gold; ctx.lineWidth = 2; ctx.strokeRect(ox, oy, z.W * k, z.H * k);
  for (const m of game.mobs) if (!m.dead && isExplored(game, m.x, m.y)) circle(ctx, X(m.x), Y(m.y), (m.elite ? 3.2 : 2.2) * s, m.elite ? game.data.balance.elites.tiers[m.elite].color : '#ff4a3a', null);
  const T = 32;
  for (const o of z.def.objects || []) {
    if (o.type !== 'waypoint') continue;
    const on = !!game.flags['wp_' + z.id], cx = X((o.x + o.w / 2) * T), cy = Y((o.y + o.h / 2) * T);
    poly(ctx, [cx, cy - 7 * s, cx + 5 * s, cy, cx, cy + 7 * s, cx - 5 * s, cy], on ? '#8ad8ff' : '#7a7a80', C.ink, 1.2);
    text(ctx, on ? 'ศาลวาร์ป' : 'ศาลวาร์ป (ยังไม่ปลด)', cx, cy - 13 * s, 9.5 * s, on ? '#bfe8ff' : '#a0a0a8', 'center', '600');
  }
  for (const e of z.exits) {
    const cx = X(e.x + e.w / 2), cy = Y(e.y + e.h / 2), to = game.data.zones[e.to];
    circle(ctx, cx, cy, 5 * s, '#7dff8a', C.ink, 1.2);
    if (!isExplored(game, e.x + e.w / 2, e.y + e.h / 2)) continue;   // ทางออกที่ยังไม่เห็น: ไม่บอกชื่อ (ต้องสำรวจก่อน)
    const lx = Math.min(w - 50 * s, Math.max(50 * s, cx)), ly = cy + (cy > h / 2 ? -14 : 14) * s;
    text(ctx, '→ ' + (to ? to.name : e.to), lx, ly, 10 * s, '#9af0b0', 'center', '600');
  }
  for (const n of z.npcs) { circle(ctx, X(n.x), Y(n.y), 3.4 * s, '#ffd24a', C.ink, 1); text(ctx, n.name, X(n.x), Y(n.y) - 10 * s, 9 * s, '#ffe9a0', 'center', 'normal'); }
  const px = X(p.x), py = Y(p.y), a = p.aim || 0;
  ctx.save(); ctx.translate(px, py); ctx.rotate(a + Math.PI / 2);
  poly(ctx, [0, -8 * s, 6 * s, 6 * s, 0, 3 * s, -6 * s, 6 * s], '#ffffff', C.ink, 1.5); ctx.restore();
  text(ctx, z.name, B.box.x, 20 * s, 15 * s, C.goldHi, 'left', '600');
  if (!z.safe) text(ctx, `สำรวจแล้ว ${Math.round(exploredRatio(game) * 100)}%`, B.box.x + 8 * s + ctx.measureText(z.name).width + 30 * s, 21 * s, 10 * s, 'rgba(244,230,200,0.7)', 'left', 'normal');
  text(ctx, 'Tab / แตะ ✕ เพื่อปิด', w / 2, h - 10 * s, 9 * s, 'rgba(244,230,200,0.55)', 'center', 'normal');
  circle(ctx, B.close.x, B.close.y, B.close.r, 'rgba(120,30,20,0.9)', C.gold, 1.5);
  text(ctx, '✕', B.close.x, B.close.y + 1, 13 * s, '#fff', 'center');
}

// คืน true เมื่อปิด
export function updateBigMap(game) {
  if (game.input.pressed.map || game.input.pressed.pause || game.input.pressed.bag) return true;
  for (const t of game.input.taps) {
    if (t.consumed) continue;
    t.consumed = true;
    return true;                                                   // แตะตรงไหนก็ปิด (✕ อยู่มุมขวาบนให้เห็นชัด)
  }
  return false;
}

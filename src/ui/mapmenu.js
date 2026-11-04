// หน้าแท่นลายแทง: เลือกขั้น 1–5 (แสดงจำนวนลายแทงที่มี) แตะขั้นที่มีลายแทง = เปิดถ้ำ
import { C, kanokFrame, rrect, circle } from '../art/draw.js';
import { uiText as text } from './hud.js';
import { currencyIcon } from './gemtab.js';
import { openMap } from '../systems/maps.js';

const TIERS = [1, 2, 3, 4, 5];

export function mapMenuLayout(w, h, s) {
  const pw = Math.min(w - 20, 380 * s), rh = 36 * s, ph = Math.min(h - 16, 96 * s + TIERS.length * rh), x = w / 2 - pw / 2, y = h / 2 - ph / 2;
  return { x, y, w: pw, h: ph, s, rows: TIERS.map((t, i) => ({ t, x: x + 16 * s, y: y + 46 * s + i * rh, w: pw - 32 * s, h: rh - 4 * s })), close: { x: x + pw - 20 * s, y: y + 20 * s, r: 14 * s } };
}

export function drawMapMenu(ctx, game, L, w, h) {
  const B = mapMenuLayout(w, h, L.s), s = B.s, p = game.player, I = game.data.items, MP = game.data.balance.maps;
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, w, h);
  kanokFrame(ctx, B.x, B.y, B.w, B.h, 12);
  text(ctx, 'แท่นลายแทง', B.x + 20 * s, B.y + 20 * s, 16 * s, C.goldHi);
  circle(ctx, B.close.x, B.close.y, B.close.r, 'rgba(120,30,20,0.9)', C.gold, 1.5);
  text(ctx, '✕', B.close.x, B.close.y + 1, 13 * s, '#fff', 'center');
  for (const r of B.rows) {
    const key = 'map' + r.t, n = p.currency[key] || 0, c = I.currency[key];
    ctx.fillStyle = n ? 'rgba(60,40,20,0.6)' : 'rgba(0,0,0,0.3)'; rrect(ctx, r.x, r.y, r.w, r.h, 8 * s); ctx.fill();
    ctx.strokeStyle = n ? c.color : 'rgba(184,154,88,0.35)'; ctx.lineWidth = 1.2; ctx.stroke();
    currencyIcon(ctx, key, r.x + 16 * s, r.y + r.h / 2, 9 * s);
    text(ctx, `${c.name}  ×${n}`, r.x + 32 * s, r.y + r.h / 2 - 5 * s, 12 * s, n ? c.color : 'rgba(244,230,200,0.4)', 'left', '600');
    text(ctx, `มอน Lv.${MP.levelBase + r.t * MP.levelPerTier} · ค่าปรับสุ่ม ${MP.modsPerTier[r.t]} อย่าง`, r.x + 32 * s, r.y + r.h / 2 + 8 * s, 9 * s, 'rgba(244,230,200,0.7)', 'left', 'normal');
  }
  text(ctx, 'ลายแทงขั้น 1 ได้จากบอสใหญ่และมอน Lv.18+ · ล้มบอสในถ้ำได้ลายแทงขั้นถัดไป', B.x + 20 * s, B.y + B.h - 18 * s, 9.5 * s, C.goldHi, 'left', 'normal');
}

// คืน true ถ้าควรปิด
export function updateMapMenu(game, L, w, h) {
  const B = mapMenuLayout(w, h, L.s);
  if (game.input.pressed.pause || game.input.pressed.interact || game.input.pressed.bag) return true;
  for (const t of game.input.taps) {
    if (t.consumed) continue;
    t.consumed = true;
    if (Math.hypot(t.sx - B.close.x, t.sy - B.close.y) < B.close.r * 1.4) return true;
    if (t.sx < B.x || t.sx > B.x + B.w || t.sy < B.y || t.sy > B.y + B.h) return true;
    const r = B.rows.find((q) => t.sx >= q.x && t.sx <= q.x + q.w && t.sy >= q.y && t.sy <= q.y + q.h);
    if (r) { if (!openMap(game, r.t)) game.audio.play('click'); return false; }
  }
  return false;
}

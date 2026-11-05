// หน้าโปรไฟล์ (แตะรูปตัวละครมุมซ้ายบน): แถบ ตัวละคร / ชุด / พลอย / คราฟต์ / พาสซีฟ
// แถบพลอย (ช่องพลอยบนอาวุธ/เสื้อ) อยู่ที่ gemtab.js
import { C, kanokFrame, rrect, circle } from '../art/draw.js';
import { uiText as text } from './hud.js';
import { drawEquip, updateEquip } from './equip.js';
import { drawProfileStats } from './profile.js';
import { pointsLeft } from '../systems/passives.js';
import { drawGemTab, updateGemTab } from './gemtab.js';
import { drawCraftTab, updateCraftTab } from './crafttab.js';

const COLS = 6;

export function bagLayout(w, h, s) {
  const pw = Math.min(w - 20, 720 * s), ph = Math.min(h - 16, 360 * s), x = w / 2 - pw / 2, y = h / 2 - ph / 2;
  const gx = x + pw * 0.5 + 6 * s, gy = y + 52 * s, cell = Math.min(46 * s, (pw * 0.5 - 24 * s) / COLS);
  const close = { x: x + pw - 20 * s, y: y + 20 * s, r: 14 * s };
  const tabs = [['stats', 'ตัวละคร'], ['gear', 'ชุด'], ['gems', 'พลอย'], ['craft', 'คราฟต์'], ['tree', 'พาสซีฟ']].map(([id, label], i) => ({ id, label, x: x + 104 * s + i * 72 * s, y: y + 8 * s, w: 66 * s, h: 24 * s }));
  return { x, y, w: pw, h: ph, grid: { x: gx, y: gy, cell }, close, tabs, s, W: w, H: h };
}

export function drawBag(ctx, game, L, w, h) {
  const p = game.player, B = bagLayout(w, h, L.s), s = B.s;
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, w, h);
  kanokFrame(ctx, B.x, B.y, B.w, B.h, 12);
  text(ctx, 'โปรไฟล์', B.x + 20 * s, B.y + 20 * s, 16 * s, C.goldHi);
  const tab = game.bagTab || 'stats';
  for (const tb of B.tabs) {
    const on = tb.id === tab;
    ctx.fillStyle = on ? 'rgba(217,166,48,0.35)' : 'rgba(0,0,0,0.35)'; rrect(ctx, tb.x, tb.y, tb.w, tb.h, 8 * s); ctx.fill();
    ctx.strokeStyle = on ? C.goldHi : 'rgba(184,154,88,0.5)'; ctx.lineWidth = 1.2; ctx.stroke();
    text(ctx, tb.label, tb.x + tb.w / 2, tb.y + tb.h / 2 + 0.5, 11 * s, on ? C.goldHi : C.cream, 'center');
    const badge = tb.id === 'gems' ? p.bag.length : tb.id === 'tree' ? passivePointsLeft(game) : 0;
    if (badge > 0) { circle(ctx, tb.x + tb.w - 3 * s, tb.y + 2 * s, 6 * s, tb.id === 'tree' ? '#3aa85a' : '#e0443a', '#fff', 1); text(ctx, String(badge), tb.x + tb.w - 3 * s, tb.y + 2.5 * s, 8 * s, '#fff', 'center', '600'); }
  }
  circle(ctx, B.close.x, B.close.y, B.close.r, 'rgba(120,30,20,0.9)', C.gold, 1.5);
  text(ctx, '✕', B.close.x, B.close.y + 1, 13 * s, '#fff', 'center');
  game.tipLater = null;
  if (tab === 'gear') drawEquip(ctx, game, B);
  else if (tab === 'stats') drawProfileStats(ctx, game, B);
  else if (tab === 'craft') drawCraftTab(ctx, game, B);
  else drawGemTab(ctx, game, B);
  if (game.tipLater) game.tipLater();                          // กล่องรายละเอียดวาดทับบนสุด
}

// รับการแตะ/คลิกในหน้าโปรไฟล์ คืน true ถ้าควรปิด หรือ 'tree' ถ้าเลือกแถบพาสซีฟ (เปิดต้นเต็มจอ)
export function updateBag(game, L, w, h) {
  const B = bagLayout(w, h, L.s);
  if (game.input.pressed.bag || game.input.pressed.pause) return true;
  for (const t of game.input.taps) {
    if (t.consumed) continue;
    t.consumed = true;
    if (Math.hypot(t.sx - B.close.x, t.sy - B.close.y) < B.close.r * 1.4) return true;
    if (t.sx < B.x || t.sx > B.x + B.w || t.sy < B.y || t.sy > B.y + B.h) return true;   // แตะนอกกรอบ = ปิด
    const tb = B.tabs.find((q) => t.sx >= q.x && t.sx <= q.x + q.w && t.sy >= q.y && t.sy <= q.y + q.h);
    if (tb) { game.audio.play('click'); if (tb.id === 'tree') return 'tree'; game.bagTab = tb.id; continue; }
    const tab = game.bagTab || 'stats';
    if (tab === 'stats') continue;
    if (tab === 'gear') { updateEquip(game, B, t); continue; }
    if (tab === 'craft') { updateCraftTab(game, B, t); continue; }
    updateGemTab(game, B, t);
  }
  return false;
}

// แผงสถานะมุมซ้ายบน (รูปตัวละคร + หลอดเลือด) = ปุ่มเปิดโปรไฟล์
export function profileHit(L, t) { const P = L.profile; return t.sx >= P.x && t.sx <= P.x + P.w && t.sy >= P.y && t.sy <= P.y + P.h; }

export function passivePointsLeft(game) { return Math.max(0, pointsLeft(game.player, game.data.passives)); }

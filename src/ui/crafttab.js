// แถบคราฟต์ในหน้าโปรไฟล์ (แบบหีบศิลา/Currency Tab ของ PoE): ซ้าย = ของทั้งหมด (สวม + กระเป๋า)
// กลาง = ช่องวางของที่จะคราฟต์ + ช่องศิลาประจำชนิด (จำนวนที่มี) · ขวา = รายละเอียดของในช่อง (อัปเดตทันทีหลังใช้ศิลา)
// แตะของ = วางลงช่องคราฟต์ · แตะศิลา = ดูคำอธิบาย · แตะซ้ำ = ใช้กับของในช่อง
import { C, rrect } from '../art/draw.js';
import { uiText as text, wrapLines } from './hud.js';
import { itemIcon } from './equip.js';
import { currencyIcon } from './gemtab.js';
import { drawItemTip } from './tooltip.js';
import { itemName } from '../systems/items.js';
import { applyCurrency, CRAFT_CURRENCY, SOCKET_CURRENCY } from '../systems/crafting.js';

const COLS = 5;
const ROWS = [CRAFT_CURRENCY, [...SOCKET_CURRENCY, 'regret']];   // แถวบน = เปลี่ยนค่า · แถวล่าง = ช่องพลอย (+ใบลานแสดงจำนวน)

export function craftLayout(B, nItems = 37) {                     // 37 = ช่องสวม 7 + กระเป๋า 30 ต้องพอดีกรอบเสมอ
  const s = B.s, top = B.y + 58 * s, gw = B.w * 0.30, cell = Math.min(40 * s, (gw - 10 * s) / COLS, (B.y + B.h - 14 * s - top) / Math.ceil(nItems / COLS));
  const mx = B.x + 22 * s + gw, mw = B.w * 0.36, slot = { x: mx + mw / 2 - 30 * s, y: top + 4 * s, w: 60 * s, h: 60 * s };
  const cw = (mw - 9 * s) / 4, ch = 40 * s;
  const cur = ROWS.flatMap((row, r) => row.map((kind, i) => ({ kind, x: mx + i * (cw + 3 * s), y: top + 82 * s + r * (ch + 4 * s), w: cw, h: ch })));
  return { grid: { x: B.x + 14 * s, y: top, cell }, slot, cur, tipX: mx + mw - 6 * s, info: { x: mx, y: top + 82 * s + 2 * (ch + 4 * s) + 6 * s, w: mw } };
}

// รายการของ: ที่สวมอยู่ก่อน แล้วกระเป๋า
function craftable(p) { return [...Object.values(p.equip).filter(Boolean), ...p.items]; }
export function craftTarget(game) { return game.craftUid ? craftable(game.player).find((it) => it.uid === game.craftUid) || null : null; }

export function drawCraftTab(ctx, game, B) {
  const I = game.data.items, p = game.player, s = B.s, L = craftLayout(B), G = L.grid, eq = new Set(Object.values(p.equip).filter(Boolean).map((x) => x.uid));
  const list = craftable(p), target = craftTarget(game);
  text(ctx, 'ของทั้งหมด (แตะเพื่อวางลงช่องคราฟต์)', G.x, B.y + 48 * s, 9 * s, 'rgba(244,230,200,0.7)', 'left', 'normal');
  list.forEach((it, i) => {
    const cx = G.x + (i % COLS) * G.cell + G.cell / 2, cy = G.y + Math.floor(i / COLS) * G.cell + G.cell / 2 + 6 * s, on = target && target.uid === it.uid;
    ctx.fillStyle = on ? 'rgba(217,166,48,0.35)' : eq.has(it.uid) ? 'rgba(60,40,20,0.5)' : 'rgba(0,0,0,0.3)'; rrect(ctx, cx - G.cell / 2 + 1.5, cy - G.cell / 2 + 1.5, G.cell - 3, G.cell - 3, 4 * s); ctx.fill();
    ctx.strokeStyle = I.rarity[it.rarity].color; ctx.lineWidth = on ? 2.4 : 1.3; ctx.stroke();
    itemIcon(ctx, I, it, cx, cy, G.cell * 0.32);
    if (eq.has(it.uid)) text(ctx, 'สวม', cx - G.cell * 0.34, cy - G.cell * 0.32, 7 * s, C.goldHi, 'left', '600');
  });
  // ช่องคราฟต์ตรงกลาง
  const S = L.slot;
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; rrect(ctx, S.x, S.y, S.w, S.h, 8 * s); ctx.fill();
  ctx.strokeStyle = target ? I.rarity[target.rarity].color : `rgba(217,166,48,${0.5 + Math.sin(game.time * 4) * 0.3})`; ctx.lineWidth = 2.2; ctx.stroke();
  if (target) itemIcon(ctx, I, target, S.x + S.w / 2, S.y + S.h / 2, S.w * 0.36);
  else text(ctx, 'วางของ', S.x + S.w / 2, S.y + S.h / 2, 10 * s, 'rgba(244,230,200,0.6)', 'center', 'normal');
  text(ctx, target ? itemName(I, target) : 'ช่องคราฟต์', S.x + S.w / 2, S.y + S.h + 10 * s, 10 * s, target ? I.rarity[target.rarity].color : C.cream, 'center', '600');
  // ช่องศิลาประจำชนิด
  for (const c of L.cur) {
    const info = I.currency[c.kind], have = (p.currency && p.currency[c.kind]) || 0, on = game.craftCur === c.kind;
    ctx.fillStyle = on ? 'rgba(217,166,48,0.35)' : 'rgba(0,0,0,0.45)'; rrect(ctx, c.x, c.y, c.w, c.h, 6 * s); ctx.fill();
    ctx.strokeStyle = on ? C.goldHi : 'rgba(184,154,88,0.5)'; ctx.lineWidth = on ? 2 : 1; ctx.stroke();
    ctx.globalAlpha = have ? 1 : 0.4; currencyIcon(ctx, c.kind, c.x + c.w / 2, c.y + 14 * s, 9 * s); ctx.globalAlpha = 1;
    text(ctx, String(have), c.x + c.w - 5 * s, c.y + 8 * s, 9 * s, have ? '#fff' : 'rgba(244,230,200,0.4)', 'right', '600');
    text(ctx, info.name, c.x + c.w / 2, c.y + c.h - 8 * s, 7.5 * s, have ? C.cream : 'rgba(244,230,200,0.4)', 'center', 'normal');
  }
  // บรรทัดแนะนำ/ผลลัพธ์
  let info = !target ? 'แตะของทางซ้ายเพื่อวางลงช่องคราฟต์' : !game.craftCur ? 'แตะศิลาเพื่อดูว่าทำอะไร · แตะซ้ำเพื่อใช้กับของในช่อง' : I.currency[game.craftCur].desc + ' — แตะซ้ำเพื่อใช้', col = game.craftCur ? '#9af0b0' : C.cream;
  if (game.craftTabMsg && game.craftTabMsg.t > game.time) { info = game.craftTabMsg.text; col = game.craftTabMsg.col; }
  ctx.font = `normal ${9.5 * s}px Kanit, sans-serif`;
  wrapLines(ctx, info, L.info.w).slice(0, 3).forEach((l, k) => text(ctx, l, L.info.x, L.info.y + 6 * s + k * 13 * s, 9.5 * s, col, 'left', 'normal'));
  if (target) game.tipLater = () => drawItemTip(ctx, game, target, L.tipX, B.y + B.h / 2, { s, W: B.W, H: B.H });   // รายละเอียดสดของชิ้นในช่อง
}

export function updateCraftTab(game, B, t) {
  const I = game.data.items, p = game.player, L = craftLayout(B), G = L.grid;
  const inR = (r) => t.sx >= r.x && t.sx <= r.x + r.w && t.sy >= r.y && t.sy <= r.y + r.h;
  const c = L.cur.find(inR);
  if (c) {
    if (game.craftCur !== c.kind) { game.craftCur = c.kind; game.craftTabMsg = null; game.audio.play('click'); return; }
    const it = craftTarget(game), r = applyCurrency(game, c.kind, it);
    game.craftTabMsg = { text: r.text, col: r.ok ? I.rarity[it.rarity].color : '#ff8a7a', t: game.time + 3 };
    game.audio.play(r.ok ? 'level' : 'click');
    return;
  }
  const list = craftable(p), col = Math.floor((t.sx - G.x) / G.cell), row = Math.floor((t.sy - G.y - 6 * B.s) / G.cell), i = row * COLS + col;
  if (col >= 0 && col < COLS && row >= 0 && list[i]) { game.craftUid = list[i].uid; game.craftTabMsg = null; game.audio.play('click'); return; }
  if (inR(L.slot)) { game.craftUid = null; game.audio.play('click'); }      // แตะช่องคราฟต์ = เอาของออก
}

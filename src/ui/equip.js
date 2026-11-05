// แถบ "ชุด" ในกระเป๋า: ช่องสวมใส่ 6 ช่อง + กระเป๋าของ · แตะของ 1 ครั้งดู/เทียบค่า แตะซ้ำเพื่อสวม · แตะช่องที่สวมแล้วซ้ำเพื่อถอด
import { C, rrect } from '../art/draw.js';
import { itemIcon } from './itemicon.js';
import { drawItemTip } from './tooltip.js';
import { uiText as text } from './hud.js';
import { EQUIP_SLOTS, itemName, equipFromBag, unequip, discard } from '../systems/items.js';
import { applyCurrency } from '../systems/crafting.js';
import { currencyIcon } from './itemicon.js';
import { drawCurrencyTip } from './tooltip.js';

const COLS = 6;
const CRAFT = ['gild', 'alch', 'kali', 'exalt'];

export function equipLayout(B, I) {
  const s = B.s, slots = {};
  EQUIP_SLOTS.forEach((id, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    slots[id] = { id, x: B.x + 22 * s + col * 70 * s, y: B.y + 44 * s + row * 52 * s, w: 58 * s, h: 46 * s };
  });
  const gx = B.x + 175 * s, gy = B.y + 52 * s, cell = Math.min(44 * s, (B.x + B.w - gx - 14 * s) / COLS);
  const info = { x: B.x + 14 * s, y: B.y + B.h - 78 * s, w: B.w - 28 * s, h: 66 * s };
  const del = { x: info.x + info.w - 70 * s, y: info.y + info.h - 26 * s, w: 60 * s, h: 20 * s };
  const cw = Math.min(98 * s, (info.w - 90 * s) / CRAFT.length - 6 * s);
  const craft = CRAFT.map((kind, i) => ({ kind, x: info.x + 10 * s + i * (cw + 6 * s), y: info.y + info.h - 26 * s, w: cw, h: 20 * s }));   // ปุ่มเล่นแร่แปรธาตุ
  return { slots, grid: { x: gx, y: gy, cell, rows: Math.max(1, Math.floor((info.y - gy - 4 * s) / cell)) }, info, del, craft };
}

// ภาพไอเท็มเดียวกับที่ตกพื้นและในร้าน (art/items.js)


export function drawEquip(ctx, game, B) {
  const I = game.data.items, p = game.player, s = B.s, E = equipLayout(B, I), sel = game.gearSel;
  for (const sl of Object.values(E.slots)) {
    const it = p.equip[sl.id];
    const on = sel && sel.slot === sl.id;
    ctx.fillStyle = on ? 'rgba(217,166,48,0.25)' : 'rgba(0,0,0,0.35)'; rrect(ctx, sl.x, sl.y, sl.w, sl.h, 7 * s); ctx.fill();
    ctx.strokeStyle = it ? I.rarity[it.rarity].color : 'rgba(184,154,88,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
    if (it) itemIcon(ctx, game.data, it, sl.x + sl.w / 2, sl.y + sl.h / 2 - 3 * s, 15 * s);
    text(ctx, I.slots[sl.id].name, sl.x + sl.w / 2, sl.y + sl.h - 7 * s, 8 * s, 'rgba(244,230,200,0.7)', 'center', 'normal');
  }
  const g = E.grid;
  text(ctx, `กระเป๋าของ (${p.items.length}/${I.bagSize})`, g.x, B.y + 40 * s, 10 * s, C.cream, 'left', 'normal');
  p.items.forEach((it, i) => {
    const r = Math.floor(i / COLS); if (r >= g.rows) return;
    const cx = g.x + (i % COLS) * g.cell + g.cell / 2, cy = g.y + r * g.cell + g.cell / 2;
    const on = sel && sel.uid === it.uid;
    ctx.fillStyle = on ? 'rgba(217,166,48,0.35)' : 'rgba(0,0,0,0.35)'; rrect(ctx, cx - g.cell / 2 + 2, cy - g.cell / 2 + 2, g.cell - 4, g.cell - 4, 6 * s); ctx.fill();
    ctx.strokeStyle = I.rarity[it.rarity].color; ctx.lineWidth = it.rarity === 'normal' ? 0.8 : 1.6; ctx.stroke();
    itemIcon(ctx, game.data, it, cx, cy, g.cell * 0.3);
    if (p.level < I.bases[it.base].req) { ctx.fillStyle = 'rgba(160,30,20,0.45)'; rrect(ctx, cx - g.cell / 2 + 2, cy - g.cell / 2 + 2, g.cell - 4, g.cell - 4, 6 * s); ctx.fill(); }
  });
  // รายละเอียด + เทียบกับของที่สวมอยู่
  const N = E.info;
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; rrect(ctx, N.x, N.y, N.w, N.h, 8 * s); ctx.fill();
  for (const c of E.craft) {                                   // ทองคำเปลว / ปรอทเล่นแร่ / เถ้ากาลี (แตะเลือก แล้วแตะซ้ำใช้กับของที่เลือก)
    const info = I.currency[c.kind], have = (p.currency && p.currency[c.kind]) || 0, on = game.craftSel === c.kind;
    ctx.fillStyle = on ? 'rgba(217,166,48,0.35)' : 'rgba(0,0,0,0.45)'; rrect(ctx, c.x, c.y, c.w, c.h, 6 * s); ctx.fill();
    ctx.strokeStyle = on ? C.goldHi : 'rgba(184,154,88,0.5)'; ctx.lineWidth = 1; ctx.stroke();
    currencyIcon(ctx, c.kind, c.x + 10 * s, c.y + c.h / 2, 7 * s);
    text(ctx, `${info.name} ×${have}`, c.x + 20 * s, c.y + c.h / 2 + 0.5, 8.5 * s, have ? C.cream : 'rgba(244,230,200,0.4)', 'left', '600');
  }
  if (game.craftSel) { const c = E.craft.find((q) => q.kind === game.craftSel); game.tipLater = () => drawCurrencyTip(ctx, game, game.craftSel, c.x + c.w / 2, c.y, { s, W: B.W, H: B.H, hint: 'เลือกของก่อน แล้วแตะปุ่มนี้อีกครั้งเพื่อใช้' }); }
  if (game.craftMsg && game.craftMsg.t > game.time) text(ctx, game.craftMsg.text, N.x + N.w - 10 * s, N.y + 30 * s, 10 * s, game.craftMsg.col, 'right', '600');
  const it = sel ? (sel.uid ? p.items.find((x) => x.uid === sel.uid) : p.equip[sel.slot]) : null;
  if (!it) {
    text(ctx, 'แตะของเพื่อดูค่า แตะซ้ำเพื่อสวม · ขาว ทั่วไป · เขียว ดี · ม่วง หายาก · แดง ตำนาน', N.x + 10 * s, N.y + 20 * s, 10 * s, C.cream, 'left', 'normal');
    return;
  }
  const b = I.bases[it.base], col = I.rarity[it.rarity].color;
  text(ctx, itemName(I, it), N.x + 10 * s, N.y + 13 * s, 12 * s, col);
  text(ctx, `${I.rarity[it.rarity].name} · ${I.slots[b.slot].name} · ต้องเลเวล ${b.req}`, N.x + 10 * s, N.y + 30 * s, 9 * s, 'rgba(244,230,200,0.7)', 'left', 'normal');
  let hint, ax, ay;
  if (sel.uid) {
    const i = p.items.findIndex((x) => x.uid === it.uid);
    ax = g.x + (i % COLS) * g.cell + g.cell / 2; ay = g.y + Math.floor(i / COLS) * g.cell + g.cell / 2;
    hint = p.level < b.req ? `ต้องเลเวล ${b.req}` : 'แตะอีกครั้งเพื่อสวม';
    ctx.fillStyle = game.confirmDiscard === it.uid ? '#a02a20' : 'rgba(120,40,30,0.7)'; rrect(ctx, E.del.x, E.del.y, E.del.w, E.del.h, 6 * s); ctx.fill();
    text(ctx, game.confirmDiscard === it.uid ? 'ยืนยันทิ้ง' : 'ทิ้ง', E.del.x + E.del.w / 2, E.del.y + E.del.h / 2 + 0.5, 9.5 * s, '#fff', 'center');
  } else { hint = 'แตะอีกครั้งเพื่อถอดเข้ากระเป๋า'; const sl = E.slots[sel.slot]; ax = sl.x + sl.w; ay = sl.y + sl.h / 2; }
  // กล่องรายละเอียดแบบ PoE ข้างของที่เลือก (ค่าทุกบรรทัด ช่องพลอย เทียบกับที่สวม)
  if (!game.craftSel) game.tipLater = () => drawItemTip(ctx, game, it, ax, ay, { s, W: B.W, H: B.H, compare: sel.uid ? p.equip[b.slot] : null, hint });
  text(ctx, hint, N.x + N.w - 80 * s, N.y + 13 * s, 10 * s, '#9af0b0', 'right', '600');
}

export function updateEquip(game, B, t) {
  const I = game.data.items, p = game.player, s = B.s, E = equipLayout(B, I), sel = game.gearSel;
  const inR = (r) => t.sx >= r.x && t.sx <= r.x + r.w && t.sy >= r.y && t.sy <= r.y + r.h;
  const cb = E.craft.find(inR);
  if (cb) {
    game.confirmDiscard = null;
    if (game.craftSel !== cb.kind) { game.craftSel = cb.kind; game.audio.play('click'); return; }
    const it = sel ? (sel.uid ? p.items.find((x) => x.uid === sel.uid) : p.equip[sel.slot]) : null, r = applyCurrency(game, cb.kind, it);
    game.craftMsg = { text: r.text, col: r.ok ? I.rarity[it.rarity].color : '#ff8a7a', t: game.time + 2.5 };
    if (r.ok) { game.audio.play('level'); game.craftSel = null; }
    return;
  }
  game.craftSel = null;
  if (sel && sel.uid && inR(E.del)) {
    if (game.confirmDiscard === sel.uid) { discard(p, sel.uid); game.gearSel = null; game.confirmDiscard = null; game.audio.play('click'); game.events.emit('gearChanged', {}); }
    else game.confirmDiscard = sel.uid;
    return;
  }
  game.confirmDiscard = null;
  for (const sl of Object.values(E.slots)) {
    if (!inR(sl)) continue;
    if (sel && sel.slot === sl.id && p.equip[sl.id]) { if (unequip(I, p, sl.id)) { game.audio.play('click'); game.events.emit('gearChanged', {}); } game.gearSel = null; }
    else game.gearSel = p.equip[sl.id] ? { slot: sl.id } : null;
    return;
  }
  const g = E.grid, col = Math.floor((t.sx - g.x) / g.cell), r = Math.floor((t.sy - g.y) / g.cell);
  if (col >= 0 && col < COLS && r >= 0 && r < g.rows) {
    const it = p.items[r * COLS + col];
    if (!it) { game.gearSel = null; return; }
    if (sel && sel.uid === it.uid) {
      if (equipFromBag(I, p, it.uid)) { game.audio.play('gem'); game.events.emit('gearChanged', {}); game.gearSel = null; }
      else game.audio.play('warn');
    } else { game.gearSel = { uid: it.uid }; game.audio.play('click'); }
  }
}


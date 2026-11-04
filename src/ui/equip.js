// แถบ "ชุด" ในกระเป๋า: ช่องสวมใส่ 6 ช่อง + กระเป๋าของ · แตะของ 1 ครั้งดู/เทียบค่า แตะซ้ำเพื่อสวม · แตะช่องที่สวมแล้วซ้ำเพื่อถอด
import { C, rrect, circle, poly } from '../art/draw.js';
import { uiText as text } from './hud.js';
import { EQUIP_SLOTS, itemName, itemStats, equipFromBag, unequip, discard } from '../systems/items.js';

const COLS = 6;

export function equipLayout(B, I) {
  const s = B.s, slots = {};
  EQUIP_SLOTS.forEach((id, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    slots[id] = { id, x: B.x + 22 * s + col * 70 * s, y: B.y + 44 * s + row * 52 * s, w: 58 * s, h: 46 * s };
  });
  const gx = B.x + 175 * s, gy = B.y + 52 * s, cell = Math.min(44 * s, (B.x + B.w - gx - 14 * s) / COLS);
  const info = { x: B.x + 14 * s, y: B.y + B.h - 78 * s, w: B.w - 28 * s, h: 66 * s };
  const del = { x: info.x + info.w - 70 * s, y: info.y + info.h - 26 * s, w: 60 * s, h: 20 * s };
  return { slots, grid: { x: gx, y: gy, cell, rows: Math.max(1, Math.floor((info.y - gy - 4 * s) / cell)) }, info, del };
}

function itemIcon(ctx, I, it, x, y, r) {
  const b = I.bases[it.base], col = b.color;
  ctx.save(); ctx.translate(x, y);
  if (b.slot === 'weapon') { ctx.rotate(-0.8); ctx.fillStyle = col; ctx.fillRect(-r * 0.12, -r * 0.8, r * 0.24, r * 1.2); ctx.fillStyle = C.gold; ctx.fillRect(-r * 0.4, r * 0.35, r * 0.8, r * 0.14); ctx.fillStyle = '#5a2f1a'; ctx.fillRect(-r * 0.1, r * 0.48, r * 0.2, r * 0.35); }
  else if (b.slot === 'head') { poly(ctx, [-r * 0.8, r * 0.3, 0, -r * 0.6, r * 0.8, r * 0.3], col, C.ink, 1.2); ctx.fillStyle = C.gold; ctx.fillRect(-r * 0.6, r * 0.2, r * 1.2, r * 0.15); }
  else if (b.slot === 'body') { poly(ctx, [-r * 0.7, -r * 0.5, -r * 0.25, -r * 0.7, r * 0.25, -r * 0.7, r * 0.7, -r * 0.5, r * 0.55, r * 0.7, -r * 0.55, r * 0.7], col, C.ink, 1.2); }
  else if (b.slot === 'legs') { ctx.fillStyle = col; ctx.fillRect(-r * 0.5, -r * 0.6, r * 0.42, r * 1.3); ctx.fillRect(r * 0.08, -r * 0.6, r * 0.42, r * 1.3); ctx.fillStyle = C.gold; ctx.fillRect(-r * 0.5, -r * 0.6, r, r * 0.15); }
  else if (b.slot === 'arms') { ctx.fillStyle = col; ctx.fillRect(-r * 0.6, -r * 0.4, r * 0.45, r * 0.9); ctx.fillRect(r * 0.15, -r * 0.4, r * 0.45, r * 0.9); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-r * 0.6, 0, r * 1.2, r * 0.12); }
  else if (b.slot === 'ring') { circle(ctx, 0, r * 0.1, r * 0.5, null, col, r * 0.22); circle(ctx, 0, -r * 0.42, r * 0.2, '#e84a5a', C.ink, 1); }
  else { ctx.strokeStyle = col; ctx.lineWidth = r * 0.12; ctx.beginPath(); ctx.arc(0, -r * 0.3, r * 0.55, 0.2, Math.PI - 0.2); ctx.stroke(); poly(ctx, [0, r * 0.25, r * 0.22, r * 0.55, 0, r * 0.85, -r * 0.22, r * 0.55], col, C.ink, 1); }
  ctx.restore();
}

function statLines(I, P, it) {
  const names = P.statNames;
  return Object.entries(itemStats(I, it)).map(([k, v]) => (names[k] || k + ' {}').replace('{}', String(v)));
}

export function drawEquip(ctx, game, B) {
  const I = game.data.items, P = game.data.passives, p = game.player, s = B.s, E = equipLayout(B, I), sel = game.gearSel;
  for (const sl of Object.values(E.slots)) {
    const it = p.equip[sl.id];
    const on = sel && sel.slot === sl.id;
    ctx.fillStyle = on ? 'rgba(217,166,48,0.25)' : 'rgba(0,0,0,0.35)'; rrect(ctx, sl.x, sl.y, sl.w, sl.h, 7 * s); ctx.fill();
    ctx.strokeStyle = it ? I.rarity[it.rarity].color : 'rgba(184,154,88,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
    if (it) itemIcon(ctx, I, it, sl.x + sl.w / 2, sl.y + sl.h / 2 - 3 * s, 15 * s);
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
    itemIcon(ctx, I, it, cx, cy, g.cell * 0.3);
    if (p.level < I.bases[it.base].req) { ctx.fillStyle = 'rgba(160,30,20,0.45)'; rrect(ctx, cx - g.cell / 2 + 2, cy - g.cell / 2 + 2, g.cell - 4, g.cell - 4, 6 * s); ctx.fill(); }
  });
  // รายละเอียด + เทียบกับของที่สวมอยู่
  const N = E.info;
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; rrect(ctx, N.x, N.y, N.w, N.h, 8 * s); ctx.fill();
  const it = sel ? (sel.uid ? p.items.find((x) => x.uid === sel.uid) : p.equip[sel.slot]) : null;
  if (!it) {
    text(ctx, 'แตะของเพื่อดูค่า แตะซ้ำเพื่อสวม · ขาว ทั่วไป · เขียว ดี · ม่วง หายาก · แดง ตำนาน', N.x + 10 * s, N.y + 20 * s, 10 * s, C.cream, 'left', 'normal');
    text(ctx, 'ของดรอปจากมอนในทุ่ง ค่าสุ่มทุกชิ้น ยิ่งมอนเลเวลสูง ค่ายิ่งแรง', N.x + 10 * s, N.y + 42 * s, 10 * s, 'rgba(244,230,200,0.7)', 'left', 'normal');
    return;
  }
  const b = I.bases[it.base], col = I.rarity[it.rarity].color;
  text(ctx, itemName(I, it), N.x + 10 * s, N.y + 13 * s, 12 * s, col);
  text(ctx, `${I.rarity[it.rarity].name} · ${I.slots[b.slot].name} · ต้องเลเวล ${b.req} · ระดับของ ${it.ilvl}`, N.x + 10 * s, N.y + 30 * s, 9 * s, 'rgba(244,230,200,0.7)', 'left', 'normal');
  text(ctx, statLines(I, P, it).join(' · '), N.x + 10 * s, N.y + 46 * s, 10 * s, C.cream, 'left', 'normal');
  let hint;
  if (sel.uid) {
    const cur = p.equip[b.slot];
    if (cur) {                                                  // เทียบค่ากับของที่สวมอยู่
      const a = itemStats(I, it), c = itemStats(I, cur), keys = [...new Set([...Object.keys(a), ...Object.keys(c)])];
      const diff = keys.map((k) => [k, (a[k] || 0) - (c[k] || 0)]).filter(([, v]) => v);
      ctx.font = `600 ${9 * s}px Kanit, sans-serif`;
      let dx = N.x + 10 * s;
      for (const [k, v] of diff.slice(0, 5)) {
        const str = (P.statNames[k] || k).replace('+{}', (v > 0 ? '+' : '') + v).replace('{}', String(v));
        text(ctx, str, dx, N.y + 60 * s, 9 * s, v > 0 ? '#7dff8a' : '#ff7a6a', 'left', '600'); dx += ctx.measureText(str).width + 12 * s;
      }
    }
    hint = p.level < b.req ? `ต้องเลเวล ${b.req}` : 'แตะอีกครั้งเพื่อสวม';
    ctx.fillStyle = game.confirmDiscard === it.uid ? '#a02a20' : 'rgba(120,40,30,0.7)'; rrect(ctx, E.del.x, E.del.y, E.del.w, E.del.h, 6 * s); ctx.fill();
    text(ctx, game.confirmDiscard === it.uid ? 'ยืนยันทิ้ง' : 'ทิ้ง', E.del.x + E.del.w / 2, E.del.y + E.del.h / 2 + 0.5, 9.5 * s, '#fff', 'center');
  } else hint = 'แตะอีกครั้งเพื่อถอดเข้ากระเป๋า';
  text(ctx, hint, N.x + N.w - 80 * s, N.y + 13 * s, 10 * s, '#9af0b0', 'right', '600');
}

export function updateEquip(game, B, t) {
  const I = game.data.items, p = game.player, s = B.s, E = equipLayout(B, I), sel = game.gearSel;
  const inR = (r) => t.sx >= r.x && t.sx <= r.x + r.w && t.sy >= r.y && t.sy <= r.y + r.h;
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


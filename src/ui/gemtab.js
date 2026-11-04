// แถบ "พลอย" ในโปรไฟล์: ช่องพลอยบนอาวุธ/เสื้อแบบ PoE (สูงสุด 6 ช่อง เส้นทอง = เชื่อมกัน)
// แตะพลอยในกระเป๋า → แตะช่อง = ฝังลงช่องนั้น (หรือแตะพลอยซ้ำ = ฝังช่องว่างแรก) · แตะช่องที่มีพลอย = ถอด
// ศิลาเจาะ / ด้ายสายสิญจน์: แตะเลือก แล้วแตะซ้ำ = ใช้กับของแถวที่เลือก
import { C, rrect, circle, poly } from '../art/draw.js';
import { gemSprite } from '../art/gems.js';
import { uiText as text } from './hud.js';
import { gemInfo, gemType, socketGem, unsocketGem, skillsOf, SOCKET_SLOTS } from '../systems/gems.js';
import { useCurrency, socketMax, itemName } from '../systems/items.js';

const COLS = 6;
const SLOT_NAME = { weapon: 'อาวุธ', body: 'เสื้อ' };

export function gemLayout(B) {
  const s = B.s, rows = SOCKET_SLOTS.map((slot, g) => {
    const ry = B.y + 42 * s + g * 70 * s, rw = B.w * 0.5 - 18 * s;
    const gap = Math.min(40 * s, (rw - 40 * s) / 6);
    const sockets = Array.from({ length: 6 }, (_, i) => ({ slot, idx: i, x: B.x + 34 * s + i * gap, y: ry + 40 * s, r: 14 * s }));
    return { group: g, slot, x: B.x + 12 * s, y: ry, w: rw, h: 64 * s, sockets };
  });
  const cy = B.y + 42 * s + 2 * 70 * s + 4 * s, cw = (B.w * 0.5 - 24 * s) / 2;
  const cur = ['jeweller', 'fusing'].map((k, i) => ({ kind: k, x: B.x + 12 * s + i * (cw + 6 * s), y: cy, w: cw, h: 26 * s }));
  return { rows, cur };
}

export function gemIcon(ctx, G, id, x, y, r, dim) {
  ctx.globalAlpha = dim ? 0.4 : 1;
  ctx.drawImage(gemSprite(G, id, r * 2.4 * (ctx.getTransform().a || 1)), x - r * 1.2, y - r * 1.2, r * 2.4, r * 2.4);
  ctx.globalAlpha = 1;
}

// ไอคอนของเชื่อม/เจาะ: ศิลา (หินเทามีรู) · ด้ายสายสิญจน์ (ม้วนด้ายขาว)
export function currencyIcon(ctx, kind, x, y, r) {
  if (kind === 'jeweller') {
    poly(ctx, [x - r * 0.8, y + r * 0.5, x - r * 0.6, y - r * 0.5, x + r * 0.2, y - r * 0.8, x + r * 0.8, y - r * 0.2, x + r * 0.6, y + r * 0.6], '#b8b0a0', C.ink, 1.2);
    circle(ctx, x, y, r * 0.22, '#3a3430', null);
  } else {
    circle(ctx, x, y, r * 0.7, '#f4f0e8', C.ink, 1.2);
    ctx.strokeStyle = '#c9b89a'; ctx.lineWidth = 1;
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(x - r * 0.6, y + i * r * 0.2); ctx.lineTo(x + r * 0.6, y + i * r * 0.2); ctx.stroke(); }
    ctx.strokeStyle = '#f4f0e8'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + r * 0.5, y + r * 0.4); ctx.quadraticCurveTo(x + r, y + r, x + r * 1.1, y + r * 0.3); ctx.stroke();
  }
}

export function drawGemTab(ctx, game, B) {
  const G = game.data.gems, I = game.data.items, p = game.player, s = B.s, GL = gemLayout(B);
  const sel = game.bagGroup || 0;
  for (const row of GL.rows) {
    const on = row.group === sel, it = p.equip[row.slot];
    ctx.fillStyle = on ? 'rgba(217,166,48,0.16)' : 'rgba(0,0,0,0.25)'; rrect(ctx, row.x, row.y, row.w, row.h, 8 * s); ctx.fill();
    if (on) { ctx.strokeStyle = C.gold; ctx.lineWidth = 1.5; ctx.stroke(); }
    const title = it ? `${SLOT_NAME[row.slot]}: ${itemName(I, it)}` : `${SLOT_NAME[row.slot]}: (ไม่ได้สวม)`;
    text(ctx, title, row.x + 10 * s, row.y + 11 * s, 10 * s, it ? I.rarity[it.rarity].color : 'rgba(244,230,200,0.5)', 'left', '600');
    if (!it) continue;
    const n = it.sockets || 0;
    if (n) text(ctx, `${n}/${socketMax(I, it)} ช่อง`, row.x + row.w - 8 * s, row.y + 11 * s, 9 * s, 'rgba(244,230,200,0.6)', 'right', 'normal');
    else text(ctx, 'ของชิ้นนี้ไม่มีช่องพลอย', row.x + 10 * s, row.y + 40 * s, 10 * s, 'rgba(244,230,200,0.5)', 'left', 'normal');
    for (let i = 0; i < n - 1; i++) {                               // เส้นเชื่อมแบบด้ายสายสิญจน์
      const a = row.sockets[i], b = row.sockets[i + 1];
      if (it.links[i]) { ctx.fillStyle = C.goldHi; ctx.fillRect(a.x, a.y - 3 * s, b.x - a.x, 6 * s); ctx.fillStyle = '#8a6a10'; ctx.fillRect(a.x, a.y - 0.5 * s, b.x - a.x, 1 * s); }
    }
    for (let i = 0; i < n; i++) {
      const so = row.sockets[i], g = it.gems[i];
      circle(ctx, so.x, so.y, so.r, '#1a1210', '#b89a58', 2.5);
      if (g) gemIcon(ctx, G, g, so.x, so.y, so.r * 0.8);
    }
  }
  // ของเชื่อม/เจาะ
  for (const c of GL.cur) {
    const info = I.currency[c.kind], on = game.curSel === c.kind, have = (p.currency && p.currency[c.kind]) || 0;
    ctx.fillStyle = on ? 'rgba(217,166,48,0.35)' : 'rgba(0,0,0,0.35)'; rrect(ctx, c.x, c.y, c.w, c.h, 8 * s); ctx.fill();
    ctx.strokeStyle = on ? C.goldHi : 'rgba(184,154,88,0.5)'; ctx.lineWidth = 1.2; ctx.stroke();
    currencyIcon(ctx, c.kind, c.x + 14 * s, c.y + c.h / 2, 9 * s);
    text(ctx, `${info.name} ×${have}`, c.x + 28 * s, c.y + c.h / 2 + 0.5, 10 * s, have ? C.cream : 'rgba(244,230,200,0.45)', 'left', '600');
  }
  // สกิลที่ได้
  const sk = skillsOf(G, p);
  const ky = GL.cur[0].y + 40 * s;
  text(ctx, 'สกิล:', B.x + 14 * s, ky, 10 * s, C.goldHi, 'left', '600');
  if (!sk.length) text(ctx, 'ฝังพลอยหลัก (เม็ดเหลี่ยม) ลงช่อง จะได้สกิล', B.x + 50 * s, ky, 10 * s, 'rgba(244,230,200,0.6)', 'left', 'normal');
  sk.slice(0, 3).forEach((k, i) => {
    const sup = k.supports.map((id) => G.support[id].name.replace('พลอยเสริม', '')).join('+');
    text(ctx, `${i + 1}. ${k.name}${sup ? ' (' + sup + ')' : ''} · มานา ${k.mp}${k.count > 1 ? ' · ' + k.count + ' ลูก' : ''}`, B.x + 50 * s, ky + i * 15 * s, 9.5 * s, k.hi || C.cream, 'left', 'normal');
  });
  if (sk.length > 3) text(ctx, `(+${sk.length - 3} สกิลที่ไม่มีปุ่ม)`, B.x + 50 * s, ky + 45 * s, 9 * s, 'rgba(244,230,200,0.5)', 'left', 'normal');
  // กระเป๋าพลอย
  const g = B.grid;
  text(ctx, `พลอยในกระเป๋า (${p.bag.length}) — แตะเลือก แล้วแตะช่องที่จะฝัง`, g.x, B.y + 36 * s, 10 * s, C.cream, 'left', 'normal');
  if (!p.bag.length) text(ctx, 'ยังไม่มีพลอย ฟาร์มมอนเพื่อหาพลอย', g.x, g.y + 20 * s, 10 * s, 'rgba(244,230,200,0.6)', 'left', 'normal');
  p.bag.forEach((id, i) => {
    const cx = g.x + (i % COLS) * g.cell + g.cell / 2, cy = g.y + Math.floor(i / COLS) * g.cell + g.cell / 2;
    if (cy > B.y + B.h - 50 * s) return;
    ctx.fillStyle = game.bagSel === i ? 'rgba(217,166,48,0.35)' : 'rgba(0,0,0,0.3)'; rrect(ctx, cx - g.cell / 2 + 2, cy - g.cell / 2 + 2, g.cell - 4, g.cell - 4, 6 * s); ctx.fill();
    gemIcon(ctx, G, id, cx, cy, g.cell * 0.3);
  });
  // คำอธิบาย
  let desc = 'เส้นทองเชื่อมช่อง = พลอยเสริมในช่องที่เชื่อมกันจะเสริมพลอยหลักในกลุ่มนั้น', col = C.goldHi;
  const showId = game.bagSel !== undefined && game.bagSel !== null ? p.bag[game.bagSel] : null;
  if (showId) desc = `${gemInfo(G, showId).name}: ${gemInfo(G, showId).desc}`;
  else if (game.curSel) desc = `${I.currency[game.curSel].name}: ${I.currency[game.curSel].desc} — แตะซ้ำเพื่อใช้กับ${SLOT_NAME[SOCKET_SLOTS[sel]]}`;
  if (game.gemMsg && game.gemMsg.t > game.time) { desc = game.gemMsg.text; col = game.gemMsg.col; }
  text(ctx, desc, B.x + 20 * s, B.y + B.h - 18 * s, 10 * s, col, 'left', 'normal');
}

export function updateGemTab(game, B, t) {
  const G = game.data.gems, I = game.data.items, p = game.player, GL = gemLayout(B);
  const say = (text, col = '#ff8a7a') => { game.gemMsg = { text, col, t: game.time + 2.5 }; };
  const changed = () => { game.audio.play('gem'); game.events.emit('gemsChanged', {}); };
  for (const row of GL.rows) {
    const it = p.equip[row.slot];
    for (const so of row.sockets) {
      if (!it || so.idx >= (it.sockets || 0) || Math.hypot(t.sx - so.x, t.sy - so.y) > so.r * 1.25) continue;
      game.bagGroup = row.group; game.curSel = null;
      if (game.bagSel !== null && game.bagSel !== undefined && p.bag[game.bagSel]) {
        if (socketGem(G, p, game.bagSel, row.slot, so.idx)) changed();
        game.bagSel = null;
      } else if (unsocketGem(p, row.slot, so.idx)) { game.audio.play('click'); game.events.emit('gemsChanged', {}); }
      return;
    }
    if (t.sx >= row.x && t.sx <= row.x + row.w && t.sy >= row.y && t.sy <= row.y + row.h) { game.bagGroup = row.group; game.audio.play('click'); return; }
  }
  for (const c of GL.cur) {
    if (t.sx < c.x || t.sx > c.x + c.w || t.sy < c.y || t.sy > c.y + c.h) continue;
    game.bagSel = null;
    if (game.curSel !== c.kind) { game.curSel = c.kind; game.audio.play('click'); return; }
    const slot = SOCKET_SLOTS[game.bagGroup || 0], it = p.equip[slot], name = I.currency[c.kind].name;
    if (!(p.currency[c.kind] > 0)) { say(`ไม่มี${name} — หาได้จากมอน บอส หรือร้านแม่ค้า`); return; }
    const r = useCurrency(I, game.rng, p, c.kind, it);
    if (!r) { say(it ? `ใช้${name}กับ${itemName(I, it)}ไม่ได้` : `ยังไม่ได้สวม${SLOT_NAME[slot]}`); return; }
    game.audio.play('level'); say(`${name}: ${r}`, '#9af0b0');
    game.events.emit('currencyUsed', { kind: c.kind }); game.events.emit('gemsChanged', {});
    return;
  }
  const g = B.grid, col = Math.floor((t.sx - g.x) / g.cell), r = Math.floor((t.sy - g.y) / g.cell);
  if (col >= 0 && col < COLS && r >= 0) {
    const i = r * COLS + col;
    if (i >= p.bag.length) return;
    game.curSel = null;
    if (game.bagSel === i) {                                   // แตะซ้ำ = ฝังช่องว่างแรกของแถวที่เลือก
      const slot = SOCKET_SLOTS[game.bagGroup || 0], it = p.equip[slot];
      if (!it || !it.sockets) say(`${SLOT_NAME[slot]}ไม่มีช่องพลอย`);
      else if (socketGem(G, p, i, slot)) changed();
      game.bagSel = null;
    } else { game.bagSel = i; game.audio.play('click'); }
  }
}

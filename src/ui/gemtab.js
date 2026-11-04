// แถบ "พลอย" ในโปรไฟล์: ช่องพลอยบนอาวุธ/เสื้อแบบ PoE (สูงสุด 6 ช่อง เส้นทอง = เชื่อมกัน)
// แตะพลอยในกระเป๋า → แตะช่อง = ฝังลงช่องนั้น (หรือแตะพลอยซ้ำ = ฝังช่องว่างแรก) · แตะช่องที่มีพลอย = ดูรายละเอียด แตะซ้ำ = ถอด
// ช่องพลอยวาดทับบนรูปไอเท็ม (แบบ PoE) ไม่ใช่แถวแยก
// ศิลาเจาะ / ด้ายสายสิญจน์: แตะเลือก แล้วแตะซ้ำ = ใช้กับของแถวที่เลือก
import { C, rrect, circle, poly } from '../art/draw.js';
import { gemSprite } from '../art/gems.js';
import { uiText as text } from './hud.js';
import { socketGem, unsocketGem, skillsOf, SOCKET_SLOTS, gemLevel } from '../systems/gems.js';
import { useCurrency, socketMax, itemName } from '../systems/items.js';
import { itemSprite } from '../art/items.js';
import { drawItemTip, drawGemTip, drawCurrencyTip } from './tooltip.js';

const COLS = 6;
const SLOT_NAME = { weapon: 'อาวุธ', body: 'เสื้อ' };
export const SOCKET_COL = { r: { fill: 'rgba(90,14,16,0.92)', rim: '#e8404a' }, g: { fill: 'rgba(14,60,26,0.92)', rim: '#4ad870' }, b: { fill: 'rgba(14,30,80,0.92)', rim: '#4a8af0' }, w: { fill: 'rgba(60,60,64,0.92)', rim: '#f4f4f4' } };

// ตำแหน่งช่องบนรูปไอเท็มแบบ PoE: 2 แถวตั้งแบบงูเลื้อย (0 1 / 3 2 / 4 5) ศูนย์กลางที่ (cx, cy)
export function socketSpots(n, cx, cy, gap) {
  const order = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 2], [1, 2]].slice(0, n), cols = n > 1 ? 2 : 1, rows = Math.ceil(n / 2);
  return order.map(([c, r]) => ({ x: cx + (c - (cols - 1) / 2) * gap, y: cy + (r - (rows - 1) / 2) * gap }));
}

// การ์ดอาวุธ/เสื้อ (รูปไอเท็มใหญ่ + ช่องพลอยบนตัวของ) วางคู่กัน · ปุ่มศิลา/ด้าย · รายการสกิล
export function gemLayout(B, p) {
  const s = B.s, cw = (B.w * 0.5 - 30 * s) / 2, ch = 150 * s;
  const rows = SOCKET_SLOTS.map((slot, g) => {
    const x = B.x + 12 * s + g * (cw + 6 * s), y = B.y + 42 * s, it = p && p.equip[slot];
    const art = { x: x + cw / 2, y: y + 84 * s, size: Math.min(cw - 16 * s, 104 * s) };
    const spots = socketSpots(6, art.x, art.y, 30 * s), real = it && it.sockets ? socketSpots(it.sockets, art.x, art.y, 30 * s) : [];
    const sockets = spots.map((sp, i) => ({ slot, idx: i, x: (real[i] || sp).x, y: (real[i] || sp).y, r: 12 * s }));
    return { group: g, slot, x, y, w: cw, h: ch, art, sockets };
  });
  const cy = B.y + 42 * s + ch + 6 * s, cw2 = (B.w * 0.5 - 30 * s) / 3;
  const cur = ['jeweller', 'fusing', 'chroma'].map((k, i) => ({ kind: k, x: B.x + 12 * s + i * (cw2 + 6 * s), y: cy, w: cw2, h: 26 * s }));
  return { rows, cur };
}

export function gemIcon(ctx, G, id, x, y, r, dim, lv) {
  ctx.globalAlpha = dim ? 0.4 : 1;
  ctx.drawImage(gemSprite(G, id, r * 2.4 * (ctx.getTransform().a || 1)), x - r * 1.2, y - r * 1.2, r * 2.4, r * 2.4);
  ctx.globalAlpha = 1;
  if (lv > 1) {                                                  // ป้ายเลเวลพลอยมุมขวาล่าง
    const bx = x + r * 0.85, by = y + r * 0.85, br = Math.max(5, r * 0.42);
    circle(ctx, bx, by, br, '#1a1210', C.goldHi, 1);
    text(ctx, String(lv), bx, by + 0.5, br * 1.3, C.goldHi, 'center', '600');
  }
}

// ไอคอนของเชื่อม/เจาะ: ศิลา (หินเทามีรู) · ด้ายสายสิญจน์ (ม้วนด้ายขาว)
export function currencyIcon(ctx, kind, x, y, r) {
  if (kind.startsWith('map')) {                                // ลายแทง: ม้วนหนังสือ สีตามขั้น
    const col = ['#e8d8a8', '#a8e070', '#70b8f0', '#c890f0', '#ff7a5a'][Number(kind.slice(3)) - 1] || '#e8d8a8';
    ctx.fillStyle = '#f0e2c0'; ctx.fillRect(x - r * 0.8, y - r * 0.55, r * 1.6, r * 1.1);
    ctx.strokeStyle = '#6a4a20'; ctx.lineWidth = 1; ctx.strokeRect(x - r * 0.8, y - r * 0.55, r * 1.6, r * 1.1);
    ctx.fillStyle = col; ctx.fillRect(x - r, y - r * 0.7, r * 0.35, r * 1.4); ctx.fillRect(x + r * 0.65, y - r * 0.7, r * 0.35, r * 1.4);
    ctx.strokeStyle = '#a3262a'; ctx.beginPath(); ctx.moveTo(x - r * 0.4, y - r * 0.2); ctx.lineTo(x, y + r * 0.2); ctx.lineTo(x + r * 0.4, y - r * 0.1); ctx.stroke();
    return;
  }
  if (kind === 'gild') {                                       // ทองคำเปลว: แผ่นทองบาง
    poly(ctx, [x - r * 0.8, y - r * 0.5, x + r * 0.6, y - r * 0.8, x + r * 0.8, y + r * 0.5, x - r * 0.6, y + r * 0.8], '#f2c230', C.ink, 1);
    ctx.fillStyle = 'rgba(255,250,200,0.8)'; ctx.fillRect(x - r * 0.4, y - r * 0.3, r * 0.5, r * 0.15); return;
  }
  if (kind === 'alch') {                                       // ปรอท: หยดเงินวาว
    ctx.fillStyle = '#c8d0e0'; ctx.beginPath(); ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x + r * 0.9, y + r * 0.2, x, y + r * 0.8); ctx.quadraticCurveTo(x - r * 0.9, y + r * 0.2, x, y - r); ctx.fill();
    ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.stroke(); circle(ctx, x - r * 0.25, y, r * 0.18, '#ffffff', null); return;
  }
  if (kind === 'exalt') {                                      // มณีโชติ: เพชรทองส่องแสงแปดแฉก
    ctx.fillStyle = 'rgba(255,233,160,0.35)'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    poly(ctx, [x, y - r * 0.85, x + r * 0.6, y - r * 0.2, x, y + r * 0.85, x - r * 0.6, y - r * 0.2], '#ffe9a0', C.ink, 1);
    poly(ctx, [x, y - r * 0.85, x + r * 0.6, y - r * 0.2, x, y - r * 0.05], '#fff8dc', null);
    return;
  }
  if (kind === 'kali') {                                       // เถ้ากาลี: กองเถ้าม่วงมีประกายไฟ
    poly(ctx, [x - r, y + r * 0.6, x - r * 0.3, y - r * 0.4, x + r * 0.2, y - r * 0.1, x + r, y + r * 0.6], '#5a2a7a', C.ink, 1);
    circle(ctx, x, y - r * 0.5, r * 0.2, '#ff7a3a', null); return;
  }
  if (kind === 'jeweller') {
    poly(ctx, [x - r * 0.8, y + r * 0.5, x - r * 0.6, y - r * 0.5, x + r * 0.2, y - r * 0.8, x + r * 0.8, y - r * 0.2, x + r * 0.6, y + r * 0.6], '#b8b0a0', C.ink, 1.2);
    circle(ctx, x, y, r * 0.22, '#3a3430', null);
  } else if (kind === 'chroma') {                                // หินเจ็ดสี: ผลึกสามสีแดง/เขียว/น้ำเงิน
    poly(ctx, [x - r * 0.9, y + r * 0.6, x - r * 0.3, y - r * 0.8, x, y + r * 0.6], '#e8404a', C.ink, 1);
    poly(ctx, [x - r * 0.3, y + r * 0.6, x + r * 0.2, y - r * 0.9, x + r * 0.5, y + r * 0.6], '#4ad870', C.ink, 1);
    poly(ctx, [x + r * 0.1, y + r * 0.6, x + r * 0.6, y - r * 0.7, x + r * 0.95, y + r * 0.6], '#4a8af0', C.ink, 1);
  } else {
    circle(ctx, x, y, r * 0.7, '#f4f0e8', C.ink, 1.2);
    ctx.strokeStyle = '#c9b89a'; ctx.lineWidth = 1;
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(x - r * 0.6, y + i * r * 0.2); ctx.lineTo(x + r * 0.6, y + i * r * 0.2); ctx.stroke(); }
    ctx.strokeStyle = '#f4f0e8'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + r * 0.5, y + r * 0.4); ctx.quadraticCurveTo(x + r, y + r, x + r * 1.1, y + r * 0.3); ctx.stroke();
  }
}

export function drawGemTab(ctx, game, B) {
  const G = game.data.gems, I = game.data.items, p = game.player, s = B.s, GL = gemLayout(B, p);
  const sel = game.bagGroup || 0;
  for (const row of GL.rows) {
    const on = row.group === sel, it = p.equip[row.slot];
    ctx.fillStyle = on ? 'rgba(217,166,48,0.16)' : 'rgba(0,0,0,0.28)'; rrect(ctx, row.x, row.y, row.w, row.h, 8 * s); ctx.fill();
    ctx.strokeStyle = on ? C.gold : 'rgba(184,154,88,0.35)'; ctx.lineWidth = on ? 1.5 : 1; ctx.stroke();
    text(ctx, SLOT_NAME[row.slot], row.x + 8 * s, row.y + 10 * s, 9 * s, 'rgba(244,230,200,0.6)', 'left', 'normal');
    if (!it) { text(ctx, '(ไม่ได้สวม)', row.x + row.w / 2, row.art.y, 10 * s, 'rgba(244,230,200,0.45)', 'center', 'normal'); continue; }
    ctx.font = `600 ${10 * s}px Kanit, sans-serif`;
    let nm = itemName(I, it); while (nm.length > 4 && ctx.measureText(nm).width > row.w - 12 * s) nm = nm.slice(0, -2);
    text(ctx, nm === itemName(I, it) ? nm : nm + '…', row.x + row.w / 2, row.y + 24 * s, 10 * s, I.rarity[it.rarity].color, 'center', '600');
    const A = row.art;                                             // รูปไอเท็มใหญ่ แล้ววางช่องพลอยทับบนตัวของ (แบบ PoE)
    ctx.globalAlpha = 0.9; ctx.drawImage(itemSprite(I, it.base, A.size * 2), A.x - A.size / 2, A.y - A.size / 2, A.size, A.size); ctx.globalAlpha = 1;
    const n = it.sockets || 0;
    if (!n) { text(ctx, 'ไม่มีช่องพลอย', A.x, row.y + row.h - 10 * s, 9 * s, 'rgba(244,230,200,0.5)', 'center', 'normal'); continue; }
    for (let i = 0; i < n - 1; i++) if (it.links[i]) {               // เส้นเชื่อม (ด้ายสายสิญจน์) ระหว่างช่อง
      const a = row.sockets[i], b = row.sockets[i + 1];
      ctx.strokeStyle = '#6a4a10'; ctx.lineWidth = 8 * s; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      ctx.strokeStyle = C.goldHi; ctx.lineWidth = 5 * s; ctx.stroke();
    }
    for (let i = 0; i < n; i++) {
      const so = row.sockets[i], g = it.gems[i], picked = game.sockSel && game.sockSel.slot === row.slot && game.sockSel.idx === i;
      const sc = SOCKET_COL[(it.colors && it.colors[i]) || 'w'];        // ช่องสีแดง/เขียว/น้ำเงิน/ขาว
      circle(ctx, so.x, so.y, so.r, sc.fill, picked ? '#ffffff' : sc.rim, picked ? 3.5 : 3);
      if (g) gemIcon(ctx, G, g, so.x, so.y, so.r * 0.85, false, gemLevel(G, p, g));
    }
    text(ctx, `${n}/${socketMax(I, it)} ช่อง`, A.x, row.y + row.h - 10 * s, 9 * s, 'rgba(244,230,200,0.6)', 'center', 'normal');
  }
  // ของเชื่อม/เจาะ
  for (const c of GL.cur) {
    const info = I.currency[c.kind], on = game.curSel === c.kind, have = (p.currency && p.currency[c.kind]) || 0;
    ctx.fillStyle = on ? 'rgba(217,166,48,0.35)' : 'rgba(0,0,0,0.35)'; rrect(ctx, c.x, c.y, c.w, c.h, 8 * s); ctx.fill();
    ctx.strokeStyle = on ? C.goldHi : 'rgba(184,154,88,0.5)'; ctx.lineWidth = 1.2; ctx.stroke();
    currencyIcon(ctx, c.kind, c.x + 14 * s, c.y + c.h / 2, 9 * s);
    text(ctx, `${info.name} ×${have}`, c.x + 26 * s, c.y + c.h / 2 + 0.5, 9 * s, have ? C.cream : 'rgba(244,230,200,0.45)', 'left', '600');
  }
  // สกิลที่ได้
  const sk = skillsOf(G, p);
  const ky = GL.cur[0].y + 40 * s;
  text(ctx, 'สกิล:', B.x + 14 * s, ky, 10 * s, C.goldHi, 'left', '600');
  if (!sk.length) text(ctx, 'ฝังพลอยสกิล (เม็ดกลมมีรูปสกิล) ลงช่อง จะได้สกิล', B.x + 50 * s, ky, 10 * s, 'rgba(244,230,200,0.6)', 'left', 'normal');
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
    gemIcon(ctx, G, id, cx, cy, g.cell * 0.3, false, gemLevel(G, p, id));
  });
  // คำอธิบายล่าง + กล่องรายละเอียดของที่เลือก (วาดทับบนสุดใน bag.js)
  let desc = 'แตะพลอย/ช่อง/ของ 1 ครั้งดูรายละเอียด · เส้นทอง = ช่องเชื่อมกัน พลอยเสริมเสริมพลอยสกิลในกลุ่มเดียวกัน', col = C.goldHi;
  if (game.gemMsg && game.gemMsg.t > game.time) { desc = game.gemMsg.text; col = game.gemMsg.col; }
  text(ctx, desc, B.x + 20 * s, B.y + B.h - 18 * s, 9.5 * s, col, 'left', 'normal');
  const o = { s, W: B.W, H: B.H }, slotName = SLOT_NAME[SOCKET_SLOTS[sel]];
  const showId = game.bagSel !== undefined && game.bagSel !== null ? p.bag[game.bagSel] : null;
  if (showId) {
    const i = game.bagSel, cx = g.x + (i % COLS) * g.cell + g.cell / 2, cy = g.y + Math.floor(i / COLS) * g.cell + g.cell / 2;
    game.tipLater = () => drawGemTip(ctx, game, showId, cx - g.cell / 2, cy, { ...o, hint: `แตะช่องบน${slotName}เพื่อฝัง (แตะพลอยซ้ำ = ช่องว่างแรก)` });
  } else if (game.sockSel) {
    const row = GL.rows.find((r) => r.slot === game.sockSel.slot), it = p.equip[game.sockSel.slot], gid = it && it.gems && it.gems[game.sockSel.idx];
    if (gid) {
      const so = row.sockets[game.sockSel.idx], final = skillsOf(G, p).find((k) => k.slot === game.sockSel.slot && k.socket === game.sockSel.idx);
      game.tipLater = () => drawGemTip(ctx, game, gid, so.x, so.y, { ...o, final, hint: 'แตะช่องนี้อีกครั้งเพื่อถอดเข้ากระเป๋า' });
    }
  } else if (game.curSel) {
    const c = GL.cur.find((q) => q.kind === game.curSel);
    game.tipLater = () => drawCurrencyTip(ctx, game, game.curSel, c.x + c.w / 2, c.y, { ...o, hint: `มี ${p.currency[game.curSel] || 0} · แตะอีกครั้งเพื่อใช้กับ${slotName}` });
  } else if (game.cardTip) {
    const row = GL.rows.find((r) => r.slot === game.cardTip), it = p.equip[game.cardTip];
    if (it) game.tipLater = () => drawItemTip(ctx, game, it, row.x + row.w, row.y + row.h / 2, o);
  }
}

export function updateGemTab(game, B, t) {
  const G = game.data.gems, I = game.data.items, p = game.player, GL = gemLayout(B, p);
  const say = (text, col = '#ff8a7a') => { game.gemMsg = { text, col, t: game.time + 2.5 }; };
  const changed = () => { game.audio.play('gem'); game.events.emit('gemsChanged', {}); };
  const clear = () => { game.sockSel = null; game.cardTip = null; };
  for (const row of GL.rows) {
    const it = p.equip[row.slot];
    for (const so of row.sockets) {
      if (!it || so.idx >= (it.sockets || 0) || Math.hypot(t.sx - so.x, t.sy - so.y) > so.r * 1.3) continue;
      game.bagGroup = row.group; game.curSel = null; game.cardTip = null;
      if (game.bagSel !== null && game.bagSel !== undefined && p.bag[game.bagSel]) {   // ถือพลอยอยู่ → ฝังลงช่องนี้
        if (socketGem(G, p, game.bagSel, row.slot, so.idx)) changed();
        else say('สีไม่ตรง — พลอยสีนี้ลงได้เฉพาะช่องสีเดียวกัน (หรือช่องขาว) ใช้หินเจ็ดสีเปลี่ยนสีช่อง');
        game.bagSel = null; game.sockSel = null;
      } else if (game.sockSel && game.sockSel.slot === row.slot && game.sockSel.idx === so.idx) {   // แตะซ้ำ = ถอด
        if (unsocketGem(p, row.slot, so.idx)) { game.audio.play('click'); game.events.emit('gemsChanged', {}); }
        game.sockSel = null;
      } else { game.sockSel = it.gems[so.idx] ? { slot: row.slot, idx: so.idx } : null; game.audio.play('click'); }
      return;
    }
    if (t.sx >= row.x && t.sx <= row.x + row.w && t.sy >= row.y && t.sy <= row.y + row.h) {
      game.bagGroup = row.group; game.sockSel = null; game.curSel = null; game.bagSel = null;
      game.cardTip = game.cardTip === row.slot ? null : row.slot; game.audio.play('click'); return;
    }
  }
  for (const c of GL.cur) {
    if (t.sx < c.x || t.sx > c.x + c.w || t.sy < c.y || t.sy > c.y + c.h) continue;
    game.bagSel = null; clear();
    if (game.curSel !== c.kind) { game.curSel = c.kind; game.audio.play('click'); return; }
    const slot = SOCKET_SLOTS[game.bagGroup || 0], it = p.equip[slot], name = I.currency[c.kind].name;
    if (!(p.currency[c.kind] > 0)) { say(`ไม่มี${name} — หาได้จากมอน บอส หรือร้านแม่ค้า`); return; }
    const r = useCurrency(I, game.rng, p, c.kind, it, G);
    if (!r) { say(it ? `ใช้${name}กับ${itemName(I, it)}ไม่ได้` : `ยังไม่ได้สวม${SLOT_NAME[slot]}`); return; }
    game.audio.play('level'); say(`${name}: ${r}`, '#9af0b0');
    game.events.emit('currencyUsed', { kind: c.kind }); game.events.emit('gemsChanged', {});
    return;
  }
  const g = B.grid, col = Math.floor((t.sx - g.x) / g.cell), r = Math.floor((t.sy - g.y) / g.cell);
  if (col >= 0 && col < COLS && r >= 0) {
    const i = r * COLS + col;
    if (i >= p.bag.length) return;
    game.curSel = null; clear();
    if (game.bagSel === i) {                                   // แตะซ้ำ = ฝังช่องว่างแรกของแถวที่เลือก
      const slot = SOCKET_SLOTS[game.bagGroup || 0], it = p.equip[slot];
      if (!it || !it.sockets) say(`${SLOT_NAME[slot]}ไม่มีช่องพลอย`);
      else if (socketGem(G, p, i, slot)) changed();
      else say(`${SLOT_NAME[slot]}ไม่มีช่องสีที่ตรงกับพลอยนี้ — ใช้หินเจ็ดสีสุ่มสีช่อง`);
      game.bagSel = null;
    } else { game.bagSel = i; game.audio.play('click'); }
  }
}

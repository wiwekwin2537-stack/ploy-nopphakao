// หน้าร้านแม่ค้าบัวผัน (แบบหน้าร้าน PoE/เอโดเรีย): ซ้าย = ช่องของขาย · ขวา = กระเป๋าผู้เล่น
// ทุกชิ้นเป็นไอคอนในช่อง (รูปเดียวกับในกระเป๋า/บนพื้น) ราคาใต้ไอคอน · แตะ 1 ครั้ง = ดูรายละเอียด + เทียบของที่สวม · แตะซ้ำ = ซื้อ/ขาย
import { C, kanokFrame, rrect, circle } from '../art/draw.js';
import { uiText as text } from './hud.js';
import { flaskIcon } from './hudbar.js';
import { itemIcon } from './itemicon.js';
import { currencyIcon } from './itemicon.js';
import { drawItemTip, drawCurrencyTip } from './tooltip.js';
import { buyPotion, buyItem, sellItem, sellPrice } from '../systems/shop.js';

const SHOP_COLS = 5, BAG_COLS = 5, ROWS = 6;

// ของขายทั้งหมด (ยา 2 ชนิด + stock ใน data/shop.json) เรียงตามช่อง
function goodsList(S) {
  return [{ kind: 'potion', pk: 'hp' }, { kind: 'potion', pk: 'mp' }, ...S.stock.map((st, i) => ({ kind: st.currency ? 'currency' : 'item', idx: i }))];
}

export function shopLayout(w, h, s) {
  const pw = Math.min(w - 20, 720 * s), ph = Math.min(h - 16, 380 * s), x = w / 2 - pw / 2, y = h / 2 - ph / 2;
  const top = y + 58 * s, bottom = y + ph - 34 * s, half = (pw - 42 * s) / 2;
  const cell = Math.min(half / SHOP_COLS, (bottom - top) / ROWS);
  return {
    x, y, w: pw, h: ph, s,
    shop: { x: x + 14 * s, y: top, cell, cols: SHOP_COLS, rows: ROWS, w: half },
    bag: { x: x + 28 * s + half, y: top, cell, cols: BAG_COLS, rows: ROWS, w: half },
    close: { x: x + pw - 20 * s, y: y + 20 * s, r: 14 * s },
  };
}

const cellCenter = (G, i) => ({ x: G.x + (i % G.cols) * G.cell + G.cell / 2, y: G.y + Math.floor(i / G.cols) * G.cell + G.cell / 2 });

function slotBox(ctx, G, c, on, rim, s) {
  ctx.fillStyle = on ? 'rgba(217,166,48,0.35)' : 'rgba(0,0,0,0.32)';
  rrect(ctx, c.x - G.cell / 2 + 1.5, c.y - G.cell / 2 + 1.5, G.cell - 3, G.cell - 3, 4 * s); ctx.fill();
  if (rim) { ctx.strokeStyle = on ? '#ffffff' : rim; ctx.lineWidth = on ? 2 : 1.5; ctx.stroke(); }
}

// ราคาของช่อง i (ใช้ทั้งวาดและตรวจเบี้ยพอ)
function priceOf(S, g) { return g.kind === 'potion' ? (g.pk === 'mp' ? S.manaPotion : S.potion).price : S.stock[g.idx].price; }

export function drawShop(ctx, game, L, w, h) {
  const S = game.data.shop, I = game.data.items, p = game.player, B = shopLayout(w, h, L.s), s = B.s, goods = goodsList(S), sel = game.shopSel;
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, w, h);
  kanokFrame(ctx, B.x, B.y, B.w, B.h, 12);
  ctx.fillStyle = 'rgba(16,10,8,0.82)'; rrect(ctx, B.x + 8 * s, B.y + 8 * s, B.w - 16 * s, B.h - 16 * s, 8 * s); ctx.fill();
  text(ctx, 'ร้านแม่ค้าบัวผัน', B.x + 20 * s, B.y + 22 * s, 16 * s, C.goldHi);
  circle(ctx, B.bag.x + 8 * s, B.y + 22 * s, 7 * s, C.gold, '#8a6a10', 1.5);
  text(ctx, p.coins + ' เบี้ย', B.bag.x + 20 * s, B.y + 22 * s, 13 * s, C.goldHi, 'left', '600');
  circle(ctx, B.close.x, B.close.y, B.close.r, 'rgba(120,30,20,0.9)', C.gold, 1.5);
  text(ctx, '✕', B.close.x, B.close.y + 1, 13 * s, '#fff', 'center');
  text(ctx, 'ของขาย', B.shop.x, B.y + 46 * s, 10.5 * s, C.cream, 'left', '600');
  text(ctx, `กระเป๋าของคุณ ${p.items.length}/${I.bagSize}`, B.bag.x, B.y + 46 * s, 10.5 * s, C.cream, 'left', '600');

  // ช่องของขาย: ไอคอน + ราคาใต้ไอคอน (เบี้ยไม่พอ = ราคาสีแดง)
  const G = B.shop, r = G.cell * 0.28;
  for (let i = 0; i < G.cols * G.rows; i++) {
    const c = cellCenter(G, i), g = goods[i], on = sel && sel.side === 'buy' && sel.i === i;
    slotBox(ctx, G, c, on, g ? 'rgba(217,166,48,0.5)' : null, s);
    if (!g) continue;
    const iy = c.y - G.cell * 0.1;
    if (g.kind === 'potion') {
      const P = g.pk === 'mp' ? S.manaPotion : S.potion, n = g.pk === 'mp' ? p.mpPotions : p.potions;
      flaskIcon(ctx, c.x - r * 0.6, iy - r * 1.1, r * 1.2, r * 2.2, 0.8, g.pk === 'mp' ? '#3a6aff' : '#d8302a', false);
      text(ctx, `${n}/${P.max}`, c.x + G.cell * 0.44, c.y - G.cell * 0.36, 8.5 * s, n >= P.max ? '#7dff8a' : C.cream, 'right', '600');
    } else if (g.kind === 'currency') {
      const k = S.stock[g.idx].currency;
      currencyIcon(ctx, k, c.x, iy, r);
      text(ctx, 'มี ' + (p.currency[k] || 0), c.x + G.cell * 0.44, c.y - G.cell * 0.36, 8.5 * s, C.cream, 'right', '600');
    } else {
      const base = S.stock[g.idx].base;
      itemIcon(ctx, game.data, { base }, c.x, iy, r * 1.05);
      if (p.level < I.bases[base].req) text(ctx, 'Lv.' + I.bases[base].req, c.x - G.cell * 0.44, c.y - G.cell * 0.36, 8.5 * s, '#ff8a7a', 'left', '600');
    }
    const pr = priceOf(S, g);
    text(ctx, pr + '', c.x, c.y + G.cell * 0.34, 9.5 * s, p.coins >= pr ? C.goldHi : '#ff8a7a', 'center', '600');
  }

  // กระเป๋าผู้เล่น (ขาย): กรอบสีตามระดับ
  const Bg = B.bag;
  for (let i = 0; i < Bg.cols * Bg.rows; i++) {
    const c = cellCenter(Bg, i), it = p.items[i], on = it && sel && sel.side === 'sell' && sel.uid === it.uid;
    slotBox(ctx, Bg, c, on, it ? I.rarity[it.rarity].color : null, s);
    if (it) itemIcon(ctx, game.data, it, c.x, c.y, Bg.cell * 0.32);
  }

  // แถบล่าง
  let info = 'แตะของเพื่อดูรายละเอียด · แตะซ้ำเพื่อซื้อ (ซ้าย) หรือขาย (ขวา)', col = 'rgba(244,230,200,0.75)';
  if (game.shopMsg && game.shopMsg.t > game.time) { info = game.shopMsg.text; col = game.shopMsg.col; }
  text(ctx, info, B.x + 20 * s, B.y + B.h - 20 * s, 10 * s, col, 'left', 'normal');

  // กล่องรายละเอียดแบบ PoE (วาดทับบนสุด)
  const o = { s, W: w, H: h };
  if (sel && sel.side === 'buy' && goods[sel.i]) {
    const g = goods[sel.i], c = cellCenter(G, sel.i), ax = c.x + G.cell / 2, pr = priceOf(S, g), ok = p.coins >= pr;
    const hint = `ราคา ${pr} เบี้ย · ${ok ? 'แตะซ้ำเพื่อซื้อ' : 'เบี้ยไม่พอ'}`;
    if (g.kind === 'item') { const base = S.stock[g.idx].base; drawItemTip(ctx, game, { base, rarity: 'normal', ilvl: I.bases[base].req, mods: [], rareName: null }, ax, c.y, { ...o, compare: p.equip[I.bases[base].slot], hint: hint + ' (ช่องพลอยสุ่มตอนซื้อ)' }); }
    else if (g.kind === 'currency') drawCurrencyTip(ctx, game, S.stock[g.idx].currency, ax, c.y, { ...o, hint });
    else { const P = g.pk === 'mp' ? S.manaPotion : S.potion; potionTip(ctx, game, P, ax, c.y, { ...o, hint }); }
  } else if (sel && sel.side === 'sell') {
    const i = p.items.findIndex((x) => x.uid === sel.uid), it = p.items[i];
    if (it) { const c = cellCenter(Bg, i); drawItemTip(ctx, game, it, c.x - Bg.cell / 2, c.y, { ...o, price: sellPrice(S, it), compare: p.equip[I.bases[it.base].slot], hint: 'แตะซ้ำเพื่อขาย' }); }
  }
}

// กล่องรายละเอียดยา (ใช้กล่องเดียวกับของเชื่อม: ชื่อ + คำอธิบายจากข้อมูล)
function potionTip(ctx, game, P, ax, ay, o) {
  drawCurrencyTip(ctx, game, null, ax, ay, { ...o, raw: { name: P.name, desc: P.desc, color: P === game.data.shop.manaPotion ? '#8ab4ff' : '#ff8a7a' } });
}

// รับการแตะ/คลิกในหน้าร้าน คืน true ถ้าควรปิด
export function updateShop(game, L, w, h) {
  const S = game.data.shop, p = game.player, B = shopLayout(w, h, L.s), goods = goodsList(S);
  if (game.input.pressed.pause || game.input.pressed.bag || game.input.pressed.interact) return true;
  const say = (t, col = '#ff8a7a') => { game.shopMsg = { text: t, col, t: game.time + 2.2 }; };
  for (const t of game.input.taps) {
    if (t.consumed) continue;
    t.consumed = true;
    if (Math.hypot(t.sx - B.close.x, t.sy - B.close.y) < B.close.r * 1.4) return true;
    if (t.sx < B.x || t.sx > B.x + B.w || t.sy < B.y || t.sy > B.y + B.h) return true;
    const hit = (G) => { const c = Math.floor((t.sx - G.x) / G.cell), r = Math.floor((t.sy - G.y) / G.cell); return c >= 0 && c < G.cols && r >= 0 && r < G.rows ? r * G.cols + c : -1; };
    const gi = hit(B.shop), bi = hit(B.bag), sel = game.shopSel;
    if (gi >= 0 && goods[gi]) {
      if (sel && sel.side === 'buy' && sel.i === gi) {                 // แตะซ้ำ = ซื้อ
        const g = goods[gi], r = g.kind === 'potion' ? buyPotion(game, g.pk) : buyItem(game, g.idx);
        if (r === 'ok') { game.audio.play('coin'); say('ซื้อแล้ว! ขอบใจจ้ะ', '#7dff8a'); }
        else { game.audio.play('click'); say({ poor: 'เบี้ยไม่พอจ้ะ', full: 'ถือขวดนี้ได้เต็มที่แล้ว', bagFull: 'กระเป๋าเต็ม ขายของก่อนนะ' }[r] || 'ซื้อไม่ได้'); }
      } else { game.shopSel = { side: 'buy', i: gi }; game.audio.play('click'); }
    } else if (bi >= 0 && p.items[bi]) {
      const it = p.items[bi];
      if (sel && sel.side === 'sell' && sel.uid === it.uid) {         // แตะซ้ำ = ขาย
        const got = sellItem(game, it.uid);
        if (got) { game.audio.play('coin'); say('ขายได้ ' + got + ' เบี้ย', C.goldHi); }
        game.shopSel = null;
      } else { game.shopSel = { side: 'sell', uid: it.uid }; game.audio.play('click'); }
    } else game.shopSel = null;
  }
  return false;
}

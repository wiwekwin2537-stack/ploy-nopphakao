// หน้าร้านแม่ค้าบัวผัน: ซ้าย = ของขาย (แตะเลือก แตะซ้ำ = ซื้อ) · ขวา = ของในกระเป๋า (แตะเลือก แตะซ้ำ = ขาย)
import { C, kanokFrame, rrect, circle } from '../art/draw.js';
import { uiText as text } from './hud.js';
import { flaskIcon } from './hudbar.js';
import { itemIcon } from './equip.js';
import { currencyIcon } from './gemtab.js';
import { itemName, itemStats } from '../systems/items.js';
import { buyPotion, buyItem, sellItem, sellPrice } from '../systems/shop.js';

const COLS = 5;

function shopLayout(w, h, s, S) {
  const pw = Math.min(w - 20, 720 * s), ph = Math.min(h - 16, 360 * s), x = w / 2 - pw / 2, y = h / 2 - ph / 2;
  const rowH = Math.min(34 * s, (ph - 90 * s) / (S.stock.length + 2));
  const goods = [{ kind: 'potion', pk: 'hp' }, { kind: 'potion', pk: 'mp' }, ...S.stock.map((g, i) => ({ kind: 'item', idx: i }))]
    .map((g, i) => ({ ...g, x: x + 14 * s, y: y + 44 * s + i * rowH, w: pw * 0.5 - 22 * s, h: rowH - 3 * s }));
  const gx = x + pw * 0.5 + 6 * s, gy = y + 52 * s, cell = Math.min(46 * s, (pw * 0.5 - 22 * s) / COLS);
  return { x, y, w: pw, h: ph, s, goods, grid: { x: gx, y: gy, cell, rows: Math.max(1, Math.floor((y + ph - 50 * s - gy) / cell)) }, close: { x: x + pw - 20 * s, y: y + 20 * s, r: 14 * s } };
}

function goodsText(I, names, it) {
  return Object.entries(itemStats(I, it)).map(([k, v]) => (names[k] || k + ' {}').replace('{}', String(v))).join(' · ');
}

export function drawShop(ctx, game, L, w, h) {
  const S = game.data.shop, I = game.data.items, p = game.player, B = shopLayout(w, h, L.s, S), s = B.s;
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, w, h);
  kanokFrame(ctx, B.x, B.y, B.w, B.h, 12);
  text(ctx, 'ร้านแม่ค้าบัวผัน', B.x + 20 * s, B.y + 20 * s, 16 * s, C.goldHi);
  circle(ctx, B.x + 190 * s, B.y + 20 * s, 7 * s, C.gold, '#8a6a10', 1.5);
  text(ctx, p.coins + ' เบี้ย', B.x + 202 * s, B.y + 20 * s, 13 * s, C.goldHi, 'left', '600');
  circle(ctx, B.close.x, B.close.y, B.close.r, 'rgba(120,30,20,0.9)', C.gold, 1.5);
  text(ctx, '✕', B.close.x, B.close.y + 1, 13 * s, '#fff', 'center');
  const sel = game.shopSel;
  for (const g of B.goods) {
    const on = sel && sel.side === 'buy' && sel.i === B.goods.indexOf(g);
    ctx.fillStyle = on ? 'rgba(217,166,48,0.3)' : 'rgba(0,0,0,0.3)'; rrect(ctx, g.x, g.y, g.w, g.h, 6 * s); ctx.fill();
    if (on) { ctx.strokeStyle = C.gold; ctx.lineWidth = 1.5; ctx.stroke(); }
    const r = g.h * 0.36, ix = g.x + g.h * 0.55, iy = g.y + g.h / 2;
    let name, price, ok;
    if (g.kind === 'potion') {
      const P = g.pk === 'mp' ? S.manaPotion : S.potion, n = g.pk === 'mp' ? p.mpPotions : p.potions;
      flaskIcon(ctx, ix - r * 0.55, iy - r, r * 1.1, r * 2, 0.8, g.pk === 'mp' ? '#3a6aff' : '#d8302a', false);
      name = `${P.name} (${n}/${P.max})`; price = P.price; ok = n < P.max;
    } else if (S.stock[g.idx].currency) {
      const st = S.stock[g.idx], c = I.currency[st.currency];
      currencyIcon(ctx, st.currency, ix, iy, r);
      name = `${c.name} (มี ${p.currency[st.currency] || 0})`; price = st.price; ok = true;
    } else {
      const st = S.stock[g.idx], it = { base: st.base };
      itemIcon(ctx, I, it, ix, iy, r);
      name = I.bases[st.base].name + (p.level < I.bases[st.base].req ? `  (Lv.${I.bases[st.base].req})` : ''); price = st.price; ok = true;
    }
    text(ctx, name, ix + r + 8 * s, iy, 11 * s, ok ? C.cream : 'rgba(244,230,200,0.45)', 'left', '600');
    text(ctx, price + ' เบี้ย', g.x + g.w - 8 * s, iy, 11 * s, p.coins >= price ? C.goldHi : '#ff8a7a', 'right', '600');
  }
  // กระเป๋า (ขาย)
  const G = B.grid;
  text(ctx, `ของในกระเป๋า (${p.items.length}/${I.bagSize}) — แตะสองครั้งเพื่อขาย`, G.x, B.y + 36 * s, 10 * s, C.cream, 'left', 'normal');
  if (!p.items.length) text(ctx, 'กระเป๋าว่าง (ของที่สวมอยู่ต้องถอดก่อนจึงขายได้)', G.x, G.y + 20 * s, 10 * s, 'rgba(244,230,200,0.6)', 'left', 'normal');
  p.items.forEach((it, i) => {
    const r = Math.floor(i / COLS);
    if (r >= G.rows) return;
    const cx = G.x + (i % COLS) * G.cell + G.cell / 2, cy = G.y + r * G.cell + G.cell / 2, col = I.rarity[it.rarity].color;
    const on = sel && sel.side === 'sell' && sel.uid === it.uid;
    ctx.fillStyle = on ? 'rgba(217,166,48,0.35)' : 'rgba(0,0,0,0.3)'; rrect(ctx, cx - G.cell / 2 + 2, cy - G.cell / 2 + 2, G.cell - 4, G.cell - 4, 6 * s); ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.stroke();
    itemIcon(ctx, I, it, cx, cy, G.cell * 0.3);
  });
  // แถบล่าง: อธิบายของที่เลือก
  let info = 'แตะของที่จะซื้อ แล้วแตะซ้ำเพื่อยืนยัน · แตะของในกระเป๋าสองครั้งเพื่อขาย', col = C.goldHi;
  if (sel && sel.side === 'buy') {
    const g = B.goods[sel.i];
    const st = g.kind === 'item' ? S.stock[g.idx] : null;
    info = g.kind === 'potion' ? `${(g.pk === 'mp' ? S.manaPotion : S.potion).name}: ${(g.pk === 'mp' ? S.manaPotion : S.potion).desc} — แตะซ้ำเพื่อซื้อ` : st.currency ? `${I.currency[st.currency].name}: ${I.currency[st.currency].desc} — แตะซ้ำเพื่อซื้อ` : `${I.bases[st.base].name}: ${goodsText(I, game.data.passives.statNames, { base: st.base, mods: [] })} — แตะซ้ำเพื่อซื้อ`;
  } else if (sel && sel.side === 'sell') {
    const it = p.items.find((x) => x.uid === sel.uid);
    if (it) { info = `${itemName(I, it)} · ขายได้ ${sellPrice(S, it)} เบี้ย — แตะซ้ำเพื่อขาย`; col = I.rarity[it.rarity].color; }
  }
  if (game.shopMsg && game.shopMsg.t > game.time) { info = game.shopMsg.text; col = game.shopMsg.col; }
  text(ctx, info, B.x + 20 * s, B.y + B.h - 18 * s, 10 * s, col, 'left', 'normal');
}

// รับการแตะ/คลิกในหน้าร้าน คืน true ถ้าควรปิด
export function updateShop(game, L, w, h) {
  const S = game.data.shop, p = game.player, B = shopLayout(w, h, L.s, S);
  if (game.input.pressed.pause || game.input.pressed.bag || game.input.pressed.interact) return true;
  const say = (text, col = '#ff8a7a') => { game.shopMsg = { text, col, t: game.time + 2.2 }; };
  for (const t of game.input.taps) {
    if (t.consumed) continue;
    t.consumed = true;
    if (Math.hypot(t.sx - B.close.x, t.sy - B.close.y) < B.close.r * 1.4) return true;
    if (t.sx < B.x || t.sx > B.x + B.w || t.sy < B.y || t.sy > B.y + B.h) return true;
    const gi = B.goods.findIndex((g) => t.sx >= g.x && t.sx <= g.x + g.w && t.sy >= g.y && t.sy <= g.y + g.h);
    if (gi >= 0) {
      const sel = game.shopSel;
      if (sel && sel.side === 'buy' && sel.i === gi) {                 // แตะซ้ำ = ซื้อ
        const g = B.goods[gi], r = g.kind === 'potion' ? buyPotion(game, g.pk) : buyItem(game, g.idx);
        if (r === 'ok') { game.audio.play('coin'); say('ซื้อแล้ว! ขอบใจจ้ะ', '#7dff8a'); }
        else { game.audio.play('click'); say({ poor: 'เบี้ยไม่พอจ้ะ', full: 'ถือยาหม้อได้เต็มที่แล้ว', bagFull: 'กระเป๋าเต็ม ขายของก่อนนะ' }[r] || 'ซื้อไม่ได้'); }
      } else { game.shopSel = { side: 'buy', i: gi }; game.audio.play('click'); }
      continue;
    }
    const G = B.grid, col = Math.floor((t.sx - G.x) / G.cell), row = Math.floor((t.sy - G.y) / G.cell);
    if (col >= 0 && col < COLS && row >= 0 && row < G.rows) {
      const it = p.items[row * COLS + col];
      if (!it) continue;
      const sel = game.shopSel;
      if (sel && sel.side === 'sell' && sel.uid === it.uid) {         // แตะซ้ำ = ขาย
        const got = sellItem(game, it.uid);
        if (got) { game.audio.play('coin'); say('ขายได้ ' + got + ' เบี้ย', C.goldHi); }
        game.shopSel = null;
      } else { game.shopSel = { side: 'sell', uid: it.uid }; game.audio.play('click'); }
    }
  }
  return false;
}

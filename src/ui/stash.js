// หน้าหีบเก็บของ: ซ้าย = กระเป๋า · ขวา = หีบ — แตะของ 1 ครั้งดูรายละเอียด แตะซ้ำ = ย้ายไปอีกฝั่ง
import { C, kanokFrame, rrect, circle } from '../art/draw.js';
import { uiText as text } from './hud.js';
import { itemIcon } from './itemicon.js';
import { drawItemTip } from './tooltip.js';
import { moveItem } from '../systems/stash.js';

const BAG_COLS = 5, STASH_COLS = 10;

export function stashLayout(w, h, s) {
  const pw = Math.min(w - 20, 760 * s), ph = Math.min(h - 16, 380 * s), x = w / 2 - pw / 2, y = h / 2 - ph / 2;
  const top = y + 54 * s, bottom = y + ph - 34 * s;
  const bagW = pw * 0.34, stW = pw - bagW - 42 * s;
  const bc = Math.min((bagW - 10 * s) / BAG_COLS, (bottom - top) / 6), sc = Math.min(stW / STASH_COLS, (bottom - top) / 6);
  return {
    x, y, w: pw, h: ph, s,
    bag: { x: x + 14 * s, y: top, cell: bc, cols: BAG_COLS, rows: 6 },
    stash: { x: x + 28 * s + bagW, y: top, cell: sc, cols: STASH_COLS, rows: 6 },
    close: { x: x + pw - 20 * s, y: y + 20 * s, r: 14 * s },
  };
}

function grid(ctx, game, G, list, cap, s) {
  const I = game.data.items, sel = game.stashSel;
  for (let i = 0; i < cap; i++) {
    const cx = G.x + (i % G.cols) * G.cell + G.cell / 2, cy = G.y + Math.floor(i / G.cols) * G.cell + G.cell / 2, it = list[i];
    const on = it && sel && sel.uid === it.uid;
    ctx.fillStyle = on ? 'rgba(217,166,48,0.35)' : 'rgba(0,0,0,0.3)'; rrect(ctx, cx - G.cell / 2 + 1.5, cy - G.cell / 2 + 1.5, G.cell - 3, G.cell - 3, 4 * s); ctx.fill();
    if (!it) continue;
    ctx.strokeStyle = I.rarity[it.rarity].color; ctx.lineWidth = 1.5; ctx.stroke();
    itemIcon(ctx, game.data, it, cx, cy, G.cell * 0.32);
  }
}

export function drawStash(ctx, game, L, w, h) {
  const I = game.data.items, p = game.player, B = stashLayout(w, h, L.s), s = B.s, stash = p.stash || [];
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, w, h);
  kanokFrame(ctx, B.x, B.y, B.w, B.h, 12);
  text(ctx, 'หีบเก็บของ', B.x + 20 * s, B.y + 20 * s, 16 * s, C.goldHi);
  circle(ctx, B.close.x, B.close.y, B.close.r, 'rgba(120,30,20,0.9)', C.gold, 1.5);
  text(ctx, '✕', B.close.x, B.close.y + 1, 13 * s, '#fff', 'center');
  text(ctx, `กระเป๋า ${p.items.length}/${I.bagSize}`, B.bag.x, B.y + 42 * s, 10.5 * s, C.cream, 'left', '600');
  text(ctx, `หีบ ${stash.length}/${I.stashSize}`, B.stash.x, B.y + 42 * s, 10.5 * s, C.cream, 'left', '600');
  grid(ctx, game, B.bag, p.items, I.bagSize, s);
  grid(ctx, game, B.stash, stash, I.stashSize, s);
  let info = 'แตะของเพื่อดูรายละเอียด · แตะซ้ำเพื่อย้ายไปอีกฝั่ง (ของในหีบไม่หาย เก็บไว้ได้ตลอด)', col = C.goldHi;
  if (game.stashMsg && game.stashMsg.t > game.time) { info = game.stashMsg.text; col = game.stashMsg.col; }
  text(ctx, info, B.x + 20 * s, B.y + B.h - 18 * s, 10 * s, col, 'left', 'normal');
  const sel = game.stashSel;
  if (sel) {
    const inStash = sel.side === 'stash', list = inStash ? stash : p.items, G = inStash ? B.stash : B.bag, i = list.findIndex((x) => x.uid === sel.uid), it = list[i];
    if (it) drawItemTip(ctx, game, it, G.x + (i % G.cols) * G.cell + G.cell, G.y + Math.floor(i / G.cols) * G.cell + G.cell / 2,
      { s, W: w, H: h, compare: p.equip[I.bases[it.base].slot], hint: inStash ? 'แตะซ้ำเพื่อหยิบใส่กระเป๋า' : 'แตะซ้ำเพื่อเก็บเข้าหีบ' });
  }
}

// รับการแตะในหน้าหีบ คืน true ถ้าควรปิด
export function updateStash(game, L, w, h) {
  const p = game.player, B = stashLayout(w, h, L.s);
  if (game.input.pressed.pause || game.input.pressed.bag || game.input.pressed.interact) return true;
  const say = (text, col = '#ff8a7a') => { game.stashMsg = { text, col, t: game.time + 2.2 }; };
  for (const t of game.input.taps) {
    if (t.consumed) continue;
    t.consumed = true;
    if (Math.hypot(t.sx - B.close.x, t.sy - B.close.y) < B.close.r * 1.4) return true;
    if (t.sx < B.x || t.sx > B.x + B.w || t.sy < B.y || t.sy > B.y + B.h) return true;
    for (const [side, G, list] of [['bag', B.bag, p.items], ['stash', B.stash, p.stash || []]]) {
      const c = Math.floor((t.sx - G.x) / G.cell), r = Math.floor((t.sy - G.y) / G.cell);
      if (c < 0 || c >= G.cols || r < 0 || r >= G.rows) continue;
      const it = list[r * G.cols + c];
      if (!it) { game.stashSel = null; break; }
      const sel = game.stashSel;
      if (sel && sel.uid === it.uid) {                                // แตะซ้ำ = ย้าย
        const res = moveItem(game, it.uid, side === 'bag');
        if (res === 'ok') { game.audio.play('click'); say(side === 'bag' ? 'เก็บเข้าหีบแล้ว' : 'หยิบใส่กระเป๋าแล้ว', '#7dff8a'); }
        else if (res === 'full') say(side === 'bag' ? 'หีบเต็มแล้ว' : 'กระเป๋าเต็ม');
        game.stashSel = null;
      } else { game.stashSel = { side, uid: it.uid }; game.audio.play('click'); }
      break;
    }
  }
  return false;
}

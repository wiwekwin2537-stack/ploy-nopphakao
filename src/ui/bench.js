// หน้าโต๊ะช่าง (Crafting Bench แบบ PoE): ซ้าย = ของ (ที่สวม แล้วกระเป๋า) · ขวา = สูตรที่ใช้กับของชิ้นนั้น
// แตะของ = เลือก · แตะสูตร = ดูราคา · แตะสูตรซ้ำ = คราฟต์ · ปุ่มลบค่าคราฟต์ · ✕ ปิด
import { C, kanokFrame, rrect, circle } from '../art/draw.js';
import { uiText as text } from './hud.js';
import { itemIcon } from './itemicon.js';
import { benchItems, recipesFor, recipeUnlocked, craftBlock, craftBench, removeCraft, recipeOf } from '../systems/bench.js';
import { itemName } from '../systems/items.js';

const COLS = 6;
export function benchLayout(w, h, s) {
  const pw = Math.min(w - 16, 760 * s), ph = Math.min(h - 12, 390 * s), x = w / 2 - pw / 2, y = h / 2 - ph / 2;
  const top = y + 54 * s, gw = pw * 0.42, cell = Math.min(gw / COLS, (ph - 120 * s) / 6);
  const rx = x + 24 * s + gw, rw = pw - gw - 40 * s;
  return {
    x, y, w: pw, h: ph, s, grid: { x: x + 14 * s, y: top, cell, cols: COLS },
    list: { x: rx, y: top + 46 * s, w: rw, row: 26 * s },
    remove: { x: rx, y: top, w: rw, h: 38 * s },
    close: { x: x + pw - 20 * s, y: y + 20 * s, r: 14 * s },
    info: { x: x + 14 * s, y: y + ph - 46 * s, w: pw - 28 * s, h: 34 * s },
  };
}

function costText(I, r) {
  return [`${r.cost.coins} เบี้ย`, ...Object.entries(r.cost.currency || {}).map(([k, n]) => `${I.currency[k].name} ×${n}`)].join(' + ');
}
function recipeLine(game, r) { const f = game.data.passives.statNames[r.stat]; return f.replace('{}', String(r.value)); }

export function drawBench(ctx, game, L, w, h) {
  const I = game.data.items, p = game.player, B = benchLayout(w, h, L.s), s = B.s, M = game.data.monsters;
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, w, h);
  kanokFrame(ctx, B.x, B.y, B.w, B.h, 12);
  ctx.fillStyle = 'rgba(16,10,8,0.92)'; rrect(ctx, B.x + 8 * s, B.y + 8 * s, B.w - 16 * s, B.h - 16 * s, 8 * s); ctx.fill();
  text(ctx, 'โต๊ะช่าง — เพิ่มค่าที่เลือกเอง 1 ค่าต่อชิ้น', B.x + 20 * s, B.y + 22 * s, 15 * s, C.goldHi, 'left', '600');
  text(ctx, `เบี้ย ${p.coins}`, B.x + 20 * s, B.y + 40 * s, 10.5 * s, C.goldHi, 'left', 'normal');
  circle(ctx, B.close.x, B.close.y, B.close.r, 'rgba(120,30,20,0.9)', C.gold, 1.5);
  text(ctx, '✕', B.close.x, B.close.y + 1, 13 * s, '#fff', 'center');
  const items = benchItems(I, p), G = B.grid;
  items.forEach(({ it, slot }, i) => {
    const cx = G.x + (i % G.cols) * G.cell + G.cell / 2, cy = G.y + Math.floor(i / G.cols) * G.cell + G.cell / 2, on = game.benchSel === it.uid;
    ctx.fillStyle = on ? 'rgba(217,166,48,0.35)' : slot ? 'rgba(60,40,20,0.5)' : 'rgba(0,0,0,0.3)'; rrect(ctx, cx - G.cell / 2 + 1.5, cy - G.cell / 2 + 1.5, G.cell - 3, G.cell - 3, 4 * s); ctx.fill();
    ctx.strokeStyle = I.rarity[it.rarity].color; ctx.lineWidth = on ? 2.5 : 1.5; ctx.stroke();
    itemIcon(ctx, game.data, it, cx, cy, G.cell * 0.32);
    if (it.craft) circle(ctx, cx + G.cell * 0.3, cy - G.cell * 0.3, 4 * s, '#b8a0ff', null);   // จุดม่วง = มีค่าคราฟต์แล้ว
    if (slot) text(ctx, 'สวม', cx - G.cell * 0.32, cy - G.cell * 0.32, 7.5 * s, C.goldHi, 'left', '600');
  });
  const sel = items.find((x) => x.it.uid === game.benchSel), it = sel && sel.it;
  let info = 'แตะของทางซ้ายเพื่อเลือก (ของที่สวมอยู่มีป้าย "สวม" · จุดม่วง = มีค่าคราฟต์แล้ว)', icol = C.goldHi;
  if (it) {
    text(ctx, itemName(I, it), B.list.x, B.y + 40 * s, 11 * s, I.rarity[it.rarity].color, 'left', '600');
    const R = B.remove, cr = it.craft && recipeOf(I, it.craft);
    ctx.fillStyle = cr ? 'rgba(90,40,120,0.5)' : 'rgba(0,0,0,0.3)'; rrect(ctx, R.x, R.y, R.w, R.h, 6 * s); ctx.fill();
    text(ctx, cr ? `ค่าคราฟต์: ${recipeLine(game, cr)}` : 'ยังไม่มีค่าคราฟต์', R.x + 10 * s, R.y + 12 * s, 10.5 * s, cr ? '#d8c0ff' : C.cream, 'left', '600');
    text(ctx, cr ? `แตะเพื่อลบค่าคราฟต์ (${I.bench.removeCost} เบี้ย) แล้วคราฟต์ใหม่ได้` : 'เลือกสูตรด้านล่าง', R.x + 10 * s, R.y + 28 * s, 9 * s, 'rgba(244,230,200,0.7)', 'left', 'normal');
    recipesFor(I, it).forEach((r, k) => {
      const y = B.list.y + k * B.list.row, open = recipeUnlocked(game.flags, r), on = game.benchRecipe === r.id;
      ctx.fillStyle = on ? 'rgba(217,166,48,0.3)' : 'rgba(0,0,0,0.25)'; rrect(ctx, B.list.x, y, B.list.w, B.list.row - 3 * s, 5 * s); ctx.fill();
      text(ctx, recipeLine(game, r), B.list.x + 8 * s, y + B.list.row / 2 - 1, 10.5 * s, open ? C.cream : 'rgba(244,230,200,0.35)', 'left', '600');
      text(ctx, open ? costText(I, r) : `ปลดเมื่อล้ม${M[r.unlock.replace(/Slain$/, '')].name}`, B.list.x + B.list.w - 8 * s, y + B.list.row / 2 - 1, 9 * s, open ? C.goldHi : 'rgba(244,230,200,0.4)', 'right', 'normal');
    });
    const r = game.benchRecipe && recipeOf(I, game.benchRecipe);
    if (r) { const why = craftBlock(game, it, r); info = why || `แตะ "${recipeLine(game, r)}" อีกครั้งเพื่อคราฟต์ (ใช้ ${costText(I, r)})`; icol = why ? '#ff9a7a' : '#9af0b0'; }
    else info = 'แตะสูตรเพื่อดูราคา · แตะซ้ำเพื่อคราฟต์ (ค่าคราฟต์ไม่นับช่องค่าสุ่ม ใส่ได้ 1 ค่าต่อชิ้น)';
  }
  if (game.benchMsg && game.benchMsg.t > game.time) { info = game.benchMsg.text; icol = game.benchMsg.col; }
  text(ctx, info, B.info.x + 6 * s, B.info.y + B.info.h / 2, 10 * s, icol, 'left', 'normal');
}

// คืน true เมื่อปิด
export function updateBench(game, L, w, h) {
  const I = game.data.items, p = game.player, B = benchLayout(w, h, L.s), inp = game.input;
  if (inp.pressed.pause || inp.pressed.bag || inp.pressed.interact) return true;
  const inBox = (t, b) => t.sx >= b.x && t.sx <= b.x + b.w && t.sy >= b.y && t.sy <= b.y + b.h;
  const msg = (text, col) => { game.benchMsg = { text, col, t: game.time + 2.5 }; };
  for (const t of inp.taps) {
    if (t.consumed) continue;
    t.consumed = true;
    if (Math.hypot(t.sx - B.close.x, t.sy - B.close.y) < B.close.r * 1.4) return true;
    const items = benchItems(I, p), G = B.grid;
    const col = Math.floor((t.sx - G.x) / G.cell), row = Math.floor((t.sy - G.y) / G.cell), idx = row * G.cols + col;
    if (col >= 0 && col < G.cols && row >= 0 && items[idx]) { game.benchSel = items[idx].it.uid; game.benchRecipe = null; game.audio.play('click'); continue; }
    const sel = items.find((x) => x.it.uid === game.benchSel), it = sel && sel.it;
    if (!it) continue;
    if (inBox(t, B.remove)) {
      if (!it.craft) continue;
      if (removeCraft(game, it)) { msg('ลบค่าคราฟต์แล้ว', '#9af0b0'); game.audio.play('click'); } else msg(`เบี้ยไม่พอ (ต้องใช้ ${I.bench.removeCost})`, '#ff9a7a');
      continue;
    }
    const list = recipesFor(I, it), k = Math.floor((t.sy - B.list.y) / B.list.row);
    if (t.sx < B.list.x || t.sx > B.list.x + B.list.w || t.sy < B.list.y || !list[k]) continue;
    if (game.benchRecipe !== list[k].id) { game.benchRecipe = list[k].id; game.audio.play('click'); continue; }
    if (craftBench(game, it, list[k].id)) { msg('คราฟต์สำเร็จ! ' + recipeLine(game, list[k]), '#9af0b0'); game.audio.play('gem'); game.benchRecipe = null; }
    else game.audio.play('click');
  }
  return false;
}

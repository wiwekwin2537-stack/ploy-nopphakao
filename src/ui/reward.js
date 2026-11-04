// หน้าต่างรางวัลเควส (แบบ PoE): เลือกพลอย 1 จาก 3 เม็ด — แตะ 1 ครั้ง = ดูรายละเอียด · แตะซ้ำ/ปุ่ม "รับเม็ดนี้" = รับ
// ปิดหน้าต่างก่อนเลือก = ยังไม่รับ (คุยกับ NPC ใหม่ได้)
import { C, kanokFrame, rrect, circle } from '../art/draw.js';
import { uiText as text } from './hud.js';
import { gemSprite } from '../art/gems.js';
import { drawGemTip } from './tooltip.js';
import { claimQuest } from '../systems/quests.js';
import { gemType } from '../systems/gems.js';

export function rewardLayout(w, h, s) {
  const pw = Math.min(w - 20, 460 * s), ph = Math.min(h - 16, 250 * s), x = w / 2 - pw / 2, y = h / 2 - ph / 2;
  const cw = (pw - 56 * s) / 3, cards = [0, 1, 2].map((i) => ({ x: x + 20 * s + i * (cw + 8 * s), y: y + 54 * s, w: cw, h: ph - 120 * s }));
  return { x, y, w: pw, h: ph, s, cards, ok: { x: x + pw / 2 - 70 * s, y: y + ph - 52 * s, w: 140 * s, h: 30 * s }, close: { x: x + pw - 20 * s, y: y + 20 * s, r: 14 * s } };
}

const questOf = (game) => game.reward && game.data.quests.list.find((q) => q.id === game.reward.quest);

export function drawReward(ctx, game, L, w, h) {
  const q = questOf(game);
  if (!q) return;
  const B = rewardLayout(w, h, L.s), s = B.s, G = game.data.gems, sel = game.reward.sel;
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, w, h);
  kanokFrame(ctx, B.x, B.y, B.w, B.h, 12);
  ctx.fillStyle = 'rgba(16,10,8,0.85)'; rrect(ctx, B.x + 8 * s, B.y + 8 * s, B.w - 16 * s, B.h - 16 * s, 8 * s); ctx.fill();
  text(ctx, `รางวัลเควส: ${q.title}`, B.x + 20 * s, B.y + 22 * s, 14 * s, C.goldHi, 'left', '600');
  text(ctx, `${q.giverName}ให้เลือกพลอย 1 เม็ด`, B.x + 20 * s, B.y + 40 * s, 10 * s, 'rgba(244,230,200,0.75)', 'left', 'normal');
  circle(ctx, B.close.x, B.close.y, B.close.r, 'rgba(120,30,20,0.9)', C.gold, 1.5);
  text(ctx, '✕', B.close.x, B.close.y + 1, 13 * s, '#fff', 'center');
  q.reward.gems.forEach((id, i) => {
    const c = B.cards[i], info = G.main[id] || G.support[id], on = sel === id;
    ctx.fillStyle = on ? 'rgba(217,166,48,0.3)' : 'rgba(0,0,0,0.35)'; rrect(ctx, c.x, c.y, c.w, c.h, 8 * s); ctx.fill();
    ctx.strokeStyle = on ? '#ffffff' : info.color; ctx.lineWidth = on ? 2.5 : 1.5; ctx.stroke();
    const r = Math.min(c.w, c.h) * 0.28;
    ctx.drawImage(gemSprite(G, id, r * 2.6), c.x + c.w / 2 - r * 1.2, c.y + 10 * s, r * 2.4, r * 2.4);
    text(ctx, info.name, c.x + c.w / 2, c.y + c.h - 30 * s, 10.5 * s, info.hi || info.color, 'center', '600');
    const kind = info.aura ? 'พลอยออร่า' : gemType(G, id) === 'main' ? 'พลอยสกิล' : 'พลอยเสริม';
    text(ctx, kind, c.x + c.w / 2, c.y + c.h - 14 * s, 9 * s, 'rgba(244,230,200,0.65)', 'center', 'normal');
  });
  const b = B.ok;
  ctx.fillStyle = sel ? '#3a7a3a' : 'rgba(60,60,60,0.6)'; rrect(ctx, b.x, b.y, b.w, b.h, 6 * s); ctx.fill();
  ctx.strokeStyle = sel ? '#9af0b0' : 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1.5; ctx.stroke();
  text(ctx, sel ? 'รับเม็ดนี้' : 'แตะพลอยที่ต้องการ', b.x + b.w / 2, b.y + b.h / 2, 11 * s, sel ? '#fff' : 'rgba(255,255,255,0.5)', 'center', '600');
  if (sel) { const i = q.reward.gems.indexOf(sel), c = B.cards[i]; drawGemTip(ctx, game, sel, c.x + c.w, c.y + c.h / 2, { s, W: w, H: h, hint: 'แตะซ้ำหรือกด "รับเม็ดนี้" เพื่อรับ' }); }
}

// คืน true เมื่อปิดหน้าต่าง (รับแล้ว หรือกดปิด)
export function updateReward(game, L, w, h) {
  const q = questOf(game);
  if (!q) { game.reward = null; return true; }
  const B = rewardLayout(w, h, L.s);
  if (game.input.pressed.pause) { game.reward = null; return true; }
  const take = (id) => {
    if (!claimQuest(game, q, id)) return false;
    const info = game.data.gems.main[id] || game.data.gems.support[id];
    game.notice = { text: `ได้${info.name}! แตะรูปตัวละคร → แถบพลอย เพื่อฝัง`, t: 6 };
    game.audio.play('gem'); game.reward = null;
    return true;
  };
  if (game.input.pressed.interact && game.reward.sel) return take(game.reward.sel);
  for (const t of game.input.taps) {
    if (t.consumed) continue;
    t.consumed = true;
    if (Math.hypot(t.sx - B.close.x, t.sy - B.close.y) < B.close.r * 1.4) { game.reward = null; return true; }
    const b = B.ok;
    if (game.reward.sel && t.sx >= b.x && t.sx <= b.x + b.w && t.sy >= b.y && t.sy <= b.y + b.h) return take(game.reward.sel);
    const i = B.cards.findIndex((c) => t.sx >= c.x && t.sx <= c.x + c.w && t.sy >= c.y && t.sy <= c.y + c.h);
    if (i >= 0) {
      const id = q.reward.gems[i];
      if (game.reward.sel === id) return take(id);
      game.reward.sel = id; game.audio.play('click');
    }
  }
  return false;
}

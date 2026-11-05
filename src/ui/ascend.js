// หน้าต่างเลื่อนขั้นอาชีพ (Ascendancy แบบ PoE) — เปิดจากปุ่ม "เลื่อนขั้น" ในต้นพาสซีฟ
// ยังไม่เลือกทาง: การ์ด 2 ทางของอาชีพ (แตะเลือก แตะซ้ำยืนยัน) · เลือกแล้ว: โหนด 4 อัน แตะดู แตะซ้ำลง/คืน
import { C, kanokFrame, rrect } from '../art/draw.js';
import { uiText as text, wrapLines } from './hud.js';
import { describe } from '../systems/passives.js';
import { ascPointsTotal, ascPointsLeft, ascOptions, chooseAscend, allocAsc, refundAsc, canAllocAsc } from '../systems/ascend.js';
import { CLASS_COL } from './create.js';

export function ascendLayout(w, h, s) {
  const pw = Math.min(w - 16, 720 * s), ph = Math.min(h - 12, 380 * s), x = w / 2 - pw / 2, y = h / 2 - ph / 2;
  const cw = (pw - 40 * s) / 2, cards = [0, 1].map((i) => ({ x: x + 16 * s + i * (cw + 8 * s), y: y + 54 * s, w: cw, h: ph - 118 * s }));
  const tw = (pw - 40 * s) / 2, th = (ph - 130 * s) / 2;
  const tiles = [0, 1, 2, 3].map((i) => ({ x: x + 16 * s + (i % 2) * (tw + 8 * s), y: y + 54 * s + Math.floor(i / 2) * (th + 8 * s), w: tw, h: th }));
  return { x, y, w: pw, h: ph, s, cards, tiles, close: { x: x + pw - 20 * s, y: y + 20 * s, r: 14 * s }, info: { x: x + 16 * s, y: y + ph - 56 * s, w: pw - 32 * s, h: 42 * s } };
}

export function openAscend(game) { game.ascSel = null; game.mode = 'ascend'; }

function trialsText(game) {
  const A = game.data.ascendancy, M = game.data.monsters;
  return A.trials.map((t) => `${game.flags[t.flag] ? '✓' : '·'} ${t.name} (ล้ม${M[t.flag.replace(/Slain$/, '')].name})`).join('   ');
}

export function drawAscend(ctx, game, L, w, h) {
  const B = ascendLayout(w, h, L.s), s = B.s, A = game.data.ascendancy, P = game.data.passives, p = game.player, F = game.flags;
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, w, h);
  kanokFrame(ctx, B.x, B.y, B.w, B.h, 12);
  ctx.fillStyle = 'rgba(16,10,8,0.92)'; rrect(ctx, B.x + 8 * s, B.y + 8 * s, B.w - 16 * s, B.h - 16 * s, 8 * s); ctx.fill();
  const col = CLASS_COL[p.cls] || C.goldHi, total = ascPointsTotal(A, F), left = ascPointsLeft(A, p, F);
  text(ctx, `เลื่อนขั้นอาชีพ — ${P.classes[p.cls].name}${p.ascend ? ' → ' + A.list[p.ascend].name : ''}`, B.x + 20 * s, B.y + 24 * s, 15 * s, col, 'left', '600');
  text(ctx, `แต้มเลื่อนขั้น เหลือ ${left} จาก ${total}`, B.x + 20 * s, B.y + 42 * s, 10.5 * s, left > 0 ? '#9af0b0' : C.cream, 'left', 'normal');
  ctx.fillStyle = 'rgba(120,30,20,0.9)'; ctx.beginPath(); ctx.arc(B.close.x, B.close.y, B.close.r, 0, Math.PI * 2); ctx.fill();
  text(ctx, '✕', B.close.x, B.close.y + 1, 13 * s, '#fff', 'center');
  let info;
  if (!p.ascend) {
    ascOptions(A, p).forEach((o, i) => {
      const c = B.cards[i], on = game.ascSel === o.id;
      ctx.fillStyle = on ? 'rgba(217,166,48,0.22)' : 'rgba(0,0,0,0.35)'; rrect(ctx, c.x, c.y, c.w, c.h, 8 * s); ctx.fill();
      ctx.strokeStyle = on ? '#ffffff' : col; ctx.lineWidth = on ? 2.5 : 1.2; ctx.stroke();
      text(ctx, o.name, c.x + c.w / 2, c.y + 18 * s, 15 * s, col, 'center', '600');
      text(ctx, o.desc, c.x + c.w / 2, c.y + 38 * s, 9.5 * s, C.cream, 'center', 'normal');
      o.nodes.forEach((n, k) => {
        const y = c.y + 60 * s + k * 30 * s;
        text(ctx, '◆ ' + n.name, c.x + 12 * s, y, 11 * s, C.goldHi, 'left', '600');
        text(ctx, describe(P, n).join(' · '), c.x + 24 * s, y + 14 * s, 9.5 * s, 'rgba(244,230,200,0.8)', 'left', 'normal');
      });
    });
    info = total <= 0 ? 'ยังไม่มีแต้มเลื่อนขั้น — ผ่านบททดสอบก่อน: ' + trialsText(game)
      : game.ascSel ? `แตะการ์ด "${A.list[game.ascSel].name}" อีกครั้งเพื่อยืนยัน (เลือกแล้วเปลี่ยนไม่ได้ แบบ PoE)` : 'เลือกทางเลื่อนขั้น 1 จาก 2 ทาง — แตะการ์ดเพื่อเลือก';
  } else {
    const a = A.list[p.ascend];
    a.nodes.forEach((n, i) => {
      const t = B.tiles[i], has = p.ascNodes.includes(n.id), can = canAllocAsc(A, p, F, n.id), on = game.ascSel === n.id;
      ctx.fillStyle = has ? 'rgba(217,166,48,0.25)' : 'rgba(0,0,0,0.35)'; rrect(ctx, t.x, t.y, t.w, t.h, 8 * s); ctx.fill();
      ctx.strokeStyle = on ? '#ffffff' : has ? C.goldHi : can ? `rgba(243,210,122,${0.6 + Math.sin(game.time * 5) * 0.35})` : 'rgba(150,130,100,0.5)'; ctx.lineWidth = on ? 2.5 : 1.5; ctx.stroke();
      text(ctx, (has ? '◆ ' : '◇ ') + n.name, t.x + 12 * s, t.y + 18 * s, 13 * s, has ? C.goldHi : C.cream, 'left', '600');
      ctx.font = `normal ${10 * s}px Kanit, sans-serif`;
      wrapLines(ctx, describe(P, n).join(' · '), t.w - 24 * s).slice(0, 3).forEach((l, k) => text(ctx, l, t.x + 12 * s, t.y + 38 * s + k * 14 * s, 10 * s, 'rgba(244,230,200,0.85)', 'left', 'normal'));
    });
    const sel = game.ascSel && a.nodes.find((n) => n.id === game.ascSel), rg = (p.currency && p.currency.regret) || 0;
    info = !sel ? (left > 0 ? 'แตะโหนดเพื่อดู แตะซ้ำเพื่อลงแต้ม (ลงโหนดไหนก่อนก็ได้)' : 'แต้มหมดแล้ว — ผ่านบททดสอบถัดไปเพื่อรับแต้มเพิ่ม: ' + trialsText(game))
      : p.ascNodes.includes(sel.id) ? (rg > 0 ? `แตะอีกครั้งเพื่อคืนแต้ม (ใช้ใบลานล้างกรรม 1 ใบ · มี ${rg})` : 'ลงแล้ว · คืนแต้มต้องใช้ใบลานล้างกรรม')
        : left > 0 ? `แตะอีกครั้งเพื่อลง "${sel.name}" (ใช้แต้มเลื่อนขั้น 1)` : 'แต้มเลื่อนขั้นไม่พอ — ' + trialsText(game);
  }
  const I = B.info;
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; rrect(ctx, I.x, I.y, I.w, I.h, 6 * s); ctx.fill();
  ctx.font = `normal ${10 * s}px Kanit, sans-serif`;
  wrapLines(ctx, info, I.w - 20 * s).slice(0, 2).forEach((l, k) => text(ctx, l, I.x + 10 * s, I.y + 13 * s + k * 15 * s, 10 * s, '#9af0b0', 'left', 'normal'));
}

// คืน true เมื่อปิด (กลับต้นพาสซีฟ)
export function updateAscend(game, L, w, h) {
  const B = ascendLayout(w, h, L.s), A = game.data.ascendancy, p = game.player, F = game.flags, inp = game.input;
  if (inp.pressed.pause || inp.pressed.tree || inp.pressed.bag) return true;
  const inBox = (t, b) => t.sx >= b.x && t.sx <= b.x + b.w && t.sy >= b.y && t.sy <= b.y + b.h;
  for (const t of inp.taps) {
    if (t.consumed) continue;
    t.consumed = true;
    if (Math.hypot(t.sx - B.close.x, t.sy - B.close.y) < B.close.r * 1.4) return true;
    if (!p.ascend) {
      const i = B.cards.findIndex((c) => inBox(t, c)), o = ascOptions(A, p)[i];
      if (!o) continue;
      if (game.ascSel !== o.id) { game.ascSel = o.id; game.audio.play('click'); continue; }
      if (chooseAscend(A, p, F, o.id)) { game.ascSel = null; game.audio.play('level'); game.events.emit('passivesChanged', {}); }
      else game.notice = { text: 'ยังไม่มีแต้มเลื่อนขั้น — ผ่านบททดสอบก่อน (ล้มพญาครุฑราชบนเขาไกรลาส)', t: 4 };
      continue;
    }
    const i = B.tiles.findIndex((b) => inBox(t, b)), n = A.list[p.ascend].nodes[i];
    if (!n) { game.ascSel = null; continue; }
    if (game.ascSel !== n.id) { game.ascSel = n.id; game.audio.play('click'); continue; }
    const had = p.ascNodes.includes(n.id);
    if (had ? refundAsc(p, n.id) : allocAsc(A, p, F, n.id)) { game.audio.play(had ? 'gem' : 'level'); game.events.emit('passivesChanged', {}); }
  }
  return false;
}

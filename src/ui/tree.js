// หน้าต้นพาสซีฟ: ลากเพื่อเลื่อน · ซูมด้วยปุ่ม +/− ล้อเมาส์ หรือสองนิ้ว · แตะโหนดดูรายละเอียด แตะซ้ำเพื่อเลือก/คืนแต้ม
import { C, rrect, circle, kanokFrame } from '../art/draw.js';
import { uiText as text } from './hud.js';
import { startOf, pointsLeft, canAllocate, allocate, canRefund, refund, describe } from '../systems/passives.js';
import { playerStats } from '../systems/stats.js';
import { ascPointsLeft, ascPointsTotal } from '../systems/ascend.js';

import { CLASS_COL } from './create.js';
import { drawTreeBackground, drawLink, drawNode, nodeImage } from './treeart.js';

function classOfNode(P, id) {
  if (P.nodes[id].class) return P.nodes[id].class;
  const m = /^(warrior|ranger|shaman)_/.exec(id);
  return m ? m[1] : null;
}

function nodeR(n, s) { return (n.kind === 'keystone' ? 18 : n.kind === 'notable' ? 14 : n.kind === 'start' ? 24 : 9) * s; }

// ป้ายชื่อโหนด: แผ่นมืดโปร่งใต้ตัวหนังสือ อ่านง่ายบนพื้นดาว
function label(ctx, t, x, y, size, col, s) {
  ctx.font = `600 ${size}px Kanit, sans-serif`;
  const w = ctx.measureText(t).width + 10 * s;
  ctx.fillStyle = 'rgba(8,6,10,0.72)'; rrect(ctx, x - w / 2, y - size * 0.75, w, size * 1.5, 4 * s); ctx.fill();
  text(ctx, t, x, y, size, col, 'center', '600');
}

export function treeLayout(w, h, s) {
  return {
    close: { x: w - 26 * s, y: 24 * s, r: 15 * s },
    back: { x: w - 150 * s, y: 12 * s, w: 96 * s, h: 26 * s },
    asc: { x: w - 262 * s, y: 12 * s, w: 104 * s, h: 26 * s },
    zin: { x: w - 26 * s, y: 64 * s, r: 14 * s },
    zout: { x: w - 26 * s, y: 98 * s, r: 14 * s },
    info: { x: 10 * s, y: h - 86 * s, w: Math.min(w - 20 * s, 460 * s), h: 76 * s },
  };
}

export function openTree(game) {
  const P = game.data.passives, st = startOf(game.player, P);
  const v = game.treeView || {};
  if (!game.treeView) {
    const n = st ? P.nodes[st] : { x: 0, y: 0 };
    Object.assign(v, { x: n.x * 0.6, y: n.y * 0.6, z: st ? 0.95 : 0.55, sel: null });
  }
  v.sel = null;
  game.treeView = v;
  game.input.setUiMode(true);
}

export function drawTree(ctx, game, L, w, h) {
  const P = game.data.passives, p = game.player, v = game.treeView, s = L.s, t = game.time;
  const sx = (x) => w / 2 + (x - v.x) * v.z * s, sy = (y) => h / 2 + (y - v.y) * v.z * s;
  drawTreeBackground(ctx, game.data, w, h, sx, sy, v.z, s, t);       // ท้องฟ้าดาว + มณฑลกนก + แสงประจำอาชีพ
  const own = new Set(p.passives);
  // เส้นทาง: ทองเรืองมีประกายวิ่ง (ลงแล้ว) · ทองกะพริบ (เดินต่อได้) · ทองแดงหม่น
  for (const [id, n] of Object.entries(P.nodes)) {
    for (const l of n.links) {
      if (l < id) continue;
      const a = own.has(id), b = own.has(l), st = a && b ? 'own' : (a && canAllocate(p, P, l)) || (b && canAllocate(p, P, id)) ? 'can' : 'none';
      drawLink(ctx, sx(n.x), sy(n.y), sx(P.nodes[l].x), sy(P.nodes[l].y), st, s * Math.min(1.2, Math.max(0.6, v.z)), t);
    }
  }
  // โหนด: กรอบทองตามชนิด (เล็ก/เด่น/คีย์สโตน/จุดเริ่ม) + ไอคอนตามค่า
  for (const [id, n] of Object.entries(P.nodes)) {
    const x = sx(n.x), y = sy(n.y), r = nodeR(n, s) * Math.min(1.3, Math.max(0.7, v.z));
    if (x < -60 || y < -60 || x > w + 60 || y > h + 60) continue;
    const has = own.has(id), cls = classOfNode(P, id), col = cls ? CLASS_COL[cls] : C.gold;
    drawNode(ctx, game.data, n, x, y, r, has ? 'own' : canAllocate(p, P, id) ? 'can' : 'none', col, t);
    if (n.kind === 'start') label(ctx, n.name, x, y + r * 1.45 + 8 * s, 11.5 * s, CLASS_COL[n.class], s);
    else if (n.kind !== 'small' && v.z > 0.7) label(ctx, n.name, x, y + r * 1.3 + 8 * s, 9 * s, has ? C.goldHi : 'rgba(244,230,200,0.85)', s);
    if (v.sel === id) { ctx.beginPath(); ctx.arc(x, y, r * 1.45, 0, 7); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.stroke(); ctx.setLineDash([]); }
  }
  // แถบบน
  const U = treeLayout(w, h, s), left = pointsLeft(p, P), st = startOf(p, P);
  ctx.fillStyle = 'rgba(14,12,18,0.8)'; rrect(ctx, 10 * s, 8 * s, 300 * s, 34 * s, 10 * s); ctx.fill();
  text(ctx, 'ต้นพาสซีฟ', 22 * s, 25 * s, 15 * s, C.goldHi);
  text(ctx, st ? `แต้มเหลือ ${left}` : 'เลือกสายเริ่มต้นก่อน', 120 * s, 25 * s, 12 * s, left > 0 || !st ? '#9af0b0' : C.cream);
  const ps = playerStats(p, game.data);
  text(ctx, `ดาบ ${Math.round(ps.damage)} · พลอย ${Math.round(ps.spellDamage)} · เลือด ${ps.maxHp} · มานา ${ps.maxMp} · คริ ${Math.round(ps.crit * 100)}%`, 20 * s, 54 * s, 10 * s, C.cream, 'left', 'normal');
  const BK = U.back;                                      // กลับหน้าโปรไฟล์
  ctx.fillStyle = 'rgba(14,12,18,0.85)'; rrect(ctx, BK.x, BK.y, BK.w, BK.h, 9 * s); ctx.fill();
  ctx.strokeStyle = C.gold; ctx.lineWidth = 1.2; ctx.stroke();
  text(ctx, '◀ โปรไฟล์', BK.x + BK.w / 2, BK.y + BK.h / 2 + 0.5, 11 * s, C.goldHi, 'center', '600');
  const A = game.data.ascendancy, AS = U.asc;             // ปุ่มเลื่อนขั้นอาชีพ (เรืองแสงเมื่อมีแต้มเหลือ)
  if (A) {
    const al = ascPointsLeft(A, p, game.flags), glow = al > 0 && ascPointsTotal(A, game.flags) > 0;
    ctx.fillStyle = glow ? `rgba(120,70,20,${0.75 + Math.sin(t * 5) * 0.2})` : 'rgba(14,12,18,0.85)'; rrect(ctx, AS.x, AS.y, AS.w, AS.h, 9 * s); ctx.fill();
    ctx.strokeStyle = glow ? C.goldHi : C.gold; ctx.lineWidth = glow ? 2 : 1.2; ctx.stroke();
    text(ctx, glow ? `เลื่อนขั้น (${al})` : 'เลื่อนขั้น', AS.x + AS.w / 2, AS.y + AS.h / 2 + 0.5, 11 * s, C.goldHi, 'center', '600');
  }
  for (const [k, b] of [['close', U.close], ['zin', U.zin], ['zout', U.zout]]) {
    circle(ctx, b.x, b.y, b.r, k === 'close' ? 'rgba(120,30,20,0.9)' : 'rgba(14,12,18,0.85)', C.gold, 1.5);
    text(ctx, k === 'close' ? '✕' : k === 'zin' ? '+' : '−', b.x, b.y + 1, 14 * s, '#fff', 'center');
  }
  // รายละเอียดโหนดที่เลือก
  const I = U.info;
  kanokFrame(ctx, I.x, I.y, I.w, I.h, 10);                          // กรอบลายไทยแบบหน้าต่างอื่นในเกม
  ctx.fillStyle = 'rgba(12,8,14,0.9)'; rrect(ctx, I.x + 4 * s, I.y + 4 * s, I.w - 8 * s, I.h - 8 * s, 8 * s); ctx.fill();
  if (v.sel) {
    const n = P.nodes[v.sel], lines = n.kind === 'start' ? [P.classes[n.class].desc] : describe(P, n), cls = classOfNode(P, v.sel);
    nodeImage(ctx, game.data, n, I.x + 30 * s, I.y + I.h / 2, 16 * s, own.has(v.sel) ? 'own' : 'can', cls ? CLASS_COL[cls] : C.gold);   // รูปโหนดที่เลือก
    const tx = I.x + 58 * s;
    text(ctx, n.name + (n.kind === 'keystone' ? ' (คีย์สโตน)' : n.kind === 'notable' ? ' (โหนดเด่น)' : ''), tx, I.y + 16 * s, 13 * s, n.kind === 'start' ? CLASS_COL[n.class] : C.goldHi);
    text(ctx, lines.join(' · '), tx, I.y + 37 * s, 10.5 * s, C.cream, 'left', 'normal');
    let act;
    const rg = (p.currency && p.currency.regret) || 0;
    if (own.has(v.sel)) act = !canRefund(p, P, v.sel) ? 'ลงแล้ว · คืนไม่ได้: มีโหนดอื่นต่อจากโหนดนี้' : rg > 0 ? `แตะอีกครั้งเพื่อคืนแต้ม (ใช้ใบลานล้างกรรม 1 ใบ · มี ${rg})` : 'ลงแล้ว · คืนแต้มต้องใช้ใบลานล้างกรรม (ซื้อที่ร้านแม่ค้า หรือมอนดรอป)';
    else if (n.kind === 'start') act = st ? 'เลือกสายไปแล้ว (คืนทุกโหนดก่อนถึงเปลี่ยนสายได้)' : `แตะอีกครั้งเพื่อเลือกสาย${n.name} (ฟรี)`;
    else if (!st) act = 'เลือกสายเริ่มต้นก่อน (โหนดวงใหญ่ 3 จุด)';
    else if (canAllocate(p, P, v.sel)) act = 'แตะอีกครั้งเพื่อเลือก (ใช้ 1 แต้ม · ลงแล้วถอนฟรีไม่ได้)';
    else act = left <= 0 ? 'แต้มไม่พอ — เลเวลอัพเพื่อรับแต้ม' : 'ต้องต่อจากโหนดที่เลือกไว้แล้ว';
    text(ctx, act, tx, I.y + 58 * s, 10.5 * s, '#9af0b0', 'left', '600');
  } else {
    text(ctx, st ? 'แตะโหนดที่ติดกับเส้นทองเพื่อดูรายละเอียด แตะซ้ำเพื่อเลือก' : 'แตะจุดเริ่มของอาชีพตัวเอง (วงใหญ่สีประจำอาชีพ) เพื่อเริ่มต้น', I.x + 12 * s, I.y + 22 * s, 11 * s, C.cream, 'left', 'normal');
    text(ctx, 'ต้นเดียวกันทั้งหมด เดินข้ามไปสายอื่นได้ผ่านวงกลางหรือทางผสม', I.x + 12 * s, I.y + 46 * s, 10 * s, 'rgba(244,230,200,0.7)', 'left', 'normal');
  }
}

// คืน true ถ้าควรปิด · 'back' = กลับหน้าโปรไฟล์ · 'ascend' = เปิดหน้าต่างเลื่อนขั้น
export function updateTree(game, L, w, h) {
  const P = game.data.passives, p = game.player, v = game.treeView, s = L.s, inp = game.input;
  if (inp.pressed.tree || inp.pressed.pause || inp.pressed.bag) return true;
  v.x -= inp.drag.dx / (v.z * s); v.y -= inp.drag.dy / (v.z * s);
  if (inp.drag.wheel) v.z *= Math.pow(0.999, inp.drag.wheel);
  if (inp.drag.pinch !== 1) v.z *= inp.drag.pinch;
  v.z = Math.max(0.35, Math.min(2, v.z));
  v.x = Math.max(-800, Math.min(800, v.x)); v.y = Math.max(-800, Math.min(800, v.y));
  const U = treeLayout(w, h, s);
  for (const t of inp.taps) {
    if (t.consumed) continue;
    t.consumed = true;
    const hit = (b) => Math.hypot(t.sx - b.x, t.sy - b.y) < b.r * 1.4;
    if (hit(U.close)) return true;
    if (t.sx >= U.back.x && t.sx <= U.back.x + U.back.w && t.sy >= U.back.y && t.sy <= U.back.y + U.back.h) { game.audio.play('click'); return 'back'; }
    if (game.data.ascendancy && t.sx >= U.asc.x && t.sx <= U.asc.x + U.asc.w && t.sy >= U.asc.y && t.sy <= U.asc.y + U.asc.h) { game.audio.play('click'); return 'ascend'; }
    if (hit(U.zin)) { v.z = Math.min(2, v.z * 1.25); continue; }
    if (hit(U.zout)) { v.z = Math.max(0.35, v.z / 1.25); continue; }
    let best = null, bd = 1e9;
    for (const [id, n] of Object.entries(P.nodes)) {
      const x = w / 2 + (n.x - v.x) * v.z * s, y = h / 2 + (n.y - v.y) * v.z * s, d = Math.hypot(t.sx - x, t.sy - y);
      if (d < nodeR(n, s) * Math.min(1.3, Math.max(0.7, v.z)) + 10 * s && d < bd) { bd = d; best = id; }   // ขนาดเดียวกับที่วาด
    }
    if (!best) { v.sel = null; continue; }
    if (v.sel !== best) { v.sel = best; game.audio.play('click'); continue; }
    if (p.passives.includes(best) ? refund(p, P, best) : allocate(p, P, best)) {
      game.audio.play(p.passives.includes(best) ? 'gem' : 'click');
      game.events.emit('passivesChanged', {});
    } else if (p.passives.includes(best) && canRefund(p, P, best)) game.notice = { text: 'คืนแต้มต้องใช้ใบลานล้างกรรม — ซื้อได้ที่ร้านแม่ค้า', t: 3 };
  }
  return false;
}

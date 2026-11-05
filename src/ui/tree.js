// หน้าต้นพาสซีฟ: ลากเพื่อเลื่อน · ซูมด้วยปุ่ม +/− ล้อเมาส์ หรือสองนิ้ว · แตะโหนดดูรายละเอียด แตะซ้ำเพื่อเลือก/คืนแต้ม
import { C, kanokFrame, rrect, circle, poly } from '../art/draw.js';
import { uiText as text } from './hud.js';
import { startOf, pointsLeft, canAllocate, allocate, canRefund, refund, describe } from '../systems/passives.js';
import { playerStats } from '../systems/stats.js';

import { CLASS_COL } from './create.js';

function classOfNode(P, id) {
  if (P.nodes[id].class) return P.nodes[id].class;
  const m = /^(warrior|ranger|shaman)_/.exec(id);
  return m ? m[1] : null;
}

function nodeR(n, s) { return (n.kind === 'keystone' ? 17 : n.kind === 'notable' ? 13 : n.kind === 'start' ? 19 : 8) * s; }

function ui(w, h, s) {
  return {
    close: { x: w - 26 * s, y: 24 * s, r: 15 * s },
    back: { x: w - 150 * s, y: 12 * s, w: 96 * s, h: 26 * s },
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
  const g = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, Math.max(w, h) * 0.7);
  g.addColorStop(0, '#2a1d18'); g.addColorStop(1, '#0e0a08');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  // ลายวงกลมจางๆ ที่ใจกลาง
  ctx.strokeStyle = 'rgba(217,166,48,0.08)'; ctx.lineWidth = 1;
  for (const r of [130, 300, 470, 650]) { ctx.beginPath(); ctx.arc(sx(0), sy(0), r * v.z * s, 0, Math.PI * 2); ctx.stroke(); }
  const own = new Set(p.passives);
  // เส้นเชื่อม
  for (const [id, n] of Object.entries(P.nodes)) {
    for (const l of n.links) {
      if (l < id) continue;
      const a = own.has(id), b = own.has(l);
      ctx.strokeStyle = a && b ? C.goldHi : (a && canAllocate(p, P, l)) || (b && canAllocate(p, P, id)) ? 'rgba(243,210,122,0.55)' : 'rgba(150,130,100,0.25)';
      ctx.lineWidth = (a && b ? 4 : 2.5) * s;
      ctx.beginPath(); ctx.moveTo(sx(n.x), sy(n.y)); ctx.lineTo(sx(P.nodes[l].x), sy(P.nodes[l].y)); ctx.stroke();
    }
  }
  // โหนด
  for (const [id, n] of Object.entries(P.nodes)) {
    const x = sx(n.x), y = sy(n.y), r = nodeR(n, s);
    if (x < -40 || y < -40 || x > w + 40 || y > h + 40) continue;
    const has = own.has(id), can = canAllocate(p, P, id), cls = classOfNode(P, id);
    const col = cls ? CLASS_COL[cls] : C.gold;
    if (has) { const gl = ctx.createRadialGradient(x, y, r * 0.3, x, y, r * 2.2); gl.addColorStop(0, col + 'aa'); gl.addColorStop(1, col + '00'); ctx.fillStyle = gl; ctx.fillRect(x - r * 2.2, y - r * 2.2, r * 4.4, r * 4.4); }
    const fill = has ? col : '#1e1612';
    const ring = has ? C.goldHi : can ? `rgba(243,210,122,${0.6 + Math.sin(t * 5) * 0.35})` : 'rgba(150,130,100,0.6)';
    if (n.kind === 'keystone') {
      const pts = []; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + Math.PI / 8; pts.push(x + Math.cos(a) * r, y + Math.sin(a) * r); }
      poly(ctx, pts, fill, ring, 3 * s);
    } else circle(ctx, x, y, r, fill, ring, (n.kind === 'small' ? 2 : 3) * s);
    if (n.kind === 'notable' || n.kind === 'keystone') circle(ctx, x, y, r * 0.45, has ? C.goldHi : 'rgba(217,166,48,0.35)', null);
    if (n.kind === 'start') text(ctx, n.name, x, y + r + 10 * s, 11 * s, CLASS_COL[n.class], 'center');
    else if (n.kind !== 'small' && v.z > 0.7) text(ctx, n.name, x, y + r + 9 * s, 9 * s, has ? C.goldHi : 'rgba(244,230,200,0.75)', 'center', 'normal');
    if (v.sel === id) circle(ctx, x, y, r + 5 * s, null, '#ffffff', 2);
  }
  // แถบบน
  const U = ui(w, h, s), left = pointsLeft(p, P), st = startOf(p, P);
  ctx.fillStyle = 'rgba(14,12,18,0.8)'; rrect(ctx, 10 * s, 8 * s, 300 * s, 34 * s, 10 * s); ctx.fill();
  text(ctx, 'ต้นพาสซีฟ', 22 * s, 25 * s, 15 * s, C.goldHi);
  text(ctx, st ? `แต้มเหลือ ${left}` : 'เลือกสายเริ่มต้นก่อน', 120 * s, 25 * s, 12 * s, left > 0 || !st ? '#9af0b0' : C.cream);
  const ps = playerStats(p, game.data);
  text(ctx, `ดาบ ${Math.round(ps.damage)} · พลอย ${Math.round(ps.spellDamage)} · เลือด ${ps.maxHp} · มานา ${ps.maxMp} · คริ ${Math.round(ps.crit * 100)}%`, 20 * s, 54 * s, 10 * s, C.cream, 'left', 'normal');
  const BK = U.back;                                      // กลับหน้าโปรไฟล์
  ctx.fillStyle = 'rgba(14,12,18,0.85)'; rrect(ctx, BK.x, BK.y, BK.w, BK.h, 9 * s); ctx.fill();
  ctx.strokeStyle = C.gold; ctx.lineWidth = 1.2; ctx.stroke();
  text(ctx, '◀ โปรไฟล์', BK.x + BK.w / 2, BK.y + BK.h / 2 + 0.5, 11 * s, C.goldHi, 'center', '600');
  for (const [k, b] of [['close', U.close], ['zin', U.zin], ['zout', U.zout]]) {
    circle(ctx, b.x, b.y, b.r, k === 'close' ? 'rgba(120,30,20,0.9)' : 'rgba(14,12,18,0.85)', C.gold, 1.5);
    text(ctx, k === 'close' ? '✕' : k === 'zin' ? '+' : '−', b.x, b.y + 1, 14 * s, '#fff', 'center');
  }
  // รายละเอียดโหนดที่เลือก
  const I = U.info;
  ctx.fillStyle = 'rgba(14,12,18,0.88)'; rrect(ctx, I.x, I.y, I.w, I.h, 10 * s); ctx.fill();
  ctx.strokeStyle = 'rgba(217,166,48,0.5)'; ctx.lineWidth = 1; ctx.stroke();
  if (v.sel) {
    const n = P.nodes[v.sel], lines = n.kind === 'start' ? [P.classes[n.class].desc] : describe(P, n);
    text(ctx, n.name + (n.kind === 'keystone' ? ' (คีย์สโตน)' : n.kind === 'notable' ? ' (โหนดเด่น)' : ''), I.x + 12 * s, I.y + 14 * s, 13 * s, n.kind === 'start' ? CLASS_COL[n.class] : C.goldHi);
    text(ctx, lines.join(' · '), I.x + 12 * s, I.y + 36 * s, 10.5 * s, C.cream, 'left', 'normal');
    let act;
    const rg = (p.currency && p.currency.regret) || 0;
    if (own.has(v.sel)) act = !canRefund(p, P, v.sel) ? 'ลงแล้ว · คืนไม่ได้: มีโหนดอื่นต่อจากโหนดนี้' : rg > 0 ? `แตะอีกครั้งเพื่อคืนแต้ม (ใช้ใบลานล้างกรรม 1 ใบ · มี ${rg})` : 'ลงแล้ว · คืนแต้มต้องใช้ใบลานล้างกรรม (ซื้อที่ร้านแม่ค้า หรือมอนดรอป)';
    else if (n.kind === 'start') act = st ? 'เลือกสายไปแล้ว (คืนทุกโหนดก่อนถึงเปลี่ยนสายได้)' : `แตะอีกครั้งเพื่อเลือกสาย${n.name} (ฟรี)`;
    else if (!st) act = 'เลือกสายเริ่มต้นก่อน (โหนดวงใหญ่ 3 จุด)';
    else if (canAllocate(p, P, v.sel)) act = 'แตะอีกครั้งเพื่อเลือก (ใช้ 1 แต้ม · ลงแล้วถอนฟรีไม่ได้)';
    else act = left <= 0 ? 'แต้มไม่พอ — เลเวลอัพเพื่อรับแต้ม' : 'ต้องต่อจากโหนดที่เลือกไว้แล้ว';
    text(ctx, act, I.x + 12 * s, I.y + 58 * s, 10.5 * s, '#9af0b0', 'left', '600');
  } else {
    text(ctx, st ? 'แตะโหนดที่ติดกับเส้นทองเพื่อดูรายละเอียด แตะซ้ำเพื่อเลือก' : 'เลือกสายเริ่มต้น: นักรบ (ดาบ/เลือด) · พราน (เร็ว/คริ) · หมอผี (พลอย/มานา)', I.x + 12 * s, I.y + 22 * s, 11 * s, C.cream, 'left', 'normal');
    text(ctx, 'ต้นเดียวกันทั้งหมด เดินข้ามไปสายอื่นได้ผ่านวงกลางหรือทางผสม', I.x + 12 * s, I.y + 46 * s, 10 * s, 'rgba(244,230,200,0.7)', 'left', 'normal');
  }
}

// คืน true ถ้าควรปิด หรือ 'back' ถ้ากลับหน้าโปรไฟล์
export function updateTree(game, L, w, h) {
  const P = game.data.passives, p = game.player, v = game.treeView, s = L.s, inp = game.input;
  if (inp.pressed.tree || inp.pressed.pause || inp.pressed.bag) return true;
  v.x -= inp.drag.dx / (v.z * s); v.y -= inp.drag.dy / (v.z * s);
  if (inp.drag.wheel) v.z *= Math.pow(0.999, inp.drag.wheel);
  if (inp.drag.pinch !== 1) v.z *= inp.drag.pinch;
  v.z = Math.max(0.35, Math.min(2, v.z));
  v.x = Math.max(-800, Math.min(800, v.x)); v.y = Math.max(-800, Math.min(800, v.y));
  const U = ui(w, h, s);
  for (const t of inp.taps) {
    if (t.consumed) continue;
    t.consumed = true;
    const hit = (b) => Math.hypot(t.sx - b.x, t.sy - b.y) < b.r * 1.4;
    if (hit(U.close)) return true;
    if (t.sx >= U.back.x && t.sx <= U.back.x + U.back.w && t.sy >= U.back.y && t.sy <= U.back.y + U.back.h) { game.audio.play('click'); return 'back'; }
    if (hit(U.zin)) { v.z = Math.min(2, v.z * 1.25); continue; }
    if (hit(U.zout)) { v.z = Math.max(0.35, v.z / 1.25); continue; }
    let best = null, bd = 1e9;
    for (const [id, n] of Object.entries(P.nodes)) {
      const x = w / 2 + (n.x - v.x) * v.z * s, y = h / 2 + (n.y - v.y) * v.z * s, d = Math.hypot(t.sx - x, t.sy - y);
      if (d < nodeR(n, s) + 10 * s && d < bd) { bd = d; best = id; }
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

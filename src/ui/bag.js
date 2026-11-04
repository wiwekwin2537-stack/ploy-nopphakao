// หน้ากระเป๋าพลอย: เลือกชุดสกิล → แตะพลอยในกระเป๋าเพื่อฝัง · แตะช่องที่ฝังแล้วเพื่อถอด
import { C, kanokFrame, rrect, circle, poly } from '../art/draw.js';
import { uiText as text } from './hud.js';
import { gemInfo, gemType, socketGem, unsocketGem, computeSkill } from '../systems/gems.js';

const FONT = 'Kanit, sans-serif';
const COLS = 6;

export function bagLayout(w, h, s, G) {
  const pw = Math.min(w - 20, 720 * s), ph = Math.min(h - 16, 360 * s), x = w / 2 - pw / 2, y = h / 2 - ph / 2;
  const rows = [];
  for (let g = 0; g < G.groups; g++) {
    const ry = y + 44 * s + g * 92 * s;
    const sockets = [];
    for (let i = 0; i < 1 + G.supportsPerGroup; i++) sockets.push({ group: g, slot: i, x: x + 40 * s + i * 52 * s, y: ry + 30 * s, r: (i === 0 ? 21 : 17) * s });
    rows.push({ group: g, x: x + 12 * s, y: ry, w: pw * 0.5 - 18 * s, h: 82 * s, sockets });
  }
  const gx = x + pw * 0.5 + 6 * s, gy = y + 52 * s, cell = Math.min(46 * s, (pw * 0.5 - 24 * s) / COLS);
  const close = { x: x + pw - 20 * s, y: y + 20 * s, r: 14 * s };
  return { x, y, w: pw, h: ph, rows, grid: { x: gx, y: gy, cell }, close, s };
}

function gemIcon(ctx, G, id, x, y, r, dim) {
  const info = gemInfo(G, id);
  if (!info) return;
  ctx.globalAlpha = dim ? 0.4 : 1;
  if (gemType(G, id) === 'main') {
    poly(ctx, [x, y - r, x + r * 0.85, y - r * 0.3, x + r * 0.55, y + r * 0.9, x - r * 0.55, y + r * 0.9, x - r * 0.85, y - r * 0.3], info.color, C.ink, 1.5);
    poly(ctx, [x, y - r, x + r * 0.35, y - r * 0.3, x - r * 0.35, y - r * 0.3], info.hi, null);
  } else {
    circle(ctx, x, y, r * 0.75, info.color, C.ink, 1.5);           // พลอยเสริมเป็นเม็ดกลมเจียระไนหลังเบี้ย
    circle(ctx, x - r * 0.25, y - r * 0.25, r * 0.25, 'rgba(255,255,255,0.7)', null);
  }
  ctx.globalAlpha = 1;
}

export function drawBag(ctx, game, L, w, h) {
  const G = game.data.gems, p = game.player, B = bagLayout(w, h, L.s, G), s = B.s;
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, w, h);
  kanokFrame(ctx, B.x, B.y, B.w, B.h, 12);
  text(ctx, 'กระเป๋าพลอย', B.x + 20 * s, B.y + 20 * s, 16 * s, C.goldHi);
  circle(ctx, B.close.x, B.close.y, B.close.r, 'rgba(120,30,20,0.9)', C.gold, 1.5);
  text(ctx, '✕', B.close.x, B.close.y + 1, 13 * s, '#fff', 'center');
  const sel = game.bagGroup || 0;
  for (const row of B.rows) {
    const on = row.group === sel;
    ctx.fillStyle = on ? 'rgba(217,166,48,0.16)' : 'rgba(0,0,0,0.25)'; rrect(ctx, row.x, row.y, row.w, row.h, 8 * s); ctx.fill();
    if (on) { ctx.strokeStyle = C.gold; ctx.lineWidth = 1.5; ctx.stroke(); }
    const key = game.input.mode === 'touch' ? '' : game.input.mode === 'pad' ? (row.group ? ' (LT)' : ' (X)') : (row.group ? ' (L)' : ' (K)');
    text(ctx, `ชุดสกิล ${row.group + 1}${key}`, row.x + 10 * s, row.y + 4 * s, 10 * s, on ? C.goldHi : C.cream);
    const sk = row.sockets;
    ctx.strokeStyle = C.gold; ctx.lineWidth = 3 * s;                 // เส้นเชื่อมช่อง (ลิงก์แบบ PoE)
    ctx.beginPath(); ctx.moveTo(sk[0].x, sk[0].y); ctx.lineTo(sk[sk.length - 1].x, sk[sk.length - 1].y); ctx.stroke();
    for (const so of sk) {
      circle(ctx, so.x, so.y, so.r, '#1a1210', so.slot === 0 ? C.goldHi : '#b89a58', 2.5);
      const id = p.sockets[row.group][so.slot];
      if (id) gemIcon(ctx, G, id, so.x, so.y, so.r * 0.8);
      else text(ctx, so.slot === 0 ? 'หลัก' : 'เสริม', so.x, so.y, 8 * s, 'rgba(244,230,200,0.5)', 'center', 'normal');
    }
    const info = computeSkill(G, p.sockets, row.group);
    const ix = sk[sk.length - 1].x + 30 * s;
    if (info) {
      text(ctx, info.name, ix, row.y + 22 * s, 11 * s, info.hi || C.goldHi);
      const parts = [`ดาเมจ ×${info.damageMult.toFixed(2)}`, `มานา ${info.mp}`, `${info.cooldown.toFixed(2)} วิ`];
      if (info.count > 1) parts.push(`${info.count} ลูก`);
      if (info.pierce) parts.push(`ทะลุ ${info.pierce}`);
      if (info.splash) parts.push(`ระเบิด ${Math.round(info.splash)}`);
      if (info.slow) parts.push('ทำให้ช้า');
      if (info.poison) parts.push('ติดพิษ');
      ctx.font = `normal ${9 * s}px ${FONT}`;
      let line = '', ly = row.y + 40 * s;
      for (const part of parts) {
        if (ctx.measureText(line + ' · ' + part).width > row.x + row.w - ix - 6 * s && line) { text(ctx, line, ix, ly, 9 * s, C.cream, 'left', 'normal'); ly += 13 * s; line = part; }
        else line = line ? line + ' · ' + part : part;
      }
      if (line) text(ctx, line, ix, ly, 9 * s, C.cream, 'left', 'normal');
    } else text(ctx, 'ยังไม่มีพลอยหลัก', ix, row.y + 30 * s, 10 * s, 'rgba(244,230,200,0.6)', 'left', 'normal');
  }
  // กระเป๋า
  const g = B.grid;
  text(ctx, `พลอยในกระเป๋า (${p.bag.length}) — แตะเพื่อฝังลงชุด ${sel + 1}`, g.x, B.y + 36 * s, 10 * s, C.cream, 'left', 'normal');
  if (!p.bag.length) text(ctx, 'ยังไม่มีพลอย ฟาร์มมอนในทุ่งนาร้างเพื่อหาพลอย', g.x, g.y + 20 * s, 10 * s, 'rgba(244,230,200,0.6)', 'left', 'normal');
  p.bag.forEach((id, i) => {
    const cx = g.x + (i % COLS) * g.cell + g.cell / 2, cy = g.y + Math.floor(i / COLS) * g.cell + g.cell / 2;
    if (cy > B.y + B.h - 50 * s) return;
    ctx.fillStyle = game.bagSel === i ? 'rgba(217,166,48,0.35)' : 'rgba(0,0,0,0.3)'; rrect(ctx, cx - g.cell / 2 + 2, cy - g.cell / 2 + 2, g.cell - 4, g.cell - 4, 6 * s); ctx.fill();
    gemIcon(ctx, G, id, cx, cy, g.cell * 0.3);
  });
  // คำอธิบายพลอยที่เลือก/ชี้
  const showId = game.bagSel !== undefined && game.bagSel !== null ? p.bag[game.bagSel] : null;
  const desc = showId ? `${gemInfo(G, showId).name}: ${gemInfo(G, showId).desc}` : 'พลอยหลักให้สกิล · พลอยเสริมเปลี่ยนสกิลในชุดเดียวกัน (ยิงหลายลูก ทะลุ ระเบิด เร็วขึ้น)';
  text(ctx, desc, B.x + 20 * s, B.y + B.h - 18 * s, 10 * s, C.goldHi, 'left', 'normal');
}

// รับการแตะ/คลิกในหน้ากระเป๋า คืน true ถ้าควรปิด
export function updateBag(game, L, w, h) {
  const G = game.data.gems, p = game.player, B = bagLayout(w, h, L.s, G);
  if (game.input.pressed.bag || game.input.pressed.pause) return true;
  for (const t of game.input.taps) {
    if (t.consumed) continue;
    t.consumed = true;
    if (Math.hypot(t.sx - B.close.x, t.sy - B.close.y) < B.close.r * 1.4) return true;
    if (t.sx < B.x || t.sx > B.x + B.w || t.sy < B.y || t.sy > B.y + B.h) return true;   // แตะนอกกรอบ = ปิด
    for (const row of B.rows) {
      for (const so of row.sockets) {
        if (Math.hypot(t.sx - so.x, t.sy - so.y) < so.r * 1.2) {
          if (unsocketGem(p, so.group, so.slot)) { game.audio.play('click'); game.events.emit('gemsChanged', {}); }
          game.bagGroup = so.group; return false;
        }
      }
      if (t.sx >= row.x && t.sx <= row.x + row.w && t.sy >= row.y && t.sy <= row.y + row.h) { game.bagGroup = row.group; game.audio.play('click'); return false; }
    }
    const g = B.grid, col = Math.floor((t.sx - g.x) / g.cell), r = Math.floor((t.sy - g.y) / g.cell);
    if (col >= 0 && col < COLS && r >= 0) {
      const i = r * COLS + col;
      if (i < p.bag.length) {
        if (game.bagSel === i) {                                   // แตะซ้ำ = ฝัง
          if (socketGem(G, p, i, game.bagGroup || 0)) { game.audio.play('gem'); game.events.emit('gemsChanged', {}); }
          game.bagSel = null;
        } else { game.bagSel = i; game.audio.play('click'); }
      }
    }
  }
  return false;
}

export function bagButtonHit(L, t) { return Math.hypot(t.sx - L.bag.x, t.sy - L.bag.y) < L.bag.r * 1.4; }

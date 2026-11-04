// หน้าจอซ้อน: แถบเลือด/มานา/XP เบี้ย ปุ่มสัมผัส คำแนะนำ บทสนทนา หน้าตาย หน้าแรก
import { C, kanokFrame, rrect, circle, poly } from '../art/draw.js';
import { playerStats } from '../systems/player.js';
import { xpNeeded } from '../systems/progress.js';
import { hasSkill } from '../systems/skills.js';
import { hintText, tutorialTarget } from '../systems/tutorial.js';

const FONT = 'Kanit, sans-serif';
const PHI = Math.PI * 2;
const GEM_COLORS = ['#d8283a', '#2a5fd8', '#2aa85a', '#f2c230', '#f0f0ff', '#a0302a', '#e0e0c8', '#c88a3a', '#7ad0c0'];

function text(ctx, str, x, y, size, color = C.cream, align = 'left', weight = 'bold') {
  ctx.font = `${weight} ${size}px ${FONT}`; ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(2, size / 5); ctx.strokeStyle = C.ink; ctx.strokeText(str, x, y);
  ctx.fillStyle = color; ctx.fillText(str, x, y);
}
function bar(ctx, x, y, w, h, k, col, bg = 'rgba(0,0,0,0.55)') {
  ctx.fillStyle = bg; rrect(ctx, x, y, w, h, h / 2); ctx.fill();
  if (k > 0) { ctx.fillStyle = col; rrect(ctx, x, y, Math.max(h, w * Math.min(1, k)), h, h / 2); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(x + h / 2, y + 1, Math.max(0, w * Math.min(1, k) - h), h * 0.3);
  ctx.strokeStyle = C.ink; ctx.lineWidth = 1.2; rrect(ctx, x, y, w, h, h / 2); ctx.stroke();
}
function wrap(ctx, str, maxW) {
  const out = []; let line = '';
  for (const ch of Array.from(str)) {
    if (ctx.measureText(line + ch).width > maxW && line) { out.push(line); line = ch; } else line += ch;
  }
  if (line) out.push(line);
  return out;
}

function icon(ctx, id, x, y, r, game) {
  ctx.save(); ctx.translate(x, y);
  if (id === 'attack') {
    ctx.rotate(-0.8);
    poly(ctx, [-r * 0.05, -r * 0.6, r * 0.08, -r * 0.62, r * 0.12, r * 0.2, -r * 0.1, r * 0.2], '#e6edf0', C.ink, 1.5);
    ctx.fillStyle = C.gold; ctx.fillRect(-r * 0.3, r * 0.18, r * 0.6, r * 0.1); ctx.fillStyle = '#6a3a1a'; ctx.fillRect(-r * 0.07, r * 0.28, r * 0.14, r * 0.3);
  } else if (id === 'dash') {
    ctx.strokeStyle = C.cream; ctx.lineWidth = r * 0.14; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-r * 0.5, (i - 1) * r * 0.28); ctx.lineTo(r * 0.15 - i * r * 0.12, (i - 1) * r * 0.28); ctx.stroke(); }
    poly(ctx, [r * 0.15, -r * 0.4, r * 0.55, 0, r * 0.15, r * 0.4], C.cream, null);
  } else if (id === 'skill') {
    const ok = hasSkill(game.player, 'fireball');
    poly(ctx, [0, -r * 0.55, r * 0.5, -r * 0.18, r * 0.3, r * 0.5, -r * 0.3, r * 0.5, -r * 0.5, -r * 0.18], ok ? '#d8283a' : '#555', C.ink, 1.5);
    poly(ctx, [0, -r * 0.55, r * 0.2, -r * 0.18, -r * 0.2, -r * 0.18], ok ? '#ff8a9a' : '#777', null);
  } else if (id === 'interact') {
    ctx.fillStyle = C.cream; rrect(ctx, -r * 0.5, -r * 0.4, r, r * 0.65, r * 0.2); ctx.fill();
    poly(ctx, [-r * 0.15, r * 0.24, -r * 0.3, r * 0.5, r * 0.1, r * 0.24], C.cream, null);
    ctx.fillStyle = C.ink; [-0.22, 0, 0.22].forEach((dx) => circle(ctx, dx * r, -r * 0.08, r * 0.07, C.ink, null));
  }
  ctx.restore();
}

function roundButton(ctx, b, id, game, cdK = 0, dim = false) {
  ctx.globalAlpha = dim ? 0.45 : 0.92;
  const g = ctx.createRadialGradient(b.x - b.r * 0.3, b.y - b.r * 0.3, 2, b.x, b.y, b.r);
  g.addColorStop(0, '#5a3d26'); g.addColorStop(1, '#2a1a10');
  circle(ctx, b.x, b.y, b.r, g, C.ink, 2.5);
  circle(ctx, b.x, b.y, b.r - 3, null, C.gold, 2);
  icon(ctx, id, b.x, b.y, b.r * 0.85, game);
  if (cdK > 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.beginPath(); ctx.moveTo(b.x, b.y);
    ctx.arc(b.x, b.y, b.r - 3, -Math.PI / 2, -Math.PI / 2 + PHI * cdK); ctx.closePath(); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function speaker(ctx, x, y, r, muted) {
  circle(ctx, x, y, r, 'rgba(42,29,20,0.85)', C.gold, 1.5);
  poly(ctx, [x - r * 0.5, y - r * 0.2, x - r * 0.2, y - r * 0.2, x + r * 0.15, y - r * 0.5, x + r * 0.15, y + r * 0.5, x - r * 0.2, y + r * 0.2, x - r * 0.5, y + r * 0.2], C.cream, null);
  ctx.strokeStyle = muted ? '#e05a4a' : C.cream; ctx.lineWidth = 1.6;
  if (muted) { ctx.beginPath(); ctx.moveTo(x + r * 0.3, y - r * 0.3); ctx.lineTo(x + r * 0.6, y + r * 0.3); ctx.moveTo(x + r * 0.6, y - r * 0.3); ctx.lineTo(x + r * 0.3, y + r * 0.3); ctx.stroke(); }
  else { ctx.beginPath(); ctx.arc(x + r * 0.2, y, r * 0.35, -0.8, 0.8); ctx.stroke(); }
}

export function drawHud(ctx, game, L, w, h) {
  const p = game.player, st = playerStats(p, game.data.balance), s = L.s;
  // แผงสถานะมุมซ้ายบน
  const px = 10, py = 10, pw = 230 * s, ph = 68 * s;
  kanokFrame(ctx, px, py, pw, ph, 10);
  const cx = px + 30 * s, cy = py + ph / 2;
  circle(ctx, cx, cy, 21 * s, '#3a2414', C.gold, 2.5);
  text(ctx, String(p.level), cx, cy + 1, 18 * s, C.goldHi, 'center');
  text(ctx, 'Lv', cx, cy - 15 * s, 8 * s, C.cream, 'center');
  const bx = px + 58 * s, bw = pw - 70 * s;
  bar(ctx, bx, py + 12 * s, bw, 12 * s, p.hp / st.maxHp, '#c8342c');
  text(ctx, `${Math.ceil(p.hp)}/${st.maxHp}`, bx + bw / 2, py + 18 * s, 8.5 * s, '#fff', 'center');
  bar(ctx, bx, py + 30 * s, bw, 10 * s, p.mp / st.maxMp, '#3a6ad0');
  text(ctx, `${Math.floor(p.mp)}/${st.maxMp}`, bx + bw / 2, py + 35 * s, 7.5 * s, '#fff', 'center');
  const need = xpNeeded(game.data.balance, p.level);
  bar(ctx, bx, py + 46 * s, bw, 7 * s, isFinite(need) ? p.xp / need : 1, '#e0b43a');
  // เบี้ยและปุ่มเสียง มุมขวาบน
  const mx = L.mute.x;
  speaker(ctx, mx, L.mute.y, L.mute.r, game.audio.muted);
  const coinX = mx - L.mute.r - 16 * s;
  circle(ctx, coinX, L.mute.y, 8 * s, C.gold, C.ink, 1.5); circle(ctx, coinX, L.mute.y, 3 * s, '#a87a1a', null);
  text(ctx, String(p.coins), coinX - 13 * s, L.mute.y + 1, 14 * s, C.goldHi, 'right');
  // ชื่อพื้นที่
  if (game.toast && game.toast.t > 0) {
    ctx.globalAlpha = Math.min(1, game.toast.t);
    text(ctx, '— ' + game.toast.text + ' —', w / 2, 34 * s, 20 * s, C.goldHi, 'center');
    ctx.globalAlpha = 1;
  }
  // คำแนะนำบทนำ
  const hint = game.mode === 'play' ? hintText(game) : '';
  if (hint) {
    ctx.font = `bold ${13 * s}px ${FONT}`;
    const lines = wrap(ctx, hint, Math.min(w - 40, 420 * s));
    const hw = Math.min(w - 20, Math.max(...lines.map((l) => ctx.measureText(l).width)) + 34 * s), hh = lines.length * 18 * s + 16 * s;
    const hy = 62 * s + (game.toast && game.toast.t > 0 ? 0 : -6 * s);
    kanokFrame(ctx, w / 2 - hw / 2, hy, hw, hh, 8);
    lines.forEach((l, i) => text(ctx, l, w / 2, hy + 8 * s + 9 * s + i * 18 * s, 13 * s, C.cream, 'center', 'normal'));
  }
  // ลูกศรนำทางชี้ไปขอบจอเมื่อเป้าอยู่นอกจอ
  const tt = tutorialTarget(game);
  if (tt && game.mode === 'play') {
    const b = game.camera.bounds();
    if (tt.x < b.l || tt.x > b.r || tt.y < b.t || tt.y > b.b) {
      const a = Math.atan2(tt.y - game.camera.y, tt.x - game.camera.x);
      const ax = w / 2 + Math.cos(a) * Math.min(w / 2 - 50, h / 2 - 50) * 0.95, ay = h / 2 + Math.sin(a) * (h / 2 - 60);
      ctx.save(); ctx.translate(ax, ay); ctx.rotate(a);
      const bob = Math.sin(game.time * 6) * 4;
      poly(ctx, [12 + bob, 0, -8 + bob, -10, -3 + bob, 0, -8 + bob, 10], C.gold, C.ink, 2);
      ctx.restore();
    }
  }
  // ปุ่มสัมผัส
  if (game.input.mode === 'touch') {
    const j = game.input.joystick, home = L.joyHome;
    const jx = j ? j.x : home.x, jy = j ? j.y : home.y;
    ctx.globalAlpha = j ? 0.75 : 0.4;
    circle(ctx, jx, jy, L.joyR, 'rgba(42,29,20,0.5)', C.gold, 2);
    circle(ctx, jx + (j ? j.dx : 0) * L.joyR, jy + (j ? j.dy : 0) * L.joyR, L.joyR * 0.42, 'rgba(244,230,200,0.8)', C.ink, 2);
    ctx.globalAlpha = 1;
    const SK = game.data.balance.skills.fireball;
    for (const b of L.buttons) {
      if (b.id === 'interact' && !game.nearNpc) continue;
      const cd = b.id === 'skill' ? p.skillCd / SK.cooldown : b.id === 'dash' ? p.dashCd / game.data.balance.player.dashCooldown : 0;
      roundButton(ctx, b, b.id, game, cd, b.id === 'skill' && !hasSkill(p, 'fireball'));
    }
  } else {
    // แถบปุ่มลัดสำหรับคีย์บอร์ด/จอย
    const keys = game.input.mode === 'pad' ? { attack: 'A', dash: 'B', skill: 'X' } : { attack: 'J', dash: 'Spc', skill: 'K' };
    const items = ['attack', 'dash', 'skill'];
    const r = 22 * s, gap = 58 * s, y0 = h - 34 * s, x0 = w / 2 - gap;
    items.forEach((id, i) => {
      const b = { x: x0 + i * gap, y: y0, r };
      const cd = id === 'skill' ? p.skillCd / game.data.balance.skills.fireball.cooldown : id === 'dash' ? p.dashCd / game.data.balance.player.dashCooldown : 0;
      roundButton(ctx, b, id, game, cd, id === 'skill' && !hasSkill(p, 'fireball'));
      text(ctx, keys[id], b.x, b.y + r + 2 * s, 9 * s, C.cream, 'center');
    });
    if (game.nearNpc && game.mode === 'play') text(ctx, `กด ${game.input.mode === 'pad' ? 'Y' : 'E'} เพื่อคุยกับ ${game.nearNpc.name}`, w / 2, h - 84 * s, 13 * s, C.goldHi, 'center');
  }
  if (game.debug) text(ctx, `FPS ${game.loopStats.fps} · ${game.loopStats.frameMs}ms · มอน ${game.mobs.length} · ฟอง ${game.fx.count}`, 10, h - 12, 11, '#9f9', 'left', 'normal');
}

export function drawDialog(ctx, game, L, w, h) {
  const d = game.dialog; if (!d) return;
  const s = L.s, bw = Math.min(w - 24, 640 * s), bh = 104 * s, x = w / 2 - bw / 2, y = h - bh - 14 * s;
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, 0, w, h);
  kanokFrame(ctx, x, y, bw, bh, 12);
  const nameW = 140 * s;
  kanokFrame(ctx, x + 18 * s, y - 16 * s, nameW, 28 * s, 8);
  text(ctx, d.speaker, x + 18 * s + nameW / 2, y - 2 * s, 13 * s, C.goldHi, 'center');
  ctx.font = `normal ${15 * s}px ${FONT}`;
  const shown = Array.from(d.lines[d.i]).slice(0, Math.floor(d.shown)).join('');
  wrap(ctx, shown, bw - 44 * s).forEach((l, i) => text(ctx, l, x + 22 * s, y + 32 * s + i * 22 * s, 15 * s, C.cream, 'left', 'normal'));
  if (d.shown >= d.lines[d.i].length && Math.sin(game.time * 6) > 0) poly(ctx, [x + bw - 30 * s, y + bh - 22 * s, x + bw - 18 * s, y + bh - 22 * s, x + bw - 24 * s, y + bh - 14 * s], C.gold, null);
  text(ctx, `${d.i + 1}/${d.lines.length}`, x + bw - 20 * s, y + 14 * s, 9 * s, 'rgba(244,230,200,0.6)', 'right', 'normal');
}

export function drawDeath(ctx, game, L, w, h) {
  const k = Math.min(1, game.deadT / 1.2);
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.7);
  g.addColorStop(0, `rgba(30,0,0,${0.35 * k})`); g.addColorStop(1, `rgba(90,0,0,${0.85 * k})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = k;
  text(ctx, 'เจ้าล้มลงแล้ว...', w / 2, h / 2 - 20 * L.s, 30 * L.s, '#ffb0a0', 'center');
  if (game.deadT > 1.2) text(ctx, game.flags.reachedTown ? 'แตะ หรือกดปุ่มใดก็ได้ เพื่อกลับเวียงด่านหิน' : 'แตะ หรือกดปุ่มใดก็ได้ เพื่อลุกขึ้นสู้ใหม่', w / 2, h / 2 + 24 * L.s, 14 * L.s, C.cream, 'center', 'normal');
  ctx.globalAlpha = 1;
}

export function titleButtons(game, w, h, s) {
  const bw = 230 * s, bh = 48 * s, x = w / 2 - bw / 2, y0 = h * 0.62;
  const out = [];
  if (game.hasSave) {
    out.push({ id: 'continue', label: 'เล่นต่อ', x, y: y0, w: bw, h: bh });
    out.push({ id: 'new', label: game.confirmNew ? 'แตะอีกครั้งเพื่อเริ่มใหม่' : 'เริ่มใหม่ (ลบเซฟเดิม)', x, y: y0 + bh + 12 * s, w: bw, h: bh * 0.8, small: true });
  } else {
    out.push({ id: 'new', label: 'เริ่มผจญภัย', x, y: y0, w: bw, h: bh });
    out.push({ id: 'skip', label: 'ข้ามบทนำ', x, y: y0 + bh + 12 * s, w: bw, h: bh * 0.8, small: true });
  }
  return out;
}

export function drawTitle(ctx, game, L, w, h) {
  const s = L.s, t = game.time;
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#2a1838'); sky.addColorStop(0.55, '#8a3a3a'); sky.addColorStop(0.85, '#e0904a'); sky.addColorStop(1, '#3a2414');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
  circle(ctx, w * 0.5, h * 0.78, Math.min(w, h) * 0.22, 'rgba(255,200,120,0.35)', null);
  // เงาวัดและทิวมะพร้าวที่ขอบฟ้า
  const base = h * 0.84, tw = Math.min(w * 0.5, 360 * s), tx = w / 2 - tw / 2;
  ctx.fillStyle = '#1a0e10';
  ctx.fillRect(0, base, w, h - base);
  poly(ctx, [tx, base, tx + tw * 0.15, base - tw * 0.22, tx + tw * 0.85, base - tw * 0.22, tx + tw, base], '#1a0e10', null);
  poly(ctx, [tx + tw * 0.12, base - tw * 0.18, tx + tw * 0.3, base - tw * 0.38, tx + tw * 0.7, base - tw * 0.38, tx + tw * 0.88, base - tw * 0.18], '#1a0e10', null);
  poly(ctx, [tx + tw * 0.32, base - tw * 0.36, tx + tw * 0.5, base - tw * 0.62, tx + tw * 0.68, base - tw * 0.36], '#1a0e10', null);
  ctx.strokeStyle = '#1a0e10'; ctx.lineWidth = 4 * s;
  [[0.5, 0.62, 0.53, 0.7], [0, 0.22, 0.03, 0.3], [1, 0.22, 0.97, 0.3]].forEach(([fx, fy, ex, ey]) => {
    ctx.beginPath(); ctx.moveTo(tx + tw * fx, base - tw * fy); ctx.quadraticCurveTo(tx + tw * fx, base - tw * ey, tx + tw * ex, base - tw * ey); ctx.stroke();
  });
  for (const px of [0.08, 0.16, 0.84, 0.93]) {
    const x = w * px, top = base - 120 * s;
    ctx.beginPath(); ctx.moveTo(x, base); ctx.quadraticCurveTo(x + 10 * s, base - 60 * s, x + 4 * s, top); ctx.stroke();
    for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.6; ctx.beginPath(); ctx.moveTo(x + 4 * s, top); ctx.quadraticCurveTo(x + Math.cos(a) * 30 * s, top + Math.sin(a) * 20 * s - 6, x + Math.cos(a) * 44 * s, top + Math.sin(a) * 18 * s + 18 * s); ctx.stroke(); }
  }
  // พลอยเก้าสีลอยวน
  for (let i = 0; i < 9; i++) {
    const a = t * 0.4 + i * PHI / 9, rx = Math.min(w * 0.4, 300 * s), ry = 60 * s;
    const gx = w / 2 + Math.cos(a) * rx, gy = h * 0.3 + Math.sin(a) * ry, sz = (9 + Math.sin(a) * 3) * s;
    const gl = ctx.createRadialGradient(gx, gy, 1, gx, gy, sz * 3);
    gl.addColorStop(0, GEM_COLORS[i] + 'aa'); gl.addColorStop(1, GEM_COLORS[i] + '00');
    ctx.fillStyle = gl; ctx.fillRect(gx - sz * 3, gy - sz * 3, sz * 6, sz * 6);
    poly(ctx, [gx, gy - sz, gx + sz * 0.8, gy - sz * 0.3, gx + sz * 0.5, gy + sz, gx - sz * 0.5, gy + sz, gx - sz * 0.8, gy - sz * 0.3], GEM_COLORS[i], C.ink, 1.5);
  }
  text(ctx, 'พลอยนพเก้า', w / 2, h * 0.3, Math.min(64 * s, w / 7), C.goldHi, 'center');
  text(ctx, 'ตำนานนักล่าพลอยแห่งป่าหิมพานต์', w / 2, h * 0.3 + 44 * s, 15 * s, C.cream, 'center', 'normal');
  for (const b of titleButtons(game, w, h, s)) {
    kanokFrame(ctx, b.x, b.y, b.w, b.h, 10);
    text(ctx, b.label, b.x + b.w / 2, b.y + b.h / 2 + 1, (b.small ? 13 : 18) * s, b.small ? C.cream : C.goldHi, 'center', b.small ? 'normal' : 'bold');
  }
  text(ctx, 'รุ่นทดสอบ ขั้นที่ 1', w - 10, h - 12, 10 * s, 'rgba(244,230,200,0.6)', 'right', 'normal');
}

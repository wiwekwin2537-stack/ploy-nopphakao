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
  ctx.globalAlpha = dim ? 0.45 : 0.95;
  const pal = id === 'attack' ? ['#d8503a', '#7a1a14', '#f3d27a'] : id === 'dash' ? ['#cfe8ff', '#5a8ac8', '#ffffff'] : id === 'skill' ? ['#5a2030', '#2a0c14', '#f3d27a'] : ['#4a3a2a', '#2a1a10', '#f3d27a'];
  const g = ctx.createRadialGradient(b.x - b.r * 0.35, b.y - b.r * 0.35, 2, b.x, b.y, b.r);
  g.addColorStop(0, pal[0]); g.addColorStop(1, pal[1]);
  circle(ctx, b.x, b.y, b.r, g, 'rgba(0,0,0,0.5)', 2);
  circle(ctx, b.x, b.y, b.r - 2.5, null, pal[2], 2.5);
  if (id === 'attack') { icon(ctx, 'attack', b.x - b.r * 0.12, b.y, b.r * 0.85, game); ctx.save(); ctx.translate(b.x + b.r * 0.12, b.y); ctx.scale(-1, 1); icon(ctx, 'attack', 0, 0, b.r * 0.85, game); ctx.restore(); }
  else icon(ctx, id, b.x, b.y, b.r * 0.85, game);
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

// แผนที่เล็ก: วาดพื้นที่ย่อส่วนครั้งเดียวต่อพื้นที่
const miniCache = new Map();
function miniMap(zone) {
  if (miniCache.has(zone.id)) return miniCache.get(zone.id);
  const S = 140 / Math.max(zone.W, zone.H);
  const c = document.createElement('canvas'); c.width = Math.ceil(zone.W * S); c.height = Math.ceil(zone.H * S);
  const g = c.getContext('2d');
  g.fillStyle = { forest: '#3e5e2c', town: '#6f8f45', field: '#7d9c4a' }[zone.def.ground] || '#6f8f45'; g.fillRect(0, 0, c.width, c.height);
  const R = (r, col) => { g.fillStyle = col; g.fillRect(r.x * S, r.y * S, Math.max(1, r.w * S), Math.max(1, r.h * S)); };
  zone.paddies.forEach((r) => R(r, '#5f8e7c'));
  zone.roads.forEach((r) => R(r, zone.def.ground === 'town' ? '#c4ae86' : '#b98a55'));
  zone.water.forEach((r) => R(r, '#3f7fa3'));
  for (const o of zone.objects) {
    if (o.type === 'thicket' || o.type === 'flower' || o.type === 'bush') continue;
    R(o, /tree/.test(o.type) ? '#2f4a22' : /wall/.test(o.type) ? '#8a3f28' : o.type === 'bridge' ? '#9a7446' : '#a3262a');
  }
  const out = { c, S };
  miniCache.set(zone.id, out);
  return out;
}

function face(ctx, x, y, size) {                      // หน้าตัวละครในกรอบรูป (หัวบล็อก + ผมหนาม + ผ้าคาดหัว)
  const u = size / 16, R = (c, a, b, w2, h2) => { ctx.fillStyle = c; ctx.fillRect(x + a * u, y + b * u, w2 * u, h2 * u); };
  R('#2c4a73', 0, 13, 16, 3);
  R('#f1d2b0', 3, 4, 10, 9); R('#14141a', 2, 2, 12, 4); R('#14141a', 2, 0, 3, 3); R('#14141a', 6.5, -1, 3, 3); R('#14141a', 11, 0, 3, 3);
  R('#c8302a', 2, 4, 12, 2); R('#111', 5, 8, 2, 2); R('#111', 9, 8, 2, 2);
}

export function drawHud(ctx, game, L, w, h) {
  const p = game.player, st = playerStats(p, game.data.balance), s = L.s;
  // แผงสถานะมุมซ้ายบน (กรอบรูปหน้า + หลอดเลือด/มานา + เลเวล)
  const px = 8 * s, py = 6 * s, pw = 188 * s, ph = 64 * s;
  ctx.fillStyle = 'rgba(14,12,18,0.72)'; rrect(ctx, px, py, pw, ph, 9 * s); ctx.fill();
  ctx.strokeStyle = 'rgba(217,166,48,0.35)'; ctx.lineWidth = 1; ctx.stroke();
  const fs = 44 * s, fx = px + 6 * s, fy = py + 10 * s;
  ctx.fillStyle = '#3a5a8a'; rrect(ctx, fx, fy, fs, fs, 6 * s); ctx.fill();
  ctx.save(); rrect(ctx, fx, fy, fs, fs, 6 * s); ctx.clip(); face(ctx, fx + 6 * s, fy + 8 * s, fs - 12 * s); ctx.restore();
  ctx.strokeStyle = C.gold; ctx.lineWidth = 2 * s; rrect(ctx, fx, fy, fs, fs, 6 * s); ctx.stroke();
  const bx = fx + fs + 7 * s, bw = px + pw - bx - 7 * s;
  bar(ctx, bx, py + 8 * s, bw, 13 * s, p.hp / st.maxHp, '#d8443a');
  text(ctx, `${Math.ceil(p.hp)}/${st.maxHp}`, bx + bw / 2, py + 15 * s, 10 * s, '#fff', 'center', '600');
  bar(ctx, bx, py + 25 * s, bw, 13 * s, p.mp / st.maxMp, '#3f78e0');
  text(ctx, `${Math.floor(p.mp)}/${st.maxMp}`, bx + bw / 2, py + 32 * s, 10 * s, '#fff', 'center', '600');
  const need = xpNeeded(game.data.balance, p.level);
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; rrect(ctx, bx, py + 42 * s, bw, 14 * s, 7 * s); ctx.fill();
  if (isFinite(need)) { ctx.fillStyle = 'rgba(224,180,58,0.35)'; rrect(ctx, bx, py + 42 * s, Math.max(4, bw * p.xp / need), 14 * s, 7 * s); ctx.fill(); }
  text(ctx, `★ Lv.${p.level}  ${isFinite(need) ? Math.floor(p.xp) + '/' + need : 'สูงสุด'}`, bx + bw / 2, py + 49 * s, 10 * s, C.goldHi, 'center', '600');
  // เบี้ย
  const cy = py + ph + 14 * s;
  ctx.fillStyle = 'rgba(14,12,18,0.72)'; rrect(ctx, px, cy - 11 * s, 64 * s, 22 * s, 11 * s); ctx.fill();
  circle(ctx, px + 12 * s, cy, 7 * s, C.gold, '#8a6a10', 1.5); circle(ctx, px + 12 * s, cy, 2.5 * s, '#a87a1a', null);
  text(ctx, String(p.coins), px + 24 * s, cy + 1, 12 * s, C.goldHi, 'left', '600');
  // ชื่อพื้นที่กลางบน
  ctx.font = `600 ${13 * s}px ${FONT}`;
  const zn = game.world.zone.name, zw = ctx.measureText(zn).width + 28 * s;
  ctx.fillStyle = 'rgba(14,12,18,0.72)'; rrect(ctx, w / 2 - zw / 2, 6 * s, zw, 22 * s, 6 * s); ctx.fill();
  text(ctx, zn, w / 2, 17 * s + 1, 13 * s, '#f4e6c8', 'center', '600');
  if (game.toast && game.toast.t > 0) {
    ctx.globalAlpha = Math.min(1, game.toast.t);
    text(ctx, '— ' + game.toast.text + ' —', w / 2, h * 0.3, 24 * s, C.goldHi, 'center');
    ctx.globalAlpha = 1;
  }
  // แผนที่เล็กวงกลมขอบทอง + เวลา
  const M = L.minimap, z = game.world.zone, mm = miniMap(z);
  ctx.save(); ctx.beginPath(); ctx.arc(M.x, M.y, M.r, 0, PHI); ctx.clip();
  ctx.fillStyle = '#1a1410'; ctx.fillRect(M.x - M.r, M.y - M.r, M.r * 2, M.r * 2);
  const ms = (M.r * 2) / (mm.S * 640);                 // แสดงรัศมีราว 10 ช่องรอบตัว
  const k = mm.S * ms;
  ctx.drawImage(mm.c, M.x - p.x * k, M.y - p.y * k, mm.c.width * ms, mm.c.height * ms);
  for (const m of game.mobs) if (!m.dead) circle(ctx, M.x + (m.x - p.x) * k, M.y + (m.y - p.y) * k, 1.8 * s, '#ff4a3a', null);
  for (const n of z.npcs) circle(ctx, M.x + (n.x - p.x) * k, M.y + (n.y - p.y) * k, 2.2 * s, '#ffd24a', null);
  for (const e of z.exits) circle(ctx, M.x + (e.x + e.w / 2 - p.x) * k, M.y + (e.y + e.h / 2 - p.y) * k, 3 * s, '#7dff8a', '#1a1410', 1);
  ctx.restore();
  poly(ctx, [M.x, M.y - 4 * s, M.x + 3 * s, M.y + 3 * s, M.x - 3 * s, M.y + 3 * s], '#fff', C.ink, 1);
  circle(ctx, M.x, M.y, M.r, null, C.gold, 3 * s); circle(ctx, M.x, M.y, M.r - 2.5 * s, null, 'rgba(0,0,0,0.5)', 1);
  const now = new Date(), clock = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  ctx.fillStyle = 'rgba(14,12,18,0.78)'; rrect(ctx, M.x - 30 * s, M.y + M.r + 4 * s, 60 * s, 18 * s, 9 * s); ctx.fill();
  text(ctx, '☀ ' + clock, M.x, M.y + M.r + 13.5 * s, 11 * s, '#f4e6c8', 'center', '600');
  speaker(ctx, L.mute.x, L.mute.y, L.mute.r, game.audio.muted);
  // คำแนะนำบทนำ
  const hint = game.mode === 'play' ? hintText(game) : '';
  if (hint) {
    ctx.font = `600 ${12 * s}px ${FONT}`;
    const lines = wrap(ctx, hint, Math.min(w - 200 * s, 420 * s));
    const hw = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 30 * s, hh = lines.length * 17 * s + 12 * s;
    const hy = 36 * s;
    ctx.fillStyle = 'rgba(70,14,14,0.86)'; rrect(ctx, w / 2 - hw / 2, hy, hw, hh, hh / 2.2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,180,90,0.6)'; ctx.lineWidth = 1; ctx.stroke();
    lines.forEach((l, i) => text(ctx, l, w / 2, hy + 6 * s + 8.5 * s + i * 17 * s, 12 * s, '#ffe9c8', 'center', '600'));
  }
  // ลูกศรนำทางเมื่อเป้าอยู่นอกจอ
  const tt = tutorialTarget(game);
  if (tt && game.mode === 'play') {
    const b = game.camera.bounds();
    if (tt.x < b.l || tt.x > b.r || tt.y < b.t || tt.y > b.b) {
      const a = Math.atan2(tt.y - game.camera.y, tt.x - game.camera.x);
      const ax = w / 2 + Math.cos(a) * (w / 2 - 80 * s), ay = h / 2 + Math.sin(a) * (h / 2 - 70 * s);
      ctx.save(); ctx.translate(ax, ay); ctx.rotate(a);
      const bob = Math.sin(game.time * 6) * 4;
      poly(ctx, [14 + bob, 0, -9 + bob, -11, -3 + bob, 0, -9 + bob, 11], C.gold, C.ink, 2);
      ctx.restore();
    }
  }
  // จอยเดิน (เส้นประ) — แสดงเสมอแบบเอโดเรีย
  const j = game.input.joystick, home = L.joyHome;
  const jx = j ? j.x : home.x, jy = j ? j.y : home.y;
  ctx.save(); ctx.setLineDash([6 * s, 5 * s]); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.beginPath(); ctx.arc(jx, jy, L.joyR, 0, PHI); ctx.stroke(); ctx.restore();
  if (j) circle(ctx, jx + j.dx * L.joyR, jy + j.dy * L.joyR, L.joyR * 0.42, 'rgba(255,255,255,0.35)', 'rgba(255,255,255,0.7)', 2);
  else text(ctx, 'ลากเพื่อเดิน', jx, jy, 11 * s, 'rgba(255,255,255,0.7)', 'center', 'normal');
  // ช่องสกิลกลางล่าง 1–4
  const SL = L.slots, SK = game.data.balance.skills.fireball;
  for (let i = 0; i < 4; i++) {
    const sx = SL.x + (i - 1.5) * SL.gap, sy = SL.y;
    ctx.fillStyle = 'rgba(14,12,18,0.7)'; rrect(ctx, sx - SL.r - 3 * s, sy - SL.r - 3 * s, (SL.r + 3 * s) * 2, (SL.r + 3 * s) * 2, 8 * s); ctx.fill();
    circle(ctx, sx, sy, SL.r, 'rgba(0,0,0,0.35)', 'rgba(217,166,48,0.6)', 1.5);
    if (i === 0 && hasSkill(p, 'fireball')) { icon(ctx, 'skill', sx, sy, SL.r * 0.9, game); if (p.skillCd > 0) { ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.arc(sx, sy, SL.r, -Math.PI / 2, -Math.PI / 2 + PHI * p.skillCd / SK.cooldown); ctx.fill(); } }
    text(ctx, String(i + 1), sx - SL.r - 1 * s, sy - SL.r + 3 * s, 9 * s, '#f4e6c8', 'center', '600');
  }
  // ปุ่มขวาล่าง
  for (const b of L.buttons) {
    if (b.onlyNear && !game.nearNpc) continue;
    if (b.locked) { lockButton(ctx, b, s); continue; }
    const cd = b.id === 'skill' ? p.skillCd / SK.cooldown : b.id === 'dash' ? p.dashCd / game.data.balance.player.dashCooldown : 0;
    if (b.id === 'skill' && !hasSkill(p, 'fireball')) { lockButton(ctx, b, s); continue; }
    roundButton(ctx, b, b.id, game, cd, false);
    if (game.input.mode !== 'touch') {
      const key = game.input.mode === 'pad' ? { attack: 'A', dash: 'B', skill: 'X', interact: 'Y' }[b.id] : { attack: 'J', dash: 'Space', skill: 'K', interact: 'E' }[b.id];
      if (key) text(ctx, key, b.x + b.r * 0.72, b.y + b.r * 0.78, 9 * s, '#f4e6c8', 'center', '600');
    }
  }
  if (game.nearNpc && game.mode === 'play' && game.input.mode !== 'touch') text(ctx, `กด ${game.input.mode === 'pad' ? 'Y' : 'E'} เพื่อคุยกับ ${game.nearNpc.name}`, w / 2, h - 58 * s, 13 * s, C.goldHi, 'center');
  if (game.debug) text(ctx, `FPS ${game.loopStats.fps} · ${game.loopStats.frameMs}ms · มอน ${game.mobs.length} · ฟอง ${game.fx.count}`, 10, h - 12, 11, '#9f9', 'left', 'normal');
}

function lockButton(ctx, b, s) {
  circle(ctx, b.x, b.y, b.r, 'rgba(20,18,24,0.6)', 'rgba(255,255,255,0.35)', 2);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; rrect(ctx, b.x - b.r * 0.32, b.y - b.r * 0.05, b.r * 0.64, b.r * 0.5, 2 * s); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = b.r * 0.12;
  ctx.beginPath(); ctx.arc(b.x, b.y - b.r * 0.08, b.r * 0.22, Math.PI, 0); ctx.stroke();
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

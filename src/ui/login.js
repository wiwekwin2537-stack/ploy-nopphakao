// หน้าเข้าสู่ระบบ / สมัครสมาชิก (แบบเอโดเรีย) — แถบสลับ เข้าสู่ระบบ ↔ สมัครสมาชิก · ช่องชื่อผู้ใช้ + รหัสผ่าน · เล่นออฟไลน์ได้ · ✕ กลับหน้าแรก
// คืนจาก updateLogin: 'back' | 'offline' | 'ok' (ล็อกอินสำเร็จ → หน้าเลือกตัวละคร) | null
import { C, kanokFrame, rrect } from '../art/draw.js';
import { uiText as text, wrapLines } from './hud.js';
import { drawField, hideFields } from './textfield.js';
import { api, session } from '../net/online.js';

export function loginLayout(w, h, s) {
  const pw = Math.min(w - 16, 420 * s), ph = Math.min(h - 12, 330 * s), x = w / 2 - pw / 2, y = h / 2 - ph / 2, fx = x + 24 * s, fw = pw - 48 * s;
  return {
    x, y, w: pw, h: ph, s,
    tabs: [['login', 'เข้าสู่ระบบ'], ['register', 'สมัครสมาชิก']].map(([id, label], i) => ({ id, label, x: fx + i * (fw / 2 + 4 * s), y: y + 44 * s, w: fw / 2 - 4 * s, h: 30 * s })),
    user: { x: fx, y: y + 104 * s, w: fw, h: 34 * s }, pass: { x: fx, y: y + 158 * s, w: fw, h: 34 * s },
    go: { x: fx, y: y + 206 * s, w: fw, h: 40 * s }, offline: { x: fx, y: y + ph - 46 * s, w: fw, h: 30 * s },
    close: { x: x + pw - 20 * s, y: y + 20 * s, r: 14 * s },
  };
}

export function openLogin(game) {
  game.login = { tab: 'login', user: session.user || '', pass: '', busy: false, msg: '', col: C.cream };
  game.mode = 'login';
}

// ปุ่มของหน้าล็อกอิน/เลือกตัวละคร (กดไม่ได้ = สีเทา)
export function panelButton(ctx, B, label, s, on, col = '#a3262a') {
  ctx.fillStyle = on ? col : 'rgba(60,60,60,0.6)'; rrect(ctx, B.x, B.y, B.w, B.h, 8 * s); ctx.fill();
  ctx.strokeStyle = on ? C.goldHi : 'rgba(184,154,88,0.4)'; ctx.lineWidth = 1.5; ctx.stroke();
  text(ctx, label, B.x + B.w / 2, B.y + B.h / 2, 12 * s, on ? '#fff' : 'rgba(255,255,255,0.5)', 'center', '600');
}

export function drawLogin(ctx, game, L, w, h) {
  const B = loginLayout(w, h, L.s), s = B.s, g = game.login;
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, w, h);
  kanokFrame(ctx, B.x, B.y, B.w, B.h, 12);
  ctx.fillStyle = 'rgba(16,10,8,0.94)'; rrect(ctx, B.x + 8 * s, B.y + 8 * s, B.w - 16 * s, B.h - 16 * s, 8 * s); ctx.fill();
  text(ctx, 'เล่นออนไลน์ — เห็นผู้เล่นคนอื่น', B.x + 22 * s, B.y + 24 * s, 15 * s, C.goldHi, 'left', '600');
  ctx.fillStyle = 'rgba(120,30,20,0.9)'; ctx.beginPath(); ctx.arc(B.close.x, B.close.y, B.close.r, 0, Math.PI * 2); ctx.fill();
  text(ctx, '✕', B.close.x, B.close.y + 1, 13 * s, '#fff', 'center');
  for (const t of B.tabs) {
    const on = g.tab === t.id;
    ctx.fillStyle = on ? 'rgba(217,166,48,0.35)' : 'rgba(0,0,0,0.35)'; rrect(ctx, t.x, t.y, t.w, t.h, 8 * s); ctx.fill();
    ctx.strokeStyle = on ? C.goldHi : 'rgba(184,154,88,0.5)'; ctx.lineWidth = 1.2; ctx.stroke();
    text(ctx, t.label, t.x + t.w / 2, t.y + t.h / 2, 12 * s, on ? C.goldHi : C.cream, 'center', '600');
  }
  text(ctx, 'ชื่อผู้ใช้ (อังกฤษตัวเล็ก/ตัวเลข 3–16 ตัว)', B.user.x, B.user.y - 9 * s, 9.5 * s, 'rgba(244,230,200,0.75)', 'left', 'normal');
  drawField(ctx, 'loginuser', B.user, w, s, g.user, { max: 16, placeholder: 'ชื่อผู้ใช้', autocomplete: 'username', onInput: (v) => { g.user = v; } });
  text(ctx, g.tab === 'register' ? 'รหัสผ่าน (อย่างน้อย 6 ตัว)' : 'รหัสผ่าน', B.pass.x, B.pass.y - 9 * s, 9.5 * s, 'rgba(244,230,200,0.75)', 'left', 'normal');
  drawField(ctx, 'loginpass', B.pass, w, s, g.pass, { max: 64, type: 'password', placeholder: 'รหัสผ่าน', autocomplete: g.tab === 'register' ? 'new-password' : 'current-password', onInput: (v) => { g.pass = v; } });
  panelButton(ctx, B.go, g.busy ? 'กำลังติดต่อเซิร์ฟเวอร์…' : g.tab === 'register' ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ', s, !g.busy && g.user && g.pass);
  if (g.busy && game.time - g.busyAt > 4) g.msg = 'เซิร์ฟเวอร์ฟรีกำลังตื่น (ครั้งแรกอาจรอถึง 1 นาที)…';
  ctx.font = `normal ${10 * s}px Kanit, sans-serif`;
  wrapLines(ctx, g.msg, B.w - 48 * s).slice(0, 2).forEach((l, i) => text(ctx, l, B.x + B.w / 2, B.go.y + B.go.h + 14 * s + i * 13 * s, 10 * s, g.col, 'center', 'normal'));
  const O = B.offline;
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; rrect(ctx, O.x, O.y, O.w, O.h, 7 * s); ctx.fill(); ctx.strokeStyle = 'rgba(184,154,88,0.6)'; ctx.lineWidth = 1; ctx.stroke();
  text(ctx, 'เล่นออฟไลน์ (ไม่เห็นคนอื่น เซฟในเครื่อง)', O.x + O.w / 2, O.y + O.h / 2, 10.5 * s, C.cream, 'center', 'normal');
}

export function updateLogin(game, L, w, h) {
  const B = loginLayout(w, h, L.s), g = game.login, inBox = (t, b) => t.sx >= b.x && t.sx <= b.x + b.w && t.sy >= b.y && t.sy <= b.y + b.h;
  if (g.done) { g.done = false; hideFields(); return 'ok'; }
  if (game.input.pressed.pause) { hideFields(); return 'back'; }
  for (const t of game.input.taps) {
    if (t.consumed) continue;
    t.consumed = true;
    if (Math.hypot(t.sx - B.close.x, t.sy - B.close.y) < B.close.r * 1.4) { hideFields(); return 'back'; }
    if (inBox(t, B.offline)) { hideFields(); return 'offline'; }
    const tb = B.tabs.find((q) => inBox(t, q));
    if (tb) { g.tab = tb.id; g.msg = ''; game.audio.play('click'); continue; }
    if (inBox(t, B.go) && !g.busy && g.user && g.pass) submit(game);
  }
  return null;
}

async function submit(game) {
  const g = game.login;
  g.busy = true; g.busyAt = game.time; g.msg = ''; game.audio.play('click');
  const r = await api(g.tab === 'register' ? '/api/register' : '/api/login', { user: g.user.trim(), pass: g.pass });
  g.busy = false;
  if (r.token) { session.set(r.token, r.user); g.pass = ''; g.done = true; }
  else { g.msg = r.msg || 'เข้าสู่ระบบไม่สำเร็จ'; g.col = '#ff8a7a'; }
}

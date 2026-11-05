// หน้าเลือกตัวละคร (แบบเอโดเรีย/PoE): การ์ดตัวละครของบัญชี (สูงสุด 4) รูปตัวละครตามอาชีพ ชื่อ เลเวล พื้นที่ล่าสุด
// แตะการ์ด = เลือก · ปุ่ม "เข้าเกม" · "สร้างตัวละครใหม่" · "ลบ" (แตะสองครั้งยืนยัน) · "ออกจากระบบ" · ✕ กลับหน้าแรก
// คืนจาก updateChars: { go: id } | 'create' | 'logout' | 'back' | null
import { C, kanokFrame, rrect } from '../art/draw.js';
import { uiText as text } from './hud.js';
import { drawHuman, LOOKS } from '../art/characters.js';
import { weaponInHand } from '../art/items.js';
import { CLASS_COL } from './create.js';
import { api, session } from '../net/online.js';
import { panelButton as button } from './login.js';

const MAX = 4;                                   // ตรงกับ server/accounts.js LIMITS.chars
export function charsLayout(w, h, s) {
  const pw = Math.min(w - 16, 760 * s), ph = Math.min(h - 12, 380 * s), x = w / 2 - pw / 2, y = h / 2 - ph / 2;
  const gap = 8 * s, cw = (pw - 32 * s - gap * (MAX - 1)) / MAX, ch = ph - 140 * s;
  const by = y + ph - 52 * s, bw = (pw - 32 * s - gap * 3) / 4;
  const btn = (i) => ({ x: x + 16 * s + i * (bw + gap), y: by, w: bw, h: 38 * s });
  return {
    x, y, w: pw, h: ph, s, cards: [...Array(MAX)].map((_, i) => ({ x: x + 16 * s + i * (cw + gap), y: y + 50 * s, w: cw, h: ch })),
    play: btn(0), create: btn(1), del: btn(2), logout: btn(3), close: { x: x + pw - 20 * s, y: y + 20 * s, r: 14 * s },
  };
}

export function openChars(game) {
  game.chars = { list: null, sel: null, msg: 'กำลังโหลดตัวละคร… (เซิร์ฟเวอร์ฟรีอาจต้องตื่นก่อน ~1 นาที)', col: C.cream, confirmDel: false, busy: true };
  game.mode = 'chars';
  refresh(game);
}

async function refresh(game) {
  const g = game.chars, r = await api('/api/chars');
  if (game.chars !== g) return;
  g.busy = false;
  if (r.err) { g.msg = r.msg; g.col = '#ff8a7a'; if (r.err === 'auth') g.list = []; return; }
  g.list = r.chars; g.msg = r.chars.length ? 'เลือกตัวละครแล้วกด "เข้าเกม"' : 'ยังไม่มีตัวละคร — กด "สร้างตัวละครใหม่"'; g.col = C.cream;
  if (!g.list.some((c) => c.id === g.sel)) g.sel = g.list[0] ? g.list[0].id : null;
}

export function drawChars(ctx, game, L, w, h) {
  const B = charsLayout(w, h, L.s), s = B.s, g = game.chars, D = game.data, P = D.passives, Z = D.zones, I = D.items;
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, w, h);
  kanokFrame(ctx, B.x, B.y, B.w, B.h, 12);
  ctx.fillStyle = 'rgba(16,10,8,0.94)'; rrect(ctx, B.x + 8 * s, B.y + 8 * s, B.w - 16 * s, B.h - 16 * s, 8 * s); ctx.fill();
  text(ctx, `เลือกตัวละคร — บัญชี ${session.user || ''}`, B.x + 22 * s, B.y + 26 * s, 15 * s, C.goldHi, 'left', '600');
  ctx.fillStyle = 'rgba(120,30,20,0.9)'; ctx.beginPath(); ctx.arc(B.close.x, B.close.y, B.close.r, 0, Math.PI * 2); ctx.fill();
  text(ctx, '✕', B.close.x, B.close.y + 1, 13 * s, '#fff', 'center');
  B.cards.forEach((c, i) => {
    const ch = g.list && g.list[i], on = ch && ch.id === g.sel;
    ctx.fillStyle = on ? 'rgba(217,166,48,0.22)' : 'rgba(0,0,0,0.35)'; rrect(ctx, c.x, c.y, c.w, c.h, 8 * s); ctx.fill();
    ctx.strokeStyle = on ? '#ffffff' : ch ? CLASS_COL[ch.cls] : 'rgba(184,154,88,0.35)'; ctx.lineWidth = on ? 2.5 : 1.2; ctx.stroke();
    if (!ch) { text(ctx, g.list ? 'ว่าง' : '…', c.x + c.w / 2, c.y + c.h / 2, 12 * s, 'rgba(244,230,200,0.35)', 'center', 'normal'); return; }
    const K = P.classes[ch.cls], k = Math.min(2.6, c.w / 48, (c.h - 70 * s) / 60);
    ctx.save(); ctx.translate(c.x + c.w / 2, c.y + c.h - 62 * s); ctx.scale(k, k);
    drawHuman(ctx, { ...LOOKS.hero, ...K.look }, 0, 0, { dir: 0, t: game.time + i, moving: false, swing: -1, weaponArt: weaponInHand(I, K.weapon), weapon: (I.bases[K.weapon].look || {}).kind || 'sword', blade: I.bases[K.weapon].color });
    ctx.restore();
    text(ctx, ch.name, c.x + c.w / 2, c.y + c.h - 44 * s, 13 * s, CLASS_COL[ch.cls], 'center', '600');
    text(ctx, `${K.name} · Lv.${ch.level}`, c.x + c.w / 2, c.y + c.h - 27 * s, 10 * s, C.cream, 'center', 'normal');
    text(ctx, (Z[ch.zone] && Z[ch.zone].name) || '', c.x + c.w / 2, c.y + c.h - 12 * s, 9 * s, 'rgba(244,230,200,0.6)', 'center', 'normal');
  });
  const has = !!(g.list && g.list.find((c) => c.id === g.sel)), full = g.list && g.list.length >= MAX;
  button(ctx, B.play, 'เข้าเกม', s, has && !g.busy);
  button(ctx, B.create, full ? 'ตัวละครเต็ม (4)' : 'สร้างตัวละครใหม่', s, !!g.list && !full && !g.busy, '#5a3a1a');
  button(ctx, B.del, g.confirmDel ? 'แตะอีกครั้งเพื่อลบถาวร' : 'ลบตัวละคร', s, has && !g.busy, g.confirmDel ? '#8a1a1a' : '#5a3a1a');
  button(ctx, B.logout, 'ออกจากระบบ', s, !g.busy, '#5a3a1a');
  text(ctx, g.msg, B.x + B.w / 2, B.play.y - 12 * s, 10 * s, g.col, 'center', 'normal');
}

export function updateChars(game, L, w, h) {
  const B = charsLayout(w, h, L.s), g = game.chars, inBox = (t, b) => t.sx >= b.x && t.sx <= b.x + b.w && t.sy >= b.y && t.sy <= b.y + b.h;
  if (game.input.pressed.pause) return 'back';
  for (const t of game.input.taps) {
    if (t.consumed) continue;
    t.consumed = true;
    if (Math.hypot(t.sx - B.close.x, t.sy - B.close.y) < B.close.r * 1.4) return 'back';
    if (g.busy) continue;
    const i = B.cards.findIndex((c) => inBox(t, c));
    if (i >= 0 && g.list && g.list[i]) { if (g.sel === g.list[i].id && !g.confirmDel) return { go: g.sel }; g.sel = g.list[i].id; g.confirmDel = false; game.audio.play('click'); continue; }
    if (inBox(t, B.play) && g.sel) return { go: g.sel };
    if (inBox(t, B.create) && g.list && g.list.length < MAX) return 'create';
    if (inBox(t, B.logout)) { session.clear(); return 'logout'; }
    if (inBox(t, B.del) && g.sel) {   // ลบ: แตะสองครั้ง
      if (!g.confirmDel) { g.confirmDel = true; game.audio.play('click'); continue; }
      g.confirmDel = false; g.busy = true; g.msg = 'กำลังลบ…';
      api('/api/char/delete', { id: g.sel }).then((r) => { if (r.err) { g.busy = false; g.msg = r.msg; g.col = '#ff8a7a'; } else { g.sel = null; refresh(game); } });
    }
  }
  if (game.input.pressed.interact && g.sel && !g.busy) return { go: g.sel };
  return null;
}

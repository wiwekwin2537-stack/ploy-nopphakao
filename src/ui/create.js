// หน้าสร้างตัวละคร (แบบ PoE): เลือกอาชีพ 1 จาก 3 + ตั้งชื่อ → เข้าบทนำ
// อาชีพ = อาวุธเริ่มต้น + จุดเริ่มบนต้นพาสซีฟ + พลอยสกิลเม็ดแรก (data/passives.json "classes")
import { C, kanokFrame, rrect } from '../art/draw.js';
import { uiText as text, wrapLines } from './hud.js';
import { drawHuman, LOOKS } from '../art/characters.js';
import { weaponInHand } from '../art/items.js';
import { gemSprite } from '../art/gems.js';

export const CLASS_IDS = ['warrior', 'ranger', 'shaman'];
const CLASS_COL = { warrior: '#e0604a', ranger: '#6ad070', shaman: '#a080f0' };
const NAMES = ['ขุนแผน', 'พลายงาม', 'ไกรทอง', 'สุดสาคร', 'แก้วหน้าม้า', 'ศรีธนญชัย', 'นางสิบสอง', 'พระรถ', 'ทองประกาย', 'บุญชู'];

export function createLayout(w, h, s) {
  const pw = Math.min(w - 16, 760 * s), ph = Math.min(h - 12, 370 * s), x = w / 2 - pw / 2, y = h / 2 - ph / 2;
  const cw = (pw - 48 * s) / 3, cards = CLASS_IDS.map((id, i) => ({ id, x: x + 16 * s + i * (cw + 8 * s), y: y + 46 * s, w: cw, h: ph - 104 * s }));
  return { x, y, w: pw, h: ph, s, cards, name: { x: x + 16 * s, y: y + ph - 48 * s, w: pw * 0.42, h: 34 * s }, dice: { x: x + 22 * s + pw * 0.42, y: y + ph - 48 * s, w: 34 * s, h: 34 * s }, go: { x: x + pw - 196 * s, y: y + ph - 50 * s, w: 180 * s, h: 38 * s }, back: { x: x + pw - 20 * s, y: y + 20 * s, r: 14 * s } };
}

export function openCreate(game, skip) {
  game.create = { cls: 'warrior', name: game.rng.pick(NAMES), skip: !!skip };
  game.mode = 'create';
}

// ช่องพิมพ์ชื่อ: ใช้ช่อง input จริงของเบราว์เซอร์ (มือถือขึ้นแป้นพิมพ์ภาษาไทยได้) วางทับตำแหน่งช่องชื่อ
let input = null;
function nameInput(game) {
  if (input || typeof document === 'undefined') return input;
  input = document.createElement('input');
  Object.assign(input, { maxLength: 16, placeholder: 'ชื่อตัวละคร' });
  Object.assign(input.style, { position: 'fixed', zIndex: 5, background: 'rgba(20,14,10,0.95)', color: '#f4e6c8', border: '1.5px solid #d9a630', borderRadius: '6px', padding: '0 10px', boxSizing: 'border-box', font: '16px Kanit, sans-serif', outline: 'none', display: 'none' });
  input.addEventListener('input', () => { if (game.create) game.create.name = input.value.slice(0, 16); });
  document.body.appendChild(input);
  return input;
}
export function hideNameInput() { if (input) { input.style.display = 'none'; input.blur(); } }

export function drawCreate(ctx, game, L, w, h) {
  const B = createLayout(w, h, L.s), s = B.s, P = game.data.passives, G = game.data.gems, I = game.data.items, cr = game.create;
  const sky = ctx.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#1a1030'); sky.addColorStop(1, '#3a1a14');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
  kanokFrame(ctx, B.x, B.y, B.w, B.h, 12);
  ctx.fillStyle = 'rgba(16,10,8,0.85)'; rrect(ctx, B.x + 8 * s, B.y + 8 * s, B.w - 16 * s, B.h - 16 * s, 8 * s); ctx.fill();
  text(ctx, 'สร้างตัวละคร — เลือกอาชีพ', B.x + 20 * s, B.y + 24 * s, 16 * s, C.goldHi, 'left', '600');
  ctx.fillStyle = 'rgba(120,30,20,0.9)'; ctx.beginPath(); ctx.arc(B.back.x, B.back.y, B.back.r, 0, Math.PI * 2); ctx.fill();
  text(ctx, '✕', B.back.x, B.back.y + 1, 13 * s, '#fff', 'center');
  for (const c of B.cards) {
    const K = P.classes[c.id], on = cr.cls === c.id, col = CLASS_COL[c.id];
    ctx.fillStyle = on ? 'rgba(217,166,48,0.22)' : 'rgba(0,0,0,0.35)'; rrect(ctx, c.x, c.y, c.w, c.h, 8 * s); ctx.fill();
    ctx.strokeStyle = on ? '#ffffff' : col; ctx.lineWidth = on ? 2.5 : 1.2; ctx.stroke();
    // ตัวละครใส่ชุด/ถืออาวุธของอาชีพ (ท่าฟันวนเมื่อเลือก)
    const k = Math.min(2.8, c.h / 105), cx = c.x + c.w / 2, cy = c.y + 22 * s + 52 * k;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(cx, cy, 20 * k, 5 * k, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k);
    const sw = (game.time * 1.1 + (on ? 0 : 0.8)) % (on ? 1.6 : 3.2);   // ทุกตัวโชว์ท่าฟัน (ตัวที่เลือกฟันถี่กว่า) ให้เห็นอาวุธ
    drawHuman(ctx, { ...LOOKS.hero, ...K.look }, 0, 0, { dir: 0, t: game.time, moving: false, swing: sw <= 1 ? sw : -1, combo: 0, aim: 0.6, weaponArt: weaponInHand(I, K.weapon), weapon: (I.bases[K.weapon].look || {}).kind || 'sword', blade: I.bases[K.weapon].color });
    ctx.restore();
    let y = cy + 16 * s;
    text(ctx, K.name, cx, y, 14 * s, col, 'center', '600'); y += 16 * s;
    text(ctx, K.desc, cx, y, 9.5 * s, C.cream, 'center', 'normal'); y += 14 * s;
    const g = G.main[K.gem];
    ctx.drawImage(gemSprite(G, K.gem, 32), c.x + 10 * s, y - 8 * s, 16 * s, 16 * s);
    text(ctx, `${I.bases[K.weapon].name} · ${g.skill}`, c.x + 30 * s, y, 9 * s, g.hi || g.color, 'left', '600'); y += 14 * s;
    ctx.font = `normal ${8.5 * s}px Kanit, sans-serif`;
    wrapLines(ctx, K.story, c.w - 18 * s).slice(0, 3).forEach((l, i) => text(ctx, l, c.x + 9 * s, y + i * 12 * s, 8.5 * s, 'rgba(244,230,200,0.7)', 'left', 'normal'));
  }
  // ช่องชื่อ + สุ่มชื่อ + ปุ่มเริ่ม
  const N = B.name, el = nameInput(game);
  text(ctx, 'ชื่อ:', N.x, N.y - 8 * s, 9.5 * s, 'rgba(244,230,200,0.7)', 'left', 'normal');
  if (el) {
    const r = ctx.canvas.getBoundingClientRect(), k = r.width / w;
    Object.assign(el.style, { display: 'block', left: r.left + N.x * k + 'px', top: r.top + N.y * k + 'px', width: N.w * k + 'px', height: N.h * k + 'px' });
    if (document.activeElement !== el && el.value !== cr.name) el.value = cr.name;
  } else { ctx.fillStyle = 'rgba(20,14,10,0.95)'; rrect(ctx, N.x, N.y, N.w, N.h, 6 * s); ctx.fill(); text(ctx, cr.name, N.x + 10 * s, N.y + N.h / 2, 13 * s, C.cream, 'left', 'normal'); }
  const D = B.dice;
  ctx.fillStyle = 'rgba(60,40,20,0.9)'; rrect(ctx, D.x, D.y, D.w, D.h, 6 * s); ctx.fill(); ctx.strokeStyle = C.gold; ctx.lineWidth = 1.2; ctx.stroke();
  text(ctx, 'สุ่ม', D.x + D.w / 2, D.y + D.h / 2, 10 * s, C.goldHi, 'center', '600');
  const ok = cr.name.trim().length > 0, Gb = B.go;
  ctx.fillStyle = ok ? '#a3262a' : 'rgba(60,60,60,0.6)'; rrect(ctx, Gb.x, Gb.y, Gb.w, Gb.h, 8 * s); ctx.fill();
  ctx.strokeStyle = C.goldHi; ctx.lineWidth = 1.5; ctx.stroke();
  text(ctx, cr.skip ? 'เริ่ม (ข้ามบทนำ)' : 'เริ่มผจญภัย', Gb.x + Gb.w / 2, Gb.y + Gb.h / 2, 13 * s, '#fff', 'center', '600');
}

// คืน 'start' | 'back' | null
export function updateCreate(game, L, w, h) {
  const B = createLayout(w, h, L.s), cr = game.create;
  const inBox = (t, b) => t.sx >= b.x && t.sx <= b.x + b.w && t.sy >= b.y && t.sy <= b.y + b.h;
  for (const t of game.input.taps) {
    if (t.consumed) continue;
    t.consumed = true;
    if (Math.hypot(t.sx - B.back.x, t.sy - B.back.y) < B.back.r * 1.4) { hideNameInput(); return 'back'; }
    const c = B.cards.find((q) => inBox(t, q));
    if (c) { if (cr.cls !== c.id) game.audio.play('click'); cr.cls = c.id; continue; }
    if (inBox(t, B.dice)) { cr.name = game.rng.pick(NAMES); if (input) input.value = cr.name; game.audio.play('click'); continue; }
    if (inBox(t, B.go) && cr.name.trim()) { hideNameInput(); return 'start'; }
  }
  if (game.input.pressed.pause) { hideNameInput(); return 'back'; }
  return null;
}

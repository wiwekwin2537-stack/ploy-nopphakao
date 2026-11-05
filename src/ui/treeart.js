// ภาพต้นพาสซีฟแบบ PoE: พื้นหลังดาว+มณฑลกนก · เส้นทางทองเรือง · โหนดกรอบทองมีไอคอนตามค่า · จุดเริ่มเป็นเหรียญรูปตัวละครอาชีพ
// วาดโหนดเป็นภาพพักไว้ (แคชตามชนิด/สถานะ/ขนาด) ไม่วาดใหม่ทุกเฟรม
import { hash2 } from '../art/draw.js';
import { drawHuman, LOOKS } from '../art/characters.js';
import { weaponInHand } from '../art/items.js';

const GOLD = '#f3d27a', GOLD_D = '#9a6f1e', BRONZE = '#6a5030', BRONZE_D = '#3a2a1a';

// ---------- ไอคอนตามค่าหลักของโหนด ----------
const ICON_OF = {
  dmgMelee: 'sword', dmgFlat: 'sword', atkSpeedInc: 'bolt', dmgSpell: 'flame', castSpeedInc: 'flame',
  hpFlat: 'heart', hpInc: 'heart', lifeOnHit: 'heart', killHeal: 'heart', mpFlat: 'drop', mpInc: 'drop', mpRegenInc: 'drop', killMana: 'drop',
  moveInc: 'wing', dashCdInc: 'wing', crit: 'star', critMult: 'star', dmgAll: 'burst', areaInc: 'burst', projSpeedInc: 'arrow',
};
const KS_ICON = { elephant: 'sword', shadow: 'moon', blood: 'drop' };
export function iconFor(n) {
  if (n.stats.ks) return KS_ICON[n.stats.ks] || 'star';
  const k = Object.keys(n.stats)[0];
  return ICON_OF[k] || 'star';
}

function statIcon(g, kind, r, col) {                     // วาดรอบจุด (0,0) รัศมีประมาณ r
  g.fillStyle = col; g.strokeStyle = col; g.lineWidth = r * 0.16; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath();
  if (kind === 'sword') { g.moveTo(-r * 0.6, r * 0.6); g.lineTo(r * 0.55, -r * 0.55); g.stroke(); g.beginPath(); g.moveTo(-r * 0.55, r * 0.15); g.lineTo(-r * 0.15, r * 0.55); g.stroke(); g.beginPath(); g.moveTo(r * 0.55, -r * 0.55); g.lineTo(r * 0.3, -r * 0.6); g.lineTo(r * 0.6, -r * 0.3); g.closePath(); g.fill(); }
  else if (kind === 'flame') { g.moveTo(0, -r * 0.75); g.quadraticCurveTo(r * 0.7, -r * 0.1, r * 0.35, r * 0.55); g.quadraticCurveTo(0, r * 0.75, -r * 0.35, r * 0.55); g.quadraticCurveTo(-r * 0.7, -r * 0.1, 0, -r * 0.75); g.fill(); }
  else if (kind === 'heart') { g.moveTo(0, r * 0.65); g.bezierCurveTo(-r * 0.9, 0, -r * 0.5, -r * 0.75, 0, -r * 0.3); g.bezierCurveTo(r * 0.5, -r * 0.75, r * 0.9, 0, 0, r * 0.65); g.fill(); }
  else if (kind === 'drop') { g.moveTo(0, -r * 0.75); g.quadraticCurveTo(r * 0.6, 0, r * 0.45, r * 0.3); g.arc(0, r * 0.3, r * 0.45, 0, Math.PI); g.quadraticCurveTo(-r * 0.6, 0, 0, -r * 0.75); g.fill(); }
  else if (kind === 'wing') { for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-r * 0.6, r * 0.4 - i * r * 0.35); g.quadraticCurveTo(0, -r * 0.2 - i * r * 0.35, r * 0.65, -r * 0.1 - i * r * 0.25); g.stroke(); } }
  else if (kind === 'star') { for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? r * 0.32 : r * 0.75; i ? g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill(); }
  else if (kind === 'bolt') { g.moveTo(r * 0.15, -r * 0.75); g.lineTo(-r * 0.4, r * 0.1); g.lineTo(0, r * 0.1); g.lineTo(-r * 0.15, r * 0.75); g.lineTo(r * 0.4, -r * 0.1); g.lineTo(0, -r * 0.1); g.closePath(); g.fill(); }
  else if (kind === 'burst') { for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; g.moveTo(Math.cos(a) * r * 0.25, Math.sin(a) * r * 0.25); g.lineTo(Math.cos(a) * r * 0.75, Math.sin(a) * r * 0.75); } g.stroke(); g.beginPath(); g.arc(0, 0, r * 0.22, 0, 7); g.fill(); }
  else if (kind === 'arrow') { g.moveTo(-r * 0.6, r * 0.6); g.lineTo(r * 0.5, -r * 0.5); g.stroke(); g.beginPath(); g.moveTo(r * 0.65, -r * 0.65); g.lineTo(r * 0.15, -r * 0.5); g.lineTo(r * 0.5, -r * 0.15); g.closePath(); g.fill(); }
  else if (kind === 'moon') { g.arc(0, 0, r * 0.65, 0.6, Math.PI * 2 - 0.6); g.arc(r * 0.3, 0, r * 0.5, Math.PI * 2 - 1.1, 1.1, true); g.closePath(); g.fill(); }
}

// ---------- กรอบโหนด ----------
function petals(g, n, r0, r1, w, fill, stroke) {    // กลีบกนกรอบวง
  for (let i = 0; i < n; i++) {
    const a = i * Math.PI * 2 / n;
    g.save(); g.rotate(a); g.beginPath(); g.moveTo(-w, -r0); g.quadraticCurveTo(0, -r1 - w, w, -r0); g.closePath();
    g.fillStyle = fill; g.fill(); g.strokeStyle = stroke; g.lineWidth = 1; g.stroke(); g.restore();
  }
}
function disk(g, r, inner, rim, lw) {
  const gr = g.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
  gr.addColorStop(0, inner[0]); gr.addColorStop(1, inner[1]);
  g.beginPath(); g.arc(0, 0, r, 0, 7); g.fillStyle = gr; g.fill(); g.strokeStyle = rim; g.lineWidth = lw; g.stroke();
}

const cache = new Map();
const portraits = new Map();
function portrait(data, cls) {                       // รูปตัวละครประจำอาชีพในเหรียญจุดเริ่ม
  let c = portraits.get(cls);
  if (c) return c;
  const K = data.passives.classes[cls], I = data.items;
  c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'); g.translate(64, 146); g.scale(2.9, 2.9);   // ครึ่งตัวบน (หน้า+อก) เต็มเหรียญ
  drawHuman(g, { ...LOOKS.hero, ...K.look }, 0, 0, { dir: 0, t: 0, moving: false, swing: -1, combo: 0, aim: 0.6, weaponArt: weaponInHand(I, K.weapon), weapon: (I.bases[K.weapon].look || {}).kind || 'sword', blade: I.bases[K.weapon].color });
  portraits.set(cls, c);
  return c;
}

// state: 'own' (ลงแล้ว) · 'can' (ลงได้) · 'none' · col = สีประจำอาชีพ/สาย
function nodeSprite(data, n, state, col, R) {
  const px = Math.max(8, Math.round(R)), key = `${n.kind}|${n.kind === 'start' ? n.class : iconFor(n)}|${state}|${col}|${px}`;
  let c = cache.get(key);
  if (c) return c;
  if (cache.size > 400) cache.clear();
  const S = px * 3; c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'); g.translate(S / 2, S / 2);
  const own = state === 'own', lit = own || state === 'can', r = px;
  const rim = own ? GOLD : lit ? '#c8a050' : BRONZE, ic = own ? '#fff6d8' : lit ? '#e8d8b0' : 'rgba(200,180,140,0.45)';
  const inner = own ? [col, '#1a1008'] : ['#2a2018', '#0c0806'];
  if (n.kind === 'start') {
    petals(g, 16, r * 0.98, r * 1.28, r * 0.16, own ? GOLD_D : BRONZE_D, own ? GOLD : BRONZE);
    disk(g, r, [col, '#120a06'], own ? GOLD : col, r * 0.14);
    g.save(); g.beginPath(); g.arc(0, 0, r * 0.84, 0, 7); g.clip();
    const pt = portrait(data, n.class); g.globalAlpha = own ? 1 : 0.75; g.drawImage(pt, -r * 0.95, -r * 1.05, r * 1.9, r * 1.9); g.restore();
    g.beginPath(); g.arc(0, 0, r * 0.86, 0, 7); g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = r * 0.06; g.stroke();
  } else if (n.kind === 'keystone') {
    petals(g, 8, r * 0.9, r * 1.35, r * 0.28, own ? GOLD_D : BRONZE_D, rim);
    g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + Math.PI / 8; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath();
    const gr = g.createRadialGradient(0, 0, r * 0.1, 0, 0, r); gr.addColorStop(0, inner[0]); gr.addColorStop(1, inner[1]);
    g.fillStyle = gr; g.fill(); g.strokeStyle = rim; g.lineWidth = r * 0.14; g.stroke();
    statIcon(g, iconFor(n), r * 0.62, ic);
  } else if (n.kind === 'notable') {
    petals(g, 12, r * 0.95, r * 1.22, r * 0.17, own ? GOLD_D : BRONZE_D, rim);
    disk(g, r, inner, rim, r * 0.16);
    g.beginPath(); g.arc(0, 0, r * 0.78, 0, 7); g.strokeStyle = own ? 'rgba(255,240,200,0.5)' : 'rgba(150,120,80,0.35)'; g.lineWidth = 1; g.stroke();
    statIcon(g, iconFor(n), r * 0.58, ic);
  } else {
    disk(g, r, inner, rim, Math.max(1.5, r * 0.2));
    statIcon(g, iconFor(n), r * 0.6, ic);
  }
  cache.set(key, c);
  return c;
}

// รูปโหนดอย่างเดียว (ใช้ในกล่องรายละเอียด)
export function nodeImage(ctx, data, n, x, y, r, state, col) {
  const k = ctx.getTransform().a || 1, S = r * 3;
  ctx.drawImage(nodeSprite(data, n, state, col, r * k), x - S / 2, y - S / 2, S, S);
}

export function drawNode(ctx, data, n, x, y, r, state, col, t) {
  if (state === 'own') {                                              // แสงเรืองรอบโหนดที่ลงแล้ว
    const gl = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 2.3); gl.addColorStop(0, col + '88'); gl.addColorStop(1, col + '00');
    ctx.fillStyle = gl; ctx.fillRect(x - r * 2.3, y - r * 2.3, r * 4.6, r * 4.6);
  }
  const k = ctx.getTransform().a || 1, spr = nodeSprite(data, n, state, col, r * k), S = r * 3;
  ctx.drawImage(spr, x - S / 2, y - S / 2, S, S);
  if (state === 'can') { ctx.beginPath(); ctx.arc(x, y, r * (1.18 + Math.sin(t * 4) * 0.06), 0, 7); ctx.strokeStyle = `rgba(255,226,140,${0.5 + Math.sin(t * 4) * 0.3})`; ctx.lineWidth = 2; ctx.stroke(); }
}

// ---------- เส้นทาง ----------
export function drawLink(ctx, x1, y1, x2, y2, state, s, t) {
  ctx.lineCap = 'round';
  if (state === 'own') {
    ctx.strokeStyle = 'rgba(255,200,90,0.25)'; ctx.lineWidth = 10 * s; line(ctx, x1, y1, x2, y2);
    ctx.strokeStyle = GOLD_D; ctx.lineWidth = 5 * s; line(ctx, x1, y1, x2, y2);
    ctx.strokeStyle = '#ffe9a8'; ctx.lineWidth = 2 * s; line(ctx, x1, y1, x2, y2);
    const k = (t * 0.6 + hash2(Math.round(x1), Math.round(y1), 3)) % 1;     // ประกายวิ่งตามเส้น
    ctx.fillStyle = 'rgba(255,250,220,0.9)'; ctx.beginPath(); ctx.arc(x1 + (x2 - x1) * k, y1 + (y2 - y1) * k, 2.2 * s, 0, 7); ctx.fill();
  } else if (state === 'can') {
    ctx.strokeStyle = BRONZE_D; ctx.lineWidth = 5 * s; line(ctx, x1, y1, x2, y2);
    ctx.strokeStyle = `rgba(243,210,122,${0.45 + Math.sin(t * 4) * 0.2})`; ctx.lineWidth = 2.2 * s; line(ctx, x1, y1, x2, y2);
  } else {
    ctx.strokeStyle = 'rgba(20,14,10,0.9)'; ctx.lineWidth = 5 * s; line(ctx, x1, y1, x2, y2);
    ctx.strokeStyle = 'rgba(110,85,55,0.55)'; ctx.lineWidth = 2 * s; line(ctx, x1, y1, x2, y2);
  }
}
function line(ctx, x1, y1, x2, y2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }

// ---------- พื้นหลัง ----------
let bg = null;
function starfield(w, h) {                                             // ท้องฟ้าดาวคราม-ม่วง (วาดครั้งเดียวต่อขนาดจอ)
  if (bg && bg.w === w && bg.h === h) return bg.c;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, Math.max(w, h) * 0.75);
  gr.addColorStop(0, '#241a2e'); gr.addColorStop(0.55, '#140e1a'); gr.addColorStop(1, '#07050a');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 3; i++) {                                      // หมอกเนบิวลา
    const x = hash2(i, 1, 9) * w, y = hash2(i, 2, 9) * h, r = (0.25 + hash2(i, 3, 9) * 0.3) * Math.max(w, h);
    const n = g.createRadialGradient(x, y, 1, x, y, r); n.addColorStop(0, ['rgba(120,60,140,0.18)', 'rgba(40,80,150,0.15)', 'rgba(150,90,40,0.12)'][i]); n.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = n; g.fillRect(0, 0, w, h);
  }
  for (let i = 0; i < Math.round(w * h / 2500); i++) {
    const a = hash2(i, 7, 1);
    g.fillStyle = `rgba(255,${230 + a * 25 | 0},${200 + a * 55 | 0},${0.15 + a * 0.6})`;
    g.fillRect(hash2(i, 5, 1) * w, hash2(i, 6, 1) * h, a > 0.92 ? 2 : 1, a > 0.92 ? 2 : 1);
  }
  bg = { w, h, c };
  return c;
}

// มณฑลกนกที่ใจกลางต้น + แสงสีประจำอาชีพรอบจุดเริ่มแต่ละสาย (เลื่อน/ซูมตามต้น)
export function drawTreeBackground(ctx, data, w, h, sx, sy, z, s, t) {
  ctx.drawImage(starfield(w, h), 0, 0, w, h);
  const P = data.passives, cx = sx(0), cy = sy(0);
  for (const n of Object.values(P.nodes)) {
    if (n.kind !== 'start') continue;
    const x = sx(n.x), y = sy(n.y), r = 260 * z * s, col = CLASS_GLOW[n.class] || 'rgba(217,166,48,0.12)';
    const gl = ctx.createRadialGradient(x, y, 1, x, y, r); gl.addColorStop(0, col); gl.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gl; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 0.01);
  for (const [R, n, a] of [[130, 24, 0.12], [300, 36, 0.08], [470, 48, 0.06], [650, 64, 0.05]]) {
    const rr = R * z * s;
    ctx.strokeStyle = `rgba(217,166,48,${a})`; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(0, 0, rr, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, rr - 6 * z * s, 0, 7); ctx.stroke();
    ctx.fillStyle = `rgba(217,166,48,${a * 0.9})`;
    for (let i = 0; i < n; i++) {                                    // ลายกลีบกนกตามวง
      const ang = i * Math.PI * 2 / n; ctx.save(); ctx.rotate(ang);
      ctx.beginPath(); ctx.moveTo(-4 * z * s, -rr); ctx.quadraticCurveTo(0, -rr - 10 * z * s, 4 * z * s, -rr); ctx.closePath(); ctx.fill(); ctx.restore();
    }
  }
  ctx.restore();
}
const CLASS_GLOW = { warrior: 'rgba(216,68,58,0.16)', duelist: 'rgba(232,176,64,0.14)', ranger: 'rgba(74,184,90,0.15)', shadow: 'rgba(96,184,200,0.14)', shaman: 'rgba(120,110,240,0.16)', templar: 'rgba(240,138,48,0.14)' };

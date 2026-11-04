// ตัวละครคนแบบบล็อก (สัดส่วนเดียวกับเอโดเรีย): ไม่มีเส้นขอบ หัวสี่เหลี่ยมใหญ่ ผมเป็นหนาม วาดด้วยสี่เหลี่ยมล้วน
import { C } from './draw.js';

export const LOOKS = {
  hero: { skin: '#f1d2b0', top: '#2c4a73', collar: '#3d6296', leg: '#2a2230', leg2: '#3a3040', hair: '#14141a', hat: 'band', sash: 'check', weapon: 'sword' },
  elder: { skin: '#e2b894', top: '#ece4d0', collar: '#d9cdb2', leg: '#7a5a3a', leg2: '#8a6a4a', hair: '#f2f0ea', hat: 'elder', sash: '#c9822b', weapon: 'cane' },
  granny: { skin: '#e0b08a', top: '#7a4a7a', collar: '#94609a', leg: '#5a3a2a', leg2: '#6a4a3a', hair: '#c8c2b8', hat: 'bun', sash: '#c9a35a', weapon: null },
  guard: { skin: '#f1d2b0', top: '#a3262a', collar: '#c9433a', leg: '#2e2a26', leg2: '#3e3a36', hair: '#14141a', hat: 'helmet', sash: C.gold, weapon: 'spear' },
};

export function dirFromAngle(a) {
  const c = Math.cos(a), s = Math.sin(a);
  if (Math.abs(c) > Math.abs(s)) return c > 0 ? 3 : 2;
  return s > 0 ? 0 : 1;
}

function sword(ctx, x, y, ang) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  ctx.fillStyle = '#5a2f1a'; ctx.fillRect(-6, -1.5, 6, 3);        // ด้าม
  ctx.fillStyle = C.gold; ctx.fillRect(-1, -4, 3, 8);              // กระบัง
  ctx.fillStyle = '#d8e0e4'; ctx.fillRect(2, -2, 17, 4);           // ใบดาบ
  ctx.fillStyle = '#ffffff'; ctx.fillRect(2, -2, 17, 1.5);
  ctx.fillStyle = '#b8c2c8'; ctx.fillRect(19, -1.5, 3, 3);         // ปลายดาบ
  ctx.restore();
}

export function drawHuman(ctx, look, X, Y, o) {
  const L = typeof look === 'string' ? LOOKS[look] : look;
  const d = o.dir ?? 0, side = d === 2 || d === 3, f = d === 2 ? -1 : 1;
  const s = o.moving ? Math.sin(o.walk * Math.PI * 2) : 0;
  const bob = o.moving ? Math.abs(Math.cos(o.walk * Math.PI * 2)) * 1.5 : (Math.sin(o.t * 2.4) * 0.5 + 0.5) * 1.2;
  const x = Math.round(X), y = Math.round(Y), by = Math.round(y - bob);
  const R = (c, a, b, w, h) => { ctx.fillStyle = c; ctx.fillRect(Math.round(a), Math.round(b), w, h); };
  ctx.save();
  if (o.dash) ctx.globalAlpha = 0.85;
  if (o.hurt > 0 && Math.floor(o.t * 28) % 2) ctx.globalAlpha = 0.4;
  ctx.fillStyle = 'rgba(0,0,0,0.27)'; ctx.beginPath(); ctx.ellipse(x, y + 1, 11, 4, 0, 0, 7); ctx.fill();
  const swinging = o.swing >= 0;
  const weapon = () => {
    if (L.weapon === 'sword') {
      if (swinging) sword(ctx, x + Math.cos(o.aim) * 4, by - 20 + Math.sin(o.aim) * 4, o.aim - 1.25 + o.swing * 2.5);
      else if (d === 1) sword(ctx, x + 8, by - 30, -2.4);                // สะพายหลัง
      else sword(ctx, x + (side ? f * 7 : 10), by - 14 + s * 2, side ? (f > 0 ? 0.9 : Math.PI - 0.9) : 1.1);
    } else if (L.weapon === 'spear') {
      R(C.teak, x + 10, by - 44, 2, 44); R('#d8e0e4', x + 9, by - 50, 4, 7); R(C.red, x + 9, by - 43, 4, 2);
    } else if (L.weapon === 'cane') {
      R(C.teakDark, x + 9, by - 22, 2, 22); R(C.teakDark, x + 6, by - 24, 5, 2);
    }
  };
  if (d === 1 || (side && f < 0)) weapon();
  if (side) {
    // ขาแกว่งหน้า-หลัง
    ctx.save(); ctx.translate(x - 3, by - 12); ctx.rotate(s * 0.5); R(L.leg2, 0, 0, 6, 12); R('#1a1418', 0, 10, 7, 2); ctx.restore();
    ctx.save(); ctx.translate(x - 3, by - 12); ctx.rotate(-s * 0.5); R(L.leg, 0, 0, 6, 12); R('#1a1418', 0, 10, 7, 2); ctx.restore();
    R(L.top, x - 4.5, by - 26, 9, 14); R(L.collar, x - 5, by - 28, 10, 4);
  } else {
    const l1 = Math.max(0, s) * 3.5, l2 = Math.max(0, -s) * 3.5;
    R(L.leg, x - 7, by - 12 - l1, 6, 12); R(L.leg, x + 1, by - 12 - l2, 6, 12);
    R('#1a1418', x - 7, by - 2 - l1, 6, 2); R('#1a1418', x + 1, by - 2 - l2, 6, 2);
    R(L.top, x - 8, by - 26, 16, 14); R(L.collar, x - 8, by - 28, 16, 4);
    R('rgba(0,0,0,0.12)', x + 4, by - 26, 4, 14);                    // เงาข้างลำตัว
  }
  // ผ้าคาดเอว
  const sw = side ? 9 : 16, sx = side ? x - 4.5 : x - 8;
  if (L.sash === 'check') for (let i = 0; i < sw; i += 2) R(i % 4 ? '#f1e3c4' : '#d84a3a', sx + i, by - 15, 2, 3);
  else R(L.sash, sx, by - 15, sw, 3);
  if (L.hat === 'elder' || L.hat === 'bun') { ctx.fillStyle = L.sash; ctx.fillRect(side ? x - 4.5 : x - 8, by - 27, side ? 9 : 5, 3); ctx.fillRect(side ? x - 2 : x - 4, by - 24, side ? 4 : 4, 9); }
  // แขน
  const cast = o.cast ? -6 : 0;
  if (side) {
    ctx.save(); ctx.translate(x, by - 26); ctx.rotate(-s * 0.55 * f + (o.cast ? -f * 1.2 : 0)); R(L.top, -3, 0, 6, 7); R(L.top, -3, 6, 6, 6); R(L.skin, -3, 10, 6, 4); ctx.restore();
  } else if (!swinging || d === 1) {
    R(L.top, x - 11, by - 26 + s * 3 + cast, 4, 12); R(L.skin, x - 11, by - 15 + s * 3 + cast, 4, 4);
    R(L.top, x + 7, by - 26 - s * 3 + cast, 4, 12); R(L.skin, x + 7, by - 15 - s * 3 + cast, 4, 4);
  } else {
    R(L.top, x - 11, by - 26, 4, 12); R(L.skin, x - 11, by - 15, 4, 4);
  }
  // หัว
  R(L.skin, x - 6, by - 40, 12, 12);
  R('rgba(0,0,0,0.1)', x - 6, by - 30, 12, 2);
  const hair = L.hair;
  if (L.hat !== 'helmet') {
    if (d === 1) R(hair, x - 7, by - 43, 14, 15);
    else if (side) { R(hair, x - 7, by - 43, 14, 6); R(hair, x - 7 + (f < 0 ? 6 : 0), by - 43, 8, 11); }
    else R(hair, x - 7, by - 43, 14, 6);
  }
  if (L.hat === 'band' || L.hat === 'helmet') {                        // ผมหนามแบบเอโดเรีย
    if (L.hat === 'band') { R(hair, x - 7, by - 47, 4, 5); R(hair, x - 2, by - 48, 4, 6); R(hair, x + 3, by - 47, 4, 5); }
  }
  if (L.hat === 'band') {                                               // ผ้าคาดหัวแดง
    R('#c8302a', x - 7, by - 42, 14, 3);
    if (d !== 0) { const t = Math.sin(o.t * 9) * 1.5; R('#c8302a', x + (side ? -f * 9 : 5), by - 41 + t * 0.4, 5, 2); R('#a8201a', x + (side ? -f * 12 : 8), by - 40 + t, 4, 2); }
  } else if (L.hat === 'elder') {
    if (d !== 1) { R(hair, x - 5, by - 31, 10, 4); R(hair, x - 3, by - 28, 6, 4); }  // เคราขาว
  } else if (L.hat === 'bun') {
    R(hair, x - 4 + (side ? -f * 3 : 0), by - 49, 8, 6); R(C.gold, x - 1, by - 51, 2, 3);
  } else if (L.hat === 'helmet') {                                     // หมวกทรงลอมพอกทอง
    R(C.gold, x - 8, by - 44, 16, 5); R('#e8c050', x - 6, by - 49, 12, 5); R(C.gold, x - 4, by - 53, 8, 4); R('#e8c050', x - 2, by - 57, 4, 4); R(C.red, x - 1, by - 60, 2, 3);
    R('#b88a20', x - 8, by - 40, 16, 1);
  }
  // ตา
  if (d === 0) { R('#111', x - 3, by - 36, 2, 3); R('#111', x + 1, by - 36, 2, 3); }
  else if (side) R('#111', x + 3 * f - 1, by - 36, 2, 3);
  if (!(d === 1 || (side && f < 0))) weapon();
  ctx.restore();
}

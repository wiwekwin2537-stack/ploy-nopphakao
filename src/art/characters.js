// ตัวละครคนแบบบล็อก (สัดส่วนเอโดเรีย) + โครงข้อต่อ: สะโพก-เข่า ไหล่-ศอก ขยับเป็นธรรมชาติ
// ท่า: ยืนหายใจ/กะพริบตา · เดินวิ่ง (เอนตัว ขางอเข่า แขนแกว่งสวน) · ฟันคอมโบ 3 จังหวะ (ง้าง-ฟัน-เก็บ) · หลบ · ร่ายคาถา · โดนตี
import { C } from './draw.js';

export const LOOKS = {
  hero: { skin: '#f1d2b0', top: '#2c4a73', collar: '#3d6296', leg: '#2a2230', leg2: '#3a3040', hair: '#14141a', hat: 'band', sash: 'check', weapon: 'sword' },
  elder: { skin: '#e2b894', top: '#ece4d0', collar: '#d9cdb2', leg: '#7a5a3a', leg2: '#8a6a4a', hair: '#f2f0ea', hat: 'elder', sash: '#c9822b', weapon: 'cane' },
  granny: { skin: '#e0b08a', top: '#7a4a7a', collar: '#94609a', leg: '#5a3a2a', leg2: '#6a4a3a', hair: '#c8c2b8', hat: 'bun', sash: '#c9a35a', weapon: null },
  merchant: { skin: '#d9a273', top: '#c9433a', collar: '#e8c050', leg: '#2c4a73', leg2: '#3a5a86', hair: '#1b1410', hat: 'bun', sash: '#d9a630', weapon: null },
  guard: { skin: '#f1d2b0', top: '#a3262a', collar: '#c9433a', leg: '#2e2a26', leg2: '#3e3a36', hair: '#14141a', hat: 'helmet', sash: C.gold, weapon: 'spear' },
};

export function dirFromAngle(a) {
  const c = Math.cos(a), s = Math.sin(a);
  if (Math.abs(c) > Math.abs(s)) return c > 0 ? 3 : 2;
  return s > 0 ? 0 : 1;
}

const easeOut = (u) => 1 - Math.pow(1 - Math.min(1, Math.max(0, u)), 3);
const easeIn = (u) => Math.pow(Math.min(1, Math.max(0, u)), 2);
const lerp = (a, b, u) => a + (b - a) * u;

// มุมดาบตามจังหวะฟัน: คืน { ang, ext, strike(0..1 ระหว่างฟันจริง) }
export function swingPose(swing, combo, aim) {
  if (combo === 2) {                                       // แทง
    const ext = swing < 0.3 ? -6 * easeOut(swing / 0.3) : swing < 0.5 ? lerp(-6, 12, easeOut((swing - 0.3) / 0.2)) : lerp(12, 0, easeIn((swing - 0.5) / 0.5));
    return { ang: aim, ext, strike: swing >= 0.3 && swing < 0.5 ? (swing - 0.3) / 0.2 : -1 };
  }
  const ds = combo === 1 ? -1 : 1, start = aim - ds * 1.9, end = aim + ds * 1.5;
  let ang, strike = -1;
  if (swing < 0.3) ang = start - ds * 0.3 * easeOut(swing / 0.3);               // ง้าง
  else if (swing < 0.55) { strike = (swing - 0.3) / 0.25; ang = lerp(start - ds * 0.3, end, easeOut(strike)); } // ฟัน
  else ang = lerp(end, end - ds * 0.5, easeOut((swing - 0.55) / 0.45));       // เก็บดาบ
  return { ang, ext: 0, strike, start: start - ds * 0.3 };
}

let BLADE = '#d8e0e4';   // สีใบดาบตามอาวุธที่สวม (ตั้งต่อการวาดหนึ่งครั้ง)
let WEAPON = 'sword';    // ทรงอาวุธ: sword / kris / glaive

function sword(ctx, x, y, ang, len = 19) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  ctx.fillStyle = '#5a2f1a'; ctx.fillRect(-5, -1.5, 5, 3);
  ctx.fillStyle = C.gold; ctx.fillRect(-1, -4, 3, 8);
  if (WEAPON === 'glaive') {                                  // ง้าว: ด้ามยาว ใบโค้งที่ปลาย
    ctx.fillStyle = '#6b4423'; ctx.fillRect(-8, -1.2, len + 10, 2.4);
    ctx.fillStyle = BLADE; ctx.beginPath(); ctx.moveTo(len, -2); ctx.quadraticCurveTo(len + 10, -7, len + 14, 0); ctx.lineTo(len + 2, 3); ctx.closePath(); ctx.fill();
    ctx.restore(); return;
  }
  if (WEAPON === 'kris') {                                    // กริช: ใบสั้นคดเป็นคลื่น
    ctx.fillStyle = BLADE;
    for (let i = 0; i < 5; i++) ctx.fillRect(2 + i * 2.6, -2 + (i % 2 ? 1 : -0.5), 3, 3);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(2, -1.5, 12, 1);
    ctx.restore(); return;
  }
  ctx.fillStyle = BLADE; ctx.fillRect(2, -2, len - 2, 4);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(2, -2, len - 2, 1.4);
  ctx.fillStyle = '#b8c2c8'; ctx.fillRect(len, -1.5, 3, 3);
  ctx.restore();
}

// ส่วนต่อสองท่อน (ต้นขา-หน้าแข้ง หรือ ต้นแขน-ปลายแขน) มุม 0 = ชี้ลง
function limb(ctx, x, y, a1, l1, a2, l2, w, col, col2, endCol, endLen, foot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(a1);
  ctx.fillStyle = col; ctx.fillRect(-w / 2, -1, w, l1 + 2);
  ctx.translate(0, l1); ctx.rotate(a2 - a1);
  ctx.fillStyle = col2; ctx.fillRect(-w / 2, -1, w, l2 + 1);
  if (endCol) { ctx.fillStyle = endCol; ctx.fillRect(-w / 2 + (foot ? Math.min(0, foot) : 0), l2 - 1, w + Math.abs(foot || 0), endLen); }
  ctx.restore();
}

function head(ctx, L, d, f, x, y, t, side) {
  const R = (c, a, b, w, h) => { ctx.fillStyle = c; ctx.fillRect(Math.round(a), Math.round(b), w, h); };
  R(L.skin, x - 6, y - 12, 12, 12);
  R('rgba(0,0,0,0.1)', x - 6, y - 2, 12, 2);
  const hair = L.hair;
  if (L.hat !== 'helmet') {
    if (d === 1) R(hair, x - 7, y - 15, 14, 15);
    else if (side) { R(hair, x - 7, y - 15, 14, 6); R(hair, x - 7 + (f < 0 ? 6 : 0), y - 15, 8, 11); }
    else R(hair, x - 7, y - 15, 14, 6);
  }
  if (L.hat === 'ngob') {                                  // งอบใบลาน: หมวกกรวยกว้าง
    R('#9e7b3c', x - 12, y - 14, 24, 3); R(L.hatColor || '#c9a35a', x - 10, y - 17, 20, 4); R(L.hatColor || '#c9a35a', x - 6, y - 21, 12, 4); R('#e0c078', x - 3, y - 24, 6, 3);
    R('rgba(0,0,0,0.25)', x - 10, y - 14, 20, 1);
  } else if (L.hat === 'crown') {                          // ชฎาเงิน
    R(hair, x - 7, y - 19, 14, 4);
    R(L.hatColor || '#dfe6ea', x - 7, y - 17, 14, 4); R('#c8d0d8', x - 5, y - 22, 10, 5); R(L.hatColor || '#dfe6ea', x - 3, y - 27, 6, 5); R('#ffffff', x - 1, y - 32, 2, 5);
    R(C.gold, x - 7, y - 15, 14, 1.5);
  } else if (L.hat === 'band') {
    R(hair, x - 7, y - 19, 4, 5); R(hair, x - 2, y - 20, 4, 6); R(hair, x + 3, y - 19, 4, 5);
    R('#c8302a', x - 7, y - 14, 14, 3);
    if (d !== 0) { const w = Math.sin(t * 9) * 1.5; R('#c8302a', x + (side ? -f * 9 : 5), y - 13 + w * 0.4, 5, 2); R('#a8201a', x + (side ? -f * 12 : 8), y - 12 + w, 4, 2); }
  } else if (L.hat === 'elder') {
    if (d !== 1) { R(hair, x - 5, y - 3, 10, 4); R(hair, x - 3, y, 6, 4); }
  } else if (L.hat === 'bun') {
    R(hair, x - 4 + (side ? -f * 3 : 0), y - 21, 8, 6); R(C.gold, x - 1, y - 23, 2, 3);
  } else if (L.hat === 'helmet' || L.hat === 'helm') {
    const h1 = L.hat === 'helm' ? (L.hatColor || '#9aa4ac') : C.gold, h2 = L.hat === 'helm' ? '#c0c8d0' : '#e8c050';
    R(h1, x - 8, y - 16, 16, 5); R(h2, x - 6, y - 21, 12, 5); R(h1, x - 4, y - 25, 8, 4); R(h2, x - 2, y - 29, 4, 4); R(L.hat === 'helm' ? '#5a646c' : C.red, x - 1, y - 32, 2, 3);
  }
  const blink = (t % 3.7) < 0.12;
  const eh = blink ? 1 : 3;
  if (d === 0) { R('#111', x - 3, y - 8 + (blink ? 2 : 0), 2, eh); R('#111', x + 1, y - 8 + (blink ? 2 : 0), 2, eh); }
  else if (side) R('#111', x + 3 * f - 1, y - 8 + (blink ? 2 : 0), 2, eh);
}

export function drawHuman(ctx, look, X, Y, o) {
  const L = typeof look === 'string' ? LOOKS[look] : look;
  BLADE = o.blade || '#d8e0e4'; WEAPON = o.weapon || 'sword';
  const d = o.dir ?? 0, side = d === 2 || d === 3, f = d === 2 ? -1 : 1;
  const k = o.amt ?? (o.moving ? 1 : 0), ph = (o.walk || 0) * Math.PI * 2, t = o.t || 0;
  const swinging = o.swing >= 0 && L.weapon === 'sword';
  const pose = swinging ? swingPose(o.swing, o.combo || 0, o.aim) : null;
  // ก้าวเข้าหาเป้าตอนฟัน (ภาพ)
  const lungeK = pose ? (pose.strike >= 0 ? easeOut(pose.strike) : o.swing >= 0.55 ? 1 - easeIn((o.swing - 0.55) / 0.45) : 0) : 0;
  const lx = pose ? Math.cos(o.aim) * 3 * lungeK : 0, ly = pose ? Math.sin(o.aim) * 2 * lungeK : 0;
  const x = Math.round(X + lx), y = Math.round(Y + ly);
  const bob = k ? Math.abs(Math.cos(ph)) * 2.2 : (Math.sin(t * 2.4) * 0.5 + 0.5) * 0.8;
  const hipY = y - 12 - bob;
  const R = (c, a, b, w, h) => { ctx.fillStyle = c; ctx.fillRect(Math.round(a), Math.round(b), w, h); };
  ctx.save();
  if (o.dash) ctx.globalAlpha = 0.9;
  if (o.hurt > 0 && Math.floor(t * 28) % 2) ctx.globalAlpha = 0.45;
  ctx.fillStyle = 'rgba(0,0,0,0.27)'; ctx.beginPath(); ctx.ellipse(X, Y + 1, 11 - bob, 4 - bob * 0.3, 0, 0, 7); ctx.fill();

  // เอนตัว: วิ่งเอนไปข้างหน้า หลบเอนแรง โดนตีเอนถอย ฟันเอนตามดาบ
  let lean = k * 0.13 + (o.dash ? 0.42 : 0) - (o.hurt > 0 ? 0.25 : 0) + lungeK * 0.12;
  if (!side) lean *= 0.25;

  const swordAt = (hx, hy) => {
    if (swinging) sword(ctx, hx, hy, pose.ang);
  };
  const staff = (hx, hy) => {
    if (L.weapon === 'spear') { R(C.teak, hx - 1, hy - 34, 2, 44); R('#d8e0e4', hx - 2, hy - 40, 4, 7); R(C.red, hx - 2, hy - 33, 4, 2); }
    else if (L.weapon === 'cane') { R(C.teakDark, hx - 1, hy - 4, 2, 20); R(C.teakDark, hx - 4, hy - 6, 5, 2); }
  };

  if (side) {
    // ===== มุมข้าง =====
    const legs = [1, 0].map((i) => {
      const phi = ph + i * Math.PI;
      let th = -f * Math.sin(phi) * 0.7 * k, kn = k * Math.max(0, Math.cos(phi)) * 0.95;
      if (o.dash) { th = i ? f * 0.8 : -f * 0.9; kn = i ? 0.9 : 0.2; }
      else if (swinging) { th = i ? f * 0.35 : -f * 0.4; kn = i ? 0.3 : 0.1; }
      return { i, th, sh: th + f * kn };
    });
    // ขาไกล (สีเข้ม) → ขาใกล้
    for (const lg of legs) limb(ctx, x - 1, hipY, lg.th, 6, lg.sh, 6, 6, lg.i ? L.leg2 : L.leg, lg.i ? darker(L.guard || L.leg) : (L.guard || L.leg), '#1a1418', 2, f * 2);
    // ลำตัวและหัวหมุนรอบสะโพก
    ctx.save(); ctx.translate(x, hipY); ctx.rotate(f * lean);
    const breathe = k ? 0 : Math.sin(t * 2.4) * 0.5;
    const armUp = ph;
    const farArm = () => {
      if (swinging) return;
      const a1 = f * Math.sin(armUp) * 0.65 * k + (o.dash ? f * 1.1 : 0), a2 = a1 - f * (0.35 + Math.max(0, Math.sin(armUp)) * 0.5 * k);
      limb(ctx, 0, -13, a1, 6, a2, 6, 5, darker(L.top), darker(L.fore || L.top), L.skin, 3);
    };
    if (L.weapon === 'sword' && !swinging) sword(ctx, -f * 3, -15, f > 0 ? 2.25 : Math.PI - 2.25, 17); // ดาบสะพายหลัง
    farArm();
    if (L.weapon !== 'sword' && L.weapon) staff(f * 9, -6);
    R(L.top, -4.5, -14 - breathe, 9, 14 + breathe); R(L.collar, -5, -16 - breathe, 10, 4);
    if (L.plates) { R(L.plates, -4.5, -11 - breathe, 9, 2); R(L.plates, -4.5, -7, 9, 2); }
    if (L.straps) R(L.straps, -1, -14 - breathe, 2, 12);
    if (L.neck) R(L.neck, f * 2, -12 - breathe, 2, 3);
    if (L.sash === 'check') for (let i = 0; i < 9; i += 2) R(i % 4 ? '#f1e3c4' : '#d84a3a', -4.5 + i, -3, 2, 3);
    else R(L.sash, -4.5, -3, 9, 3);
    if (L.hat === 'elder' || L.hat === 'bun') { R(L.sash, -2, -15, 4, 12); }
    head(ctx, L, d, f, 0, -16 - breathe, t, true);
    // แขนใกล้: ถือดาบ / ร่าย / แกว่งตามจังหวะเดิน
    if (swinging) {
      const hx = Math.cos(pose.ang) * (8 + pose.ext * 0.5), hy = -12 + Math.sin(pose.ang) * (7 + pose.ext * 0.4);
      ctx.save(); ctx.rotate(-f * lean); // ดาบชี้ตามมุมโลก ไม่เอนตามตัว
      drawSmear(ctx, pose, hx, hy);
      armTo(ctx, 0, -13, hx, hy, 5, L.top, L.skin);
      sword(ctx, hx, hy, pose.ang, 19 + pose.ext * 0.4);
      ctx.restore();
    } else if (o.cast) {
      limb(ctx, 0, -13, -f * 1.45, 6, -f * 1.6, 6, 5, L.top, L.fore || L.top, L.skin, 3);
      ctx.fillStyle = 'rgba(255,90,90,0.7)'; ctx.beginPath(); ctx.arc(f * 13, -15, 3.5, 0, 7); ctx.fill();
    } else {
      const a1 = -f * Math.sin(armUp) * 0.65 * k + (o.dash ? f * 1.2 : 0), a2 = a1 - f * (0.35 + Math.max(0, -Math.sin(armUp)) * 0.5 * k);
      limb(ctx, 0, -13, a1, 6, a2, 6, 5, L.top, L.fore || L.top, L.skin, 3);
    }
    ctx.restore();
  } else {
    // ===== มุมหน้า/หลัง =====
    const lift = (i) => {
      if (swinging || o.dash) return i ? 1.5 : 0;
      return k * Math.max(0, Math.sin(ph + i * Math.PI)) * 4.5;
    };
    const l0 = lift(0), l1 = lift(1);
    // ขา: ต้นขาเอียงออกเล็กน้อย หน้าแข้งยกเมื่อก้าว (เห็นเข่างอ)
    R(L.leg, x - 7, hipY - l0 * 0.4, 6, 7); R(L.guard || L.leg2, x - 7, hipY + 6 - l0, 6, 6 - l0 * 0.3); R('#1a1418', x - 7, hipY + 11 - l0 * 1.3, 6, 2);
    R(L.leg, x + 1, hipY - l1 * 0.4, 6, 7); R(L.guard || L.leg2, x + 1, hipY + 6 - l1, 6, 6 - l1 * 0.3); R('#1a1418', x + 1, hipY + 11 - l1 * 1.3, 6, 2);
    const by = hipY + 12;
    const breathe = k ? 0 : Math.sin(t * 2.4) * 0.5;
    const sway = k ? Math.sin(ph) * 0.6 : 0;
    const back = d === 1;
    // ดาบสะพายหลังตอนหันหลัง / แขนถือดาบที่อยู่ด้านหลังตัว
    const swordBehind = swinging && Math.sin(pose.ang) < -0.25;
    if (!swinging && L.weapon === 'sword') sword(ctx, x + 6, by - 30, back ? -2.3 : -2.0, 17);   // ดาบสะพายหลัง
    if (swinging && swordBehind) drawSwordArm();
    if (L.weapon !== 'sword' && L.weapon) staff(x + 10, by - 12);
    R(L.top, x - 8 + sway, by - 26 - breathe, 16, 14 + breathe); R(L.collar, x - 8 + sway, by - 28 - breathe, 16, 4);
    if (L.plates) { R(L.plates, x - 8 + sway, by - 23 - breathe, 16, 2); R(L.plates, x - 8 + sway, by - 19, 16, 2); R(L.collar, x - 1 + sway, by - 26, 2, 11); }
    if (L.straps && !back) { R(L.straps, x - 6 + sway, by - 26, 3, 12); R(L.straps, x + 3 + sway, by - 26, 3, 12); }
    if (L.neck && !back) { R('#d9a630', x - 3 + sway, by - 26, 6, 1); R(L.neck, x - 1 + sway, by - 25, 3, 4); }
    R('rgba(0,0,0,0.12)', x + 4 + sway, by - 26, 4, 14);
    if (L.sash === 'check') for (let i = 0; i < 16; i += 2) R(i % 4 ? '#f1e3c4' : '#d84a3a', x - 8 + sway + i, by - 15, 2, 3);
    else R(L.sash, x - 8 + sway, by - 15, 16, 3);
    if (L.hat === 'elder' || L.hat === 'bun') { R(L.sash, x - 8, by - 27, 5, 3); R(L.sash, x - 4, by - 24, 4, 9); }
    // แขนซ้าย (ฝั่งที่ไม่ถือดาบ) แกว่งสวนขา
    const swingA = k ? Math.sin(ph) * 0.45 : Math.sin(t * 2.4) * 0.04;
    const armL = () => { const sh = swingA * 5 * (back ? -1 : 1); limb(ctx, x - 9 + sway, by - 26 + Math.max(0, sh) * 0.4, 0.1, 6 - Math.max(0, sh) * 0.3, 0.06, 6 - Math.max(0, sh) * 0.5, 4, L.top, L.fore || L.top, L.skin, 4); };
    armL();
    if (!swinging) {
      if (o.cast) { R(L.top, x + 7, by - 32, 4, 10); R(L.skin, x + 7, by - 35, 4, 4); ctx.fillStyle = 'rgba(255,90,90,0.7)'; ctx.beginPath(); ctx.arc(x + 9, by - 37, 4, 0, 7); ctx.fill(); }
      else {
        const sh = -swingA * 5 * (back ? -1 : 1);
        limb(ctx, x + 9 + sway, by - 26 + Math.max(0, sh) * 0.4, -0.1, 6 - Math.max(0, sh) * 0.3, -0.06, 6 - Math.max(0, sh) * 0.5, 4, L.top, L.fore || L.top, L.skin, 4);
      }
    }
    head(ctx, L, d, f, x + sway * 0.5, by - 28 - breathe, t, false);
    if (swinging && !swordBehind) drawSwordArm();

    function drawSwordArm() {
      const sx = x + (Math.cos(pose.ang) > 0 ? 6 : -6), sy = by - 25;
      const hx = sx + Math.cos(pose.ang) * (8 + pose.ext * 0.5), hy = sy + Math.sin(pose.ang) * (6 + pose.ext * 0.3);
      drawSmear(ctx, pose, hx, hy);
      armTo(ctx, sx, sy, hx, hy, 4, L.top, L.skin);
      sword(ctx, hx, hy, pose.ang, 19 + pose.ext * 0.4);
    }
  }
  if (o.glow) {                                              // ประกายชุดระดับสูง (ม่วง/แดง)
    for (let i = 0; i < 3; i++) {
      const ph2 = (t * 1.3 + i * 0.37) % 1, gx = X + Math.sin(i * 2.1 + t * 0.7) * 9, gy = Y - 10 - ph2 * 34;
      ctx.globalAlpha = Math.sin(ph2 * Math.PI) * 0.9; ctx.fillStyle = o.glow; ctx.fillRect(gx - 1, gy - 1, 2, 2); ctx.fillStyle = '#fff'; ctx.fillRect(gx - 0.5, gy - 0.5, 1, 1);
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function darker(hex) {           // สีเข้มขึ้นเล็กน้อยสำหรับแขนขาข้างไกล
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, ((n >> 16) & 255) - 28), g = Math.max(0, ((n >> 8) & 255) - 28), b = Math.max(0, (n & 255) - 28);
  return `rgb(${r},${g},${b})`;
}

// แขนยื่นจากไหล่ไปถึงมือ (ท่อนเดียวตรงๆ ตอนฟันให้ดูเหวี่ยงเต็มแขน)
function armTo(ctx, sx, sy, hx, hy, w, col, skin) {
  const a = Math.atan2(hy - sy, hx - sx), len = Math.hypot(hx - sx, hy - sy);
  ctx.save(); ctx.translate(sx, sy); ctx.rotate(a - Math.PI / 2);
  ctx.fillStyle = col; ctx.fillRect(-w / 2, -1, w, len - 2);
  ctx.fillStyle = skin; ctx.fillRect(-w / 2, len - 4, w, 4);
  ctx.restore();
}

// รอยดาบตามทางที่ปลายดาบวิ่งผ่าน (เฉพาะช่วงฟันจริง)
function drawSmear(ctx, pose, hx, hy) {
  if (pose.strike < 0 || pose.start === undefined) return;
  const u = easeOut(pose.strike), a1 = pose.ang, a0 = lerp(pose.start, pose.ang, Math.max(0, u - 0.5));
  const lo = Math.min(a0, a1), hi = Math.max(a0, a1);
  ctx.save();
  ctx.globalAlpha = 0.55 * (1 - pose.strike * 0.5);
  ctx.fillStyle = '#fff6dc';
  ctx.beginPath(); ctx.arc(hx, hy, 23, lo, hi); ctx.arc(hx, hy, 9, hi, lo, true); ctx.closePath(); ctx.fill();
  ctx.restore();
}

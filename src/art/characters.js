// ตัวละครคน: ผู้เล่นและชาวเวียง หัวสี่เหลี่ยม แยกชิ้นแขนขา วาดด้วยโค้ด
import { C, shadow, box, poly, circle } from './draw.js';

export const LOOKS = {
  hero: { skin: C.skin, shirt: C.indigo, shirtHi: '#3d6296', pants: '#3a2a22', sash: 'check', hair: '#22160f', head: 'band', weapon: 'sword' },
  elder: { skin: '#d4a07a', shirt: '#ece4d0', shirtHi: '#fff8e8', pants: '#8a6a4a', sash: '#c9822b', hair: '#f2f0ea', head: 'elder', weapon: 'cane' },
  granny: { skin: '#cf9a72', shirt: '#7a4a7a', shirtHi: '#94609a', pants: '#5a3a2a', sash: '#c9a35a', hair: '#bdb8b0', head: 'bun', weapon: null },
  guard: { skin: C.skin, shirt: C.red, shirtHi: C.redHi, pants: '#2e2a26', sash: C.gold, hair: '#22160f', head: 'helmet', weapon: 'spear' },
};

export function dirFromAngle(a) {
  const c = Math.cos(a), s = Math.sin(a);
  if (Math.abs(c) > Math.abs(s)) return c > 0 ? 3 : 2;
  return s > 0 ? 0 : 1;
}

function sword(ctx, x, y, ang, len = 20) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  box(ctx, -2, -2, 5, 4, C.gold, C.ink, 1);                // ด้ามจับปลอกทอง
  poly(ctx, [3, -2, len, -1.5, len + 4, 0, len, 1.5, 3, 2], '#dfe6ea', C.ink, 1.2); // ใบดาบโค้งปลาย
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(5, -1, len - 6, 0.8);
  box(ctx, -7, -1.5, 5, 3, '#5a2f1a', C.ink, 1);
  ctx.restore();
}
function spear(ctx, x, y) {
  ctx.fillStyle = C.teak; ctx.fillRect(x - 1, y - 34, 2.4, 40);
  poly(ctx, [x - 3, y - 34, x + 0.2, y - 44, x + 3.4, y - 34], '#dfe6ea', C.ink, 1);
  ctx.fillStyle = C.red; ctx.fillRect(x - 2.5, y - 34, 5.4, 2.5);
}
function cane(ctx, x, y) {
  ctx.strokeStyle = C.teakDark; ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.moveTo(x, y + 8); ctx.lineTo(x, y - 12); ctx.quadraticCurveTo(x, y - 16, x - 4, y - 15); ctx.stroke();
}

function head(ctx, L, hx, hy, dir, t) {
  // หัวสี่เหลี่ยม
  box(ctx, hx - 6.5, hy - 12, 13, 12, L.skin);
  ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(hx - 5, hy - 2.5, 10, 1.5);
  // ผม
  if (L.head !== 'helmet') {
    ctx.fillStyle = L.hair;
    if (dir === 1) ctx.fillRect(hx - 6.5, hy - 12, 13, 9);
    else { ctx.fillRect(hx - 6.5, hy - 12, 13, 4); if (dir === 2) ctx.fillRect(hx + 2, hy - 12, 4.5, 8); if (dir === 3) ctx.fillRect(hx - 6.5, hy - 12, 4.5, 8); }
  }
  // หน้า
  if (dir !== 1) {
    const ex = dir === 2 ? -2.5 : dir === 3 ? 2.5 : 0;
    ctx.fillStyle = C.ink;
    if (dir === 0) { ctx.fillRect(hx - 3.5 + ex, hy - 7, 2, 2.4); ctx.fillRect(hx + 1.5 + ex, hy - 7, 2, 2.4); }
    else ctx.fillRect(hx + ex - 1 + (dir === 3 ? 1 : -1), hy - 7, 2, 2.4);
    ctx.fillStyle = 'rgba(200,90,80,0.35)';
    if (dir === 0) { ctx.fillRect(hx - 5, hy - 4.5, 2, 1.4); ctx.fillRect(hx + 3, hy - 4.5, 2, 1.4); }
  }
  // หมวก/เครื่องหัว
  if (L.head === 'band') {
    ctx.fillStyle = C.red; ctx.fillRect(hx - 6.5, hy - 10, 13, 2.6);
    const tail = Math.sin(t * 8) * 1.5;
    if (dir !== 0) { ctx.fillRect(hx + (dir === 2 ? 5 : -9), hy - 10 + tail * 0.3, 4, 1.8); ctx.fillRect(hx + (dir === 2 ? 7 : -11), hy - 9 + tail, 3, 1.6); }
  } else if (L.head === 'elder') {
    ctx.fillStyle = L.hair; if (dir !== 1) { ctx.fillRect(hx - 4, hy - 3, 8, 4); ctx.fillRect(hx - 2.5, hy + 1, 5, 2.5); }
  } else if (L.head === 'bun') {
    circle(ctx, hx + (dir === 2 ? 4 : dir === 3 ? -4 : 0), hy - 13.5, 3.5, L.hair, C.ink, 1);
    ctx.fillStyle = C.gold; ctx.fillRect(hx - 1, hy - 17, 2, 2);
  } else if (L.head === 'helmet') {
    poly(ctx, [hx - 7.5, hy - 9, hx - 5, hy - 15, hx, hy - 25, hx + 5, hy - 15, hx + 7.5, hy - 9], C.gold, C.ink, 1.3);
    ctx.fillStyle = C.goldHi; ctx.fillRect(hx - 6, hy - 11, 12, 1.6);
    ctx.fillStyle = C.red; ctx.fillRect(hx - 1, hy - 20, 2, 4);
  }
}

// opts: { dir, walk(เฟสเดิน 0..1), moving, swing(-1 = ไม่ฟัน, 0..1), aim(มุม), hurt, t, dash, cast }
export function drawHuman(ctx, look, x, y, o) {
  const L = typeof look === 'string' ? LOOKS[look] : look;
  const dir = o.dir ?? 0;
  const bob = o.moving ? Math.abs(Math.sin(o.walk * Math.PI * 2)) * 1.4 : Math.sin(o.t * 2) * 0.4;
  const step = o.moving ? Math.sin(o.walk * Math.PI * 2) : 0;
  shadow(ctx, x, y, 9, 3.6);
  ctx.save();
  if (o.dash) ctx.globalAlpha = 0.85;
  if (o.hurt > 0 && Math.floor(o.t * 28) % 2) ctx.globalAlpha = 0.4; // กะพริบตอนโดนตี
  const by = y - 8 - bob; // จุดสะโพก
  // ขา
  const legL = step * 3, legR = -step * 3;
  if (dir === 2 || dir === 3) {
    box(ctx, x - 2 + legL, by, 4.5, 8 + bob * 0.5, L.pants, C.ink, 1.2);
    box(ctx, x - 2 + legR, by, 4.5, 8 + bob * 0.5, L.pants, C.ink, 1.2);
  } else {
    box(ctx, x - 5, by + Math.max(0, -legL) * 0.3, 4.5, 8 - Math.max(0, legL) * 0.5 + bob * 0.5, L.pants, C.ink, 1.2);
    box(ctx, x + 0.5, by + Math.max(0, -legR) * 0.3, 4.5, 8 - Math.max(0, legR) * 0.5 + bob * 0.5, L.pants, C.ink, 1.2);
  }
  // อาวุธข้างหลังเมื่อหันหลัง
  const swinging = o.swing >= 0;
  const armSwing = step * 2.5;
  const weaponBehind = dir === 1 || dir === 2;
  const drawWeapon = () => {
    if (L.weapon === 'sword') {
      if (swinging) {
        const a = (o.aim ?? 0) + (-1.25 + o.swing * 2.5);
        sword(ctx, x + Math.cos(a) * 6, by - 6 + Math.sin(a) * 6, a, 18);
      } else {
        const hx = dir === 2 ? x - 7 : x + 7;
        sword(ctx, hx, by - 2 + armSwing * 0.3, dir === 2 ? Math.PI * 0.62 : Math.PI * 0.38, 15);
      }
    } else if (L.weapon === 'spear') spear(ctx, x + (dir === 2 ? -8 : 8), by);
    else if (L.weapon === 'cane') cane(ctx, x + (dir === 2 ? -8 : 8), by);
  };
  if (weaponBehind && !swinging) drawWeapon();
  // ลำตัว
  box(ctx, x - 6.5, by - 11, 13, 12, L.shirt, C.ink, 1.3);
  ctx.fillStyle = L.shirtHi; ctx.fillRect(x - 5, by - 10, 3, 9);
  if (L.sash === 'check') {           // ผ้าขาวม้า
    for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#d84a3a' : '#f1e3c4'; ctx.fillRect(x - 6 + i * 2.2, by - 2.5, 2.2, 3); }
  } else { ctx.fillStyle = L.sash; ctx.fillRect(x - 6, by - 2.5, 12, 3); }
  if (L.head === 'elder' || L.head === 'bun') {    // สไบพาดไหล่
    ctx.fillStyle = L.sash; ctx.beginPath(); ctx.moveTo(x - 6, by - 11); ctx.lineTo(x - 2, by - 11); ctx.lineTo(x + 6, by - 2); ctx.lineTo(x + 2, by - 2); ctx.closePath(); ctx.fill();
  }
  // แขน
  const castLift = o.cast ? 5 : 0;
  if (dir === 0 || dir === 1) {
    box(ctx, x - 9.5, by - 10 + armSwing - castLift, 3.5, 9, L.shirt, C.ink, 1.1);
    box(ctx, x + 6, by - 10 - armSwing - castLift, 3.5, 9, L.shirt, C.ink, 1.1);
    ctx.fillStyle = L.skin; ctx.fillRect(x - 9, by - 2.5 + armSwing - castLift, 2.6, 2.4); ctx.fillRect(x + 6.5, by - 2.5 - armSwing - castLift, 2.6, 2.4);
  } else {
    const ax = dir === 3 ? x - 1 : x - 2.5;
    box(ctx, ax + armSwing * 0.6, by - 10 - castLift, 3.5, 9, L.shirt, C.ink, 1.1);
    ctx.fillStyle = L.skin; ctx.fillRect(ax + 0.5 + armSwing * 0.6, by - 2.5 - castLift, 2.6, 2.4);
  }
  head(ctx, L, x, by - 10, dir, o.t);
  if (!weaponBehind || swinging) drawWeapon();
  ctx.restore();
}

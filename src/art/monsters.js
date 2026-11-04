// อสูรหิมพานต์และผีไทย วาดด้วยโค้ด
const SCALE = 1.4;
import { C, shadow, box, poly, circle } from './draw.js';

function pig(ctx, s, o, colors) {
  const { body, dark, mane } = colors;
  const run = o.moving ? Math.sin(o.t * 16) : 0;
  const lean = o.charging ? 3 : 0;
  // ขา
  ctx.fillStyle = dark;
  [-7, -2, 4, 8].forEach((lx, i) => ctx.fillRect(lx * s, -5 * s + (i % 2 ? run : -run) * s, 2.6 * s, 5 * s));
  // ลำตัว
  poly(ctx, [-11 * s, -12 * s, 6 * s + lean, -14 * s, 12 * s + lean, -8 * s, 11 * s + lean, -3 * s, -10 * s, -3 * s, -13 * s, -7 * s], body, C.line, 1.4);
  // แผงขนสันหลัง
  ctx.fillStyle = mane;
  for (let i = 0; i < 6; i++) poly(ctx, [(-9 + i * 3) * s, -12.5 * s, (-7.5 + i * 3) * s + (o.charging ? -2 : 0), -17 * s - (i % 2) * s, (-6 + i * 3) * s, -12.8 * s], mane, null);
  // หัว
  poly(ctx, [7 * s + lean, -13 * s, 16 * s + lean, -10 * s, 18 * s + lean, -6 * s, 15 * s + lean, -4 * s, 8 * s + lean, -5 * s], body, C.line, 1.4);
  box(ctx, 16 * s + lean, -8 * s, 3.5 * s, 3.5 * s, '#d88a7a', C.line, 1);           // จมูก
  poly(ctx, [14 * s + lean, -5 * s, 17 * s + lean, -2 * s, 15 * s + lean, -5.5 * s], '#f4ecd8', C.line, 0.8); // เขี้ยว
  ctx.fillStyle = o.eye || '#ff4a2a';
  ctx.fillRect(12 * s + lean, -11 * s, 2.4 * s, 2 * s);
  if (o.glowEye) { ctx.fillStyle = 'rgba(255,120,40,0.35)'; circle(ctx, 13 * s + lean, -10 * s, 4 * s, 'rgba(255,120,40,0.35)', null); }
  // หาง
  ctx.strokeStyle = dark; ctx.lineWidth = 1.5 * s; ctx.beginPath(); ctx.moveTo(-12 * s, -9 * s); ctx.quadraticCurveTo(-16 * s, -12 * s, -14 * s, -6 * s); ctx.stroke();
}

function monkey(ctx, o) {
  const run = o.moving ? Math.sin(o.t * 18) : 0;
  const hop = o.moving ? Math.abs(Math.sin(o.t * 9)) * 3 : 0;
  ctx.translate(0, -hop);
  ctx.strokeStyle = '#6b5440'; ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.moveTo(-6, -8); ctx.bezierCurveTo(-16, -10, -14, -24, -8, -22); ctx.stroke(); // หาง
  box(ctx, -5 + run, -6, 3, 6, '#6b5440', C.line, 1); box(ctx, 2 - run, -6, 3, 6, '#6b5440', C.line, 1);
  box(ctx, -6, -16, 12, 11, '#8a6d52', C.line, 1.3);
  ctx.fillStyle = '#c9b089'; ctx.fillRect(-3, -14, 6, 7);
  box(ctx, -9, -16 + run * 1.5, 3, 9, '#8a6d52', C.line, 1); box(ctx, 6, -16 - run * 1.5, 3, 9, '#8a6d52', C.line, 1);
  ctx.fillStyle = C.gold; ctx.fillRect(-9, -11 + run * 1.5, 3, 1.6); ctx.fillRect(6, -11 - run * 1.5, 3, 1.6); // กำไลทอง
  box(ctx, -6, -27, 12, 11, '#8a6d52', C.line, 1.3);
  box(ctx, -4, -24, 8, 7, '#dcc3a0', null);
  ctx.fillStyle = '#ffd34a'; ctx.fillRect(-3, -23, 2, 2); ctx.fillRect(1, -23, 2, 2);
  ctx.fillStyle = C.line; ctx.fillRect(-2, -19, 4, 1);
  box(ctx, -8.5, -25, 3, 4, '#8a6d52', C.line, 1); box(ctx, 5.5, -25, 3, 4, '#8a6d52', C.line, 1);
  poly(ctx, [-4, -27, 0, -32, 4, -27], C.gold, C.line, 1); // มงกุฎเล็กแบบหิมพานต์
}

function krasue(ctx, o) {
  const bob = Math.sin(o.t * 3) * 3;
  ctx.translate(0, -22 + bob);
  // รัศมีเรืองแสงเขียว
  const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 26);
  g.addColorStop(0, 'rgba(140,255,150,0.45)'); g.addColorStop(1, 'rgba(60,200,90,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 4, 26, 0, Math.PI * 2); ctx.fill();
  // สายเรืองแสงห้อยลง (แทนตามตำนาน แบบไม่น่ากลัวเกินไป)
  for (let i = -2; i <= 2; i++) {
    ctx.strokeStyle = i % 2 ? 'rgba(170,255,170,0.75)' : 'rgba(110,220,130,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(i * 2.5, 6);
    ctx.bezierCurveTo(i * 4 + Math.sin(o.t * 4 + i) * 4, 14, i * 3 - Math.sin(o.t * 3 + i) * 5, 20, i * 2 + Math.sin(o.t * 5 + i) * 3, 26);
    ctx.stroke();
  }
  // ผมยาวดำ
  poly(ctx, [-9, -10, 9, -10, 11, 8, 6, 4, 0, 9, -6, 4, -11, 8], '#141018', C.line, 1.2);
  // หน้า
  box(ctx, -6, -8, 12, 12, '#e8e0d0', C.line, 1.2);
  ctx.fillStyle = '#141018'; ctx.fillRect(-6, -8, 12, 3);
  ctx.fillStyle = o.windup > 0 ? '#ffffff' : '#7dff8a';
  ctx.fillRect(-4, -3, 2.5, 2); ctx.fillRect(1.5, -3, 2.5, 2);
  ctx.fillStyle = '#7a1420'; ctx.fillRect(-2, 1, 4, 1.4);
  if (o.windup > 0) circle(ctx, 0, 1.5, 3 + o.windup * 4, 'rgba(140,255,120,0.6)', null);
}

// o: { t, moving, face(1/-1), charging, windup, flash, dying(0..1), level }
export function drawMonster(ctx, type, x, y, o) {
  const big = type === 'bigboar' ? 1.45 : type === 'piglet' ? 0.75 : 1;
  ctx.save();
  if (o.dying > 0) ctx.globalAlpha = Math.max(0, 1 - o.dying);
  if (type === 'krasue') shadow(ctx, x, y, 8, 3, 0.18);
  else shadow(ctx, x, y, 13 * big, 4.5 * big);
  ctx.translate(x, y);
  ctx.scale(SCALE, SCALE);                                    // ขยายให้สมกับตัวละครสูงแบบเอโดเรีย
  if (o.windup > 0 && type !== 'krasue') ctx.translate(Math.sin(o.t * 60) * 1.2, 0);
  ctx.scale(o.face < 0 ? -1 : 1, 1);
  if (o.dying > 0) ctx.scale(1 + o.dying * 0.2, 1 - o.dying * 0.5);
  if (o.flash > 0 && Math.floor(o.t * 30) % 2) ctx.globalAlpha *= 0.55;
  if (type === 'piglet') pig(ctx, big, o, { body: '#7a5236', dark: '#4e321f', mane: '#3a2416' });
  else if (type === 'boar') pig(ctx, 1, o, { body: '#5e4030', dark: '#3a2618', mane: '#26170e' });
  else if (type === 'bigboar') {
    const fl = Math.sin(o.t * 12) > 0 ? '#ff8a2a' : '#ffc84a';
    pig(ctx, big, { ...o, glowEye: true, eye: '#ffd24a' }, { body: '#4a2e22', dark: '#2a1a12', mane: fl });
  } else if (type === 'monkey') monkey(ctx, o);
  else if (type === 'krasue') krasue(ctx, o);
  ctx.restore();
}

export function monsterHeight(type) {
  return Math.round(({ piglet: 18, boar: 24, bigboar: 34, monkey: 34, krasue: 50 }[type] || 26) * SCALE);
}

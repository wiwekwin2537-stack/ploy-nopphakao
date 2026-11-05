// อสูรหิมพานต์และผีไทย วาดด้วยโค้ด
const SCALE = 1.4;
import { C, shadow, box, poly, circle } from './draw.js';
import { DEEP, DEEP_FLYING, DEEP_HEIGHT, DEEP_SHADOW } from './monsters_deep.js';

function pig(ctx, s, o, colors) {
  const { body, dark, mane } = colors;
  const run = o.moving ? Math.sin((o.walk || 0) * Math.PI * 2) : 0;
  const lean = o.charging ? 3 : 0;
  if (o.moving) ctx.translate(0, -Math.abs(Math.cos((o.walk || 0) * Math.PI * 2)) * 1.6 * s);   // วิ่งกระเด้ง
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
  const run = o.moving ? Math.sin((o.walk || 0) * Math.PI * 2) : 0;
  const hop = o.moving ? Math.abs(Math.sin((o.walk || 0) * Math.PI)) * 3 : 0;
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

function phiPob(ctx, o) {                         // ผีปอบ: ร่างผอมโซ ผิวเทาเขียว ผ้าขาวม้าขาด แขนยาวเอื้อม
  const run = o.moving ? Math.sin((o.walk || 0) * Math.PI * 2) : 0, reach = o.windup > 0 ? 6 : 0;
  ctx.translate(0, Math.abs(run) * -1);
  box(ctx, -5 + run * 2, -10, 3.5, 10, '#6f7a68', C.line, 1); box(ctx, 2 - run * 2, -10, 3.5, 10, '#6f7a68', C.line, 1);
  box(ctx, -6, -16, 12, 7, '#7a2a2a', C.line, 1.2);                                    // ผ้าขาวม้าแดงซีด
  ctx.fillStyle = '#d8c8a8'; for (let i = 0; i < 3; i++) ctx.fillRect(-6 + i * 4, -16, 2, 7);
  box(ctx, -6, -30, 12, 15, '#87927c', C.line, 1.3);                                   // อก เห็นซี่โครง
  ctx.fillStyle = '#5f6a56'; for (let i = 0; i < 3; i++) ctx.fillRect(-4, -27 + i * 4, 8, 1.2);
  box(ctx, 5 + reach, -29 - reach * 0.6, 3, 15, '#87927c', C.line, 1);                  // แขนเอื้อม
  ctx.fillStyle = '#e8e0c8'; ctx.fillRect(6 + reach, -14 - reach * 0.6, 3, 3);           // เล็บยาว
  box(ctx, -9, -29, 3, 13, '#87927c', C.line, 1);
  box(ctx, -6, -42, 12, 12, '#9aa48c', C.line, 1.3);
  poly(ctx, [-7, -42, 7, -42, 8, -34, 6, -38, 2, -40, -2, -38, -6, -36, -8, -32], '#1a1418', C.line, 1);  // ผมยุ่ง
  ctx.fillStyle = o.windup > 0 ? '#ffffff' : '#e8f04a'; ctx.fillRect(-1, -37, 2.5, 2); ctx.fillRect(3, -37, 2.5, 2);
  ctx.fillStyle = '#5a1018'; ctx.fillRect(0, -33, 5, 1.6);
}

function phiPhong(ctx, o) {                       // ผีโพง: ลอยต่ำ มีดวงไฟส้มที่จมูก ร่างคลุมผ้าดำ
  const bob = Math.sin(o.t * 2.6) * 2;
  ctx.translate(0, -6 + bob);
  const gl = ctx.createRadialGradient(6, -30, 1, 6, -30, 20); gl.addColorStop(0, 'rgba(255,160,60,0.6)'); gl.addColorStop(1, 'rgba(255,120,40,0)');
  ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(6, -30, 20, 0, Math.PI * 2); ctx.fill();
  poly(ctx, [-9, -2, -7, -28, 0, -36, 7, -28, 9, -2, 5, -5, 2, 0, -2, -5, -6, 0], '#221a26', C.line, 1.2);
  box(ctx, -5, -34, 10, 9, '#4a3a42', C.line, 1.1);
  ctx.fillStyle = '#ffb04a'; ctx.fillRect(-3, -31, 2, 2); ctx.fillRect(2, -31, 2, 2);
  const f = o.windup > 0 ? 6 : 3.5 + Math.sin(o.t * 9);
  circle(ctx, 7, -29, f, '#ff9a3a', null); circle(ctx, 7, -29, f * 0.5, '#fff0b0', null);   // ดวงไฟโพง
}

function khotchasi(ctx, o) {                      // คชสีห์: กายสิงห์สีทอง หัวช้างมีงา แผงคอแดง
  const run = o.moving ? Math.sin((o.walk || 0) * Math.PI * 2) : 0, lean = o.charging ? 3 : 0;
  ctx.translate(0, -Math.abs(Math.cos((o.walk || 0) * Math.PI * 2)) * (o.moving ? 1.4 : 0));
  ctx.fillStyle = '#9a6a2a'; [-9, -4, 5, 10].forEach((lx, i) => ctx.fillRect(lx, -6 + (i % 2 ? run : -run) * 1.5, 3, 6));
  poly(ctx, [-13, -14, 8 + lean, -16, 13 + lean, -10, 12 + lean, -4, -12, -4, -15, -9], '#d9a630', C.line, 1.4);
  ctx.fillStyle = '#b8862a'; for (let i = 0; i < 4; i++) ctx.fillRect(-10 + i * 5, -12, 2, 6);   // ลายเกล็ด
  ctx.strokeStyle = '#c03a2a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-13, -12); ctx.quadraticCurveTo(-19, -16, -17, -8); ctx.stroke();  // หางพู่
  poly(ctx, [6 + lean, -20, 12 + lean, -24, 14 + lean, -14, 7 + lean, -12], '#c03a2a', C.line, 1.2);   // แผงคอ
  box(ctx, 10 + lean, -23, 9, 10, '#8a8a92', C.line, 1.3);                                             // หัวช้าง
  ctx.strokeStyle = '#8a8a92'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(18 + lean, -15); ctx.quadraticCurveTo(22 + lean, -8, 19 + lean, -3); ctx.stroke();  // งวง
  poly(ctx, [16 + lean, -14, 21 + lean, -12, 17 + lean, -12.5], '#f4ecd8', C.line, 0.8);              // งา
  box(ctx, 8 + lean, -24, 4, 7, '#7a7a82', C.line, 1);                                                 // หู
  ctx.fillStyle = o.windup > 0 ? '#ff3a2a' : '#ffd24a'; ctx.fillRect(14 + lean, -21, 2, 2);
  poly(ctx, [11 + lean, -23, 14 + lean, -29, 17 + lean, -23], C.gold, C.line, 1);                       // มงกุฎ
}

function nagaNoi(ctx, o) {                        // นาคน้อย: ลำตัวเขียวมรกตขดเป็นวง ชูหัวมีหงอน
  const sway = Math.sin(o.t * 3) * 2;
  ctx.fillStyle = 'rgba(60,160,200,0.25)'; ctx.beginPath(); ctx.ellipse(0, -2, 14, 4, 0, 0, Math.PI * 2); ctx.fill();
  for (let i = 0; i < 5; i++) circle(ctx, -9 + i * 4, -3 - Math.sin(i + o.t * 4) * 1.5, 4, i % 2 ? '#2f8a5a' : '#3aa86a', C.line, 1);
  ctx.strokeStyle = C.line; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(6, -4); ctx.quadraticCurveTo(10 + sway, -14, 4 + sway, -24); ctx.stroke();
  ctx.strokeStyle = '#3aa86a'; ctx.lineWidth = 5; ctx.stroke();
  ctx.strokeStyle = '#d8e8a0'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(8, -6); ctx.quadraticCurveTo(11 + sway, -14, 6 + sway, -22); ctx.stroke();  // ท้องเกล็ด
  box(ctx, 0 + sway, -31, 10, 8, '#3aa86a', C.line, 1.2);
  poly(ctx, [1 + sway, -31, 3 + sway, -38, 5 + sway, -32, 7 + sway, -39, 9 + sway, -31], C.gold, C.line, 1);   // หงอนทอง
  ctx.fillStyle = o.windup > 0 ? '#ffffff' : '#ffd24a'; ctx.fillRect(6 + sway, -29, 2, 2);
  if (o.windup > 0) circle(ctx, 11 + sway, -26, 3 + o.windup * 3, 'rgba(120,220,255,0.7)', null);
}

function hatsadi(ctx, o) {                        // นกหัสดีลิงค์: นกยักษ์หัวช้าง ปีกแดงทอง บินโฉบ
  const flap = Math.sin(o.t * 10), bob = Math.sin(o.t * 4) * 3;
  ctx.translate(0, -26 + bob);
  poly(ctx, [-2, -4, -20, -14 - flap * 8, -16, -2, -6, 2], '#c9433a', C.line, 1.2);    // ปีกหลัง
  ctx.fillStyle = C.gold; ctx.fillRect(-16, -9 - flap * 5, 8, 2);
  box(ctx, -8, -8, 16, 11, '#e2a23a', C.line, 1.3);                                    // ลำตัว
  poly(ctx, [-8, -2, -16, 2, -14, -4], '#a3262a', C.line, 1);                          // หาง
  box(ctx, 6, -15, 9, 9, '#8a8a92', C.line, 1.2);                                      // หัวช้าง
  ctx.strokeStyle = '#8a8a92'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(14, -8); ctx.quadraticCurveTo(18, -2, 15, 3); ctx.stroke();
  ctx.fillStyle = o.windup > 0 ? '#ff3a2a' : '#1b1410'; ctx.fillRect(11, -13, 2, 2);
  poly(ctx, [2, -4, 18, -16 + flap * 8, 14, -2, 6, 2], '#e04a3a', C.line, 1.2);        // ปีกหน้า
  ctx.fillStyle = '#6a4a2a'; ctx.fillRect(-3, 3, 2, 5); ctx.fillRect(2, 3, 2, 5);      // กรงเล็บ
}

function kumbhan(ctx, o) {                        // กุมภัณฑ์: ยักษ์เตี้ยพุงพลุ้ย ผิวน้ำเงิน ถือตะบอง ผ้าเตี่ยวแดง
  const run = o.moving ? Math.sin((o.walk || 0) * Math.PI * 2) : 0, up = o.windup > 0 ? -10 : 0;
  box(ctx, -8 + run * 2, -10, 6, 10, '#3a5a9a', C.line, 1.2); box(ctx, 2 - run * 2, -10, 6, 10, '#3a5a9a', C.line, 1.2);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(0, -18, 13, 11, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#4a6ab0'; ctx.beginPath(); ctx.ellipse(0, -20, 12, 11, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 1.3; ctx.stroke();
  box(ctx, -10, -14, 20, 5, '#a3262a', C.line, 1.1);                                        // ผ้านุ่ง
  box(ctx, -7, -40, 14, 12, '#5a7ac0', C.line, 1.3);                                        // หัว
  ctx.fillStyle = '#f4ecd8'; ctx.fillRect(-5, -36, 4, 3); ctx.fillRect(1, -36, 4, 3);
  ctx.fillStyle = o.windup > 0 ? '#ff3a2a' : '#1b1410'; ctx.fillRect(-4, -35, 2, 2); ctx.fillRect(2, -35, 2, 2);
  poly(ctx, [-5, -30, -4, -26, -3, -30], '#f4ecd8', null); poly(ctx, [5, -30, 4, -26, 3, -30], '#f4ecd8', null);
  poly(ctx, [-6, -40, 0, -48, 6, -40], C.gold, C.line, 1);                                  // มงกุฎเล็ก
  ctx.save(); ctx.translate(12, -24 + up); ctx.rotate(o.windup > 0 ? -1.2 : 0.3);
  box(ctx, -2, 0, 4, 18, '#6b4423', C.line, 1.1); box(ctx, -4, 14, 8, 8, '#4a2e17', C.line, 1.2);
  ctx.restore();
}

function kinnorn(ctx, o) {                        // กินนร: ครึ่งคนครึ่งนก ปีกขาวทอง ลอยร่ายน้ำแข็ง
  const flap = Math.sin(o.t * 7), bob = Math.sin(o.t * 3) * 2;
  ctx.translate(0, -16 + bob);
  poly(ctx, [-3, -22, -20, -34 - flap * 6, -16, -18, -6, -14], '#f4f0e8', C.line, 1.2);      // ปีกซ้าย
  poly(ctx, [3, -22, 20, -34 - flap * 6, 16, -18, 6, -14], '#f4f0e8', C.line, 1.2);
  ctx.fillStyle = C.gold; ctx.fillRect(-16, -26 - flap * 3, 6, 2); ctx.fillRect(10, -26 - flap * 3, 6, 2);
  poly(ctx, [-6, -6, 6, -6, 4, 6, 0, 10, -4, 6], '#e8d8b0', C.line, 1.1);                    // หางขนนก
  box(ctx, -5, -22, 10, 16, '#2c4a73', C.line, 1.2);                                         // ลำตัวเสื้อคราม
  ctx.fillStyle = C.gold; ctx.fillRect(-5, -16, 10, 2);
  box(ctx, -5, -33, 10, 11, '#f1d2b0', C.line, 1.2);
  poly(ctx, [-5, -33, 0, -44, 5, -33], C.gold, C.line, 1);                                   // ชฎา
  ctx.fillStyle = '#1b1410'; ctx.fillRect(-3, -29, 2, 2); ctx.fillRect(1, -29, 2, 2);
  if (o.windup > 0) { ctx.fillStyle = 'rgba(160,220,255,0.7)'; ctx.beginPath(); ctx.arc(8, -20, 3 + o.windup * 4, 0, Math.PI * 2); ctx.fill(); }
}

function garudaChick(ctx, o) {                    // ครุฑน้อย: ตัวแดง ปีกทอง ปากงุ้ม พุ่งโฉบ
  const run = o.moving ? Math.sin((o.walk || 0) * Math.PI * 2) : 0, lean = o.charging ? 4 : 0;
  box(ctx, -5 + run, -8, 3, 8, '#d9a630', C.line, 1); box(ctx, 2 - run, -8, 3, 8, '#d9a630', C.line, 1);
  poly(ctx, [-9, -24, 8 + lean, -26, 10 + lean, -10, -8, -8], '#c8302a', C.line, 1.3);       // ลำตัว
  poly(ctx, [-8, -22, -20, -30 - (o.charging ? 0 : Math.sin(o.t * 8) * 5), -14, -12], C.gold, C.line, 1.2);   // ปีก
  box(ctx, 4 + lean, -36, 10, 10, '#2a8a5a', C.line, 1.2);                                   // หน้าเขียว
  poly(ctx, [14 + lean, -32, 20 + lean, -29, 14 + lean, -27], '#f2c230', C.line, 1);         // ปากงุ้ม
  ctx.fillStyle = o.windup > 0 ? '#ffffff' : '#ff3a2a'; ctx.fillRect(9 + lean, -33, 2, 2);
  poly(ctx, [4 + lean, -36, 8 + lean, -44, 12 + lean, -36], C.gold, C.line, 1);             // มงกุฎ
}

const YAK_GREEN = { leg: '#2f7a52', body: '#3a9a62', face: '#3fae6c', cloth: '#a3262a' };
const VESSAVANA = { leg: '#1e3a7a', body: '#2a5ab8', face: '#3a6ad0', cloth: '#d9a630' };   // ท้าวเวสสุวรรณ: กายน้ำเงิน ผ้าทอง

function devaWarrior(ctx, o) {                    // เทวดานักรบ: ชุดทองแดง ชฎายอด ถือพระขรรค์
  const run = o.moving ? Math.sin((o.walk || 0) * Math.PI * 2) : 0;
  box(ctx, -5 + run * 2, -10, 4, 10, '#c8302a', C.line, 1); box(ctx, 1 - run * 2, -10, 4, 10, '#c8302a', C.line, 1);
  box(ctx, -7, -14, 14, 5, '#f2c230', C.line, 1.1);                                         // ผ้านุ่งทอง
  box(ctx, -6, -28, 12, 15, '#f3d27a', C.line, 1.2);                                         // เกราะอกทอง
  ctx.fillStyle = '#c8302a'; ctx.fillRect(-6, -24, 12, 2); ctx.fillRect(-1, -28, 2, 14);
  box(ctx, -5, -38, 10, 10, '#f1d2b0', C.line, 1.2);
  poly(ctx, [-6, -37, 0, -52, 6, -37], C.gold, C.line, 1);                                   // ชฎายอดแหลม
  ctx.fillStyle = o.windup > 0 ? '#ff3a2a' : '#1b1410'; ctx.fillRect(-3, -34, 2, 2); ctx.fillRect(1, -34, 2, 2);
  ctx.save(); ctx.translate(8, -22); ctx.rotate(o.windup > 0 ? -1.4 : -0.3 + run * 0.1);
  box(ctx, -1.5, -20, 3, 20, '#eef4ff', C.line, 1); box(ctx, -3, -2, 6, 3, C.gold, C.line, 1);  // พระขรรค์
  ctx.restore();
}

function apsara(ctx, o) {                         // นางอัปสร: ลอยร่ายแสงทอง ผ้าสไบพลิ้ว
  const bob = Math.sin(o.t * 3) * 3, sway = Math.sin(o.t * 4) * 3;
  ctx.translate(0, -18 + bob);
  ctx.strokeStyle = 'rgba(255,200,220,0.8)'; ctx.lineWidth = 2.5;                              // สไบพลิ้ว
  ctx.beginPath(); ctx.moveTo(-6, -20); ctx.quadraticCurveTo(-18 + sway, -8, -12 + sway, 6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(6, -20); ctx.quadraticCurveTo(18 - sway, -8, 12 - sway, 6); ctx.stroke();
  poly(ctx, [-7, -8, 7, -8, 9, 8, -9, 8], '#e85a8a', C.line, 1.1);                             // ผ้านุ่ง
  box(ctx, -5, -20, 10, 12, '#f1d2b0', C.line, 1.1);
  ctx.fillStyle = C.gold; ctx.fillRect(-5, -18, 10, 3);
  box(ctx, -5, -31, 10, 11, '#f1d2b0', C.line, 1.1);
  poly(ctx, [-5, -31, 0, -45, 5, -31], C.gold, C.line, 1);
  ctx.fillStyle = '#1b1410'; ctx.fillRect(-3, -27, 2, 2); ctx.fillRect(1, -27, 2, 2);
  const glow = o.windup > 0 ? 5 + o.windup * 5 : 3;
  ctx.fillStyle = 'rgba(255,236,160,0.75)'; ctx.beginPath(); ctx.arc(9, -16, glow, 0, Math.PI * 2); ctx.fill();
}

function erawanCalf(ctx, o) {                     // ช้างเอราวัณน้อย: ช้างเผือกสามเศียร เครื่องทรงทอง
  const run = o.moving ? Math.sin((o.walk || 0) * Math.PI * 2) : 0, lean = o.charging ? 3 : 0;
  ctx.fillStyle = '#c8c4d0'; [-9, -3, 4, 10].forEach((lx, i) => ctx.fillRect(lx, -8 + (i % 2 ? run : -run) * 1.5, 4, 8));
  poly(ctx, [-13, -22, 9 + lean, -24, 13 + lean, -10, -12, -8], '#f2f0f4', C.line, 1.4);
  box(ctx, -8, -24, 14, 6, '#c8302a', C.line, 1.1); ctx.fillStyle = C.gold; ctx.fillRect(-8, -20, 14, 2);   // ผ้าทรง
  for (const [hx, hy] of [[8, -30], [13, -26], [3, -28]]) {                                    // สามเศียร
    box(ctx, hx + lean, hy, 8, 8, '#ece8f0', C.line, 1.1);
    ctx.strokeStyle = '#ece8f0'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(hx + 6 + lean, hy + 7); ctx.quadraticCurveTo(hx + 10 + lean, hy + 14, hx + 7 + lean, hy + 18); ctx.stroke();
    poly(ctx, [hx + 2 + lean, hy, hx + 4 + lean, hy - 5, hx + 6 + lean, hy], C.gold, C.line, 0.8);
  }
  ctx.fillStyle = o.windup > 0 ? '#ff3a2a' : '#1b1410'; ctx.fillRect(18 + lean, -23, 2, 2);
}

function yak(ctx, o, P = YAK_GREEN) {                             // ยักษ์วัด: ยักษ์ทวารบาลหน้าเขียว ชฎายอด กระบองใหญ่
  const run = o.moving ? Math.sin((o.walk || 0) * Math.PI * 2) : 0, w = o.windup > 0;
  const lift = w ? -18 : o.charging ? -6 : 0;
  ctx.translate(0, Math.abs(run) * -1.2);
  if (o.enraged) { ctx.fillStyle = 'rgba(255,60,40,0.22)'; ctx.beginPath(); ctx.ellipse(0, -30, 26, 34, 0, 0, Math.PI * 2); ctx.fill(); }
  box(ctx, -10 + run * 2, -14, 7, 14, P.leg, C.line, 1.4); box(ctx, 3 - run * 2, -14, 7, 14, P.leg, C.line, 1.4);
  ctx.fillStyle = C.gold; ctx.fillRect(-10 + run * 2, -4, 7, 2); ctx.fillRect(3 - run * 2, -4, 7, 2);
  box(ctx, -13, -22, 26, 10, P.cloth, C.line, 1.4);                                  // ผ้านุ่งแดงลายทอง
  ctx.fillStyle = C.gold; for (let i = 0; i < 5; i++) ctx.fillRect(-12 + i * 5.5, -18, 3, 3);
  box(ctx, -14, -44, 28, 23, P.body, C.line, 1.5);                                  // ลำตัวเขียว
  box(ctx, -15, -46, 30, 8, C.gold, C.line, 1.3);                                      // กรองคอทอง
  ctx.fillStyle = P.cloth; for (let i = 0; i < 4; i++) ctx.fillRect(-11 + i * 7, -44, 3, 3);
  ctx.fillStyle = C.gold; ctx.fillRect(-14, -30, 28, 2.5);                              // ทับทรวง/เข็มขัด
  box(ctx, -20, -42, 7, 18, P.body, C.line, 1.3);                                   // แขนซ้าย
  ctx.save(); ctx.translate(16, -40 + lift * 0.3); ctx.rotate(w ? -1.6 : o.charging ? -0.5 : 0.25 + run * 0.15);
  box(ctx, -3, 0, 7, 18, P.body, C.line, 1.3);                                      // แขนถือกระบอง
  box(ctx, -2, 14, 6, 26, '#6b4423', C.line, 1.3);                                     // ด้ามกระบอง
  box(ctx, -6, 36, 14, 18, '#4a2e17', C.line, 1.5);                                    // หัวกระบอง
  ctx.fillStyle = C.gold; ctx.fillRect(-6, 38, 14, 2.5); ctx.fillRect(-6, 48, 14, 2.5);
  ctx.restore();
  box(ctx, -11, -64, 22, 19, P.face, C.line, 1.5);                                  // หน้า
  ctx.fillStyle = '#f4ecd8'; ctx.fillRect(-9, -58, 7, 5); ctx.fillRect(2, -58, 7, 5);    // ตาโปน
  ctx.fillStyle = w || o.enraged ? '#ff3a2a' : '#1b1410'; ctx.fillRect(-6, -57, 3, 3); ctx.fillRect(5, -57, 3, 3);
  ctx.fillStyle = '#7a1420'; ctx.fillRect(-7, -50, 14, 3);
  poly(ctx, [-7, -50, -5, -45, -4, -50], '#f4ecd8', null); poly(ctx, [7, -50, 5, -45, 4, -50], '#f4ecd8', null);  // เขี้ยวงอก
  box(ctx, -12, -68, 24, 6, C.gold, C.line, 1.3);                                      // ชฎา
  poly(ctx, [-10, -68, 0, -96, 10, -68], C.gold, C.line, 1.4);
  ctx.fillStyle = C.goldHi; for (let i = 0; i < 4; i++) ctx.fillRect(-1.5, -90 + i * 5, 3, 2);
  ctx.fillStyle = P.cloth; ctx.fillRect(-2, -75, 4, 4);
}

// o: { t, moving, face(1/-1), charging, windup, flash, dying(0..1), level }
export function drawMonster(ctx, type, x, y, o) {
  const big = type === 'bigboar' ? 1.45 : type === 'piglet' ? 0.75 : 1;
  ctx.save();
  if (o.dying > 0) ctx.globalAlpha = Math.max(0, 1 - o.dying);
  if (type === 'krasue' || type === 'phi_phong' || type === 'hatsadi' || type === 'kinnorn' || type === 'apsara' || DEEP_FLYING.has(type)) shadow(ctx, x, y, 10, 3, 0.18);
  else if (DEEP_SHADOW[type]) shadow(ctx, x, y, DEEP_SHADOW[type][0], DEEP_SHADOW[type][1], 0.3);
  else if (type === 'khotchasi') shadow(ctx, x, y, 22, 6);
  else if (type === 'khotchasi_king') shadow(ctx, x, y, 40, 11, 0.32);
  else if (type === 'garuda_king') shadow(ctx, x, y, 38, 11, 0.32);
  else if (type === 'yak' || type === 'vessavana') shadow(ctx, x, y, type === 'yak' ? 30 : 40, 10, 0.32);
  else shadow(ctx, x, y, 13 * big, 4.5 * big);
  if (o.recoil > 0) ctx.translate(o.kbx * o.recoil * 30, o.kby * o.recoil * 20);   // สะดุ้งถอยตอนโดนฟัน
  ctx.translate(x, y);
  ctx.scale(SCALE, SCALE);
  if (o.recoil > 0) ctx.scale(1 + o.recoil * 0.8, 1 - o.recoil * 0.8);
  if (o.stun) ctx.rotate(Math.sin(o.t * 30) * 0.06);                                    // ขยายให้สมกับตัวละครสูงแบบเอโดเรีย
  if (o.windup > 0 && type !== 'krasue' && type !== 'yak' && type !== 'khotchasi_king' && type !== 'garuda_king' && type !== 'vessavana' && type !== 'naga_king' && type !== 'thotsakan') ctx.translate(Math.sin(o.t * 60) * 1.2, 0);
  ctx.scale(o.face < 0 ? -1 : 1, 1);
  if (o.dying > 0) { const k = Math.min(1, o.dying * 2.2); ctx.translate(-4 * k, -6 * Math.sin(k * Math.PI)); ctx.rotate(-k * 1.4); } // ล้มตะแคง
  if (o.flash > 0 && Math.floor(o.t * 30) % 2) ctx.globalAlpha *= 0.55;
  if (type === 'piglet') pig(ctx, big, o, { body: '#7a5236', dark: '#4e321f', mane: '#3a2416' });
  else if (type === 'boar') pig(ctx, 1, o, { body: '#5e4030', dark: '#3a2618', mane: '#26170e' });
  else if (type === 'bigboar') {
    const fl = Math.sin(o.t * 12) > 0 ? '#ff8a2a' : '#ffc84a';
    pig(ctx, big, { ...o, glowEye: true, eye: '#ffd24a' }, { body: '#4a2e22', dark: '#2a1a12', mane: fl });
  } else if (type === 'monkey') monkey(ctx, o);
  else if (type === 'krasue') krasue(ctx, o);
  else if (type === 'phi_pob') phiPob(ctx, o);
  else if (type === 'phi_phong') phiPhong(ctx, o);
  else if (type === 'yak') yak(ctx, o);
  else if (type === 'khotchasi') khotchasi(ctx, o);
  else if (type === 'kumbhan') kumbhan(ctx, o);
  else if (type === 'kinnorn') kinnorn(ctx, o);
  else if (type === 'garuda_chick') garudaChick(ctx, o);
  else if (type === 'deva_warrior') devaWarrior(ctx, o);
  else if (type === 'apsara') apsara(ctx, o);
  else if (type === 'erawan_calf') erawanCalf(ctx, o);
  else if (type === 'vessavana') {                            // ท้าวเวสสุวรรณ: ยักษ์กายน้ำเงินใหญ่กว่ายักษ์วัด รัศมีทอง
    const gl = ctx.createRadialGradient(0, -50, 4, 0, -50, 60);
    gl.addColorStop(0, o.enraged ? 'rgba(255,70,30,0.4)' : 'rgba(255,220,100,0.35)'); gl.addColorStop(1, 'rgba(255,210,80,0)');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, -50, 60, 0, Math.PI * 2); ctx.fill();
    ctx.scale(1.3, 1.3); yak(ctx, o, VESSAVANA);
  }
  else if (type === 'garuda_king') {                          // พญาครุฑราช: ใหญ่สองเท่ากว่า รัศมีทอง คลั่งแล้วเปลวแดง
    const gl = ctx.createRadialGradient(4, -24, 2, 4, -24, 40);
    gl.addColorStop(0, o.enraged ? 'rgba(255,70,30,0.5)' : 'rgba(255,220,90,0.45)'); gl.addColorStop(1, 'rgba(255,200,60,0)');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(4, -24, 40, 0, Math.PI * 2); ctx.fill();
    ctx.scale(2.2, 2.2); garudaChick(ctx, o);
  }
  else if (type === 'khotchasi_king') {                       // พญาคชสีห์ทองคำ: ตัวใหญ่เกือบสองเท่า ไอทองรอบตัว คลั่งแล้วแดง
    const gl = ctx.createRadialGradient(4, -14, 2, 4, -14, 30);
    gl.addColorStop(0, o.enraged ? 'rgba(255,80,40,0.45)' : 'rgba(255,215,80,0.4)'); gl.addColorStop(1, 'rgba(255,200,60,0)');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(4, -14, 30, 0, Math.PI * 2); ctx.fill();
    ctx.scale(1.9, 1.9); khotchasi(ctx, o);
  }
  else if (type === 'naga_noi') nagaNoi(ctx, o);
  else if (type === 'hatsadi') hatsadi(ctx, o);
  else if (DEEP[type]) DEEP[type](ctx, o, yak);
  ctx.restore();
}

export function monsterHeight(type) {
  return Math.round(({ piglet: 18, boar: 24, bigboar: 34, monkey: 34, krasue: 50, phi_pob: 42, phi_phong: 40, yak: 96, khotchasi: 32, naga_noi: 40, hatsadi: 50, khotchasi_king: 62, kumbhan: 48, kinnorn: 52, garuda_chick: 44, garuda_king: 96, deva_warrior: 52, apsara: 62, erawan_calf: 36, vessavana: 125, ...DEEP_HEIGHT }[type] || 26) * SCALE);
}

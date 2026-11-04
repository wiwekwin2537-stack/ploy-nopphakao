// อสูรหิมพานต์และผีไทย วาดด้วยโค้ด
const SCALE = 1.4;
import { C, shadow, box, poly, circle } from './draw.js';

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

function yak(ctx, o) {                             // ยักษ์วัด: ยักษ์ทวารบาลหน้าเขียว ชฎายอด กระบองใหญ่
  const run = o.moving ? Math.sin((o.walk || 0) * Math.PI * 2) : 0, w = o.windup > 0;
  const lift = w ? -18 : o.charging ? -6 : 0;
  ctx.translate(0, Math.abs(run) * -1.2);
  if (o.enraged) { ctx.fillStyle = 'rgba(255,60,40,0.22)'; ctx.beginPath(); ctx.ellipse(0, -30, 26, 34, 0, 0, Math.PI * 2); ctx.fill(); }
  box(ctx, -10 + run * 2, -14, 7, 14, '#2f7a52', C.line, 1.4); box(ctx, 3 - run * 2, -14, 7, 14, '#2f7a52', C.line, 1.4);
  ctx.fillStyle = C.gold; ctx.fillRect(-10 + run * 2, -4, 7, 2); ctx.fillRect(3 - run * 2, -4, 7, 2);
  box(ctx, -13, -22, 26, 10, '#a3262a', C.line, 1.4);                                  // ผ้านุ่งแดงลายทอง
  ctx.fillStyle = C.gold; for (let i = 0; i < 5; i++) ctx.fillRect(-12 + i * 5.5, -18, 3, 3);
  box(ctx, -14, -44, 28, 23, '#3a9a62', C.line, 1.5);                                  // ลำตัวเขียว
  box(ctx, -15, -46, 30, 8, C.gold, C.line, 1.3);                                      // กรองคอทอง
  ctx.fillStyle = '#a3262a'; for (let i = 0; i < 4; i++) ctx.fillRect(-11 + i * 7, -44, 3, 3);
  ctx.fillStyle = C.gold; ctx.fillRect(-14, -30, 28, 2.5);                              // ทับทรวง/เข็มขัด
  box(ctx, -20, -42, 7, 18, '#3a9a62', C.line, 1.3);                                   // แขนซ้าย
  ctx.save(); ctx.translate(16, -40 + lift * 0.3); ctx.rotate(w ? -1.6 : o.charging ? -0.5 : 0.25 + run * 0.15);
  box(ctx, -3, 0, 7, 18, '#3a9a62', C.line, 1.3);                                      // แขนถือกระบอง
  box(ctx, -2, 14, 6, 26, '#6b4423', C.line, 1.3);                                     // ด้ามกระบอง
  box(ctx, -6, 36, 14, 18, '#4a2e17', C.line, 1.5);                                    // หัวกระบอง
  ctx.fillStyle = C.gold; ctx.fillRect(-6, 38, 14, 2.5); ctx.fillRect(-6, 48, 14, 2.5);
  ctx.restore();
  box(ctx, -11, -64, 22, 19, '#3fae6c', C.line, 1.5);                                  // หน้า
  ctx.fillStyle = '#f4ecd8'; ctx.fillRect(-9, -58, 7, 5); ctx.fillRect(2, -58, 7, 5);    // ตาโปน
  ctx.fillStyle = w || o.enraged ? '#ff3a2a' : '#1b1410'; ctx.fillRect(-6, -57, 3, 3); ctx.fillRect(5, -57, 3, 3);
  ctx.fillStyle = '#7a1420'; ctx.fillRect(-7, -50, 14, 3);
  poly(ctx, [-7, -50, -5, -45, -4, -50], '#f4ecd8', null); poly(ctx, [7, -50, 5, -45, 4, -50], '#f4ecd8', null);  // เขี้ยวงอก
  box(ctx, -12, -68, 24, 6, C.gold, C.line, 1.3);                                      // ชฎา
  poly(ctx, [-10, -68, 0, -96, 10, -68], C.gold, C.line, 1.4);
  ctx.fillStyle = C.goldHi; for (let i = 0; i < 4; i++) ctx.fillRect(-1.5, -90 + i * 5, 3, 2);
  ctx.fillStyle = '#a3262a'; ctx.fillRect(-2, -75, 4, 4);
}

// o: { t, moving, face(1/-1), charging, windup, flash, dying(0..1), level }
export function drawMonster(ctx, type, x, y, o) {
  const big = type === 'bigboar' ? 1.45 : type === 'piglet' ? 0.75 : 1;
  ctx.save();
  if (o.dying > 0) ctx.globalAlpha = Math.max(0, 1 - o.dying);
  if (type === 'krasue' || type === 'phi_phong' || type === 'hatsadi') shadow(ctx, x, y, 10, 3, 0.18);
  else if (type === 'khotchasi') shadow(ctx, x, y, 22, 6);
  else if (type === 'khotchasi_king') shadow(ctx, x, y, 40, 11, 0.32);
  else if (type === 'yak') shadow(ctx, x, y, 30, 9, 0.32);
  else shadow(ctx, x, y, 13 * big, 4.5 * big);
  if (o.recoil > 0) ctx.translate(o.kbx * o.recoil * 30, o.kby * o.recoil * 20);   // สะดุ้งถอยตอนโดนฟัน
  ctx.translate(x, y);
  ctx.scale(SCALE, SCALE);
  if (o.recoil > 0) ctx.scale(1 + o.recoil * 0.8, 1 - o.recoil * 0.8);
  if (o.stun) ctx.rotate(Math.sin(o.t * 30) * 0.06);                                    // ขยายให้สมกับตัวละครสูงแบบเอโดเรีย
  if (o.windup > 0 && type !== 'krasue' && type !== 'yak' && type !== 'khotchasi_king') ctx.translate(Math.sin(o.t * 60) * 1.2, 0);
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
  else if (type === 'khotchasi_king') {                       // พญาคชสีห์ทองคำ: ตัวใหญ่เกือบสองเท่า ไอทองรอบตัว คลั่งแล้วแดง
    const gl = ctx.createRadialGradient(4, -14, 2, 4, -14, 30);
    gl.addColorStop(0, o.enraged ? 'rgba(255,80,40,0.45)' : 'rgba(255,215,80,0.4)'); gl.addColorStop(1, 'rgba(255,200,60,0)');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(4, -14, 30, 0, Math.PI * 2); ctx.fill();
    ctx.scale(1.9, 1.9); khotchasi(ctx, o);
  }
  else if (type === 'naga_noi') nagaNoi(ctx, o);
  else if (type === 'hatsadi') hatsadi(ctx, o);
  ctx.restore();
}

export function monsterHeight(type) {
  return Math.round(({ piglet: 18, boar: 24, bigboar: 34, monkey: 34, krasue: 50, phi_pob: 42, phi_phong: 40, yak: 96, khotchasi: 32, naga_noi: 40, hatsadi: 50, khotchasi_king: 62 }[type] || 26) * SCALE);
}

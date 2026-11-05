// อสูรบท 5 (เมืองบาดาล) และบท 6 (กรุงลงกา) วาดด้วยโค้ด — เรียกจาก drawMonster ใน monsters.js
// ทุกตัว: จุด (0,0) = เท้า หันขวา (monsters.js กลับด้านให้เอง) · o = { t, moving, walk, windup, charging, enraged }
import { C, box, poly, circle } from './draw.js';

const LANKA = { leg: '#4a1e22', body: '#8a2a2e', face: '#a8383a', cloth: '#2a2438' };       // ยักษ์พลลงกา: กายแดงคล้ำ ผ้าดำม่วง
const THOTSAKAN = { leg: '#1f5a3a', body: '#2a7a4a', face: '#2f9a5a', cloth: '#c8302a' };   // ทศกัณฐ์: พักตร์เขียว ผ้าแดงลายทอง

function nagaSoldier(ctx, o) {                    // นาคทหาร: กายคนครึ่งงู เกล็ดเขียวคราม ถือตรีศูล
  const sway = Math.sin(o.t * 3) * 1.5, up = o.windup > 0 ? -8 : 0;
  for (let i = 0; i < 4; i++) circle(ctx, -10 + i * 4, -3 - Math.sin(i + o.t * 4) * 1.2, 4.2, i % 2 ? '#1f6a6a' : '#2a8a84', C.line, 1);   // หางขด
  poly(ctx, [-5, -6, 5, -6, 6, -16, -6, -16], '#2a8a84', C.line, 1.1);
  box(ctx, -6, -30 + sway * 0.3, 12, 15, '#3aa8a0', C.line, 1.2);                          // ลำตัวเกล็ด
  ctx.fillStyle = '#c8f0d8'; ctx.fillRect(-2, -28 + sway * 0.3, 4, 12);                    // ท้องเกล็ดอ่อน
  ctx.fillStyle = C.gold; ctx.fillRect(-6, -24 + sway * 0.3, 12, 2);
  box(ctx, -5, -41 + sway * 0.4, 10, 11, '#3aa8a0', C.line, 1.2);                          // หัวงู
  poly(ctx, [-6, -41 + sway * 0.4, -3, -49, 0, -42, 3, -50, 6, -41 + sway * 0.4], C.gold, C.line, 1);   // หงอนทอง
  ctx.fillStyle = o.windup > 0 ? '#ffffff' : '#ffd24a'; ctx.fillRect(1, -37 + sway * 0.4, 2, 2); ctx.fillRect(-3, -37 + sway * 0.4, 2, 2);
  ctx.save(); ctx.translate(8, -26 + up); ctx.rotate(o.windup > 0 ? -1.2 : -0.15);
  box(ctx, -1, -26, 2.5, 34, '#6b4423', C.line, 1);                                          // ด้ามตรีศูล
  poly(ctx, [-5, -26, -4, -34, -3, -27, 0, -38, 3, -27, 4, -34, 5, -26], '#cfe6f0', C.line, 1);
  ctx.restore();
}

function mermaid(ctx, o) {                        // นางเงือก: ท่อนบนหญิง ผมดำยาว ท่อนล่างหางปลาเขียวมรกต ร่ายลูกน้ำ
  const flick = Math.sin(o.t * 4) * 3;
  ctx.fillStyle = 'rgba(60,170,210,0.28)'; ctx.beginPath(); ctx.ellipse(0, -1, 15, 4, 0, 0, Math.PI * 2); ctx.fill();
  poly(ctx, [-6, -14, 6, -14, 4, -4, -8, 0, -14, -2], '#2aa88a', C.line, 1.2);              // หางปลา
  poly(ctx, [-14, -2, -20 + flick, -8, -19 + flick, 2], '#5ad0b0', C.line, 1);             // ครีบหาง
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (let i = 0; i < 3; i++) ctx.fillRect(-6 + i * 4, -11 + i, 2, 2);   // เกล็ดวาว
  box(ctx, -5, -27, 10, 13, '#f1d2b0', C.line, 1.1);
  ctx.fillStyle = C.gold; ctx.fillRect(-5, -24, 10, 3);                                      // ทับทรวงทอง
  poly(ctx, [-6, -38, 6, -38, 8, -16, 5, -26, -5, -26, -8, -16], '#1b1410', null);         // ผมยาวสยาย
  box(ctx, -5, -38, 10, 11, '#f1d2b0', C.line, 1.1);
  poly(ctx, [-5, -38, 0, -44, 5, -38], C.gold, C.line, 0.8);                                // รัดเกล้า
  ctx.fillStyle = '#1b1410'; ctx.fillRect(-3, -34, 2, 2); ctx.fillRect(1, -34, 2, 2);
  const glow = o.windup > 0 ? 4 + o.windup * 5 : 2.5;
  circle(ctx, 9, -22, glow, 'rgba(120,220,255,0.75)', null);
}

function seaCrab(ctx, o) {                        // ปูยักษ์บาดาล: กระดองแดงส้ม ก้ามใหญ่สองข้าง ตาก้านยาว
  const run = o.moving ? Math.sin((o.walk || 0) * Math.PI * 4) : 0, open = o.windup > 0 ? 4 : o.charging ? 2 : 0;
  ctx.strokeStyle = '#8a2a1a'; ctx.lineWidth = 2.2;
  for (let i = 0; i < 3; i++) for (const sd of [-1, 1]) {                                   // ขา 6 ขา
    ctx.beginPath(); ctx.moveTo(sd * (6 + i * 3), -8); ctx.lineTo(sd * (14 + i * 3), -10 + (i % 2 ? run : -run) * 2); ctx.lineTo(sd * (16 + i * 3), 0); ctx.stroke();
  }
  ctx.fillStyle = '#d8502a'; ctx.beginPath(); ctx.ellipse(0, -12, 15, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = C.line; ctx.lineWidth = 1.4; ctx.stroke();
  ctx.fillStyle = '#f08a4a'; ctx.beginPath(); ctx.ellipse(-2, -15, 8, 4, 0, 0, Math.PI * 2); ctx.fill();   // แสงบนกระดอง
  for (const sd of [-1, 1]) {                                                                // ก้าม
    box(ctx, sd > 0 ? 12 : -18, -22, 6, 6, '#d8502a', C.line, 1.1);
    poly(ctx, [sd * 15, -22, sd * 24, -26 - open, sd * 22, -20, sd * 25, -16 + open, sd * 15, -17], '#e8602a', C.line, 1.2);
  }
  ctx.strokeStyle = '#8a2a1a'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-4, -20); ctx.lineTo(-5, -27); ctx.moveTo(4, -20); ctx.lineTo(5, -27); ctx.stroke();   // ก้านตา
  circle(ctx, -5, -28, 2.2, o.windup > 0 ? '#ff3a2a' : '#1b1410', null); circle(ctx, 5, -28, 2.2, o.windup > 0 ? '#ff3a2a' : '#1b1410', null);
}

function nagaKing(ctx, o) {                       // พญานาคราช: นาคเจ็ดเศียรขดตัวใหญ่ เกล็ดมรกตทอง มงกุฎทุกเศียร
  const gl = ctx.createRadialGradient(0, -40, 4, 0, -40, 70);
  gl.addColorStop(0, o.enraged ? 'rgba(255,70,40,0.4)' : 'rgba(90,220,200,0.35)'); gl.addColorStop(1, 'rgba(60,200,180,0)');
  ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, -40, 70, 0, Math.PI * 2); ctx.fill();
  for (let i = 0; i < 7; i++) {                                                              // ขดลำตัวเป็นวงซ้อน
    const a = i / 7 * Math.PI * 2 + o.t * 0.6;
    circle(ctx, Math.cos(a) * 20, -6 + Math.sin(a) * 6, 9, i % 2 ? '#1f7a5a' : '#2a9a6a', C.line, 1.3);
  }
  ctx.strokeStyle = C.line; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(0, -8); ctx.quadraticCurveTo(10, -30, 0, -52); ctx.stroke();
  ctx.strokeStyle = '#2a9a6a'; ctx.lineWidth = 13; ctx.stroke();
  ctx.strokeStyle = '#e8e0a0'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(3, -10); ctx.quadraticCurveTo(12, -30, 3, -50); ctx.stroke();   // ท้องเกล็ดทอง
  poly(ctx, [-30, -50, 0, -66, 30, -50, 26, -44, 0, -56, -26, -44], '#1f7a5a', C.line, 1.4);   // พังพานแผ่
  const heads = [[-26, -62], [-17, -70], [-8, -76], [0, -79], [8, -76], [17, -70], [26, -62]];
  heads.forEach(([hx, hy], i) => {                                                           // เจ็ดเศียร: คองอกจากพังพาน หัวงูมีหงอนทอง
    const sw = Math.sin(o.t * 3 + i) * 1.5, k = i === 3 ? 1.3 : 1, x = hx + sw;
    ctx.strokeStyle = C.line; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(hx * 0.5, -54); ctx.lineTo(x, hy + 2); ctx.stroke();
    ctx.strokeStyle = '#2a9a6a'; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = '#2a9a6a'; ctx.beginPath(); ctx.ellipse(x + 1 * k, hy - 2 * k, 6 * k, 4.5 * k, 0.15, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = C.line; ctx.lineWidth = 1.1; ctx.stroke();
    poly(ctx, [x - 4 * k, hy - 5 * k, x - 2 * k, hy - 11 * k, x, hy - 6 * k, x + 2 * k, hy - 12 * k, x + 4 * k, hy - 5 * k], C.gold, C.line, 0.9);
    ctx.fillStyle = o.windup > 0 || o.enraged ? '#ff3a2a' : '#ffd24a'; ctx.fillRect(x + 2 * k, hy - 4 * k, 2, 2);
    ctx.fillStyle = '#c83a3a'; ctx.fillRect(x + 6 * k, hy - 1 * k, 3 * k, 1);                // ลิ้นแลบ
  });
  if (o.windup > 0) circle(ctx, 0, -60, 8 + o.windup * 10, 'rgba(120,220,255,0.35)', null);
}

function rakshasi(ctx, o) {                       // นางยักษ์เหาะ: กายม่วงคล้ำ ผมฟู เขี้ยวงอก ผ้าแดง ร่ายลูกไฟ
  const bob = Math.sin(o.t * 3) * 3, sway = Math.sin(o.t * 4) * 3;
  ctx.translate(0, -18 + bob);
  ctx.strokeStyle = 'rgba(200,40,40,0.8)'; ctx.lineWidth = 2.5;                              // ผ้าแดงพลิ้ว
  ctx.beginPath(); ctx.moveTo(-6, -18); ctx.quadraticCurveTo(-18 + sway, -6, -12 + sway, 8); ctx.stroke();
  poly(ctx, [-7, -8, 7, -8, 9, 8, -9, 8], '#a3262a', C.line, 1.1);
  box(ctx, -6, -21, 12, 13, '#6a4a7a', C.line, 1.1);
  ctx.fillStyle = C.gold; ctx.fillRect(-6, -18, 12, 2);
  circle(ctx, 0, -34, 9, '#1b1410', null);                                                   // ผมฟูยุ่ง
  box(ctx, -5, -33, 10, 11, '#7a5a8a', C.line, 1.1);
  ctx.fillStyle = '#ffd24a'; ctx.fillRect(-3, -29, 2, 2); ctx.fillRect(1, -29, 2, 2);
  poly(ctx, [-3, -23, -2, -19, -1, -23], '#f4ecd8', null); poly(ctx, [3, -23, 2, -19, 1, -23], '#f4ecd8', null);   // เขี้ยว
  const glow = o.windup > 0 ? 5 + o.windup * 5 : 3;
  circle(ctx, 10, -14, glow, 'rgba(255,140,40,0.8)', null); circle(ctx, 10, -14, glow * 0.5, 'rgba(255,240,160,0.9)', null);
}

function warElephant(ctx, o) {                    // ช้างศึกลงกา: ช้างดำงายยาว สวมเกราะแดงดำ มีสัปคับบนหลัง
  const run = o.moving ? Math.sin((o.walk || 0) * Math.PI * 2) : 0, lean = o.charging ? 3 : 0;
  ctx.fillStyle = '#3a3a44'; [-11, -4, 4, 11].forEach((lx, i) => ctx.fillRect(lx, -9 + (i % 2 ? run : -run) * 1.5, 5, 9));
  poly(ctx, [-15, -26, 10 + lean, -28, 15 + lean, -10, -14, -8], '#4a4a56', C.line, 1.5);   // ลำตัว
  box(ctx, -12, -28, 20, 7, '#8a1e22', C.line, 1.1); ctx.fillStyle = '#1b1410'; ctx.fillRect(-12, -23, 20, 2);   // ผ้าเกราะ
  box(ctx, -8, -38, 12, 10, '#5a3a2a', C.line, 1.1); poly(ctx, [-9, -38, -2, -44, 5, -38], '#c8302a', C.line, 1);   // สัปคับ
  box(ctx, 8 + lean, -32, 11, 13, '#4a4a56', C.line, 1.3);                                    // หัว
  box(ctx, 8 + lean, -33, 11, 4, '#8a1e22', C.line, 1);                                       // เกราะหน้า
  ctx.strokeStyle = '#4a4a56'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(18 + lean, -22); ctx.quadraticCurveTo(24 + lean, -10, 19 + lean, -2); ctx.stroke();   // งวง
  ctx.strokeStyle = '#f4ecd8'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(16 + lean, -21); ctx.quadraticCurveTo(26 + lean, -18, 28 + lean, -26); ctx.stroke();   // งา
  ctx.fillStyle = o.windup > 0 ? '#ff3a2a' : '#ffd24a'; ctx.fillRect(14 + lean, -28, 2, 2);
}

function miniHead(ctx, x, y, P, o) {             // เศียรเล็กของทศกัณฐ์
  box(ctx, x - 5, y - 8, 10, 9, P.face, C.line, 1);
  ctx.fillStyle = '#f4ecd8'; ctx.fillRect(x - 4, y - 6, 3, 2.5); ctx.fillRect(x + 1, y - 6, 3, 2.5);
  ctx.fillStyle = o.windup > 0 || o.enraged ? '#ff3a2a' : '#1b1410'; ctx.fillRect(x - 3, y - 5.5, 1.5, 1.5); ctx.fillRect(x + 2, y - 5.5, 1.5, 1.5);
  poly(ctx, [x - 5, y - 8, x, y - 15, x + 5, y - 8], C.gold, C.line, 0.9);
}

// yak = ฟังก์ชันวาดยักษ์จาก monsters.js (ส่งเข้ามาเพื่อไม่ให้ไฟล์อ้างกันวน)
export const DEEP = {
  naga_soldier: (ctx, o) => nagaSoldier(ctx, o),
  mermaid: (ctx, o) => mermaid(ctx, o),
  sea_crab: (ctx, o) => seaCrab(ctx, o),
  naga_king: (ctx, o) => { ctx.scale(1.25, 1.25); nagaKing(ctx, o); },
  rakshasi: (ctx, o) => rakshasi(ctx, o),
  war_elephant: (ctx, o) => warElephant(ctx, o),
  lanka_yak: (ctx, o, yak) => { ctx.scale(0.62, 0.62); yak(ctx, o, LANKA); },
  thotsakan: (ctx, o, yak) => {                    // ทศกัณฐ์: ยักษ์สิบหน้า (เศียรหลัก + เศียรเล็กเก้าเศียร) รัศมีแดงทอง
    const gl = ctx.createRadialGradient(0, -60, 4, 0, -60, 70);
    gl.addColorStop(0, o.enraged ? 'rgba(255,50,20,0.5)' : 'rgba(255,170,60,0.35)'); gl.addColorStop(1, 'rgba(255,120,40,0)');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, -60, 70, 0, Math.PI * 2); ctx.fill();
    ctx.scale(1.35, 1.35); yak(ctx, o, THOTSAKAN);
    for (const [x, y] of [[-20, -52], [-29, -60], [20, -52], [29, -60], [-15, -74], [-24, -80], [15, -74], [24, -80], [0, -100]]) miniHead(ctx, x, y, THOTSAKAN, o);
  },
};
export const DEEP_FLYING = new Set(['rakshasi']);
export const DEEP_HEIGHT = { naga_soldier: 52, mermaid: 46, sea_crab: 34, naga_king: 120, lanka_yak: 64, rakshasi: 62, war_elephant: 46, thotsakan: 150 };
export const DEEP_SHADOW = { naga_king: [42, 12], thotsakan: [44, 12], war_elephant: [24, 7], sea_crab: [20, 6] };

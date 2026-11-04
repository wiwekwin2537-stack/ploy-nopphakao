// อาคารทรงไทย: กำแพงเวียง ซุ้มประตู อุโบสถ ศาลา เรือนใต้ถุนสูง กระท่อมนา
// จุด (0,0) = มุมล่างซ้ายของฐาน ขนาดฐาน fw x fh
import { C, shadow, box, poly, circle } from './draw.js';

function bairaka(g, x0, y0, x1, y1, n) {        // ใบระกา: ฟันเลื่อยทองตามแนวหน้าจั่ว
  for (let i = 0; i < n; i++) {
    const t0 = i / n, t1 = (i + 0.5) / n;
    const ax = x0 + (x1 - x0) * t0, ay = y0 + (y1 - y0) * t0;
    const bx = x0 + (x1 - x0) * t1, by = y0 + (y1 - y0) * t1;
    poly(g, [ax, ay, bx, by - 5, x0 + (x1 - x0) * ((i + 1) / n), y0 + (y1 - y0) * ((i + 1) / n)], C.gold, null);
  }
}
function chofa(g, x, y, s = 1, flip = 1) {     // ช่อฟ้า: ปลายโค้งงอนสีทอง
  g.strokeStyle = C.ink; g.lineWidth = 4 * s; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x, y - 14 * s, x + 8 * s * flip, y - 18 * s); g.stroke();
  g.strokeStyle = C.gold; g.lineWidth = 2.4 * s; g.stroke(); g.lineCap = 'butt';
}
function gable(g, cx, base, half, height, fill, trim) {
  poly(g, [cx - half, base, cx, base - height, cx + half, base], trim, C.ink, 1.5);
  poly(g, [cx - half + 7, base - 2, cx, base - height + 10, cx + half - 7, base - 2], fill, null);
  bairaka(g, cx - half, base, cx, base - height, 7); bairaka(g, cx, base - height, cx + half, base, 7);
  chofa(g, cx, base - height, 1, 1);
  chofa(g, cx - half, base, 0.7, -1); chofa(g, cx + half, base, 0.7, 1);
}

export const BUILDINGS = {
  thicket: { hidden: true },
  wall_h: { pad: [2, 52, 2, 4], draw(g, fw, fh) {
    box(g, 0, -fh - 30, fw, fh, C.plaster, C.ink, 1.5);                         // ทางเดินบนกำแพง
    box(g, 0, -32, fw, 32, C.brick, C.ink, 1.5);                                // หน้ากำแพงอิฐ
    g.strokeStyle = C.brickDark; g.lineWidth = 1;
    for (let y = -26; y < 0; y += 7) { g.beginPath(); g.moveTo(1, y); g.lineTo(fw - 1, y); g.stroke(); }
    for (let y = -32, r = 0; y < 0; y += 7, r++) for (let x = (r % 2) * 9; x < fw; x += 18) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 7); g.stroke(); }
    for (let x = 4; x < fw - 10; x += 22) {                                    // ใบเสมาบนกำแพง
      poly(g, [x, -fh - 30, x, -fh - 40, x + 6, -fh - 46, x + 12, -fh - 40, x + 12, -fh - 30], C.plaster, C.ink, 1.3);
    }
  } },
  wall_v: { pad: [2, 52, 2, 4], draw(g, fw, fh) {
    box(g, 0, -fh - 30, fw, fh, C.plaster, C.ink, 1.5);
    g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(fw / 2, -fh - 30, fw / 2, fh);
    for (let y = -fh - 24; y < -40; y += 24) poly(g, [4, y, 4, y - 8, fw / 2, y - 14, fw - 4, y - 8, fw - 4, y], C.plaster, C.ink, 1.2);
    box(g, 0, -32, fw, 32, C.brick, C.ink, 1.5);
  } },
  gate: { pad: [30, 165, 30, 6], draw(g, fw) {
    box(g, -16, -96, 16, 96, C.plaster, C.ink, 1.5); box(g, fw, -96, 16, 96, C.plaster, C.ink, 1.5);
    g.fillStyle = C.red; g.fillRect(-12, -90, 8, 70); g.fillRect(fw + 4, -90, 8, 70);
    box(g, -22, -104, fw + 44, 10, C.plaster, C.ink, 1.5);
    poly(g, [-26, -104, fw / 2, -122, fw + 26, -104], C.red, C.ink, 1.5);
    gable(g, fw / 2, -104, fw / 2 + 18, 32, C.red, C.gold);
    g.fillStyle = C.gold; g.font = 'bold 9px sans-serif'; g.textAlign = 'center';
  } },
  temple: { pad: [40, 90, 40, 8], draw(g, fw, fh) {
    shadow(g, fw / 2, -4, fw / 2 + 20, 14, 0.25);
    box(g, -14, -20, fw + 28, 20, C.plaster, C.ink, 1.6);                        // ฐานไพที
    box(g, fw / 2 - 30, -12, 60, 12, '#d8ccb0', C.ink, 1.2);                     // บันได
    for (let i = 1; i < 3; i++) { g.strokeStyle = C.ink; g.lineWidth = 1; g.beginPath(); g.moveTo(fw / 2 - 30, -12 + i * 4); g.lineTo(fw / 2 + 30, -12 + i * 4); g.stroke(); }
    box(g, 14, -92, fw - 28, 72, '#f4efe4', C.ink, 1.6);                         // ผนังอุโบสถ
    for (let x = 22; x < fw - 20; x += 36) { box(g, x, -92, 8, 72, '#e3d8c0', C.ink, 1); g.fillStyle = C.gold; g.fillRect(x, -92, 8, 4); }
    box(g, fw / 2 - 18, -76, 36, 56, C.red, C.ink, 1.5);                         // ประตู
    g.fillStyle = C.gold; g.fillRect(fw / 2 - 1, -76, 2, 56);
    poly(g, [fw / 2 - 22, -76, fw / 2, -96, fw / 2 + 22, -76], C.gold, C.ink, 1.2); // ซุ้มประตู
    [fw * 0.22, fw * 0.34, fw * 0.66, fw * 0.78].forEach((x) => { box(g, x - 9, -70, 18, 26, C.red, C.ink, 1.2); g.fillStyle = C.gold; g.fillRect(x - 9, -72, 18, 3); });
    // หลังคาซ้อนชั้น
    poly(g, [-10, -92, fw * 0.18, -150, fw * 0.82, -150, fw + 10, -92], C.red, C.ink, 1.6);
    g.fillStyle = C.leaf; g.fillRect(-4, -100, fw + 8, 5);
    poly(g, [fw * 0.1, -132, fw * 0.28, -190, fw * 0.72, -190, fw * 0.9, -132], C.redHi, C.ink, 1.6);
    g.fillStyle = C.leaf; g.fillRect(fw * 0.13, -140, fw * 0.74, 5);
    chofa(g, -10, -92, 0.9, -1); chofa(g, fw + 10, -92, 0.9, 1);
    chofa(g, fw * 0.1, -132, 0.9, -1); chofa(g, fw * 0.9, -132, 0.9, 1);
    gable(g, fw / 2, -178, fw * 0.2, 78, C.red, C.gold);                          // หน้าบันทอง
    circle(g, fw / 2, -205, 8, C.gold, C.ink, 1.2); circle(g, fw / 2, -205, 4, C.red, null);
  } },
  sala: { pad: [24, 145, 24, 6], draw(g, fw, fh) {
    shadow(g, fw / 2, -3, fw / 2 + 12, 9);
    box(g, -6, -14, fw + 12, 14, '#9a7446', C.ink, 1.5);                          // พื้นยกไม้
    g.fillStyle = 'rgba(40,24,12,0.55)'; g.fillRect(4, -fh - 30, fw - 8, fh + 16);
    [6, fw * 0.36, fw * 0.64 - 8, fw - 14].forEach((x) => box(g, x, -fh - 40, 8, fh + 26, C.red, C.ink, 1.3));
    poly(g, [-14, -fh - 36, fw * 0.2, -fh - 80, fw * 0.8, -fh - 80, fw + 14, -fh - 36], C.red, C.ink, 1.6);
    g.fillStyle = C.leaf; g.fillRect(-8, -fh - 44, fw + 16, 4);
    gable(g, fw / 2, -fh - 70, fw * 0.24, 48, C.red, C.gold);
    chofa(g, -14, -fh - 36, 0.8, -1); chofa(g, fw + 14, -fh - 36, 0.8, 1);
  } },
  house: { pad: [20, 135, 20, 6], draw(g, fw, fh) {                              // เรือนไทยใต้ถุนสูง
    shadow(g, fw / 2, -3, fw / 2 + 8, 8);
    for (let x = 8; x < fw - 4; x += (fw - 18) / 3) box(g, x, -34, 6, 34, C.teakDark, C.ink, 1.2); // เสาใต้ถุน
    box(g, 0, -40, fw, 8, C.teak, C.ink, 1.4);
    box(g, 6, -fh - 50, fw - 12, fh + 10, '#8a5a32', C.ink, 1.5);               // ฝาปะกน
    g.strokeStyle = C.teakDark; g.lineWidth = 1;
    for (let x = 12; x < fw - 8; x += 12) { g.beginPath(); g.moveTo(x, -fh - 48); g.lineTo(x, -42); g.stroke(); }
    box(g, fw / 2 - 10, -76, 20, 36, '#5a3a20', C.ink, 1.3);                    // ประตู
    box(g, 14, -74, 16, 14, '#3a2414', C.ink, 1.1); box(g, fw - 30, -74, 16, 14, '#3a2414', C.ink, 1.1);
    for (let i = 0; i < 4; i++) box(g, fw / 2 - 8, -34 + i * 9, 16, 2.5, C.teak, null);  // บันได
    g.fillStyle = C.teak; g.fillRect(fw / 2 - 9, -38, 2, 38); g.fillRect(fw / 2 + 7, -38, 2, 38);
    poly(g, [-8, -fh - 44, fw / 2, -fh - 110, fw + 8, -fh - 44], '#7a3a24', C.ink, 1.6);  // หลังคาจั่วสูง
    poly(g, [4, -fh - 48, fw / 2, -fh - 100, fw - 4, -fh - 48], '#a04a2c', null);
    g.strokeStyle = '#5a2a18'; g.lineWidth = 1;
    for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(fw / 2 - i * fw * 0.08, -fh - 100 + i * 9.5); g.lineTo(fw / 2 + i * fw * 0.08, -fh - 100 + i * 9.5); g.stroke(); }
    g.strokeStyle = C.ink; g.lineWidth = 4; g.beginPath(); g.moveTo(fw / 2 - 12, -fh - 122); g.lineTo(fw / 2 + 4, -fh - 104); g.moveTo(fw / 2 + 12, -fh - 122); g.lineTo(fw / 2 - 4, -fh - 104); g.stroke();
    g.strokeStyle = C.teak; g.lineWidth = 2.4; g.stroke();                       // กาแล
  } },
  hut: { pad: [20, 90, 20, 6], draw(g, fw, fh) {                                // กระท่อมปลายนา
    shadow(g, fw / 2, -3, fw / 2 + 6, 7);
    [6, fw - 12].forEach((x) => box(g, x, -26, 6, 26, C.teakDark, C.ink, 1.2));
    box(g, 2, -30, fw - 4, 6, '#9a7446', C.ink, 1.3);
    box(g, 8, -fh - 34, fw - 16, fh + 4, '#a88a58', C.ink, 1.4);
    g.strokeStyle = '#7a6038'; g.lineWidth = 1; for (let x = 14; x < fw - 10; x += 7) { g.beginPath(); g.moveTo(x, -fh - 32); g.lineTo(x, -31); g.stroke(); }
    poly(g, [-10, -fh - 30, fw / 2, -fh - 80, fw + 10, -fh - 30], C.thatch, C.ink, 1.5);
    g.strokeStyle = C.thatchDark; for (let i = -5; i <= 5; i++) { g.beginPath(); g.moveTo(fw / 2 + i * 3, -fh - 76); g.lineTo(fw / 2 + i * (fw / 10), -fh - 32); g.stroke(); }
  } },
};

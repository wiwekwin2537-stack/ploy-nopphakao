// ของในวัดร้าง: ซุ้มประตูศิลาแลงพัง เสา เจดีย์ร้าง สิงห์หิน คบเพลิง เศษหิน บันได
// จุด (0,0) = มุมล่างซ้ายของฐาน ขนาดฐาน fw x fh (แบบเดียวกับ props.js)
import { C, shadow, box, poly, circle, hash2 } from './draw.js';

const LAT = '#8a4e34', LAT_D = '#5e3322', LAT_HI = '#a8664a', MOSS = '#5f7f3e';

function laterite(g, x, y, w, h, seed) {           // ก้อนศิลาแลงเป็นรูพรุน
  box(g, x, y, w, h, LAT, C.line, 1.3);
  g.fillStyle = LAT_D;
  for (let i = 0; i < (w * h) / 60; i++) g.fillRect(x + 2 + hash2(seed, i, 3) * (w - 5), y + 2 + hash2(seed, i, 4) * (h - 5), 1.6, 1.6);
  g.fillStyle = 'rgba(0,0,0,0.25)';
  for (let yy = y + 8; yy < y + h - 2; yy += 8) g.fillRect(x + 1, yy, w - 2, 1.2);
}

export const RUINS = {
  ruin_gate: { pad: [16, 120, 16, 6], draw(g, fw, fh, seed) {      // ซุ้มประตูวัดร้างบนทุ่งนา (ทางเข้าดันเจี้ยน)
    shadow(g, fw / 2, -2, fw / 2 + 10, 9, 0.3);
    laterite(g, 0, -100, 30, 100, seed); laterite(g, fw - 30, -86, 30, 86, seed + 1);
    poly(g, [fw - 30, -86, fw - 18, -96, fw, -90, fw, -86], LAT_HI, C.line, 1.2);       // ยอดเสาพัง
    laterite(g, -4, -116, 44, 16, seed + 2);
    poly(g, [-4, -116, 16, -134, 40, -116], LAT_HI, C.line, 1.3);                      // ยอดซุ้มทรงกลีบบัว
    g.fillStyle = '#120c14'; g.fillRect(30, -70, fw - 60, 70);                         // ช่องมืดลงใต้ดิน
    const gl = g.createLinearGradient(0, -70, 0, 0); gl.addColorStop(0, 'rgba(120,60,160,0.0)'); gl.addColorStop(1, 'rgba(160,90,220,0.35)');
    g.fillStyle = gl; g.fillRect(30, -70, fw - 60, 70);
    for (let i = 0; i < 4; i++) box(g, 34 + i * 3, -14 + i * 3 - 12, fw - 68 - i * 6, 4, '#4a3a40', null);  // ขั้นบันไดลง
    g.fillStyle = MOSS; g.fillRect(2, -60, 6, 22); g.fillRect(fw - 26, -40, 8, 14); g.fillRect(10, -114, 14, 4);
    poly(g, [fw - 30, -6, fw - 10, -18, fw + 8, -4], '#7a6a5a', C.line, 1.2);             // เศษหินกอง
    g.strokeStyle = '#3f6f2f'; g.lineWidth = 2;                                         // เถาวัลย์ห้อย
    g.beginPath(); g.moveTo(18, -116); g.quadraticCurveTo(26, -90, 20, -70); g.stroke();
    circle(g, 20, -70, 3, MOSS, null);
  } },
  pillar: { pad: [6, 70, 6, 4], draw(g, fw, fh, seed) {
    shadow(g, fw / 2, -1, fw / 2 + 6, 5);
    const broken = hash2(seed, 1, 2) > 0.5, top = broken ? -46 : -64;
    laterite(g, 0, top, fw, -top, seed);
    if (broken) poly(g, [0, top, fw * 0.4, top - 8, fw, top + 2], LAT_HI, C.line, 1);
    else box(g, -3, top - 5, fw + 6, 6, LAT_HI, C.line, 1.2);
    g.fillStyle = MOSS; g.fillRect(1, -12, fw - 2, 3);
  } },
  stupa_ruin: { pad: [10, 86, 10, 4], draw(g, fw, fh, seed) {     // เจดีย์ร้างเอียง ยอดหัก
    const cx = fw / 2;
    shadow(g, cx, -1, fw / 2 + 10, 8, 0.3);
    box(g, 0, -12, fw, 12, '#7a7066', C.line, 1.3);
    box(g, 6, -22, fw - 12, 10, '#8a8076', C.line, 1.3);
    g.save(); g.translate(cx, -22); g.rotate(0.08);
    g.fillStyle = '#9a8f84'; g.beginPath(); g.moveTo(-22, 0); g.quadraticCurveTo(-22, -34, 0, -40); g.quadraticCurveTo(22, -34, 22, 0); g.closePath(); g.fill();
    g.strokeStyle = C.line; g.lineWidth = 1.3; g.stroke();                              // องค์ระฆัง
    box(g, -7, -50, 14, 10, '#8a8076', C.line, 1.2);
    poly(g, [-4, -50, 0, -62, 3, -54], '#9a8f84', C.line, 1);                           // ยอดหัก
    g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(-20, -12, 40, 3);
    g.fillStyle = MOSS; g.fillRect(-18, -20, 8, 4); g.fillRect(8, -30, 6, 3);
    g.restore();
    circle(g, cx + 14, -16, 2.5, '#d9a630', null);                                      // ทองเปลวที่คนเคยปิด
  } },
  stone_lion: { pad: [10, 44, 10, 4], draw(g, fw) {               // สิงห์หินเฝ้าวัด
    const cx = fw / 2;
    shadow(g, cx, -1, fw / 2 + 6, 5);
    box(g, 0, -8, fw, 8, '#6e665e', C.line, 1.2);
    poly(g, [cx - 12, -8, cx - 12, -24, cx - 6, -30, cx + 8, -30, cx + 12, -20, cx + 12, -8], '#8f877c', C.line, 1.3);
    box(g, cx - 10, -40, 16, 13, '#9a9286', C.line, 1.3);                              // หัว
    g.fillStyle = '#6e665e'; for (let i = 0; i < 4; i++) g.fillRect(cx - 11 + i * 4, -42, 3, 4);  // แผงคอ
    g.fillStyle = '#c03a2a'; g.fillRect(cx - 6, -36, 2.5, 2.5); g.fillRect(cx + 1, -36, 2.5, 2.5);
    g.fillStyle = '#3a3230'; g.fillRect(cx - 5, -31, 9, 2);
    g.fillStyle = MOSS; g.fillRect(cx + 4, -14, 6, 3);
  } },
  torch: { pad: [16, 46, 16, 4], draw(g, fw) {                    // คบเพลิงติดผนัง
    const cx = fw / 2;
    const gl = g.createRadialGradient(cx, -34, 1, cx, -34, 18); gl.addColorStop(0, 'rgba(255,190,90,0.55)'); gl.addColorStop(1, 'rgba(255,150,60,0)');
    g.fillStyle = gl; g.fillRect(cx - 18, -52, 36, 36);
    box(g, cx - 1.5, -28, 3, 28, C.teakDark, C.line, 1);
    box(g, cx - 4, -31, 8, 4, '#5a4a3a', C.line, 1);
    poly(g, [cx - 4, -31, cx - 2, -40, cx, -36, cx + 2, -44, cx + 4, -31], '#ff9a2a', null);
    poly(g, [cx - 2, -31, cx, -38, cx + 2, -31], '#ffe08a', null);
  } },
  rubble: { pad: [8, 16, 8, 2], draw(g, fw, fh, seed) {
    shadow(g, fw / 2, -1, fw / 2 + 4, 4);
    for (let i = 0; i < 4; i++) {
      const x = hash2(seed, i, 1) * (fw - 10), w = 8 + hash2(seed, i, 2) * 8;
      poly(g, [x, -1, x + 2, -8 - i % 2 * 3, x + w - 2, -9, x + w, -1], i % 2 ? '#7a7066' : LAT, C.line, 1);
    }
  } },
  stairs_down: { flat: true, pad: [2, 2, 2, 2], draw(g, fw, fh) {  // บันไดลงชั้นล่าง: ยิ่งลึกยิ่งมืด
    box(g, 0, -fh, fw, fh, '#141016', C.line, 1.5);
    const n = 5;
    for (let i = 0; i < n; i++) { const k = i / n; g.fillStyle = `rgb(${110 - k * 80},${100 - k * 75},${95 - k * 70})`; g.fillRect(3 + k * 6, -fh + 3 + i * (fh - 6) / n, fw - 6 - k * 12, (fh - 6) / n - 1.5); }
    g.fillStyle = 'rgba(170,120,230,0.25)'; g.fillRect(10, -8, fw - 20, 4);
  } },
  stairs_up: { flat: true, pad: [2, 2, 2, 2], draw(g, fw, fh) {    // บันไดขึ้น: สว่างไปทางทางออก
    box(g, 0, -fh, fw, fh, '#4a4048', C.line, 1.5);
    const vertical = fh > fw, n = 4;
    for (let i = 0; i < n; i++) {
      g.fillStyle = `rgb(${120 + i * 25},${110 + i * 22},${100 + i * 20})`;
      if (vertical) g.fillRect(2 + i * (fw - 4) / n, -fh + 2, (fw - 4) / n - 1, fh - 4);
      else g.fillRect(2, -fh + 2 + i * (fh - 4) / n, fw - 4, (fh - 4) / n - 1);
    }
  } },
  spirit_wall: { pad: [14, 80, 14, 4], draw(g, fw, fh) {        // ม่านเวทหิมพานต์ (หายเมื่อล้มยักษ์วัด)
    const gl = g.createLinearGradient(0, -80, 0, 0); gl.addColorStop(0, 'rgba(150,110,255,0)'); gl.addColorStop(1, 'rgba(150,110,255,0.55)');
    g.fillStyle = gl; g.fillRect(-10, -80 - fh, fw + 20, 80 + fh);
    g.strokeStyle = 'rgba(230,210,255,0.8)'; g.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) { const x = -6 + i * (fw + 12) / 5; g.beginPath(); g.moveTo(x, 0); g.quadraticCurveTo(x + 6, -40 - fh / 2, x - 2, -78 - fh); g.stroke(); }
    for (let i = 0; i < 5; i++) circle(g, hash2(i, 3, 1) * fw, -10 - hash2(i, 4, 1) * (60 + fh), 2, '#f3d27a', null);   // อักขระยันต์ลอย
  } },
  map_altar: { pad: [14, 50, 14, 4], draw(g, fw, fh) {         // แท่นลายแทง: แท่นหินจารึก มีม้วนลายแทงวางบน
    const cx = fw / 2;
    shadow(g, cx, -1, fw / 2 + 8, 5, 0.25);
    box(g, 0, -14, fw, 14, '#8a8076', C.line, 1.3);
    box(g, 4, -30, fw - 8, 16, '#a89c90', C.line, 1.3);
    g.fillStyle = '#6a6058'; for (let i = 0; i < 3; i++) g.fillRect(8, -26 + i * 4, fw - 16, 1.5);   // อักษรจารึก
    box(g, cx - 12, -36, 24, 7, '#f0e2c0', C.line, 1.1);
    g.fillStyle = '#a3262a'; g.fillRect(cx - 14, -37, 4, 9); g.fillRect(cx + 10, -37, 4, 9);
    const gl = g.createRadialGradient(cx, -40, 1, cx, -40, 16); gl.addColorStop(0, 'rgba(255,220,140,0.6)'); gl.addColorStop(1, 'rgba(255,220,140,0)');
    g.fillStyle = gl; g.fillRect(cx - 16, -56, 32, 32);
  } },
  portal: { hidden: true },                                          // ประตูมิติวาดสดใน scene.js (ขยับได้)
};

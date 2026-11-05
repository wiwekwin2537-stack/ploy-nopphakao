// สวรรค์ชั้นดาวดึงส์: ประตูสวรรค์ เสาทองแดง ก้อนเมฆ (จุด (0,0) = มุมล่างซ้ายของฐาน)
import { C, shadow, box, poly, circle, hash2 } from './draw.js';

export const HEAVEN = {
  heaven_gate: { pad: [30, 110, 30, 6], draw(g, fw, fh) {        // ประตูสวรรค์บนยอดไกรลาส (หายเมื่อล้มครุฑราช)
    const cx = fw / 2;
    const gl = g.createRadialGradient(cx, -50, 4, cx, -50, 70);
    gl.addColorStop(0, 'rgba(255,240,180,0.6)'); gl.addColorStop(1, 'rgba(255,220,120,0)');
    g.fillStyle = gl; g.fillRect(cx - 70, -120, 140, 130);
    box(g, cx - 26, -86, 10, 86, C.red, C.line, 1.4); box(g, cx + 16, -86, 10, 86, C.red, C.line, 1.4);
    box(g, cx - 16, -80, 32, 80, '#f3d27a', C.line, 1.4);                            // บานประตูทอง
    g.strokeStyle = '#b8901e'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(cx, -80); g.lineTo(cx, 0); g.stroke();
    for (let i = 0; i < 4; i++) { circle(g, cx - 8, -66 + i * 18, 2.5, '#c8302a', null); circle(g, cx + 8, -66 + i * 18, 2.5, '#c8302a', null); }
    poly(g, [cx - 32, -86, cx, -112, cx + 32, -86], C.gold, C.line, 1.5);           // ยอดซุ้มทรงมงกุฎ
    poly(g, [cx - 4, -112, cx, -124, cx + 4, -112], '#fff6b8', C.line, 1);
  } },
  heaven_pillar: { pad: [8, 78, 8, 4], draw(g, fw) {
    shadow(g, fw / 2, -1, fw / 2 + 6, 4, 0.18);
    box(g, -2, -6, fw + 4, 6, '#f3d27a', C.line, 1.2);
    box(g, 2, -66, fw - 4, 60, C.red, C.line, 1.3);
    g.fillStyle = C.gold; for (let y = -60; y < -10; y += 12) g.fillRect(2, y, fw - 4, 3);   // ลายทองรอบเสา
    box(g, -3, -74, fw + 6, 8, '#f3d27a', C.line, 1.2);
    poly(g, [-3, -74, fw / 2, -80, fw + 3, -74], C.gold, C.line, 1);
  } },
  waypoint: { pad: [16, 60, 16, 4], draw(g, fw) {               // ศาลวาร์ป: ศาลทองเล็กบนแท่นหิน มีผลึกฟ้าเรืองแสง
    const cx = fw / 2;
    const gl = g.createRadialGradient(cx, -30, 2, cx, -30, 26); gl.addColorStop(0, 'rgba(140,220,255,0.55)'); gl.addColorStop(1, 'rgba(140,220,255,0)');
    g.fillStyle = gl; g.fillRect(cx - 26, -56, 52, 52);
    shadow(g, cx, -1, 16, 5, 0.25);
    box(g, cx - 13, -8, 26, 8, '#8a8a92', C.line, 1.2);
    box(g, cx - 2, -26, 4, 18, C.red, C.line, 1);
    box(g, cx - 10, -40, 20, 14, '#f3d27a', C.line, 1.2);
    poly(g, [cx - 12, -40, cx, -52, cx + 12, -40], C.red, C.line, 1.2);
    poly(g, [cx, -38, cx + 5, -33, cx, -28, cx - 5, -33], '#8ad8ff', '#2a6aa8', 1);
    g.fillStyle = '#ffffff'; g.fillRect(cx - 1, -36, 2, 3);
  } },
  waypoint_off: { pad: [16, 60, 16, 4], draw(g, fw) {           // ศาลวาร์ปที่ยังไม่ปลด: หินสีเทาทั้งหลัง ผลึกหมองไม่มีแสง
    const cx = fw / 2;
    shadow(g, cx, -1, 16, 5, 0.25);
    box(g, cx - 13, -8, 26, 8, '#6e6e74', C.line, 1.2);
    box(g, cx - 2, -26, 4, 18, '#7a7a80', C.line, 1);
    box(g, cx - 10, -40, 20, 14, '#9a9aa0', C.line, 1.2);
    poly(g, [cx - 12, -40, cx, -52, cx + 12, -40], '#84848a', C.line, 1.2);
    poly(g, [cx, -38, cx + 5, -33, cx, -28, cx - 5, -33], '#55585e', '#3a3c40', 1);
    g.fillStyle = 'rgba(40,40,44,0.35)'; g.fillRect(cx - 9, -30, 7, 2); g.fillRect(cx + 3, -36, 5, 2);   // รอยร้าว/ฝุ่นจับ
  } },
  cloud_puff: { pad: [16, 26, 16, 4], draw(g, fw, fh, seed) {     // ก้อนเมฆนุ่ม กั้นทาง
    const cx = fw / 2;
    g.fillStyle = 'rgba(150,130,200,0.18)'; g.beginPath(); g.ellipse(cx, -2, fw / 2 + 10, 6, 0, 0, Math.PI * 2); g.fill();
    for (let i = 0; i < 5; i++) {
      const x = cx - 18 + i * 9 + hash2(seed, i, 1) * 4, y = -10 - Math.sin(i / 4 * Math.PI) * 8, r = 8 + hash2(seed, i, 2) * 4;
      circle(g, x, y, r, '#f6f2ff', 'rgba(150,130,190,0.45)', 1.2);
    }
    circle(g, cx - 6, -18, 4, '#ffffff', null);
  } },
};

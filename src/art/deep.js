// ของประกอบฉากบท 5 (เมืองบาดาล) และบท 6 (กรุงลงกา) — จุด (0,0) = มุมล่างซ้ายของฐาน แบบเดียวกับ props.js
import { C, shadow, box, poly, circle, hash2 } from './draw.js';

export const DEEP_PROPS = {
  sea_weed: { pad: [14, 46, 14, 3], draw(g, fw, fh, seed) {     // สาหร่ายทะเลสูงพลิ้ว
    const cx = fw / 2;
    shadow(g, cx, -1, 10, 3, 0.2);
    for (let i = 0; i < 4; i++) {
      const bx = cx - 6 + i * 4, hgt = 26 + hash2(seed, i, 2) * 14, bend = (hash2(seed, i, 5) - 0.5) * 14;
      g.strokeStyle = C.line; g.lineWidth = 4.2; g.beginPath(); g.moveTo(bx, 0); g.quadraticCurveTo(bx + bend, -hgt / 2, bx - bend * 0.4, -hgt); g.stroke();
      g.strokeStyle = i % 2 ? '#2f8a5a' : '#3aa86a'; g.lineWidth = 2.8; g.stroke();
    }
  } },
  coral: { pad: [14, 34, 14, 3], draw(g, fw, fh, seed) {         // ปะการังกิ่งแดงชมพู
    const cx = fw / 2, col = hash2(seed, 1, 1) > 0.5 ? '#e8607a' : '#f08a4a';
    shadow(g, cx, -1, 13, 4, 0.22);
    const branch = (x, y, a, len, d) => {
      const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
      g.strokeStyle = C.line; g.lineWidth = 5 - d; g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
      g.strokeStyle = col; g.lineWidth = 3.4 - d; g.stroke();
      if (d < 2) { branch(x2, y2, a - 0.5, len * 0.7, d + 1); branch(x2, y2, a + 0.5, len * 0.7, d + 1); }
      else circle(g, x2, y2, 1.6, '#ffe0e8', null);
    };
    branch(cx, 0, -Math.PI / 2 - 0.3, 12, 0); branch(cx, 0, -Math.PI / 2 + 0.35, 10, 0);
  } },
  pearl_lamp: { pad: [10, 44, 10, 3], draw(g, fw) {             // โคมไข่มุก: เสาหินมีไข่มุกเรืองแสงบนยอด
    const cx = fw / 2;
    const gl = g.createRadialGradient(cx, -34, 2, cx, -34, 20); gl.addColorStop(0, 'rgba(180,255,250,0.6)'); gl.addColorStop(1, 'rgba(180,255,250,0)');
    g.fillStyle = gl; g.fillRect(cx - 20, -54, 40, 40);
    shadow(g, cx, -1, 8, 3, 0.25);
    box(g, cx - 3, -28, 6, 28, '#6a8a8e', C.line, 1.1);
    poly(g, [cx - 7, -28, cx + 7, -28, cx + 4, -32, cx - 4, -32], '#8aaab0', C.line, 1);
    circle(g, cx, -36, 5, '#e8fffc', '#5ab8b0', 1.2); circle(g, cx - 1.5, -37.5, 1.5, '#ffffff', null);
  } },
  naga_stair: { pad: [34, 70, 34, 6], draw(g, fw) {             // บันไดนาคลงบาดาล (ปิดจนกว่าจะล้มท้าวเวสสุวรรณ)
    const cx = fw / 2;
    const gl = g.createRadialGradient(cx, -24, 4, cx, -24, 60); gl.addColorStop(0, 'rgba(90,220,210,0.5)'); gl.addColorStop(1, 'rgba(60,200,200,0)');
    g.fillStyle = gl; g.fillRect(cx - 60, -84, 120, 90);
    for (const sd of [-1, 1]) {                                     // ราวบันไดนาคสองข้าง
      g.strokeStyle = C.line; g.lineWidth = 9; g.beginPath(); g.moveTo(cx + sd * 18, 0); g.quadraticCurveTo(cx + sd * 26, -30, cx + sd * 14, -54); g.stroke();
      g.strokeStyle = '#2a9a6a'; g.lineWidth = 6.5; g.stroke();
      box(g, cx + sd * 14 - 5, -62, 10, 9, '#2a9a6a', C.line, 1.1);
      poly(g, [cx + sd * 14 - 5, -62, cx + sd * 14, -70, cx + sd * 14 + 5, -62], C.gold, C.line, 1);
      g.fillStyle = '#ffd24a'; g.fillRect(cx + sd * 14 - 1, -59, 2, 2);
    }
    g.fillStyle = 'rgba(20,60,70,0.9)'; g.beginPath(); g.ellipse(cx, -18, 13, 20, 0, 0, Math.PI * 2); g.fill();   // ช่องน้ำวนลึก
    g.strokeStyle = 'rgba(160,240,240,0.7)'; g.lineWidth = 1.4;
    for (let r = 4; r < 14; r += 4) { g.beginPath(); g.ellipse(cx, -18, r, r * 1.5, 0, 0.3, 5.5); g.stroke(); }
  } },
  sea_gate: { pad: [30, 90, 30, 6], draw(g, fw) {               // ประตูน้ำวนสู่ลงกา (ปิดจนกว่าจะล้มพญานาคราช)
    const cx = fw / 2;
    box(g, cx - 26, -76, 10, 76, '#3a6a70', C.line, 1.3); box(g, cx + 16, -76, 10, 76, '#3a6a70', C.line, 1.3);
    poly(g, [cx - 30, -76, cx, -96, cx + 30, -76], '#2a9a6a', C.line, 1.4);
    g.fillStyle = 'rgba(20,80,100,0.92)'; g.fillRect(cx - 16, -76, 32, 76);
    g.strokeStyle = 'rgba(160,240,250,0.65)'; g.lineWidth = 1.5;
    for (let r = 4; r < 16; r += 4) { g.beginPath(); g.ellipse(cx, -38, r, r * 2, 0, 0.4, 5.6); g.stroke(); }
    circle(g, cx, -88, 4, '#e8fffc', '#5ab8b0', 1);
  } },
  dead_tree: { pad: [26, 64, 26, 4], draw(g, fw, fh, seed) {     // ต้นไม้ไหม้ดำในลงกา
    const cx = fw / 2, k = 0.9 + hash2(seed, 1, 3) * 0.3;
    shadow(g, cx, -1, 14, 5, 0.25);
    const branch = (x, y, a, len, d) => {
      const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
      g.strokeStyle = '#1b1410'; g.lineWidth = 6 - d * 1.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
      g.strokeStyle = '#3a2a22'; g.lineWidth = 4 - d * 1.2; g.stroke();
      if (d < 2) { branch(x2, y2, a - 0.55 + hash2(seed, d, 7) * 0.2, len * 0.65, d + 1); branch(x2, y2, a + 0.5, len * 0.6, d + 1); }
    };
    branch(cx, 0, -Math.PI / 2, 26 * k, 0);
    if (hash2(seed, 2, 2) > 0.6) { g.fillStyle = 'rgba(255,120,40,0.8)'; g.fillRect(cx - 1, -14, 2, 4); }   // ถ่านยังคุ
  } },
  brazier: { pad: [12, 46, 12, 3], draw(g, fw, fh, seed) {       // กระถางไฟศึกบนขาทองเหลือง
    const cx = fw / 2;
    const gl = g.createRadialGradient(cx, -30, 2, cx, -30, 22); gl.addColorStop(0, 'rgba(255,170,60,0.55)'); gl.addColorStop(1, 'rgba(255,120,40,0)');
    g.fillStyle = gl; g.fillRect(cx - 22, -52, 44, 44);
    shadow(g, cx, -1, 9, 3, 0.25);
    g.strokeStyle = '#8a6a2a'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(cx - 6, 0); g.lineTo(cx - 2, -18); g.moveTo(cx + 6, 0); g.lineTo(cx + 2, -18); g.stroke();
    poly(g, [cx - 9, -24, cx + 9, -24, cx + 6, -16, cx - 6, -16], '#b8901e', C.line, 1.1);
    poly(g, [cx - 7, -24, cx - 3, -36 - hash2(seed, 1, 1) * 4, cx, -28, cx + 3, -38, cx + 7, -24], '#ff7a2a', null);
    poly(g, [cx - 3, -24, cx, -32, cx + 3, -24], '#ffe08a', null);
  } },
  bone_pile: { pad: [12, 16, 12, 3], draw(g, fw, fh, seed) {     // กองกระดูกหน้ากำแพงลงกา
    const cx = fw / 2;
    shadow(g, cx, -1, 12, 3, 0.18);
    for (let i = 0; i < 4; i++) {
      const x = cx - 9 + hash2(seed, i, 1) * 14, y = -3 - hash2(seed, i, 2) * 4, a = hash2(seed, i, 3) * 3;
      g.save(); g.translate(x, y); g.rotate(a); box(g, -5, -1, 10, 2, '#e8e0cc', C.line, 0.8); g.restore();
    }
    circle(g, cx + 2, -6, 3.5, '#efe8d4', C.line, 0.9); g.fillStyle = '#1b1410'; g.fillRect(cx + 0.5, -7, 1.2, 1.2); g.fillRect(cx + 2.8, -7, 1.2, 1.2);
  } },
};

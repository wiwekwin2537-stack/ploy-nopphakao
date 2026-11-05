// ต้นไม้ ก้อนหิน เกวียน และของประกอบฉาก (วาดลงแคนวาสพักไว้ครั้งเดียว)
// ทุกฟังก์ชันวาดโดยจุด (0,0) = มุมล่างซ้ายของฐาน (footprint) ขนาดฐาน fw x fh
import { C, shadow, box, poly, circle, hash2, shade } from './draw.js';

const rnd = (seed, i) => hash2(seed, i, 13);

export const PROPS = {
  tree_big: { pad: [34, 70, 34, 6], draw(g, fw, fh, seed) {
    const cx = fw / 2;
    shadow(g, cx, -2, 26, 9, 0.28);
    box(g, cx - 4, -24, 8, 24, C.teak, C.line, 1.4);
    g.fillStyle = C.teakDark; g.fillRect(cx - 1, -20, 2, 14);
    const tones = [C.leafDark, C.leaf, '#5f8a3e', C.leafHi];
    const blobs = [[-14, -34, 15], [14, -36, 15], [0, -48, 17], [-8, -56, 12], [10, -55, 12], [0, -38, 16]];
    tones.forEach((col, li) => {
      blobs.forEach(([bx, by, r], i) => {
        const j = rnd(seed, i + li * 7) * 4 - 2;
        circle(g, cx + bx + j - li * 1.2, by + j - li * 2.5, r - li * 3, col, li === 0 ? C.line : null, 1.5);
      });
    });
    g.fillStyle = 'rgba(255,240,180,0.18)'; circle(g, cx - 6, -56, 6, 'rgba(255,240,180,0.18)', null);
  } },
  tree_palm: { pad: [34, 74, 34, 6], draw(g, fw, fh, seed) {
    const cx = fw / 2, lean = (rnd(seed, 1) - 0.5) * 18;
    shadow(g, cx + lean * 0.5, -1, 14, 5);
    g.strokeStyle = C.line; g.lineWidth = 6.5; g.beginPath(); g.moveTo(cx, 0); g.quadraticCurveTo(cx + lean * 0.2, -26, cx + lean, -52); g.stroke();
    g.strokeStyle = '#8a6a44'; g.lineWidth = 4.2; g.stroke();
    g.strokeStyle = '#6b5030'; g.lineWidth = 1;
    for (let i = 1; i < 9; i++) { const t = i / 9; const x = cx + lean * t * t, y = -52 * t; g.beginPath(); g.moveTo(x - 2, y); g.lineTo(x + 2, y); g.stroke(); }
    const tx = cx + lean, ty = -52;
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI / 2 + (i - 3) * 0.55 + (rnd(seed, i) - 0.5) * 0.2;
      const L = 24 + rnd(seed, i + 9) * 6;
      const ex = tx + Math.cos(a) * L, ey = ty + Math.sin(a) * L * 0.6 + 10;
      g.strokeStyle = C.line; g.lineWidth = 5; g.beginPath(); g.moveTo(tx, ty); g.quadraticCurveTo(tx + Math.cos(a) * L * 0.5, ty + Math.sin(a) * L * 0.5 - 6, ex, ey); g.stroke();
      g.strokeStyle = i % 2 ? C.leaf : C.leafHi; g.lineWidth = 3.4; g.stroke();
    }
    circle(g, tx - 2, ty + 2, 3, '#7a5a2a', C.line, 1); circle(g, tx + 3, ty + 3, 3, '#7a5a2a', C.line, 1);
  } },
  tree_banana: { pad: [26, 46, 26, 4], draw(g, fw, fh, seed) {
    const cx = fw / 2;
    shadow(g, cx, -1, 13, 5);
    box(g, cx - 3, -24, 6, 24, '#8ca453', C.line, 1.2);
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i - 2) * 0.7 + (rnd(seed, i) - 0.5) * 0.3;
      g.save(); g.translate(cx, -24); g.rotate(a + Math.PI / 2);
      poly(g, [0, 0, -7, -10, -6, -26, 0, -30, 6, -26, 7, -10], i % 2 ? C.leafHi : '#6ea044', C.line, 1.2);
      g.strokeStyle = 'rgba(30,50,20,0.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -28); g.stroke();
      g.restore();
    }
    if (rnd(seed, 8) > 0.4) { circle(g, cx + 5, -20, 3, '#c9b23a', C.line, 1); circle(g, cx + 8, -17, 3, '#c9b23a', C.line, 1); }
  } },
  tree_bodhi: { pad: [56, 96, 56, 8], draw(g, fw, fh, seed) {
    const cx = fw / 2;
    shadow(g, cx, -2, 44, 14, 0.3);
    poly(g, [cx - 9, 0, cx - 7, -36, cx + 7, -36, cx + 9, 0, cx + 15, 2, cx - 15, 2], C.teak, C.line, 1.5);
    ['#d84a3a', '#f1e3c4', '#2c7a4a'].forEach((col, i) => { g.fillStyle = col; g.fillRect(cx - 8, -20 + i * 3, 16, 3); }); // ผ้าแพรสามสี
    const blobs = [[-26, -50, 22], [26, -52, 22], [0, -70, 26], [-14, -84, 18], [16, -82, 18], [0, -54, 22]];
    [C.leafDark, C.leaf, C.leafHi].forEach((col, li) => blobs.forEach(([bx, by, r], i) =>
      circle(g, cx + bx + rnd(seed, i) * 4 - li, by - li * 3, r - li * 5, col, li === 0 ? C.line : null, 1.6)));
  } },
  bush: { pad: [8, 18, 8, 2], draw(g, fw, fh, seed) {
    const cx = fw / 2;
    shadow(g, cx, -1, 13, 4, 0.2);
    circle(g, cx - 6, -7, 7, C.leafDark, C.line, 1.2); circle(g, cx + 6, -7, 7, C.leafDark, C.line, 1.2); circle(g, cx, -11, 8, C.leaf, C.line, 1.2);
    circle(g, cx - 2, -13, 3.5, C.leafHi, null);
    if (rnd(seed, 2) > 0.6) { circle(g, cx + 4, -9, 1.8, '#e85a6a', null); circle(g, cx - 5, -6, 1.8, '#f2d04a', null); }
  } },
  rock: { pad: [8, 18, 8, 2], draw(g, fw) {
    const cx = fw / 2;
    shadow(g, cx, -1, 14, 4);
    poly(g, [cx - 13, -1, cx - 10, -12, cx - 2, -17, cx + 9, -14, cx + 13, -3], '#8d8a7e', C.line, 1.4);
    poly(g, [cx - 8, -11, cx - 2, -15, cx + 6, -13, cx + 1, -9], '#aca999', null);
  } },
  haystack: { pad: [8, 30, 8, 2], draw(g, fw) {
    const cx = fw / 2;
    shadow(g, cx, -1, 18, 5);
    poly(g, [cx - 17, 0, cx - 14, -14, cx - 6, -26, cx + 6, -26, cx + 14, -14, cx + 17, 0], C.thatch, C.line, 1.4);
    g.strokeStyle = C.thatchDark; g.lineWidth = 1;
    for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(cx + i * 4, -24); g.lineTo(cx + i * 5.5, -2); g.stroke(); }
    g.fillStyle = C.teak; g.fillRect(cx - 1, -32, 2, 7);
  } },
  flower: { pad: [6, 8, 6, 2], draw(g, fw, fh, seed) {
    const cols = ['#f2d04a', '#e85a6a', '#f4f0f0', '#d08ae0'];
    for (let i = 0; i < 4; i++) { const x = fw / 2 + (rnd(seed, i) - 0.5) * 12, y = -2 - rnd(seed, i + 5) * 6; g.fillStyle = C.leafDark; g.fillRect(x, y, 1, 3); circle(g, x + 0.5, y, 1.8, cols[Math.floor(rnd(seed, i + 9) * 4)], null); }
  } },
  jar: { pad: [8, 26, 8, 3], draw(g, fw) {            // โอ่งมังกร
    const cx = fw / 2;
    shadow(g, cx, -1, 11, 4);
    g.fillStyle = '#6a3a22'; g.beginPath(); g.ellipse(cx, -11, 11, 12, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#8a4e2c'; g.beginPath(); g.ellipse(cx - 2, -13, 8, 9, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#5a2e18'; g.fillRect(cx - 7, -24, 14, 4);
    g.strokeStyle = '#e8c050'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(cx - 8, -14); g.bezierCurveTo(cx - 3, -19, cx + 2, -8, cx + 8, -13); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(cx - 6, -17, 2, 6);
  } },
  fence: { pad: [2, 18, 2, 2], draw(g, fw) {             // รั้วไม้ไผ่
    g.fillStyle = '#b89a58';
    for (let x = 1; x < fw - 1; x += 6) g.fillRect(x, -16, 3, 16);
    g.fillStyle = '#8a7038'; g.fillRect(0, -12, fw, 2.5); g.fillRect(0, -6, fw, 2.5);
  } },
  basket: { pad: [6, 14, 6, 2], draw(g, fw) {            // กระบุงผลไม้
    const cx = fw / 2;
    shadow(g, cx, -1, 9, 3);
    g.fillStyle = '#a8803a'; g.fillRect(cx - 8, -10, 16, 10);
    g.fillStyle = '#8a6428'; for (let y = -9; y < 0; y += 3) g.fillRect(cx - 8, y, 16, 1);
    [['#e2a23a', -4], ['#c9433a', 1], ['#7fb04a', 5]].forEach(([c, dx]) => { g.fillStyle = c; g.beginPath(); g.arc(cx + dx, -11, 3.2, 0, Math.PI * 2); g.fill(); });
  } },
  crate: { pad: [4, 14, 4, 2], draw(g, fw) {
    shadow(g, fw / 2, -1, 14, 4);
    box(g, 2, -24, fw - 4, 22, '#9a7040', C.line, 1.4);
    g.strokeStyle = C.teakDark; g.lineWidth = 1.5; g.beginPath(); g.moveTo(3, -23); g.lineTo(fw - 3, -3); g.moveTo(fw - 3, -23); g.lineTo(3, -3); g.stroke();
  } },
  wagon: { pad: [10, 50, 10, 6], draw(g, fw, fh) { wagon(g, fw, fh, false); } },
  wagon_broken: { pad: [14, 46, 14, 6], draw(g, fw, fh) { wagon(g, fw, fh, true); } },
  log: { pad: [14, 26, 14, 4], draw(g, fw, fh) {
    for (let y = -fh + 6; y < -4; y += 13) {
      box(g, -6, y, fw + 12, 12, '#7a5432', C.line, 1.4);
      circle(g, -6, y + 6, 6, '#b8905c', C.line, 1.2); circle(g, -6, y + 6, 2.5, '#8a6438', null);
      g.fillStyle = C.leaf; g.fillRect(fw * 0.3, y - 2, 6, 3);
    }
  } },
  lantern: { pad: [10, 40, 10, 2], draw(g, fw) {
    const cx = fw / 2;
    shadow(g, cx, -1, 6, 2);
    box(g, cx - 1.5, -34, 3, 34, C.teakDark, C.line, 1);
    box(g, cx - 8, -36, 16, 3, C.teak, C.line, 1);
    const glow = g.createRadialGradient(cx + 6, -26, 1, cx + 6, -26, 12);
    glow.addColorStop(0, 'rgba(255,210,120,0.55)'); glow.addColorStop(1, 'rgba(255,210,120,0)');
    g.fillStyle = glow; g.fillRect(cx - 8, -40, 28, 28);
    box(g, cx + 3, -32, 7, 10, '#e2483a', C.line, 1);
    g.fillStyle = '#ffd77a'; g.fillRect(cx + 5, -30, 3, 6);
  } },
  well: { pad: [8, 44, 8, 4], draw(g, fw, fh) {
    const cx = fw / 2;
    shadow(g, cx, -2, fw / 2 + 4, 7);
    box(g, 0, -20, fw, 20, C.brick, C.line, 1.5);
    g.strokeStyle = C.brickDark; g.lineWidth = 1;
    for (let y = -16; y < 0; y += 5) { g.beginPath(); g.moveTo(1, y); g.lineTo(fw - 1, y); g.stroke(); }
    box(g, 2, -24, fw - 4, 6, '#3f6f8f', C.line, 1.2);
    box(g, 2, -50, 3, 28, C.teak, C.line, 1); box(g, fw - 5, -50, 3, 28, C.teak, C.line, 1);
    poly(g, [-4, -48, cx, -60, fw + 4, -48], C.red, C.line, 1.4);
    g.strokeStyle = '#d9c6a0'; g.lineWidth = 1; g.beginPath(); g.moveTo(cx, -50); g.lineTo(cx, -36); g.stroke();
    box(g, cx - 3, -37, 6, 5, C.teak, C.line, 1);
  } },
  stall: { pad: [6, 50, 6, 4], draw(g, fw) {
    shadow(g, fw / 2, -2, fw / 2 + 2, 6);
    box(g, 0, -22, fw, 22, '#8a6038', C.line, 1.5);
    ['#e2a23a', '#4f7a3a', '#c9433a', '#e8d5a0'].forEach((col, i) => circle(g, 12 + i * 28, -24, 7, col, C.line, 1)); // ผลไม้/ของขาย
    box(g, 2, -56, 3, 34, C.teak, C.line, 1); box(g, fw - 5, -56, 3, 34, C.teak, C.line, 1);
    for (let i = 0; i < fw / 14; i++) { g.fillStyle = i % 2 ? '#f1e3c4' : C.red; g.fillRect(-4 + i * 14, -62, 14, 10); }
    g.strokeStyle = C.line; g.lineWidth = 1.4; g.strokeRect(-4, -62, fw + 8, 10);
    for (let i = 0; i < fw / 14; i++) { g.fillStyle = i % 2 ? '#f1e3c4' : C.red; g.beginPath(); g.arc(3 + i * 14, -52, 7, 0, Math.PI); g.fill(); }
  } },
  bridge: { flat: true, pad: [0, 0, 0, 0], draw(g, fw, fh) {
    box(g, 0, -fh, fw, fh, '#9a7446', C.line, 1.5);
    g.strokeStyle = C.teakDark; g.lineWidth = 1;
    for (let x = 6; x < fw; x += 8) { g.beginPath(); g.moveTo(x, -fh + 2); g.lineTo(x, -2); g.stroke(); }
    box(g, 0, -fh, fw, 4, C.teak, C.line, 1); box(g, 0, -5, fw, 4, C.teak, C.line, 1);
  } },
  shrine: { pad: [14, 64, 14, 4], draw(g, fw) {         // ศาลพระภูมิ
    const cx = fw / 2;
    shadow(g, cx, -1, 18, 5);
    box(g, cx - 3, -30, 6, 30, C.plaster, C.line, 1.3);
    box(g, cx - 14, -36, 28, 6, C.plaster, C.line, 1.3);
    box(g, cx - 10, -52, 20, 16, C.red, C.line, 1.3);
    g.fillStyle = C.gold; g.fillRect(cx - 4, -48, 8, 12);
    poly(g, [cx - 14, -52, cx, -66, cx + 14, -52], C.gold, C.line, 1.3);
    poly(g, [cx - 2, -66, cx, -74, cx + 2, -66], C.goldHi, C.line, 1);
    ['#e85a6a', '#f2d04a', '#f4f0f0'].forEach((col, i) => circle(g, cx - 8 + i * 8, -38, 2.5, col, null)); // พวงมาลัย
  } },
};

function wagon(g, fw, fh, broken) {
  g.save();
  if (broken) { g.translate(fw / 2, -8); g.rotate(0.12); g.translate(-fw / 2, 8); }
  shadow(g, fw / 2, -2, fw / 2 + 6, 8);
  const wheel = (x, y) => {
    circle(g, x, y, 13, null, C.line, 4); circle(g, x, y, 13, null, '#7a5432', 2.4);
    g.strokeStyle = '#7a5432'; g.lineWidth = 1.6;
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 12, y + Math.sin(a) * 12); g.stroke(); }
    circle(g, x, y, 3, C.teakDark, C.line, 1);
  };
  box(g, 4, -34, fw - 8, 18, '#8a6238', C.line, 1.5);                          // ตัวเกวียน
  g.strokeStyle = C.teakDark; g.lineWidth = 1; for (let x = 12; x < fw - 8; x += 10) { g.beginPath(); g.moveTo(x, -33); g.lineTo(x, -17); g.stroke(); }
  g.fillStyle = C.thatch; g.beginPath(); g.moveTo(6, -34); g.bezierCurveTo(10, -62, fw - 10, -62, fw - 6, -34); g.closePath(); g.fill();
  g.strokeStyle = C.line; g.lineWidth = 1.5; g.stroke();                       // หลังคาประทุน
  g.strokeStyle = C.thatchDark; g.lineWidth = 1;
  for (let x = 14; x < fw - 10; x += 9) { g.beginPath(); g.moveTo(x, -35); g.quadraticCurveTo(x, -52, x + 2, -54); g.stroke(); }
  box(g, -10, -24, 16, 3, C.teak, C.line, 1);                                  // คานเทียมวัว
  wheel(fw * 0.32, -14);
  if (!broken) wheel(fw * 0.72, -14);
  g.restore();
  if (broken) { g.save(); g.translate(fw + 6, -6); g.scale(1, 0.45); circle(g, 0, 0, 13, null, C.line, 4); circle(g, 0, 0, 13, null, '#7a5432', 2.4); g.restore(); }
}


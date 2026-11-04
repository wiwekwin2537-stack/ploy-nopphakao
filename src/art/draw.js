// เครื่องมือวาดพื้นฐาน ใช้ร่วมกันทุกไฟล์ใน art/
export const C = {
  ink: '#1b1410', gold: '#d9a630', goldHi: '#f3d27a', red: '#a3262a', redHi: '#c9433a',
  leaf: '#4f7a3a', leafDark: '#355a28', leafHi: '#78a34e', indigo: '#2c4a73', teak: '#6b4423', teakDark: '#4a2e17',
  clay: '#a8643a', cream: '#f4e6c8', white: '#efe9dc', skin: '#d9a273', skinDark: '#b98257',
  grass: '#7da24a', grassDark: '#6a9140', dirt: '#b98a55', dirtDark: '#9c7144', water: '#3f7fa3', waterHi: '#6aa6c6',
  brick: '#b45a3a', brickDark: '#8a3f28', plaster: '#e8dcc2', thatch: '#c9a35a', thatchDark: '#9e7b3c',
};

export function shadow(ctx, x, y, rx, ry = rx * 0.45, a = 0.25) {
  ctx.fillStyle = `rgba(0,0,0,${a})`;
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
}

export function box(ctx, x, y, w, h, fill, stroke = C.ink, lw = 1.5) {
  ctx.fillStyle = fill; ctx.fillRect(x, y, w, h);
  if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.strokeRect(x + lw / 2, y + lw / 2, w - lw, h - lw); }
}

export function poly(ctx, pts, fill, stroke = C.ink, lw = 1.5) {
  ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.stroke(); }
}

export function circle(ctx, x, y, r, fill, stroke = C.ink, lw = 1.5) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); }
}

export function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

// ค่าสุ่มคงที่จากพิกัด ใช้ตกแต่งพื้นให้เหมือนเดิมทุกครั้ง
export function hash2(x, y, s = 0) {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v + 255 * amt)));
  return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, '0')).join('');
}

// กรอบลายกนกแบบย่อ: เส้นทองสองชั้น + มุมเปลวไฟ
export function kanokFrame(ctx, x, y, w, h, r = 8) {
  ctx.save();
  rrect(ctx, x, y, w, h, r); ctx.fillStyle = 'rgba(42,29,20,0.92)'; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = C.gold; ctx.stroke();
  rrect(ctx, x + 4, y + 4, w - 8, h - 8, Math.max(2, r - 3)); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(217,166,48,0.55)'; ctx.stroke();
  const corner = (cx, cy, sx, sy) => {
    ctx.beginPath(); ctx.moveTo(cx, cy + sy * 12); ctx.quadraticCurveTo(cx, cy, cx + sx * 12, cy);
    ctx.quadraticCurveTo(cx + sx * 4, cy + sy * 4, cx + sx * 7, cy + sy * 9);
    ctx.fillStyle = C.gold; ctx.fill();
  };
  corner(x + 2, y + 2, 1, 1); corner(x + w - 2, y + 2, -1, 1); corner(x + 2, y + h - 2, 1, -1); corner(x + w - 2, y + h - 2, -1, -1);
  ctx.restore();
}

// รูปของ + รูพลอยบนตัวของ (แบบ PoE) — ใช้ร่วมทุกหน้า (กระเป๋า หีบ ร้าน โต๊ะช่าง แถบคราฟต์ กล่องรายละเอียด) ให้รูเรียงแบบเดียวกันทุกที่
import { itemSprite } from '../art/items.js';
import { gemSprite } from '../art/gems.js';
import { C, circle, poly } from '../art/draw.js';

export const SOCKET_COL = { r: { fill: 'rgba(90,14,16,0.92)', rim: '#e8404a' }, g: { fill: 'rgba(14,60,26,0.92)', rim: '#4ad870' }, b: { fill: 'rgba(14,30,80,0.92)', rim: '#4a8af0' }, w: { fill: 'rgba(60,60,64,0.92)', rim: '#f4f4f4' } };

// ตำแหน่งรูพลอยบนรูปของ: 2 คอลัมน์ ไล่แบบงู (ซ้าย→ขวา→ลง→ซ้าย) เหมือน PoE
export function socketSpots(n, cx, cy, gap) {
  const order = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 2], [1, 2]].slice(0, n), cols = n > 1 ? 2 : 1, rows = Math.ceil(n / 2);
  return order.map(([c, r]) => ({ x: cx + (c - (cols - 1) / 2) * gap, y: cy + (r - (rows - 1) / 2) * gap }));
}

// D = game.data · รูที่มีพลอยแสดงรูปพลอยจริงเสมอ (ทุกหน้า เหมือนกัน)
export function itemIcon(ctx, D, it, x, y, r) {
  const I = D.items, G = D.gems;
  ctx.drawImage(itemSprite(I, it.base, r * 2 * (ctx.getTransform().a || 1)), x - r, y - r, r * 2, r * 2);
  if (it.sockets) {                                              // ช่องพลอยบนรูปของ (แบบ PoE) สีขอบ = สีช่อง · มีพลอย = เห็นรูปพลอย
    const sp = socketSpots(it.sockets, x, y, r * 0.6);
    ctx.strokeStyle = 'rgba(243,210,122,0.9)'; ctx.lineWidth = Math.max(1, r * 0.12);
    for (let i = 0; i < it.sockets - 1; i++) if (it.links[i]) { ctx.beginPath(); ctx.moveTo(sp[i].x, sp[i].y); ctx.lineTo(sp[i + 1].x, sp[i + 1].y); ctx.stroke(); }
    sp.forEach((q, i) => { const sc = SOCKET_COL[(it.colors && it.colors[i]) || 'w']; ctx.fillStyle = sc.fill; ctx.beginPath(); ctx.arc(q.x, q.y, r * 0.21, 0, 7); ctx.fill(); ctx.strokeStyle = sc.rim; ctx.lineWidth = 1; ctx.stroke();
      if (it.gems && it.gems[i]) ctx.drawImage(gemSprite(G, it.gems[i], r * 0.6 * (ctx.getTransform().a || 1)), q.x - r * 0.26, q.y - r * 0.26, r * 0.52, r * 0.52); });   // รูปพลอยจริงในรู
  }
}

// ไอคอนศิลา/ลายแทง (ที่เดียวในเกม: บนพื้น กระเป๋า ร้าน แถบคราฟต์ กล่องรายละเอียด ใช้รูปเดียวกันหมด)
export function currencyIcon(ctx, kind, x, y, r) {
  if (kind.startsWith('map')) {                                // ลายแทง: ม้วนหนังสือ สีตามขั้น
    const col = ['#e8d8a8', '#a8e070', '#70b8f0', '#c890f0', '#ff7a5a'][Number(kind.slice(3)) - 1] || '#e8d8a8';
    ctx.fillStyle = '#f0e2c0'; ctx.fillRect(x - r * 0.8, y - r * 0.55, r * 1.6, r * 1.1);
    ctx.strokeStyle = '#6a4a20'; ctx.lineWidth = 1; ctx.strokeRect(x - r * 0.8, y - r * 0.55, r * 1.6, r * 1.1);
    ctx.fillStyle = col; ctx.fillRect(x - r, y - r * 0.7, r * 0.35, r * 1.4); ctx.fillRect(x + r * 0.65, y - r * 0.7, r * 0.35, r * 1.4);
    ctx.strokeStyle = '#a3262a'; ctx.beginPath(); ctx.moveTo(x - r * 0.4, y - r * 0.2); ctx.lineTo(x, y + r * 0.2); ctx.lineTo(x + r * 0.4, y - r * 0.1); ctx.stroke();
    return;
  }
  if (kind === 'regret') {                                     // ใบลานล้างกรรม: ใบลานจารอักษร ผูกด้ายแดง
    ctx.fillStyle = '#e8d090'; ctx.fillRect(x - r * 0.95, y - r * 0.32, r * 1.9, r * 0.64);
    ctx.strokeStyle = '#7a5a20'; ctx.lineWidth = 1; ctx.strokeRect(x - r * 0.95, y - r * 0.32, r * 1.9, r * 0.64);
    ctx.fillStyle = '#5a3a10'; for (let i = 0; i < 3; i++) ctx.fillRect(x - r * 0.7, y - r * 0.18 + i * r * 0.16, r * 1.4, r * 0.05);
    ctx.fillStyle = '#c8302a'; ctx.fillRect(x - r * 0.08, y - r * 0.45, r * 0.16, r * 0.9);
    return;
  }
  if (kind === 'gild') {                                       // ทองคำเปลว: แผ่นทองบาง
    poly(ctx, [x - r * 0.8, y - r * 0.5, x + r * 0.6, y - r * 0.8, x + r * 0.8, y + r * 0.5, x - r * 0.6, y + r * 0.8], '#f2c230', C.ink, 1);
    ctx.fillStyle = 'rgba(255,250,200,0.8)'; ctx.fillRect(x - r * 0.4, y - r * 0.3, r * 0.5, r * 0.15); return;
  }
  if (kind === 'alch') {                                       // ปรอท: หยดเงินวาว
    ctx.fillStyle = '#c8d0e0'; ctx.beginPath(); ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x + r * 0.9, y + r * 0.2, x, y + r * 0.8); ctx.quadraticCurveTo(x - r * 0.9, y + r * 0.2, x, y - r); ctx.fill();
    ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.stroke(); circle(ctx, x - r * 0.25, y, r * 0.18, '#ffffff', null); return;
  }
  if (kind === 'exalt') {                                      // มณีโชติ: เพชรทองส่องแสงแปดแฉก
    ctx.fillStyle = 'rgba(255,233,160,0.35)'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    poly(ctx, [x, y - r * 0.85, x + r * 0.6, y - r * 0.2, x, y + r * 0.85, x - r * 0.6, y - r * 0.2], '#ffe9a0', C.ink, 1);
    poly(ctx, [x, y - r * 0.85, x + r * 0.6, y - r * 0.2, x, y - r * 0.05], '#fff8dc', null);
    return;
  }
  if (kind === 'kali') {                                       // เถ้ากาลี: กองเถ้าม่วงมีประกายไฟ
    poly(ctx, [x - r, y + r * 0.6, x - r * 0.3, y - r * 0.4, x + r * 0.2, y - r * 0.1, x + r, y + r * 0.6], '#5a2a7a', C.ink, 1);
    circle(ctx, x, y - r * 0.5, r * 0.2, '#ff7a3a', null); return;
  }
  if (kind === 'jeweller') {
    poly(ctx, [x - r * 0.8, y + r * 0.5, x - r * 0.6, y - r * 0.5, x + r * 0.2, y - r * 0.8, x + r * 0.8, y - r * 0.2, x + r * 0.6, y + r * 0.6], '#b8b0a0', C.ink, 1.2);
    circle(ctx, x, y, r * 0.22, '#3a3430', null);
  } else if (kind === 'chroma') {                                // หินเจ็ดสี: ผลึกสามสีแดง/เขียว/น้ำเงิน
    poly(ctx, [x - r * 0.9, y + r * 0.6, x - r * 0.3, y - r * 0.8, x, y + r * 0.6], '#e8404a', C.ink, 1);
    poly(ctx, [x - r * 0.3, y + r * 0.6, x + r * 0.2, y - r * 0.9, x + r * 0.5, y + r * 0.6], '#4ad870', C.ink, 1);
    poly(ctx, [x + r * 0.1, y + r * 0.6, x + r * 0.6, y - r * 0.7, x + r * 0.95, y + r * 0.6], '#4a8af0', C.ink, 1);
  } else {
    circle(ctx, x, y, r * 0.7, '#f4f0e8', C.ink, 1.2);
    ctx.strokeStyle = '#c9b89a'; ctx.lineWidth = 1;
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(x - r * 0.6, y + i * r * 0.2); ctx.lineTo(x + r * 0.6, y + i * r * 0.2); ctx.stroke(); }
    ctx.strokeStyle = '#f4f0e8'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + r * 0.5, y + r * 0.4); ctx.quadraticCurveTo(x + r, y + r, x + r * 1.1, y + r * 0.3); ctx.stroke();
  }
}

import { skillSprite } from './skills.js';

// ภาพพลอยแบบเจียระไน ทุกเม็ดรูปทรงและสัญลักษณ์ไม่ซ้ำกัน (แบบ PoE: ดูไอคอนก็รู้ว่าเม็ดไหน)
// พลอยสกิล = ทรงใหญ่ประกายแรง · พลอยเสริม = ทรงเล็กกว่าในกรอบทอง
const SHAPES = {
  // ทรง: จุดรอบนอกบนช่อง 64×64 (ศูนย์กลาง 32,32)
  round: () => Array.from({ length: 10 }, (_, i) => { const a = i / 10 * Math.PI * 2 - Math.PI / 2; return [32 + Math.cos(a) * 24, 32 + Math.sin(a) * 24]; }),
  octagon: () => [[20, 10], [44, 10], [54, 20], [54, 44], [44, 54], [20, 54], [10, 44], [10, 20]],
  pear: () => [[32, 6], [42, 22], [50, 38], [46, 52], [32, 58], [18, 52], [14, 38], [22, 22]],
  trillion: () => [[32, 8], [56, 50], [8, 50]],
  marquise: () => [[32, 4], [44, 20], [46, 32], [44, 44], [32, 60], [20, 44], [18, 32], [20, 20]],
  hexagon: () => Array.from({ length: 6 }, (_, i) => { const a = i / 6 * Math.PI * 2; return [32 + Math.cos(a) * 25, 32 + Math.sin(a) * 25]; }),
  kite: () => [[32, 4], [52, 26], [32, 60], [12, 26]],
  cushion: () => [[18, 8], [46, 8], [56, 18], [56, 46], [46, 56], [18, 56], [8, 46], [8, 18]].map(([x, y]) => [32 + (x - 32) * 0.95, 32 + (y - 32) * 0.95]).map(([x, y], i) => (i % 2 ? [x - 2, y] : [x, y])),
  shield: () => [[12, 10], [52, 10], [52, 34], [32, 58], [12, 34]],
};
const LOOK = {
  ruby: { shape: 'round', sym: 'flame' }, sapphire: { shape: 'octagon', sym: 'snow' }, emerald: { shape: 'pear', sym: 'drop' },
  multi: { shape: 'trillion', sym: 'three' }, pierce: { shape: 'marquise', sym: 'arrow' }, area: { shape: 'hexagon', sym: 'ring' }, haste: { shape: 'kite', sym: 'bolt' },
  topaz: { shape: 'cushion', sym: 'zap' }, power: { shape: 'shield', sym: 'plus' }, purity: { shape: 'round', sym: 'ring' }, cateye: { shape: 'round', sym: null }, amethyst: { shape: 'marquise', sym: 'bolt' }, moonstone: { shape: 'round', sym: null },
  garnet: { sym: 'plus' }, jade: { sym: 'bolt' }, zircon: { sym: 'ring' },
};

function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function mix(a, b, k) { const A = hexToRgb(a), B = hexToRgb(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',')})`; }

function symbol(g, kind, col) {
  g.save(); g.fillStyle = col; g.strokeStyle = col; g.lineWidth = 2.2; g.lineCap = 'round'; g.globalAlpha = 0.85;
  if (kind === 'flame') { g.beginPath(); g.moveTo(32, 20); g.quadraticCurveTo(42, 32, 36, 42); g.quadraticCurveTo(32, 46, 28, 42); g.quadraticCurveTo(24, 34, 31, 28); g.quadraticCurveTo(30, 36, 33, 36); g.quadraticCurveTo(36, 28, 32, 20); g.fill(); }
  else if (kind === 'snow') { for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3; g.beginPath(); g.moveTo(32 - Math.cos(a) * 11, 32 - Math.sin(a) * 11); g.lineTo(32 + Math.cos(a) * 11, 32 + Math.sin(a) * 11); g.stroke(); } }
  else if (kind === 'drop') { g.beginPath(); g.moveTo(32, 24); g.quadraticCurveTo(40, 36, 32, 42); g.quadraticCurveTo(24, 36, 32, 24); g.fill(); }
  else if (kind === 'three') { for (const [x, y] of [[32, 26], [26, 40], [38, 40]]) { g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); } }
  else if (kind === 'arrow') { g.beginPath(); g.moveTo(32, 46); g.lineTo(32, 18); g.stroke(); g.beginPath(); g.moveTo(26, 25); g.lineTo(32, 16); g.lineTo(38, 25); g.stroke(); }
  else if (kind === 'ring') { g.beginPath(); g.arc(32, 32, 9, 0, 7); g.stroke(); g.beginPath(); g.arc(32, 32, 3, 0, 7); g.fill(); }
  else if (kind === 'zap') { g.lineWidth = 2.6; g.beginPath(); g.moveTo(22, 20); g.lineTo(30, 30); g.lineTo(26, 32); g.lineTo(36, 44); g.lineTo(34, 34); g.lineTo(40, 32); g.lineTo(32, 20); g.stroke(); }
  else if (kind === 'plus') { g.lineWidth = 4; g.beginPath(); g.moveTo(32, 20); g.lineTo(32, 44); g.moveTo(21, 31); g.lineTo(43, 31); g.stroke(); }
  else if (kind === 'bolt') { g.beginPath(); g.moveTo(35, 18); g.lineTo(26, 34); g.lineTo(32, 34); g.lineTo(29, 46); g.lineTo(39, 29); g.lineTo(33, 29); g.closePath(); g.fill(); }
  g.restore();
}

// พลอยสกิล (แบบ PoE skill gem): ลูกแก้วกลมขัดมัน มีรูปสกิลสลักอยู่ข้างใน ขอบเงิน — ต่างจากพลอยเสริมที่เป็นเม็ดเจียระไนในกรอบทองชัดเจน
function paintSkillGem(g, info) {
  g.save(); g.shadowColor = info.color; g.shadowBlur = 10;
  const sp = g.createRadialGradient(24, 20, 3, 32, 32, 28);
  sp.addColorStop(0, info.hi || '#ffffff'); sp.addColorStop(0.35, info.color); sp.addColorStop(1, mix(info.color, '#000000', 0.7));
  g.fillStyle = sp; g.beginPath(); g.arc(32, 32, 26, 0, Math.PI * 2); g.fill(); g.restore();
  g.save(); g.beginPath(); g.arc(32, 32, 22, 0, Math.PI * 2); g.clip();
  if (info.aura) {                                              // พลอยออร่า: วงรัศมีซ้อน 3 ชั้น + สัญลักษณ์กลาง
    g.strokeStyle = info.hi; g.lineWidth = 2;
    for (const r of [7, 13, 19]) { g.globalAlpha = 1 - r / 26; g.setLineDash([4, 3]); g.beginPath(); g.arc(32, 32, r, 0, Math.PI * 2); g.stroke(); }
    g.setLineDash([]); g.globalAlpha = 1; symbol(g, (LOOK[info.id] || {}).sym || 'ring', '#ffffff');
  } else { g.globalAlpha = 0.95; g.drawImage(skillSprite(info.kind, 64, false), 8, 8, 48, 48); }
  g.restore();
  g.strokeStyle = '#dfe6ea'; g.lineWidth = 3; g.beginPath(); g.arc(32, 32, 27, 0, Math.PI * 2); g.stroke();
  g.strokeStyle = 'rgba(20,10,10,0.8)'; g.lineWidth = 1.2; g.beginPath(); g.arc(32, 32, 28.8, 0, Math.PI * 2); g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.ellipse(23, 17, 9, 5, -0.6, 0, Math.PI * 2); g.fill();
}

function paintGem(g, G, id) {
  const main = !!G.main[id], info = G.main[id] || G.support[id], look = LOOK[id] || { shape: 'round', sym: null };
  if (main) { paintSkillGem(g, { ...info, id }); return; }
  const [hi, mid, lo] = [mix(info.color, '#ffffff', 0.55), info.color, mix(info.color, '#000000', 0.55)];   // สีตามสีช่อง (แดง/เขียว/น้ำเงิน/ขาว) แบบ PoE
  if (!main) {                                                  // พลอยเสริม: กรอบทองรองรับ
    g.fillStyle = '#6a4a10'; g.beginPath(); g.arc(32, 32, 29, 0, 7); g.fill();
    g.strokeStyle = '#f3d27a'; g.lineWidth = 2; g.beginPath(); g.arc(32, 32, 28, 0, 7); g.stroke();
    g.translate(32, 32); g.scale(0.82, 0.82); g.translate(-32, -32);
  }
  const pts = SHAPES[look.shape]();
  const path = () => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const [x, y] of pts.slice(1)) g.lineTo(x, y); g.closePath(); };
  g.save(); g.shadowColor = mid; g.shadowBlur = main ? 10 : 6;
  const gr = g.createLinearGradient(10, 6, 54, 58); gr.addColorStop(0, hi); gr.addColorStop(0.5, mid); gr.addColorStop(1, lo);
  g.fillStyle = gr; path(); g.fill(); g.restore();
  // หน้าเจียระไน: สามเหลี่ยมจากโต๊ะกลางไปขอบ สลับสว่าง/มืด
  const tbl = pts.map(([x, y]) => [32 + (x - 32) * 0.45, 30 + (y - 32) * 0.45]);
  g.save(); path(); g.clip();
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], c = tbl[(i + 1) % pts.length], d = tbl[i];
    g.fillStyle = i % 2 ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.22)';
    g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c[0], c[1]); g.lineTo(d[0], d[1]); g.closePath(); g.fill();
  }
  g.fillStyle = 'rgba(255,255,255,0.16)'; g.beginPath(); g.moveTo(tbl[0][0], tbl[0][1]); for (const [x, y] of tbl.slice(1)) g.lineTo(x, y); g.closePath(); g.fill();
  g.restore();
  if (look.sym) symbol(g, look.sym, main ? hi : lo);
  g.strokeStyle = 'rgba(20,10,10,0.85)'; g.lineWidth = 2; g.lineJoin = 'round'; path(); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); g.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]); g.stroke();
  g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(22, 14); g.lineTo(24, 20); g.lineTo(30, 22); g.lineTo(24, 24); g.lineTo(22, 30); g.lineTo(20, 24); g.lineTo(14, 22); g.lineTo(20, 20); g.closePath(); g.fill();   // ประกายดาว
}

const cache = new Map();
export function gemSprite(G, id, px) {
  const size = Math.max(16, Math.ceil(px / 16) * 16), key = id + '|' + size;
  let c = cache.get(key);
  if (c) return c;
  c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); g.scale(size / 64, size / 64);
  if (G.main[id] || G.support[id]) paintGem(g, G, id);
  cache.set(key, c);
  return c;
}

// รูปสกิล (ไอคอนสี่เหลี่ยมแบบแถบสกิล PoE): ลูกไฟ หอกน้ำแข็ง หมอกพิษ สายฟ้า — ใช้บนปุ่มสกิลและสลักในพลอยสกิล
const BG = { fire: ['#5a1008', '#1a0402'], ice: ['#0e2a5a', '#040a1a'], poison: ['#0e3a14', '#031006'], bolt: ['#3a2a06', '#100a02'] };

function paintSkill(g, kind, plate) {
  if (plate) {                                                   // พื้นหลังไอคอน
    const bg = BG[kind] || BG.fire, gr = g.createRadialGradient(32, 32, 4, 32, 32, 44);
    gr.addColorStop(0, bg[0]); gr.addColorStop(1, bg[1]);
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  }
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  if (kind === 'fire') {                                         // ลูกไฟพุ่งเฉียงขึ้นขวา หางเปลวยาว
    for (let i = 0; i < 4; i++) {
      g.fillStyle = ['rgba(255,80,20,0.5)', 'rgba(255,130,30,0.6)', 'rgba(255,200,60,0.7)', 'rgba(255,240,180,0.9)'][i];
      g.beginPath(); g.moveTo(8 + i * 3, 56 - i * 2); g.quadraticCurveTo(20, 34, 40 - i, 22 + i); g.quadraticCurveTo(30 + i, 44, 8 + i * 3, 56 - i * 2); g.fill();
    }
    const fb = g.createRadialGradient(42, 22, 2, 42, 22, 15); fb.addColorStop(0, '#fffbe0'); fb.addColorStop(0.4, '#ffb030'); fb.addColorStop(1, 'rgba(220,40,10,0)');
    g.fillStyle = fb; g.beginPath(); g.arc(42, 22, 15, 0, Math.PI * 2); g.fill();
  } else if (kind === 'ice') {                                   // หอกน้ำแข็งพุ่ง มีเกล็ดหิมะตาม
    g.fillStyle = 'rgba(160,210,255,0.35)'; g.beginPath(); g.moveTo(8, 56); g.lineTo(46, 18); g.lineTo(40, 30); g.closePath(); g.fill();
    g.fillStyle = '#cfe8ff'; g.strokeStyle = '#2a5ab8'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(54, 10); g.lineTo(28, 30); g.lineTo(22, 42); g.lineTo(34, 36); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(54, 10); g.lineTo(36, 28); g.lineTo(32, 30); g.closePath(); g.fill();
    g.strokeStyle = '#e8f4ff'; g.lineWidth = 1.6;
    for (const [x, y] of [[14, 46], [22, 54], [12, 34]]) for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3; g.beginPath(); g.moveTo(x - Math.cos(a) * 4, y - Math.sin(a) * 4); g.lineTo(x + Math.cos(a) * 4, y + Math.sin(a) * 4); g.stroke(); }
  } else if (kind === 'poison') {                                // หมอกพิษเขียววน + หยดพิษ
    for (const [x, y, r, c] of [[24, 40, 14, 'rgba(60,180,70,0.55)'], [40, 36, 15, 'rgba(90,220,90,0.5)'], [32, 26, 12, 'rgba(150,255,140,0.5)']]) { g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#c8ffb0'; g.strokeStyle = '#1a5a20'; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(32, 18); g.quadraticCurveTo(42, 32, 32, 40); g.quadraticCurveTo(22, 32, 32, 18); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.arc(29, 31, 2.5, 0, Math.PI * 2); g.fill();
  } else {                                                       // สายฟ้า: สองสายหยักแตกกิ่ง
    g.strokeStyle = 'rgba(255,220,80,0.45)'; g.lineWidth = 9; zig(g); g.stroke();
    g.strokeStyle = '#fff6b0'; g.lineWidth = 3.5; zig(g); g.stroke();
    g.strokeStyle = '#ffd23a'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(30, 30); g.lineTo(18, 38); g.lineTo(20, 46); g.stroke();
  }
  g.restore();
  if (plate) { g.strokeStyle = 'rgba(217,166,48,0.9)'; g.lineWidth = 3; g.strokeRect(1.5, 1.5, 61, 61); }
}
function zig(g) { g.beginPath(); g.moveTo(44, 6); g.lineTo(30, 26); g.lineTo(40, 30); g.lineTo(22, 58); g.lineTo(34, 34); g.lineTo(24, 30); g.closePath(); }

const cache = new Map();
// plate = true: ไอคอนเต็มช่องมีพื้นหลัง (ปุ่มสกิล) · false: ลายใส (สลักในพลอย)
export function skillSprite(kind, px, plate = true) {
  const size = Math.max(16, Math.ceil(px / 16) * 16), key = kind + '|' + size + (plate ? 'p' : '');
  let c = cache.get(key);
  if (c) return c;
  c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); g.scale(size / 64, size / 64);
  paintSkill(g, kind, plate);
  cache.set(key, c);
  return c;
}

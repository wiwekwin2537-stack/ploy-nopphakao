// รูปสกิล (ไอคอนสี่เหลี่ยมแบบแถบสกิล PoE): ลูกไฟ หอกน้ำแข็ง หมอกพิษ สายฟ้า — ใช้บนปุ่มสกิลและสลักในพลอยสกิล
const BG = { fire: ['#5a1008', '#1a0402'], ice: ['#0e2a5a', '#040a1a'], poison: ['#0e3a14', '#031006'], bolt: ['#3a2a06', '#100a02'], holy: ['#4a4a5a', '#101018'], slash: ['#4a0a0a', '#120202'], cleave: ['#0a3a14', '#021006'], frost: ['#0a2050', '#020818'], firearrow: ['#5a1a08', '#1a0602'], arrow: ['#2a3a0a', '#0a1002'], aura: ['#2a1a3a', '#0a0612'], flicker: ['#2a0a4a', '#0a0214'], nova: ['#0a3a4a', '#020c12'], slam: ['#2a2430', '#0a080c'], amber: ['#4a2a06', '#140a02'] };

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
  } else if (kind === 'firearrow' || kind === 'arrow') {          // ศรเพลิง: ลูกศรไฟ 1 ดอก · ศรกระจาย: ลูกศร 3 ดอกเป็นพัด
    const shafts = kind === 'arrow' ? [-0.45, 0, 0.45] : [0];
    for (const da of shafts) {
      g.save(); g.translate(14, 50); g.rotate(-0.8 + da);
      if (kind === 'firearrow') { g.fillStyle = 'rgba(255,120,30,0.55)'; g.beginPath(); g.ellipse(34, 0, 14, 6, 0, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = '#c8a070'; g.fillRect(0, -1.5, 40, 3);
      g.fillStyle = kind === 'firearrow' ? '#fff0a0' : '#e8eef4'; g.beginPath(); g.moveTo(48, 0); g.lineTo(38, -5); g.lineTo(38, 5); g.closePath(); g.fill();
      g.fillStyle = '#f4f0e8'; g.beginPath(); g.moveTo(0, 0); g.lineTo(-6, -6); g.lineTo(6, -1); g.closePath(); g.fill(); g.beginPath(); g.moveTo(0, 0); g.lineTo(-6, 6); g.lineTo(6, 1); g.closePath(); g.fill();
      g.restore();
    }
  } else if (kind === 'slash') {                                 // ฟันพายุ: ดาบกลางวงพายุฟันสีแดง
    for (let i = 0; i < 3; i++) {
      g.strokeStyle = ['rgba(255,80,60,0.45)', 'rgba(255,150,120,0.7)', '#ffe0d0'][i]; g.lineWidth = 7 - i * 2.5;
      g.beginPath(); g.arc(32, 32, 22 - i * 2, -0.4 + i * 0.3, Math.PI * 1.4 + i * 0.3); g.stroke();
    }
    g.save(); g.translate(32, 32); g.rotate(-0.8);
    g.fillStyle = '#e8eef4'; g.fillRect(-2.5, -20, 5, 26); g.fillStyle = '#d9a630'; g.fillRect(-7, 6, 14, 3); g.fillStyle = '#5a2f1a'; g.fillRect(-2, 9, 4, 8);
    g.restore();
  } else if (kind === 'cleave') {                                // ดาบลมกรด: คลื่นลมเขียวพุ่งเป็นแนว
    for (let i = 0; i < 3; i++) { g.strokeStyle = ['rgba(120,255,150,0.35)', 'rgba(170,255,190,0.6)', '#e8fff0'][i]; g.lineWidth = 9 - i * 3; g.beginPath(); g.moveTo(8, 50 - i * 2); g.quadraticCurveTo(30, 34, 56, 12 + i * 2); g.stroke(); }
    g.save(); g.translate(16, 46); g.rotate(-0.75); g.fillStyle = '#e8eef4'; g.fillRect(-2, -18, 4, 20); g.fillStyle = '#d9a630'; g.fillRect(-6, 2, 12, 3); g.restore();
  } else if (kind === 'frost') {                                 // ฟันน้ำแข็ง: พัดฟันสีฟ้า มีผลึกน้ำแข็ง
    g.fillStyle = 'rgba(140,200,255,0.35)'; g.beginPath(); g.moveTo(14, 50); g.arc(14, 50, 44, -1.5, -0.1); g.closePath(); g.fill();
    g.strokeStyle = '#e8f4ff'; g.lineWidth = 3; g.beginPath(); g.arc(14, 50, 40, -1.45, -0.15); g.stroke();
    for (const [x, y] of [[40, 22], [50, 38], [28, 14]]) { g.fillStyle = '#cfe8ff'; g.beginPath(); g.moveTo(x, y - 6); g.lineTo(x + 3, y); g.lineTo(x, y + 6); g.lineTo(x - 3, y); g.closePath(); g.fill(); }
  } else if (kind === 'nova') {                                 // วงคลื่นไข่มุก: วงน้ำซ้อนรอบไข่มุกกลาง
    for (let i = 0; i < 3; i++) { g.strokeStyle = ['rgba(120,220,240,0.35)', 'rgba(170,240,250,0.65)', '#e8fffc'][i]; g.lineWidth = 6 - i * 1.6; g.beginPath(); g.arc(32, 32, 26 - i * 7, 0, Math.PI * 2); g.stroke(); }
    g.fillStyle = '#f4fffe'; g.beginPath(); g.arc(32, 32, 7, 0, Math.PI * 2); g.fill(); g.fillStyle = '#ffffff'; g.fillRect(29, 28, 3, 3);
  } else if (kind === 'slam') {                                  // ทุบธรณี: ค้อนทุบพื้น รอยแตกแผ่ออก
    g.strokeStyle = '#ffb060'; g.lineWidth = 2.5;
    for (const [x, y] of [[8, 52], [20, 58], [44, 58], [56, 50], [32, 60]]) { g.beginPath(); g.moveTo(32, 48); g.lineTo(x, y); g.stroke(); }
    g.save(); g.translate(32, 30); g.rotate(0.5); g.fillStyle = '#6b4423'; g.fillRect(-2.5, -24, 5, 30); g.fillStyle = '#5a5f6a'; g.fillRect(-11, -28, 22, 12); g.restore();
  } else if (kind === 'amber') {                                 // ศรอำพันทะลวง: ศรเดียวพุ่งทะลุวงสามวง
    g.strokeStyle = 'rgba(255,190,80,0.5)'; g.lineWidth = 2; for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(22 + i * 10, 42 - i * 10, 4, 9, 0.8, 0, Math.PI * 2); g.stroke(); }
    g.strokeStyle = '#e8a030'; g.lineWidth = 3; g.beginPath(); g.moveTo(8, 56); g.lineTo(52, 12); g.stroke();
    g.fillStyle = '#ffe0a0'; g.beginPath(); g.moveTo(56, 8); g.lineTo(44, 14); g.lineTo(50, 20); g.closePath(); g.fill();
  } else if (kind === 'flicker') {                              // วูบหายตัวฟัน: เงาม่วงสามเงาไล่กัน แล้วดาบฟันปลายทาง
    for (let i = 0; i < 3; i++) { g.fillStyle = `rgba(190,130,255,${0.18 + i * 0.2})`; g.beginPath(); g.ellipse(14 + i * 12, 44 - i * 9, 5, 9, -0.6, 0, Math.PI * 2); g.fill(); }
    g.strokeStyle = 'rgba(216,176,255,0.8)'; g.lineWidth = 2; g.setLineDash([4, 3]); g.beginPath(); g.moveTo(10, 54); g.lineTo(44, 22); g.stroke(); g.setLineDash([]);
    g.save(); g.translate(46, 20); g.rotate(-0.8); g.fillStyle = '#f0e8ff'; g.fillRect(-2, -16, 4, 18); g.fillStyle = '#d9a630'; g.fillRect(-6, 2, 12, 3); g.restore();
    g.strokeStyle = '#ffffff'; g.lineWidth = 2.5; g.beginPath(); g.arc(46, 22, 14, -2.2, 0.3); g.stroke();
  } else if (kind === 'holy') {                                  // รัศมีเพชร: แสงขาววาบเป็นแฉก
    const gl = g.createRadialGradient(32, 32, 2, 32, 32, 26); gl.addColorStop(0, '#ffffff'); gl.addColorStop(0.5, 'rgba(230,230,255,0.6)'); gl.addColorStop(1, 'rgba(200,200,255,0)');
    g.fillStyle = gl; g.beginPath(); g.arc(32, 32, 26, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffffff';
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, L = i % 2 ? 14 : 26; g.beginPath(); g.moveTo(32 + Math.cos(a - 0.12) * 6, 32 + Math.sin(a - 0.12) * 6); g.lineTo(32 + Math.cos(a) * L, 32 + Math.sin(a) * L); g.lineTo(32 + Math.cos(a + 0.12) * 6, 32 + Math.sin(a + 0.12) * 6); g.closePath(); g.fill(); }
    g.fillStyle = '#c8e8ff'; g.beginPath(); g.moveTo(32, 24); g.lineTo(38, 32); g.lineTo(32, 40); g.lineTo(26, 32); g.closePath(); g.fill();
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

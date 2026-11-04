// ภาพไอเท็มแบบเอโดเรีย: วาดบนช่อง 64×64 ไล่เฉดโลหะ (สว่าง→กลาง→มืด) เส้นขอบเข้ม ขอบสะท้อนแสง
// ภาพเดียวกันใช้ทุกที่: กระเป๋า ช่องสวม ร้านค้า และของที่ตกบนพื้น (itemSprite)
const OL = 'rgba(24,14,8,0.9)';

// วัสดุ: hi/mid/lo = ไล่เฉด, gl = แสงเรือง (ของดี)
const MAT = {
  bamboo: { hi: '#f0e2a0', mid: '#c8b070', lo: '#7a6430' },
  iron: { hi: '#f2f5fa', mid: '#aab4c5', lo: '#5d6779' },
  silver: { hi: '#ffffff', mid: '#cfd7e6', lo: '#7d869b', gl: '#d6e2ff' },
  brass: { hi: '#fff0b0', mid: '#d9a630', lo: '#7a5a10', gl: '#ffd23a' },
  bronze: { hi: '#ffd9b0', mid: '#c07a3a', lo: '#6a3a14' },
  gold: { hi: '#fff6b8', mid: '#f2c230', lo: '#9a6f0e', gl: '#ffd23a' },
  naga: { hi: '#c8ffe8', mid: '#2ab88a', lo: '#0e5a42', gl: '#5ae0b0' },
  leather: { hi: '#c89a6a', mid: '#8a5a32', lo: '#4a2c14' },
  straw: { hi: '#f4dc9a', mid: '#c9a35a', lo: '#7a5a24' },
  bone: { hi: '#fffaf0', mid: '#e8dcc0', lo: '#9a8a6a' },
};
function clothMat(col) { return { hi: shadeHex(col, 0.35), mid: col, lo: shadeHex(col, -0.45) }; }
function shadeHex(hex, k) {
  const n = parseInt(hex.slice(1), 16), f = (v) => Math.max(0, Math.min(255, Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k))));
  return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, '0')).join('');
}

// ชิ้นส่วนโลหะ/ผ้า: เติมไล่เฉด + ขอบเข้ม + เส้นสะท้อนแสงด้านใน (แบบเอโดเรีย)
function part(g, M, path, x0, y0, x1, y1) {
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  gr.addColorStop(0, M.hi); gr.addColorStop(0.45, M.mid); gr.addColorStop(1, M.lo);
  g.save(); if (M.gl) { g.shadowColor = M.gl; g.shadowBlur = 5; }
  g.fillStyle = gr; path(); g.fill(); g.restore();
  g.strokeStyle = OL; g.lineWidth = 1.8; g.lineJoin = 'round'; path(); g.stroke();
  g.save(); path(); g.clip(); g.strokeStyle = 'rgba(255,255,255,0.3)'; g.lineWidth = 1.2; g.translate(0.8, 0.8); path(); g.stroke(); g.restore();
}
const P = (g, pts) => () => { g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.closePath(); };
const R = (g, x, y, w, h) => () => { g.beginPath(); g.rect(x, y, w, h); };
const E = (g, x, y, rx, ry) => () => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); };
const WOOD = { hi: '#a87a4a', mid: '#6b4423', lo: '#3a2412' }, GOLD = MAT.gold;

function grip(g, x, y, h) {                                    // ด้ามไม้พันเชือก + ปุ่มท้าย
  part(g, WOOD, R(g, x - 2.5, y, 5, h), x - 2.5, 0, x + 2.5, 0);
  g.strokeStyle = '#d9b070'; g.lineWidth = 1; for (let i = 0; i < h / 3; i++) { g.beginPath(); g.moveTo(x - 2.5, y + 1.5 + i * 3); g.lineTo(x + 2.5, y + 2.8 + i * 3); g.stroke(); }
  part(g, GOLD, E(g, x, y + h + 2.5, 3.4, 3), x - 3, y + h, x + 3, y + h + 5);
}

// ---- อาวุธ (วาดตั้งตรง แล้วหมุนเฉียง 45° ให้เต็มช่อง) ----
const WEAPONS = {
  bamboo_sword(g, M) {                                         // ดาบไม้ไผ่: ข้อปล้อง
    part(g, M, P(g, [32, 2, 36, 8, 36, 44, 28, 44, 28, 8]), 28, 0, 36, 0);
    g.strokeStyle = M.lo; g.lineWidth = 1.4; for (const y of [14, 26, 38]) { g.beginPath(); g.moveTo(28, y); g.lineTo(36, y); g.stroke(); }
    part(g, WOOD, R(g, 25, 44, 14, 3.5), 25, 44, 39, 48); grip(g, 32, 47.5, 10);
  },
  iron_sword(g, M) {                                           // ดาบเหล็กลายไทย: ใบตรงสันโค้ง กระบังทองปลายงอน
    part(g, M, P(g, [32, 1, 37, 8, 37, 42, 27, 42, 27, 8]), 27, 0, 37, 0);
    g.strokeStyle = M.lo; g.lineWidth = 1.4; g.beginPath(); g.moveTo(32, 8); g.lineTo(32, 39); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(33, 9); g.lineTo(33, 38); g.stroke();
    part(g, GOLD, P(g, [20, 41, 24, 44, 40, 44, 44, 41, 42, 47, 22, 47]), 20, 40, 44, 48);
    g.fillStyle = '#c8302a'; g.beginPath(); g.arc(32, 45, 1.6, 0, 7); g.fill();
    grip(g, 32, 47, 10);
  },
  silver_kris(g, M) {                                          // กริช: ใบคด 5 คลื่น
    const pts = [32, 2]; for (let i = 0; i <= 6; i++) pts.push(35 + (i % 2 ? 2.5 : -0.5), 6 + i * 6);
    pts.push(36, 44, 28, 44); for (let i = 6; i >= 0; i--) pts.push(29 - (i % 2 ? 2.5 : -0.5), 6 + i * 6);
    part(g, M, P(g, pts), 26, 0, 38, 0);
    part(g, GOLD, P(g, [26, 43, 38, 43, 40, 47, 24, 47]), 24, 43, 40, 47);
    part(g, WOOD, P(g, [29, 47, 35, 47, 37, 52, 33, 60, 29, 58, 30, 52]), 29, 47, 37, 60);   // ด้ามกริชโค้งแบบหัวนก
  },
  bamboo_bow(g, M) {                                           // ธนู: คันโค้งสองปลายงอน สายตึง ด้ามพันหนัง
    part(g, M, () => { g.beginPath(); g.moveTo(26, 4); g.quadraticCurveTo(46, 18, 40, 32); g.quadraticCurveTo(46, 46, 26, 60); g.lineTo(29, 60); g.quadraticCurveTo(49, 46, 43, 32); g.quadraticCurveTo(49, 18, 29, 4); g.closePath(); }, 26, 0, 49, 0);
    g.strokeStyle = '#f4f0e0'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(27, 5); g.lineTo(27, 59); g.stroke();   // สายธนู
    part(g, WOOD, R(g, 39.5, 27, 5, 10), 39, 0, 45, 0);
    g.fillStyle = '#c8302a'; g.fillRect(39.5, 30, 5, 2);
  },
  wood_crossbow(g, M) {                                        // หน้าไม้: รางไม้ยาว คันขวาง ไกใต้ราง
    part(g, WOOD, P(g, [30, 8, 35, 8, 36, 58, 29, 58]), 29, 0, 36, 0);
    part(g, M, () => { g.beginPath(); g.moveTo(10, 20); g.quadraticCurveTo(32, 8, 54, 20); g.lineTo(54, 23); g.quadraticCurveTo(32, 12, 10, 23); g.closePath(); }, 10, 8, 54, 23);
    g.strokeStyle = '#f4f0e0'; g.lineWidth = 1; g.beginPath(); g.moveTo(11, 22); g.lineTo(32, 30); g.lineTo(53, 22); g.stroke();
    part(g, GOLD, R(g, 29.5, 30, 6, 3), 29, 30, 36, 33);
    part(g, WOOD, P(g, [33, 40, 37, 40, 36, 47, 34, 47]), 33, 40, 37, 47);
  },
  herb_staff(g, M) {                                           // ไม้เท้าหมอผี: ไม้คดพันผ้ายันต์ หัวเป็นลูกแก้วในกรงราก
    part(g, M, () => { g.beginPath(); g.moveTo(30, 18); g.quadraticCurveTo(28, 40, 31, 62); g.lineTo(35, 62); g.quadraticCurveTo(33, 40, 35, 18); g.closePath(); }, 28, 0, 36, 0);
    g.fillStyle = '#c8302a'; g.fillRect(29, 30, 7, 3); g.fillStyle = '#f0e2c0'; g.fillRect(29.5, 33, 6, 5);   // ผ้ายันต์
    g.fillStyle = '#5a3a10'; g.fillRect(31, 34.5, 3, 0.8); g.fillRect(31, 36, 3, 0.8);
    const gl = g.createRadialGradient(31, 10, 1, 32.5, 12, 9); gl.addColorStop(0, '#ffe0c0'); gl.addColorStop(0.45, '#ff5a3a'); gl.addColorStop(1, '#7a1408');
    g.save(); g.shadowColor = '#ff6a3a'; g.shadowBlur = 8; g.fillStyle = gl; g.beginPath(); g.arc(32.5, 11, 7, 0, Math.PI * 2); g.fill(); g.restore();
    g.strokeStyle = M.lo; g.lineWidth = 2.2; g.lineCap = 'round';                        // รากไม้โอบลูกแก้ว
    for (const [a, b] of [[26, 4], [39, 4], [33, 2]]) { g.beginPath(); g.moveTo(32.5, 19); g.quadraticCurveTo(a, 14, b, 3 + (a === 33 ? 0 : 4)); g.stroke(); }
  },
  brass_glaive(g, M) {                                         // ง้าว: ด้ามยาว ใบโค้งใหญ่
    part(g, WOOD, R(g, 30.5, 22, 4, 40), 30, 0, 35, 0);
    g.fillStyle = '#c8302a'; g.fillRect(29, 22, 7, 3);                                   // พู่แดง
    part(g, M, P(g, [33, 2, 42, 10, 44, 20, 38, 24, 30, 24, 30, 14]), 30, 2, 44, 24);
    g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 1; g.beginPath(); g.moveTo(34, 5); g.quadraticCurveTo(41, 11, 41, 19); g.stroke();
    part(g, GOLD, E(g, 32.5, 62, 3, 2), 30, 60, 35, 64);
  },
  naga_blade(g, M) {                                           // ดาบนาคราช: ใบหยกโค้ง กระบังหัวนาค
    part(g, M, () => { g.beginPath(); g.moveTo(31, 1); g.quadraticCurveTo(41, 18, 37, 42); g.lineTo(27, 42); g.quadraticCurveTo(30, 20, 31, 1); g.closePath(); }, 27, 0, 41, 0);
    g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 1; g.beginPath(); g.moveTo(32, 6); g.quadraticCurveTo(37, 20, 34, 38); g.stroke();
    part(g, GOLD, P(g, [18, 40, 26, 38, 30, 42, 38, 42, 46, 37, 44, 46, 20, 46]), 18, 37, 46, 47);
    g.fillStyle = '#c8302a'; g.fillRect(19, 40, 2, 2); g.fillRect(43, 39, 2, 2);         // ตานาค
    grip(g, 32, 46, 11);
  },
};

// ---- หมวก ----
const HEADS = {
  cloth_band(g, M) {
    part(g, M, P(g, [10, 26, 54, 26, 54, 36, 10, 36]), 10, 26, 54, 36);
    part(g, M, P(g, [48, 34, 60, 50, 54, 54, 44, 38]), 44, 34, 60, 54);               // ชายผ้าห้อย
    part(g, M, P(g, [44, 36, 50, 56, 44, 58, 40, 38]), 40, 36, 50, 58);
    g.fillStyle = GOLD.mid; for (let x = 14; x < 50; x += 8) g.fillRect(x, 30, 4, 2);
  },
  ngob_hat(g, M) {                                             // งอบใบลาน
    part(g, M, P(g, [4, 44, 32, 10, 60, 44, 32, 50]), 4, 10, 60, 50);
    g.strokeStyle = M.lo; g.lineWidth = 1; for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(32, 12); g.lineTo(32 + i * 8, 46 - Math.abs(i) * 1.2); g.stroke(); }
    part(g, WOOD, R(g, 22, 44, 20, 3), 22, 44, 42, 47);
  },
  iron_helm(g, M) {                                            // หมวกเหล็กยอดแหลม
    part(g, M, () => { g.beginPath(); g.moveTo(12, 50); g.lineTo(12, 32); g.quadraticCurveTo(12, 14, 32, 12); g.quadraticCurveTo(52, 14, 52, 32); g.lineTo(52, 50); g.lineTo(42, 54); g.lineTo(40, 44); g.lineTo(24, 44); g.lineTo(22, 54); g.closePath(); }, 12, 12, 52, 54);
    part(g, M, P(g, [28, 14, 32, 1, 36, 14]), 28, 1, 36, 14);
    g.fillStyle = '#10121a'; g.fillRect(18, 32, 28, 8);
    part(g, GOLD, R(g, 12, 29, 40, 3), 12, 29, 52, 32);
    part(g, M, R(g, 30, 30, 4, 16), 30, 30, 34, 46);
  },
  silver_crown(g, M) {                                         // ชฎา
    part(g, M, P(g, [14, 52, 18, 30, 26, 26, 32, 2, 38, 26, 46, 30, 50, 52]), 14, 2, 50, 52);
    part(g, GOLD, R(g, 12, 46, 40, 7), 12, 46, 52, 53);
    g.fillStyle = '#c8302a'; g.beginPath(); g.arc(32, 49.5, 2.2, 0, 7); g.fill();
    g.fillStyle = M.lo; for (let i = 0; i < 5; i++) g.fillRect(29, 12 + i * 6, 6, 1.5);
    g.fillStyle = '#5ae0b0'; g.beginPath(); g.arc(22, 49.5, 1.6, 0, 7); g.arc(42, 49.5, 1.6, 0, 7); g.fill();
  },
};

// ---- เสื้อ ----
function tunic(g, M) {
  return P(g, [16, 12, 25, 9, 32, 15, 39, 9, 48, 12, 58, 26, 50, 31, 47, 26, 46, 56, 18, 56, 17, 26, 14, 31, 6, 26]);
}
const BODIES = {
  cotton_shirt(g, M) { part(g, M, tunic(g, M), 6, 9, 58, 56); g.fillStyle = M.hi; g.fillRect(30, 15, 4, 40); part(g, WOOD, R(g, 18, 40, 28, 4), 18, 40, 46, 44); },
  buffalo_vest(g, M) {
    part(g, M, P(g, [18, 10, 27, 10, 32, 18, 37, 10, 46, 10, 48, 54, 16, 54]), 16, 10, 48, 54);
    g.strokeStyle = '#2a1608'; g.lineWidth = 2; g.beginPath(); g.moveTo(20, 24); g.lineTo(44, 40); g.moveTo(44, 24); g.lineTo(20, 40); g.stroke();
    part(g, GOLD, E(g, 32, 32, 3, 3), 29, 29, 35, 35);
  },
  bronze_cuirass(g, M) {
    for (const x of [12, 52]) part(g, M, E(g, x, 18, 9, 7), x - 9, 11, x + 9, 25);
    part(g, M, P(g, [16, 12, 26, 10, 32, 16, 38, 10, 48, 12, 51, 30, 45, 56, 19, 56, 13, 30]), 13, 10, 51, 56);
    g.strokeStyle = M.lo; g.lineWidth = 1.2; g.beginPath(); g.arc(32, 32, 8, 0, 7); g.stroke();       // ลายกนกวงกลมกลางอก
    g.beginPath(); g.moveTo(32, 24); g.lineTo(32, 40); g.moveTo(24, 32); g.lineTo(40, 32); g.stroke();
    part(g, GOLD, R(g, 18, 46, 28, 4), 18, 46, 46, 50);
  },
  naga_mail(g, M) {
    part(g, M, tunic(g, M), 6, 9, 58, 56);
    g.save(); tunic(g, M)(); g.clip();
    g.strokeStyle = M.lo; g.lineWidth = 1;
    for (let y = 18; y < 56; y += 5) for (let x = 6 + (y % 10 ? 3 : 0); x < 58; x += 6) { g.beginPath(); g.arc(x, y, 3, 0, Math.PI); g.stroke(); }   // เกล็ดนาค
    g.restore();
    part(g, GOLD, R(g, 18, 42, 28, 4), 18, 42, 46, 46);
  },
};

// ---- กางเกง / แขน / สร้อย / แหวน ----
const LEGS = {
  cotton_pants(g, M) {
    part(g, M, P(g, [16, 10, 48, 10, 52, 54, 36, 54, 32, 26, 28, 54, 12, 54]), 12, 10, 52, 54);
    part(g, GOLD, R(g, 16, 10, 32, 5), 16, 10, 48, 15);
  },
  leather_greaves(g, M) { for (const x of [14, 36]) { part(g, M, P(g, [x, 12, x + 14, 12, x + 15, 50, x + 7, 56, x - 1, 50]), x, 12, x + 14, 56); g.fillStyle = '#2a1608'; g.fillRect(x, 24, 14, 2); g.fillRect(x, 38, 14, 2); } },
  iron_greaves(g, M) { for (const x of [14, 36]) { part(g, M, P(g, [x, 12, x + 14, 12, x + 15, 50, x + 7, 56, x - 1, 50]), x, 12, x + 14, 56); part(g, M, E(g, x + 7, 28, 5, 4), x + 2, 24, x + 12, 32); } },
};
const ARMS = {
  cloth_wraps(g, M) { for (const x of [12, 36]) { part(g, M, R(g, x, 14, 16, 36), x, 14, x + 16, 50); g.strokeStyle = M.lo; g.lineWidth = 1; for (let y = 18; y < 50; y += 5) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + 16, y + 3); g.stroke(); } } },
  leather_bracers(g, M) { for (const x of [12, 36]) { part(g, M, P(g, [x, 14, x + 16, 14, x + 15, 50, x + 1, 50]), x, 14, x + 16, 50); part(g, GOLD, R(g, x, 22, 16, 3), x, 22, x + 16, 25); part(g, GOLD, R(g, x, 40, 16, 3), x, 40, x + 16, 43); } },
  gold_armlets(g, M) { for (const y of [16, 30, 44]) { part(g, M, E(g, 32, y, 20, 6), 12, y - 6, 52, y + 6); g.fillStyle = '#c8302a'; g.beginPath(); g.arc(32, y, 2, 0, 7); g.fill(); } },
};
function cord(g) { g.strokeStyle = '#3a2410'; g.lineWidth = 2; g.beginPath(); g.moveTo(12, 6); g.quadraticCurveTo(32, 46, 52, 6); g.stroke(); }
const NECKS = {
  takrut(g, M) { cord(g); part(g, M, R(g, 26, 26, 12, 26), 26, 26, 38, 52); g.strokeStyle = M.lo; g.lineWidth = 1; for (let y = 30; y < 50; y += 4) { g.beginPath(); g.moveTo(26, y); g.lineTo(38, y); g.stroke(); } },
  tiger_fang(g, M) { cord(g); part(g, M, () => { g.beginPath(); g.moveTo(26, 26); g.lineTo(38, 26); g.quadraticCurveTo(38, 46, 30, 58); g.quadraticCurveTo(30, 40, 26, 26); g.closePath(); }, 26, 26, 38, 58); part(g, GOLD, R(g, 25, 24, 14, 4), 25, 24, 39, 28); },
};
const RINGS = {
  brass_ring(g, M) { part(g, M, () => { g.beginPath(); g.arc(32, 36, 18, 0, 7); g.arc(32, 36, 11, 0, 7, true); }, 14, 18, 50, 54); part(g, { hi: '#ffb0b0', mid: '#d8283a', lo: '#6a0a14' }, E(g, 32, 17, 6, 5), 26, 12, 38, 22); },
  naga_ring(g, M) {
    part(g, M, () => { g.beginPath(); g.arc(32, 36, 18, 0, 7); g.arc(32, 36, 11, 0, 7, true); }, 14, 18, 50, 54);
    part(g, GOLD, P(g, [24, 20, 32, 10, 40, 20, 32, 24]), 24, 10, 40, 24);                 // หัวนาคชูบนแหวน
    g.fillStyle = '#c8302a'; g.fillRect(29, 16, 2, 2); g.fillRect(33, 16, 2, 2);
  },
};

const ALL = { ...WEAPONS, ...HEADS, ...BODIES, ...LEGS, ...ARMS, ...NECKS, ...RINGS };

function paintItem(g, base, id, upright) {
  const M = base.mat === 'cloth' ? clothMat(base.color) : MAT[base.mat] || MAT.iron;
  id = base.art || id;                                         // ของระดับสูงใช้ทรงเดียวกับของพื้นฐาน แต่วัสดุต่าง
  if (WEAPONS[id] && !upright) { g.translate(32, 32); g.rotate(Math.PI / 4); g.scale(1.08, 1.08); g.translate(-32, -32); }
  (ALL[id] || BODIES.cotton_shirt)(g, M);
}

// สีหลักของวัสดุ (ใช้ระบายหมวก/ชุดบนตัวละครให้ตรงกับไอคอน)
export function matColor(base) { return base.mat === 'cloth' ? base.color : (MAT[base.mat] || MAT.iron).mid; }

// ภาพไอเท็มขนาด px (แคชไว้) — ใช้ drawImage วาดได้ทุกที่
const cache = new Map();
export function itemSprite(I, baseId, px, upright = false) {
  const size = Math.max(16, Math.ceil(px / 16) * 16), key = baseId + '|' + size + (upright ? 'u' : '');
  let c = cache.get(key);
  if (c) return c;
  c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); g.scale(size / 64, size / 64);
  paintItem(g, I.bases[baseId] || { mat: 'iron', color: '#999' }, baseId, upright);
  cache.set(key, c);
  return c;
}

// อาวุธในมือตัวละคร: ภาพเดียวกับไอคอนแต่ตั้งตรง (ปลายอยู่บน) + จุดจับ (gy) และความยาวจากมือถึงปลาย (reach) บนช่อง 64
const GRIP = { brass_glaive: { gy: 50, reach: 48 }, silver_kris: { gy: 52, reach: 50 }, herb_staff: { gy: 46, reach: 44 }, bamboo_bow: { gy: 32, reach: 28, gx: 42 }, wood_crossbow: { gy: 44, reach: 36 } };
export function weaponInHand(I, baseId) {
  const b = I.bases[baseId], art = b && (b.art || baseId);
  if (!art || !WEAPONS[art]) return null;
  return { sprite: itemSprite(I, baseId, 96, true), ...(GRIP[art] || { gy: 50, reach: 49 }) };
}

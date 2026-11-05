// ตำแหน่งปุ่มบนจอ (หน่วย CSS px) ใช้ทั้งตอนวาดและตอนรับการแตะ/คลิก
// เลือด/มานาอยู่แผงซ้ายบน (แบบเอโดเรีย) · ขวดยา 5 ช่องซ้ายล่าง (แบบ PoE) · แถบสกิลขวาล่าง (คีย์บอร์ด/เมาส์)
// touch = จอสัมผัส: ซ่อนแถบสกิล ใช้ปุ่มกลมขวาล่างแทน (ปุ่มฟันใหญ่ อยู่มุมขวาล่างกดง่าย)
export function computeLayout(w, h, touch = false) {
  const s = Math.max(0.8, Math.min(1.3, h / 390));
  // ขวดยา: 1 = ยาหม้อ (เลือด) · 2 = น้ำมนต์ (มานา) · 3–5 ว่างไว้สำหรับขวดใหม่
  const fw = 24 * s, fh = 40 * s, fx = 14 * s;
  const flasks = Array.from({ length: 5 }, (_, i) => ({ i, id: ['potion', 'manapot', null, null, null][i], x: fx + i * (fw + 5 * s), y: h - fh - 8 * s, w: fw, h: fh }));
  // แถบสกิล (คีย์บอร์ด/จอย): ฟัน · สกิล 1–3 · หลบ
  const bs = 36 * s, barIds = ['attack', 'skill', 'skill2', 'skill3', 'dash'];
  const bx0 = w - 12 * s - barIds.length * (bs + 4 * s);
  const bar = barIds.map((id, i) => ({ id, x: bx0 + i * (bs + 4 * s), y: h - bs - 10 * s, w: bs, h: bs }));
  const atk = { id: 'attack', x: w - 58 * s, y: h - 58 * s, r: 40 * s, round: true };
  const round = [
    atk,
    { id: 'dash', x: atk.x - 84 * s, y: h - 34 * s, r: 25 * s, round: true },
    { id: 'skill', x: atk.x - 82 * s, y: atk.y - 66 * s, r: 26 * s, round: true },
    { id: 'skill2', x: atk.x - 10 * s, y: atk.y - 92 * s, r: 24 * s, round: true },
    { id: 'skill3', x: atk.x + 30 * s, y: atk.y - 158 * s, r: 21 * s, round: true },
    { id: 'interact', x: atk.x - 156 * s, y: atk.y - 44 * s, r: 26 * s, onlyNear: true, round: true },
  ];
  // ปุ่มที่กดได้ตอนนี้: ขวดยากดได้เสมอ · ปุ่มกลมเฉพาะจอสัมผัส · แถบสกิลเฉพาะคีย์บอร์ด/เมาส์
  const flaskBtns = flasks.filter((f) => f.id).map((f) => ({ id: f.id, x: f.x + f.w / 2, y: f.y + f.h / 2, r: f.h * 0.55, flask: true }));
  const barBtns = bar.map((b) => ({ id: b.id, x: b.x + b.w / 2, y: b.y + b.h / 2, r: b.w * 0.55, bar: true }));
  return {
    s, touch, flasks, bar,
    joyZoneW: w * 0.42,
    joyR: 56 * s,
    joyHome: { x: 100 * s, y: h - 124 * s },
    buttons: [...(touch ? round : round.filter((b) => b.id === 'interact')), ...flaskBtns, ...(touch ? [] : barBtns)],
    minimap: { x: w - 52 * s, y: 50 * s, r: 40 * s },
    mute: { x: w - 30 * s, y: 128 * s, r: 15 * s },
    profile: { x: 8 * s, y: 6 * s, w: 188 * s, h: 64 * s },   // แผงสถานะมุมซ้ายบน (รูป + เลือด/มานา/XP) = ปุ่มโปรไฟล์
    uiRects: [{ x: 0, y: 0, w: 210 * s, h: 100 * s }, { x: 0, y: 0, w: 0, h: 0 }, { x: w - 100 * s, y: 4 * s, w: 100 * s, h: 100 * s }],   // [2] = แผนที่เล็ก (แตะ = เปิดแผนที่ใหญ่)       // บริเวณที่แตะแล้วเป็นการกดแผง ไม่เริ่มจอยเดิน
  };
}

// ตำแหน่งปุ่มบนจอ (หน่วย CSS px) ใช้ทั้งตอนวาดและตอนรับการแตะ/คลิก
// แบบ PoE: ลูกแก้วเลือดซ้ายล่าง · ขวดยา 5 ช่องข้างลูกแก้ว · แถบสกิลข้างลูกแก้วมานาขวาล่าง
// touch = เล่นด้วยจอสัมผัส: ซ่อนแถบสกิล ใช้ปุ่มกลมแทน (เลื่อนหลบลูกแก้วมานา)
export function computeLayout(w, h, touch = false) {
  const s = Math.max(0.8, Math.min(1.3, h / 390));
  const orbR = (touch ? 34 : 42) * s;
  const life = { x: orbR + 8 * s, y: h - orbR - 6 * s, r: orbR };
  const mana = { x: w - orbR - 8 * s, y: h - orbR - 6 * s, r: orbR };
  // ขวดยา: 1 = ยาหม้อ (เลือด) · 2 = น้ำมนต์ (มานา) · 3–5 ว่างไว้สำหรับขวดใหม่
  const fw = 24 * s, fh = 40 * s, fx = life.x + orbR + 10 * s;
  const flasks = Array.from({ length: 5 }, (_, i) => ({ i, id: ['potion', 'manapot', null, null, null][i], x: fx + i * (fw + 5 * s), y: h - fh - 8 * s, w: fw, h: fh }));
  // แถบสกิล (คีย์บอร์ด/จอย): ฟัน · สกิล 1–3 · หลบ
  const bs = 34 * s, barIds = ['attack', 'skill', 'skill2', 'skill3', 'dash'];
  const bx0 = mana.x - orbR - 10 * s - barIds.length * (bs + 4 * s);
  const bar = barIds.map((id, i) => ({ id, x: bx0 + i * (bs + 4 * s), y: h - bs - 10 * s, w: bs, h: bs }));
  const atk = { id: 'attack', x: w - 56 * s - (touch ? 2 * orbR - 6 * s : 0), y: h - 54 * s - (touch ? 26 * s : 0), r: 34 * s, round: true };
  const round = [
    atk,
    { id: 'dash', x: atk.x - 76 * s, y: atk.y + 20 * s, r: 24 * s, round: true },
    { id: 'skill', x: atk.x - 76 * s, y: atk.y - 62 * s, r: 25 * s, round: true },
    { id: 'skill2', x: atk.x - 8 * s, y: atk.y - 84 * s, r: 23 * s, round: true },
    { id: 'skill3', x: atk.x + 46 * s, y: atk.y - 120 * s, r: 20 * s, round: true },
    { id: 'interact', x: atk.x - 150 * s, y: atk.y - 40 * s, r: 26 * s, onlyNear: true, round: true },
  ];
  // ปุ่มที่กดได้ตอนนี้: ขวดยากดได้เสมอ · ปุ่มกลมเฉพาะจอสัมผัส · แถบสกิลเฉพาะคีย์บอร์ด/เมาส์
  const flaskBtns = flasks.filter((f) => f.id).map((f) => ({ id: f.id, x: f.x + f.w / 2, y: f.y + f.h / 2, r: f.h * 0.55, flask: true }));
  const barBtns = bar.map((b) => ({ id: b.id, x: b.x + b.w / 2, y: b.y + b.h / 2, r: b.w * 0.55, bar: true }));
  return {
    s, touch, life, mana, flasks, bar,
    joyZoneW: w * 0.42,
    joyR: 56 * s,
    joyHome: { x: fx + 70 * s, y: h - 120 * s },
    buttons: [...(touch ? round : round.filter((b) => b.id === 'interact')), ...flaskBtns, ...(touch ? [] : barBtns)],
    minimap: { x: w - 52 * s, y: 50 * s, r: 40 * s },
    mute: { x: w - 30 * s, y: 128 * s, r: 15 * s },
    profile: { x: 8 * s, y: 6 * s, w: 188 * s, h: 50 * s },   // แผงรูปตัวละครมุมซ้ายบน = ปุ่มโปรไฟล์
    uiRects: [{ x: 0, y: 0, w: 210 * s, h: 90 * s }],        // บริเวณที่แตะแล้วเป็นการกดแผง ไม่เริ่มจอยเดิน
  };
}

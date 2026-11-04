// ตำแหน่งปุ่มบนจอ (หน่วย CSS px) จัดแบบเอโดเรีย ใช้ทั้งตอนวาดและตอนรับการแตะ/คลิก
export function computeLayout(w, h) {
  const s = Math.max(0.8, Math.min(1.3, h / 390));
  const atk = { id: 'attack', x: w - 56 * s, y: h - 54 * s, r: 34 * s };
  return {
    s,
    joyZoneW: w * 0.42,
    joyR: 56 * s,
    joyHome: { x: 92 * s, y: h - 86 * s },
    buttons: [
      atk,
      { id: 'dash', x: atk.x - 76 * s, y: h - 34 * s, r: 24 * s },
      { id: 'skill', x: atk.x - 76 * s, y: atk.y - 62 * s, r: 25 * s },
      { id: 'skill2', x: atk.x - 8 * s, y: atk.y - 84 * s, r: 23 * s },
      { id: 'skill3', x: atk.x + 26 * s, y: atk.y - 152 * s, r: 20 * s },
      { id: 'interact', x: atk.x - 150 * s, y: atk.y - 40 * s, r: 26 * s, onlyNear: true },
    ],
    slots: { x: w / 2, y: h - 26 * s, r: 15 * s, gap: 42 * s },
    minimap: { x: w - 52 * s, y: 50 * s, r: 40 * s },
    mute: { x: w - 30 * s, y: 128 * s, r: 15 * s },
    profile: { x: 8 * s, y: 6 * s, w: 188 * s, h: 64 * s },   // แผงสถานะมุมซ้ายบน = ปุ่มโปรไฟล์
  };
}

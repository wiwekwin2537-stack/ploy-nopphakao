// ตำแหน่งปุ่มบนจอ (หน่วย CSS px) ใช้ทั้งตอนวาดและตอนรับการแตะ
export function computeLayout(w, h) {
  const s = Math.max(0.75, Math.min(1.25, Math.min(w, h) / 400));
  const pad = 22 * s;
  const atk = { id: 'attack', x: w - pad - 46 * s, y: h - pad - 46 * s, r: 46 * s };
  return {
    s,
    joyZoneW: w * 0.45,
    joyR: 58 * s,
    joyHome: { x: pad + 70 * s, y: h - pad - 70 * s },
    buttons: [
      atk,
      { id: 'dash', x: atk.x - 108 * s, y: atk.y + 14 * s, r: 32 * s },
      { id: 'skill', x: atk.x - 20 * s, y: atk.y - 102 * s, r: 32 * s },
      { id: 'interact', x: atk.x - 100 * s, y: atk.y - 74 * s, r: 27 * s },
    ],
    mute: { x: w - 30 * s, y: 30 * s, r: 18 * s },
  };
}

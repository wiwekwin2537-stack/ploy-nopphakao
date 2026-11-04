// ของบนเขาไกรลาส: สนหิมะ และผลึกน้ำแข็ง (จุด (0,0) = มุมล่างซ้ายของฐาน แบบเดียวกับ props.js)
import { C, shadow, box, poly, hash2 } from './draw.js';

export const MOUNTAIN = {
  snow_pine: { pad: [26, 72, 26, 4], draw(g, fw, fh, seed) {    // สนยอดแหลม ชั้นใบมีหิมะเกาะ
    const cx = fw / 2, k = 0.9 + hash2(seed, 1, 3) * 0.25;
    shadow(g, cx, -1, 18, 6, 0.25);
    box(g, cx - 3, -14, 6, 14, C.teakDark, C.line, 1.2);
    for (let i = 0; i < 4; i++) {
      const y = -12 - i * 14 * k, w = (22 - i * 4.5) * k;
      poly(g, [cx - w, y, cx, y - 20 * k, cx + w, y], i % 2 ? '#2f5a40' : '#2a5038', C.line, 1.3);
      poly(g, [cx - w * 0.75, y - 4, cx, y - 20 * k, cx + w * 0.6, y - 6, cx + w * 0.2, y - 3], '#f4f8fc', null);   // หิมะบนกิ่ง
    }
  } },
  ice_crystal: { pad: [10, 40, 10, 3], draw(g, fw, fh, seed) {   // ผลึกน้ำแข็งงอกจากหิมะ
    const cx = fw / 2;
    shadow(g, cx, -1, 13, 4, 0.2);
    const spikes = [[-8, 22, -0.3], [0, 34, 0], [8, 26, 0.3], [-3, 16, -0.6]];
    for (const [dx, hgt, lean] of spikes) {
      const bx = cx + dx, tx = bx + lean * 10, top = -hgt - hash2(seed, dx + 9, 2) * 6;
      poly(g, [bx - 4, 0, tx, top, bx + 4, 0], '#a8d8f4', 'rgba(40,80,130,0.7)', 1.2);
      poly(g, [bx - 1, -2, tx, top + 2, bx + 2, -4], 'rgba(255,255,255,0.75)', null);
    }
  } },
};

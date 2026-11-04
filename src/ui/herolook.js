// หน้าตาผู้เล่นตามของที่สวม (ใช้ทั้งในฉากและหน้าโปรไฟล์): สีเสื้อ หมวก กางเกง ปลอกแขน สร้อย อาวุธ ประกาย
import { LOOKS } from '../art/characters.js';
import { shade } from '../art/draw.js';

const lookCache = { key: '', look: null };

export function heroLook(game) {
  const p = game.player, I = game.data.items, e = p.equip || {};
  const key = ['head', 'body', 'legs', 'arms', 'amulet'].map((k) => (e[k] ? e[k].base : '')).join('|');
  if (lookCache.key !== key || !lookCache.look) {
    const L = { ...LOOKS.hero }, lk = (k) => (e[k] ? I.bases[e[k].base] : null);
    const b = lk('body'), h = lk('head'), lg = lk('legs'), ar = lk('arms'), nk = lk('amulet');
    if (b) { L.top = b.color; L.collar = (b.look && b.look.trim) || shade(b.color, 0.08); L.plates = b.look && b.look.plates; L.straps = b.look && b.look.straps; }
    if (h) { L.hat = (h.look && h.look.hat) || 'band'; L.hatColor = h.color; }
    if (lg) { L.leg = lg.color; L.leg2 = shade(lg.color, 0.06); L.guard = lg.look && lg.look.guard; }
    if (ar) L.fore = ar.color;
    if (nk) L.neck = nk.color;
    lookCache.key = key; lookCache.look = L;
  }
  return lookCache.look;
}

// อาวุธ + ประกายตามของที่ดีที่สุดที่สวม (แดง/ม่วง แบบเอโดเรีย)
export function heroGear(game) {
  const e = game.player.equip || {}, I = game.data.items, w = e.weapon;
  const rs = Object.values(e).filter(Boolean).map((it) => it.rarity);
  return {
    blade: w ? I.bases[w.base].color : '#d8e0e4',
    weapon: w ? ((I.bases[w.base].look || {}).kind || 'sword') : 'sword',
    glow: rs.includes('red') ? I.rarity.red.color : rs.includes('purple') ? I.rarity.purple.color : null,
  };
}

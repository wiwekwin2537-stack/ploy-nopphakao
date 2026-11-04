// หน้าตาผู้เล่นตามของที่สวม (ใช้ทั้งในฉากและหน้าโปรไฟล์): สีเสื้อ หมวก กางเกง ปลอกแขน สร้อย อาวุธ ประกาย
import { LOOKS } from '../art/characters.js';
import { shade } from '../art/draw.js';
import { weaponInHand, itemSprite, matColor } from '../art/items.js';

const lookCache = { key: '', look: null };

export function heroLook(game) {
  const p = game.player, I = game.data.items, e = p.equip || {};
  const key = ['head', 'body', 'legs', 'arms', 'amulet'].map((k) => (e[k] ? e[k].base : '')).join('|');
  if (lookCache.key !== key || !lookCache.look) {
    const L = { ...LOOKS.hero }, lk = (k) => (e[k] ? I.bases[e[k].base] : null);
    const b = lk('body'), h = lk('head'), lg = lk('legs'), ar = lk('arms'), nk = lk('amulet');
    // ชุดบนตัวใช้ภาพเดียวกับไอคอนเป็นลายเสื้อ/กางเกง (แบบเอโดเรีย) + สีวัสดุเดียวกัน
    if (b) { L.top = matColor(b); L.collar = (b.look && b.look.trim) || shade(L.top, 0.08); L.plates = null; L.straps = null; L.bodyArt = itemSprite(I, e.body.base, 64); }
    if (h) { L.hat = (h.look && h.look.hat) || 'band'; L.hatColor = matColor(h); }
    if (lg) { L.leg = matColor(lg); L.leg2 = shade(L.leg, 0.06); L.guard = lg.look && lg.look.guard; L.legArt = itemSprite(I, e.legs.base, 64); }
    if (ar) L.fore = matColor(ar);
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
    weaponArt: w ? weaponInHand(I, w.base) : null,
    weapon: w ? ((I.bases[w.base].look || {}).kind || 'sword') : 'sword',
    glow: rs.includes('red') ? I.rarity.red.color : rs.includes('purple') ? I.rarity.purple.color : null,
  };
}

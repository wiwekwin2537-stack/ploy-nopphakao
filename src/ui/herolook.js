// หน้าตาผู้เล่นตามของที่สวม (ใช้ทั้งในฉากและหน้าโปรไฟล์): สีเสื้อ หมวก กางเกง ปลอกแขน สร้อย อาวุธ ประกาย
import { LOOKS } from '../art/characters.js';
import { shade } from '../art/draw.js';
import { weaponInHand, itemSprite, matColor } from '../art/items.js';

const lookCache = new Map();                                  // ตามชุดที่ใส่ (ผู้เล่นทุกคนในจอใช้ร่วมกัน)

export function heroLook(game) { return lookOf(game.data, game.player); }
export function heroGear(game) { return gearOf(game.data, game.player); }

// p = ตัวผู้เล่นใดก็ได้ที่มี cls + equip (ตัวเอง หรือผู้เล่นคนอื่นที่สร้างจากข้อมูลออนไลน์)
export function lookOf(data, p) {
  const I = data.items, e = p.equip || {};
  const key = p.cls + '|' + (e.weapon ? e.weapon.base : '') + '|' + ['head', 'body', 'legs', 'arms', 'amulet'].map((k) => (e[k] ? e[k].base : '')).join('|');
  let look = lookCache.get(key);
  if (!look) {
    const CL = data.passives.classes[p.cls], L = { ...LOOKS.hero, ...((CL && CL.look) || {}) }, lk = (k) => (e[k] ? I.bases[e[k].base] : null);
    const b = lk('body'), h = lk('head'), lg = lk('legs'), ar = lk('arms'), nk = lk('amulet');
    // ชุดบนตัวใช้ภาพเดียวกับไอคอนเป็นลายเสื้อ/กางเกง (แบบเอโดเรีย) + สีวัสดุเดียวกัน
    if (b) { L.top = matColor(b); L.collar = (b.look && b.look.trim) || shade(L.top, 0.08); L.plates = null; L.straps = null; L.bodyArt = itemSprite(I, e.body.base, 64); }
    if (h) { L.hat = (h.look && h.look.hat) || 'band'; L.hatColor = matColor(h); L.hatArt = itemSprite(I, e.head.base, 64); }
    if (lg) { L.leg = matColor(lg); L.leg2 = shade(L.leg, 0.06); L.guard = lg.look && lg.look.guard; L.legArt = itemSprite(I, e.legs.base, 64); }
    if (ar) { L.fore = matColor(ar); L.foreArt = itemSprite(I, e.arms.base, 64); }
    if (nk) L.neck = nk.color;
    const wk = e.weapon && (I.bases[e.weapon.base].look || {}).kind;
    L.weapon = ['staff', 'bow', 'crossbow'].includes(wk) ? 'staff' : 'sword';   // คทา/ธนู/หน้าไม้ = ถือตั้งตรง ไม่สะพายหลัง ไม่เหวี่ยงฟัน
    if (lookCache.size > 64) lookCache.clear();
    lookCache.set(key, look = L);
  }
  return look;
}

// อาวุธ + ประกายตามของที่ดีที่สุดที่สวม (แดง/ม่วง แบบเอโดเรีย)
export function gearOf(data, p) {
  const e = p.equip || {}, I = data.items, w = e.weapon;
  const rs = Object.values(e).filter(Boolean).map((it) => it.rarity);
  return {
    blade: w ? I.bases[w.base].color : '#d8e0e4',
    weaponArt: w ? weaponInHand(I, w.base) : null,
    weapon: w ? ((I.bases[w.base].look || {}).kind || 'sword') : 'sword',
    glow: rs.includes('red') ? I.rarity.red.color : rs.includes('purple') ? I.rarity.purple.color : null,
  };
}

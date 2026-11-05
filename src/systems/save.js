// เซฟ/โหลด — มีที่เขียนเซฟที่เดียวคือไฟล์นี้ มีเลขเวอร์ชันเซฟ
import { validTree } from './passives.js';
import { validAscend } from './ascend.js';
import { validItems, emptyEquip } from './items.js';

export const SAVE_VERSION = 14;
const KEY = 'ploy.save';

// ตัวแปลงเซฟรุ่นเก่า → รุ่นใหม่ (เพิ่มที่นี่เมื่อเปลี่ยนรูปแบบเซฟ)
const MIGRATIONS = {
  // v1 → v2: จาก "รายการพลอย" เป็นกระเป๋า + ช่องฝัง 2 ชุด (ทับทิมฝังชุดแรกให้)
  1: (d) => {
    const gems = Array.isArray(d.gems) ? d.gems : [];
    const sockets = [[gems.includes('ruby') ? 'ruby' : null, null, null], [null, null, null]];
    const { gems: _old, ...rest } = d;
    return { ...rest, v: 2, bag: gems.filter((g) => g !== 'ruby'), sockets };
  },
  // v2 → v3: เพิ่มต้นพาสซีฟ (ว่าง)
  2: (d) => ({ ...d, v: 3, passives: [] }),
  // v3 → v4: เพิ่มไอเท็ม (กระเป๋าของ + ช่องสวมใส่)
  3: (d) => ({ ...d, v: 4, items: [], equip: { weapon: null, head: null, body: null, amulet: null, ring1: null, ring2: null }, nextUid: 0 }),
  // v4 → v5: ช่องชุดแบบเอโดเรีย (แหวนวงเดียว + กางเกง + ปลอกแขน) และสีระดับ ขาว/เขียว/ม่วง/แดง
  4: (d) => {
    const rmap = (it) => it && ({ ...it, rarity: it.rarity === 'magic' ? 'green' : it.rarity === 'rare' ? (it.mods.length >= 4 ? 'red' : 'purple') : it.rarity });
    const e = d.equip || {}, items = (d.items || []).map(rmap);
    if (e.ring2) items.push(rmap(e.ring2));
    const equip = { ...emptyEquip(), weapon: rmap(e.weapon), head: rmap(e.head), body: rmap(e.body), amulet: rmap(e.amulet), ring: rmap(e.ring1) };
    return { ...d, v: 5, items: items.slice(0, 30), equip };
  },
  // v5 → v6: ยาหม้อจากร้านแม่ค้า (เซฟเก่าเริ่มที่ 0 ขวด)
  5: (d) => ({ ...d, v: 6, potions: 0 }),
  // v6 → v7: ช่องพลอยย้ายไปอยู่บนอาวุธ/เสื้อ (แบบ PoE) — ชุด 1 → อาวุธ 3 ช่องเชื่อมกัน, ชุด 2 → เสื้อ 3 ช่องเชื่อมกัน
  // อาวุธ/เสื้ออื่นได้ 2 ช่องไม่เชื่อม · พลอยที่ไม่มีที่ลงกลับกระเป๋า · แถมศิลาเจาะ+ด้ายสายสิญจน์อย่างละ 1
  6: (d) => {
    const slotOf = { weapon: ['bamboo_sword', 'iron_sword', 'silver_kris', 'brass_glaive', 'naga_blade'], body: ['cotton_shirt', 'buffalo_vest', 'naga_mail', 'bronze_cuirass'] };
    const kind = (it) => (slotOf.weapon.includes(it.base) ? 'weapon' : slotOf.body.includes(it.base) ? 'body' : null);
    const give = (it, gems) => (it && kind(it) ? { ...it, sockets: gems.length, links: gems.slice(1).map(() => gems.length === 3), gems } : it);
    const bag = (d.bag || []).slice(), rows = d.sockets || [];
    const equip = { ...d.equip };
    ['weapon', 'body'].forEach((s, gi) => {
      const row = (rows[gi] || []).slice(0, 3);
      if (equip[s] && kind(equip[s])) equip[s] = give(equip[s], [0, 1, 2].map((i) => row[i] || null));
      else bag.push(...row.filter(Boolean));
    });
    const items = (d.items || []).map((it) => give(it, [null, null]));
    const { sockets: _s, ...rest } = d;
    return { ...rest, v: 7, bag, equip, items, currency: { jeweller: 1, fusing: 1 } };
  },
  // v7 → v8: ขวดน้ำมนต์ (มานา) แถมให้ 2 ขวด
  7: (d) => ({ ...d, v: 8, mpPotions: 2 }),
  // v8 → v9: ช่องพลอยมีสี (แบบ PoE) — ช่องที่มีพลอยได้สีตรงกับพลอย ช่องว่างเป็นสีขาว (ใส่ได้ทุกสี) · แถมหินเจ็ดสี 1
  8: (d) => {
    const GC = { ruby: 'r', sapphire: 'b', emerald: 'g', topaz: 'b', multi: 'g', pierce: 'g', area: 'r', haste: 'b', power: 'r' };
    const paint = (it) => (it && it.sockets !== undefined ? { ...it, colors: it.gems.map((g) => (g && GC[g]) || 'w') } : it);
    const equip = Object.fromEntries(Object.entries(d.equip || {}).map(([k, it]) => [k, paint(it)]));
    return { ...d, v: 9, equip, items: (d.items || []).map(paint), currency: { ...(d.currency || {}), chroma: ((d.currency || {}).chroma || 0) + 1 } };
  },
  // v9 → v10: เลเวลพลอย (XP สะสมต่อชนิดพลอย) เริ่มที่ 0
  9: (d) => ({ ...d, v: 10, gemXp: {} }),
  // v10 → v11: หีบเก็บของในเวียง เริ่มว่าง
  10: (d) => ({ ...d, v: 11, stash: [] }),
  // v11 → v12: แต้มพาสซีฟจากเควสรอง (บทแบบ PoE) · รางวัลเควสหลักที่ทำไปแล้วนับว่ารับแล้ว (ไม่ให้ซ้ำ)
  // v12 → v13: อาชีพ + ชื่อตัวละคร (เซฟเก่า: อาชีพจากสายที่เลือกในต้นพาสซีฟ ไม่มี = นักรบ)
  12: (d) => { const st = ['warrior', 'ranger', 'shaman'].find((c) => (d.passives || []).includes(c)); return { ...d, v: 13, cls: st || 'warrior', name: 'นักล่าพลอย', passives: st ? d.passives : ['warrior', ...(d.passives || [])] }; },
  // v13 → v14: อาชีพเลื่อนขั้น (ยังไม่ได้เลือก)
  13: (d) => ({ ...d, v: 14, ascend: null, ascNodes: [] }),
  11: (d) => ({ ...d, v: 12, questPoints: 0, flags: { ...d.flags, ...(d.flags.heardHimmapan ? { q_q1_main: true } : {}) } }),
};

export function serialize(game) {
  const p = game.player, z = game.world.zone, at = z.def.saveAt;   // ในดันเจี้ยน: เซฟไว้ที่หน้าทางเข้า (โหลดแล้วเริ่มดันใหม่)
  return {
    v: SAVE_VERSION, savedAt: Date.now(),
    zone: at ? at.zone : z.id, x: Math.round(at ? at.x * 32 : p.x), y: Math.round(at ? at.y * 32 : p.y),
    level: p.level, xp: p.xp, coins: p.coins, potions: p.potions, mpPotions: p.mpPotions, hp: Math.round(p.hp), mp: Math.round(p.mp),
    items: JSON.parse(JSON.stringify(p.items)), stash: JSON.parse(JSON.stringify(p.stash || [])), equip: JSON.parse(JSON.stringify(p.equip)), nextUid: p.nextUid,
    passives: p.passives.slice(), gemXp: { ...(p.gemXp || {}) }, questPoints: p.questPoints || 0, ascend: p.ascend || null, ascNodes: (p.ascNodes || []).slice(), cls: p.cls, name: p.name, bag: p.bag.slice(), currency: { ...p.currency }, flags: { ...game.flags },
  };
}

export function validate(s, data) {
  const zones = data.zones, gemsData = data.gems;
  if (!s || typeof s !== 'object') return null;
  let d = s;
  while (d.v !== SAVE_VERSION) { const m = MIGRATIONS[d.v]; if (!m) return null; d = m(d); }
  const num = (v, lo, hi) => typeof v === 'number' && isFinite(v) && v >= lo && v <= hi;
  if (!zones[d.zone] || !num(d.level, 1, 999) || !num(d.xp, 0, 1e9) || !num(d.coins, 0, 1e12)) return null;
  if (!Number.isInteger(d.potions) || !num(d.potions, 0, data.shop ? data.shop.potion.max : 99)) return null;
  if (!Number.isInteger(d.mpPotions) || !num(d.mpPotions, 0, data.shop ? data.shop.manaPotion.max : 99)) return null;
  if (!num(d.x, 0, 1e6) || !num(d.y, 0, 1e6) || !d.flags || typeof d.flags !== 'object') return null;
  const known = (g) => !gemsData || !!(gemsData.main[g] || gemsData.support[g]);
  if (!Array.isArray(d.bag) || !d.bag.every((g) => typeof g === 'string' && known(g)) || d.bag.length > 500) return null;
  if ((data.passives && !data.passives.classes[d.cls]) || typeof d.name !== 'string' || !d.name.trim() || d.name.length > 16) return null;
  if (!Number.isInteger(d.questPoints) || d.questPoints < 0 || d.questPoints > 50) return null;
  if (!d.gemXp || typeof d.gemXp !== 'object' || !Object.entries(d.gemXp).every(([k, v]) => known(k) && Number.isInteger(v) && v >= 0 && v <= 1e7)) return null;
  if (!d.currency || typeof d.currency !== 'object' || !Object.entries(d.currency).every(([k, v]) => (!data.items || data.items.currency[k]) && Number.isInteger(v) && v >= 0 && v <= 9999)) return null;
  if (data.ascendancy && !validAscend(data.ascendancy, d)) return null;
  if (data.passives && !validTree(data.passives, d.passives, d.level)) return null;
  if (data.items && (!Number.isInteger(d.nextUid) || !validItems(data.items, d.items, d.equip, d.nextUid, gemsData, d.stash))) return null;
  return d;
}

// เล่นออนไลน์: เก็บสำรองในเครื่องแยกคีย์ตามตัวละคร (ไม่ทับเซฟออฟไลน์) แล้วส่งขึ้นเซิร์ฟเวอร์ผ่าน game.onSaved (net/cloud.js)
export function writeSave(game) {
  const s = serialize(game);
  if (game.mode === 'title' || game.mode === 'login' || game.mode === 'chars') return null;
  try { localStorage.setItem(game.saveKey || KEY, JSON.stringify(s)); } catch { /* เครื่องเก็บไม่ได้ ยังส่งออนไลน์ได้ */ }
  game.lastSave = s;
  if (game.onSaved) game.onSaved(s);
  return s;
}

export function readSave(data) {
  try { const raw = localStorage.getItem(KEY); return raw ? validate(JSON.parse(raw), data) : null; } catch { return null; }
}

export function clearSave() { try { localStorage.removeItem(KEY); } catch { /* ข้าม */ } }

export function setupAutosave(game) {
  const save = () => writeSave(game);
  ['zoneChanged', 'levelUp', 'gemPicked', 'metChan', 'gemsChanged', 'passivesChanged', 'itemPicked', 'gearChanged', 'bossKilled', 'shopChanged', 'currencyPicked', 'currencyUsed', 'waypointUnlocked', 'gemLevelUp', 'itemMoved', 'questClaimed', 'questProgress'].forEach((e) => game.events.on(e, save));
  game.autosaveT = 0;
}

export function updateAutosave(game, dt) {
  if (game.mode === 'title' || game.mode === 'login' || game.mode === 'chars' || game.mode === 'create') return;
  game.autosaveT += dt;
  if (game.autosaveT >= game.data.balance.autosaveSeconds) { game.autosaveT = 0; writeSave(game); }
}

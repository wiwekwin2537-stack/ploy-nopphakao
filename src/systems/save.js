// เซฟ/โหลด — มีที่เขียนเซฟที่เดียวคือไฟล์นี้ มีเลขเวอร์ชันเซฟ
import { validTree } from './passives.js';
import { validItems, emptyEquip } from './items.js';

export const SAVE_VERSION = 6;
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
};

export function serialize(game) {
  const p = game.player, z = game.world.zone, at = z.def.saveAt;   // ในดันเจี้ยน: เซฟไว้ที่หน้าทางเข้า (โหลดแล้วเริ่มดันใหม่)
  return {
    v: SAVE_VERSION, savedAt: Date.now(),
    zone: at ? at.zone : z.id, x: Math.round(at ? at.x * 32 : p.x), y: Math.round(at ? at.y * 32 : p.y),
    level: p.level, xp: p.xp, coins: p.coins, potions: p.potions, hp: Math.round(p.hp), mp: Math.round(p.mp),
    items: JSON.parse(JSON.stringify(p.items)), equip: JSON.parse(JSON.stringify(p.equip)), nextUid: p.nextUid,
    passives: p.passives.slice(), bag: p.bag.slice(), sockets: p.sockets.map((r) => r.slice()), flags: { ...game.flags },
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
  if (!num(d.x, 0, 1e6) || !num(d.y, 0, 1e6) || !d.flags || typeof d.flags !== 'object') return null;
  const known = (g) => !gemsData || !!(gemsData.main[g] || gemsData.support[g]);
  if (!Array.isArray(d.bag) || !d.bag.every((g) => typeof g === 'string' && known(g)) || d.bag.length > 500) return null;
  if (!Array.isArray(d.sockets) || !d.sockets.every((r) => Array.isArray(r) && r.every((g) => g === null || known(g)))) return null;
  if (gemsData && d.sockets.some((r) => (r[0] && !gemsData.main[r[0]]) || r.slice(1).some((g) => g && !gemsData.support[g]))) return null;
  if (data.passives && !validTree(data.passives, d.passives, d.level)) return null;
  if (data.items && (!Number.isInteger(d.nextUid) || !validItems(data.items, d.items, d.equip, d.nextUid))) return null;
  return d;
}

export function writeSave(game) {
  const s = serialize(game);
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { return null; }
  game.lastSave = s;
  return s;
}

export function readSave(data) {
  try { const raw = localStorage.getItem(KEY); return raw ? validate(JSON.parse(raw), data) : null; } catch { return null; }
}

export function clearSave() { try { localStorage.removeItem(KEY); } catch { /* ข้าม */ } }

export function setupAutosave(game) {
  const save = () => { if (game.mode !== 'title') writeSave(game); };
  ['zoneChanged', 'levelUp', 'gemPicked', 'metChan', 'gemsChanged', 'passivesChanged', 'itemPicked', 'gearChanged', 'bossKilled', 'shopChanged'].forEach((e) => game.events.on(e, save));
  game.autosaveT = 0;
}

export function updateAutosave(game, dt) {
  if (game.mode === 'title') return;
  game.autosaveT += dt;
  if (game.autosaveT >= game.data.balance.autosaveSeconds) { game.autosaveT = 0; writeSave(game); }
}

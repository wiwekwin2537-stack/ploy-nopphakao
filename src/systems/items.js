// ไอเท็มสุ่มค่า: ฐานไอเท็ม + ค่าสุ่มหน้า (prefix) / หลัง (suffix) ตามระดับไอเท็ม — ตัวเลขทั้งหมดอยู่ใน data/items.json
// กติกา: ทุกชิ้นมี uid ไม่ซ้ำ สวม/ถอด/ทิ้ง ย้ายชิ้นเดิม ไม่สร้างของใหม่

// ช่องชุดครบแบบเอโดเรีย
export const EQUIP_SLOTS = ['weapon', 'head', 'body', 'legs', 'arms', 'amulet', 'ring'];
export const RARITY_ORDER = ['normal', 'green', 'purple', 'red'];

export function emptyEquip() { return Object.fromEntries(EQUIP_SLOTS.map((s) => [s, null])); }
const slotKind = (I, s) => I.slots[s].kind || s;

function pickTier(aff, ilvl) {
  let tier = null, ti = -1;
  aff.tiers.forEach((t, i) => { if (ilvl >= t[0]) { tier = t; ti = i; } });
  return tier ? { tier, ti } : null;
}

export function rollItem(I, rng, ilvl, opts = {}) {
  const bases = Object.entries(I.bases).filter(([, b]) => b.req <= Math.max(1, ilvl) && (!opts.slot || b.slot === opts.slot));
  if (!bases.length) return null;
  const [baseId, base] = rng.pick(bases);
  let rarity = opts.rarity;
  if (!rarity) {                                              // ลองจากหายากสุดลงมา: แดง → ม่วง → เขียว → ทั่วไป
    rarity = 'normal';
    for (const r of ['red', 'purple', 'green']) if (rng.chance(I.rarity[r].chance)) { rarity = r; break; }
  }
  const [lo, hi] = I.rarity[rarity].affixes;
  const want = rng.int(lo, hi);
  const mods = [];
  const pool = Object.entries(I.affixes).filter(([, a]) => a.slots.includes(base.slot) && pickTier(a, ilvl));
  let prefixes = 0, suffixes = 0;
  for (let tries = 0; mods.length < want && tries < 40; tries++) {
    const [aid, a] = rng.pick(pool.length ? pool : [[null, null]]);
    if (!aid || mods.some((m) => m.id === aid)) continue;
    if (a.type === 'prefix' ? prefixes >= 2 : suffixes >= 2) continue;
    const { tier, ti } = pickTier(a, ilvl);
    mods.push({ id: aid, tier: ti, value: rng.int(tier[1], tier[2]) });
    if (a.type === 'prefix') prefixes++; else suffixes++;
  }
  let rareName = null;
  if (rarity === 'purple' || rarity === 'red') rareName = rng.pick(I.rareNames.first) + rng.pick(I.rareNames.second);
  return { uid: 0, base: baseId, rarity, ilvl, mods, rareName };
}

export function itemName(I, it) {
  const b = I.bases[it.base];
  if (it.rarity === 'red') return '【' + it.rareName + '】 ' + b.name;
  if (it.rarity === 'purple') return it.rareName + ' · ' + b.name;
  if (it.rarity === 'green') {
    const pre = it.mods.map((m) => I.affixes[m.id]).filter((a) => a.type === 'prefix')[0];
    const suf = it.mods.map((m) => I.affixes[m.id]).filter((a) => a.type === 'suffix')[0];
    return [b.name, pre && pre.word, suf && suf.word].filter(Boolean).join(' ');
  }
  return b.name;
}

// ค่ารวมของไอเท็มชิ้นเดียว (ฐาน + ค่าสุ่ม)
export function itemStats(I, it) {
  const t = { ...I.bases[it.base].stats };
  for (const m of it.mods) { const a = I.affixes[m.id]; t[a.stat] = (t[a.stat] || 0) + m.value; }
  return t;
}

export function giveItem(p, I, it) {
  if (p.items.length >= I.bagSize) return false;
  it.uid = ++p.nextUid;
  p.items.push(it);
  return true;
}

export function canEquip(I, p, it, slot) {
  const b = I.bases[it.base];
  return !!b && slotKind(I, slot) === b.slot && p.level >= b.req;
}

// ใส่จากกระเป๋า: แหวนลงช่องว่างก่อน (ไม่งั้นแหวนวงแรก) ของเดิมกลับเข้ากระเป๋า
export function equipFromBag(I, p, uid) {
  const i = p.items.findIndex((x) => x.uid === uid);
  if (i < 0) return false;
  const it = p.items[i], b = I.bases[it.base];
  const slots = EQUIP_SLOTS.filter((s) => slotKind(I, s) === b.slot);
  const slot = slots.find((s) => !p.equip[s]) || slots[0];
  if (!slot || !canEquip(I, p, it, slot)) return false;
  p.items.splice(i, 1);
  if (p.equip[slot]) p.items.push(p.equip[slot]);
  p.equip[slot] = it;
  return slot;
}

export function unequip(I, p, slot) {
  const it = p.equip[slot];
  if (!it || p.items.length >= I.bagSize) return false;
  p.equip[slot] = null;
  p.items.push(it);
  return true;
}

export function discard(p, uid) {
  const i = p.items.findIndex((x) => x.uid === uid);
  if (i < 0) return false;
  p.items.splice(i, 1);
  return true;
}

// รวมค่าจากของที่สวมทั้งหมด (ใช้ใน stats.js)
export function equipTotals(I, p) {
  const t = {};
  for (const s of EQUIP_SLOTS) {
    const it = p.equip && p.equip[s];
    if (!it || !I.bases[it.base] || p.level < I.bases[it.base].req) continue;
    for (const [k, v] of Object.entries(itemStats(I, it))) t[k] = (t[k] || 0) + v;
  }
  return t;
}

// ตรวจไอเท็มจากเซฟ: ฐาน/ค่าสุ่มมีจริง ค่าอยู่ในช่วงของเทียร์ uid ไม่ซ้ำ (กันแก้เซฟ/ปั๊มของ)
export function validItems(I, items, equip, nextUid) {
  const all = [...(items || []), ...Object.values(equip || {}).filter(Boolean)];
  if (!Array.isArray(items) || items.length > I.bagSize) return false;
  const uids = new Set();
  for (const it of all) {
    if (!it || !I.bases[it.base] || !I.rarity[it.rarity] || !Number.isInteger(it.uid) || it.uid < 1 || it.uid > nextUid || uids.has(it.uid)) return false;
    uids.add(it.uid);
    if (!Array.isArray(it.mods) || it.mods.length > I.rarity[it.rarity].affixes[1]) return false;
    for (const m of it.mods) {
      const a = I.affixes[m.id], tier = a && a.tiers[m.tier];
      if (!tier || !a.slots.includes(I.bases[it.base].slot) || !(m.value >= tier[1] && m.value <= tier[2])) return false;
    }
  }
  for (const [s, it] of Object.entries(equip || {})) {
    if (!EQUIP_SLOTS.includes(s)) return false;
    if (it && slotKind(I, s) !== I.bases[it.base].slot) return false;
  }
  return true;
}

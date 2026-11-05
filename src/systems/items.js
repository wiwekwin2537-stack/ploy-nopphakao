// ไอเท็มสุ่มค่า: ฐานไอเท็ม + ค่าสุ่มหน้า (prefix) / หลัง (suffix) ตามระดับไอเท็ม — ตัวเลขทั้งหมดอยู่ใน data/items.json
// กติกา: ทุกชิ้นมี uid ไม่ซ้ำ สวม/ถอด/ทิ้ง ย้ายชิ้นเดิม ไม่สร้างของใหม่
// อาวุธ/เสื้อมีช่องพลอย (sockets/links/gems) แบบ PoE — ทิ้ง/ขายของ พลอยในช่องกลับเข้ากระเป๋าเสมอ
import { returnGems, socketFits } from './gems.js';

// ช่องชุดครบแบบเอโดเรีย
export const EQUIP_SLOTS = ['weapon', 'head', 'body', 'legs', 'arms', 'amulet', 'ring'];

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
  const [baseId] = rng.pick(bases);
  let rarity = opts.rarity;
  if (!rarity) {                                              // ลองจากหายากสุดลงมา: แดง → ม่วง → เขียว → ทั่วไป
    rarity = 'normal';
    for (const r of ['red', 'purple', 'green']) if (rng.chance(I.rarity[r].chance)) { rarity = r; break; }
  }
  const { mods, rareName } = rollMods(I, rng, baseId, ilvl, rarity);
  return rollSockets(I, rng, { uid: 0, base: baseId, rarity, ilvl, mods, rareName });
}

// สุ่มค่า (prefix ≤2, suffix ≤2) ตามระดับความหายาก — ใช้ทั้งตอนดรอปและตอนเล่นแร่แปรธาตุ
function rollMods(I, rng, baseId, ilvl, rarity) {
  const base = I.bases[baseId];
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
  return { mods, rareName };
}

// เล่นแร่แปรธาตุแบบ PoE (ของในกระเป๋าหรือที่สวม): gild ทองคำเปลว = ทั่วไป→เขียว · alch ปรอท = ทั่วไป→ม่วง
// · kali เถ้ากาลี = สุ่มค่าของม่วง/แดงใหม่ทั้งหมด · uid ช่องพลอยไม่เปลี่ยน · ใช้ไม่ได้ = null (ไม่เสียของ)
export function craftItem(I, rng, p, kind, it) {
  if (!it || !I.currency[kind] || !(p.currency && p.currency[kind] > 0)) return null;
  if (kind === 'exalt') return exaltItem(I, rng, p, it);
  const need = { gild: ['normal'], alch: ['normal'], kali: ['purple', 'red'] }[kind];
  if (!need || !need.includes(it.rarity)) return null;
  const rarity = kind === 'gild' ? 'green' : kind === 'alch' ? 'purple' : it.rarity;
  let r;
  for (let tries = 0; tries < 10; tries++) {
    r = rollMods(I, rng, it.base, it.ilvl, rarity);
    if (r.mods.length >= I.rarity[rarity].affixes[0] && JSON.stringify(r.mods) !== JSON.stringify(it.mods)) break;
  }
  Object.assign(it, { rarity, mods: r.mods, rareName: r.rareName });
  p.currency[kind]--;
  return itemName(I, it);
}

// มณีโชติ: เพิ่มค่าสุ่ม 1 ค่า (เขียว 1 ค่า → 2 ค่า · ม่วง → แดง ค่าที่ 4) — ค่าเดิมไม่เปลี่ยน
function exaltItem(I, rng, p, it) {
  const n = it.mods.length, toRed = it.rarity === 'purple';
  if (!(toRed || (it.rarity === 'green' && n < I.rarity.green.affixes[1]))) return null;
  const base = I.bases[it.base], count = (t) => it.mods.filter((m) => I.affixes[m.id].type === t).length;
  const pool = Object.entries(I.affixes).filter(([aid, a]) => a.slots.includes(base.slot) && pickTier(a, it.ilvl)
    && !it.mods.some((m) => m.id === aid) && count(a.type) < 2);
  if (!pool.length) return null;
  const [aid, a] = rng.pick(pool), { tier, ti } = pickTier(a, it.ilvl);
  it.mods.push({ id: aid, tier: ti, value: rng.int(tier[1], tier[2]) });
  if (toRed) it.rarity = 'red';
  p.currency.exalt--;
  return itemName(I, it);
}

// ช่องพลอยสูงสุดของชิ้นนี้: ตามชนิด (อาวุธ/เสื้อ 6) และเลเวลของ (ของเลเวลต่ำมีช่องน้อย)
export function socketMax(I, it) {
  const S = I.sockets, b = I.bases[it.base], slotMax = b ? S.slots[b.slot] || 0 : 0;
  let lv = 0;
  for (const [minIlvl, n] of S.ilvlMax) if ((it.ilvl || 1) >= minIlvl) lv = n;
  return Math.min(slotMax, lv);
}

function rollCount(I, rng, max, not) {
  const W = I.sockets.countWeights;
  for (let tries = 0; tries < 20; tries++) {
    let total = 0; for (let n = 1; n <= max; n++) total += W[n];
    let r = rng.next() * total, n = 1;
    for (; n < max; n++) { r -= W[n]; if (r < 0) break; }
    if (n !== not || max <= 1) return n;
  }
  return not === 1 ? Math.min(2, max) : 1;
}
function rollLinks(I, rng, n, old) {
  for (let tries = 0; tries < 20; tries++) {
    const l = Array.from({ length: Math.max(0, n - 1) }, () => rng.chance(I.sockets.linkChance));
    if (!old || n < 2 || l.some((v, i) => v !== old[i])) return l;
  }
  return old.map((v) => !v);
}

// ใส่ช่องพลอยให้ของที่เพิ่งสุ่ม/ซื้อ (ของที่ไม่มีช่องได้ค่าว่าง)
export function rollSockets(I, rng, it) {
  const max = socketMax(I, it);
  if (!max) return it;
  const n = rollCount(I, rng, max);
  return Object.assign(it, { sockets: n, links: rollLinks(I, rng, n), gems: Array(n).fill(null), colors: rollColors(I, rng, it, n) });
}

// สีช่องตามน้ำหนักของชนิดของ (อาวุธเอียงแดง เสื้อพอๆ กัน) ใน data/items.json sockets.colorWeights
function rollColor(I, rng, it) {
  const W = I.sockets.colorWeights[I.bases[it.base].slot] || { r: 1, g: 1, b: 1 }, total = Object.values(W).reduce((a, v) => a + v, 0);
  let r = rng.next() * total;
  for (const [c, w] of Object.entries(W)) { r -= w; if (r < 0) return c; }
  return 'r';
}
function rollColors(I, rng, it, n, old) {
  for (let tries = 0; tries < 20; tries++) {
    const c = Array.from({ length: n }, () => rollColor(I, rng, it));
    if (!old || c.some((v, i) => v !== old[i])) return c;
  }
  return old.map((v) => ({ r: 'g', g: 'b', b: 'r', w: 'r' }[v]));
}

// ใช้ของเชื่อม/เจาะ/ย้อมสี: jeweller = สุ่มจำนวนช่องใหม่ · fusing = สุ่มการเชื่อมใหม่ · chroma = สุ่มสีช่องใหม่ (ไม่ซ้ำเดิมทุกแบบ)
// พลอยในช่องที่หายไป/สีไม่ตรงกลับเข้ากระเป๋า · คืนข้อความผล หรือ null ถ้าใช้ไม่ได้ (ไม่เสียของ)
export function useCurrency(I, rng, p, kind, it, G) {
  if (!it || !I.currency[kind] || !(p.currency && p.currency[kind] > 0)) return null;
  const max = socketMax(I, it);
  if (!max || !it.sockets) return null;
  if (kind === 'jeweller') {
    if (max < 2) return null;
    const n = rollCount(I, rng, max, it.sockets);
    for (let i = n; i < it.sockets; i++) if (it.gems[i]) p.bag.push(it.gems[i]);
    const gems = Array.from({ length: n }, (_, i) => it.gems[i] || null);
    const links = Array.from({ length: Math.max(0, n - 1) }, (_, i) => !!it.links[i]);
    const colors = Array.from({ length: n }, (_, i) => (it.colors && it.colors[i]) || rollColor(I, rng, it));
    Object.assign(it, { sockets: n, gems, links, colors });
  } else if (kind === 'fusing') {
    if (it.sockets < 2) return null;
    it.links = rollLinks(I, rng, it.sockets, it.links);
  } else if (kind === 'chroma') {
    it.colors = rollColors(I, rng, it, it.sockets, it.colors);
    it.gems.forEach((g, i) => { if (g && G && !socketFits(G, g, it.colors[i])) { p.bag.push(g); it.gems[i] = null; } });
  } else return null;
  p.currency[kind]--;
  const C = { r: 'แดง', g: 'เขียว', b: 'น้ำเงิน', w: 'ขาว' };
  return kind === 'jeweller' ? `ได้ ${it.sockets} ช่อง` : kind === 'fusing' ? `เชื่อมกันยาวสุด ${longestLink(it)} ช่อง` : 'สีใหม่: ' + it.colors.map((c) => C[c]).join(' ');
}

export function longestLink(it) {
  let best = it.sockets ? 1 : 0, run = 1;
  (it.links || []).forEach((l) => { run = l ? run + 1 : 1; best = Math.max(best, run); });
  return best;
}

export function itemName(I, it) {
  const b = I.bases[it.base];
  if (it.rarity === 'unique') return I.uniques[it.unique].name;
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
  if (it.rarity === 'unique') for (const [k, v] of Object.entries(I.uniques[it.unique].stats)) t[k] = (t[k] || 0) + v;   // ค่าตายตัวของยูนีค
  for (const m of it.mods) { const a = I.affixes[m.id]; t[a.stat] = (t[a.stat] || 0) + m.value; }
  const cr = it.craft && I.bench && I.bench.recipes.find((r) => r.id === it.craft);   // ค่าคราฟต์จากโต๊ะช่าง
  if (cr) t[cr.stat] = (t[cr.stat] || 0) + cr.value;
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
  returnGems(p, p.items[i]);
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
// ช่องพลอยถูกต้อง: เฉพาะชนิดที่มีช่อง ไม่เกินสูงสุด links/gems ยาวพอดี พลอยมีจริง
function validSockets(I, it, G) {
  const slotMax = I.sockets.slots[I.bases[it.base].slot] || 0;
  if (it.sockets === undefined) return it.links === undefined && it.gems === undefined && it.colors === undefined;
  if (!Number.isInteger(it.sockets) || it.sockets < 0 || it.sockets > slotMax) return false;
  if (!Array.isArray(it.links) || it.links.length !== Math.max(0, it.sockets - 1) || !it.links.every((l) => typeof l === 'boolean')) return false;
  if (!Array.isArray(it.gems) || it.gems.length !== it.sockets) return false;
  if (!Array.isArray(it.colors) || it.colors.length !== it.sockets || !it.colors.every((c) => ['r', 'g', 'b', 'w'].includes(c))) return false;
  return it.gems.every((g, i) => g === null || (typeof g === 'string' && (!G || ((G.main[g] || G.support[g]) && socketFits(G, g, it.colors[i])))));
}

export function validItems(I, items, equip, nextUid, G, stash = []) {
  if (!Array.isArray(items) || items.length > I.bagSize || !Array.isArray(stash) || stash.length > I.stashSize) return false;
  const all = [...items, ...stash, ...Object.values(equip || {}).filter(Boolean)];   // uid ห้ามซ้ำทั้งกระเป๋า หีบ และของที่สวม
  const uids = new Set();
  for (const it of all) {
    if (!it || !I.bases[it.base] || !I.rarity[it.rarity] || !Number.isInteger(it.uid) || it.uid < 1 || it.uid > nextUid || uids.has(it.uid)) return false;
    uids.add(it.uid);
    if (it.rarity === 'unique' && (!I.uniques[it.unique] || it.unique === '_doc' || I.uniques[it.unique].base !== it.base)) return false;
    if (!Array.isArray(it.mods) || it.mods.length > I.rarity[it.rarity].affixes[1]) return false;
    if (!validSockets(I, it, G)) return false;
    if (it.craft !== undefined) { const r = I.bench && I.bench.recipes.find((x) => x.id === it.craft); if (!r || it.rarity === 'unique' || !r.slots.includes(I.bases[it.base].slot)) return false; }
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

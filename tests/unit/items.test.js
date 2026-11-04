import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGame } from './helpers.js';
import { createRng } from '../../src/core/rng.js';
import { rollItem, giveItem, equipFromBag, unequip, discard, validItems, itemName, EQUIP_SLOTS } from '../../src/systems/items.js';
import { playerStats } from '../../src/systems/stats.js';
import { serialize, validate } from '../../src/systems/save.js';
import { damageMob } from '../../src/systems/combat.js';
import { makeMob } from '../../src/systems/monsters.js';
import { updateLoot } from '../../src/systems/loot.js';

test('สุ่มของ 3000 ชิ้น: ค่าอยู่ในช่วงเทียร์ ไม่มีค่าซ้ำ หน้า/หลังไม่เกิน 2 และไม่เกินระดับของ', () => {
  const I = makeGame().data.items, rng = createRng(7);
  const counts = { normal: 0, green: 0, purple: 0, red: 0 };
  for (let i = 0; i < 3000; i++) {
    const lvl = 1 + (i % 10), it = rollItem(I, rng, lvl);
    counts[it.rarity]++;
    assert.ok(I.bases[it.base].req <= lvl);
    const ids = it.mods.map((m) => m.id);
    assert.equal(new Set(ids).size, ids.length);
    assert.ok(it.mods.filter((m) => I.affixes[m.id].type === 'prefix').length <= 2);
    for (const m of it.mods) { const t = I.affixes[m.id].tiers[m.tier]; assert.ok(m.value >= t[1] && m.value <= t[2] && t[0] <= lvl); }
    assert.ok(itemName(I, it).length > 0);
  }
  assert.ok(counts.red > 5 && counts.purple > 100 && counts.green > 500 && counts.normal > 1000, JSON.stringify(counts));
});

test('สวม/ถอด/ทิ้ง: ของไม่งอก uid ไม่ซ้ำ ใส่ชิ้นใหม่สลับชิ้นเดิมเข้ากระเป๋า', () => {
  const g = makeGame(), I = g.data.items, p = g.player, rng = createRng(3);
  p.level = 10;
  for (const slot of ['weapon', 'ring', 'ring', 'legs', 'body']) giveItem(p, I, rollItem(I, rng, 8, { slot }));
  const uids = p.items.map((x) => x.uid);
  assert.equal(new Set(uids).size, 5);
  const ring = p.items.filter((x) => I.bases[x.base].slot === 'ring');
  assert.equal(equipFromBag(I, p, ring[0].uid), 'ring');
  assert.equal(equipFromBag(I, p, ring[1].uid), 'ring', 'แหวนวงที่สองสลับวงแรก');
  assert.ok(p.items.some((x) => x.uid === ring[0].uid), 'วงแรกกลับเข้ากระเป๋า');
  assert.equal(equipFromBag(I, p, p.items.find((x) => I.bases[x.base].slot === 'legs').uid), 'legs');
  const all = () => p.items.length + EQUIP_SLOTS.filter((s) => p.equip[s]).length;
  assert.equal(all(), 5);
  EQUIP_SLOTS.forEach((s) => unequip(I, p, s));
  assert.equal(all(), 5);
  assert.ok(discard(p, p.items[0].uid)); assert.equal(all(), 4);
  assert.ok(validItems(I, p.items, p.equip, p.nextUid));
});

test('ต้องเลเวลถึงถึงจะสวมได้ และค่าของที่สวมเข้าค่าสถานะ', () => {
  const g = makeGame(), I = g.data.items, p = g.player;
  p.level = 2;
  giveItem(p, I, { base: 'brass_glaive', rarity: 'normal', ilvl: 6, mods: [] });
  assert.equal(equipFromBag(I, p, p.items[0].uid), false);
  p.level = 6;
  const before = playerStats(p, g.data).damage;
  assert.equal(equipFromBag(I, p, p.items[0].uid), 'weapon');
  const st = playerStats(p, g.data);
  assert.ok(Math.abs(st.damage - (before + 10)) < 1e-6, 'ง้าว +10 ดาเมจ');
  assert.ok(st.attackCooldown > g.data.balance.player.attackCooldown, 'ง้าวฟันช้าลง');
});

test('เซฟของ: โหลดกลับได้ครบ · ของปลอม/ค่าเกินเทียร์/uid ซ้ำ ถูกปฏิเสธ', () => {
  const g = makeGame(), I = g.data.items, p = g.player; g.world.load('town');
  p.level = 5; const rng = createRng(11);
  for (let i = 0; i < 4; i++) giveItem(p, I, rollItem(I, rng, 5, { rarity: 'purple' }));
  equipFromBag(I, p, p.items.find((x) => I.bases[x.base].req <= 5).uid);
  const s = validate(JSON.parse(JSON.stringify(serialize(g))), g.data);
  assert.ok(s); assert.equal(s.items.length + Object.values(s.equip).filter(Boolean).length, 4);
  const base = JSON.parse(JSON.stringify(serialize(g)));
  const forged = (fn) => { const c = JSON.parse(JSON.stringify(base)); fn(c); return validate(c, g.data); };
  assert.equal(forged((c) => { c.items[0].mods[0].value = 9999; }), null);
  assert.equal(forged((c) => { c.items[1].uid = c.items[0].uid; }), null);
  assert.equal(forged((c) => { c.items[0].base = 'excalibur'; }), null);
  assert.equal(forged((c) => { c.items[0].uid = 999; }), null);
});

test('ของดรอปจากมอนได้ครั้งเดียว และกระเป๋าเต็มของไม่หาย', () => {
  const g = makeGame(); g.world.load('field'); g.flags.tutorialDone = true;
  g.data = { ...g.data, items: { ...g.data.items, dropChance: 1, bagSize: 1 } };
  const p = g.player; p.x = 500; p.y = 500;
  for (let k = 0; k < 2; k++) { const m = makeMob(g, 'boar', 3, 505, 500); g.mobs.push(m); damageMob(g, m, 999); damageMob(g, m, 999); }
  const items = g.drops.filter((d) => d.kind === 'item');
  assert.equal(items.length, 2, 'ตาย 2 ตัวต้องได้ 2 ชิ้นพอดี');
  for (let i = 0; i < 60; i++) updateLoot(g, 0.05);
  assert.equal(p.items.length, 1);
  assert.equal(g.drops.filter((d) => d.kind === 'item').length, 1, 'ชิ้นที่เก็บไม่ได้ต้องยังอยู่ที่พื้น');
});

test('เซฟรุ่น 4 (แหวน 2 วง สีเดิม) แปลงเป็นช่องชุดแบบเอโดเรียได้ ของไม่หาย', () => {
  const g = makeGame(); g.world.load('town');
  const it = (uid, base, rarity, mods = []) => ({ uid, base, rarity, ilvl: 5, mods, rareName: rarity === 'rare' ? 'เงาไพร' : null });
  const old = { v: 4, zone: 'town', x: 300, y: 300, level: 5, xp: 0, coins: 0, hp: 50, mp: 50, flags: {}, passives: [], bag: [], sockets: [[null, null, null], [null, null, null]], nextUid: 4,
    items: [it(1, 'iron_sword', 'magic', [{ id: 'sharp', tier: 0, value: 8 }])],
    equip: { weapon: it(2, 'bamboo_sword', 'normal'), head: null, body: null, amulet: null, ring1: it(3, 'brass_ring', 'normal'), ring2: it(4, 'naga_ring', 'normal') } };
  const s = validate(old, g.data);
  assert.ok(s, 'ต้องแปลงได้');
  assert.equal(s.equip.ring.uid, 3);
  assert.ok(s.items.some((x) => x.uid === 4), 'แหวนวงสองเข้ากระเป๋า');
  assert.equal(s.items.find((x) => x.uid === 1).rarity, 'green');
  assert.ok('legs' in s.equip && 'arms' in s.equip);
});

test('เล่นแร่แปรธาตุ: ทองคำเปลว ขาว→เขียว · ปรอท ขาว→ม่วง · เถ้ากาลีสุ่มค่าม่วงใหม่ · ใช้ผิดชนิดไม่เสียของ · ค่ายังถูกต้อง', async () => {
  const { craftItem, validItems } = await import('../../src/systems/items.js');
  const { createRng } = await import('../../src/core/rng.js');
  const g = makeGame(), I = g.data.items, p = g.player, rng = createRng(3);
  p.level = 10; p.currency = { gild: 1, alch: 1, kali: 2 };
  const mk = () => ({ uid: ++p.nextUid, base: 'iron_sword', rarity: 'normal', ilvl: 8, mods: [], rareName: null });
  const a = mk(), b = mk(); p.items.push(a, b);
  assert.equal(craftItem(I, rng, p, 'kali', a), null, 'เถ้ากาลีใช้กับของขาวไม่ได้');
  assert.equal(p.currency.kali, 2);
  assert.ok(craftItem(I, rng, p, 'gild', a)); assert.equal(a.rarity, 'green'); assert.ok(a.mods.length >= 1 && a.mods.length <= 2);
  assert.equal(craftItem(I, rng, p, 'gild', a), null, 'หมด/ไม่ใช่ของขาว');
  assert.ok(craftItem(I, rng, p, 'alch', b)); assert.equal(b.rarity, 'purple'); assert.equal(b.mods.length, 3); assert.ok(b.rareName);
  const before = JSON.stringify(b.mods), uid = b.uid;
  assert.ok(craftItem(I, rng, p, 'kali', b)); assert.notEqual(JSON.stringify(b.mods), before); assert.equal(b.uid, uid); assert.equal(b.rarity, 'purple');
  assert.deepEqual(p.currency, { gild: 0, alch: 0, kali: 1 });
  assert.ok(validItems(I, p.items, p.equip, p.nextUid, g.data.gems));
});

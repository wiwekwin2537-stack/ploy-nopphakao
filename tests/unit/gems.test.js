import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGame } from './helpers.js';
import { socketGem, unsocketGem, computeSkill, ownsGem, skillsOf } from '../../src/systems/gems.js';
import { useCurrency, rollItem, validItems, giveItem, discard } from '../../src/systems/items.js';
import { sellItem } from '../../src/systems/shop.js';
import { createRng } from '../../src/core/rng.js';
import { castSkill } from '../../src/systems/skills.js';
import { makeMob, updateMonsters } from '../../src/systems/monsters.js';
import { updateShots } from '../../src/systems/combat.js';

// ดาบ 3 ช่องเชื่อมกันหมด (แบบของเริ่มต้น) + เสื้อ 2 ช่อง
function gear(p, wGems = [null, null, null], wLinks = [true, true], bGems = [null, null], bLinks = [false]) {
  p.equip.weapon = { uid: ++p.nextUid, base: 'bamboo_sword', rarity: 'normal', ilvl: 1, mods: [], rareName: null, sockets: wGems.length, links: wLinks, gems: wGems };
  p.equip.body = { uid: ++p.nextUid, base: 'cotton_shirt', rarity: 'normal', ilvl: 1, mods: [], rareName: null, sockets: bGems.length, links: bLinks, gems: bGems };
}

test('ฝัง/ถอดพลอยในช่องอาวุธ: พลอยไม่หายและไม่งอกเพิ่ม', () => {
  const g = makeGame(), G = g.data.gems, p = g.player;
  gear(p);
  p.bag = ['ruby', 'multi', 'pierce', 'haste'];
  const count = () => p.bag.length + p.equip.weapon.gems.filter(Boolean).length + p.equip.body.gems.filter(Boolean).length;
  socketGem(G, p, 0, 'weapon'); socketGem(G, p, 0, 'weapon'); socketGem(G, p, 0, 'weapon');
  assert.deepEqual(p.equip.weapon.gems, ['ruby', 'multi', 'pierce']);
  socketGem(G, p, 0, 'weapon', 1);                    // ช่องมีพลอยแล้ว → สลับกลับกระเป๋า
  assert.deepEqual(p.equip.weapon.gems, ['ruby', 'haste', 'pierce']);
  assert.deepEqual(p.bag, ['multi']);
  for (let i = 0; i < 3; i++) unsocketGem(p, 'weapon', i);
  unsocketGem(p, 'weapon', 0);
  assert.equal(count(), 4);
  assert.ok(['ruby', 'multi', 'pierce', 'haste'].every((id) => ownsGem(p, id)));
});

test('พลอยเสริมเสริมเฉพาะช่องที่เชื่อมกัน (เส้นทอง) — ไม่เชื่อม = ไม่เสริม', () => {
  const g = makeGame(), G = g.data.gems, p = g.player;
  gear(p, ['ruby', 'multi', 'sapphire'], [true, false]);
  let sk = skillsOf(G, p);
  assert.equal(sk.length, 2);
  assert.equal(sk[0].gem, 'ruby'); assert.equal(sk[0].count, 3, 'ทับทิมเชื่อมแตกกระจาย');
  assert.equal(sk[1].gem, 'sapphire'); assert.equal(sk[1].count, 1, 'ไพลินไม่ได้เชื่อม');
  p.equip.weapon.links = [true, true];
  sk = skillsOf(G, p);
  assert.equal(sk[1].count, 3, 'เชื่อมครบ 3 ช่อง ไพลินก็ได้แตกกระจาย');
  p.equip.body.gems = ['emerald', null];
  assert.equal(skillsOf(G, p)[2].gem, 'emerald', 'สกิลที่ 3 มาจากเสื้อ');
});

test('ศิลาเจาะ/ด้ายสายสิญจน์: เปลี่ยนช่อง/การเชื่อมจริง ใช้แล้วหมดไป พลอยที่ช่องหายกลับกระเป๋า', () => {
  const g = makeGame(), I = g.data.items, p = g.player;
  const w = { uid: 1, base: 'brass_glaive', rarity: 'normal', ilvl: 10, mods: [], rareName: null, sockets: 6, links: [false, false, false, false, false], gems: [null, null, null, null, null, 'ruby'] };
  p.nextUid = 1; p.equip.weapon = w; p.currency = { jeweller: 1, fusing: 1 };
  assert.ok(useCurrency(I, g.rng, p, 'fusing', w));
  assert.equal(p.currency.fusing, 0);
  assert.notDeepEqual(w.links, [false, false, false, false, false]);
  assert.equal(useCurrency(I, g.rng, p, 'fusing', w), null, 'หมดแล้วใช้ไม่ได้');
  assert.ok(useCurrency(I, g.rng, p, 'jeweller', w));
  assert.ok(w.sockets < 6 && w.gems.length === w.sockets && w.links.length === w.sockets - 1);
  assert.ok(p.bag.includes('ruby'), 'ทับทิมในช่องที่หายต้องกลับกระเป๋า');
  assert.ok(validItems(I, p.items, p.equip, p.nextUid, g.data.gems));
});

test('ช่องสุ่มตามเลเวลของ: ของเลเวล 1 ไม่เกิน 3 ช่อง ของเลเวล 10 ได้ถึง 6 แหวนไม่มีช่อง', () => {
  const g = makeGame(), I = g.data.items, rng = createRng(5);
  let max1 = 0, max10 = 0;
  for (let i = 0; i < 400; i++) {
    const a = rollItem(I, rng, 1, { slot: 'weapon' }), b = rollItem(I, rng, 10, { slot: 'body' });
    max1 = Math.max(max1, a.sockets); max10 = Math.max(max10, b.sockets);
    assert.ok(a.sockets >= 1 && a.gems.length === a.sockets);
  }
  assert.ok(max1 <= 3); assert.equal(max10, 6);
  assert.equal(rollItem(I, rng, 5, { slot: 'ring' }).sockets, undefined);
});

test('ขาย/ทิ้งของที่มีพลอย: พลอยกลับกระเป๋า ไม่หาย', () => {
  const g = makeGame(), I = g.data.items, p = g.player;
  giveItem(p, I, { uid: 0, base: 'iron_sword', rarity: 'normal', ilvl: 3, mods: [], rareName: null, sockets: 2, links: [true], gems: ['ruby', 'multi'] });
  giveItem(p, I, { uid: 0, base: 'buffalo_vest', rarity: 'normal', ilvl: 3, mods: [], rareName: null, sockets: 1, links: [], gems: ['area'] });
  sellItem(g, p.items[0].uid); discard(p, p.items[0].uid);
  assert.deepEqual(p.bag.sort(), ['area', 'multi', 'ruby']);
});

test('พลอยเสริมเปลี่ยนสกิลตามข้อมูล: แตกกระจาย ทะลวง ระเบิด ว่องไว', () => {
  const G = makeGame().data.gems;
  const base = computeSkill(G, 'ruby');
  const multi = computeSkill(G, 'ruby', ['multi']);
  assert.equal(multi.count, 3); assert.ok(multi.damageMult < base.damageMult); assert.ok(multi.mp > base.mp);
  const pierce = computeSkill(G, 'sapphire', ['pierce']);
  assert.equal(pierce.pierce, 2); assert.equal(pierce.slow, 0.5);
  const area = computeSkill(G, 'emerald', ['area']);
  assert.ok(area.splash > 0, 'มรกต + ระเบิด ต้องระเบิดได้');
  const haste = computeSkill(G, 'ruby', ['haste', 'haste']);
  assert.ok(Math.abs(haste.cooldown - base.cooldown * 0.65 * 0.65) < 1e-9);
  assert.equal(computeSkill(G, 'multi'), null, 'ไม่มีพลอยหลัก = ไม่มีสกิล');
});

test('แตกกระจายยิง 3 ลูกจริง และหอกไพลินทะลุ+ทำให้ช้า', () => {
  const g = makeGame(); g.world.load('field'); g.flags.tutorialDone = true;
  const p = g.player; p.x = 300; p.y = 1300; p.mp = 999; p.aim = 0;
  gear(p, ['ruby', 'multi', null], [true, true], ['sapphire', 'pierce'], [true]);
  assert.ok(castSkill(g, 0));
  assert.equal(g.shots.length, 3);
  g.shots.length = 0;
  const a = makeMob(g, 'boar', 1, 360, 1278), b = makeMob(g, 'boar', 1, 420, 1278);
  a.hp = b.hp = a.maxHp = b.maxHp = 999; a.chargeCd = b.chargeCd = 99; g.mobs.push(a, b);
  assert.ok(castSkill(g, 1));
  for (let i = 0; i < 30; i++) updateShots(g, 1 / 60);
  assert.ok(a.hp < 999 && b.hp < 999, 'ต้องทะลุโดนทั้งสองตัว');
  assert.ok(a.slowT > 0 && b.slowT > 0);
  updateMonsters(g, 1 / 60);
  assert.equal(a.speed, a.baseSpeed * 0.5);
});

test('พิษมรกตกัดต่อเนื่อง และมอนตายจากพิษให้รางวัลครั้งเดียว', () => {
  const g = makeGame(); g.world.load('field'); g.flags.tutorialDone = true;
  let kills = 0; g.events.on('mobKilled', () => kills++);
  const m = makeMob(g, 'piglet', 1, 500, 500); m.chargeCd = 99; g.mobs.push(m);
  m.poisonT = 3; m.poisonDps = 40; m.poisonTick = 0.5;
  const hp0 = m.hp;
  for (let i = 0; i < 200; i++) updateMonsters(g, 1 / 60);
  assert.ok(m.dead || m.hp < hp0);
  assert.ok(kills <= 1);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGame } from './helpers.js';
import { serialize, validate, SAVE_VERSION } from '../../src/systems/save.js';
import { respawn } from '../../src/systems/travel.js';
import { giveStarterGear } from '../../src/systems/player.js';

test('เซฟแล้วอ่านกลับได้ค่าเดิม', () => {
  const g = makeGame(); g.world.load('field');
  Object.assign(g.player, { level: 4, xp: 12, coins: 321, x: 400, y: 500, bag: ['multi'] });
  giveStarterGear(g.player, g.data); g.player.equip.weapon.gems = ['ruby', 'pierce', null];
  g.flags.tutorialDone = true;
  const s = validate(JSON.parse(JSON.stringify(serialize(g))), g.data);
  assert.equal(s.v, SAVE_VERSION);
  assert.deepEqual([s.level, s.xp, s.coins, s.zone, s.equip.weapon.gems[0], s.equip.weapon.gems[1], s.bag[0], s.flags.tutorialDone], [4, 12, 321, 'field', 'ruby', 'pierce', 'multi', true]);
});

test('เซฟเสีย/โกง ถูกปฏิเสธ', () => {
  const g = makeGame(); g.world.load('town');
  const good = serialize(g);
  for (const badS of [null, 'x', { ...good, v: 99 }, { ...good, zone: 'nope' }, { ...good, level: -1 }, { ...good, coins: 'lots' }, { ...good, bag: 'ruby' }, { ...good, bag: ['fakegem'] }, { ...good, currency: { jeweller: -1 } }, { ...good, currency: { fake: 1 } }]) {
    assert.equal(validate(badS, g.data), null);
  }
});

test('ตายแล้วเสียเบี้ย 10% ครั้งเดียว และฟื้นเต็มหลอด', () => {
  const g = makeGame(); g.flags.reachedTown = true; g.world.load('field');
  g.player.coins = 1000; g.player.hp = 0; g.player.dead = true;
  g.events.emit('playerDied', {});
  assert.equal(g.mode, 'dead');
  respawn(g);
  assert.equal(g.player.coins, 900);
  assert.equal(g.world.zone.id, 'town');
  assert.ok(g.player.hp > 0 && !g.player.dead);
});

test('เซฟรุ่นเก่า (v1) แปลงเป็นรุ่นใหม่ได้ ทับทิมย้ายไปช่องฝัง', () => {
  const g = makeGame(); g.world.load('town');
  const old = { v: 1, zone: 'town', x: 300, y: 300, level: 3, xp: 5, coins: 50, hp: 90, mp: 40, gems: ['ruby'], flags: { tutorialDone: true } };
  const s = validate(old, g.data);
  assert.ok(s, 'ต้องแปลงได้');
  assert.equal(s.v, SAVE_VERSION);
  assert.deepEqual(s.bag, ['ruby'], 'ไม่มีอาวุธให้ฝัง ทับทิมต้องกลับกระเป๋า ไม่หาย');
});

test('เซฟรุ่น 6 → 7: พลอยชุด 1 ย้ายลงอาวุธ 3 ช่องเชื่อมกัน ชุด 2 ไม่มีเสื้อ → กลับกระเป๋า', () => {
  const g = makeGame(); g.world.load('town');
  const it = (uid, base) => ({ uid, base, rarity: 'normal', ilvl: 1, mods: [], rareName: null });
  const old = { v: 6, zone: 'town', x: 300, y: 300, level: 3, xp: 0, coins: 0, hp: 50, mp: 50, potions: 1, flags: {}, passives: [], bag: ['area'], nextUid: 3,
    sockets: [['ruby', 'multi', null], ['sapphire', null, null]], items: [it(3, 'iron_sword')],
    equip: { weapon: it(1, 'bamboo_sword'), head: it(2, 'cloth_band'), body: null, legs: null, arms: null, amulet: null, ring: null } };
  const s = validate(old, g.data);
  assert.ok(s, 'ต้องแปลงได้');
  assert.deepEqual(s.equip.weapon.gems, ['ruby', 'multi', null]);
  assert.deepEqual(s.equip.weapon.links, [true, true]);
  assert.deepEqual(s.bag.sort(), ['area', 'sapphire']);
  assert.equal(s.items[0].sockets, 2);
  assert.equal(s.equip.head.sockets, undefined);
  assert.deepEqual(s.currency, { jeweller: 1, fusing: 1, chroma: 1 });
  assert.deepEqual(s.equip.weapon.colors, ['r', 'g', 'w'], 'ช่องได้สีตรงกับพลอยเดิม ช่องว่างเป็นขาว');
});

test('อาชีพ/ชื่อ: เซฟติด · เซฟเก่ารุ่น 12 ได้อาชีพจากสายที่เลือก (ไม่เคยเลือก = นักรบ) · อาชีพปลอมถูกปฏิเสธ', async () => {
  const { makeGame } = await import('./helpers.js');
  const { serialize, validate } = await import('../../src/systems/save.js');
  const { giveStarterGear } = await import('../../src/systems/player.js');
  const g = makeGame(); g.world.load('road'); giveStarterGear(g.player, g.data, 'shaman'); g.player.name = 'แม่มดน้อย';
  const d = JSON.parse(JSON.stringify(serialize(g)));
  const v = validate(d, g.data); assert.equal(v.cls, 'shaman'); assert.equal(v.name, 'แม่มดน้อย');
  const old = JSON.parse(JSON.stringify(d)); old.v = 12; delete old.cls; delete old.name;
  assert.equal(validate(old, g.data).cls, 'shaman');
  const old2 = JSON.parse(JSON.stringify(old)); old2.passives = [];
  const m2 = validate(old2, g.data); assert.equal(m2.cls, 'warrior'); assert.deepEqual(m2.passives, ['warrior']);
  assert.equal(validate({ ...d, cls: 'ninja' }, g.data), null);
  assert.equal(validate({ ...d, name: '' }, g.data), null);
});

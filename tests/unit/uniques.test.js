import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGame } from './helpers.js';
import { makeUnique, rollBossUnique, wornUniques } from '../../src/systems/uniques.js';
import { itemName, itemStats, craftItem } from '../../src/systems/items.js';
import { skillsOf, aurasOf } from '../../src/systems/gems.js';
import { playerStats } from '../../src/systems/stats.js';
import { serialize, validate } from '../../src/systems/save.js';

const ids = (I) => Object.keys(I.uniques).filter((k) => k !== '_doc');

test('ยูนีค: ข้อมูลครบ — ฐานมีจริง ค่าใช้ชื่อที่มีจริง พลอยที่ให้มีจริง บอสมีจริง ไม่มีตัวเลขในตำนาน', () => {
  const g = makeGame(), I = g.data.items, G = g.data.gems, P = g.data.passives, M = g.data.monsters.types || g.data.monsters;
  assert.ok(ids(I).length >= 6);
  for (const id of ids(I)) {
    const U = I.uniques[id];
    assert.ok(I.bases[U.base], id); assert.ok(U.name && U.lore && !/\d/.test(U.lore), id);
    for (const k of Object.keys(U.stats)) assert.ok(P.statNames[k], `${id}: ${k}`);
    for (const x of [U.grants, U.trigger].filter(Boolean)) assert.ok(G.main[x.gem] && x.level >= 1 && x.level <= G.levels.max, id + ' เลเวลพลอยไม่เกินสูงสุด');
    if (U.trigger) assert.ok(['hit', 'hurt'].includes(U.trigger.on) && !G.main[U.trigger.gem].aura, id);
    for (const b of U.from || []) assert.ok(M[b] && M[b].boss, `${id}: ${b}`);
    assert.ok(U.from || U.world, id);
  }
});

test('ยูนีค: ชื่อ/ค่าตายตัว · ให้สกิลขึ้นปุ่มสกิล · ให้ออร่า · เล่นแร่แปรธาตุไม่ได้ · เซฟได้และปลอมไม่ได้', () => {
  const g = makeGame(), I = g.data.items, G = g.data.gems, p = g.player; g.world.load('road');
  p.level = 20;
  const w = { ...makeUnique(I, g.rng, 'wat_glaive', 10), uid: ++p.nextUid };
  assert.equal(itemName(I, w), I.uniques.wat_glaive.name);
  assert.equal(itemStats(I, w).dmgFlat, I.bases.brass_glaive.stats.dmgFlat + I.uniques.wat_glaive.stats.dmgFlat);
  const before = skillsOf(G, p, I).length;
  p.equip.weapon = w;
  const sk = skillsOf(G, p, I);
  assert.equal(sk.length, before + 1, 'สกิลเพิ่ม 1 (ต่อท้าย)');
  const got = sk.find((k) => k.fromItem);
  assert.ok(got && got.gem === 'onyx' && got.level === 5, 'ได้สกิลฟันพายุเลเวล 5');
  const h = { ...makeUnique(I, g.rng, 'garuda_crown', 12), uid: ++p.nextUid };
  const st0 = playerStats(p, g.data);
  p.equip.head = h;
  assert.ok(aurasOf(G, p, I).some((a) => a.id === 'jade' && a.fromItem));
  assert.ok(playerStats(p, g.data).mpReserved > 0 && playerStats(p, g.data).speed > st0.speed);
  assert.ok(!skillsOf(G, p, I).some((k) => k.gem === 'jade'), 'ออร่าไม่ขึ้นปุ่มสกิล');
  assert.equal(wornUniques(I, p).length, 2);
  p.currency = { gild: 1, alch: 1, kali: 1, exalt: 1 };
  for (const k of ['gild', 'alch', 'kali', 'exalt']) assert.equal(craftItem(I, g.rng, p, k, h), null, k);
  const d = JSON.parse(JSON.stringify(serialize(g)));
  assert.ok(validate(d, g.data), 'เซฟยูนีคได้');
  const fake = JSON.parse(JSON.stringify(d)); fake.equip.head.unique = 'wat_glaive';
  assert.equal(validate(fake, g.data), null, 'ยูนีคที่ฐานไม่ตรงถูกปฏิเสธ');
});

test('ยูนีค: บอสดรอปของประจำตัว · สกิลทำงานเองเมื่อฟันโดน (ไม่ใช้มานา มีคูลดาวน์)', async () => {
  const { makeMob } = await import('../../src/systems/monsters.js');
  const g = makeGame(), I = g.data.items, p = g.player; g.world.load('road');
  let n = 0; for (let i = 0; i < 400; i++) if (rollBossUnique(I, g.rng, 'yak') === 'wat_glaive') n++;
  assert.ok(n > 80 && n < 200, 'โอกาสราว 35%: ' + n);
  p.level = 10;
  p.equip.weapon = { ...makeUnique(I, g.rng, 'naga_kris', 6), uid: ++p.nextUid };
  const m = makeMob(g, 'boar', 5, p.x + 40, p.y); g.mobs.push(m);
  const orig = I.uniques.naga_kris.trigger.chance; I.uniques.naga_kris.trigger.chance = 1;
  const mp = p.mp, shots = g.shots.length; g.time = 10;
  g.events.emit('playerAttacked', { hits: 1 });
  assert.equal(g.shots.length, shots + 1, 'ปล่อยก้อนพิษเอง'); assert.equal(p.mp, mp, 'ไม่ใช้มานา');
  g.events.emit('playerAttacked', { hits: 1 });
  assert.equal(g.shots.length, shots + 1, 'ติดคูลดาวน์');
  g.events.emit('playerAttacked', { hits: 0 });
  I.uniques.naga_kris.trigger.chance = orig;
});

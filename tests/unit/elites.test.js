import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGame } from './helpers.js';
import { makeMob, rollElite, mobName, updateMonsters } from '../../src/systems/monsters.js';

test('มอนพิเศษ: เวท 1 ค่า หายาก 2 ค่า · เลือด/ตี/XP คูณตามข้อมูล · ชื่อมีค่าพิเศษนำหน้า', () => {
  const g = makeGame(), E = g.data.balance.elites;
  for (const tier of ['magic', 'rare']) {
    const base = makeMob(g, 'boar', 8, 100, 100), m = rollElite(g, makeMob(g, 'boar', 8, 100, 100), tier), T = E.tiers[tier];
    assert.equal(m.elite, tier); assert.equal(m.eliteMods.length, T.mods); assert.equal(new Set(m.eliteMods).size, T.mods);
    let hp = T.hp, dmg = T.damage; for (const id of m.eliteMods) { hp *= E.mods[id].hp || 1; dmg *= E.mods[id].damage || 1; }
    assert.equal(m.maxHp, Math.round(base.maxHp * hp)); assert.equal(m.damage, Math.round(base.damage * dmg)); assert.equal(m.xp, Math.round(base.xp * T.xp));
    for (const id of m.eliteMods) assert.ok(mobName(g, m).includes(E.mods[id].name));
    assert.ok(mobName(g, m).endsWith(m.def.name));
  }
  for (const [id, x] of Object.entries(E.mods)) assert.ok(x.name && (x.hp || x.damage || x.speed || x.regen), id);
});

test('มอนพิเศษ: ฟื้นตัวไวฟื้นเลือดเอง · ตายแล้วได้ของแน่นอน (หายาก ≥ สีเขียว) · บอสไม่เป็นมอนพิเศษ', () => {
  const g = makeGame(), E = g.data.balance.elites;
  g.flags.tutorialDone = true;
  const m = rollElite(g, makeMob(g, 'boar', 8, 100, 100), 'rare');
  m.eliteMods = ['regen', 'stout']; m.regen = E.mods.regen.regen; m.hp = m.maxHp / 2;
  g.world.load('road'); g.player.x = m.x + 2000; g.player.invuln = 999; g.mobs.push(m);
  const before = m.hp;
  for (let i = 0; i < 60; i++) updateMonsters(g, 1 / 60);
  assert.ok(m.hp > before + m.maxHp * m.regen * 0.9, 'ฟื้นราว 3%/วิ');
  g.mobs.length = 0;
  g.drops.length = 0;
  g.events.emit('mobKilled', { mob: m });
  const items = g.drops.filter((d) => d.kind === 'item');
  assert.ok(items.length >= E.tiers.rare.items, 'ได้ของตามจำนวน');
  assert.ok(items.slice(-E.tiers.rare.items).every((d) => d.item.rarity !== 'normal'));
  assert.ok(g.drops.some((d) => d.kind === 'coin'), 'ได้เบี้ยแน่นอน');
});

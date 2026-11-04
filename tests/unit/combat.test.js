import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGame, count } from './helpers.js';
import { makeMob } from '../../src/systems/monsters.js';
import { damageMob, meleeArc } from '../../src/systems/combat.js';
import { updateLoot } from '../../src/systems/loot.js';
import { gainXp } from '../../src/systems/progress.js';
import { enterZone } from '../../src/systems/travel.js';

test('มอนตายได้ครั้งเดียว: ตีซ้ำหลังตายไม่ได้ XP/ของซ้ำ', () => {
  const g = makeGame(); g.world.load('field');
  const kills = count(g, 'mobKilled');
  const m = makeMob(g, 'boar', 1, 300, 300); g.mobs.push(m);
  damageMob(g, m, 999); damageMob(g, m, 999); damageMob(g, m, 5);
  assert.equal(kills(), 1);
  assert.equal(g.player.xp, m.xp);
  assert.ok(g.drops.length <= 1);
});

test('ฟันวงโค้งโดนหลายตัวพร้อมกัน แต่แต่ละตัวตายครั้งเดียว', () => {
  const g = makeGame(); g.world.load('field');
  const kills = count(g, 'mobKilled');
  for (let i = 0; i < 4; i++) { const m = makeMob(g, 'piglet', 1, 330 + i * 4, 300); m.hp = 1; g.mobs.push(m); }
  const p = g.player; p.x = 300; p.y = 300;
  meleeArc(g, p.x, p.y, 0, 50, 2, 50); meleeArc(g, p.x, p.y, 0, 50, 2, 50);
  assert.equal(kills(), 4);
});

test('เก็บเหรียญได้ครั้งเดียว แล้วหายจากพื้น', () => {
  const g = makeGame(); g.world.load('field');
  const p = g.player; p.x = 500; p.y = 500;
  g.drops.push({ id: 1, kind: 'coin', amount: 7, x: 505, y: 500, t: 1, z: 0, vz: 0, vx: 0, vy: 0 });
  for (let i = 0; i < 20; i++) updateLoot(g, 0.05);
  assert.equal(p.coins, 7);
  assert.equal(g.drops.length, 0);
});

test('เลเวลอัพหลายขั้นในครั้งเดียว และหยุดที่เลเวลสูงสุด', () => {
  const g = makeGame();
  gainXp(g, 100);
  assert.equal(g.player.level, 3);
  gainXp(g, 1e7);
  assert.equal(g.player.level, g.data.balance.maxLevel);
  assert.equal(g.player.xp, 0);
});

test('เข้าออกพื้นที่ซ้ำ 20 รอบ มอนไม่เพิ่มเกินจำนวนที่กำหนด', () => {
  const g = makeGame(); g.flags.tutorialDone = true; g.flags.gotRuby = true;
  const expected = g.data.zones.field.spawns.reduce((a, s) => a + s.count, 0);
  for (let i = 0; i < 20; i++) { enterZone(g, 'field'); enterZone(g, 'town'); }
  enterZone(g, 'field');
  assert.ok(g.mobs.length <= expected, `มอน ${g.mobs.length} > ${expected}`);
  assert.ok(g.mobs.length >= expected - 4);
  enterZone(g, 'town');
  assert.equal(g.mobs.length, 0, 'ในเวียงต้องไม่มีมอน');
});

test('มอนเดินอ้อมเกวียนมาหาผู้เล่นได้ (เคยติดค้างอยู่หลังเกวียน)', async () => {
  const { updateMonsters } = await import('../../src/systems/monsters.js');
  const g = makeGame(); g.world.load('road'); g.flags.tutorialDone = true;
  const p = g.player; p.x = 222; p.y = 320; p.invuln = 999;
  const m = makeMob(g, 'boar', 1, 402, 320); m.aggroed = true; m.chargeCd = 999; g.mobs.push(m);
  for (let i = 0; i < 400; i++) updateMonsters(g, 1 / 60);
  assert.ok(Math.hypot(m.x - p.x, m.y - p.y) < 60, `ยังติดอยู่ที่ ${Math.round(m.x)},${Math.round(m.y)}`);
});

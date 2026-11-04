// ป่าหิมพานต์: ม่านเวทกั้นจนกว่าจะล้มยักษ์วัด · มอนใหม่ · บทพูดตามเหตุการณ์ · เลเวลถึง 20
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGame } from './helpers.js';
import { reachable } from './path.js';
import { enterZone } from '../../src/systems/travel.js';
import { talkTo } from '../../src/systems/npc.js';
import { gainXp } from '../../src/systems/progress.js';
import { damageMob } from '../../src/systems/combat.js';
import { rollItem } from '../../src/systems/items.js';
import { createRng } from '../../src/core/rng.js';
import { updateMonsters } from '../../src/systems/monsters.js';

function canReachForest(g) {
  enterZone(g, 'field'); g.world.refreshFlags();
  const e = g.world.zone.exits.find((x) => x.to === 'himmapan');
  return !!reachable(g.world, g.world.zone.start, (x, y) => g.world.exitAt(x, y) === e);
}

test('ม่านเวทกั้นทางไปป่าหิมพานต์จนกว่าจะล้มยักษ์วัด (อ้อมไม่ได้)', () => {
  const g = makeGame(); g.flags.tutorialDone = true; g.flags.gotRuby = true;
  assert.equal(canReachForest(g), false, 'ยังไม่ล้มยักษ์ต้องไปไม่ได้');
  g.flags.yakSlain = true;
  assert.equal(canReachForest(g), true, 'ล้มยักษ์แล้วต้องไปได้');
});

test('ป่าหิมพานต์มีมอนใหม่ครบ และเลเวลมอน 7–11', () => {
  const g = makeGame(); g.flags.tutorialDone = true;
  enterZone(g, 'himmapan');
  const types = new Set(g.mobs.map((m) => m.type));
  for (const t of ['khotchasi', 'naga_noi', 'hatsadi']) assert.ok(types.has(t), 'ไม่มี ' + t);
  assert.ok(g.mobs.filter((m) => !m.def.boss).every((m) => m.level >= 7 && m.level <= 11));
});

test('พ่อเฒ่าจันทร์เล่าเรื่องป่าหิมพานต์ครั้งเดียวหลังล้มยักษ์', () => {
  const g = makeGame(); g.flags.tutorialDone = true; g.flags.metChan = true;
  enterZone(g, 'town');
  const chan = g.world.zone.npcs.find((n) => n.id === 'chan');
  talkTo(g, chan); assert.notDeepEqual(g.dialog.lines, g.data.dialogue.chan_yak);
  g.flags.yakSlain = true;
  talkTo(g, chan); assert.deepEqual(g.dialog.lines, g.data.dialogue.chan_yak);
  g.dialog.onDone();
  talkTo(g, chan); assert.notDeepEqual(g.dialog.lines, g.data.dialogue.chan_yak);
});

test('เลเวลขึ้นได้ถึงเลเวลสูงสุด (40) และหยุดที่นั่น · ตาราง XP ยาวพอดี', () => {
  const g = makeGame(); enterZone(g, 'field');
  gainXp(g, 1e12);
  assert.equal(g.player.level, g.data.balance.maxLevel);
  assert.equal(g.data.balance.maxLevel, 40);
  assert.equal(g.data.balance.xpToNext.length, 40);
});

test('พญาคชสีห์ทองคำ: อยู่ปลายป่า เดินไปถึงได้ ล้มแล้วได้ของม่วง/แดง 3 ชิ้นครั้งเดียว เกิดใหม่ช้า', () => {
  const g = makeGame(); g.flags.tutorialDone = true;
  enterZone(g, 'himmapan');
  const king = g.mobs.find((m) => m.type === 'khotchasi_king');
  assert.ok(king, 'ต้องมีบอส');
  assert.ok(reachable(g.world, g.world.zone.start, (x, y) => Math.hypot(x - king.x, y - king.y) < 80), 'เดินไปหาบอสไม่ถึง');
  const n = g.drops.length;
  damageMob(g, king, 1e6); damageMob(g, king, 1e6);
  const items = g.drops.slice(n).filter((d) => d.kind === 'item');
  assert.equal(items.length, 3);
  assert.ok(items.every((d) => d.item.rarity === 'purple' || d.item.rarity === 'red'));
  assert.equal(g.flags.khotchasi_kingSlain, true);
  for (let i = 0; i < 60 * 70; i++) updateMonsters(g, 1 / 60);
  assert.ok(!g.mobs.some((m) => m.type === 'khotchasi_king'), 'บอสต้องไม่เกิดใหม่เร็ว');
});

test('ของระดับสูง (เลเวล 12–18) ตกได้เมื่อมอนเลเวลถึง และค่าสุ่มเทียร์ใหม่อยู่ในช่วง', () => {
  const g = makeGame(), I = g.data.items, rng = createRng(9), seen = new Set();
  for (let i = 0; i < 3000; i++) { const it = rollItem(I, rng, 18); seen.add(it.base); for (const m of it.mods) { const t = I.affixes[m.id].tiers[m.tier]; assert.ok(m.value >= t[1] && m.value <= t[2]); } }
  for (const b of ['kailash_sword', 'garuda_glaive', 'phra_khan', 'deva_armor', 'deva_crown', 'kailash_ring']) assert.ok(seen.has(b), 'ไม่เคยตก ' + b);
  for (let i = 0; i < 500; i++) assert.ok(I.bases[rollItem(I, rng, 8).base].req <= 8, 'มอนเลเวลต่ำห้ามดรอปของเลเวลสูง');
});

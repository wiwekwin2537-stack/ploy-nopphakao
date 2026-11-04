// ป่าหิมพานต์: ม่านเวทกั้นจนกว่าจะล้มยักษ์วัด · มอนใหม่ · บทพูดตามเหตุการณ์ · เลเวลถึง 20
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGame } from './helpers.js';
import { reachable } from './path.js';
import { enterZone } from '../../src/systems/travel.js';
import { talkTo } from '../../src/systems/npc.js';
import { gainXp } from '../../src/systems/progress.js';

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
  assert.ok(g.mobs.every((m) => m.level >= 7 && m.level <= 11));
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

test('เลเวลขึ้นได้ถึง 20 และหยุดที่ 20', () => {
  const g = makeGame(); enterZone(g, 'field');
  gainXp(g, 1e9);
  assert.equal(g.player.level, 20);
  assert.equal(g.data.balance.xpToNext.length, 20);
});

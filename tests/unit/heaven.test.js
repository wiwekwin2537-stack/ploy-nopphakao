// สวรรค์ชั้นดาวดึงส์: ประตูสวรรค์กั้นจนล้มครุฑราช · มอนใหม่ · ท้าวเวสสุวรรณ · ตอนจบภาค 1
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGame } from './helpers.js';
import { reachable } from './path.js';
import { enterZone } from '../../src/systems/travel.js';
import { talkTo } from '../../src/systems/npc.js';
import { damageMob } from '../../src/systems/combat.js';

function canReach(g) {
  enterZone(g, 'kailash'); g.world.refreshFlags();
  const e = g.world.zone.exits.find((x) => x.to === 'sky_sala');
  return !!reachable(g.world, g.world.zone.start, (x, y) => g.world.exitAt(x, y) === e);
}

test('ประตูสวรรค์กั้นจนกว่าจะล้มพญาครุฑราช (อ้อมไม่ได้)', () => {
  const g = makeGame(); g.flags.tutorialDone = true;
  assert.equal(canReach(g), false);
  g.flags.garuda_kingSlain = true;
  assert.equal(canReach(g), true);
});

test('ดาวดึงส์มีมอนใหม่ครบ เลเวล 18–20 และเดินถึงท้าวเวสสุวรรณ', () => {
  const g = makeGame(); g.flags.tutorialDone = true;
  enterZone(g, 'tavatimsa');
  const types = new Set(g.mobs.map((m) => m.type));
  for (const t of ['deva_warrior', 'apsara', 'erawan_calf', 'vessavana']) assert.ok(types.has(t), 'ไม่มี ' + t);
  assert.ok(g.mobs.every((m) => m.level >= 18 && m.level <= 20));
  const boss = g.mobs.find((m) => m.type === 'vessavana');
  assert.ok(reachable(g.world, g.world.zone.start, (x, y) => Math.hypot(x - boss.x, y - boss.y) < 90), 'เดินไปหาบอสไม่ถึง');
});

test('ล้มท้าวเวสสุวรรณ: ของม่วง/แดง 4 ชิ้นครั้งเดียว · พ่อเฒ่าเล่าตอนจบภาค 1 ครั้งเดียว', () => {
  const g = makeGame(); g.flags.tutorialDone = true;
  enterZone(g, 'tavatimsa');
  const boss = g.mobs.find((m) => m.type === 'vessavana'), n = g.drops.length;
  damageMob(g, boss, 1e8); damageMob(g, boss, 1e8);
  assert.equal(g.drops.slice(n).filter((d) => d.kind === 'item' && d.item.rarity !== 'unique').length, 4);
  assert.equal(g.flags.vessavanaSlain, true);
  Object.assign(g.flags, { metChan: true, heardHimmapan: true, q_q1_main: true, heardKailash: true, heardHeaven: true });
  enterZone(g, 'town');
  const chan = g.world.zone.npcs.find((x) => x.id === 'chan');
  talkTo(g, chan); assert.deepEqual(g.dialog.lines, g.data.dialogue.chan_vessavana); g.dialog.onDone();
  talkTo(g, chan); assert.notDeepEqual(g.dialog.lines, g.data.dialogue.chan_vessavana);
});

test('พ่อเฒ่าจันทร์: ถ้าไม่ได้กลับมาคุยระหว่างบท เล่าเรื่องล่าสุดเรื่องเดียว (ไม่ย้อนเล่าเรื่องเก่าที่ล้าสมัย)', () => {
  const g = makeGame(); g.flags.tutorialDone = true;
  Object.assign(g.flags, { metChan: true, yakSlain: true, heardHimmapan: true, q_q1_main: true, khotchasi_kingSlain: true, garuda_kingSlain: true, vessavanaSlain: true });
  enterZone(g, 'town');
  const chan = g.world.zone.npcs.find((x) => x.id === 'chan');
  talkTo(g, chan); assert.deepEqual(g.dialog.lines, g.data.dialogue.chan_vessavana, 'เล่าเรื่องล่าสุด'); g.dialog.onDone();
  assert.ok(g.flags.heardKailash && g.flags.heardHeaven && g.flags.heardEnding1, 'เรื่องเก่านับว่าฟังแล้ว');
  talkTo(g, chan); assert.notDeepEqual(g.dialog.lines, g.data.dialogue.chan_king);
});

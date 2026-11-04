// เขาไกรลาส: ม่านเวทกั้นจนล้มพญาคชสีห์ · มอนใหม่ · บุษราคัมทะลุ · พลอยเสริมทวีคูณ
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGame } from './helpers.js';
import { reachable } from './path.js';
import { enterZone } from '../../src/systems/travel.js';
import { talkTo } from '../../src/systems/npc.js';
import { computeSkill } from '../../src/systems/gems.js';
import { damageMob } from '../../src/systems/combat.js';

function canReach(g) {
  enterZone(g, 'himmapan'); g.world.refreshFlags();
  const e = g.world.zone.exits.find((x) => x.to === 'kailash');
  return !!reachable(g.world, g.world.zone.start, (x, y) => g.world.exitAt(x, y) === e);
}

test('ม่านเวทไกรลาสกั้นจนกว่าจะล้มพญาคชสีห์ (อ้อมป่าไม่ได้)', () => {
  const g = makeGame(); g.flags.tutorialDone = true;
  assert.equal(canReach(g), false);
  g.flags.khotchasi_kingSlain = true;
  assert.equal(canReach(g), true);
});

test('เขาไกรลาสมีมอนใหม่ครบ เลเวล 14–18 และทางเดินถึงเจดีย์ยอดเขา', () => {
  const g = makeGame(); g.flags.tutorialDone = true;
  enterZone(g, 'kailash');
  const types = new Set(g.mobs.map((m) => m.type));
  for (const t of ['kumbhan', 'kinnorn', 'garuda_chick']) assert.ok(types.has(t), 'ไม่มี ' + t);
  assert.ok(g.mobs.filter((m) => !m.def.boss).every((m) => m.level >= 14 && m.level <= 18));
  assert.ok(reachable(g.world, g.world.zone.start, (x, y) => x > 48 * 32 && y < 8 * 32), 'เดินไปยอดเขาไม่ถึง');
});

test('บุษราคัมทะลุ 2 ตัวในตัว · พลอยเสริมทวีคูณ ดาเมจ ×1.4 มานาเพิ่ม', () => {
  const G = makeGame().data.gems;
  const t = computeSkill(G, 'topaz'), tp = computeSkill(G, 'topaz', ['power', 'pierce']);
  assert.equal(t.pierce, 2); assert.equal(tp.pierce, 4);
  assert.ok(Math.abs(tp.damageMult - t.damageMult * 1.4) < 1e-9); assert.ok(tp.mp > t.mp);
});

test('พ่อเฒ่าจันทร์เล่าเรื่องเขาไกรลาสครั้งเดียวหลังล้มพญาคชสีห์', () => {
  const g = makeGame(); Object.assign(g.flags, { tutorialDone: true, metChan: true, yakSlain: true, heardHimmapan: true, khotchasi_kingSlain: true });
  enterZone(g, 'town');
  const chan = g.world.zone.npcs.find((n) => n.id === 'chan');
  talkTo(g, chan); assert.deepEqual(g.dialog.lines, g.data.dialogue.chan_king); g.dialog.onDone();
  talkTo(g, chan); assert.notDeepEqual(g.dialog.lines, g.data.dialogue.chan_king);
});

test('พญาครุฑราช: อยู่ยอดเขา เดินถึงได้ ล้มแล้วได้ของม่วง/แดง 3 ชิ้น พลอย 3 เม็ด ครั้งเดียว', () => {
  const g = makeGame(); g.flags.tutorialDone = true;
  enterZone(g, 'kailash');
  const boss = g.mobs.find((m) => m.type === 'garuda_king');
  assert.ok(boss, 'ต้องมีบอส');
  assert.ok(reachable(g.world, g.world.zone.start, (x, y) => Math.hypot(x - boss.x, y - boss.y) < 90), 'เดินไปหาบอสไม่ถึง');
  const n = g.drops.length;
  damageMob(g, boss, 1e7); damageMob(g, boss, 1e7);
  const got = g.drops.slice(n);
  assert.equal(got.filter((d) => d.kind === 'item' && d.item.rarity !== 'unique').length, 3);
  assert.ok(got.filter((d) => d.kind === 'gem').length >= 3);
  assert.equal(g.flags.garuda_kingSlain, true);
});

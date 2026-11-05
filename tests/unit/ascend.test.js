// อาชีพเลื่อนขั้นแบบ PoE: ข้อมูลครบ · แต้มจากบททดสอบ (ล้มบอส) · เลือกทางเดียวถาวร · ลง/คืนแต้ม · ค่าพลังมีผลจริง · เซฟ
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGame } from './helpers.js';
import { giveStarterGear } from '../../src/systems/player.js';
import { playerStats } from '../../src/systems/stats.js';
import { makeMob } from '../../src/systems/monsters.js';
import { serialize, validate } from '../../src/systems/save.js';
import { ascPointsTotal, ascPointsLeft, chooseAscend, allocAsc, refundAsc } from '../../src/systems/ascend.js';

test('ข้อมูลเลื่อนขั้นครบ: ทุกอาชีพมี 2 ทาง ทางละ 4 โหนด · ชื่อค่าแสดงผลได้ · บททดสอบผูกกับบอสจริง', () => {
  const g = makeGame(), A = g.data.ascendancy, P = g.data.passives, M = g.data.monsters;
  assert.deepEqual(Object.keys(A.classes).sort(), Object.keys(P.classes).sort());
  const ids = new Set();
  for (const [cls, list] of Object.entries(A.classes)) {
    assert.equal(list.length, 2, cls);
    for (const id of list) {
      const a = A.list[id]; assert.ok(a && a.name && a.desc && a.nodes.length === 4, id);
      for (const n of a.nodes) { assert.ok(!ids.has(n.id), 'ซ้ำ ' + n.id); ids.add(n.id); for (const k of Object.keys(n.stats)) assert.ok(P.statNames[k], k); }
    }
  }
  for (const t of A.trials) assert.ok(M[t.flag.replace(/Slain$/, '')].boss, t.flag);
  assert.equal(ascPointsTotal(A, Object.fromEntries(A.trials.map((t) => [t.flag, true]))), 6);
});

test('เลือกทาง: ต้องผ่านบททดสอบก่อน · เลือกได้แค่ทางของอาชีพตัวเอง ครั้งเดียว · ลงแต้มไม่เกิน · คืนต้องใช้ใบลานล้างกรรม · ค่าพลังมีผล', () => {
  const g = makeGame(), A = g.data.ascendancy, p = g.player, F = g.flags;
  giveStarterGear(p, g.data, 'warrior'); p.level = 30;
  assert.equal(chooseAscend(A, p, F, 'juggernaut'), false, 'ยังไม่ผ่านบททดสอบ');
  F.garuda_kingSlain = true;
  assert.equal(chooseAscend(A, p, F, 'assassin'), false, 'ทางของอาชีพอื่น');
  const hp0 = playerStats(p, g.data).maxHp;
  assert.ok(chooseAscend(A, p, F, 'juggernaut'));
  assert.equal(chooseAscend(A, p, F, 'berserker'), false, 'เลือกแล้วเปลี่ยนไม่ได้');
  assert.ok(allocAsc(A, p, F, 'jug1')); assert.ok(allocAsc(A, p, F, 'jug3'));
  assert.equal(allocAsc(A, p, F, 'jug2'), false, 'แต้มหมด (2 แต้มจากบททดสอบแรก)');
  assert.equal(allocAsc(A, p, F, 'ber1'), false, 'โหนดของทางอื่น');
  assert.ok(playerStats(p, g.data).maxHp > hp0 * 1.15, 'กายช้างสาร: เลือดเพิ่ม');
  p.currency.regret = 0; assert.equal(refundAsc(p, 'jug1'), false);
  p.currency.regret = 1; assert.ok(refundAsc(p, 'jug1')); assert.equal(p.currency.regret, 0);
  assert.equal(ascPointsLeft(A, p, F), 1);
  // ไม่รู้จักถอย: ฆ่ามอนฟื้นเลือด 4%
  const st = playerStats(p, g.data); p.hp = 10;
  g.events.emit('mobKilled', { mob: makeMob(g, 'boar', 30, 0, 0) });
  assert.ok(Math.abs(p.hp - (10 + st.maxHp * 0.04)) < 1e-6, 'ฟื้นเลือดเมื่อฆ่า');
});

test('ล้มบอสบททดสอบครั้งแรกแจ้งได้แต้มเลื่อนขั้น (ครั้งเดียว) · เซฟ/โหลดเลื่อนขั้นติด · เซฟปลอมแต้มเกินถูกปฏิเสธ · เซฟเก่า v13 ได้ค่าเริ่ม', () => {
  const g = makeGame(), A = g.data.ascendancy, p = g.player;
  giveStarterGear(p, g.data, 'shadow'); p.level = 30; g.world.load('kailash'); g.flags.tutorialDone = true;
  const boss = makeMob(g, 'garuda_king', 18, 100, 100);
  g.flags.garuda_kingSlain = true; g.events.emit('mobKilled', { mob: boss });
  assert.ok(g.notice && g.notice.text.includes('แต้มเลื่อนขั้น'));
  g.notice = null; g.events.emit('mobKilled', { mob: boss }); assert.ok(!g.notice || !g.notice.text.includes('แต้มเลื่อนขั้น'), 'แจ้งครั้งเดียว');
  chooseAscend(A, p, g.flags, 'assassin'); allocAsc(A, p, g.flags, 'ass1');
  const d = validate(JSON.parse(JSON.stringify(serialize(g))), g.data);
  assert.equal(d.ascend, 'assassin'); assert.deepEqual(d.ascNodes, ['ass1']);
  const bad = JSON.parse(JSON.stringify(serialize(g))); bad.ascNodes = ['ass1', 'ass2', 'ass3'];
  assert.equal(validate(bad, g.data), null, 'แต้มเกินที่ได้จากบททดสอบ');
  const wrong = JSON.parse(JSON.stringify(serialize(g))); wrong.ascend = 'juggernaut'; wrong.ascNodes = [];
  assert.equal(validate(wrong, g.data), null, 'ทางของอาชีพอื่น');
  const old = JSON.parse(JSON.stringify(serialize(g))); old.v = 13; delete old.ascend; delete old.ascNodes;
  const m = validate(old, g.data); assert.equal(m.ascend, null); assert.deepEqual(m.ascNodes, []);
});

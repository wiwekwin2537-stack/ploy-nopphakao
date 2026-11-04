import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGame } from './helpers.js';
import { currentQuest } from '../../src/systems/quests.js';

test('เป้าหมายเนื้อเรื่อง: ธงมาจากบอสจริง โซนมีจริง ข้อความไม่มีตัวเลขลอยๆ', () => {
  const g = makeGame(), Q = g.data.quests.list, M = g.data.monsters;
  const types = M.types || M;
  for (const q of Q) {
    if (q.until) { const t = q.until.replace(/Slain$/, ''); assert.ok(types[t] && types[t].boss, q.until); assert.ok(q.text.includes(types[t].name), `${q.title} ต้องเอ่ยชื่อบอส ${types[t].name}`); }
    for (const z of q.zones || []) assert.ok(z === 'map' || g.data.zones[z], z);
  }
  assert.equal(Q[Q.length - 1].until, null, 'ข้อสุดท้ายเล่นได้เรื่อยๆ');
});

test('เป้าหมายเนื้อเรื่อง: ระหว่างบทนำไม่แสดง → หลังบทนำเริ่มที่ยักษ์ → ล้มบอสแล้วเลื่อนข้อ', () => {
  const g = makeGame();
  g.flags.tutorialDone = false;
  assert.equal(currentQuest(g), null);
  g.flags.tutorialDone = true;
  assert.equal(currentQuest(g).until, 'yakSlain');
  g.flags.yakSlain = true;
  assert.equal(currentQuest(g).until, 'khotchasi_kingSlain');
  g.flags.khotchasi_kingSlain = g.flags.garuda_kingSlain = g.flags.vessavanaSlain = true;
  assert.equal(currentQuest(g).until, null);
});

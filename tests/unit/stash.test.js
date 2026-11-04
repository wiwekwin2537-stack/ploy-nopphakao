import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGame } from './helpers.js';
import { moveItem } from '../../src/systems/stash.js';
import { rollItem } from '../../src/systems/items.js';
import { serialize, validate } from '../../src/systems/save.js';

test('หีบเก็บของ: ย้ายไป-กลับ ของไม่หาย · หีบ/กระเป๋าเต็มย้ายไม่ได้ · พลอยที่ฝังติดไปกับของ', () => {
  const g = makeGame(), p = g.player, I = g.data.items;
  const it = { ...rollItem(I, g.rng, 10, { rarity: 'purple' }), uid: ++p.nextUid };
  p.items.push(it);
  assert.equal(moveItem(g, it.uid, true), 'ok');
  assert.equal(p.items.length, 0); assert.equal(p.stash[0], it);
  assert.equal(moveItem(g, 999, true), null);
  while (p.items.length < I.bagSize) p.items.push({ ...rollItem(I, g.rng, 5, { rarity: 'normal' }), uid: ++p.nextUid });
  assert.equal(moveItem(g, it.uid, false), 'full', 'กระเป๋าเต็ม');
  assert.equal(p.stash.length, 1);
  p.items.pop();
  assert.equal(moveItem(g, it.uid, false), 'ok'); assert.ok(p.items.includes(it));
  p.items.length = 0;
  for (let i = 0; i < I.stashSize; i++) p.stash.push({ ...rollItem(I, g.rng, 5, { rarity: 'normal' }), uid: ++p.nextUid });
  p.items.push(it);
  assert.equal(moveItem(g, it.uid, true), 'full', 'หีบเต็ม');
});

test('หีบเก็บของ: เซฟ/โหลดครบ · uid ซ้ำระหว่างกระเป๋ากับหีบถูกปฏิเสธ · เซฟรุ่น 10 ย้ายได้', () => {
  const g = makeGame(), p = g.player, I = g.data.items;
  g.world.load('road');
  const a = { ...rollItem(I, g.rng, 10, { rarity: 'green' }), uid: ++p.nextUid };
  p.stash = [a];
  const d = JSON.parse(JSON.stringify(serialize(g)));
  const v = validate(d, g.data);
  assert.ok(v); assert.equal(v.stash.length, 1); assert.equal(v.stash[0].uid, a.uid);
  const dup = JSON.parse(JSON.stringify(d)); dup.items.push(JSON.parse(JSON.stringify(a)));
  assert.equal(validate(dup, g.data), null);
  const old = JSON.parse(JSON.stringify(d)); old.v = 10; delete old.stash;
  assert.deepEqual(validate(old, g.data).stash, []);
});

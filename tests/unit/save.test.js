import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGame } from './helpers.js';
import { serialize, validate, SAVE_VERSION } from '../../src/systems/save.js';
import { respawn } from '../../src/systems/travel.js';

test('เซฟแล้วอ่านกลับได้ค่าเดิม', () => {
  const g = makeGame(); g.world.load('field');
  Object.assign(g.player, { level: 4, xp: 12, coins: 321, x: 400, y: 500, gems: ['ruby'] });
  g.flags.tutorialDone = true;
  const s = validate(JSON.parse(JSON.stringify(serialize(g))), g.data.zones);
  assert.equal(s.v, SAVE_VERSION);
  assert.deepEqual([s.level, s.xp, s.coins, s.zone, s.gems[0], s.flags.tutorialDone], [4, 12, 321, 'field', 'ruby', true]);
});

test('เซฟเสีย/โกง ถูกปฏิเสธ', () => {
  const g = makeGame(); g.world.load('town');
  const good = serialize(g);
  for (const badS of [null, 'x', { ...good, v: 99 }, { ...good, zone: 'nope' }, { ...good, level: -1 }, { ...good, coins: 'lots' }, { ...good, gems: 'ruby' }]) {
    assert.equal(validate(badS, g.data.zones), null);
  }
});

test('ตายแล้วเสียเบี้ย 10% ครั้งเดียว และฟื้นเต็มหลอด', () => {
  const g = makeGame(); g.flags.reachedTown = true; g.world.load('field');
  g.player.coins = 1000; g.player.hp = 0; g.player.dead = true;
  g.events.emit('playerDied', {});
  assert.equal(g.mode, 'dead');
  respawn(g);
  assert.equal(g.player.coins, 900);
  assert.equal(g.world.zone.id, 'town');
  assert.ok(g.player.hp > 0 && !g.player.dead);
});

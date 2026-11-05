import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGame } from './helpers.js';
import { T } from '../../src/systems/world.js';
import { reachable } from './path.js';

test('ทุกทางออก: จุดเกิดปลายทางไม่ติดสิ่งกีดขวาง', () => {
  const g = makeGame(); g.flags.gotRuby = true;
  for (const [id, z] of Object.entries(g.data.zones)) {
    for (const e of z.exits) {
      g.world.load(e.to); g.world.refreshFlags();
      assert.equal(g.world.blocked(e.tx * T, e.ty * T, 10), false, `${id}→${e.to} เกิดติดกำแพง`);
    }
    g.world.load(id);
    assert.equal(g.world.blocked(z.start.x * T, z.start.y * T, 10), false, `${id} จุดเริ่มติดกำแพง`);
  }
});

test('ท่อนไม้ในทางเกวียนกั้นทางจนกว่าจะได้ทับทิม', () => {
  const g = makeGame(); g.world.load('road');
  const x = 42.5 * T, y = 10 * T;
  assert.equal(g.world.blocked(x, y, 10), true);
  g.flags.gotRuby = true; g.world.refreshFlags();
  assert.equal(g.world.blocked(x, y, 10), false);
});

test('ทุกทางออกเดินไปถึงได้จริงจากจุดเริ่มของพื้นที่ (หาทางแบบตาราง)', () => {
  const g = makeGame(); g.flags.gotRuby = true; g.flags.yakSlain = true; g.flags.khotchasi_kingSlain = true; g.flags.garuda_kingSlain = true; g.flags.vessavanaSlain = true; g.flags.naga_kingSlain = true;   // เปิดทุกด่านที่มีธงกั้น (ด่านกั้นมีเทสต์แยก)
  for (const [id, z] of Object.entries(g.data.zones)) {
    g.world.load(id); g.world.refreshFlags();
    for (const e of g.world.zone.exits) {
      const hit = reachable(g.world, g.world.zone.start, (x, y) => g.world.exitAt(x, y) === e);
      assert.ok(hit, `${id}: เดินไปทางออกสู่ ${e.to} ไม่ได้`);
    }
  }
});

test('ก่อนได้ทับทิม เดินออกจากทางเกวียนไม่ได้ (บทนำบังคับ)', () => {
  const g = makeGame(); g.world.load('road');
  assert.equal(reachable(g.world, g.world.zone.start, (x, y) => !!g.world.exitAt(x, y)), null);
});

test('ทุกชาวบ้านเดินไปคุยได้', () => {
  const g = makeGame(); g.world.load('town');
  for (const n of g.world.zone.npcs) {
    const hit = reachable(g.world, g.world.zone.start, (x, y) => Math.hypot(x - n.x, y - n.y) < 40);
    assert.ok(hit, `เดินไปหา ${n.name} ไม่ได้`);
  }
});

test('บท 5–6: บันไดนาคในดาวดึงส์ และประตูน้ำวนในนครบาดาล กั้นทางจนกว่าจะล้มบอสของบท', () => {
  const g = makeGame();
  for (const [zone, to, flag] of [['tavatimsa', 'naga_pier', 'vessavanaSlain'], ['badan', 'lanka_camp', 'naga_kingSlain']]) {
    g.world.load(zone); g.world.refreshFlags();
    const e = g.world.zone.exits.find((x) => x.to === to);
    assert.ok(e, zone + ' ต้องมีทางออกไป ' + to);
    assert.ok(!reachable(g.world, g.world.zone.start, (x, y) => g.world.exitAt(x, y) === e), zone + ' ยังไม่ล้มบอสต้องผ่านไม่ได้');
    g.flags[flag] = true; g.world.refreshFlags();
    assert.ok(reachable(g.world, g.world.zone.start, (x, y) => g.world.exitAt(x, y) === e), zone + ' ล้มบอสแล้วต้องผ่านได้');
  }
});

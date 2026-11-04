// ศาลวาร์ป: ปลดล็อกเมื่อเดินถึงจริง · วาร์ปได้เฉพาะศาลที่ปลดล็อก และต้องยืนที่ศาล · เซฟเก็บไว้
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGame } from './helpers.js';
import { reachable } from './path.js';
import { enterZone } from '../../src/systems/travel.js';
import { updateWaypoints, warpTo, waypointOf, allWaypoints } from '../../src/systems/waypoint.js';
import { serialize, validate } from '../../src/systems/save.js';

function standAt(g) { const wp = waypointOf(g.world.zone); g.player.x = (wp.x + wp.w / 2); g.player.y = wp.y + wp.h + 10; updateWaypoints(g); return wp; }

test('ทุกศาลวาร์ปเดินไปถึงได้จากจุดเริ่มของพื้นที่', () => {
  const g = makeGame(); Object.assign(g.flags, { gotRuby: true, tutorialDone: true });
  for (const w of allWaypoints(g)) {
    g.world.load(w.id); g.world.refreshFlags();
    const wp = waypointOf(g.world.zone);
    assert.ok(reachable(g.world, g.world.zone.start, (x, y) => Math.hypot(x - (wp.x + wp.w / 2), y - (wp.y + wp.h)) < 40), w.id + ': เดินไปศาลไม่ถึง');
  }
});

test('เดินถึงศาล = ปลดล็อก · วาร์ปไปศาลที่ยังไม่ปลดล็อกไม่ได้ · วาร์ปไปที่ปลดล็อกแล้วได้', () => {
  const g = makeGame(); g.flags.tutorialDone = true;
  enterZone(g, 'himmapan'); standAt(g);
  assert.equal(g.flags.wp_himmapan, true);
  enterZone(g, 'town'); g.player.x = 100; g.player.y = 100; updateWaypoints(g);
  assert.equal(g.flags.wp_town, undefined, 'ยังไม่ถึงศาลห้ามปลดล็อก');
  assert.equal(warpTo(g, 'himmapan'), false, 'ไม่ได้ยืนที่ศาล วาร์ปไม่ได้');
  standAt(g);
  assert.equal(warpTo(g, 'kailash'), false, 'ศาลเขาไกรลาสยังไม่ปลดล็อก');
  assert.equal(warpTo(g, 'himmapan'), true);
  assert.equal(g.world.zone.id, 'himmapan');
  assert.equal(g.world.blocked(g.player.x, g.player.y, g.player.radius), false, 'วาร์ปแล้วต้องไม่ติดสิ่งกีดขวาง');
  const s = validate(JSON.parse(JSON.stringify(serialize(g))), g.data);
  assert.equal(s.flags.wp_himmapan, true); assert.equal(s.flags.wp_town, true);
});

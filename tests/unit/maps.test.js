// ถ้ำลายแทง: สร้างสุ่มแล้วเล่นได้จริงทุกครั้ง · ใช้ลายแทงแล้วหมด · บอสให้ลายแทงขั้นถัดไป · ประตูเปิดเมื่อบอสตาย
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGame } from './helpers.js';
import { reachable } from './path.js';
import { enterZone, updateTravel } from '../../src/systems/travel.js';
import { generateMap, openMap } from '../../src/systems/maps.js';
import { buildZone, createWorld } from '../../src/systems/world.js';
import { damageMob } from '../../src/systems/combat.js';

test('ถ้ำสุ่ม 60 แบบ: จุดเริ่มไม่ติดกำแพง เดินถึงห้องบอสและประตูมิติได้ ค่าปรับตามขั้น', () => {
  const g = makeGame();
  for (let i = 0; i < 60; i++) {
    const tier = 1 + (i % 5), def = generateMap(g, tier, 1000 + i);
    assert.equal(def.mapMods.length, g.data.balance.maps.modsPerTier[tier]);
    const zones = { ...g.data.zones, map: def }, w = createWorld(zones, () => false, () => false);
    const z = w.load('map');
    assert.equal(w.blocked(z.start.x, z.start.y, 10), false, 'seed ' + (1000 + i) + ' เริ่มติดกำแพง');
    const portal = z.exits.find((e) => e.requiresClear), bossArea = z.spawns[z.spawns.length - 1].area;
    assert.ok(reachable(w, z.start, (x, y) => x >= portal.x && x <= portal.x + portal.w && y >= portal.y && y <= portal.y + portal.h), 'seed ' + (1000 + i) + ' ไปประตูมิติไม่ถึง');
    assert.ok(reachable(w, z.start, (x, y) => x >= bossArea.x && x <= bossArea.x + bossArea.w && y >= bossArea.y && y <= bossArea.y + bossArea.h), 'seed ' + (1000 + i) + ' ไปห้องบอสไม่ถึง');
  }
});

test('ใช้ลายแทง: หักแผ่นเดียว เข้าถ้ำ มอนเลเวลตามขั้น ไม่มีลายแทงเปิดไม่ได้', () => {
  const g = makeGame(); g.flags.tutorialDone = true; enterZone(g, 'town');
  g.player.currency.map2 = 1;
  assert.equal(openMap(g, 1), false);
  assert.equal(openMap(g, 2), true);
  assert.equal(g.player.currency.map2, 0);
  assert.equal(g.world.zone.id, 'map');
  const lv = g.data.balance.maps.levelBase + 2 * g.data.balance.maps.levelPerTier;
  assert.ok(g.mobs.length > 5 && g.mobs.every((m) => m.level >= lv && m.level <= lv + 1));
  assert.equal(openMap(g, 2), false, 'หมดแล้ว');
});

test('บอสถ้ำ: ประตูปิดจนบอสตาย · ได้ลายแทงขั้นถัดไปครั้งเดียว · ออกแล้วกลับเวียงที่แท่น', () => {
  const g = makeGame(); g.flags.tutorialDone = true; enterZone(g, 'town');
  g.player.currency.map3 = 1; openMap(g, 3);
  const z = g.world.zone, portal = z.exits.find((e) => e.requiresClear), boss = g.mobs.find((m) => m.def.boss);
  assert.ok(boss, 'ต้องมีบอส');
  assert.equal(g.mobs.filter((m) => m.def.boss).length, 1, 'บอสต้องมีตัวเดียว (ค่าปรับฝูงใหญ่ห้ามทวีบอส)');
  assert.equal(g.world.exitAt(portal.x + 5, portal.y + 5), null);
  const n = g.drops.length;
  damageMob(g, boss, 1e9); damageMob(g, boss, 1e9);
  const maps = g.drops.slice(n).filter((d) => d.kind === 'currency' && d.cur.startsWith('map'));
  assert.deepEqual(maps.map((d) => d.cur), ['map4']);
  g.player.x = portal.x + 10; g.player.y = portal.y + 10; g.travelLock = 0; updateTravel(g, 0.016);
  assert.equal(g.world.zone.id, 'town');
  assert.equal(g.world.blocked(g.player.x, g.player.y, g.player.radius), false);
});

test('บอสใหญ่ในเรื่อง (Lv.13+) ให้ลายแทงขั้น 1 · ยักษ์วัดไม่ให้', () => {
  const g = makeGame(); g.flags.tutorialDone = true;
  enterZone(g, 'dungeon3');
  let n = g.drops.length; damageMob(g, g.mobs.find((m) => m.type === 'yak'), 1e9);
  assert.equal(g.drops.slice(n).filter((d) => d.cur === 'map1').length, 0);
  enterZone(g, 'himmapan');
  n = g.drops.length; damageMob(g, g.mobs.find((m) => m.type === 'khotchasi_king'), 1e9);
  assert.equal(g.drops.slice(n).filter((d) => d.cur === 'map1').length, 1);
});

test('ค่าปรับฝูงใหญ่ทวีมอน แต่บอสยังตัวเดียวเสมอ (20 ถ้ำ)', () => {
  for (let i = 0; i < 20; i++) {
    const g = makeGame(); g.flags.tutorialDone = true; enterZone(g, 'town');
    g.player.currency.map5 = 1; openMap(g, 5);
    assert.equal(g.mobs.filter((m) => m.def.boss).length, 1);
  }
});

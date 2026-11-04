// ดันเจี้ยนวัดร้าง + บอสยักษ์วัด: กำแพง ประตูมิติ ของบอส ท่าบอส เซฟ/โหลด
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGame, count } from './helpers.js';
import { reachable } from './path.js';
import { makeMob, updateMonsters } from '../../src/systems/monsters.js';
import { damageMob } from '../../src/systems/combat.js';
import { addHazard, updateHazards } from '../../src/systems/boss.js';
import { enterZone, updateTravel } from '../../src/systems/travel.js';
import { serialize, validate } from '../../src/systems/save.js';
import { T } from '../../src/systems/world.js';

function bossGame() {
  const g = makeGame(); g.flags.tutorialDone = true; g.flags.gotRuby = true;
  enterZone(g, 'dungeon3');
  const yak = g.mobs.find((m) => m.type === 'yak');
  return { g, yak };
}

test('ทางเข้าจากทุ่งนาพาลงชั้น 1 → 2 → 3 ได้ และทุกชั้นเดินถึงทางลงจริง', () => {
  const g = makeGame(); g.flags.tutorialDone = true; g.flags.gotRuby = true;
  const route = [['field', 'dungeon1'], ['dungeon1', 'dungeon2'], ['dungeon2', 'dungeon3']];
  for (const [from, to] of route) {
    enterZone(g, from);
    const e = g.world.zone.exits.find((x) => x.to === to);
    assert.ok(e, `${from} ไม่มีทางไป ${to}`);
    const st = from === 'field' ? { x: 35.5 * T, y: 29 * T } : g.world.zone.start;
    const hit = reachable(g.world, st, (x, y) => x >= e.x && x <= e.x + e.w && y >= e.y && y <= e.y + e.h);
    assert.ok(hit, `${from}: เดินไปทางลง ${to} ไม่ถึง`);
  }
});

test('ดันเจี้ยนมีกำแพงทึบรอบห้อง และกลางห้องเดินได้', () => {
  const g = makeGame(); g.world.load('dungeon1');
  const z = g.world.zone;
  assert.ok(z.walls.length > 0);
  assert.equal(g.world.blocked(25 * T, 18 * T, 10), false, 'กลางห้องต้องเดินได้');
  assert.equal(g.world.blocked(1 * T, 1 * T, 10), true, 'นอกห้องต้องเป็นกำแพง');
  assert.equal(g.world.blocked(15 * T, 10 * T, 10), true, 'ระหว่างห้องต้องเป็นกำแพง');
});

test('ประตูมิติกลับทุ่งนาปิดจนกว่าบอสตาย แล้วเปิดให้ออกได้', () => {
  const { g, yak } = bossGame();
  const portal = g.world.zone.exits.find((e) => e.requiresClear);
  const px = portal.x + portal.w / 2, py = portal.y + portal.h / 2;
  assert.equal(g.world.exitAt(px, py), null, 'บอสยังอยู่ ประตูต้องปิด');
  g.player.x = px; g.player.y = py; g.travelLock = 0; updateTravel(g, 0.016);
  assert.equal(g.world.zone.id, 'dungeon3');
  damageMob(g, yak, 99999);
  assert.ok(g.world.exitAt(px, py), 'บอสตายแล้วประตูต้องเปิด');
  g.travelLock = 0; updateTravel(g, 0.016);
  assert.equal(g.world.zone.id, 'field');
});

test('ล้มบอสได้ของครั้งเดียว: ไอเท็มม่วง/แดง 2 ชิ้น พลอย 2 เม็ด ตีซ้ำไม่ได้เพิ่ม', () => {
  const { g, yak } = bossGame();
  const kills = count(g, 'bossKilled');
  damageMob(g, yak, 99999); damageMob(g, yak, 99999); damageMob(g, yak, 5);
  assert.equal(kills(), 1);
  const items = g.drops.filter((d) => d.kind === 'item' && d.item.rarity !== 'unique');
  assert.equal(items.length >= 2, true);
  assert.equal(items.filter((d) => d.item.rarity === 'purple' || d.item.rarity === 'red').length >= 2, true);
  assert.ok(g.drops.filter((d) => d.kind === 'gem').length >= 2);
  assert.equal(g.flags.yakSlain, true);
});

test('บอสคลั่งครั้งเดียวเมื่อเลือดเหลือครึ่ง และเรียกลิงมา 3 ตัว', () => {
  const { g, yak } = bossGame();
  const rage = count(g, 'bossEnraged');
  g.player.x = yak.x - 300; g.player.y = yak.y; g.player.invuln = 999;
  damageMob(g, yak, Math.ceil(yak.maxHp * 0.55));
  for (let i = 0; i < 30; i++) updateMonsters(g, 1 / 60);
  damageMob(g, yak, 10);
  for (let i = 0; i < 30; i++) updateMonsters(g, 1 / 60);
  assert.equal(rage(), 1);
  assert.equal(g.mobs.filter((m) => m.type === 'monkey').length, 3);
});

test('วงเตือนของบอส: ยังไม่โดนก่อนหมดเวลา โดนครั้งเดียว และพุ่งหลบได้', () => {
  const g = makeGame(); g.world.load('dungeon3');
  const p = g.player; p.x = 25 * T; p.y = 16 * T; p.hp = 500;
  addHazard(g, { kind: 'circle', x: p.x, y: p.y, r: 60, t: 0.5, max: 0.5, damage: 30 });
  for (let i = 0; i < 25; i++) updateHazards(g, 1 / 60);
  assert.equal(p.hp, 500, 'ห้ามโดนก่อนวงเตือนครบเวลา');
  for (let i = 0; i < 60; i++) { updateHazards(g, 1 / 60); p.invuln = 0; }
  assert.equal(p.hp, 470, 'โดนครั้งเดียว');
  // พุ่งหลบ (อมตะชั่วครู่) ตอนระเบิด = ไม่โดน
  addHazard(g, { kind: 'circle', x: p.x, y: p.y, r: 60, t: 0.1, max: 0.1, damage: 30 });
  p.invuln = 0.3; p.dashT = 0.2;
  for (let i = 0; i < 20; i++) updateHazards(g, 1 / 60);
  assert.equal(p.hp, 470);
});

test('คลื่นกระทืบโดนครั้งเดียวแม้ยืนในแนวคลื่นนาน และหายไปเมื่อสุดระยะ', () => {
  const g = makeGame(); g.world.load('dungeon3');
  const p = g.player; p.x = 25 * T + 100; p.y = 16 * T; p.hp = 500;
  addHazard(g, { kind: 'wave', x: 25 * T, y: 16 * T, r: 0, t: 0, max: 0.5, speed: 200, maxR: 260, thick: 22, damage: 20 });
  for (let i = 0; i < 120; i++) { updateHazards(g, 1 / 60); p.invuln = 0; }
  assert.equal(p.hp, 480);
  assert.equal(g.hazards.length, 0);
});

test('บอสสู้จริง 20 วินาที: ทุกท่ามีสัญญาณเตือน และผู้เล่นไม่โดนทันทีที่บอสตื่น', () => {
  const { g, yak } = bossGame();
  const p = g.player; p.x = yak.x - 120; p.y = yak.y; p.hp = 99999;
  let firstHit = -1, sawHazard = false;
  g.events.on('playerHurt', () => { if (firstHit < 0) firstHit = g.time; });
  for (let i = 0; i < 1200; i++) {
    g.time = i / 60; updateMonsters(g, 1 / 60); updateHazards(g, 1 / 60);
    if (g.hazards.length || yak.state === 'windup') sawHazard = true;
    p.invuln = Math.max(0, p.invuln - 1 / 60);
  }
  assert.ok(sawHazard, 'บอสต้องใช้ท่าที่มีวงเตือน');
  assert.ok(firstHit < 0 || firstHit >= 0.5, `โดนเร็วเกินไป (${firstHit}s) ไม่มีเวลาหลบ`);
  assert.equal(yak.dead, false);
});

test('ในดันเจี้ยนมอนตายแล้วไม่เกิดใหม่ เข้าใหม่จึงรีเซ็ต', () => {
  const g = makeGame(); g.flags.tutorialDone = true; g.flags.gotRuby = true;
  enterZone(g, 'dungeon1');
  const n = g.mobs.length;
  assert.ok(n > 10);
  for (const m of g.mobs.slice()) damageMob(g, m, 99999);
  for (let i = 0; i < 60 * 40; i++) updateMonsters(g, 1 / 60);
  assert.equal(g.mobs.length, 0);
  enterZone(g, 'dungeon2'); enterZone(g, 'dungeon1');
  assert.ok(g.mobs.length >= n - 3);
});

test('เซฟในดันเจี้ยน = เซฟไว้หน้าทางเข้าวัดร้าง โหลดได้ ของไม่ซ้ำ', () => {
  const { g, yak } = bossGame();
  damageMob(g, yak, 99999);
  const it = g.drops.find((d) => d.kind === 'item');
  g.player.x = it.x; g.player.y = it.y;
  it.t = 1;
  return import('../../src/systems/loot.js').then(({ updateLoot }) => {
    for (let i = 0; i < 10; i++) updateLoot(g, 1 / 60);
    const s = validate(JSON.parse(JSON.stringify(serialize(g))), g.data);
    assert.ok(s, 'เซฟต้องผ่านการตรวจ');
    assert.equal(s.zone, 'field');
    assert.ok(Math.abs(s.x - 65 * T) < 2);
    const uids = s.items.map((x) => x.uid);
    assert.equal(new Set(uids).size, uids.length);
    assert.ok(s.items.length >= 1);
  });
});

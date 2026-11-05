// บท 5 เมืองบาดาล และบท 6 กรุงลงกา: มอนใหม่เลเวลไล่ระดับ · เดินถึงบอส · ล้มบอสได้ของ/ธง/เควส · มอนใหม่ทุกตัวเล่นได้ไม่พัง
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGame } from './helpers.js';
import { reachable } from './path.js';
import { enterZone } from '../../src/systems/travel.js';
import { talkTo } from '../../src/systems/npc.js';
import { damageMob } from '../../src/systems/combat.js';
import { updateMonsters } from '../../src/systems/monsters.js';
import { readyQuestFor } from '../../src/systems/quests.js';

const ACTS = [
  { boss: 'naga_king', zone: 'badan', sub: 'badan_cave', town: 'naga_pier', giver: 'nak_kham', mobs: ['naga_soldier', 'mermaid', 'sea_crab'], lv: [21, 26] },
  { boss: 'thotsakan', zone: 'lanka', sub: 'lanka_shore', town: 'lanka_camp', giver: 'phiphek', mobs: ['lanka_yak', 'rakshasi', 'war_elephant'], lv: [27, 32] },
];

for (const A of ACTS) test(`บท ${A.zone}: มอนใหม่ครบ เลเวล ${A.lv.join('–')} · เดินถึงบอส · ล้มบอสได้ของม่วง/แดง ตั้งธง เควสรอรับรางวัล`, () => {
  const g = makeGame(); g.flags.tutorialDone = true;
  for (const z of [A.sub, A.zone]) {
    enterZone(g, z);
    assert.ok(g.mobs.every((m) => m.level >= A.lv[0] && m.level <= A.lv[1]), z + ' เลเวล');
    for (const t of A.mobs) assert.ok(g.mobs.some((m) => m.type === t), `${z} ไม่มี ${t}`);
  }
  const boss = g.mobs.find((m) => m.type === A.boss);
  assert.ok(boss && boss.def.boss, 'มีบอส');
  assert.ok(reachable(g.world, g.world.zone.start, (x, y) => Math.hypot(x - boss.x, y - boss.y) < 90), 'เดินไปหาบอสไม่ถึง');
  const n = g.drops.length;
  damageMob(g, boss, 1e9); damageMob(g, boss, 1e9);
  assert.equal(g.drops.slice(n).filter((d) => d.kind === 'item' && d.item.rarity !== 'unique').length, boss.def.bossLoot.items, 'ของบอสครั้งเดียว');
  assert.equal(g.flags[A.boss + 'Slain'], true);
  assert.ok(readyQuestFor(g, A.giver), 'เควสหลักรอรับรางวัล');
  enterZone(g, A.town);
  talkTo(g, g.world.zone.npcs.find((x) => x.id === A.giver)); g.dialog.onDone();
  assert.equal(g.mode, 'reward', 'เปิดหน้าต่างเลือกพลอยรางวัล');
});

test('มอนใหม่บท 5–6 ทุกตัว (รวมบอส) ไล่ ตี ยิง ร่าย อัญเชิญลูกน้องได้ 20 วินาทีโดยไม่พัง', () => {
  const g = makeGame(); g.flags.tutorialDone = true;
  for (const z of ['badan', 'lanka']) {
    enterZone(g, z);
    const boss = g.mobs.find((m) => m.def.boss);
    g.player.x = boss.x - 120; g.player.y = boss.y + 40; g.player.hp = g.player.maxHp = 1e9;
    for (const m of g.mobs) { m.x = g.player.x + (Math.random() - 0.5) * 300; m.y = g.player.y + (Math.random() - 0.5) * 200; }
    boss.hp = boss.maxHp * 0.4;                                              // ให้คลั่ง + อัญเชิญ
    const before = g.mobs.length;
    for (let i = 0; i < 1200; i++) { g.player.invuln = Math.max(0, g.player.invuln - 1 / 60); updateMonsters(g, 1 / 60); }   // อมตะหลังโดนตีลดเอง (ปกติลดใน updatePlayer)
    assert.ok(g.player.hp < 1e9, z + ' มอนต้องทำดาเมจได้');
    assert.ok(g.mobs.length > before, z + ' บอสอัญเชิญลูกน้อง');
    assert.ok(g.mobs.every((m) => Number.isFinite(m.x) && Number.isFinite(m.y)));
  }
});

test('พ่อเฒ่าจันทร์เล่าตอนจบเมื่อล้มทศกัณฐ์ (ครั้งเดียว) · ข้อความหลังจบชี้ไปถ้ำลายแทง', () => {
  const g = makeGame(); g.flags.tutorialDone = true;
  Object.assign(g.flags, { metChan: true, heardHimmapan: true, q_q1_main: true, heardKailash: true, heardHeaven: true, heardEnding1: true, thotsakanSlain: true });
  enterZone(g, 'town');
  const chan = g.world.zone.npcs.find((x) => x.id === 'chan');
  talkTo(g, chan); assert.deepEqual(g.dialog.lines, g.data.dialogue.chan_thotsakan); g.dialog.onDone();
  talkTo(g, chan); assert.notDeepEqual(g.dialog.lines, g.data.dialogue.chan_thotsakan);
  assert.ok(g.data.quests.endgame.text.includes('ทศกัณฐ์'));
});

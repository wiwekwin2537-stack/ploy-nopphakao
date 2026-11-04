import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGame, count } from './helpers.js';
import { makeMob } from '../../src/systems/monsters.js';
import { damageMob, meleeArc } from '../../src/systems/combat.js';
import { updateLoot } from '../../src/systems/loot.js';
import { gainXp } from '../../src/systems/progress.js';
import { enterZone } from '../../src/systems/travel.js';

test('มอนตายได้ครั้งเดียว: ตีซ้ำหลังตายไม่ได้ XP/ของซ้ำ', () => {
  const g = makeGame(); g.world.load('field');
  const kills = count(g, 'mobKilled');
  const m = makeMob(g, 'boar', 1, 300, 300); g.mobs.push(m);
  damageMob(g, m, 999); damageMob(g, m, 999); damageMob(g, m, 5);
  assert.equal(kills(), 1);
  assert.equal(g.player.xp, m.xp);
  assert.ok(g.drops.length <= 1);
});

test('ฟันวงโค้งโดนหลายตัวพร้อมกัน แต่แต่ละตัวตายครั้งเดียว', () => {
  const g = makeGame(); g.world.load('field');
  const kills = count(g, 'mobKilled');
  for (let i = 0; i < 4; i++) { const m = makeMob(g, 'piglet', 1, 330 + i * 4, 300); m.hp = 1; g.mobs.push(m); }
  const p = g.player; p.x = 300; p.y = 300;
  meleeArc(g, p.x, p.y, 0, 50, 2, 50); meleeArc(g, p.x, p.y, 0, 50, 2, 50);
  assert.equal(kills(), 4);
});

test('เก็บเหรียญได้ครั้งเดียว แล้วหายจากพื้น', () => {
  const g = makeGame(); g.world.load('field');
  const p = g.player; p.x = 500; p.y = 500;
  g.drops.push({ id: 1, kind: 'coin', amount: 7, x: 505, y: 500, t: 1, z: 0, vz: 0, vx: 0, vy: 0 });
  for (let i = 0; i < 20; i++) updateLoot(g, 0.05);
  assert.equal(p.coins, 7);
  assert.equal(g.drops.length, 0);
});

test('เลเวลอัพหลายขั้นในครั้งเดียว และหยุดที่เลเวลสูงสุด', () => {
  const g = makeGame();
  gainXp(g, 100);
  assert.equal(g.player.level, 3);
  gainXp(g, 1e7);
  assert.equal(g.player.level, g.data.balance.maxLevel);
  assert.equal(g.player.xp, 0);
});

test('เข้าออกพื้นที่ซ้ำ 20 รอบ มอนไม่เพิ่มเกินจำนวนที่กำหนด', () => {
  const g = makeGame(); g.flags.tutorialDone = true; g.flags.gotRuby = true;
  const expected = g.data.zones.field.spawns.reduce((a, s) => a + s.count, 0);
  for (let i = 0; i < 20; i++) { enterZone(g, 'field'); enterZone(g, 'town'); }
  enterZone(g, 'field');
  assert.ok(g.mobs.length <= expected, `มอน ${g.mobs.length} > ${expected}`);
  assert.ok(g.mobs.length >= expected - 4);
  enterZone(g, 'town');
  assert.equal(g.mobs.length, 0, 'ในเวียงต้องไม่มีมอน');
});

test('มอนเดินอ้อมเกวียนมาหาผู้เล่นได้ (เคยติดค้างอยู่หลังเกวียน)', async () => {
  const { updateMonsters } = await import('../../src/systems/monsters.js');
  const g = makeGame(); g.world.load('road'); g.flags.tutorialDone = true;
  const p = g.player; p.x = 222; p.y = 320; p.invuln = 999;
  const m = makeMob(g, 'boar', 1, 402, 320); m.aggroed = true; m.chargeCd = 999; g.mobs.push(m);
  for (let i = 0; i < 400; i++) updateMonsters(g, 1 / 60);
  assert.ok(Math.hypot(m.x - p.x, m.y - p.y) < 60, `ยังติดอยู่ที่ ${Math.round(m.x)},${Math.round(m.y)}`);
});

test('พญาหมูป่าตัวใหญ่เดินอ้อมเกวียนได้ด้วยการหาทาง (ช่องแคบกว่าตัว)', async () => {
  const { updateMonsters } = await import('../../src/systems/monsters.js');
  const g = makeGame(); g.world.load('road'); g.flags.tutorialDone = true;
  const p = g.player; p.x = 222; p.y = 320; p.invuln = 999;
  const m = makeMob(g, 'bigboar', 1, 402, 300); m.aggroed = true; m.chargeCd = 999; g.mobs.push(m);
  for (let i = 0; i < 600; i++) updateMonsters(g, 1 / 60);
  assert.ok(Math.hypot(m.x - p.x, m.y - p.y) < 70, `ยังติดอยู่ที่ ${Math.round(m.x)},${Math.round(m.y)}`);
});

test('คอมโบฟัน: ดาบโดนหลังจังหวะง้าง และกดต่อเนื่องได้ท่า 1→2→3', async () => {
  const { doAttack, updatePlayer } = await import('../../src/systems/player.js');
  const g = makeGame(); g.world.load('field');
  const p = g.player; p.x = 300; p.y = 300;
  const m = makeMob(g, 'boar', 1, 330, 300); m.hp = 9999; m.maxHp = 9999; g.mobs.push(m);
  const combos = [];
  for (let i = 0; i < 3; i++) {
    p.attackCd = 0; doAttack(g); combos.push(p.combo);
    assert.equal(m.hp, 9999, 'ยังไม่ควรโดนตอนเพิ่งกด');
    for (let f = 0; f < 10; f++) updatePlayer(g, 0.016);
    assert.ok(m.hp < 9999, 'ต้องโดนหลังง้างเสร็จ'); m.hp = 9999;
  }
  assert.deepEqual(combos, [0, 1, 2]);
});

test('คทา (หมอผี): ตีธรรมดาเป็นลูกพลังพุ่งไปหาเป้าไกล ไม่ใช่เอาคทาฟัน · อาชีพอื่นยังฟันใกล้', async () => {
  const { giveStarterGear, doAttack, updatePlayer } = await import('../../src/systems/player.js');
  const { makeMob } = await import('../../src/systems/monsters.js');
  const { enterZone } = await import('../../src/systems/travel.js');
  for (const [cls, ranged] of [['shaman', true], ['warrior', false]]) {
    const g = makeGame(); giveStarterGear(g.player, g.data, cls); g.flags.tutorialDone = true;
    enterZone(g, 'field'); g.mobs.length = 0;
    const p = g.player, m = makeMob(g, 'boar', 1, p.x + 200, p.y, -1); g.mobs.push(m);
    assert.ok(doAttack(g));
    if (ranged) { assert.equal(g.shots.length, 0, 'ยังไม่ปล่อยทันที — มีท่าร่ายก่อน'); assert.ok(p.shootT > 0 && p.shootKind === 'staff'); }
    const swung = p.swing >= 0;
    for (let i = 0; i < 30 && !g.shots.length; i++) updatePlayer(g, 1 / 60);
    assert.equal(g.shots.filter((s) => s.from === 'player').length, ranged ? 1 : 0, cls);
    if (ranged) { const s = g.shots[0]; assert.equal(s.kind, 'arcane'); assert.ok(s.vx > 0, 'พุ่งไปทางมอน'); assert.equal(p.swing, -1, 'ไม่เหวี่ยงคทา'); }
    else assert.ok(swung);
  }
});

test('ธนู/หน้าไม้: ตีธรรมดายิงลูกศร (หน้าไม้ทะลุ 1) · สกิลศรใช้ได้เฉพาะตอนถือธนู/หน้าไม้ และใช้ดาเมจโจมตี', async () => {
  const { giveStarterGear, doAttack, updatePlayer } = await import('../../src/systems/player.js');
  const { makeMob } = await import('../../src/systems/monsters.js');
  const { enterZone } = await import('../../src/systems/travel.js');
  const { castSkill } = await import('../../src/systems/skills.js');
  const { playerStats } = await import('../../src/systems/stats.js');
  const g = makeGame(); giveStarterGear(g.player, g.data, 'ranger'); g.flags.tutorialDone = true;
  const p = g.player;
  assert.equal(p.equip.weapon.base, 'bamboo_bow');
  enterZone(g, 'field'); g.mobs.length = 0; g.mobs.push(makeMob(g, 'boar', 1, p.x + 250, p.y, -1));
  const fire = () => { assert.ok(doAttack(g)); assert.equal(g.shots.length, 0, 'ง้างสายก่อนปล่อย'); for (let i = 0; i < 30 && !g.shots.length; i++) updatePlayer(g, 1 / 60); };
  fire(); assert.equal(g.shots[0].kind, 'arrow'); assert.equal(g.shots[0].pierce, 0); assert.equal(p.shootKind, 'bow');
  g.shots.length = 0; p.attackCd = 0;
  p.equip.weapon = { ...p.equip.weapon, base: 'wood_crossbow' }; p.level = 5;
  fire(); assert.equal(g.shots[0].pierce, 1, 'หน้าไม้ทะลุ');
  g.shots.length = 0;
  p.equip.weapon.gems = ['tourmaline', null, null]; p.mp = 100;
  assert.ok(castSkill(g, 0)); const st = playerStats(p, g.data);
  assert.ok(Math.abs(g.shots[0].damage - st.damage * g.data.gems.main.tourmaline.damageMult * (1 + 0)) < 1e-6, 'ศรเพลิงใช้ดาเมจโจมตี');
  g.shots.length = 0; p.skillCd[0] = 0;
  p.equip.weapon = { ...p.equip.weapon, base: 'bamboo_sword' };
  assert.equal(castSkill(g, 0), false, 'ถือดาบใช้ศรไม่ได้');
  p.equip.weapon = { ...p.equip.weapon, base: 'bamboo_bow', gems: ['peridot', null, null] };
  assert.ok(castSkill(g, 0)); assert.equal(g.shots.length, 3, 'ศรกระจาย 3 ดอก');
});

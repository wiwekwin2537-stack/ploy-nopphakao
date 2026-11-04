import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGame } from './helpers.js';
import { socketGem, unsocketGem, computeSkill, ownsGem } from '../../src/systems/gems.js';
import { castSkill } from '../../src/systems/skills.js';
import { makeMob, updateMonsters } from '../../src/systems/monsters.js';
import { updateShots } from '../../src/systems/combat.js';

test('ฝัง/ถอดพลอย: พลอยไม่หายและไม่งอกเพิ่ม', () => {
  const g = makeGame(), G = g.data.gems, p = g.player;
  p.bag = ['ruby', 'multi', 'pierce', 'haste'];
  const count = () => p.bag.length + p.sockets.flat().filter(Boolean).length;
  socketGem(G, p, 0, 0); socketGem(G, p, 0, 0); socketGem(G, p, 0, 0);
  assert.deepEqual(p.sockets[0], ['ruby', 'multi', 'pierce']);
  socketGem(G, p, 0, 0);                              // ช่องเสริมเต็ม → สลับกับช่องสุดท้าย
  assert.deepEqual(p.sockets[0], ['ruby', 'multi', 'haste']);
  assert.deepEqual(p.bag, ['pierce']);
  for (let i = 0; i < 3; i++) unsocketGem(p, 0, i);
  unsocketGem(p, 0, 0);
  assert.equal(count(), 4);
  assert.ok(['ruby', 'multi', 'pierce', 'haste'].every((id) => ownsGem(p, id)));
});

test('พลอยเสริมเปลี่ยนสกิลตามข้อมูล: แตกกระจาย ทะลวง ระเบิด ว่องไว', () => {
  const G = makeGame().data.gems;
  const base = computeSkill(G, [['ruby', null, null]], 0);
  const multi = computeSkill(G, [['ruby', 'multi', null]], 0);
  assert.equal(multi.count, 3); assert.ok(multi.damageMult < base.damageMult); assert.ok(multi.mp > base.mp);
  const pierce = computeSkill(G, [['sapphire', 'pierce', null]], 0);
  assert.equal(pierce.pierce, 2); assert.equal(pierce.slow, 0.5);
  const area = computeSkill(G, [['emerald', 'area', null]], 0);
  assert.ok(area.splash > 0, 'มรกต + ระเบิด ต้องระเบิดได้');
  const haste = computeSkill(G, [['ruby', 'haste', 'haste']], 0);
  assert.ok(Math.abs(haste.cooldown - base.cooldown * 0.65 * 0.65) < 1e-9);
  assert.equal(computeSkill(G, [[null, 'multi', null]], 0), null, 'ไม่มีพลอยหลัก = ไม่มีสกิล');
});

test('แตกกระจายยิง 3 ลูกจริง และหอกไพลินทะลุ+ทำให้ช้า', () => {
  const g = makeGame(); g.world.load('field'); g.flags.tutorialDone = true;
  const p = g.player; p.x = 300; p.y = 1300; p.mp = 999; p.aim = 0;
  p.sockets[0] = ['ruby', 'multi', null];
  assert.ok(castSkill(g, 0));
  assert.equal(g.shots.length, 3);
  g.shots.length = 0;
  p.sockets[1] = ['sapphire', 'pierce', null];
  const a = makeMob(g, 'boar', 1, 360, 1278), b = makeMob(g, 'boar', 1, 420, 1278);
  a.hp = b.hp = a.maxHp = b.maxHp = 999; a.chargeCd = b.chargeCd = 99; g.mobs.push(a, b);
  assert.ok(castSkill(g, 1));
  for (let i = 0; i < 30; i++) updateShots(g, 1 / 60);
  assert.ok(a.hp < 999 && b.hp < 999, 'ต้องทะลุโดนทั้งสองตัว');
  assert.ok(a.slowT > 0 && b.slowT > 0);
  updateMonsters(g, 1 / 60);
  assert.equal(a.speed, a.baseSpeed * 0.5);
});

test('พิษมรกตกัดต่อเนื่อง และมอนตายจากพิษให้รางวัลครั้งเดียว', () => {
  const g = makeGame(); g.world.load('field'); g.flags.tutorialDone = true;
  let kills = 0; g.events.on('mobKilled', () => kills++);
  const m = makeMob(g, 'piglet', 1, 500, 500); m.chargeCd = 99; g.mobs.push(m);
  m.poisonT = 3; m.poisonDps = 40; m.poisonTick = 0.5;
  const hp0 = m.hp;
  for (let i = 0; i < 200; i++) updateMonsters(g, 1 / 60);
  assert.ok(m.dead || m.hp < hp0);
  assert.ok(kills <= 1);
});

// พลอยสกิลชุดใหม่: วงคลื่นไข่มุก (ดาเมจพลอยรอบตัว) · ทุบธรณี (พัดหน้า ดาเมจอาวุธ ทำให้ช้า) · ศรอำพัน (ทะลุ ต้องถือธนู) · พลอยเสริมประหยัดมนต์
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGame } from './helpers.js';
import { giveStarterGear } from '../../src/systems/player.js';
import { makeMob } from '../../src/systems/monsters.js';
import { castSkill, skillOf } from '../../src/systems/skills.js';
import { playerStats } from '../../src/systems/stats.js';

function setup(cls, gems) {
  const g = makeGame(), p = g.player; g.world.load('tavatimsa'); g.flags.tutorialDone = true; g.mobs.length = 0;
  giveStarterGear(p, g.data, cls); p.level = 20; p.x = 14 * 32; p.y = 20 * 32; p.mp = 999;
  p.equip.weapon.gems = gems; p.equip.weapon.colors = ['w', 'w', 'w']; p.equip.weapon.links = [true, true];
  const mob = (dx, dy) => { const m = makeMob(g, 'boar', 1, p.x + dx, p.y + dy, -1); m.hp = m.maxHp = 1e6; g.mobs.push(m); return m; };
  return { g, p, mob };
}

test('วงคลื่นไข่มุก: โดนทุกตัวรอบตัวทุกทิศ ไม่โดนตัวไกล · ใช้ดาเมจพลอย · มอนช้าลง', () => {
  const { g, p, mob } = setup('shaman', ['pearl', null, null]);
  const L = mob(-80, 0), R = mob(80, 20), far = mob(400, 0);
  p.aim = 0; assert.ok(castSkill(g, 0));
  assert.ok(L.hp < L.maxHp && R.hp < R.maxHp, 'โดนทั้งซ้ายขวา'); assert.equal(far.hp, far.maxHp, 'ตัวไกลไม่โดน');
  assert.ok(L.slowT > 0, 'ช้าลง');
  const st = playerStats(p, g.data), sk = skillOf(g, 0), dealt = L.maxHp - L.hp;
  assert.ok(dealt >= st.spellDamage * sk.damageMult * 0.79, 'ใช้ดาเมจพลอย');
});

test('ทุบธรณี: โดนพัดด้านหน้า ไม่โดนข้างหลัง · ใช้ดาเมจอาวุธ · ช้าลง', () => {
  const { g, p, mob } = setup('warrior', ['black_diamond', null, null]);
  const front = mob(90, 0), back = mob(-90, 0);
  g.mobs = [front, back]; p.targetMob = front;
  assert.ok(castSkill(g, 0));
  assert.ok(front.hp < front.maxHp && front.slowT > 0, 'ข้างหน้าโดนและช้า'); assert.equal(back.hp, back.maxHp, 'ข้างหลังไม่โดน');
});

test('ศรอำพัน: ต้องถือธนู/หน้าไม้ · ทะลุตามข้อมูล · ประหยัดมนต์ลดมานาจริง', () => {
  const { g, p, mob } = setup('ranger', ['amber', 'thrift', null]);
  mob(200, 0);
  const sk = skillOf(g, 0), G = g.data.gems;
  assert.equal(sk.pierce, G.main.amber.pierce);
  assert.equal(sk.mp, Math.ceil(G.main.amber.mp * G.support.thrift.mpMult), 'ประหยัดมนต์');
  assert.ok(castSkill(g, 0)); assert.equal(g.shots[0].kind, 'amber'); assert.equal(g.shots[0].pierce, G.main.amber.pierce);
  p.skillCd[0] = 0; p.equip.weapon = { ...p.equip.weapon, base: 'bamboo_sword' };
  assert.equal(castSkill(g, 0), false, 'ถือดาบใช้ศรไม่ได้');
});

test('พลอยชุดใหม่ดรอปได้จริง และของยูนีคที่ให้สกิลชุดใหม่ใช้พลอยที่มีอยู่จริง', () => {
  const g = makeGame(), G = g.data.gems, I = g.data.items;
  for (const id of ['pearl', 'black_diamond', 'amber', 'thrift']) assert.ok(G.drops.some((d) => d.gem === id), id + ' ต้องดรอปได้');
  for (const id of ['shadow_kris', 'monk_staff', 'earth_glaive', 'amber_bow']) {
    const U = I.uniques[id], x = U.grants || U.trigger;
    assert.ok(I.bases[U.base] && G.main[x.gem], id);
  }
});

// ใช้ศิลาที่เดียว (applyCurrency): ศิลาเปลี่ยนค่า + ศิลาช่องพลอย · ใช้ไม่ได้ = ไม่เสียศิลา มีข้อความบอกเหตุผล · ยูนีคเปลี่ยนค่าไม่ได้
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGame } from './helpers.js';
import { giveStarterGear } from '../../src/systems/player.js';
import { applyCurrency } from '../../src/systems/crafting.js';
import { makeUnique } from '../../src/systems/uniques.js';

test('ใช้ศิลา: ปรอทเปลี่ยนขาว→ม่วง · ใช้ซ้ำไม่ได้ไม่เสีย · ศิลาเจาะ/หินเจ็ดสีใช้กับช่องพลอย · ยูนีคใช้ได้แค่ศิลาช่องพลอย · ใบลานใช้ที่นี่ไม่ได้', () => {
  const g = makeGame(), p = g.player; g.world.load('town');
  giveStarterGear(p, g.data, 'warrior'); p.level = 20;
  Object.assign(p.currency, { alch: 2, gild: 1, jeweller: 1, chroma: 1, regret: 1 });
  const w = p.equip.weapon;
  assert.equal(applyCurrency(g, 'alch', null).ok, false, 'ไม่มีของในช่อง');
  const r = applyCurrency(g, 'alch', w);
  assert.ok(r.ok && w.rarity === 'purple' && w.mods.length === 3, r.text); assert.equal(p.currency.alch, 1);
  const r2 = applyCurrency(g, 'gild', w);
  assert.equal(r2.ok, false); assert.match(r2.text, /สีขาว/); assert.equal(p.currency.gild, 1, 'ใช้ไม่ได้ไม่เสีย');
  assert.ok(applyCurrency(g, 'chroma', w).ok); assert.equal(p.currency.chroma, 0);
  assert.equal(applyCurrency(g, 'chroma', w).ok, false, 'หมดแล้ว');
  const u = makeUnique(g.data.items, g.rng, 'wat_glaive', 10); u.uid = ++p.nextUid; p.items.push(u);
  assert.match(applyCurrency(g, 'alch', u).text, /ยูนีค/); assert.equal(p.currency.alch, 1);
  assert.match(applyCurrency(g, 'regret', w).text, /พาสซีฟ/); assert.equal(p.currency.regret, 1);
});

test('แถบคราฟต์: ของเต็มกระเป๋า + สวมครบทุกช่อง ยังอยู่ในกรอบหน้าต่าง (ทั้งจอคอมและมือถือ)', async () => {
  const { craftLayout } = await import('../../src/ui/crafttab.js');
  const { bagLayout } = await import('../../src/ui/bag.js');
  const g = makeGame(), n = g.data.items.bagSize + Object.keys(g.data.items.slots).length;
  for (const [w, h, s] of [[1280, 720, 1], [844, 390, 0.6]]) {
    const B = bagLayout(w, h, s), L = craftLayout(B, n), rows = Math.ceil(n / 5);
    assert.ok(L.grid.y + rows * L.grid.cell <= B.y + B.h, `${w}x${h} ช่องของล้นกรอบ`);
    for (const c of L.cur) assert.ok(c.x + c.w <= B.x + B.w && c.y + c.h <= B.y + B.h, `${w}x${h} ช่องศิลาล้นกรอบ`);
  }
});

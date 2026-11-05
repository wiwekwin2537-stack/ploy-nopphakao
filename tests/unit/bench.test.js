// โต๊ะช่างแบบ PoE: ทุกเมืองมีโต๊ะ · คราฟต์ได้ 1 ค่าต่อชิ้น · จ่ายเบี้ย/ศิลาตรงราคา · สูตรปลดตามบอส · ยูนีคไม่ได้ · ลบแล้วคราฟต์ใหม่ได้ · ค่ามีผลจริง · เซฟติด
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGame } from './helpers.js';
import { giveStarterGear } from '../../src/systems/player.js';
import { playerStats } from '../../src/systems/stats.js';
import { serialize, validate } from '../../src/systems/save.js';
import { enterZone } from '../../src/systems/travel.js';
import { craftBench, craftBlock, removeCraft, recipeOf, nearBench } from '../../src/systems/bench.js';
import { makeUnique } from '../../src/systems/uniques.js';

test('ข้อมูลโต๊ะช่างครบ: ค่าแสดงผลได้ · ช่องของมีจริง · ศิลามีจริง · ธงปลดมาจากบอสจริง · ทุกเมืองของบทมีโต๊ะช่างที่เดินถึง', () => {
  const g = makeGame(), I = g.data.items, P = g.data.passives, M = g.data.monsters;
  for (const r of I.bench.recipes) {
    assert.ok(P.statNames[r.stat], r.id); for (const sl of r.slots) assert.ok(I.slots[sl], r.id + sl);
    for (const k of Object.keys(r.cost.currency || {})) assert.ok(I.currency[k], k);
    if (r.unlock) assert.ok(M[r.unlock.replace(/Slain$/, '')].boss, r.unlock);
  }
  g.flags.tutorialDone = true;
  for (const a of g.data.quests.acts) {
    enterZone(g, a.town);
    const b = g.world.zone.objects.find((o) => o.type === 'craft_bench');
    assert.ok(b, a.town + ' ต้องมีโต๊ะช่าง');
    g.player.x = b.x + b.w / 2; g.player.y = b.y + b.h + 20;
    assert.ok(nearBench(g) && !g.world.blocked(g.player.x, g.player.y, g.player.radius), a.town + ' ยืนหน้าโต๊ะได้');
  }
});

test('คราฟต์: ราคาตรง · 1 ค่าต่อชิ้น · สูตรยังไม่ปลด/ของไม่ตรงชนิด/ยูนีค/เงินไม่พอ = ไม่ได้และไม่เสียอะไร · ลบแล้วคราฟต์ใหม่ได้ · ค่ามีผล · เซฟติด · เซฟปลอมถูกปฏิเสธ', () => {
  const g = makeGame(), I = g.data.items, p = g.player; g.world.load('town');
  giveStarterGear(p, g.data, 'warrior'); p.level = 30; p.coins = 1000; p.currency.fusing = 1;
  const body = p.equip.body, wpn = p.equip.weapon, hp0 = playerStats(p, g.data).maxHp;
  assert.ok(craftBench(g, body, 'b_life'));
  assert.equal(p.coins, 800); assert.equal(body.craft, 'b_life');
  assert.equal(playerStats(p, g.data).maxHp, hp0 + 25, 'เลือด +25 มีผลจริง');
  assert.equal(craftBench(g, body, 'b_mana'), false, 'ชิ้นละค่าเดียว');
  assert.equal(craftBench(g, wpn, 'b_life'), false, 'อาวุธใส่สูตรเลือดไม่ได้');
  assert.match(craftBlock(g, wpn, recipeOf(I, 'b_crit')), /ยังไม่ปลด/);
  g.flags.khotchasi_kingSlain = true;
  assert.ok(craftBench(g, wpn, 'b_crit')); assert.equal(p.coins, 300); assert.equal(p.currency.fusing, 0, 'ใช้ด้ายสายสิญจน์ 1');
  const coins = p.coins; assert.equal(craftBench(g, p.equip.head, 'b_mana'), true); assert.equal(p.coins, coins - 200);
  p.coins = 10; assert.equal(removeCraft(g, body), false, 'เบี้ยไม่พอลบ'); assert.equal(body.craft, 'b_life');
  p.coins = 1000; assert.ok(removeCraft(g, body)); assert.equal(body.craft, undefined); assert.equal(p.coins, 950);
  assert.ok(craftBench(g, body, 'b_mana'));
  const u = makeUnique(I, g.rng, 'wat_glaive', 10); assert.match(craftBlock(g, u, recipeOf(I, 'b_melee')), /ยูนีค/);
  const d = validate(JSON.parse(JSON.stringify(serialize(g))), g.data);
  assert.equal(d.equip.weapon.craft, 'b_crit'); assert.equal(d.equip.body.craft, 'b_mana');
  const bad = JSON.parse(JSON.stringify(serialize(g))); bad.equip.weapon.craft = 'b_life';
  assert.equal(validate(bad, g.data), null, 'สูตรผิดชนิดของในเซฟ');
});

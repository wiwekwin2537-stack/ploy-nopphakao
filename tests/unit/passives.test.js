import test from 'node:test';
import { giveStarterGear } from '../../src/systems/player.js';
import assert from 'node:assert/strict';
import { makeGame } from './helpers.js';
import { allocate, refund, pointsLeft, canAllocate, validTree, connected } from '../../src/systems/passives.js';
import { playerStats } from '../../src/systems/stats.js';
import { serialize, validate } from '../../src/systems/save.js';

test('ต้นพาสซีฟ: ทุกโหนดเชื่อมถึงกันได้ และลิงก์สองทาง', () => {
  const P = makeGame().data.passives;
  const ids = Object.keys(P.nodes);
  for (const id of ids) for (const l of P.nodes[id].links) assert.ok(P.nodes[l].links.includes(id), `${id}↔${l}`);
  assert.ok(connected(P, ['warrior', ...ids.filter((i) => P.nodes[i].kind !== 'start')], null), 'ต้องเดินถึงทุกโหนดจากนักรบ');
});

test('เลือกสายฟรี ใช้แต้มได้เฉพาะโหนดติดกัน และไม่เกินแต้มที่มี', () => {
  const g = makeGame(), P = g.data.passives, p = g.player;
  p.level = 3;                                            // 2 แต้ม
  assert.equal(allocate(p, P, 'warrior_a0'), false, 'ยังไม่เลือกสาย');
  assert.ok(allocate(p, P, 'warrior'));
  assert.equal(allocate(p, P, 'ranger'), false, 'เลือกได้สายเดียว');
  assert.equal(allocate(p, P, 'warrior_a1'), false, 'ต้องต่อกัน');
  assert.ok(allocate(p, P, 'warrior_a0')); assert.ok(allocate(p, P, 'warrior_a1'));
  assert.equal(pointsLeft(p, P), 0);
  assert.equal(canAllocate(p, P, 'warrior_a2'), false, 'แต้มหมด');
});

test('คืนแต้ม: คืนโหนดกลางทางไม่ได้ถ้ามีโหนดต่อจากมัน', () => {
  const g = makeGame(), P = g.data.passives, p = g.player;
  p.level = 5; p.cls = 'shaman';
  assert.equal(allocate(p, P, 'warrior'), false, 'เลือกจุดเริ่มของอาชีพอื่นไม่ได้');
  ['shaman', 'shaman_a0', 'shaman_a1', 'shaman_a2'].forEach((id) => assert.ok(allocate(p, P, id)));
  p.currency = { regret: 0 };
  assert.equal(refund(p, P, 'shaman_a2'), false, 'ไม่มีใบลานล้างกรรม = ถอนไม่ได้ (แบบ PoE)');
  assert.equal(p.passives.length, 4);
  p.currency.regret = 5;
  assert.equal(refund(p, P, 'shaman_a1'), false);
  assert.ok(refund(p, P, 'shaman_a2')); assert.ok(refund(p, P, 'shaman_a1'));
  assert.ok(refund(p, P, 'shaman_a0'));
  assert.equal(refund(p, P, 'shaman'), false, 'จุดเริ่ม (อาชีพ) คืนไม่ได้ (แบบ PoE)');
  assert.deepEqual(p.passives, ['shaman']);
  assert.equal(p.currency.regret, 2, 'ใช้ใบละ 1 โหนด');
});

test('ค่าสถานะ: เพิ่ม% บวกรวม และคีย์สโตนคูณ', () => {
  const g = makeGame(), P = g.data.passives, p = g.player;
  p.level = 10;
  const base = playerStats(p, g.data);
  ['warrior', 'warrior_a0', 'warrior_a1'].forEach((id) => allocate(p, P, id));   // ดาบ +8% +14 เลือด
  const s1 = playerStats(p, g.data);
  assert.ok(Math.abs(s1.damage - base.damage * 1.08) < 1e-6);
  assert.equal(s1.maxHp, base.maxHp + 14);
  p.passives = ['warrior', 'warrior_k0', 'warrior_k1', 'warrior_K'];
  const s2 = playerStats(p, g.data);
  assert.ok(Math.abs(s2.damage - base.damage * 1.08 * 1.5) < 1e-6, 'จิตคชสาร ×1.5 หลังบวก%');
  assert.ok(s2.spellDamage < base.spellDamage, 'ดาเมจพลอยต้องลด');
});

test('มนต์เลือดแลก: สกิลกินเลือดแทนมานา', async () => {
  const { castSkill } = await import('../../src/systems/skills.js');
  const g = makeGame(); g.world.load('field');
  const p = g.player; p.level = 10; p.passives = ['shaman', 'shaman_k0', 'shaman_k1', 'shaman_K']; giveStarterGear(p, g.data); p.equip.weapon.gems[0] = 'ruby';
  p.hp = 100; p.mp = 0;
  assert.ok(castSkill(g, 0));
  assert.ok(p.hp < 100 && p.mp === 0);
});

test('เซฟต้นพาสซีฟ: โหลดกลับได้ และต้นปลอม/เกินแต้มถูกปฏิเสธ', () => {
  const g = makeGame(); g.world.load('town');
  const p = g.player; p.level = 3; p.passives = ['ranger', 'ranger_a0', 'ranger_a1'];
  const s = validate(JSON.parse(JSON.stringify(serialize(g))), g.data);
  assert.deepEqual(s.passives, ['ranger', 'ranger_a0', 'ranger_a1']);
  const good = serialize(g);
  for (const bad of [['ranger', 'ranger_a1'], ['ranger', 'warrior'], ['ranger', 'ranger_a0', 'ranger_a1', 'ranger_a2'], ['nope']]) {
    assert.equal(validate({ ...good, passives: bad }, g.data), null, JSON.stringify(bad));
  }
  assert.equal(validTree(g.data.passives, [], 1), true);
});

test('วงนอก: โน้ตเด่นวงนอกทุกอันเดินถึงได้จากจุดเริ่มของสายตัวเอง และต้นใหม่ยังโหลดเซฟเก่าได้', () => {
  const P = makeGame().data.passives;
  for (const cid of ['warrior', 'ranger', 'shaman']) for (const tag of ['a', 'b']) {
    const goal = `${cid}_${tag}ON`, seen = new Set([cid]), q = [cid];
    while (q.length) { const n = q.shift(); for (const l of P.nodes[n].links) if (!seen.has(l)) { seen.add(l); q.push(l); } }
    assert.ok(seen.has(goal), goal);
  }
  assert.ok(Object.keys(P.nodes).length >= 79);
});

test('อาชีพผสม (นักดาบ/นักฆ่าเงา/พระธุดงค์) เริ่มกลางทางผสม เดินเข้าได้ทั้งสองสาย', () => {
  const g = makeGame(), P = g.data.passives;
  for (const [cid, a, b] of [['duelist', 'warrior', 'ranger'], ['shadow', 'ranger', 'shaman'], ['templar', 'shaman', 'warrior']]) {
    const C = P.classes[cid];
    assert.ok(C && g.data.items.bases[C.weapon] && g.data.gems.main[C.gem] && C.look && C.story, cid + ' ข้อมูลครบ');
    const p = g.player; p.level = 20; p.cls = cid; p.passives = [];
    assert.equal(allocate(p, P, a), false, 'เลือกจุดเริ่มสายอื่นไม่ได้');
    assert.ok(allocate(p, P, cid));
    const mid = `hyb_${a}_${b}1`;
    assert.ok(allocate(p, P, mid), cid + ' ต่อโน้ตเด่นกลางทางผสม');
    const side = (x) => [`hyb_${a}_${b}0`, `hyb_${a}_${b}2`].find((h) => P.nodes[h].links.some((l) => l.startsWith(x + '_')));
    for (const x of [a, b]) {
      const h = side(x); assert.ok(h && allocate(p, P, h), cid + ' เดินถึงขอบสาย ' + x);
      const into = P.nodes[h].links.find((l) => l.startsWith(x + '_')); assert.ok(allocate(p, P, into), cid + ' เข้าสาย ' + x);
    }
  }
});

test('ไอคอนโหนด: ทุกค่าที่ต้นพาสซีฟและเลื่อนขั้นใช้ มีไอคอนเฉพาะ (ไม่ตกไปใช้ดาวสำรอง)', async () => {
  const src = (await import('node:fs')).readFileSync(new URL('../../src/ui/treeart.js', import.meta.url), 'utf8');
  const g = makeGame(), keys = new Set([...Object.values(g.data.passives.nodes), ...Object.values(g.data.ascendancy.list).flatMap((a) => a.nodes)].flatMap((n) => Object.keys(n.stats)).filter((k) => k !== 'ks'));
  for (const k of keys) assert.ok(new RegExp('\\b' + k + ": '").test(src), `ค่า ${k} ไม่มีไอคอน`);
});

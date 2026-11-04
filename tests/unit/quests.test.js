import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGame } from './helpers.js';
import { questTracker, currentAct, readyQuestFor, claimQuest, questState } from '../../src/systems/quests.js';
import { enterZone } from '../../src/systems/travel.js';
import { talkTo } from '../../src/systems/npc.js';
import { pointsLeft } from '../../src/systems/passives.js';
import { serialize, validate } from '../../src/systems/save.js';

test('บทแบบ PoE: ข้อมูลครบ — เมือง/โซนมีจริง ผู้ให้รางวัลอยู่ในเมืองของบท บทพูดมีจริง พลอยรางวัลมีจริง ธงมาจากบอส/มอนชื่อเฉพาะจริง', () => {
  const g = makeGame(), Q = g.data.quests, Z = g.data.zones, G = g.data.gems, M = g.data.monsters.types || g.data.monsters;
  const named = new Set(Object.values(Z).flatMap((z) => (z.spawns || []).filter((s) => s.named).map((s) => s.named.flag)));
  for (const a of Q.acts) { if (a.town) assert.ok(Z[a.town], a.town); for (const z of a.zones) assert.ok(z === 'map' || Z[z], z); }
  for (const q of Q.list) {
    const a = Q.acts.find((x) => x.n === q.act), town = Z[a.town];
    const giver = Object.values(Z).flatMap((z) => z.npcs || []).find((n) => n.id === q.giver);
    assert.ok(giver && giver.name === q.giverName, q.id + ' ผู้ให้รางวัล');
    assert.ok(town.npcs.some((n) => n.id === q.giver), q.id + ' ผู้ให้รางวัลอยู่ในเมืองของบท');
    assert.ok(Array.isArray(g.data.dialogue[q.talk]), q.id + ' บทพูด');
    if (q.reward.gems) { assert.equal(q.reward.gems.length, 3); for (const id of q.reward.gems) assert.ok(G.main[id] || G.support[id], id); }
    else assert.ok(q.reward.passive >= 1);
    const boss = q.done.endsWith('Slain') && M[q.done.replace(/Slain$/, '')];
    assert.ok((boss && boss.boss) || named.has(q.done), q.id + ' ธง ' + q.done);
  }
  for (const n of Object.values(Z).flatMap((z) => z.npcs || [])) assert.ok(g.data.dialogue[n.id], 'บทพูดของ ' + n.id);
});

test('บท: บทนำไม่แสดง → บท 1 → ล้มยักษ์ = รับรางวัลค้าง + เลื่อนเป็นบท 2 → จบทุกบท = ถ้ำลายแทง', () => {
  const g = makeGame(); g.world.load('town');
  g.flags.tutorialDone = false; assert.deepEqual(questTracker(g), []);
  g.flags.tutorialDone = true;
  assert.equal(currentAct(g).n, 1);
  assert.deepEqual(questTracker(g).map((e) => e.q.id), ['q1_main', 'q1_side']);
  g.flags.yakSlain = true;
  assert.equal(currentAct(g).n, 2);
  const t = questTracker(g);
  assert.equal(t[0].kind, 'ready'); assert.ok(t[0].text.includes('พ่อเฒ่าจันทร์') && t[0].text.includes('เวียงด่านหิน'));
  Object.assign(g.flags, { khotchasi_kingSlain: true, garuda_kingSlain: true, vessavanaSlain: true });
  for (const q of g.data.quests.list) g.flags['q_' + q.id] = true;
  assert.equal(questTracker(g)[0].title, g.data.quests.endgame.title);
});

test('เควสรอง: มอนชื่อเฉพาะเกิดเป็นตัวหายาก → ล้มแล้วตั้งธง ไม่เกิดอีก → คุยกับยายแม้นได้แต้มพาสซีฟ (เซฟติด)', () => {
  const g = makeGame(); g.flags.tutorialDone = true; g.player.level = 5;
  enterZone(g, 'field');
  const m = g.mobs.find((x) => x.named);
  assert.ok(m && m.elite === 'rare' && m.named.flag === 'q1_side_kill', 'มีกระสือนางเรือนทอง');
  m.hp = 1; g.events.emit('mobKilled', { mob: m }); m.dead = true;
  assert.equal(g.flags.q1_side_kill, true);
  enterZone(g, 'field'); assert.ok(!g.mobs.some((x) => x.named), 'ล้มแล้วไม่เกิดอีก');
  const before = pointsLeft(g.player, g.data.passives);
  enterZone(g, 'town');
  const maen = g.world.zone.npcs.find((n) => n.id === 'maen');
  assert.ok(readyQuestFor(g, 'maen'));
  talkTo(g, maen); assert.deepEqual(g.dialog.lines, g.data.dialogue.maen_reward); g.dialog.onDone();
  assert.equal(pointsLeft(g.player, g.data.passives), before + 1);
  assert.equal(questState(g, g.data.quests.list.find((q) => q.id === 'q1_side')), 'claimed');
  assert.equal(claimQuest(g, g.data.quests.list.find((q) => q.id === 'q1_side')), false, 'รับซ้ำไม่ได้');
  const d = validate(JSON.parse(JSON.stringify(serialize(g))), g.data);
  assert.equal(d.questPoints, 1);
  const old = { ...JSON.parse(JSON.stringify(serialize(g))), v: 11 }; delete old.questPoints; old.flags = { heardHimmapan: true, yakSlain: true };
  const mig = validate(old, g.data);
  assert.equal(mig.questPoints, 0); assert.equal(mig.flags.q_q1_main, true, 'เซฟเก่าที่ฟังเรื่องแล้วไม่ได้รับซ้ำ');
});

test('แม่ค้าในเมืองบทใหม่เปิดร้าน · เมืองบทใหม่ปลอดภัย มีศาลวาร์ป หีบเก็บของ ทางเข้าออกครบ', () => {
  const g = makeGame(); g.flags.tutorialDone = true;
  for (const id of ['camp_hunter', 'hermitage', 'sky_sala']) {
    enterZone(g, id);
    const z = g.world.zone;
    assert.equal(g.mobs.length, 0, id + ' ไม่มีมอน');
    for (const t of ['waypoint', 'stash', 'stall']) assert.ok(z.objects.some((o) => o.type === t), id + ' ' + t);
    const shop = z.npcs.find((n) => n.shop); talkTo(g, shop); g.dialog.onDone(); assert.equal(g.mode, 'shop'); g.mode = 'play';
    for (const e of z.exits) assert.ok(g.data.zones[e.to].exits.some((b) => b.to === id), `${id} ↔ ${e.to}`);
  }
});

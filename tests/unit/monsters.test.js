import test from 'node:test';
import assert from 'node:assert/strict';

test('มอนบิน (กระสือ) ในด่านที่มีกำแพง: ไล่ตามแล้วไม่บินเข้ากำแพง/ที่มืด — ตีถึงได้เสมอ', async () => {
  const { makeGame } = await import('./helpers.js');
  const { makeMob, updateMonsters } = await import('../../src/systems/monsters.js');
  const { enterZone } = await import('../../src/systems/travel.js');
  const g = makeGame(); g.flags.tutorialDone = true;
  enterZone(g, 'dungeon2'); g.mobs.length = 0;
  const p = g.player; p.invuln = 1e9;
  const m = makeMob(g, 'krasue', 6, p.x - 60, p.y, -1); m.aggroed = true; g.mobs.push(m);
  const Z = g.world.zone;
  let tried = 0;
  for (let k = 0; k < 400 && tried < 25; k++) {                   // ยืนริมทางเดินหลายจุด (ข้างๆ เป็นกำแพง/ที่มืด) ปล่อยกระสือวนรอบตัว
    const x = 40 + ((k * 97) % (Z.W - 80)), y = 40 + ((k * 61) % (Z.H - 80));
    if (g.world.blocked(x, y, 14) || !g.world.blocked(x, y + 70, 2)) continue;
    tried++; p.x = x; p.y = y; m.x = x + 30; m.y = y - 10; m.hp = m.maxHp; m.dead = false;
    for (let i = 0; i < 150; i++) updateMonsters(g, 1 / 30);
    assert.ok(!g.world.blocked(m.x, m.y, 2), `กระสืออยู่ในกำแพงที่ ${Math.round(m.x)},${Math.round(m.y)}`);
  }
  assert.ok(tried >= 5);
});

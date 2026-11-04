import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGame } from './helpers.js';
import { giveStarterGear } from '../../src/systems/player.js';
import { enterZone } from '../../src/systems/travel.js';
import { updateTutorial } from '../../src/systems/tutorial.js';
import { updateDialog, talkTo } from '../../src/systems/npc.js';
import { damageMob } from '../../src/systems/combat.js';
import { updateLoot } from '../../src/systems/loot.js';
import { castSkill } from '../../src/systems/skills.js';
import { ownsGem } from '../../src/systems/gems.js';

function closeDialog(g) {
  for (let i = 0; i < 30 && g.dialog; i++) { g.input.pressed.interact = true; updateDialog(g, 1); g.input.pressed.interact = false; }
}

test('บทนำเล่นได้ครบทุกขั้นตั้งแต่ทางเกวียนถึงพ่อเฒ่าจันทร์', () => {
  const g = makeGame(); giveStarterGear(g.player, g.data);
  enterZone(g, 'road');
  assert.equal(g.mode, 'dialog'); closeDialog(g);
  assert.equal(g.flags.tutStep, 'move');
  g.player.movedDist = 100; updateTutorial(g, 0.1);
  assert.equal(g.flags.tutStep, 'attack');
  const piglets = g.mobs.filter((m) => m.tutorial);
  assert.equal(piglets.length, 2);
  piglets.forEach((m) => damageMob(g, m, 999));
  updateTutorial(g, 1);
  assert.equal(g.flags.tutStep, 'dash');
  const boar = g.mobs.find((m) => m.type === 'bigboar' && !m.dead);
  assert.ok(boar, 'ต้องมีพญาหมูป่า');
  damageMob(g, boar, 999);
  assert.equal(g.flags.tutStep, 'gem');
  const gem = g.drops.find((d) => d.gem === 'ruby');
  assert.ok(gem, 'ต้องดรอปทับทิม');
  g.player.x = gem.x; g.player.y = gem.y; gem.t = 1;
  updateLoot(g, 0.1);
  assert.ok(ownsGem(g.player, 'ruby'));
  assert.equal(g.player.equip.weapon.gems[0], 'ruby', 'ทับทิมต้องฝังช่องอาวุธให้เลย');
  assert.equal(g.world.blocked(42.5 * 32, 10 * 32, 10), false, 'ท่อนไม้ต้องหาย');
  closeDialog(g);
  assert.equal(g.flags.tutStep, 'skill');
  g.player.mp = 100; assert.ok(castSkill(g, 0));
  assert.equal(g.flags.tutStep, 'go');
  enterZone(g, 'town', 20.5 * 32, 31.8 * 32);
  assert.equal(g.flags.tutStep, 'chan');
  talkTo(g, g.world.zone.npcs.find((n) => n.id === 'chan'));
  closeDialog(g);
  assert.equal(g.flags.tutStep, 'done');
  assert.equal(g.flags.tutorialDone, true);
});

test('ทับทิมดรอปแค่เม็ดเดียว แม้พญาหมูป่าตายซ้ำ', () => {
  const g = makeGame();
  enterZone(g, 'road'); closeDialog(g);
  g.flags.tutStep = 'dash';
  enterZone(g, 'road');
  enterZone(g, 'road');
  const boars = g.mobs.filter((m) => m.type === 'bigboar');
  assert.equal(boars.length, 1, 'โหลดซ้ำต้องไม่เกิดพญาหมูป่าซ้ำ');
  damageMob(g, boars[0], 999); damageMob(g, boars[0], 999);
  assert.equal(g.drops.filter((d) => d.gem === 'ruby').length, 1);
});

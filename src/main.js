// จุดเริ่มเกม: ประกอบทุกระบบเข้าด้วยกัน (ไม่มีกติกาเกมในไฟล์นี้)
import { skillsOf } from './systems/gems.js';
import { playerStats } from './systems/stats.js';
import balance from '../data/balance.json' with { type: 'json' };
import monsters from '../data/monsters.json' with { type: 'json' };
import zones from '../data/zones.json' with { type: 'json' };
import dialogue from '../data/dialogue.json' with { type: 'json' };
import gems from '../data/gems.json' with { type: 'json' };
import passives from '../data/passives.json' with { type: 'json' };
import items from '../data/items.json' with { type: 'json' };
import shop from '../data/shop.json' with { type: 'json' };
import quests from '../data/quests.json' with { type: 'json' };
import { createEvents } from './core/events.js';
import { createLoop } from './core/loop.js';
import { createInput } from './core/input.js';
import { createCamera } from './core/camera.js';
import { createAudio } from './core/audio.js';
import { createRng } from './core/rng.js';
import { createWorld } from './systems/world.js';
import { createPlayer, updatePlayer, giveStarterGear } from './systems/player.js';
import { updateMonsters, makeMob, rollElite } from './systems/monsters.js';
import { updateHazards } from './systems/boss.js';
import { updateShots, damageMob } from './systems/combat.js';
import { setupLoot, updateLoot, spawnDrop } from './systems/loot.js';
import { setupProgress } from './systems/progress.js';
import { updateSkillTimers } from './systems/skills.js';
import { updateNpcs, updateDialog } from './systems/npc.js';
import { setupAutosave, updateAutosave, readSave, writeSave, clearSave } from './systems/save.js';
import { setupTutorial, updateTutorial, skipTutorial } from './systems/tutorial.js';
import { enterZone, updateTravel, setupDeath, respawn } from './systems/travel.js';
import { createFx } from './art/fx.js';
import { computeLayout } from './ui/layout.js';
import { createScene } from './ui/scene.js';
import { drawHud, drawDialog, drawDeath, drawTitle, titleButtons } from './ui/hud.js';
import { drawBag, updateBag, profileHit, bagLayout } from './ui/bag.js';
import { drawTree, updateTree, openTree } from './ui/tree.js';
import { drawShop, updateShop, shopLayout } from './ui/shop.js';
import { gemLayout } from './ui/gemtab.js';
import { drawWarp, updateWarp } from './ui/warp.js';
import { updateWaypoints } from './systems/waypoint.js';
import { updateAltar } from './systems/maps.js';
import { drawMapMenu, updateMapMenu } from './ui/mapmenu.js';
import { drawStash, updateStash, stashLayout } from './ui/stash.js';
import { drawHuman } from './art/characters.js';
import { heroLook, heroGear } from './ui/herolook.js';
import { itemSprite } from './art/items.js';
import { updateStashSpot } from './systems/stash.js';
import { updatePotion, setupFlasks } from './systems/shop.js';
import { setupUniques, makeUnique } from './systems/uniques.js';

// สองชั้น: โลกวาดความละเอียดต่ำแล้วขยายแบบพิกเซล (สไตล์เอโดเรีย) · หน้าจอซ้อน/ตัวหนังสือวาดคมเต็มความละเอียด
const PIXEL = 0.62;
const worldCanvas = document.getElementById('game');
const wctx = worldCanvas.getContext('2d');
const canvas = document.getElementById('hud');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(location.search);
let layoutKey = '';
let layout = computeLayout(canvas.clientWidth || innerWidth, canvas.clientHeight || innerHeight);

const game = {
  data: { balance, monsters, zones, dialogue, gems, passives, items, shop, quests },
  events: createEvents(), camera: createCamera(), audio: createAudio(), fx: createFx(), rng: createRng(Date.now() & 0xffff),
  flags: {}, mobs: [], shots: [], drops: [], hazards: [], later: [], spawnTimers: [],
  mode: 'title', dialog: null, time: 0, hitStop: 0, toast: null, debug: params.has('debug'),
};
game.world = createWorld(zones, (f) => !!game.flags[f], (type) => game.mobs.some((m) => m.type === type && !m.dead));
game.input = createInput(canvas, () => layout);
game.player = createPlayer(game.data);
game.hasSave = !!readSave(game.data);
setupLoot(game); setupFlasks(game); setupUniques(game); setupProgress(game); setupAutosave(game); setupTutorial(game); setupDeath(game);
game.world.load('road');
const scene = createScene(game);

function startNew(skip) {
  clearSave();
  game.flags = {};
  game.player = createPlayer(game.data);
  giveStarterGear(game.player, game.data);
  if (skip) { skipTutorial(game); enterZone(game, 'town', 20.5 * 32, 17.5 * 32); } else enterZone(game, 'road');
  game.mode = game.dialog ? 'dialog' : 'play';
  writeSave(game);
}
function continueGame() {
  const s = readSave(game.data);
  if (!s) return startNew(false);
  const p = game.player = createPlayer(game.data);
  Object.assign(p, { level: s.level, xp: s.xp, coins: s.coins, bag: s.bag.slice(), currency: { ...p.currency, ...s.currency }, passives: s.passives.slice(), gemXp: { ...s.gemXp }, items: s.items, stash: s.stash || [], equip: { ...p.equip, ...s.equip }, nextUid: s.nextUid, potions: s.potions, mpPotions: s.mpPotions, hp: s.hp, mp: s.mp });
  game.flags = { ...s.flags };
  game.mode = 'play';
  enterZone(game, s.zone, s.x, s.y);
  if (game.world.blocked(p.x, p.y, p.radius)) { p.x = game.world.zone.start.x; p.y = game.world.zone.start.y; }
  if (game.dialog) game.mode = 'dialog';
}

function hitCircle(t, c) { return (t.sx - c.x) ** 2 + (t.sy - c.y) ** 2 <= (c.r * 1.3) ** 2; }

function update(dt) {
  game.time += dt;
  const input = game.input;
  input.beginFrame();
  const lk = input.mode === 'touch' ? 't' : 'k';          // สลับจอสัมผัส ↔ คีย์บอร์ด: จัดปุ่มใหม่
  if (lk !== layoutKey) { layoutKey = lk; layout = computeLayout(game.camera.viewW || innerWidth, game.camera.viewH || innerHeight, lk === 't'); }
  layout.near = !!(game.nearNpc || game.nearWaypoint || game.nearAltar || game.nearStash);
  input.setUiMode(game.mode !== 'play');                   // หน้าต่าง/บทพูด/หน้าแรก: แตะ = กดปุ่ม ไม่ใช่จอยเดิน
  game.audio.update();
  if (game.toast) game.toast.t -= dt;
  if (game.notice) game.notice.t -= dt;
  // ปุ่มเสียงกดได้ทุกหน้า
  for (const t of input.taps) if (!t.consumed && hitCircle(t, layout.mute)) { t.consumed = true; game.audio.unlock(); game.audio.toggleMute(); }

  if (game.mode === 'title') {
    for (const t of input.taps) {
      if (t.consumed) continue;
      game.audio.unlock();
      const b = titleButtons(game, game.camera.viewW, game.camera.viewH, layout.s).find((q) => t.sx >= q.x && t.sx <= q.x + q.w && t.sy >= q.y && t.sy <= q.y + q.h);
      if (!b) continue;
      game.audio.play('click');
      if (b.id === 'continue') continueGame();
      else if (b.id === 'skip') startNew(true);
      else if (b.id === 'new') { if (game.hasSave && !game.confirmNew) game.confirmNew = true; else startNew(false); }
    }
    if (input.pressed.interact || input.pressed.attack) { game.audio.unlock(); game.hasSave ? continueGame() : startNew(false); }
    game.audio.music('town');
  } else if (game.mode === 'dialog') {
    updateDialog(game, dt);
  } else if (game.mode === 'dead') {
    game.deadT += dt;
    if (game.deadT > 1.2 && (input.taps.length || input.pressed.attack || input.pressed.interact || input.pressed.dash)) { respawn(game); writeSave(game); }
  } else if (game.mode === 'tree') {
    const r = updateTree(game, layout, game.camera.viewW, game.camera.viewH);
    if (r) { game.mode = r === 'back' ? 'bag' : 'play'; input.setUiMode(false); writeSave(game); }
  } else if (game.mode === 'play' && input.pressed.tree) {
    game.mode = 'tree'; openTree(game); game.audio.play('click');
  } else if (game.mode === 'stash') {
    if (updateStash(game, layout, game.camera.viewW, game.camera.viewH)) { game.mode = 'play'; writeSave(game); }
  } else if (game.mode === 'mapmenu') {
    if (updateMapMenu(game, layout, game.camera.viewW, game.camera.viewH)) game.mode = 'play';
  } else if (game.mode === 'warp') {
    if (updateWarp(game, layout, game.camera.viewW, game.camera.viewH)) game.mode = 'play';
  } else if (game.mode === 'shop') {
    if (updateShop(game, layout, game.camera.viewW, game.camera.viewH)) { game.mode = 'play'; writeSave(game); }
  } else if (game.mode === 'bag') {
    const r = updateBag(game, layout, game.camera.viewW, game.camera.viewH);
    if (r === 'tree') { game.mode = 'tree'; openTree(game); }
    else if (r) { game.mode = 'play'; game.bagSel = null; writeSave(game); }
  } else if (game.mode === 'play' && (input.pressed.bag || input.taps.some((t) => !t.consumed && profileHit(layout, t)))) {
    const byTap = input.taps.some((t) => !t.consumed && profileHit(layout, t));
    input.taps.forEach((t) => { if (profileHit(layout, t)) t.consumed = true; });
    if (byTap) game.bagTab = 'stats';                       // แตะรูปตัวละคร = หน้าตัวละคร · ปุ่ม B = แถบล่าสุด
    game.mode = 'bag'; game.bagGroup = game.bagGroup || 0; game.audio.play('click');
  } else if (game.mode === 'play' && game.hitStop > 0) {
    game.hitStop -= dt;                     // หยุดภาพแวบหนึ่งตอนดาบโดน ให้รู้สึกถึงแรงกระแทก
  } else if (game.mode === 'play') {
    updateNpcs(game);
    updateWaypoints(game);
    updateAltar(game);
    updateStashSpot(game);
    if (game.mode === 'play') {
      updatePotion(game, dt);
      updateSkillTimers(game, dt);
      updatePlayer(game, dt);
      updateMonsters(game, dt);
      updateHazards(game, dt);
      updateShots(game, dt);
      updateLoot(game, dt);
      updateTravel(game, dt);
    }
  }
  if (game.mode !== 'title') {
    if (game.mode === 'dead') updateMonsters(game, dt);
    updateTutorial(game, dt);
    updateAutosave(game, dt);
    const z = game.world.zone;
    game.camera.follow(game.player.x, game.player.y - 10, z.W, z.H, dt);
  }
  game.fx.update(dt);
  input.endFrame();
}

function render() {
  const dpr = Math.min(2, devicePixelRatio || 1), w = game.camera.viewW, h = game.camera.viewH;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (game.mode === 'title') {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawTitle(ctx, game, layout, w, h);
  } else {
    scene.draw(wctx, PIXEL);
    scene.drawOverlay(ctx, dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawHud(ctx, game, layout, w, h);
    if (game.mode === 'dialog') drawDialog(ctx, game, layout, w, h);
    if (game.mode === 'dead') drawDeath(ctx, game, layout, w, h);
    if (game.mode === 'bag') drawBag(ctx, game, layout, w, h);
    if (game.mode === 'tree') drawTree(ctx, game, layout, w, h);
    if (game.mode === 'shop') drawShop(ctx, game, layout, w, h);
    if (game.mode === 'warp') drawWarp(ctx, game, layout, w, h);
    if (game.mode === 'mapmenu') drawMapMenu(ctx, game, layout, w, h);
    if (game.mode === 'stash') drawStash(ctx, game, layout, w, h);
  }
}

function resize() {
  const dpr = Math.min(2, devicePixelRatio || 1);
  const r = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.round(r.width || innerWidth)), h = Math.max(1, Math.round(r.height || innerHeight));
  canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  worldCanvas.width = Math.max(1, Math.round(w * PIXEL)); worldCanvas.height = Math.max(1, Math.round(h * PIXEL));
  game.camera.resize(w, h);
  layout = computeLayout(w, h, game.input && game.input.mode === 'touch'); layoutKey = '';
}
addEventListener('resize', resize);
resize();
document.addEventListener('visibilitychange', () => { if (document.hidden && game.mode !== 'title') writeSave(game); });

const loop = createLoop(update, render);
game.loopStats = loop.stats;
loop.start();

// test-hook: เปิดเฉพาะเมื่อมี ?test ใน URL ใช้ในเทสต์อัตโนมัติเท่านั้น
if (params.has("test")) globalThis.__ploy = { game, loop, startNew, continueGame, enterZone, respawn, writeSave, readSave, makeMob, rollElite, makeUnique, spawnDrop, art: { drawHuman, heroLook, heroGear, itemSprite }, damage: damageMob, stashLayout: () => stashLayout(game.camera.viewW, game.camera.viewH, layout.s), shopLayout: () => shopLayout(game.camera.viewW, game.camera.viewH, layout.s), skills: () => skillsOf(game.data.gems, game.player, game.data.items), stats: () => playerStats(game.player, game.data), layout: () => layout, bagLayout: () => bagLayout(game.camera.viewW, game.camera.viewH, layout.s), gemLayout: () => gemLayout(bagLayout(game.camera.viewW, game.camera.viewH, layout.s), game.player) }; // test-hook

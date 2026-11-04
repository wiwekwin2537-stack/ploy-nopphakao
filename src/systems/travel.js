// เดินทางระหว่างพื้นที่ผ่านทางออกจริง และการตาย/ฟื้น
import { spawnZoneMobs } from './monsters.js';
import { playerStats } from './stats.js';

export function enterZone(game, id, x, y) {
  const z = game.world.load(id);
  const p = game.player;
  p.x = x ?? z.start.x; p.y = y ?? z.start.y;
  p.moveTarget = null; p.targetMob = null; p.dashT = 0;
  game.shots.length = 0; game.drops.length = 0; game.fx.clear();
  game.pendingTalk = null;
  spawnZoneMobs(game);
  game.camera.snap(p.x, p.y);
  game.travelLock = 0.6;
  game.toast = { text: z.name, t: 2.6 };
  if (id === 'town') game.flags.reachedTown = true;
  game.audio.music(z.music);
  game.events.emit('zoneChanged', { zone: id });
}

export function updateTravel(game, dt) {
  game.travelLock = Math.max(0, (game.travelLock || 0) - dt);
  if (game.travelLock > 0 || game.player.dead) return;
  const e = game.world.exitAt(game.player.x, game.player.y);
  if (e) enterZone(game, e.to, e.tx, e.ty);
}

export function setupDeath(game) {
  game.events.on('playerDied', () => {
    game.mode = 'dead';
    game.deadT = 0;
    game.audio.play('die');
    game.fx.burst(game.player.x, game.player.y - 12, '#a3262a', 20, 120, 0.8, 3);
  });
}

export function respawn(game) {
  const p = game.player, B = game.data.balance;
  const lost = Math.floor(p.coins * B.deathCoinLoss);
  p.coins -= lost;
  p.dead = false;
  const s = playerStats(p, game.data);
  p.hp = s.maxHp; p.mp = s.maxMp; p.invuln = 1.5;
  game.mode = 'play';
  if (game.flags.reachedTown) enterZone(game, 'town', 20.5 * 32, 17.5 * 32);
  else enterZone(game, 'road');
  if (lost > 0) game.fx.text(p.x, p.y - 40, 'เสียเบี้ย ' + lost, '#ff8a7a');
  return lost;
}

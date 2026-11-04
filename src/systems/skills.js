// ใช้สกิลจากชุดพลอย (กดปุ่มสกิล 1 = ชุดที่ 1, สกิล 2 = ชุดที่ 2)
import { spawnShot } from './combat.js';
import { playerStats } from './player.js';
import { computeSkill } from './gems.js';

export function skillOf(game, group) { return computeSkill(game.data.gems, game.player.sockets, group); }

function pickTarget(game, p) {
  if (p.targetMob && !p.targetMob.dead) return p.targetMob;
  let best = 1e9, target = null;
  for (const m of game.mobs) {
    if (m.dead) continue;
    const dx = m.x - p.x, dy = m.y - p.y, d = Math.hypot(dx, dy);
    if (d > 340) continue;
    let da = Math.abs(Math.atan2(dy, dx) - p.aim); if (da > Math.PI) da = Math.PI * 2 - da;
    const score = d * (1 + da * 0.6);
    if (score < best) { best = score; target = m; }
  }
  return target;
}

export function castSkill(game, group) {
  const p = game.player, sk = skillOf(game, group);
  if (!sk || p.skillCd[group] > 0 || p.dashT > 0) return false;
  if (p.mp < sk.mp) { if (!p._noMpWarn) { game.fx.text(p.x, p.y - 70, 'มานาไม่พอ', '#8fb8ff'); p._noMpWarn = 0.8; } return false; }
  const target = pickTarget(game, p);
  const sx = p.x, sy = p.y - 22;
  const ang = target ? Math.atan2(target.y - target.height * 0.4 - sy, target.x - sx) : p.aim;
  p.aim = ang;
  p.mp -= sk.mp; p.skillCd[group] = sk.cooldown; p.castT = 0.22; p.combatTimer = 4;
  const dmg = playerStats(p, game.data.balance).damage * sk.damageMult;
  const spread = 0.2;
  for (let i = 0; i < sk.count; i++) {
    const a = ang + (i - (sk.count - 1) / 2) * spread;
    spawnShot(game, {
      x: sx + Math.cos(a) * 10, y: sy + Math.sin(a) * 10, vx: Math.cos(a) * sk.speed, vy: Math.sin(a) * sk.speed,
      life: sk.life, radius: sk.radius, from: 'player', damage: dmg, kind: sk.kind, splash: sk.splash,
      pierce: sk.pierce, slow: sk.slow, slowTime: sk.slowTime, poison: sk.poison ? dmg * sk.poison : 0, poisonTime: sk.poisonTime,
    });
  }
  game.audio.play(sk.kind === 'ice' ? 'ice' : sk.kind === 'poison' ? 'poison' : 'cast');
  game.events.emit('skillCast', { group, gem: sk.gem });
  return true;
}

export function updateSkillTimers(game, dt) {
  const p = game.player;
  for (let i = 0; i < p.skillCd.length; i++) p.skillCd[i] = Math.max(0, p.skillCd[i] - dt);
  if (p._noMpWarn) p._noMpWarn = Math.max(0, p._noMpWarn - dt);
}

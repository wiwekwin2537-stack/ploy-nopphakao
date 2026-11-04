// สกิลจากพลอย — ขั้นที่ 1 มีทับทิม: ลูกไฟทับทิม
import { spawnShot } from './combat.js';
import { playerStats } from './player.js';

export const SKILLS = {
  fireball: { name: 'ลูกไฟทับทิม', gem: 'ruby', color: '#c9302c' },
};

export function hasSkill(p, id) { return p.gems.includes(SKILLS[id].gem); }

export function castFireball(game) {
  const p = game.player, S = game.data.balance.skills.fireball;
  if (!hasSkill(p, 'fireball') || p.skillCd > 0 || p.dashT > 0) return false;
  if (p.mp < S.mp) { if (!p._noMpWarn) { game.fx.text(p.x, p.y - 40, 'มานาไม่พอ', '#8fb8ff'); p._noMpWarn = 0.8; } return false; }
  // เล็งมอนที่ใกล้ที่สุดในระยะ เน้นตัวที่อยู่ทางที่หันอยู่
  let target = p.targetMob && !p.targetMob.dead ? p.targetMob : null;
  if (!target) {
    let best = 1e9;
    for (const m of game.mobs) {
      if (m.dead) continue;
      const dx = m.x - p.x, dy = m.y - p.y, d = Math.hypot(dx, dy);
      if (d > 340) continue;
      let da = Math.abs(Math.atan2(dy, dx) - p.aim); if (da > Math.PI) da = Math.PI * 2 - da;
      const score = d * (1 + da * 0.6);
      if (score < best) { best = score; target = m; }
    }
  }
  const sx = p.x, sy = p.y - 16;
  const ang = target ? Math.atan2(target.y - target.height * 0.4 - sy, target.x - sx) : p.aim;
  p.aim = ang;
  p.mp -= S.mp; p.skillCd = S.cooldown; p.castT = 0.22; p.combatTimer = 4;
  const dmg = playerStats(p, game.data.balance).damage * S.damageMult;
  spawnShot(game, { x: sx + Math.cos(ang) * 10, y: sy + Math.sin(ang) * 10, vx: Math.cos(ang) * S.speed, vy: Math.sin(ang) * S.speed, life: S.life, radius: 7, from: 'player', damage: dmg, kind: 'fireball', splash: S.radius });
  game.audio.play('cast');
  game.events.emit('skillCast', { id: 'fireball' });
  return true;
}

export function updateSkillTimers(game, dt) {
  const p = game.player;
  if (p._noMpWarn) p._noMpWarn = Math.max(0, p._noMpWarn - dt);
}

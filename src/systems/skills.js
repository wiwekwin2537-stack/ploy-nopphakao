// ใช้สกิลจากพลอยที่ฝังในของ (ปุ่มสกิล 1/2/3 = สกิลที่ 1/2/3 ตามลำดับ อาวุธ → เสื้อ)
import { spawnShot, rollDamage, damageMob } from './combat.js';
import { playerStats } from './stats.js';
import { skillsOf } from './gems.js';

export function skillOf(game, i) { return skillsOf(game.data.gems, game.player, game.data.items)[i] || null; }

export function pickTarget(game, p) {
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
  const st0 = playerStats(p, game.data);
  if (st0.bloodMagic ? p.hp <= sk.mp : p.mp < sk.mp) { if (!p._noMpWarn) { game.fx.text(p.x, p.y - 70, 'มานาไม่พอ', '#8fb8ff'); p._noMpWarn = 0.8; } return false; }
  const target = pickTarget(game, p);
  const sx = p.x, sy = p.y - 22;
  const ang = target ? Math.atan2(target.y - target.height * 0.4 - sy, target.x - sx) : p.aim;
  p.aim = ang;
  if (st0.bloodMagic) p.hp = Math.max(1, p.hp - sk.mp); else p.mp -= sk.mp;
  p.skillCd[group] = sk.cooldown * st0.castCdMult; p.castT = 0.22; p.combatTimer = 4;
  releaseSkill(game, sk, ang);
  game.events.emit('skillCast', { group, gem: sk.gem });
  return true;
}

// ปล่อยสกิลจริง (ไม่หักมานา/คูลดาวน์) — ใช้ทั้งกดปุ่มสกิลและสกิลทำงานเองจากของยูนีค
export function releaseSkill(game, sk, ang) {
  const p = game.player, sx = p.x, sy = p.y - 22;
  const st = playerStats(p, game.data);
  if (sk.melee) {                                                // สกิลฟัน (ใช้ดาเมจดาบ): วงรอบตัว / แนวตรง / พัดด้านหน้า — ขนาดขยายด้วยพลอยเสริมระเบิด + พาสซีฟ
    const R = sk.splash * st.areaMult, ca = Math.cos(ang), sa = Math.sin(ang);
    const hit = (m) => {
      const dx = m.x - p.x, dy = (m.y - p.y) * 1.2, d = Math.hypot(dx, dy);
      if (sk.shape === 'line') { const along = dx * ca + dy * sa, side = Math.abs(-dx * sa + dy * ca); return along > -10 && along < R + m.radius && side < sk.width / 2 + m.radius; }
      if (sk.shape === 'cone') { let da = Math.abs(Math.atan2(dy, dx) - ang); if (da > Math.PI) da = Math.PI * 2 - da; return d < R + m.radius && (da < sk.arc / 2 || d < m.radius + 14); }
      return d < R + m.radius;
    };
    for (const m of game.mobs) {
      if (m.dead || !hit(m)) continue;
      const r = rollDamage(st.damage * sk.damageMult, game.rng, st.crit, st.critMult);
      damageMob(game, m, r.amount, r.crit);
      if (sk.slow && !m.dead) { m.slowT = sk.slowTime; m.slowK = 1 - sk.slow; }
    }
    if (sk.shape === 'line') { for (let i = 1; i <= 6; i++) game.fx.burst(p.x + ca * R * i / 6, p.y - 14 + sa * R * i / 6, '#a8ffb0', 3, 60, 0.3, 2.5); game.fx.slash(p.x, p.y - 14, ang, R, 0.35, 1); }
    else if (sk.shape === 'cone') { game.fx.slash(p.x, p.y - 14, ang, R, sk.arc, 1); game.fx.slash(p.x, p.y - 14, ang, R * 0.7, sk.arc, -1); game.fx.burst(p.x + ca * R * 0.6, p.y - 14 + sa * R * 0.6, '#cfe8ff', 10, 90, 0.4, 3); }
    else { game.fx.ring(p.x, p.y - 10, R, '#ff6a5a'); game.fx.ring(p.x, p.y - 10, R * 0.7, '#ffd0a0'); for (let i = 0; i < 4; i++) game.fx.slash(p.x, p.y - 14, i * Math.PI / 2, R * 0.8, 1.6, 1); }
    game.camera.shake = Math.max(game.camera.shake, 3);
    game.audio.play('swing');
    return;
  }
  const dmg = st.spellDamage * sk.damageMult;
  const spread = 0.2;
  for (let i = 0; i < sk.count; i++) {
    const a = ang + (i - (sk.count - 1) / 2) * spread;
    spawnShot(game, {
      x: sx + Math.cos(a) * 10, y: sy + Math.sin(a) * 10, vx: Math.cos(a) * sk.speed * st.projSpeedMult, vy: Math.sin(a) * sk.speed * st.projSpeedMult, crit: st.crit, critMult: st.critMult,
      life: sk.life, radius: sk.radius, from: 'player', damage: dmg, kind: sk.kind, splash: sk.splash * st.areaMult,
      pierce: sk.pierce, slow: sk.slow, slowTime: sk.slowTime, poison: sk.poison ? dmg * sk.poison : 0, poisonTime: sk.poisonTime,
    });
  }
  game.audio.play(sk.kind === 'ice' ? 'ice' : sk.kind === 'poison' ? 'poison' : 'cast');
}

export function updateSkillTimers(game, dt) {
  const p = game.player;
  for (let i = 0; i < p.skillCd.length; i++) p.skillCd[i] = Math.max(0, p.skillCd[i] - dt);
  if (p._noMpWarn) p._noMpWarn = Math.max(0, p._noMpWarn - dt);
}

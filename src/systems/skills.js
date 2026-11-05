// ใช้สกิลจากพลอยที่ฝังในของ (ปุ่มสกิล 1/2/3 = สกิลที่ 1/2/3 ตามลำดับ อาวุธ → เสื้อ)
import { spawnShot, rollDamage, damageMob } from './combat.js';
import { playerStats } from './stats.js';
import { skillsOf } from './gems.js';

// หันตัวละครไปทางมุม a (ทิศ 0 ล่าง · 1 บน · 2 ซ้าย · 3 ขวา)
export function faceAngle(p, a) {
  p.aim = a;
  const c = Math.cos(a), s = Math.sin(a);
  p.dir = Math.abs(c) > Math.abs(s) ? (c > 0 ? 3 : 2) : (s > 0 ? 0 : 1);
}

const RANGED = new Set(['bow', 'crossbow']);
// ทรงอาวุธที่ถือ: sword / kris / glaive / staff / bow / crossbow
export function weaponKind(game) {
  const w = game.player.equip && game.player.equip.weapon;
  return w ? ((game.data.items.bases[w.base].look || {}).kind || 'sword') : 'sword';
}

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

// วูบหายตัวฟัน (Flicker Strike แบบ PoE): หาศัตรูในระยะที่มองเห็นได้ — เลือกตัวที่ยังไม่ได้วูบไปล่าสุดก่อน เพื่อให้กดรัวแล้วกระโดดไปเรื่อยๆ
export function flickerTarget(game, sk) {
  const p = game.player; let best = null, bd = 1e9;
  for (const m of game.mobs) {
    if (m.dead) continue;
    const d = Math.hypot(m.x - p.x, m.y - p.y);
    if (d > sk.range || !game.world.lineClear(p.x, p.y - 10, m.x, m.y - 10)) continue;
    const score = d + (m === p.flickLast ? 600 : 0);
    if (score < bd) { bd = score; best = m; }
  }
  return best;
}
const MELEE_ONLY = new Set(['sword', 'kris', 'glaive']);

export function castSkill(game, group) {
  const p = game.player, sk = skillOf(game, group);
  if (!sk || p.skillCd[group] > 0 || p.dashT > 0) return false;
  if (sk.arrow && !RANGED.has(weaponKind(game))) { if (!p._noMpWarn) { game.fx.text(p.x, p.y - 70, 'ต้องถือธนูหรือหน้าไม้', '#ffb070'); p._noMpWarn = 0.8; } return false; }
  if (sk.shape === 'flicker') {
    const warn = !MELEE_ONLY.has(weaponKind(game)) ? 'ต้องถืออาวุธประชิด (ดาบ กริช ง้าว)' : !flickerTarget(game, sk) ? 'ไม่มีศัตรูในระยะ' : null;
    if (warn) { if (!p._noMpWarn) { game.fx.text(p.x, p.y - 70, warn, '#d8b0ff'); p._noMpWarn = 0.8; } return false; }
  }
  const st0 = playerStats(p, game.data);
  if (st0.bloodMagic ? p.hp <= sk.mp : p.mp < sk.mp) { if (!p._noMpWarn) { game.fx.text(p.x, p.y - 70, 'มานาไม่พอ', '#8fb8ff'); p._noMpWarn = 0.8; } return false; }
  const target = sk.shape === 'flicker' ? flickerTarget(game, sk) : pickTarget(game, p);
  const sx = p.x, sy = p.y - 22;
  const ang = target ? Math.atan2(target.y - target.height * 0.4 - sy, target.x - sx) : p.aim;
  faceAngle(p, ang);
  if (st0.bloodMagic) p.hp = Math.max(1, p.hp - sk.mp); else p.mp -= sk.mp;
  p.skillCd[group] = sk.cooldown * st0.castCdMult; p.combatTimer = 4;
  const wk = weaponKind(game);
  if (sk.arrow || ((wk === 'staff' || wk === 'bow' || wk === 'crossbow') && !sk.melee)) { p.shootKind = wk === 'sword' || wk === 'kris' || wk === 'glaive' ? 'bow' : wk; p.shootDur = 0.3; p.shootT = 0.3 * 0.45; }   // สกิลศร/พลอยตอนถืออาวุธระยะไกล = ท่าปล่อย
  else if (sk.melee) { p.swing = 0.28; p.combo = sk.shape === 'line' ? 2 : sk.shape === 'cone' ? 1 : 0; p.comboT = 0; }   // สกิลฟัน = ท่าฟันด้วยอาวุธจริง (แนวตรง = แทง)
  else p.castT = 0.22;                                           // สกิลพลอย = ท่ายกมือร่าย
  releaseSkill(game, sk, ang);
  game.events.emit('skillCast', { group, gem: sk.gem });
  return true;
}

// ปล่อยสกิลจริง (ไม่หักมานา/คูลดาวน์) — ใช้ทั้งกดปุ่มสกิลและสกิลทำงานเองจากของยูนีค
export function releaseSkill(game, sk, ang) {
  const p = game.player, sx = p.x, sy = p.y - 22;
  const st = playerStats(p, game.data);
  if (sk.shape === 'flicker') { flicker(game, sk, st); return; }
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
  const dmg = (sk.arrow ? st.damage : st.spellDamage) * sk.damageMult;   // ศรใช้ดาเมจโจมตี · พลอยอื่นใช้ดาเมจพลอย
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

// วาร์ปไปโผล่ข้างเป้าหมาย (ฝั่งที่ผู้เล่นมา ไม่ติดกำแพง) แล้วฟันวงรอบจุดที่โผล่ · ไม่มีเป้า (เช่นของยูนีคสั่งเอง) = ไม่ทำอะไร
function flicker(game, sk, st) {
  const p = game.player, m = flickerTarget(game, sk);
  if (!m) return;
  const a0 = Math.atan2(p.y - m.y, p.x - m.x), gap = m.radius + p.radius + 6;
  let spot = null;
  for (const da of [0, 0.8, -0.8, 1.6, -1.6, Math.PI]) {
    const x = m.x + Math.cos(a0 + da) * gap, y = m.y + Math.sin(a0 + da) * gap;
    if (!game.world.blocked(x, y, p.radius)) { spot = { x, y }; break; }
  }
  if (!spot) return;
  const fx0 = p.x, fy0 = p.y;
  for (let i = 0; i <= 8; i++) { const k = i / 8; game.fx.burst(fx0 + (spot.x - fx0) * k, fy0 - 18 + (spot.y - fy0) * k, i % 2 ? '#d8b0ff' : '#8a3ad8', 2, 40, 0.35, 2.5); }   // เส้นเงาม่วงจางตามทาง
  game.fx.burst(fx0, fy0 - 18, '#8a3ad8', 12, 110, 0.4, 3);
  p.x = spot.x; p.y = spot.y; p.moveTarget = null; p.flickLast = m;
  const ang = Math.atan2(m.y - p.y, m.x - p.x); faceAngle(p, ang);
  const R = sk.splash * st.areaMult;
  for (const o of game.mobs) {
    if (o.dead || Math.hypot(o.x - m.x, (o.y - m.y) * 1.2) > R + o.radius) continue;
    const r = rollDamage(st.damage * sk.damageMult, game.rng, st.crit, st.critMult);
    damageMob(game, o, r.amount, r.crit);
  }
  game.fx.slash(p.x, p.y - 14, ang, R + 20, 1.2, 1); game.fx.ring(m.x, m.y - 10, R, '#d8b0ff');
  game.camera.shake = Math.max(game.camera.shake, 3);
  game.audio.play('swing');
}

export function updateSkillTimers(game, dt) {
  const p = game.player;
  for (let i = 0; i < p.skillCd.length; i++) p.skillCd[i] = Math.max(0, p.skillCd[i] - dt);
  if (p._noMpWarn) p._noMpWarn = Math.max(0, p._noMpWarn - dt);
}

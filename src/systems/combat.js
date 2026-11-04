// การต่อสู้: ทำดาเมจมอน/ผู้เล่น ลูกกระสุนทุกชนิด
// กติกาเหล็ก: มอนตายได้ครั้งเดียว → event 'mobKilled' ยิงครั้งเดียวเท่านั้น
export function rollDamage(base, rng, critChance = 0.06, critMult = 1.6) {
  const crit = rng.chance(critChance);
  const v = base * (0.9 + rng.next() * 0.2) * (crit ? critMult : 1);
  return { amount: Math.max(1, Math.round(v)), crit };
}

export function damageMob(game, mob, amount, crit = false, element = 'phys') {
  if (mob.dead || mob.hp <= 0) return false;
  mob.hp -= amount;
  mob.flash = 0.18;
  mob.aggroed = true;
  // สะดุ้งถอยจากผู้เล่นเล็กน้อย (ท่าโดนตี)
  const p = game.player, dx = mob.x - p.x, dy = mob.y - p.y, d = Math.hypot(dx, dy) || 1;
  if (element !== 'poison') { mob.recoil = 0.14; mob.kbx = dx / d; mob.kby = dy / d; }
  if (element !== 'poison' && mob.state !== 'charge' && mob.type !== 'bigboar' && !mob.def.boss) {
    const r = mob.def.flying ? { x: mob.x + dx / d * 5, y: mob.y + dy / d * 5 } : game.world.moveCircle(mob.x, mob.y, mob.radius, dx / d * 5, dy / d * 5);
    mob.x = r.x; mob.y = r.y;
  }
  const tc = { fire: '#ffae5a', ice: '#a8d8ff', poison: '#9af0b0' }[element] || '#ffffff';
  game.fx.text(mob.x, mob.y - mob.height, String(amount), crit ? '#ffd24a' : tc, crit);
  game.fx.burst(mob.x, mob.y - mob.height * 0.5, (SHOT_COLORS[element] || ['#f4e6c8'])[0], element === 'poison' ? 3 : 5, 80, 0.35, 2.5);
  if (element !== 'poison') game.audio.play('hit');
  if (mob.hp <= 0) {
    mob.hp = 0;
    mob.dead = true;
    mob.dying = 0.0001;
    game.events.emit('mobKilled', { mob });
  }
  return true;
}

export function hurtPlayer(game, amount, fromX, fromY) {
  const p = game.player;
  if (p.dead || p.invuln > 0 || game.mode !== 'play') return false;
  p.hp -= amount;
  p.invuln = game.data.balance.player.hurtInvuln;
  p.hurt = 0.35;
  p.combatTimer = 4;
  game.fx.text(p.x, p.y - 34, '-' + amount, '#ff6a5a');
  game.camera.shake = 4;
  game.audio.play('hurt');
  if (fromX !== undefined) {
    const a = Math.atan2(p.y - fromY, p.x - fromX);
    const m = game.world.moveCircle(p.x, p.y, p.radius, Math.cos(a) * 6, Math.sin(a) * 6);
    p.x = m.x; p.y = m.y;
  }
  game.events.emit('playerHurt', { amount });
  if (p.hp <= 0) { p.hp = 0; p.dead = true; game.events.emit('playerDied', {}); }
  return true;
}

// ฟันเป็นวงโค้ง โดนได้หลายตัว คืนจำนวนที่โดน
export function meleeArc(game, x, y, ang, range, arc, base, critChance, critMult) {
  let hits = 0;
  for (const m of game.mobs) {
    if (m.dead) continue;
    const dx = m.x - x, dy = (m.y - m.height * 0.3) - (y - 10);
    const d = Math.hypot(dx, dy);
    if (d > range + m.radius) continue;
    let da = Math.atan2(dy, dx) - ang;
    while (da > Math.PI) da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;
    if (Math.abs(da) > arc / 2 && d > m.radius + 8) continue;
    const r = rollDamage(base, game.rng, critChance, critMult);
    if (damageMob(game, m, r.amount, r.crit)) hits++;
  }
  return hits;
}

// shot: { x, y, vx, vy, life, radius, from:'player'|'mob', damage, kind, splash }
export function spawnShot(game, shot) { game.shots.push({ hitIds: new Set(), ...shot }); }

export const SHOT_COLORS = {
  fire: ['#ff7a2a', '#ffe08a', '#ffb84a'], ice: ['#7ac0ff', '#e8f4ff', '#a8d8ff'], poison: ['#3ad06a', '#c8ffb0', '#7dff8a'], ghost: ['#8cff9a', '#e8ffe8', '#8cff9a'], phong: ['#ff9a3a', '#fff0b0', '#ffc070'], water: ['#3ab8e0', '#e8fbff', '#8ae0ff'], bolt: ['#ffd23a', '#ffffff', '#fff6a0'], holy: ['#ffe8a0', '#ffffff', '#fff0c8'],
};

// ผลพิเศษของกระสุนพลอย: ทำให้ช้า / ติดพิษ
function applyEffects(s, m) {
  if (s.slow) { m.slowT = s.slowTime; m.slowK = s.slow; }
  if (s.poison) { m.poisonT = s.poisonTime; m.poisonDps = s.poison / s.poisonTime; m.poisonTick = m.poisonTick || 0.5; }
}

function explode(game, s) {
  const col = SHOT_COLORS[s.kind] || SHOT_COLORS.fire;
  game.fx.ring(s.x, s.y, s.splash, col[2]);
  game.fx.burst(s.x, s.y, col[0], 14, 140, 0.45, 3);
  game.fx.burst(s.x, s.y, col[1], 8, 90, 0.35, 2);
  game.audio.play('boom');
  for (const m of game.mobs) {
    if (m.dead || s.hitIds.has(m.id)) continue;
    if (Math.hypot(m.x - s.x, m.y - 8 - s.y) <= s.splash + m.radius) {
      const r = rollDamage(s.damage * 0.6, game.rng, s.crit, s.critMult);
      damageMob(game, m, r.amount, r.crit, s.kind);
      applyEffects(s, m);
    }
  }
}

export function updateShots(game, dt) {
  const p = game.player;
  for (let i = game.shots.length - 1; i >= 0; i--) {
    const s = game.shots[i];
    s.life -= dt;
    s.x += s.vx * dt; s.y += s.vy * dt;
    const col = SHOT_COLORS[s.kind] || SHOT_COLORS.ghost;
    game.fx.trail(s.x, s.y, Math.random() > 0.5 ? col[0] : col[1], 3.5, 0.28);
    let done = s.life <= 0 || (!s.flying && game.world.blocked(s.x, s.y + 8, 3));
    if (!done && s.from === 'player') {
      for (const m of game.mobs) {
        if (m.dead || s.hitIds.has(m.id)) continue;
        if (Math.hypot(m.x - s.x, m.y - m.height * 0.4 - s.y) <= m.radius + s.radius) {
          s.hitIds.add(m.id);
          const r = rollDamage(s.damage, game.rng, s.crit, s.critMult);
          damageMob(game, m, r.amount, r.crit, s.kind);
          applyEffects(s, m);
          if (s.pierce > 0) { s.pierce--; if (s.splash) explode(game, s); continue; }   // ทะลุไปตัวถัดไป
          done = true; break;
        }
      }
    } else if (!done && s.from === 'mob') {
      if (Math.hypot(p.x - s.x, p.y - 14 - s.y) <= p.radius + s.radius) {
        if (p.invuln <= 0) { hurtPlayer(game, s.damage, s.x - s.vx, s.y - s.vy); done = true; }
      }
    }
    if (done) {
      if (s.splash) explode(game, s);
      else game.fx.burst(s.x, s.y, s.from === 'mob' ? '#8cff9a' : '#ffb84a', 6, 70, 0.3, 2.5);
      game.shots.splice(i, 1);
    }
  }
}

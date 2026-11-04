// การต่อสู้: ทำดาเมจมอน/ผู้เล่น ลูกกระสุนทุกชนิด
// กติกาเหล็ก: มอนตายได้ครั้งเดียว → event 'mobKilled' ยิงครั้งเดียวเท่านั้น
export function rollDamage(base, rng) {
  const crit = rng.chance(0.06);
  const v = base * (0.9 + rng.next() * 0.2) * (crit ? 1.6 : 1);
  return { amount: Math.max(1, Math.round(v)), crit };
}

export function damageMob(game, mob, amount, crit = false, element = 'phys') {
  if (mob.dead || mob.hp <= 0) return false;
  mob.hp -= amount;
  mob.flash = 0.18;
  mob.aggroed = true;
  game.fx.text(mob.x, mob.y - mob.height, String(amount), crit ? '#ffd24a' : element === 'fire' ? '#ffae5a' : '#ffffff', crit);
  game.fx.burst(mob.x, mob.y - mob.height * 0.5, element === 'fire' ? '#ff8a2a' : '#f4e6c8', 5, 80, 0.35, 2.5);
  game.audio.play('hit');
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
export function meleeArc(game, x, y, ang, range, arc, base) {
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
    const r = rollDamage(base, game.rng);
    if (damageMob(game, m, r.amount, r.crit)) hits++;
  }
  return hits;
}

// shot: { x, y, vx, vy, life, radius, from:'player'|'mob', damage, kind, splash }
export function spawnShot(game, shot) { game.shots.push({ hitIds: new Set(), ...shot }); }

function explode(game, s) {
  game.fx.ring(s.x, s.y, s.splash, '#ffb84a');
  game.fx.burst(s.x, s.y, '#ff7a2a', 14, 140, 0.45, 3);
  game.fx.burst(s.x, s.y, '#ffe08a', 8, 90, 0.35, 2);
  game.audio.play('boom');
  for (const m of game.mobs) {
    if (m.dead || s.hitIds.has(m.id)) continue;
    if (Math.hypot(m.x - s.x, m.y - 8 - s.y) <= s.splash + m.radius) {
      const r = rollDamage(s.damage * 0.6, game.rng);
      damageMob(game, m, r.amount, r.crit, 'fire');
    }
  }
}

export function updateShots(game, dt) {
  const p = game.player;
  for (let i = game.shots.length - 1; i >= 0; i--) {
    const s = game.shots[i];
    s.life -= dt;
    s.x += s.vx * dt; s.y += s.vy * dt;
    if (s.kind === 'fireball') game.fx.trail(s.x, s.y, Math.random() > 0.5 ? '#ff8a2a' : '#ffd24a', 3.5, 0.28);
    else game.fx.trail(s.x, s.y, '#8cff9a', 3, 0.25);
    let done = s.life <= 0 || (!s.flying && game.world.blocked(s.x, s.y + 8, 3));
    if (!done && s.from === 'player') {
      for (const m of game.mobs) {
        if (m.dead || s.hitIds.has(m.id)) continue;
        if (Math.hypot(m.x - s.x, m.y - m.height * 0.4 - s.y) <= m.radius + s.radius) {
          s.hitIds.add(m.id);
          const r = rollDamage(s.damage, game.rng);
          damageMob(game, m, r.amount, r.crit, 'fire');
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

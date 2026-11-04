// มอนสเตอร์: เกิด เกิดใหม่ และ AI (ประชิด / พุ่งชน / ร่ายระยะไกล)
import { hurtPlayer, spawnShot, damageMob } from './combat.js';
import { monsterHeight } from '../art/monsters.js';
import { updateBoss } from './boss.js';

let nextId = 1;

export function makeMob(game, type, level, x, y, group = -1) {
  const def = game.data.monsters[type];
  const S = game.data.balance.monsterScale, l = level - 1;
  const hp = Math.round(def.hp * (1 + S.hpPerLevel * l));
  return {
    id: nextId++, type, def, level, group, x, y, homeX: x, homeY: y,
    hp, maxHp: hp, damage: Math.round(def.damage * (1 + S.damagePerLevel * l)), xp: Math.round(def.xp * (1 + S.xpPerLevel * l)),
    radius: def.radius, height: monsterHeight(type), speed: def.speed, baseSpeed: def.speed, slowT: 0, slowK: 1, poisonT: 0,
    state: 'idle', t: Math.random() * 10, face: 1, flash: 0, dying: 0, dead: false, aggroed: false,
    attackCd: 0.5, chargeCd: 1.5, stateT: 0, dirX: 0, dirY: 0, windup: 0, wanderT: Math.random() * 2, tx: x, ty: y,
    hitThisCharge: false, dodged: false, moving: false,
  };
}

function freeSpot(game, area, r, avoidX, avoidY, minD) {
  for (let i = 0; i < 40; i++) {
    const x = area.x + Math.random() * area.w, y = area.y + Math.random() * area.h;
    if (game.world.blocked(x, y, r + 2)) continue;
    if (avoidX !== undefined && Math.hypot(x - avoidX, y - avoidY) < minD) continue;
    return { x, y };
  }
  return null;
}

export function spawnZoneMobs(game) {
  game.mobs.length = 0;
  game.spawnTimers = [];
  const z = game.world.zone, p = game.player;
  z.spawns.forEach((s, gi) => {
    game.spawnTimers[gi] = [];
    if (s.afterFlag && !game.flags[s.afterFlag]) return;
    for (let i = 0; i < s.count; i++) spawnOne(game, s, gi, p.x, p.y, 280);
  });
}

function spawnOne(game, s, gi, ax, ay, minD) {
  const lv = s.level[0] + Math.floor(Math.random() * (s.level[1] - s.level[0] + 1));
  const spot = freeSpot(game, s.area, game.data.monsters[s.type].radius, ax, ay, minD);
  if (!spot) return null;
  const m = makeMob(game, s.type, lv, spot.x, spot.y, gi);
  game.mobs.push(m);
  return m;
}

// หาทางเดินแบบตาราง (BFS) เมื่อเดินตรงไปแล้วติดสิ่งกีดขวาง — คืนรายการจุดเดิน
const CELL = 16;
function findPath(game, m, tx, ty) {
  const r = 14, x0 = Math.floor(Math.min(m.x, tx) / CELL) - r, y0 = Math.floor(Math.min(m.y, ty) / CELL) - r;
  const w = Math.floor(Math.max(m.x, tx) / CELL) + r - x0 + 1, h = Math.floor(Math.max(m.y, ty) / CELL) + r - y0 + 1;
  if (w * h > 6000) return null;
  const sx = Math.floor(m.x / CELL) - x0, sy = Math.floor(m.y / CELL) - y0, gx = Math.floor(tx / CELL) - x0, gy = Math.floor(ty / CELL) - y0;
  const prev = new Int32Array(w * h).fill(-1), seen = new Uint8Array(w * h);
  const q = [sy * w + sx]; seen[q[0]] = 1;
  const free = (cx, cy) => !game.world.blocked((cx + x0) * CELL + CELL / 2, (cy + y0) * CELL + CELL / 2, m.radius - 2);
  for (let qi = 0; qi < q.length; qi++) {
    const cur = q[qi], cx = cur % w, cy = (cur / w) | 0;
    if (Math.abs(cx - gx) <= 1 && Math.abs(cy - gy) <= 1) {
      const pts = []; let c = cur;
      while (c >= 0 && c !== q[0]) { pts.push({ x: (c % w + x0) * CELL + CELL / 2, y: (((c / w) | 0) + y0) * CELL + CELL / 2 }); c = prev[c]; }
      return pts.reverse().filter((_, i, arr) => i % 2 === 1 || i === arr.length - 1);
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      const nx = cx + dx, ny = cy + dy, ni = ny * w + nx;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h || seen[ni]) continue;
      seen[ni] = 1;
      if (free(nx, ny)) { prev[ni] = cur; q.push(ni); }
    }
  }
  return null;
}

// เดินไปหาเป้า: ตรงไปก่อน ถ้าติดให้หาทางอ้อมด้วยตาราง แล้วเดินตามทางนั้นครู่หนึ่ง
function seek(game, m, dx, dy, speed, dt) {
  const want = speed * dt;
  if (m.def.flying) { const d = Math.hypot(dx, dy) || 1; step(game, m, dx / d * speed, dy / d * speed, dt); return; }
  m.pathCd = Math.max(0, (m.pathCd || 0) - dt);
  if (m.path && m.path.length) {
    const wp = m.path[0], wx = wp.x - m.x, wy = wp.y - m.y, wd = Math.hypot(wx, wy);
    if (wd < 6) { m.path.shift(); if (!m.path.length) m.path = null; return; }
    if (step(game, m, wx / wd * speed, wy / wd * speed, dt) < want * 0.2) m.path = null;
    return;
  }
  const d = Math.hypot(dx, dy) || 1;
  if (step(game, m, dx / d * speed, dy / d * speed, dt) > want * 0.35) return;
  if (m.pathCd <= 0) { m.pathCd = 0.5; m.path = findPath(game, m, m.x + dx, m.y + dy); }
}

function step(game, m, vx, vy, dt) {
  const ox = m.x, oy = m.y;
  if (m.def.flying) {
    m.x = Math.max(10, Math.min(game.world.zone.W - 10, m.x + vx * dt));
    m.y = Math.max(30, Math.min(game.world.zone.H - 10, m.y + vy * dt));
  } else {
    const r = game.world.moveCircle(m.x, m.y, m.radius, vx * dt, vy * dt);
    m.x = r.x; m.y = r.y;
  }
  if (Math.abs(vx) > 1) m.face = vx > 0 ? 1 : -1;
  const moved = Math.hypot(m.x - ox, m.y - oy);
  m.moving = moved > 0.2;
  m.walk = ((m.walk || 0) + moved / (m.radius * 4.5)) % 1;   // จังหวะขาตามระยะที่เดินจริง
  return moved;
}

function updateAI(game, m, dt) {
  const p = game.player, def = m.def;
  const dx = p.x - m.x, dy = p.y - m.y, d = Math.hypot(dx, dy) || 1;
  const canSee = !p.dead && game.mode === 'play';
  m.attackCd -= dt; m.chargeCd -= dt; m.stateT -= dt;
  if (!m.aggroed && canSee && d < def.aggro) m.aggroed = true;
  if (m.aggroed && (!canSee || Math.hypot(m.x - m.homeX, m.y - m.homeY) > def.aggro * 2.6)) { m.aggroed = false; m.state = 'return'; m.stateT = 0; }

  if (def.ai === 'boss') { updateBoss(game, m, dt, { seek, step, makeMob }); return; }
  if (m.state === 'windup') {
    m.windup = Math.max(0, m.stateT);
    if (m.stateT <= 0) {
      m.windup = 0;
      if (def.ai === 'charger' && m.chargeNext) { m.state = 'charge'; m.stateT = def.chargeTime; m.hitThisCharge = false; m.dodged = false; m.chargeNext = false; }
      else if (def.ai === 'caster') {
        const a = Math.atan2(p.y - 14 - (m.y - 24), p.x - m.x);
        spawnShot(game, { x: m.x, y: m.y - 24, vx: Math.cos(a) * def.shotSpeed, vy: Math.sin(a) * def.shotSpeed, life: 2.2, radius: 6, from: 'mob', damage: m.damage, kind: def.shotKind || 'ghost', flying: true });
        m.state = 'chase'; m.attackCd = def.attackCooldown;
      } else {
        if (d < def.attackRange + p.radius + 12) hurtPlayer(game, m.damage, m.x, m.y);
        m.state = 'chase'; m.attackCd = def.attackCooldown;
      }
    }
    return;
  }
  if (m.state === 'charge') {
    const cs = def.chargeSpeed * (m.slowT > 0 ? m.slowK : 1);
    const moved = step(game, m, m.dirX * cs, m.dirY * cs, dt);
    if (Math.random() < 0.7) game.fx.trail(m.x, m.y - 4, 'rgba(200,170,120,0.8)', 4, 0.35);
    const nd = Math.hypot(p.x - m.x, p.y - m.y);
    if (!m.hitThisCharge && nd < m.radius + p.radius + 4) {
      if (p.invuln > 0 && p.dashT > 0) { if (!m.dodged) { m.dodged = true; game.events.emit('chargeDodged', { mob: m }); } }
      else if (hurtPlayer(game, Math.round(m.damage * 1.5), m.x, m.y)) m.hitThisCharge = true;
    }
    if (!m.hitThisCharge && !m.dodged && p.dashT > 0 && nd < m.radius + p.radius + 26) { m.dodged = true; game.events.emit('chargeDodged', { mob: m }); }
    if (m.stateT <= 0 || moved < cs * dt * 0.3) { m.state = 'stun'; m.stateT = 0.7; m.chargeCd = def.chargeCooldown; game.camera.shake = Math.max(game.camera.shake, 1.5); }
    return;
  }
  if (m.state === 'stun') { m.moving = false; if (m.stateT <= 0) m.state = 'chase'; return; }

  if (m.aggroed) {
    m.state = 'chase';
    if (def.ai === 'charger' && m.chargeCd <= 0 && d > 70 && d < 290 && game.world.lineClear(m.x, m.y, p.x, p.y)) {
      m.state = 'windup'; m.stateT = def.chargeWindup; m.chargeNext = true; m.dirX = dx / d; m.dirY = dy / d;
      m.face = dx > 0 ? 1 : -1;
      game.audio.play('warn');
      return;
    }
    if (def.ai === 'caster') {
      const want = def.keepDistance;
      let vx = 0, vy = 0;
      if (d < want - 30) { vx = -dx / d; vy = -dy / d; } else if (d > want + 40) { vx = dx / d; vy = dy / d; }
      vx += -dy / d * 0.45 * Math.sin(m.t * 0.7); vy += dx / d * 0.45 * Math.sin(m.t * 0.7);
      step(game, m, vx * m.speed, vy * m.speed, dt);
      m.face = dx > 0 ? 1 : -1;
      if (m.attackCd <= 0 && d < def.attackRange) { m.state = 'windup'; m.stateT = 0.55; }
      return;
    }
    if (d > def.attackRange + p.radius) seek(game, m, dx, dy, m.speed, dt);
    else { m.moving = false; m.face = dx > 0 ? 1 : -1; if (m.attackCd <= 0) { m.state = 'windup'; m.stateT = 0.32; } }
    return;
  }
  // เดินเล่นรอบถิ่น / กลับบ้าน
  if (m.state === 'return') {
    const hx = m.homeX - m.x, hy = m.homeY - m.y, hd = Math.hypot(hx, hy);
    m.hp = Math.min(m.maxHp, m.hp + m.maxHp * 0.5 * dt);
    if (hd < 10) m.state = 'idle'; else seek(game, m, hx, hy, m.speed * 1.3, dt);
    if (m.stateT < -8) { m.x = m.homeX; m.y = m.homeY; m.state = 'idle'; } // กลับบ้านไม่ได้นานเกิน ให้กลับเลย
    return;
  }
  m.wanderT -= dt;
  if (m.wanderT <= 0) { m.wanderT = 2 + Math.random() * 3; m.tx = m.homeX + (Math.random() - 0.5) * 120; m.ty = m.homeY + (Math.random() - 0.5) * 120; }
  const wx = m.tx - m.x, wy = m.ty - m.y, wd = Math.hypot(wx, wy);
  if (wd > 6) step(game, m, wx / wd * m.speed * 0.35, wy / wd * m.speed * 0.35, dt); else m.moving = false;
}

export function updateMonsters(game, dt) {
  const z = game.world.zone;
  for (let i = game.mobs.length - 1; i >= 0; i--) {
    const m = game.mobs[i];
    m.t += dt; m.flash = Math.max(0, m.flash - dt); m.recoil = Math.max(0, (m.recoil || 0) - dt);
    if (m.dead) {
      m.dying += dt * 1.8;
      if (m.dying >= 1) {
        game.mobs.splice(i, 1);
        if (m.group >= 0 && z.spawns[m.group] && z.spawns[m.group].respawn) game.spawnTimers[m.group].push(z.spawns[m.group].respawn);
      }
      continue;
    }
    // สถานะผิดปกติจากพลอย: ช้า (ไพลิน) และพิษ (มรกต)
    if (m.slowT > 0) { m.slowT -= dt; m.speed = m.baseSpeed * m.slowK; if (Math.random() < 0.15) game.fx.trail(m.x, m.y - m.height * 0.6, '#cfe8ff', 2.5, 0.4); } else m.speed = m.baseSpeed;
    if (m.poisonT > 0) {
      m.poisonT -= dt; m.poisonTick -= dt;
      if (Math.random() < 0.2) game.fx.trail(m.x, m.y - m.height * 0.5, '#5ae07a', 3, 0.5);
      if (m.poisonTick <= 0) { m.poisonTick = 0.5; damageMob(game, m, Math.max(1, Math.round(m.poisonDps * 0.5)), false, 'poison'); if (m.dead) continue; }
    }
    updateAI(game, m, dt);
  }
  // ดันมอนไม่ให้ซ้อนกัน
  const ms = game.mobs;
  for (let i = 0; i < ms.length; i++) {
    const a = ms[i]; if (a.dead || a.def.flying || a.state === 'charge') continue;
    for (let j = i + 1; j < ms.length; j++) {
      const b = ms[j]; if (b.dead || b.def.flying) continue;
      const dx = b.x - a.x, dy = b.y - a.y, min = a.radius + b.radius;
      if (Math.abs(dx) > min || Math.abs(dy) > min) continue;
      const d = Math.hypot(dx, dy) || 0.01;
      if (d < min) {
        const push = (min - d) / 2, nx = dx / d, ny = dy / d;
        const ra = game.world.moveCircle(a.x, a.y, a.radius, -nx * push, -ny * push); a.x = ra.x; a.y = ra.y;
        const rb = game.world.moveCircle(b.x, b.y, b.radius, nx * push, ny * push); b.x = rb.x; b.y = rb.y;
      }
    }
  }
  // เกิดใหม่
  (game.spawnTimers || []).forEach((timers, gi) => {
    for (let k = timers.length - 1; k >= 0; k--) {
      timers[k] -= dt;
      if (timers[k] <= 0) {
        const s = z.spawns[gi];
        if (spawnOne(game, s, gi, game.player.x, game.player.y, 320)) timers.splice(k, 1); else timers[k] = 2;
      }
    }
  });
}

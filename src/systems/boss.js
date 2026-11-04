// บอส: ท่าโจมตีแบบมีสัญญาณเตือนก่อนเสมอ (วงทุบ / คลื่นกระทืบ / พุ่งชน) และคลั่งเมื่อเลือดเหลือครึ่ง
// อันตรายบนพื้น (hazards) อยู่ใน game.hazards — ทุกอันโดนผู้เล่นได้ครั้งเดียว หลบด้วยการพุ่งหลบ (อมตะชั่วครู่)
import { hurtPlayer } from './combat.js';

// เรียกจาก monsters.js — helpers = { seek, step, makeMob } (ส่งเข้ามาเพื่อไม่ให้ไฟล์อ้างกันวน)
export function updateBoss(game, m, dt, helpers) {
  const p = game.player, def = m.def;
  const dx = p.x - m.x, dy = p.y - m.y, d = Math.hypot(dx, dy) || 1;
  const rage = m.enraged ? 0.7 : 1;
  if (!m.enraged && m.hp <= m.maxHp * 0.5) enrage(game, m, helpers);

  if (m.state === 'return' || !m.aggroed) {                     // ผู้เล่นตาย/หนี: กลับที่เดิมและฟื้นเลือด
    m.hp = Math.min(m.maxHp, m.hp + m.maxHp * 0.25 * dt);
    const hx = m.homeX - m.x, hy = m.homeY - m.y;
    if (Math.hypot(hx, hy) > 10) helpers.seek(game, m, hx, hy, m.speed, dt); else { m.moving = false; m.state = 'idle'; }
    return;
  }
  if (m.state === 'slam' || m.state === 'stomp') {               // ยืนง้างอาวุธ รอวงเตือนครบเวลา
    m.moving = false; m.windup = Math.max(0, m.stateT);
    if (m.stateT <= 0) { m.windup = 0; m.state = 'recover'; m.stateT = 0.5 * rage; }
    return;
  }
  if (m.state === 'windup') {                                     // ง้างก่อนพุ่ง
    m.moving = false; m.windup = Math.max(0, m.stateT);
    if (m.stateT <= 0) { m.windup = 0; m.state = 'charge'; m.stateT = def.chargeTime; m.hitThisCharge = false; m.dodged = false; }
    return;
  }
  if (m.state === 'charge') {
    const cs = def.chargeSpeed * (m.slowT > 0 ? m.slowK : 1);
    const moved = helpers.step(game, m, m.dirX * cs, m.dirY * cs, dt);
    if (Math.random() < 0.8) game.fx.trail(m.x, m.y - 8, 'rgba(120,200,160,0.7)', 6, 0.4);
    const nd = Math.hypot(p.x - m.x, p.y - m.y);
    if (!m.hitThisCharge && nd < m.radius + p.radius + 4) {
      if (p.invuln > 0 && p.dashT > 0) { if (!m.dodged) { m.dodged = true; game.events.emit('chargeDodged', { mob: m }); } }
      else if (hurtPlayer(game, Math.round(m.damage * 1.4), m.x, m.y)) m.hitThisCharge = true;
    }
    if (m.stateT <= 0 || moved < cs * dt * 0.3) { m.state = 'stun'; m.stateT = 0.9; game.camera.shake = Math.max(game.camera.shake, 3); }
    return;
  }
  if (m.state === 'stun' || m.state === 'recover') { m.moving = false; if (m.stateT <= 0) m.state = 'chase'; return; }

  // ไล่ตาม แล้วเลือกท่าตามระยะ — สลับท่าเป็นรอบ ผู้เล่นเดาทางได้
  m.state = 'chase';
  m.face = dx > 0 ? 1 : -1;
  if (m.attackCd <= 0) {
    m.combo = (m.combo || 0) + 1;
    if (m.combo % 3 === 0) return startStomp(game, m, rage);
    if (d < def.slamRadius + 30) return startSlam(game, m, dx / d, dy / d, rage);
    if (d > 150 && game.world.lineClear(m.x, m.y, p.x, p.y)) {
      m.state = 'windup'; m.stateT = def.chargeWindup * rage; m.dirX = dx / d; m.dirY = dy / d; m.attackCd = def.attackCooldown * 2 * rage;
      game.audio.play('warn');
      return;
    }
  }
  if (d > def.attackRange) helpers.seek(game, m, dx, dy, m.speed, dt); else m.moving = false;
}

function startSlam(game, m, nx, ny, rage) {
  const def = m.def, T = def.slamWindup * rage;
  m.state = 'slam'; m.stateT = T; m.attackCd = def.attackCooldown * rage;
  addHazard(game, { kind: 'circle', x: m.x + nx * 46, y: m.y + ny * 30, r: def.slamRadius, t: T, max: T, damage: Math.round(m.damage * 1.5), from: m.id });
  game.audio.play('warn');
}

function startStomp(game, m, rage) {
  const def = m.def, T = def.stompWindup * rage;
  m.state = 'stomp'; m.stateT = T; m.attackCd = def.attackCooldown * 1.4 * rage;
  addHazard(game, { kind: 'wave', x: m.x, y: m.y, r: 0, t: T, max: T, speed: def.waveSpeed, maxR: def.waveMax, thick: def.waveThick, damage: m.damage, from: m.id });
  game.audio.play('warn');
}

function enrage(game, m, helpers) {
  m.enraged = true;
  m.baseSpeed *= 1.3;
  game.camera.shake = 6;
  game.audio.play('boom');
  game.fx.burst(m.x, m.y - 40, '#ff5a3a', 30, 160, 0.9, 4);
  game.notice = { text: m.def.name + 'คลั่ง! เรียกลิงบริวารมาช่วย', t: 4 };
  const n = m.def.summonCount || 0;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    let x = m.x + Math.cos(a) * 70, y = m.y + Math.sin(a) * 50;
    if (game.world.blocked(x, y, 12)) { x = m.x; y = m.y + 40; }
    const s = helpers.makeMob(game, m.def.summon, Math.max(1, m.level - 2), x, y, -1);
    s.aggroed = true;
    game.mobs.push(s);
    game.fx.burst(x, y - 10, '#c9b089', 10, 90, 0.5, 3);
  }
  game.events.emit('bossEnraged', { mob: m });
}

export function addHazard(game, h) {
  if (!game.hazards) game.hazards = [];
  game.hazards.push({ hit: false, done: false, ...h });
}

// วงเตือนนับถอยหลัง → ระเบิดครั้งเดียว / คลื่นขยายออก โดนผู้เล่นได้ครั้งเดียว
export function updateHazards(game, dt) {
  const hz = game.hazards || [], p = game.player;
  for (let i = hz.length - 1; i >= 0; i--) {
    const h = hz[i];
    h.t -= dt;
    if (h.kind === 'circle') {
      if (h.t <= 0 && !h.done) {
        h.done = true; h.fade = 0.3;
        game.camera.shake = Math.max(game.camera.shake, 5);
        game.audio.play('boom');
        game.fx.burst(h.x, h.y, '#c8b08a', 18, 140, 0.5, 4);
        if (!p.dead && Math.hypot(p.x - h.x, (p.y - h.y) * 1.4) < h.r + p.radius * 0.5) {
          if (p.invuln > 0 && p.dashT > 0) game.events.emit('hazardDodged', {});
          else if (hurtPlayer(game, h.damage, h.x, h.y)) h.hit = true;
        }
      }
      if (h.done) { h.fade -= dt; if (h.fade <= 0) hz.splice(i, 1); }
      continue;
    }
    if (h.t > 0) continue;                                       // คลื่น: เริ่มขยายเมื่อหมดเวลาเตือน
    if (!h.started) { h.started = true; game.camera.shake = Math.max(game.camera.shake, 4); game.audio.play('boom'); }
    h.r += h.speed * dt;
    const pd = Math.hypot(p.x - h.x, (p.y - h.y) * 1.4);
    if (!h.hit && !p.dead && Math.abs(pd - h.r) < h.thick / 2 + p.radius * 0.5) {
      if (p.invuln > 0 && p.dashT > 0) { if (!h.dodged) { h.dodged = true; game.events.emit('hazardDodged', {}); } }
      else if (!h.dodged && hurtPlayer(game, h.damage, h.x, h.y)) h.hit = true;
    }
    if (h.r >= h.maxR) hz.splice(i, 1);
  }
}

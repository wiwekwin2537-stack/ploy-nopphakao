// ผู้เล่น: ค่าสถานะ การเดิน (ปุ่ม/จอย/คลิก) การฟัน การหลบ การใช้สกิล
import { meleeArc } from './combat.js';
import { castSkill } from './skills.js';
import { playerStats } from './stats.js';
import { emptyEquip } from './items.js';

export function createPlayer(data) {
  const gemsData = data.gems;
  const p = {
    x: 0, y: 0, radius: 10, level: 1, xp: 0, coins: 0, hp: 1, mp: 1,
    bag: [], currency: { jeweller: 0, fusing: 0 }, dir: 0, aim: 0, walk: 0, moving: false,
    attackCd: 0, swing: -1, combo: 0, comboT: 0, pendingHit: null, dashCd: 0, dashT: 0, dashVx: 0, dashVy: 0, skillCd: Array(gemsData.skillButtons).fill(0), castT: 0,
    passives: [], gemXp: {}, questPoints: 0, items: [], stash: [], equip: emptyEquip(), nextUid: 0, potions: 0, potionCd: 0, mpPotions: 0, mpPotionCd: 0, invuln: 0, hurt: 0, dead: false, combatTimer: 0, moveTarget: null, targetMob: null, movedDist: 0,
  };
  const s = playerStats(p, data);
  p.hp = s.maxHp; p.mp = s.maxMp;
  return p;
}

// ของเริ่มต้น: ดาบไม้ไผ่ 3 ช่องเชื่อมกันหมด + เสื้อผ้าฝ้าย 2 ช่อง + ผ้าคาดหัว + ยาหม้อ
export function giveStarterGear(p, data) {
  const mk = (base, extra = {}) => ({ uid: ++p.nextUid, base, rarity: 'normal', ilvl: 1, mods: [], rareName: null, ...extra });
  p.equip.weapon = mk('bamboo_sword', { sockets: 3, links: [true, true], gems: [null, null, null], colors: ['r', 'g', 'g'] });
  p.equip.body = mk('cotton_shirt', { sockets: 2, links: [false], gems: [null, null], colors: ['b', 'g'] });
  p.equip.head = mk('cloth_band');
  p.potions = data.shop ? data.shop.potion.starter : 0;
  p.mpPotions = data.shop ? data.shop.manaPotion.starter : 0;
  p.currency = { jeweller: 1, fusing: 1, chroma: 1 };
}

function nearestMob(game, x, y, maxD) {
  let best = null, bd = maxD;
  for (const m of game.mobs) {
    if (m.dead) continue;
    const d = Math.hypot(m.x - x, m.y - y);
    if (d < bd) { bd = d; best = m; }
  }
  return best;
}

function faceAngle(p, a) {
  p.aim = a;
  const c = Math.cos(a), s = Math.sin(a);
  p.dir = Math.abs(c) > Math.abs(s) ? (c > 0 ? 3 : 2) : (s > 0 ? 0 : 1);
}

export function doAttack(game) {
  const p = game.player, B = game.data.balance.player;
  if (p.attackCd > 0 || p.dashT > 0) return false;
  const target = (p.targetMob && !p.targetMob.dead) ? p.targetMob : nearestMob(game, p.x, p.y, B.attackRange * 1.8);
  if (target) faceAngle(p, Math.atan2(target.y - target.height * 0.3 - (p.y - 10), target.x - p.x));
  p.attackCd = playerStats(p, game.data).attackCooldown;
  // คอมโบ 3 จังหวะ: ฟันขวา→ซ้าย, ซ้าย→ขวา, แทงตรง (กดต่อเนื่องภายใน 0.7 วิ)
  p.combo = p.comboT > 0 ? (p.combo + 1) % 3 : 0;
  p.comboT = 0.7;
  p.swing = 0;
  game.audio.play('swing');
  // ดาบโดนตอนจังหวะฟันจริง (หลังง้าง) ไม่ใช่ตอนกดปุ่ม
  p.pendingHit = { t: SWING_TIME * 0.3, aim: p.aim, combo: p.combo };
  return true;
}

export const SWING_TIME = 0.34;
// ระยะเดินต่อการก้าวครบ 1 รอบ (ซ้าย+ขวา) — ค่ามากขึ้น = ก้าวยาวช้าลง ดูสมจริงขึ้น
export const STRIDE = 92;

function applyPendingHit(game, dt) {
  const p = game.player, B = game.data.balance.player, h = p.pendingHit;
  if (!h) return;
  h.t -= dt;
  if (h.t > 0) return;
  p.pendingHit = null;
  const thrust = h.combo === 2;
  const range = thrust ? B.attackRange * 1.25 : B.attackRange, arc = thrust ? 0.9 : B.attackArc;
  if (!thrust) game.fx.slash(p.x, p.y, h.aim, range, arc, h.combo === 1 ? -1 : 1);
  const st = playerStats(p, game.data), dmg = st.damage * (thrust ? 1.25 : 1);
  const hits = meleeArc(game, p.x, p.y, h.aim, range, arc, dmg, st.crit, st.critMult);
  if (hits && st.lifeOnHit) p.hp = Math.min(st.maxHp, p.hp + st.lifeOnHit * hits);
  // ก้าวเข้าหาเป้านิดหนึ่งตอนฟัน ให้ดูมีน้ำหนัก
  const m = game.world.moveCircle(p.x, p.y, p.radius, Math.cos(h.aim) * (thrust ? 7 : 4), Math.sin(h.aim) * (thrust ? 7 : 4));
  p.x = m.x; p.y = m.y;
  if (hits) { p.combatTimer = 4; game.camera.shake = Math.max(game.camera.shake, thrust ? 3 : 2); game.hitStop = thrust ? 0.07 : 0.045; }
  game.events.emit('playerAttacked', { hits });
}

export function doDash(game) {
  const p = game.player, B = game.data.balance.player;
  if (p.dashCd > 0 || p.dashT > 0) return false;
  let dx = game.input.move.x, dy = game.input.move.y;
  if (!dx && !dy) { dx = Math.cos(p.aim); dy = Math.sin(p.aim); }
  const d = Math.hypot(dx, dy) || 1;
  p.dashVx = dx / d * B.dashSpeed; p.dashVy = dy / d * B.dashSpeed;
  p.dashT = B.dashTime; p.dashCd = playerStats(p, game.data).dashCooldown;
  p.invuln = Math.max(p.invuln, B.dashTime + 0.08);
  p.moveTarget = null;
  game.fx.burst(p.x, p.y, '#d8c49a', 8, 60, 0.4, 3);
  game.audio.play('dash');
  game.events.emit('playerDashed', {});
  return true;
}

export function updatePlayer(game, dt) {
  const p = game.player, input = game.input, B = game.data.balance.player;
  const st = playerStats(p, game.data);
  p.attackCd = Math.max(0, p.attackCd - dt);
  p.dashCd = Math.max(0, p.dashCd - dt);
  p.invuln = Math.max(0, p.invuln - dt);
  p.hurt = Math.max(0, p.hurt - dt);
  p.castT = Math.max(0, p.castT - dt);
  p.combatTimer = Math.max(0, p.combatTimer - dt);
  if (p.swing >= 0) { p.swing += dt / SWING_TIME; if (p.swing > 1) p.swing = -1; }
  p.comboT = Math.max(0, (p.comboT || 0) - dt);
  applyPendingHit(game, dt);

  // ฟื้นพลัง
  const regen = game.world.zone.safe ? B.townHpRegen : (p.combatTimer > 0 ? 0 : B.hpRegen * 2);
  p.hp = Math.min(st.maxHp, p.hp + regen * dt);
  p.mp = Math.min(st.maxMp, p.mp + st.mpRegen * dt);
  if (p.dead) return;

  // คลิกเมาส์: ถ้าโดนมอน = ล็อกเป้าแล้วเดินไปตี ถ้าโดนพื้น = เดินไปจุดนั้น
  for (const tap of input.taps) {
    if (tap.consumed || tap.kind !== 'mouse') continue;
    const w = game.camera.toWorld(tap.sx, tap.sy);
    const m = game.mobs.find((q) => !q.dead && Math.hypot(q.x - w.x, q.y - q.height * 0.5 - w.y) < q.radius + 14);
    if (m) { p.targetMob = m; p.moveTarget = null; } else { p.moveTarget = { x: w.x, y: w.y }; p.targetMob = null; }
    tap.consumed = true;
  }
  if (input.mouseHeld && !p.targetMob) { const w = game.camera.toWorld(input.mouseHeld.sx, input.mouseHeld.sy); p.moveTarget = { x: w.x, y: w.y }; }

  // ทิศทางเดิน
  let mx = input.move.x, my = input.move.y;
  if (mx || my) { p.moveTarget = null; p.targetMob = null; }
  if (p.targetMob) {
    if (p.targetMob.dead) p.targetMob = null;
    else {
      const t = p.targetMob, d = Math.hypot(t.x - p.x, t.y - p.y);
      if (d > B.attackRange + t.radius - 6) { mx = (t.x - p.x) / d; my = (t.y - p.y) / d; } else doAttack(game);
    }
  } else if (p.moveTarget) {
    const d = Math.hypot(p.moveTarget.x - p.x, p.moveTarget.y - p.y);
    if (d < 4) p.moveTarget = null; else { mx = (p.moveTarget.x - p.x) / d; my = (p.moveTarget.y - p.y) / d; }
  }

  if (input.pressed.attack) doAttack(game);
  if (input.pressed.dash) doDash(game);
  if (input.held.skill || input.pressed.skill) castSkill(game, 0);
  if (input.held.skill2 || input.pressed.skill2) castSkill(game, 1);
  if (input.held.skill3 || input.pressed.skill3) castSkill(game, 2);

  const ox = p.x, oy = p.y;
  if (p.dashT > 0) {
    p.dashT -= dt;
    const m = game.world.moveCircle(p.x, p.y, p.radius, p.dashVx * dt, p.dashVy * dt);
    p.x = m.x; p.y = m.y;
    if (Math.random() < 0.6) game.fx.trail(p.x, p.y - 4, 'rgba(230,220,190,0.8)', 4, 0.25);
  } else if (mx || my) {
    const slow = p.swing >= 0 ? 0.55 : 1;
    const m = game.world.moveCircle(p.x, p.y, p.radius, mx * st.speed * slow * dt, my * st.speed * slow * dt);
    p.x = m.x; p.y = m.y;
    if (p.swing < 0) faceAngle(p, Math.atan2(my, mx));
  }
  const moved = Math.hypot(p.x - ox, p.y - oy);
  p.movedDist += moved;
  p.moving = moved > 0.3;
  if (p.moving) p.walk = (p.walk + moved / STRIDE) % 1;
  p.walkAmt = (p.walkAmt || 0) + ((p.moving ? 1 : 0) - (p.walkAmt || 0)) * Math.min(1, dt * 9);   // ค่อยๆ เข้า/ออกท่าเดิน ไม่กระตุก
  if (p.moveTarget && moved < 0.05 && !(mx === 0 && my === 0)) p.moveTarget = null; // ติดกำแพง
}

export function nearestMobTo(game, x, y, maxD) { return nearestMob(game, x, y, maxD); }

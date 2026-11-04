// แถบ "ตัวละคร" ในโปรไฟล์: รูปตัวละครใส่ชุดจริง + ค่าสถานะทั้งหมด (คำนวณจาก stats.js ที่เดียว)
import { C, rrect, circle } from '../art/draw.js';
import { uiText as text } from './hud.js';
import { drawHuman } from '../art/characters.js';
import { heroLook, heroGear } from './herolook.js';
import { playerStats } from '../systems/stats.js';
import { startOf, pointsLeft } from '../systems/passives.js';
import { xpNeeded } from '../systems/progress.js';
import { skillsOf } from '../systems/gems.js';

export function drawProfileStats(ctx, game, B) {
  const s = B.s, p = game.player, D = game.data, st = playerStats(p, D), PS = D.passives;
  // ซ้าย: แท่นตัวละคร
  const bx = B.x + 14 * s, by = B.y + 42 * s, bw = 170 * s, bh = B.h - 56 * s;
  const g = ctx.createLinearGradient(0, by, 0, by + bh); g.addColorStop(0, 'rgba(60,40,30,0.55)'); g.addColorStop(1, 'rgba(14,10,8,0.7)');
  ctx.fillStyle = g; rrect(ctx, bx, by, bw, bh, 10 * s); ctx.fill();
  ctx.strokeStyle = 'rgba(217,166,48,0.45)'; ctx.lineWidth = 1; ctx.stroke();
  const cls = startOf(p, PS), cname = cls ? PS.nodes[cls].name : 'ยังไม่เลือกสาย';
  text(ctx, 'นักล่าพลอย', bx + bw / 2, by + 16 * s, 13 * s, C.goldHi, 'center');
  text(ctx, `Lv.${p.level} · ${cname}`, bx + bw / 2, by + 33 * s, 10 * s, C.cream, 'center', '600');
  const k = Math.min(2.4, (bh - 90 * s) / 60) , cx = bx + bw / 2, cy = by + bh - 34 * s;
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(cx, cy, 34 * s, 9 * s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k);
  drawHuman(ctx, heroLook(game), 0, 0, { ...heroGear(game), dir: 0, t: game.time, moving: false, swing: -1 });
  ctx.restore();
  const need = xpNeeded(D.balance, p.level);
  text(ctx, isFinite(need) ? `XP ${Math.floor(p.xp)}/${need}` : 'เลเวลสูงสุด', bx + bw / 2, by + bh - 12 * s, 10 * s, C.goldHi, 'center', '600');

  // ขวา: ค่าสถานะ 2 คอลัมน์
  const rx = bx + bw + 14 * s, rw = B.x + B.w - rx - 14 * s, colW = rw / 2;
  const rows = [
    ['เลือด', `${Math.ceil(p.hp)} / ${st.maxHp}`, '#ff8a7a'],
    ['มานา', `${Math.floor(p.mp)} / ${st.maxMp}${st.mpReserved ? ` (จอง ${st.mpReserved})` : ''}`, '#8ab4ff'],
    ['ดาเมจดาบ', String(Math.round(st.damage)), C.cream],
    ['ดาเมจพลอย', String(Math.round(st.spellDamage)), C.cream],
    ['ฟันต่อวินาที', (1 / st.attackCooldown).toFixed(2), C.cream],
    ['โอกาสคริติคอล', Math.round(st.crit * 100) + '%', C.cream],
    ['แรงคริติคอล', '×' + st.critMult.toFixed(2), C.cream],
    ['ความเร็วเดิน', String(Math.round(st.speed)), C.cream],
    ['ฟื้นมานา/วิ', st.mpRegen.toFixed(1), C.cream],
    ['ฟันโดนฟื้นเลือด', String(st.lifeOnHit), C.cream],
    ['คูลดาวน์หลบ', st.dashCooldown.toFixed(2) + ' วิ', C.cream],
    ['วงระเบิด', '×' + st.areaMult.toFixed(2), C.cream],
    ['เบี้ย', String(p.coins), C.goldHi],
    ['ยาหม้อ', `${p.potions} ขวด`, '#7dff8a'],
  ];
  const rh = Math.min(22 * s, (bh - 70 * s) / Math.ceil(rows.length / 2));
  rows.forEach(([label, val, col], i) => {
    const x = rx + (i % 2) * colW, y = by + Math.floor(i / 2) * rh;
    ctx.fillStyle = i % 4 < 2 ? 'rgba(0,0,0,0.28)' : 'rgba(0,0,0,0.16)'; ctx.fillRect(x, y, colW - 6 * s, rh - 2 * s);
    text(ctx, label, x + 8 * s, y + rh / 2 - 1, 10 * s, 'rgba(244,230,200,0.75)', 'left', 'normal');
    text(ctx, val, x + colW - 14 * s, y + rh / 2 - 1, 11 * s, col, 'right', '600');
  });
  // ล่างขวา: สกิลที่ฝัง + คีย์สโตน + แต้มพาสซีฟ
  let y = by + Math.ceil(rows.length / 2) * rh + 10 * s;
  const skills = skillsOf(D.gems, p).slice(0, 3).map((sk, i) => `${i + 1}. ${sk.name}${sk.supports.length ? ' +' + sk.supports.length : ''}`);
  text(ctx, 'สกิล — ' + (skills.length ? skills.join(' · ') : 'ยังไม่มี (ฝังพลอยสกิลในช่องอาวุธ/เสื้อ)'), rx, y, 10 * s, C.cream, 'left', 'normal'); y += 18 * s;
  if (st.auras.length) { text(ctx, 'ออร่า — ' + st.auras.join(' · '), rx, y, 10 * s, '#9ac0ff', 'left', '600'); y += 18 * s; }
  const ks = p.passives.filter((id) => PS.nodes[id] && PS.nodes[id].kind === 'keystone').map((id) => PS.nodes[id].name);
  if (ks.length) { text(ctx, 'คีย์สโตน — ' + ks.join(' · '), rx, y, 10 * s, '#ffb070', 'left', '600'); y += 18 * s; }
  const left = pointsLeft(p, PS);
  if (left > 0) {
    circle(ctx, rx + 6 * s, y, 6 * s, '#3aa85a', '#fff', 1);
    text(ctx, `มีแต้มพาสซีฟเหลือ ${left} แต้ม — แตะแถบ "พาสซีฟ" ด้านบน`, rx + 18 * s, y, 10 * s, '#9af0b0', 'left', '600');
  }
}

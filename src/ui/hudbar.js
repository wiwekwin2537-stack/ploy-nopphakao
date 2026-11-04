// แถบล่างจอแบบ PoE: ลูกแก้วเลือด (ซ้าย) · ขวดยา 1–5 · แถบสกิล · ลูกแก้วมานา (ขวา)
import { C, rrect, circle, poly } from '../art/draw.js';
import { uiText as text, icon, SKILL_BTN } from './hud.js';
import { skillOf } from '../systems/skills.js';

const PHI = Math.PI * 2;

// ลูกแก้ว: ของเหลวสูงตามสัดส่วน มีคลื่นผิวน้ำ ประกายกระจก กรอบทองลายกนก
function orb(ctx, o, k, deep, bright, t, label, s) {
  const { x, y, r } = o;
  ctx.save();
  ctx.beginPath(); ctx.arc(x, y, r, 0, PHI); ctx.clip();
  ctx.fillStyle = '#0c0808'; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  const top = y + r - 2 * r * Math.max(0, Math.min(1, k));
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.2, r * 0.1, x, y, r * 1.1);
  g.addColorStop(0, bright); g.addColorStop(1, deep);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(x - r, y + r);
  for (let i = 0; i <= 16; i++) { const px = x - r + (i / 16) * 2 * r; ctx.lineTo(px, top + Math.sin(i * 0.9 + t * 2.4) * r * 0.035); }
  ctx.lineTo(x + r, y + r); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(x - r, top - 1, r * 2, 2);
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.ellipse(x - r * 0.32, y - r * 0.45, r * 0.32, r * 0.18, -0.5, 0, PHI); ctx.fill();
  circle(ctx, x, y, r + 2 * s, null, '#2a1a10', 5 * s);                   // ขอบเข้ม + ขอบทอง
  circle(ctx, x, y, r + 1 * s, null, C.gold, 2.2 * s);
  for (let i = 0; i < 4; i++) {                                           // กนกเปลวทองรอบลูกแก้ว
    const a = -Math.PI / 2 + i * Math.PI / 2 + Math.PI / 4, cx = x + Math.cos(a) * (r + 3 * s), cy = y + Math.sin(a) * (r + 3 * s);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(a + Math.PI / 2);
    poly(ctx, [-4 * s, 0, 0, -8 * s, 4 * s, 0, 0, 3 * s], C.goldHi, '#6a4a10', 1);
    ctx.restore();
  }
  text(ctx, label, x, y + r * 0.08, Math.max(9, r * 0.26), '#fff', 'center', '600');
}

// ขวดยา: ขวดแก้วคอแคบ ของเหลวสูงตามจำนวนที่เหลือ
export function flaskIcon(ctx, x, y, w, h, k, col, dim) {
  ctx.globalAlpha = dim ? 0.35 : 1;
  const nx = x + w * 0.32, nw = w * 0.36, by = y + h * 0.28;
  ctx.fillStyle = '#d8c8a8'; ctx.fillRect(nx - 1, y, nw + 2, h * 0.08);                  // จุก
  ctx.fillStyle = 'rgba(200,220,230,0.18)'; ctx.fillRect(nx, y + h * 0.08, nw, h * 0.22);
  rrect(ctx, x + 1, by, w - 2, h - (by - y) - 1, w * 0.3); ctx.fillStyle = 'rgba(20,16,20,0.85)'; ctx.fill();
  if (k > 0) {
    ctx.save(); rrect(ctx, x + 1, by, w - 2, h - (by - y) - 1, w * 0.3); ctx.clip();
    const lh = (h - (by - y)) * k; ctx.fillStyle = col; ctx.fillRect(x, y + h - lh, w, lh);
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(x + w * 0.2, y + h - lh, w * 0.15, lh);
    ctx.restore();
  }
  ctx.strokeStyle = 'rgba(230,220,200,0.7)'; ctx.lineWidth = 1.2; rrect(ctx, x + 1, by, w - 2, h - (by - y) - 1, w * 0.3); ctx.stroke();
  ctx.globalAlpha = 1;
}

export function drawBottomBar(ctx, game, L, st) {
  const p = game.player, s = L.s, t = game.time, D = game.data.shop;
  orb(ctx, L.life, p.hp / st.maxHp, '#4a0808', '#e0302a', t, `${Math.ceil(p.hp)}/${st.maxHp}`, s);
  orb(ctx, L.mana, p.mp / st.maxMp, '#081848', '#3a78ff', t + 1, `${Math.floor(p.mp)}/${st.maxMp}`, s);
  // ขวดยา
  const fl = L.flasks, x0 = fl[0].x - 4 * s, x1 = fl[fl.length - 1].x + fl[0].w + 4 * s;
  ctx.fillStyle = 'rgba(14,10,8,0.78)'; rrect(ctx, x0, fl[0].y - 14 * s, x1 - x0, fl[0].h + 18 * s, 6 * s); ctx.fill();
  ctx.strokeStyle = 'rgba(217,166,48,0.5)'; ctx.lineWidth = 1; ctx.stroke();
  for (const f of fl) {
    const kind = f.id === 'potion' ? { n: p.potions, max: D.potion.max, cd: p.potionCd / D.potion.cooldown, col: '#d8302a' }
      : f.id === 'manapot' ? { n: p.mpPotions, max: D.manaPotion.max, cd: p.mpPotionCd / D.manaPotion.cooldown, col: '#3a6aff' } : null;
    text(ctx, String(f.i + 1), f.x + f.w / 2, f.y - 7 * s, 9 * s, kind ? '#f4e6c8' : 'rgba(244,230,200,0.35)', 'center', '600');
    if (!kind) { ctx.strokeStyle = 'rgba(184,154,88,0.25)'; ctx.lineWidth = 1; rrect(ctx, f.x + 1, f.y + f.h * 0.28, f.w - 2, f.h * 0.7, f.w * 0.3); ctx.stroke(); continue; }
    flaskIcon(ctx, f.x, f.y, f.w, f.h, kind.n / kind.max, kind.col, kind.n <= 0);
    if (kind.cd > 0) { ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(f.x, f.y + f.h * (1 - kind.cd), f.w, f.h * kind.cd); }
    text(ctx, String(kind.n), f.x + f.w - 3 * s, f.y + f.h - 5 * s, 9 * s, kind.n ? '#fff' : '#ff8a7a', 'center', '600');
  }
  if (L.touch) return;
  // แถบสกิล (คีย์บอร์ด/เมาส์/จอย)
  const keys = game.input.mode === 'pad' ? { attack: 'A', skill: 'X', skill2: 'LT', skill3: '-', dash: 'B' } : { attack: 'J', skill: 'K', skill2: 'L', skill3: 'U', dash: 'Space' };
  const b0 = L.bar[0], b1 = L.bar[L.bar.length - 1];
  ctx.fillStyle = 'rgba(14,10,8,0.78)'; rrect(ctx, b0.x - 4 * s, b0.y - 4 * s, b1.x + b1.w - b0.x + 8 * s, b0.h + 8 * s, 6 * s); ctx.fill();
  ctx.strokeStyle = 'rgba(217,166,48,0.5)'; ctx.lineWidth = 1; ctx.stroke();
  for (const b of L.bar) {
    const gi = SKILL_BTN[b.id], sk = gi !== undefined ? skillOf(game, gi) : null;
    ctx.fillStyle = '#1a1210'; ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = '#b89a58'; ctx.lineWidth = 1.5; ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    if (gi !== undefined && !sk) { text(ctx, '–', cx, cy, 12 * s, 'rgba(244,230,200,0.3)', 'center'); }
    else icon(ctx, b.id, cx, cy, b.w * 0.45, game);
    const cd = gi !== undefined ? (sk ? p.skillCd[gi] / sk.cooldown : 0) : b.id === 'dash' ? p.dashCd / st.dashCooldown : 0;
    if (cd > 0) { ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(b.x, b.y + b.h * (1 - cd), b.w, b.h * cd); }
    text(ctx, keys[b.id], b.x + 3 * s, b.y + b.h - 6 * s, 8.5 * s, '#f4e6c8', 'left', '600');
  }
}

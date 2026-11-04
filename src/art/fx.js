// เอฟเฟกต์ภาพล้วน (ไม่มีผลต่อเกม): ประกาย ฝุ่น รอยฟัน ตัวเลขดาเมจ
import { C } from './draw.js';

export function createFx() {
  const parts = [];   // อนุภาค
  const texts = [];   // ตัวเลขลอย
  const slashes = []; // รอยฟัน
  const rings = [];   // วงระเบิด
  const MAX = 400;

  return {
    burst(x, y, color, n = 8, speed = 90, life = 0.5, size = 2.5, up = 0) {
      for (let i = 0; i < n && parts.length < MAX; i++) {
        const a = Math.random() * Math.PI * 2, s = speed * (0.4 + Math.random() * 0.8);
        parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - up, life, max: life, color, size, g: 160 });
      }
    },
    trail(x, y, color, size = 3, life = 0.3) {
      if (parts.length < MAX) parts.push({ x: x + (Math.random() - 0.5) * 4, y: y + (Math.random() - 0.5) * 4, vx: 0, vy: -10, life, max: life, color, size, g: 0 });
    },
    text(x, y, str, color = '#fff', big = false) { texts.push({ x, y, str, color, life: 0.9, max: 0.9, big }); },
    slash(x, y, ang, range, arc) { slashes.push({ x, y, ang, range, arc, life: 0.16, max: 0.16 }); },
    ring(x, y, r, color) { rings.push({ x, y, r, color, life: 0.35, max: 0.35 }); },
    update(dt) {
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]; p.life -= dt;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.vx *= 0.96;
      }
      for (const list of [texts, slashes, rings]) for (let i = list.length - 1; i >= 0; i--) { list[i].life -= dt; if (list[i].life <= 0) list.splice(i, 1); }
      for (const t of texts) t.y -= 34 * dt;
    },
    drawWorld(ctx) {
      for (const r of rings) {
        const k = 1 - r.life / r.max;
        ctx.strokeStyle = r.color; ctx.globalAlpha = 1 - k; ctx.lineWidth = 4 * (1 - k) + 1;
        ctx.beginPath(); ctx.arc(r.x, r.y, r.r * (0.4 + k * 0.6), 0, Math.PI * 2); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      for (const s of slashes) {
        const k = 1 - s.life / s.max;
        ctx.save(); ctx.translate(s.x, s.y - 10);
        ctx.globalAlpha = 1 - k;
        ctx.fillStyle = 'rgba(255,245,210,0.9)';
        ctx.beginPath();
        ctx.arc(0, 0, s.range, s.ang - s.arc / 2, s.ang - s.arc / 2 + s.arc * Math.min(1, k * 2.2));
        ctx.arc(0, 0, s.range * 0.62, s.ang - s.arc / 2 + s.arc * Math.min(1, k * 2.2), s.ang - s.arc / 2, true);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = C.gold; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      for (const p of parts) {
        ctx.globalAlpha = Math.max(0, p.life / p.max);
        ctx.fillStyle = p.color; ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
      ctx.globalAlpha = 1;
      ctx.globalAlpha = 1;
    },
    // ตัวเลขลอยวาดบนชั้นหน้าจอ (คมชัด)
    drawTexts(ctx) {
      ctx.textAlign = 'center'; ctx.lineJoin = 'round';
      for (const t of texts) {
        ctx.globalAlpha = Math.min(1, t.life / t.max * 2);
        ctx.font = `600 ${t.big ? 17 : 13}px Kanit, sans-serif`;
        ctx.lineWidth = 3; ctx.strokeStyle = C.ink; ctx.strokeText(t.str, t.x, t.y);
        ctx.fillStyle = t.color; ctx.fillText(t.str, t.x, t.y);
      }
      ctx.globalAlpha = 1;
    },
    get count() { return parts.length; },
    clear() { parts.length = 0; texts.length = 0; slashes.length = 0; rings.length = 0; },
  };
}

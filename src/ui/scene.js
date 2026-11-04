// วาดโลก: พื้น → ของแบน → ของ/ตัวละครเรียงตามแกน y → กระสุน/เอฟเฟกต์ → แถบเลือด
import { createGround } from '../art/ground.js';
import { createSpriteCache } from '../art/sprites.js';
import { drawHuman } from '../art/characters.js';
import { drawMonster } from '../art/monsters.js';
import { C, shadow, circle, poly, rrect } from '../art/draw.js';
import { GEM_INFO } from '../systems/loot.js';
import { tutorialTarget } from '../systems/tutorial.js';

export function createScene(game) {
  let ground = null, sprites = null, scale = 0;
  const list = [];

  function ensure(dpr) {
    const want = Math.max(1, Math.min(2.5, Math.round(dpr * game.camera.zoom * 2) / 2));
    if (want !== scale) { scale = want; sprites = createSpriteCache(scale); ground = null; }
    if (!ground || ground.zoneId !== game.world.zone.id) {
      if (ground) ground.dispose();
      ground = createGround(game.world.zone, Math.min(2, scale));
      ground.zoneId = game.world.zone.id;
    }
  }

  function drawDrop(ctx, d) {
    const y = d.y - d.z;
    if (d.kind === 'coin') {
      shadow(ctx, d.x, d.y, 5, 2);
      const w = Math.abs(Math.cos(d.t * 5)) * 5 + 1;
      ctx.fillStyle = C.ink; ctx.beginPath(); ctx.ellipse(d.x, y - 6, w + 1.2, 6.2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = C.gold; ctx.beginPath(); ctx.ellipse(d.x, y - 6, w, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = C.goldHi; ctx.fillRect(d.x - 0.8, y - 9, 1.6, 4);
    } else {
      const G = GEM_INFO[d.gem], bob = Math.sin(d.t * 3) * 2.5, gy = y - 14 + bob;
      const glow = ctx.createRadialGradient(d.x, gy, 1, d.x, gy, 26);
      glow.addColorStop(0, 'rgba(255,90,110,0.6)'); glow.addColorStop(1, 'rgba(255,90,110,0)');
      ctx.fillStyle = glow; ctx.fillRect(d.x - 26, gy - 26, 52, 52);
      shadow(ctx, d.x, d.y, 7, 2.5);
      poly(ctx, [d.x, gy - 9, d.x + 7, gy - 3, d.x + 4, gy + 7, d.x - 4, gy + 7, d.x - 7, gy - 3], G.color, C.ink, 1.4);
      poly(ctx, [d.x, gy - 9, d.x + 3, gy - 3, d.x - 3, gy - 3], G.hi, null);
      if (Math.sin(d.t * 6) > 0.6) { ctx.fillStyle = '#fff'; ctx.fillRect(d.x + 4, gy - 10, 2, 2); }
    }
  }

  function drawShot(ctx, s) {
    const col = s.kind === 'fireball' ? ['rgba(255,140,40,0.55)', '#ffd24a', '#fff2c0'] : ['rgba(120,255,140,0.5)', '#7dff8a', '#e8ffe8'];
    const g = ctx.createRadialGradient(s.x, s.y, 1, s.x, s.y, s.radius * 2.6);
    g.addColorStop(0, col[0]); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(s.x, s.y, s.radius * 2.6, 0, Math.PI * 2); ctx.fill();
    circle(ctx, s.x, s.y, s.radius, col[1], null); circle(ctx, s.x, s.y, s.radius * 0.5, col[2], null);
  }

  // ป้ายชื่อแบบเอโดเรีย: แผ่นสีเข้มมุมมน ขอบทอง
  function plate(ctx, text, x, y, size, color = '#f4e6c8', border = 'rgba(217,166,48,0.9)', lv = null) {
    ctx.font = `600 ${size}px Kanit, sans-serif`;
    const lvW = lv ? ctx.measureText(lv).width + 6 : 0;
    const w = ctx.measureText(text).width + 12 + lvW, h = size + 7;
    ctx.fillStyle = 'rgba(24,16,12,0.78)'; rrect(ctx, x - w / 2, y - h / 2, w, h, h / 2.4); ctx.fill();
    ctx.strokeStyle = border; ctx.lineWidth = 1; ctx.stroke();
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = color; ctx.fillText(text, x - w / 2 + 6, y + 0.5);
    if (lv) { ctx.fillStyle = '#ffd24a'; ctx.fillText(lv, x - w / 2 + 6 + ctx.measureText(text).width + 6, y + 0.5); }
  }

  function overlay(ctx) {
    const z = game.world.zone, b = game.camera.bounds(), t = game.time;
    const vis = (x, y) => x > b.l - 60 && x < b.r + 60 && y > b.t - 60 && y < b.b + 80;
    for (const o of z.objects) {
      if (!o.label || !game.world.isVisible(o)) continue;
      const tall = { temple: 220, sala: 150, gate: 160, well: 64, stall: 66, shrine: 80, tree_bodhi: 110 }[o.type] || 60;
      const lx = o.x + o.w / 2, ly = o.y + o.h - tall;
      if (vis(lx, ly)) plate(ctx, o.label, lx, ly, 12, '#ffe9a8');
    }
    for (const m of game.mobs) {
      if (m.dead || !vis(m.x, m.y)) continue;
      if (m.state === 'windup' && m.def.ai === 'charger') {      // เส้นเตือนก่อนพุ่ง
        const len = m.def.chargeSpeed * m.def.chargeTime, k = 1 - m.windup / m.def.chargeWindup;
        ctx.save(); ctx.translate(m.x, m.y); ctx.rotate(Math.atan2(m.dirY, m.dirX));
        ctx.fillStyle = `rgba(220,40,30,${0.16 + k * 0.22})`; ctx.fillRect(0, -m.radius, len, m.radius * 2);
        ctx.fillStyle = 'rgba(255,90,70,0.8)'; ctx.fillRect(0, -m.radius, len * k, 2); ctx.fillRect(0, m.radius - 2, len * k, 2);
        ctx.restore();
      }
      if (m.hp < m.maxHp || m.aggroed || m.type === 'bigboar') {
        const w = Math.max(28, m.radius * 2.6), x = m.x - w / 2, y = m.y - m.height - 8;
        ctx.fillStyle = 'rgba(20,12,8,0.85)'; rrect(ctx, x - 1, y - 1, w + 2, 6, 3); ctx.fill();
        ctx.fillStyle = m.type === 'bigboar' ? '#ff8a2a' : '#e0443a'; rrect(ctx, x, y, Math.max(2, w * (m.hp / m.maxHp)), 4, 2); ctx.fill();
        if (m.type === 'bigboar') plate(ctx, m.def.name, m.x, y - 12, 11, '#ffd24a', 'rgba(255,138,42,0.9)', 'Lv.' + m.level);
        else { ctx.font = '600 10px Kanit, sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = C.ink; ctx.strokeText('Lv.' + m.level, m.x, y - 6); ctx.fillStyle = '#f4e6c8'; ctx.fillText('Lv.' + m.level, m.x, y - 6); }
      }
    }
    for (const n of z.npcs) {
      if (!vis(n.x, n.y)) continue;
      plate(ctx, n.name, n.x, n.y - 64, 11, '#a8e0ff', 'rgba(120,190,255,0.7)');
      if (n.id === 'chan' && !game.flags.metChan) {
        const bb = Math.sin(t * 5) * 2;
        ctx.font = '700 20px Kanit, sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = C.ink;
        ctx.strokeText('!', n.x, n.y - 80 + bb); ctx.fillStyle = C.gold; ctx.fillText('!', n.x, n.y - 80 + bb);
      }
    }
    const p = game.player;
    if (!p.dead) plate(ctx, 'นักล่าพลอย', p.x, p.y - 62, 11, '#f4e6c8', 'rgba(217,166,48,0.9)', 'Lv.' + p.level);
    game.fx.drawTexts(ctx);
    const tt = tutorialTarget(game);
    if (tt && tt.x > b.l && tt.x < b.r && tt.y > b.t && tt.y < b.b) {
      const by = tt.y - 30 + Math.sin(t * 5) * 4;
      poly(ctx, [tt.x - 9, by - 13, tt.x + 9, by - 13, tt.x, by], C.gold, C.ink, 2);
    }
  }

  return {
    draw(ctx, dpr) {
      ensure(dpr);
      const cam = game.camera, z = game.world.zone;
      const sx = cam.shake ? (Math.random() - 0.5) * cam.shake : 0, sy = cam.shake ? (Math.random() - 0.5) * cam.shake : 0;
      const k = dpr * cam.zoom;
      ctx.setTransform(k, 0, 0, k, dpr * (cam.viewW / 2 + sx) - cam.x * k, dpr * (cam.viewH / 2 + sy) - cam.y * k);
      ctx.imageSmoothingEnabled = true;
      const b = cam.bounds(), m = 40;
      const vb = { l: b.l - m, r: b.r + m, t: b.t - m, b: b.b + m };
      ground.draw(ctx, vb);
      list.length = 0;
      for (const o of z.objects) {
        if (!game.world.isVisible(o) || sprites.isHidden(o)) continue;
        const ob = sprites.bounds(o);
        if (!ob || ob.r < vb.l || ob.l > vb.r || ob.b < vb.t || ob.t > vb.b) continue;
        if (sprites.isFlat(o)) { sprites.draw(ctx, o); continue; }
        list.push({ key: o.y + o.h, o });
      }
      const inView = (x, y) => x > vb.l && x < vb.r && y > vb.t && y < vb.b + 60;
      for (const n of z.npcs) list.push({ key: n.y, npc: n });
      for (const mob of game.mobs) if (inView(mob.x, mob.y)) list.push({ key: mob.y + (mob.def.flying ? 30 : 0), mob });
      for (const d of game.drops) if (inView(d.x, d.y)) list.push({ key: d.y - 1, drop: d });
      list.push({ key: game.player.y, player: true });
      list.sort((a, b2) => a.key - b2.key);
      const p = game.player, t = game.time;
      for (const it of list) {
        if (it.o) sprites.draw(ctx, it.o);
        else if (it.mob) {
          const mo = it.mob;
          drawMonster(ctx, mo.type, mo.x, mo.y, { t: mo.t, moving: mo.moving, face: mo.face, charging: mo.state === 'charge', windup: mo.state === 'windup' ? 1 : 0, flash: mo.flash, dying: mo.dying });
        } else if (it.npc) {
          const n = it.npc;
          drawHuman(ctx, n.look, n.x, n.y, { dir: n.face ? (n.face < 0 ? 2 : 3) : 0, t: t + n.x, moving: false, swing: -1 });
        } else if (it.drop) drawDrop(ctx, it.drop);
        else if (it.player && !(p.dead && game.mode === 'dead' && game.deadT > 0.6)) {
          drawHuman(ctx, 'hero', p.x, p.y, { dir: p.dir, walk: p.walk, moving: p.moving, swing: p.swing, aim: p.aim, hurt: p.hurt, t, dash: p.dashT > 0, cast: p.castT > 0 });
        }
      }
      for (const s of game.shots) drawShot(ctx, s);
      game.fx.drawWorld(ctx);
      game.sceneStats = { sprites: sprites.size, chunks: ground.size, drawn: list.length };
    },
    // ชั้นบน (คมชัด): ป้ายชื่อ แถบเลือด ตัวเลขดาเมจ ลูกศรนำทาง — วาดด้วยพิกัดโลกบนแคนวาสหน้าจอ
    drawOverlay(ctx, dpr) {
      const cam = game.camera, k = dpr * cam.zoom;
      ctx.setTransform(k, 0, 0, k, dpr * cam.viewW / 2 - cam.x * k, dpr * cam.viewH / 2 - cam.y * k);
      overlay(ctx);
    },
  };
}

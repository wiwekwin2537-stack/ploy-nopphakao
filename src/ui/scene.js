// วาดโลก: พื้น → ของแบน → ของ/ตัวละครเรียงตามแกน y → กระสุน/เอฟเฟกต์ → แถบเลือด
import { createGround } from '../art/ground.js';
import { createSpriteCache } from '../art/sprites.js';
import { drawHuman } from '../art/characters.js';
import { heroLook, heroGear } from './herolook.js';
import { currencyIcon } from './itemicon.js';
import { itemSprite } from '../art/items.js';
import { gemSprite } from '../art/gems.js';
import { itemName } from '../systems/items.js';
import { drawMonster } from '../art/monsters.js';
import { C, shadow, circle, poly, rrect } from '../art/draw.js';
import { gemInfo, aurasOf } from '../systems/gems.js';
import { mobName } from '../systems/monsters.js';
import { SHOT_COLORS } from '../systems/combat.js';
import { tutorialTarget } from '../systems/tutorial.js';
import { npcMark } from '../systems/quests.js';

export function createScene(game) {
  let ground = null, sprites = null, scale = 0;
  const list = [];
  const ghosts = [];   // จุดทางผ่านตอนพุ่งหลบ (ใช้วาดเส้นลม/ฝุ่น — เอฟเฟกต์ภาพเท่านั้น ไม่มีเงาตัวละคร)
  let lastT = 0;

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
    if (d.kind === 'currency') {                                   // ศิลาเจาะ / ด้ายสายสิญจน์ บนพื้น
      const y = d.y - d.z - 10 + Math.sin(d.t * 3) * 1.5;
      shadow(ctx, d.x, d.y, 6, 2.5);
      currencyIcon(ctx, d.cur, d.x, y, 7);
      return;
    }
    if (d.kind === 'coin') {
      const y = d.y - d.z, w = Math.abs(Math.cos(d.t * 5)) * 5 + 1;
      shadow(ctx, d.x, d.y, 5, 2);
      ctx.fillStyle = C.ink; ctx.beginPath(); ctx.ellipse(d.x, y - 6, w + 1.2, 6.2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = C.gold; ctx.beginPath(); ctx.ellipse(d.x, y - 6, w, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = C.goldHi; ctx.fillRect(d.x - 0.8, y - 9, 1.6, 4);
    } else if (d.kind === 'item') drawItemDrop(ctx, d);
    else drawGemDrop(ctx, d);
  }

  // แสงตามระดับ: ดี (เขียว) เรืองจาง · หายาก (ม่วง) ลำแสงสั้น · ตำนาน (แดง) ลำแสงสูงกะพริบ — แบบ PoE
  function lightBeam(ctx, x, y, col, h, t, w) {
    const g = ctx.createLinearGradient(0, y - h, 0, y);
    g.addColorStop(0, col + '00'); g.addColorStop(0.6, col + '55'); g.addColorStop(1, col + 'cc');
    ctx.fillStyle = g; ctx.fillRect(x - w / 2, y - h, w, h);
    ctx.fillStyle = '#ffffff' + (Math.sin(t * 4) > 0 ? '66' : '33'); ctx.fillRect(x - 1, y - h * 0.8, 2, h * 0.8);
  }
  function drawItemDrop(ctx, d) {
    const I = game.data.items, r = d.item.rarity, col = I.rarity[r].color, y = d.y - d.z, t = d.t;
    if (r !== 'normal') {
      const gl = ctx.createRadialGradient(d.x, y - 6, 1, d.x, y - 6, r === 'green' ? 18 : 26);
      gl.addColorStop(0, col + (r === 'green' ? '66' : '99')); gl.addColorStop(1, col + '00');
      ctx.fillStyle = gl; ctx.fillRect(d.x - 28, y - 34, 56, 56);
    }
    if (r === 'purple') lightBeam(ctx, d.x, y - 4, col, 70, t, 8);
    if (r === 'red' || r === 'unique') lightBeam(ctx, d.x, y - 4, col, 130 + Math.sin(t * 3) * 10, t, 12);   // ยูนีค = ลำแสงส้มสูงแบบ PoE
    shadow(ctx, d.x, d.y, 11, 3.5);
    const sz = 26, sp = itemSprite(I, d.item.base, sz * 2.5);
    ctx.save(); ctx.translate(d.x, y - 9 + Math.sin(t * 3) * 1.2);
    if (r !== 'normal') { ctx.shadowColor = col; ctx.shadowBlur = 6; }
    ctx.drawImage(sp, -sz / 2, -sz / 2, sz, sz);
    ctx.restore();
  }
  function drawGemDrop(ctx, d) {
    const G = gemInfo(game.data.gems, d.gem), y = d.y - d.z, bob = Math.sin(d.t * 3) * 2.5, gy = y - 14 + bob;
    const glow = ctx.createRadialGradient(d.x, gy, 1, d.x, gy, 30);
    glow.addColorStop(0, G.color + 'aa'); glow.addColorStop(1, G.color + '00');
    ctx.fillStyle = glow; ctx.fillRect(d.x - 30, gy - 30, 60, 60);
    lightBeam(ctx, d.x, y - 6, G.color, 60, d.t, 6);
    shadow(ctx, d.x, d.y, 7, 2.5);
    ctx.drawImage(gemSprite(game.data.gems, d.gem, 48), d.x - 10, gy - 10, 20, 20);
  }

  function drawShot(ctx, s) {
    const sc = SHOT_COLORS[s.kind] || SHOT_COLORS.ghost, col = [sc[2] + '99', sc[0], sc[1]];
    if (s.kind === 'bolt') {                                         // สายฟ้าบุษราคัม: เส้นหยักเรืองทอง
      ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(Math.atan2(s.vy, s.vx));
      ctx.strokeStyle = 'rgba(255,210,60,0.55)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(8, 0); ctx.stroke();
      ctx.strokeStyle = '#fffbe0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-18, 0);
      for (let i = 1; i <= 5; i++) ctx.lineTo(-18 + i * 5, (i % 2 ? -3 : 3) * Math.sin(game.time * 40 + i));
      ctx.stroke(); ctx.restore(); return;
    }
    if (s.kind === 'arrow' || s.kind === 'firearrow' || s.kind === 'amber') {   // ลูกศร: ก้านไม้ หัวเหล็ก หางขนนก (ศรเพลิงมีไฟลุกที่หัว · ศรอำพันมีแสงทองลากยาว)
      ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(Math.atan2(s.vy, s.vx));
      ctx.fillStyle = '#8a5a32'; ctx.fillRect(-14, -1, 20, 2);
      poly(ctx, [11, 0, 5, -3, 5, 3], '#dfe6ea', '#3a3a3a', 0.8);
      ctx.fillStyle = '#f4f0e8'; poly(ctx, [-14, 0, -18, -4, -11, -1], '#f4f0e8', null); poly(ctx, [-14, 0, -18, 4, -11, 1], '#f4f0e8', null);
      if (s.kind === 'amber') { const gr = ctx.createLinearGradient(-40, 0, 10, 0); gr.addColorStop(0, 'rgba(255,190,80,0)'); gr.addColorStop(1, 'rgba(255,210,120,0.8)'); ctx.fillStyle = gr; ctx.fillRect(-40, -3, 50, 6); }
      if (s.kind === 'firearrow') { ctx.fillStyle = 'rgba(255,150,40,0.85)'; ctx.beginPath(); ctx.arc(8, 0, 5 + Math.sin(game.time * 30) * 1.2, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff2a0'; ctx.beginPath(); ctx.arc(9, 0, 2.5, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore(); return;
    }
    if (s.kind === 'ice') {                                          // หอกน้ำแข็ง: แท่งแหลมตามทิศ
      ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(Math.atan2(s.vy, s.vx));
      poly(ctx, [12, 0, -6, -4, -10, 0, -6, 4], '#cfe8ff', '#3a6ab8', 1.2); ctx.fillStyle = '#ffffff'; ctx.fillRect(-4, -1, 12, 1.5);
      ctx.restore(); return;
    }
    const g = ctx.createRadialGradient(s.x, s.y, 1, s.x, s.y, s.radius * 2.6);
    g.addColorStop(0, col[0]); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(s.x, s.y, s.radius * 2.6, 0, Math.PI * 2); ctx.fill();
    circle(ctx, s.x, s.y, s.radius, col[1], null); circle(ctx, s.x, s.y, s.radius * 0.5, col[2], null);
  }

  // วงเตือนท่าบอส: แดงจางแล้วเข้มขึ้นจนเต็มวง = ระเบิด / คลื่นกระแทกเป็นวงแหวน
  function drawHazards(ctx) {
    for (const h of game.hazards || []) {
      ctx.save(); ctx.translate(h.x, h.y); ctx.scale(1, 1 / 1.4);
      if (h.kind === 'circle') {
        if (h.done) { ctx.globalAlpha = Math.max(0, h.fade / 0.3); ctx.fillStyle = 'rgba(255,220,160,0.6)'; ctx.beginPath(); ctx.arc(0, 0, h.r, 0, Math.PI * 2); ctx.fill(); }
        else {
          const k = 1 - h.t / h.max;
          ctx.fillStyle = `rgba(200,30,20,${0.14 + k * 0.2})`; ctx.beginPath(); ctx.arc(0, 0, h.r, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = 'rgba(255,90,60,0.9)'; ctx.lineWidth = 2; ctx.stroke();
          ctx.fillStyle = 'rgba(255,80,50,0.35)'; ctx.beginPath(); ctx.arc(0, 0, h.r * k, 0, Math.PI * 2); ctx.fill();
        }
      } else if (h.t > 0) {
        const k = 1 - h.t / h.max;
        ctx.strokeStyle = `rgba(255,120,60,${0.3 + k * 0.5})`; ctx.lineWidth = 3; ctx.setLineDash([8, 6]);
        ctx.beginPath(); ctx.arc(0, 0, 20 + k * 30, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      } else {
        ctx.strokeStyle = 'rgba(220,190,140,0.85)'; ctx.lineWidth = h.thick; ctx.beginPath(); ctx.arc(0, 0, h.r, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,240,200,0.9)'; ctx.lineWidth = 3; ctx.stroke();
      }
      ctx.restore();
    }
  }
  function drawPortal(ctx, o) {
    const cx = o.x + o.w / 2, cy = o.y + o.h / 2, t = game.time;
    ctx.save(); ctx.translate(cx, cy - 26);
    const gl = ctx.createRadialGradient(0, 0, 4, 0, 0, 46); gl.addColorStop(0, 'rgba(190,140,255,0.7)'); gl.addColorStop(1, 'rgba(120,80,220,0)');
    ctx.fillStyle = gl; ctx.fillRect(-46, -46, 92, 92);
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = ['#e8d8ff', '#b48aff', '#7a4ae0'][i]; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(0, 0, 18 - i * 4, 28 - i * 6, 0, t * (2 + i) , t * (2 + i) + Math.PI * 1.4); ctx.stroke();
    }
    ctx.restore();
    shadow(ctx, cx, cy + 4, 18, 5, 0.3);
  }
  // ความมืดในดันเจี้ยน: สว่างรอบตัวผู้เล่นและคบเพลิง
  function drawDark(ctx, b, z) {
    const p = game.player, t = game.time;
    const g = ctx.createRadialGradient(p.x, p.y - 20, 60, p.x, p.y - 20, 330);
    g.addColorStop(0, 'rgba(8,4,14,0)'); g.addColorStop(1, 'rgba(8,4,14,0.62)');
    ctx.fillStyle = g; ctx.fillRect(b.l - 40, b.t - 40, b.r - b.l + 80, b.b - b.t + 80);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const o of z.objects) {
      if (o.type !== 'torch' || o.x < b.l - 100 || o.x > b.r + 100 || o.y < b.t - 100 || o.y > b.b + 100) continue;
      const fl = 70 + Math.sin(t * 9 + o.x) * 6 + Math.sin(t * 23 + o.y) * 3, x = o.x + o.w / 2, y = o.y - 30;
      const tg = ctx.createRadialGradient(x, y, 2, x, y, fl);
      tg.addColorStop(0, 'rgba(255,150,60,0.32)'); tg.addColorStop(1, 'rgba(255,120,40,0)');
      ctx.fillStyle = tg; ctx.fillRect(x - fl, y - fl, fl * 2, fl * 2);
    }
    ctx.restore();
  }

  // ป้ายชื่อแบบเอโดเรีย: แผ่นสีเข้มมุมมน ขอบทอง
  function plate(ctx, text, x, y, size, color = '#f4e6c8', border = 'rgba(217,166,48,0.9)', lv = null, lvCol = '#ffd24a') {
    ctx.font = `600 ${size}px Kanit, sans-serif`;
    const lvW = lv ? ctx.measureText(lv).width + 6 : 0;
    const w = ctx.measureText(text).width + 12 + lvW, h = size + 7;
    ctx.fillStyle = 'rgba(24,16,12,0.78)'; rrect(ctx, x - w / 2, y - h / 2, w, h, h / 2.4); ctx.fill();
    ctx.strokeStyle = border; ctx.lineWidth = 1; ctx.stroke();
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = color; ctx.fillText(text, x - w / 2 + 6, y + 0.5);
    if (lv) { ctx.fillStyle = lvCol; ctx.fillText(lv, x - w / 2 + 6 + ctx.measureText(text).width + 6, y + 0.5); }
  }

  function overlay(ctx) {
    const z = game.world.zone, b = game.camera.bounds(), t = game.time;
    const vis = (x, y) => x > b.l - 60 && x < b.r + 60 && y > b.t - 60 && y < b.b + 80;
    for (const o of z.objects) {
      if (!o.label || !game.world.isVisible(o)) continue;
      const tall = { temple: 220, sala: 150, gate: 160, well: 64, stall: 66, shrine: 80, tree_bodhi: 110, ruin_gate: 150, portal: 90, stairs_down: 30, stairs_up: 30 }[o.type] || 60;
      const lx = o.x + o.w / 2, ly = o.y + o.h - tall;
      if (vis(lx, ly)) plate(ctx, o.label, lx, ly, 12, '#ffe9a8');
    }
    for (const m of game.mobs) {
      if (m.dead || !vis(m.x, m.y)) continue;
      if (m.state === 'windup' && m.def.boss && m.def.chargeSpeed) {   // เส้นเตือนก่อนพุ่ง — เฉพาะบอส (มอนธรรมดาไม่มีแถบเตือน)
        const len = m.def.chargeSpeed * m.def.chargeTime, k = 1 - m.windup / m.def.chargeWindup;
        ctx.save(); ctx.translate(m.x, m.y); ctx.rotate(Math.atan2(m.dirY, m.dirX));
        ctx.fillStyle = `rgba(220,40,30,${0.16 + k * 0.22})`; ctx.fillRect(0, -m.radius, len, m.radius * 2);
        ctx.fillStyle = 'rgba(255,90,70,0.8)'; ctx.fillRect(0, -m.radius, len * k, 2); ctx.fillRect(0, m.radius - 2, len * k, 2);
        ctx.restore();
      }
      // ชื่อมอนบนหัวทุกตัว (แบบเอโดเรีย): ชื่อ + เลเวล · บอส/มอนพิเศษป้ายทองใหญ่ · แถบเลือดใต้ชื่อเมื่อโดนตีหรือไล่ตาม
      const big = m.def.boss || m.type === 'bigboar', y = m.y - m.height - 8;
      const lvCol = m.level >= game.player.level + 3 ? '#ff7a6a' : m.level <= game.player.level - 3 ? '#a8a8a8' : '#ffd24a';   // สีเลเวลบอกความยาก
      if (big) plate(ctx, m.def.name, m.x, y - 10, 12, '#ffd24a', m.def.boss ? 'rgba(255,90,60,0.95)' : 'rgba(255,138,42,0.9)', 'Lv.' + m.level);
      else if (m.elite) { const ec = game.data.balance.elites.tiers[m.elite].color; plate(ctx, mobName(game, m), m.x, y - 9, 10.5, ec, ec, 'Lv.' + m.level, lvCol); }   // มอนพิเศษ: ชื่อสีฟ้า/เหลือง
      else plate(ctx, m.def.name, m.x, y - 8, 9.5, '#f4e6c8', 'rgba(160,120,90,0.55)', 'Lv.' + m.level, lvCol);
      if (!m.def.boss && (m.hp < m.maxHp || m.aggroed || big)) {
        const w = Math.max(28, m.radius * 2.6), x = m.x - w / 2;
        ctx.fillStyle = 'rgba(20,12,8,0.85)'; rrect(ctx, x - 1, y - 1, w + 2, 6, 3); ctx.fill();
        ctx.fillStyle = big ? '#ff8a2a' : m.elite ? game.data.balance.elites.tiers[m.elite].color : '#e0443a'; rrect(ctx, x, y, Math.max(2, w * (m.hp / m.maxHp)), 4, 2); ctx.fill();
      }
    }
    for (const n of z.npcs) {
      if (!vis(n.x, n.y)) continue;
      plate(ctx, n.name, n.x, n.y - 64, 11, '#a8e0ff', 'rgba(120,190,255,0.7)');
      const mk = npcMark(game, n.id);                               // ! ทอง = มีเรื่อง/เควสใหม่ · ! เขียว = มีรางวัลรอ
      if (mk) {
        const bb = Math.sin(t * 5) * 2;
        ctx.font = '700 20px Kanit, sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = C.ink;
        ctx.strokeText('!', n.x, n.y - 80 + bb); ctx.fillStyle = mk === 'reward' ? '#7dff8a' : C.gold; ctx.fillText('!', n.x, n.y - 80 + bb);
      }
    }
    for (const d of game.drops) {                                   // ป้ายชื่อของบนพื้นแบบ PoE
      if (d.kind === 'currency' && vis(d.x, d.y)) { const c = game.data.items.currency[d.cur]; plate(ctx, c.name, d.x, d.y - 24, 10, '#f4e6c8', 'rgba(244,240,232,0.6)'); continue; }
      if (d.kind !== 'item' || !vis(d.x, d.y)) continue;
      const I = game.data.items, col = I.rarity[d.item.rarity].color;
      plate(ctx, itemName(I, d.item), d.x, d.y - 26, 10, col, col + 'aa');
    }
    const p = game.player;
    if (!p.dead) plate(ctx, p.name || 'นักล่าพลอย', p.x, p.y - 62, 11, '#f4e6c8', 'rgba(217,166,48,0.9)', 'Lv.' + p.level);
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
      drawHazards(ctx);
      for (const o of z.objects) if (o.type === 'portal' && game.world.isVisible(o)) drawPortal(ctx, o);
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
      const p = game.player, t = game.time, dtv = Math.min(0.05, Math.max(0, t - lastT)); lastT = t;
      for (let i = ghosts.length - 1; i >= 0; i--) { ghosts[i].life -= dtv; if (ghosts[i].life <= 0) ghosts.splice(i, 1); }
      if (p.dashT > 0 && dtv > 0) ghosts.push({ x: p.x, y: p.y, a: Math.atan2(p.dashVy, p.dashVx), life: 0.3, seed: Math.random() });
      for (const it of list) {
        if (it.o) {
          const wp = it.o.type === 'waypoint', on = wp && !!game.flags['wp_' + z.id];
          sprites.draw(ctx, wp && !on ? { ...it.o, type: 'waypoint_off' } : it.o);   // ศาลวาร์ป: ยังไม่ปลด = สีเทา
          if (on) drawWaypointGlow(ctx, it.o, t);                    // ปลดแล้ว = มีแสง
        }
        else if (it.mob) {
          const mo = it.mob;
          if (mo.elite && !mo.dead) {                               // มอนพิเศษ: วงแสงสีใต้เท้า
            const ec = game.data.balance.elites.tiers[mo.elite].color;
            ctx.save(); ctx.translate(mo.x, mo.y); ctx.scale(1, 0.4); ctx.globalAlpha = 0.35 + 0.15 * Math.sin(t * 4 + mo.id);
            const gr = ctx.createRadialGradient(0, 0, 2, 0, 0, mo.radius * 1.8); gr.addColorStop(0, ec); gr.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, mo.radius * 1.8, 0, Math.PI * 2); ctx.fill(); ctx.restore();
          }
          drawMonster(ctx, mo.type, mo.x, mo.y, { t: mo.t, walk: mo.walk, moving: mo.moving, face: mo.face, charging: mo.state === 'charge', windup: mo.state === 'windup' || mo.state === 'slam' || mo.state === 'stomp' ? 1 : 0, enraged: mo.enraged, flash: mo.flash, dying: mo.dying, recoil: mo.recoil || 0, kbx: mo.kbx || 0, kby: mo.kby || 0, stun: mo.state === 'stun' });
        } else if (it.npc) {
          const n = it.npc;
          drawHuman(ctx, n.look, n.x, n.y, { dir: n.face ? (n.face < 0 ? 2 : 3) : 0, t: t + n.x, moving: false, swing: -1 });
        } else if (it.drop) drawDrop(ctx, it.drop);
        else if (it.player && !(p.dead && game.mode === 'dead' && game.deadT > 0.6)) {
          drawDashFx(ctx, ghosts);                                     // พุ่งหลบ: เส้นลมเร็ว + ฝุ่นฟุ้งที่เท้า (ไม่มีเงาตัวละคร)
          drawAuraRings(ctx, game, p, t);
          drawHuman(ctx, heroLook(game), p.x, p.y, { ...heroGear(game), dir: p.dir, walk: p.walk, amt: p.walkAmt, moving: p.moving, swing: p.swing, combo: p.combo, aim: p.aim, hurt: p.hurt, t, dash: p.dashT > 0, cast: p.castT > 0, shoot: p.shootT > 0 ? 1 - p.shootT / p.shootDur : -1, shootKind: p.shootKind });
        }
      }
      for (const s of game.shots) drawShot(ctx, s);
      game.fx.drawWorld(ctx);
      if (z.def.ground === 'dungeon') drawDark(ctx, b, z);
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

// วงออร่าใต้เท้าผู้เล่น (สีตามพลอยออร่าที่ฝัง หมุนช้าๆ)
function drawAuraRings(ctx, game, p, t) {
  const list = aurasOf(game.data.gems, p, game.data.items);
  list.forEach((a, i) => {
    const r = 20 + i * 5, rot = t * (0.8 + i * 0.3) * (i % 2 ? -1 : 1);
    ctx.save(); ctx.translate(p.x, p.y); ctx.scale(1, 0.42);
    ctx.globalAlpha = 0.18 + 0.08 * Math.sin(t * 3 + i); ctx.fillStyle = a.ring; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.75; ctx.strokeStyle = a.ring; ctx.lineWidth = 1.6; ctx.setLineDash([6, 4]); ctx.lineDashOffset = rot * 10;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  });
}

// เอฟเฟกต์พุ่งหลบ: เส้นลมสีขาวทองลากยาวตามทาง 3 ระดับ (ไหล่/เอว/เข่า) + ฝุ่นวงขยายที่เท้า — จางตามเวลา
function drawDashFx(ctx, pts) {
  for (const g of pts) {
    const k = Math.max(0, g.life / 0.3), ca = Math.cos(g.a), sa = Math.sin(g.a), len = 10 + 14 * k;
    ctx.save(); ctx.lineCap = 'round';
    for (const [hy, w, col] of [[-26, 1.6, 'rgba(255,255,255,'], [-16, 2.2, 'rgba(255,236,190,'], [-7, 1.4, 'rgba(255,255,255,']]) {
      const ox = -sa * (g.seed - 0.5) * 8, oy = ca * (g.seed - 0.5) * 4;
      ctx.strokeStyle = col + (0.75 * k).toFixed(2) + ')'; ctx.lineWidth = w * k + 0.4;
      ctx.beginPath(); ctx.moveTo(g.x + ox, g.y + hy + oy); ctx.lineTo(g.x + ox - ca * len, g.y + hy + oy - sa * len); ctx.stroke();
    }
    const r = 3 + (1 - k) * 9;                                       // ฝุ่นที่เท้า ขยายแล้วจาง
    ctx.fillStyle = `rgba(216,196,154,${(0.45 * k).toFixed(2)})`;
    ctx.beginPath(); ctx.ellipse(g.x - ca * 4, g.y + 1, r, r * 0.45, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

// ศาลวาร์ปที่ปลดแล้ว: ลำแสงฟ้าพุ่งขึ้น + ผลึกเรืองเต้นเป็นจังหวะ + ประกายลอยขึ้น
function drawWaypointGlow(ctx, o, t) {
  const cx = o.x + o.w / 2, base = o.y + o.h, py = base - 33, pulse = 0.75 + Math.sin(t * 3) * 0.25;
  ctx.save();
  const beam = ctx.createLinearGradient(0, base - 110, 0, base - 30);
  beam.addColorStop(0, 'rgba(140,220,255,0)'); beam.addColorStop(1, `rgba(140,220,255,${(0.35 * pulse).toFixed(2)})`);
  ctx.fillStyle = beam; ctx.fillRect(cx - 6, base - 110, 12, 80);
  const gl = ctx.createRadialGradient(cx, py, 1, cx, py, 22);
  gl.addColorStop(0, `rgba(220,245,255,${(0.9 * pulse).toFixed(2)})`); gl.addColorStop(0.35, `rgba(140,220,255,${(0.5 * pulse).toFixed(2)})`); gl.addColorStop(1, 'rgba(140,220,255,0)');
  ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(cx, py, 22, 0, Math.PI * 2); ctx.fill();
  for (let i = 0; i < 4; i++) {
    const ph = (t * 0.6 + i / 4) % 1, x = cx + Math.sin(i * 2.3 + t) * 9, y = py - ph * 40;
    ctx.globalAlpha = Math.sin(ph * Math.PI); ctx.fillStyle = '#e8f8ff'; ctx.fillRect(x - 1, y - 1, 2, 2);
  }
  ctx.restore();
}

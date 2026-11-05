// เห็นผู้เล่นคนอื่น (ลูกข่าย): ส่งตำแหน่ง/ท่า/ชุดของเรา 10 ครั้ง/วิ · รับรายชื่อคนในพื้นที่เดียวกัน → game.others
// วาดคนอื่นแบบเลื่อนนุ่ม (ไล่ตำแหน่งเป้าหมาย) · หลุดแล้วต่อใหม่เอง · เซิร์ฟเวอร์ดูที่ server/presence.js
import { serverUrl, session } from './online.js';

const SEND_MS = 100, SLOTS = ['head', 'body', 'legs', 'arms', 'amulet'];

// ชุดที่คนอื่นต้องเห็น (ชื่อฐานของ + ประกายตามของดีที่สุด)
export function lookPayload(p) {
  const e = p.equip || {}, L = { cls: p.cls };
  if (e.weapon) L.w = e.weapon.base;
  for (const k of SLOTS) if (e[k]) L[k] = e[k].base;
  const rs = Object.values(e).filter(Boolean).map((it) => it.rarity);
  if (rs.includes('red')) L.glow = 'red'; else if (rs.includes('purple')) L.glow = 'purple';
  return L;
}

// ตัวผู้เล่นปลอมสำหรับวาดคนอื่นด้วยฟังก์ชันชุดเดียวกับตัวเรา (lookOf/gearOf)
export function remoteBody(look) {
  const equip = {}, rarity = look.glow || 'normal';
  if (look.w) equip.weapon = { base: look.w, rarity };
  for (const k of SLOTS) if (look[k]) equip[k] = { base: look[k], rarity: 'normal' };
  return { cls: look.cls, equip };
}

export function startPresence(game, charId) {
  stopPresence(game);
  const net = game.net = { ws: null, alive: true, retry: 0, retryAt: 0, last: 0, charId, status: 'กำลังเชื่อมต่อ…' };
  game.others = new Map();
  net.connect = () => {
    if (!net.alive) return;
    net.retryAt = 0;
    const ws = net.ws = new WebSocket(serverUrl().replace(/^http/, 'ws') + '/ws');
    ws.onopen = () => ws.send(JSON.stringify({ t: 'hello', token: session.token, char: charId }));
    ws.onmessage = (ev) => {
      let m; try { m = JSON.parse(ev.data); } catch { return; }
      if (m.t === 'welcome') { net.retry = 0; net.status = 'ออนไลน์'; }
      else if (m.t === 'bye') { net.status = m.why; net.alive = false; }
      else if (m.t === 'w') {
        const seen = new Set();
        for (const r of m.p) {
          seen.add(r.id);
          const o = game.others.get(r.id) || { x: r.x, y: r.y, walk: 0 };
          Object.assign(o, { id: r.id, name: r.n, tx: r.x, ty: r.y, dir: r.d, moving: !!r.m, act: r.a, lv: r.lv, body: remoteBody(r.look || {}) });
          game.others.set(r.id, o);
        }
        for (const id of [...game.others.keys()]) if (!seen.has(id)) game.others.delete(id);
      }
    };
    ws.onclose = () => { game.others.clear(); if (!net.alive) return; net.status = 'หลุดการเชื่อมต่อ กำลังต่อใหม่…'; net.retryAt = game.time + Math.min(15, 2 ** net.retry++); };   // ต่อใหม่ใน updatePresence
  };
  net.connect();
}

export function stopPresence(game) {
  if (game.net) { game.net.alive = false; if (game.net.ws) game.net.ws.close(); }
  game.net = null;
  if (game.others) game.others.clear();
}

// เรียกทุกเฟรม: ส่งสถานะเรา (ถี่ไม่เกิน 10 ครั้ง/วิ) + เลื่อนคนอื่นเข้าหาตำแหน่งล่าสุดแบบนุ่ม
export function updatePresence(game, dt) {
  const net = game.net, p = game.player;
  if (!net || !net.ws) return;
  if (net.retryAt && game.time >= net.retryAt) net.connect();
  if (net.ws.readyState === 1 && game.time - net.last >= SEND_MS / 1000 && game.mode !== 'title') {
    net.last = game.time;
    net.ws.send(JSON.stringify({ t: 'st', z: game.world.zone.id, x: p.x, y: p.y, d: p.dir, m: p.moving ? 1 : 0, a: p.swing >= 0 ? 's' : p.castT > 0 ? 'c' : '', lv: p.level, look: lookPayload(p) }));
  }
  for (const o of game.others.values()) {
    const dx = o.tx - o.x, dy = o.ty - o.y, d = Math.hypot(dx, dy);
    if (d > 400) { o.x = o.tx; o.y = o.ty; } else { const k = Math.min(1, dt * 10); o.x += dx * k; o.y += dy * k; }
    if (o.moving) o.walk = (o.walk + dt * 2.2) % 1;
    o.swingT = o.act === 's' ? ((o.swingT || 0) + dt * 2.5) % 1 : -1;
  }
}

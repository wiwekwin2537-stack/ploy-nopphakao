// เห็นผู้เล่นคนอื่น (แบบเอโดเรีย): ทุกคนส่งตำแหน่ง/ท่า/ชุดของตัวเอง → เซิร์ฟเวอร์ส่งต่อให้คนที่อยู่พื้นที่เดียวกัน 10 ครั้ง/วิ
// มอน/ของดรอปเป็นของใครของมัน (แบบ instance ของ PoE) — ที่แชร์คือ "ตัวผู้เล่น" ให้เห็นกัน · ถ้ำลายแทงสุ่มแยกคน จึงไม่แชร์
// ข้อความ: ลูกข่าย → { t:'hello', token, char } · { t:'st', z, x, y, d, m, a, lv, look } · เซิร์ฟเวอร์ → { t:'welcome', id } · { t:'w', p:[...] }
import { WebSocketServer } from 'ws';

const PRIVATE_ZONES = new Set(['map']);
const LOOK_KEYS = ['cls', 'w', 'head', 'body', 'legs', 'arms', 'amulet', 'glow'];
const num = (v, lo, hi) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : lo);
const str = (v, n) => (typeof v === 'string' ? v.slice(0, n) : '');

export function createPresence(accounts, { maxPlayers = 200, tickMs = 100, maxMsgPerSec = 30 } = {}) {
  const wss = new WebSocketServer({ noServer: true, maxPayload: 4096 });
  const peers = new Map();                                           // ws → ผู้เล่น
  let nextId = 1;

  wss.on('connection', (ws) => {
    const me = { id: nextId++, ws, ready: false, name: '', zone: '', x: 0, y: 0, d: 0, m: 0, a: '', lv: 1, look: {}, msgs: 0, win: Date.now() };
    peers.set(ws, me);
    ws.on('message', async (raw) => {
      const now = Date.now();
      if (now - me.win > 1000) { me.win = now; me.msgs = 0; }
      if (++me.msgs > maxMsgPerSec) return;                            // ส่งถี่เกิน = ทิ้ง
      let msg; try { msg = JSON.parse(String(raw)); } catch { return; }
      if (msg.t === 'hello' && !me.ready) {
        const user = accounts.userOf(msg.token), c = user ? await accounts.ownChar(user, msg.char) : null;
        if (!c) { ws.send(JSON.stringify({ t: 'bye', why: 'ล็อกอินหมดอายุ — เข้าสู่ระบบใหม่' })); ws.close(); return; }
        if ([...peers.values()].filter((q) => q.ready).length >= maxPlayers) { ws.send(JSON.stringify({ t: 'bye', why: 'เซิร์ฟเวอร์เต็ม' })); ws.close(); return; }
        for (const q of peers.values()) if (q.ready && q.charId === c.id) q.ws.close();   // ตัวละครเดียวกันเข้าซ้ำ = เตะอันเก่า
        Object.assign(me, { ready: true, user, charId: c.id, name: c.name, look: { cls: c.cls } });
        ws.send(JSON.stringify({ t: 'welcome', id: me.id }));
        return;
      }
      if (msg.t === 'st' && me.ready) {
        me.zone = str(msg.z, 24); me.x = num(msg.x, 0, 1e5); me.y = num(msg.y, 0, 1e5); me.d = num(msg.d, 0, 3) | 0;
        me.m = msg.m ? 1 : 0; me.a = str(msg.a, 2); me.lv = num(msg.lv, 1, 999) | 0;
        if (msg.look && typeof msg.look === 'object') { const L = {}; for (const k of LOOK_KEYS) if (msg.look[k] != null) L[k] = str(msg.look[k], 24); me.look = L; }
      }
    });
    ws.on('close', () => peers.delete(ws));
    ws.on('error', () => peers.delete(ws));
  });

  // ส่งรายชื่อคนในพื้นที่เดียวกันให้ทุกคน (ไม่รวมตัวเอง)
  const timer = setInterval(() => {
    const byZone = new Map();
    for (const q of peers.values()) if (q.ready && q.zone && !PRIVATE_ZONES.has(q.zone)) { if (!byZone.has(q.zone)) byZone.set(q.zone, []); byZone.get(q.zone).push(q); }
    for (const list of byZone.values()) {
      if (list.length < 2) { for (const q of list) q.ws.readyState === 1 && q.ws.send('{"t":"w","p":[]}'); continue; }
      const rows = list.map((q) => ({ id: q.id, n: q.name, x: Math.round(q.x), y: Math.round(q.y), d: q.d, m: q.m, a: q.a, lv: q.lv, look: q.look }));
      for (const q of list) if (q.ws.readyState === 1) q.ws.send(JSON.stringify({ t: 'w', p: rows.filter((r) => r.id !== q.id) }));
    }
    for (const q of peers.values()) if (q.ready && PRIVATE_ZONES.has(q.zone) && q.ws.readyState === 1) q.ws.send('{"t":"w","p":[]}');
  }, tickMs);

  return {
    upgrade(req, socket, head) { wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req)); },
    count: () => [...peers.values()].filter((q) => q.ready).length,
    stop() { clearInterval(timer); for (const ws of peers.keys()) ws.terminate(); wss.close(); },
  };
}

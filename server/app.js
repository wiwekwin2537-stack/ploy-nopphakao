// เซิร์ฟเวอร์ออนไลน์: HTTP API (บัญชี/ตัวละคร/เซฟ) + WebSocket /ws (เห็นผู้เล่นคนอื่นในพื้นที่เดียวกัน)
// createApp({ store, secret, origins }) → { http(req,res), attach(server), stop() } — ทดสอบได้โดยไม่ต้องมี Upstash
import { createAccounts } from './accounts.js';
import { createPresence } from './presence.js';

const MAX_BODY = 600000;

export function createApp({ store, secret = 'dev-secret', origins = [], presence: popt = {} }) {
  const acc = createAccounts(store, secret), presence = createPresence(acc, popt);
  const tries = new Map();                                       // กันเดารหัส: ล็อกอิน/สมัครได้ 20 ครั้ง/นาที/IP
  const limited = (ip) => { const now = Date.now(), t = (tries.get(ip) || []).filter((x) => now - x < 60000); t.push(now); tries.set(ip, t); return t.length > 20; };

  function cors(req, res) {
    const o = req.headers.origin;
    if (o && (origins.includes('*') || origins.includes(o) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o) || o === 'null')) res.setHeader('access-control-allow-origin', o);
    res.setHeader('access-control-allow-headers', 'content-type, authorization');
    res.setHeader('access-control-allow-methods', 'GET, POST, OPTIONS');
  }
  const send = (res, code, obj) => { res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(obj)); };
  const body = (req) => new Promise((ok) => {
    let n = 0; const parts = [];
    req.on('data', (c) => { n += c.length; if (n <= MAX_BODY) parts.push(c); });
    req.on('end', () => { if (n > MAX_BODY) return ok(null); try { ok(JSON.parse(Buffer.concat(parts).toString('utf8') || '{}')); } catch { ok(null); } });
  });

  // คืน true ถ้าจัดการคำขอนี้แล้ว
  function http(req, res) {
    const url = new URL(req.url, 'http://x'), path = url.pathname;
    if (!path.startsWith('/api/')) return false;
    cors(req, res);
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return true; }
    (async () => {
      if (path === '/api/health') return send(res, 200, { ok: true, store: store.kind, online: presence.count() });
      const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
      const d = req.method === 'POST' ? await body(req) : {};
      if (d === null) return send(res, 400, { err: 'body', msg: 'ข้อมูลที่ส่งมาไม่ถูกต้องหรือใหญ่เกิน' });
      if (path === '/api/register' || path === '/api/login') {
        if (limited(ip)) return send(res, 429, { err: 'slow', msg: 'ลองบ่อยเกินไป รอสักครู่' });
        const r = path === '/api/register' ? await acc.register(d.user, d.pass) : await acc.login(d.user, d.pass);
        return send(res, r.err ? 400 : 200, r);
      }
      const user = acc.userOf(String(req.headers.authorization || '').replace(/^Bearer /, ''));
      if (!user) return send(res, 401, { err: 'auth', msg: 'กรุณาเข้าสู่ระบบใหม่' });
      let r;
      if (path === '/api/chars' && req.method === 'GET') r = await acc.listChars(user);
      else if (path === '/api/char/create') r = await acc.createChar(user, d.name, d.cls, d.save);
      else if (path === '/api/char/load') r = await acc.loadChar(user, d.id);
      else if (path === '/api/char/save') r = await acc.saveChar(user, d.id, d.save);
      else if (path === '/api/char/delete') r = await acc.deleteChar(user, d.id);
      else return send(res, 404, { err: 'path', msg: 'ไม่พบ' });
      return send(res, r.err ? 400 : 200, { user, ...r });
    })().catch((e) => { console.error('api', path, e.message); send(res, 500, { err: 'server', msg: 'เซิร์ฟเวอร์ขัดข้อง ลองใหม่อีกครั้ง' }); });
    return true;
  }

  // เห็นผู้เล่นอื่น: WebSocket ที่ /ws (รายละเอียดใน presence.js)
  function attach(server) {
    server.on('upgrade', (req, socket, head) => { if (new URL(req.url, 'http://x').pathname === '/ws') presence.upgrade(req, socket, head); else socket.destroy(); });
  }
  const stop = () => presence.stop();

  return { http, attach, stop, accounts: acc, presence };
}

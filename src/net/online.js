// ต่อเซิร์ฟเวอร์ออนไลน์: ที่อยู่เซิร์ฟเวอร์ · โทเคนล็อกอิน (จำในเครื่อง) · เรียก API (เซิร์ฟเวอร์ฟรีหลับได้ → รอปลุกนานสุด ~70 วิ)
// ที่อยู่เปลี่ยนได้ด้วย ?server=... (ใช้ในเทสต์ที่รันเซิร์ฟเวอร์ในเครื่อง)
const DEFAULT_SERVER = 'https://ploy-nopphakao-server.onrender.com';
const TOKEN_KEY = 'ploy.token', USER_KEY = 'ploy.user';

export function serverUrl() {
  try { const q = new URLSearchParams(location.search).get('server'); if (q) return q.replace(/\/$/, ''); } catch { /* นอกเบราว์เซอร์ */ }
  return DEFAULT_SERVER;
}

const ls = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* ไม่มีที่เก็บ */ } } };
export const session = {
  get token() { return ls.get(TOKEN_KEY); },
  get user() { return ls.get(USER_KEY); },
  set(token, user) { ls.set(TOKEN_KEY, token); ls.set(USER_KEY, user); },
  clear() { ls.set(TOKEN_KEY, null); ls.set(USER_KEY, null); },
};

// คืน JSON ของเซิร์ฟเวอร์เสมอ (ผิดพลาด = { err, msg } ภาษาไทย) — ไม่โยน error
export async function api(path, body, { timeout = 70000 } = {}) {
  try {
    const r = await fetch(serverUrl() + path, {
      method: body ? 'POST' : 'GET', signal: AbortSignal.timeout(timeout),
      headers: { 'content-type': 'application/json', ...(session.token ? { authorization: 'Bearer ' + session.token } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const j = await r.json().catch(() => ({ err: 'json', msg: 'เซิร์ฟเวอร์ตอบผิดรูปแบบ' }));
    if (r.status === 401) session.clear();
    return j;
  } catch (e) {
    return { err: 'net', msg: e.name === 'TimeoutError' || e.name === 'AbortError' ? 'เซิร์ฟเวอร์ไม่ตอบ ลองใหม่อีกครั้ง' : 'ติดต่อเซิร์ฟเวอร์ไม่ได้ — ตรวจอินเทอร์เน็ต' };
  }
}

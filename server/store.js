// ที่เก็บข้อมูลบัญชี/ตัวละคร: Upstash Redis (REST) บนเซิร์ฟเวอร์จริง · หน่วยความจำ (เทสต์/รันในเครื่อง)
// ทุกคีย์ขึ้นต้นด้วย "ploy:" — ใช้ฐานข้อมูลร่วมกับเอโดเรียได้โดยไม่ทับข้อมูลกัน

export const PREFIX = 'ploy:';

export function memoryStore() {
  const m = new Map();
  return {
    kind: 'memory',
    async get(k) { const v = m.get(PREFIX + k); return v === undefined ? null : JSON.parse(v); },
    async set(k, v) { m.set(PREFIX + k, JSON.stringify(v)); return true; },
    async setNew(k, v) { if (m.has(PREFIX + k)) return false; m.set(PREFIX + k, JSON.stringify(v)); return true; },
    async del(k) { m.delete(PREFIX + k); return true; },
    size: () => m.size,
  };
}

// Upstash REST: คำสั่ง Redis ส่งเป็น JSON array · setNew = SET NX (จองชื่อไม่ให้ชนกัน)
export function upstashStore(url, token, timeoutMs = 8000) {
  const base = url.replace(/\/$/, '');
  async function cmd(args) {
    const ac = new AbortController(), t = setTimeout(() => ac.abort(), timeoutMs);
    try {
      const r = await fetch(base, { method: 'POST', headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' }, body: JSON.stringify(args), signal: ac.signal });
      const j = await r.json();
      if (!r.ok || j.error) throw new Error('ที่เก็บข้อมูลตอบผิดพลาด: ' + (j.error || r.status));
      return j.result;
    } finally { clearTimeout(t); }
  }
  return {
    kind: 'upstash',
    async get(k) { const v = await cmd(['GET', PREFIX + k]); return v == null ? null : JSON.parse(v); },
    async set(k, v) { await cmd(['SET', PREFIX + k, JSON.stringify(v)]); return true; },
    async setNew(k, v) { return (await cmd(['SET', PREFIX + k, JSON.stringify(v), 'NX'])) === 'OK'; },
    async del(k) { await cmd(['DEL', PREFIX + k]); return true; },
  };
}

export function storeFromEnv(env) {
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) return upstashStore(env.UPSTASH_REDIS_REST_URL, env.UPSTASH_REDIS_REST_TOKEN);
  if (env.RENDER === 'true') throw new Error('บน Render ต้องตั้ง UPSTASH_REDIS_REST_URL และ UPSTASH_REDIS_REST_TOKEN (ไม่งั้นบัญชีหายตอนเซิร์ฟเวอร์รีสตาร์ต)');
  return memoryStore();
}

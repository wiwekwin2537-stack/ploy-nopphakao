// บัญชีผู้เล่นและตัวละคร (แบบเอโดเรีย: สมัคร → ล็อกอิน → เลือกตัวละคร) — ข้อมูลอยู่ใน store (ดู store.js)
// acct:<ชื่อผู้ใช้> = { user, salt, hash, created, chars:[id] } · char:<id> = { id, user, name, cls, level, zone, updated, save }
// name:<ชื่อตัวละครตัวเล็ก> = id (จองชื่อไม่ให้ซ้ำทั้งเซิร์ฟเวอร์) · โทเคนล็อกอินลงลายเซ็น HMAC (ไม่ต้องเก็บใน store)
import { randomBytes, scrypt as scryptCb, createHmac, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCb);
export const LIMITS = { chars: 4, saveBytes: 400000, tokenDays: 30, classes: ['warrior', 'duelist', 'ranger', 'shadow', 'shaman', 'templar'] };
const USER_RE = /^[a-z0-9_]{3,16}$/;

export function createAccounts(store, secret) {
  const sign = (s) => createHmac('sha256', secret).update(s).digest('base64url');
  const err = (code, msg) => ({ err: code, msg });

  function makeToken(user) { const body = Buffer.from(JSON.stringify({ u: user, e: Date.now() + LIMITS.tokenDays * 864e5 })).toString('base64url'); return body + '.' + sign(body); }
  function userOf(token) {
    if (typeof token !== 'string' || !token.includes('.')) return null;
    const [body, sig] = token.split('.'), want = sign(body);
    if (!sig || sig.length !== want.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(want))) return null;
    try { const d = JSON.parse(Buffer.from(body, 'base64url').toString()); return d.e > Date.now() ? d.u : null; } catch { return null; }
  }
  const hashOf = async (pass, salt) => (await scrypt(pass, salt, 32)).toString('base64');

  async function register(user, pass) {
    user = String(user || '').trim().toLowerCase();
    if (!USER_RE.test(user)) return err('user', 'ชื่อผู้ใช้ต้องเป็นอังกฤษตัวเล็ก/ตัวเลข/_ ยาว 3–16 ตัว');
    if (typeof pass !== 'string' || pass.length < 6 || pass.length > 64) return err('pass', 'รหัสผ่านต้องยาว 6–64 ตัว');
    const salt = randomBytes(16).toString('base64');
    const rec = { user, salt, hash: await hashOf(pass, salt), created: Date.now(), chars: [] };
    if (!(await store.setNew('acct:' + user, rec))) return err('taken', 'ชื่อผู้ใช้นี้มีคนใช้แล้ว');
    return { token: makeToken(user), user };
  }

  async function login(user, pass) {
    user = String(user || '').trim().toLowerCase();
    const rec = USER_RE.test(user) ? await store.get('acct:' + user) : null;
    if (!rec || typeof pass !== 'string') return err('login', 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    const h = await hashOf(pass, rec.salt);
    if (!timingSafeEqual(Buffer.from(h), Buffer.from(rec.hash))) return err('login', 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    return { token: makeToken(user), user };
  }

  const summary = (c) => ({ id: c.id, name: c.name, cls: c.cls, level: c.level, zone: c.zone, updated: c.updated });
  async function listChars(user) {
    const rec = await store.get('acct:' + user);
    if (!rec) return err('auth', 'ไม่พบบัญชี');
    const out = [];
    for (const id of rec.chars) { const c = await store.get('char:' + id); if (c) out.push(summary(c)); }
    return { chars: out };
  }

  // เซฟต้องเป็นของตัวละครนี้จริง (ชื่อ/อาชีพตรง) และไม่ใหญ่เกิน — ตรวจละเอียดอีกชั้นที่เกม (save.js validate) ตอนโหลด
  function checkSave(save, c) {
    if (!save || typeof save !== 'object' || typeof save.v !== 'number') return 'เซฟไม่ถูกต้อง';
    if (save.name !== c.name || save.cls !== c.cls) return 'เซฟไม่ใช่ของตัวละครนี้';
    if (JSON.stringify(save).length > LIMITS.saveBytes) return 'เซฟใหญ่เกิน';
    if (!Number.isInteger(save.level) || save.level < 1 || save.level > 999) return 'เลเวลในเซฟไม่ถูกต้อง';
    return null;
  }

  async function createChar(user, name, cls, save) {
    const rec = await store.get('acct:' + user);
    if (!rec) return err('auth', 'ไม่พบบัญชี');
    name = String(name || '').trim();
    if (!name || name.length > 16 || /[<>]/.test(name)) return err('name', 'ชื่อตัวละครยาว 1–16 ตัว');
    if (!LIMITS.classes.includes(cls)) return err('cls', 'อาชีพไม่ถูกต้อง');
    if (rec.chars.length >= LIMITS.chars) return err('full', `สร้างตัวละครได้สูงสุด ${LIMITS.chars} ตัวต่อบัญชี`);
    const id = randomBytes(9).toString('base64url'), c = { id, user, name, cls, level: 1, zone: 'road', updated: Date.now(), save: null };
    const bad = save ? checkSave(save, c) : null;
    if (bad) return err('save', bad);
    if (!(await store.setNew('name:' + name.toLowerCase(), id))) return err('name', 'ชื่อตัวละครนี้มีคนใช้แล้ว');
    if (save) Object.assign(c, { save, level: save.level, zone: save.zone });
    await store.set('char:' + id, c);
    rec.chars.push(id); await store.set('acct:' + user, rec);
    return { char: summary(c) };
  }

  async function ownChar(user, id) { const c = typeof id === 'string' ? await store.get('char:' + id) : null; return c && c.user === user ? c : null; }

  async function loadChar(user, id) { const c = await ownChar(user, id); return c ? { char: summary(c), save: c.save } : err('nochar', 'ไม่พบตัวละคร'); }

  async function saveChar(user, id, save) {
    const c = await ownChar(user, id);
    if (!c) return err('nochar', 'ไม่พบตัวละคร');
    const bad = checkSave(save, c);
    if (bad) return err('save', bad);
    Object.assign(c, { save, level: save.level, zone: save.zone, updated: Date.now() });
    await store.set('char:' + id, c);
    return { ok: true };
  }

  async function deleteChar(user, id) {
    const c = await ownChar(user, id), rec = await store.get('acct:' + user);
    if (!c || !rec) return err('nochar', 'ไม่พบตัวละคร');
    rec.chars = rec.chars.filter((x) => x !== id);
    await store.set('acct:' + user, rec); await store.del('char:' + id); await store.del('name:' + c.name.toLowerCase());
    return { ok: true };
  }

  return { register, login, userOf, listChars, createChar, loadChar, saveChar, deleteChar, ownChar };
}

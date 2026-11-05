// เซิร์ฟเวอร์ออนไลน์: สมัคร/ล็อกอิน · ตัวละคร (สร้าง/โหลด/เซฟ/ลบ ชื่อไม่ซ้ำ จำกัดจำนวน) · กันข้อมูลปลอม · เห็นผู้เล่นอื่นในพื้นที่เดียวกัน
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import WebSocket from 'ws';
import { createApp } from '../../server/app.js';
import { memoryStore } from '../../server/store.js';

async function boot() {
  const app = createApp({ store: memoryStore(), secret: 's', presence: { tickMs: 30 } });
  const srv = http.createServer((q, s) => { if (!app.http(q, s)) { s.writeHead(404); s.end(); } });
  app.attach(srv); await new Promise((ok) => srv.listen(0, ok));
  const base = 'http://127.0.0.1:' + srv.address().port;
  const api = async (path, body, token) => { const r = await fetch(base + path, { method: body ? 'POST' : 'GET', headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined }); return { code: r.status, ...(await r.json()) }; };
  return { app, srv, base, api, close: () => { app.stop(); srv.close(); } };
}
const save = (name, cls, extra = {}) => ({ v: 14, name, cls, level: 3, zone: 'town', ...extra });

test('สมัคร/ล็อกอิน: ชื่อซ้ำไม่ได้ · รหัสผิดไม่ได้ · ข้อมูลไม่ครบบอกเหตุผลภาษาไทย · โทเคนปลอมใช้ไม่ได้', async () => {
  const S = await boot();
  try {
    const r = await S.api('/api/register', { user: 'Chatchai', pass: '123456' });
    assert.ok(r.token); assert.equal(r.user, 'chatchai', 'ชื่อผู้ใช้เป็นตัวเล็ก');
    assert.equal((await S.api('/api/register', { user: 'chatchai', pass: 'abcdef' })).err, 'taken');
    assert.match((await S.api('/api/register', { user: 'ab', pass: '123456' })).msg, /3–16/);
    assert.match((await S.api('/api/register', { user: 'abc', pass: '12' })).msg, /6–64/);
    assert.equal((await S.api('/api/login', { user: 'chatchai', pass: 'wrong1' })).err, 'login');
    assert.ok((await S.api('/api/login', { user: 'CHATCHAI', pass: '123456' })).token);
    assert.equal((await S.api('/api/chars', null, r.token + 'x')).code, 401);
    assert.equal((await S.api('/api/chars', null, 'abc.def')).code, 401);
  } finally { S.close(); }
});

test('ตัวละคร: สร้าง/เซฟ/โหลด/ลบ · ชื่อไม่ซ้ำทั้งเซิร์ฟเวอร์ · สูงสุด 4 ตัว · แตะตัวละครคนอื่นไม่ได้ · เซฟไม่ตรงตัวละครถูกปฏิเสธ', async () => {
  const S = await boot();
  try {
    const a = (await S.api('/api/register', { user: 'aaa', pass: '123456' })).token, b = (await S.api('/api/register', { user: 'bbb', pass: '123456' })).token;
    const c = (await S.api('/api/char/create', { name: 'พลอย', cls: 'shaman', save: save('พลอย', 'shaman') }, a)).char;
    assert.equal(c.level, 3); assert.equal(c.zone, 'town');
    assert.equal((await S.api('/api/char/create', { name: 'พลอย', cls: 'warrior' }, b)).err, 'name', 'ชื่อซ้ำข้ามบัญชี');
    assert.equal((await S.api('/api/char/create', { name: 'x', cls: 'wizard' }, b)).err, 'cls');
    assert.ok((await S.api('/api/char/save', { id: c.id, save: save('พลอย', 'shaman', { level: 9, zone: 'field' }) }, a)).ok);
    assert.equal((await S.api('/api/chars', null, a)).chars[0].level, 9);
    assert.equal((await S.api('/api/char/load', { id: c.id }, a)).save.zone, 'field');
    assert.equal((await S.api('/api/char/load', { id: c.id }, b)).err, 'nochar', 'โหลดตัวละครคนอื่นไม่ได้');
    assert.equal((await S.api('/api/char/save', { id: c.id, save: save('พลอย', 'shaman') }, b)).err, 'nochar', 'เซฟทับตัวละครคนอื่นไม่ได้');
    assert.equal((await S.api('/api/char/save', { id: c.id, save: save('คนอื่น', 'shaman') }, a)).err, 'save', 'เซฟชื่อไม่ตรง');
    assert.equal((await S.api('/api/char/save', { id: c.id, save: save('พลอย', 'shaman', { level: 1e6 }) }, a)).err, 'save');
    for (const n of ['b1', 'b2', 'b3']) await S.api('/api/char/create', { name: n, cls: 'warrior' }, a);
    assert.equal((await S.api('/api/char/create', { name: 'b4', cls: 'warrior' }, a)).err, 'full');
    assert.ok((await S.api('/api/char/delete', { id: c.id }, a)).ok);
    assert.equal((await S.api('/api/chars', null, a)).chars.length, 3);
    assert.ok((await S.api('/api/char/create', { name: 'พลอย', cls: 'ranger' }, b)).char, 'ลบแล้วชื่อว่างให้คนอื่นใช้');
  } finally { S.close(); }
});

test('เห็นกัน: อยู่พื้นที่เดียวกันเห็นตำแหน่ง/ชื่อ/เลเวล/ชุด · ย้ายพื้นที่แล้วหาย · ถ้ำลายแทงไม่แชร์ · ปิดเกมแล้วหาย · โทเคนผิดถูกตัด', async () => {
  const S = await boot();
  try {
    const t1 = (await S.api('/api/register', { user: 'p1x', pass: '123456' })).token, t2 = (await S.api('/api/register', { user: 'p2x', pass: '123456' })).token;
    const c1 = (await S.api('/api/char/create', { name: 'หนึ่ง', cls: 'warrior' }, t1)).char, c2 = (await S.api('/api/char/create', { name: 'สอง', cls: 'ranger' }, t2)).char;
    const join = (token, char) => new Promise((ok) => {
      const w = new WebSocket(S.base.replace('http', 'ws') + '/ws');
      let last = null;
      w.on('message', (m) => { const j = JSON.parse(m); if (j.t === 'w') last = j.p; if (j.t === 'welcome') ok(api); });
      w.on('open', () => w.send(JSON.stringify({ t: 'hello', token, char })));
      const api = { w, st: (o) => w.send(JSON.stringify({ t: 'st', ...o })), see: async (pred, ms = 1500) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (last && pred(last)) return last; await new Promise((r) => setTimeout(r, 15)); } return null; } };
    });
    const A = await join(t1, c1.id), B = await join(t2, c2.id);
    A.st({ z: 'town', x: 100, y: 200, d: 1, m: 1, lv: 5, look: { cls: 'warrior', w: 'bamboo_sword', glow: 'red', junk: 'x'.repeat(99) } });
    B.st({ z: 'town', x: 300, y: 200, d: 0, lv: 2, look: { cls: 'ranger' } });
    const seen = await B.see((p) => p.length === 1);
    assert.ok(seen, 'B ต้องเห็น A'); assert.equal(seen[0].n, 'หนึ่ง'); assert.equal(seen[0].x, 100); assert.equal(seen[0].lv, 5);
    assert.equal(seen[0].look.w, 'bamboo_sword'); assert.equal(seen[0].look.junk, undefined, 'ค่าชุดแปลกถูกตัดทิ้ง');
    assert.ok(await A.see((p) => p.length === 1 && p[0].n === 'สอง'));
    B.st({ z: 'field', x: 1, y: 1 });
    assert.ok(await A.see((p) => p.length === 0), 'ย้ายพื้นที่แล้วหาย');
    A.st({ z: 'map', x: 5, y: 5 }); B.st({ z: 'map', x: 6, y: 6 });
    assert.ok(await B.see((p) => p.length === 0), 'ถ้ำลายแทงไม่แชร์');
    A.st({ z: 'town', x: 2, y: 2 }); B.st({ z: 'town', x: 1, y: 1 });
    assert.ok(await A.see((p) => p.length === 1));
    B.w.close();
    assert.ok(await A.see((p) => p.length === 0), 'ปิดเกมแล้วหาย');
    const bad = new WebSocket(S.base.replace('http', 'ws') + '/ws');
    await new Promise((ok) => bad.on('open', ok)); bad.send(JSON.stringify({ t: 'hello', token: 'x.y', char: c1.id }));
    await new Promise((ok) => bad.on('close', ok));
    A.w.close();
  } finally { S.close(); }
});

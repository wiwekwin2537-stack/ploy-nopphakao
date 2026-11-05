// เล่นออนไลน์จริงในเบราว์เซอร์ 2 เครื่อง กับเซิร์ฟเวอร์ในเครื่อง (ที่เก็บในหน่วยความจำ):
// หน้าแรก → เล่นออนไลน์ → สมัคร (พิมพ์ในช่องจริง) → เลือกตัวละคร → สร้าง → เข้าเกม → เห็นกันในพื้นที่เดียวกัน
// คนละพื้นที่ = ไม่เห็น · เซฟขึ้นเซิร์ฟเวอร์ · ออกแล้วเข้าใหม่ได้ตัวเดิม · ลบตัวละคร · ทุกหน้าต่างมี ✕
// รัน: node tests/browser/online.js   (ต้อง build ก่อน)
import http from 'node:http';
import { openGame, G, makeSuite } from './lib.js';
import { createApp } from '../../server/app.js';
import { memoryStore } from '../../server/store.js';

const SHOTS = process.env.SHOTS || 'tests/browser/shots';
const app = createApp({ store: memoryStore(), secret: 'test' });
const srv = http.createServer((q, s) => { if (!app.http(q, s)) { s.writeHead(404); s.end(); } });
app.attach(srv);
await new Promise((ok) => srv.listen(0, '127.0.0.1', ok));
const query = 'test&server=' + encodeURIComponent('http://127.0.0.1:' + srv.address().port);

const suite = makeSuite(), { check, assert } = suite;
const A = await openGame({ w: 1000, h: 560, query }), B = await openGame({ w: 1000, h: 560, query });
suite.setPage(A.page);

const mode = (page) => G(page, () => __ploy.game.mode);
async function waitFor(page, fn, arg, ms = 6000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { if (await G(page, fn, arg)) return true; await page.waitForTimeout(60); }
  return false;
}
const center = (r) => (r.r ? { x: r.x, y: r.y } : { x: r.x + r.w / 2, y: r.y + r.h / 2 });   // ปุ่มวงกลม (✕) หรือกล่อง
async function tap(page, r) { const c = center(r); await page.mouse.click(c.x, c.y); await page.waitForTimeout(90); }

// สมัคร + สร้างตัวละคร ผ่านหน้าจอจริงทั้งหมด
async function signUpAndCreate(page, user, name, cls) {
  const btn = await G(page, () => { const g = __ploy.game; return __ploy.titleButtons().find((b) => b.id === 'online'); });
  assert(btn, 'หน้าแรกไม่มีปุ่มเล่นออนไลน์');
  await tap(page, btn);
  assert((await mode(page)) === 'login', 'กดเล่นออนไลน์แล้วไม่ไปหน้าเข้าสู่ระบบ');
  const L = await G(page, () => __ploy.loginLayout());
  await tap(page, L.tabs[1]);
  await page.fill('input[data-field=loginuser]', user);
  await page.fill('input[data-field=loginpass]', 'secret123');
  await tap(page, L.go);
  assert(await waitFor(page, () => __ploy.game.mode === 'chars' && __ploy.game.chars.list), 'สมัครแล้วไม่ไปหน้าเลือกตัวละคร: ' + (await G(page, () => __ploy.game.login && __ploy.game.login.msg)));
  const C = await G(page, () => __ploy.charsLayout());
  await tap(page, C.create);
  assert((await mode(page)) === 'create', 'กดสร้างตัวละครแล้วไม่ไปหน้าสร้าง');
  const K = await G(page, () => __ploy.createLayout());
  await tap(page, K.cards.find((c) => c.id === cls));
  await page.fill('input[data-field=charname]', name);
  await tap(page, K.go);
  assert(await waitFor(page, () => __ploy.game.mode === 'play' || __ploy.game.mode === 'dialog'), 'สร้างตัวละครแล้วไม่เข้าเกม: ' + (await G(page, () => __ploy.game.create && __ploy.game.create.err)));
  await G(page, () => { const g = __ploy.game; g.dialog = null; g.mode = 'play'; __ploy.enterZone(g, 'town', 20.5 * 32, 17.5 * 32); g.mode = 'play'; });
}

await check('สมัคร → สร้างตัวละคร → เข้าเกม (2 เครื่อง)', async () => {
  await signUpAndCreate(A.page, 'alpha_one', 'ทองคำ', 'shaman');
  await signUpAndCreate(B.page, 'beta_two', 'เงินยวง', 'ranger');
  const a = await G(A.page, () => ({ cls: __ploy.game.player.cls, name: __ploy.game.player.name, key: __ploy.game.saveKey, online: !!__ploy.game.online }));
  assert(a.cls === 'shaman' && a.name === 'ทองคำ' && a.online && /^ploy\.online\./.test(a.key), 'ตัวละครออนไลน์ไม่ตรง: ' + JSON.stringify(a));
});

await check('อยู่พื้นที่เดียวกัน = เห็นกัน (ชื่อ เลเวล ชุด เดินตาม)', async () => {
  await G(B.page, () => { const p = __ploy.game.player; p.x = 22 * 32; p.y = 17.5 * 32; });
  assert(await waitFor(A.page, () => [...__ploy.game.others.values()].some((o) => o.name === 'เงินยวง')), 'เครื่อง A ไม่เห็นเครื่อง B');
  assert(await waitFor(B.page, () => [...__ploy.game.others.values()].some((o) => o.name === 'ทองคำ')), 'เครื่อง B ไม่เห็นเครื่อง A');
  const o = await G(A.page, () => [...__ploy.game.others.values()][0]);
  assert(o.body.cls === 'ranger' && o.lv === 1 && o.body.equip.weapon, 'ข้อมูลคนอื่นไม่ครบ: ' + JSON.stringify(o));
  await G(B.page, () => { __ploy.game.player.x += 60; });
  assert(await waitFor(A.page, () => { const o = [...__ploy.game.others.values()][0]; return Math.abs(o.x - (22 * 32 + 60)) < 3; }), 'คนอื่นเดินแล้วไม่ขยับตาม');
  await A.page.waitForTimeout(200);
  await A.page.screenshot({ path: SHOTS + '/online-see.png' });
});

await check('คนละพื้นที่ = ไม่เห็นกัน', async () => {
  await G(B.page, () => { const g = __ploy.game; __ploy.enterZone(g, 'field'); g.mode = 'play'; });
  assert(await waitFor(A.page, () => __ploy.game.others.size === 0), 'B ไปพื้นที่อื่นแล้ว A ยังเห็น');
  await G(B.page, () => { const g = __ploy.game; __ploy.enterZone(g, 'town', 22 * 32, 17.5 * 32); g.mode = 'play'; });
  assert(await waitFor(A.page, () => __ploy.game.others.size === 1), 'B กลับมาแล้ว A ไม่เห็น');
});

await check('เซฟขึ้นเซิร์ฟเวอร์ · เข้าใหม่ได้ตัวเดิม · เซฟออฟไลน์ไม่ถูกแตะ', async () => {
  await G(A.page, () => { const g = __ploy.game; g.player.coins = 4321; __ploy.writeSave(g); });
  const user = 'alpha_one', acc = app.accounts;
  let saved = null;
  for (let i = 0; i < 60 && !(saved && saved.coins === 4321); i++) { await A.page.waitForTimeout(200); const l = await acc.listChars(user); const c = l.chars[0]; saved = (await acc.loadChar(user, c.id)).save; }
  assert(saved && saved.coins === 4321 && saved.name === 'ทองคำ', 'เซฟไม่ขึ้นเซิร์ฟเวอร์');
  const off = await G(A.page, () => localStorage.getItem('ploy.save'));
  assert(off === null, 'เล่นออนไลน์แล้วไปเขียนทับเซฟออฟไลน์');
  // ปิดแล้วเปิดใหม่ (ยังจำการล็อกอิน) → หน้าเลือกตัวละคร → เข้าเกมได้เงินเท่าเดิม
  await A.page.reload(); await A.page.waitForFunction(() => globalThis.__ploy && __ploy.loop.stats.frames > 2);
  await tap(A.page, await G(A.page, () => __ploy.titleButtons().find((b) => b.id === 'online')));
  assert(await waitFor(A.page, () => __ploy.game.mode === 'chars' && __ploy.game.chars.list && __ploy.game.chars.list.length === 1), 'เปิดใหม่แล้วไม่เห็นตัวละครเดิม');
  await A.page.screenshot({ path: SHOTS + '/online-chars.png' });
  await tap(A.page, (await G(A.page, () => __ploy.charsLayout())).play);
  assert(await waitFor(A.page, () => __ploy.game.mode === 'play' || __ploy.game.mode === 'dialog'), 'กดเข้าเกมแล้วไม่เข้า');
  const p = await G(A.page, () => ({ coins: __ploy.game.player.coins, name: __ploy.game.player.name }));
  assert(p.coins === 4321 && p.name === 'ทองคำ', 'โหลดตัวละครไม่ตรง: ' + JSON.stringify(p));
  assert(await waitFor(B.page, () => __ploy.game.others.size === 1), 'A เข้าใหม่แล้ว B ไม่เห็น');
});

await check('หน้าเข้าสู่ระบบ/เลือกตัวละครมี ✕ · รหัสผิดบอกเหตุผล · ลบตัวละครต้องแตะสองครั้ง', async () => {
  const P = B.page;
  await P.reload(); await P.waitForFunction(() => globalThis.__ploy && __ploy.loop.stats.frames > 2);
  await G(P, () => { __ploy.online.session.clear(); __ploy.online.openLogin(); });
  const L0 = await G(P, () => __ploy.loginLayout());
  assert(L0 && L0.close, 'ไม่มี ✕: ' + JSON.stringify(L0));
  await tap(P, L0.close);
  assert((await mode(P)) === 'title', '✕ หน้าเข้าสู่ระบบไม่ปิด');
  await G(P, () => __ploy.online.openLogin());
  const L = await G(P, () => __ploy.loginLayout());
  await P.fill('input[data-field=loginuser]', 'beta_two'); await P.fill('input[data-field=loginpass]', 'wrongpass');
  await tap(P, L.go);
  assert(await waitFor(P, () => /ไม่ถูกต้อง/.test(__ploy.game.login.msg)), 'รหัสผิดไม่บอกเหตุผล');
  await P.fill('input[data-field=loginpass]', 'secret123'); await tap(P, L.go);
  assert(await waitFor(P, () => __ploy.game.mode === 'chars' && __ploy.game.chars.list), 'ล็อกอินไม่ผ่าน');
  const C = await G(P, () => __ploy.charsLayout());
  await tap(P, C.del);
  assert((await G(P, () => __ploy.game.chars.list.length)) === 1 && (await G(P, () => __ploy.game.chars.confirmDel)), 'แตะลบครั้งแรกต้องถามยืนยัน');
  await tap(P, C.del);
  assert(await waitFor(P, () => __ploy.game.chars.list && __ploy.game.chars.list.length === 0 && !__ploy.game.chars.busy), 'แตะครั้งที่สองแล้วไม่ลบ');
  await tap(P, C.close);
  assert((await mode(P)) === 'title', '✕ หน้าเลือกตัวละครไม่ปิด');
  assert(!(await G(P, () => [...document.querySelectorAll('input')].some((e) => e.style.display !== 'none'))), 'ช่องพิมพ์ค้างบนจอ');
});

await check('ไม่มี error ในเบราว์เซอร์', async () => { const e = [...A.errors, ...B.errors]; assert(!e.length, e.join(' | ')); });

await A.browser.close(); await B.browser.close(); app.stop(); srv.close();
process.exit(suite.finish() ? 0 : 1);

// เปิดเกมใน Chrome จริงแบบไม่มีหน้าจอ สำหรับเทสต์
import { chromium } from 'playwright-core';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

export async function openGame({ w = 844, h = 390, query = 'test', mobile = false } = {}) {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: mobile ? 2 : 1, hasTouch: mobile, isMobile: mobile });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g|ERR_|Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto(pathToFileURL(resolve('dist/index.html')).href + '?' + query);
  await page.waitForFunction(() => globalThis.__ploy && globalThis.__ploy.loop.stats.frames > 2);
  return { browser, page, errors };
}

export const G = (page, fn, arg) => page.evaluate(fn, arg);

// ชุดเทสต์: check(ชื่อ, ฟังก์ชัน) เก็บผล · ข้อที่ล้มแนบสภาพเกมตอนนั้น · ปิดหน้าต่างค้างก่อนข้อถัดไป · finish() พิมพ์สรุป คืน true ถ้าผ่านหมด
export function makeSuite() {
  const results = [];
  let page = null;
  async function check(name, fn) {
    const t0 = Date.now();
    try { const note = await fn(); results.push({ ok: true, name, note, ms: Date.now() - t0 }); }
    catch (e) {
      const why = page ? await page.evaluate(() => { const g = globalThis.__ploy && __ploy.game; if (!g || !g.player) return ''; const p = g.player; const near = g.mobs.filter((m) => !m.dead && Math.hypot(m.x - p.x, m.y - p.y) < 200).length; return ` [โหมด ${g.mode} · เลือด ${Math.ceil(p.hp)} · ${g.world.zone.id} · มอนใกล้ ${near} · ui ${g.input.uiMode}]`; }).catch(() => '') : '';
      results.push({ ok: false, name, note: e.message + why, ms: Date.now() - t0 });
    }
    if (page) await page.evaluate(() => { const g = globalThis.__ploy && __ploy.game; if (g && (g.mode === 'bag' || g.mode === 'tree')) { g.mode = 'play'; g.input.setUiMode(false); } }).catch(() => {});
  }
  const assert = (c, msg) => { if (!c) throw new Error(msg); };
  function finish() {
    const pass = results.filter((r) => r.ok).length;
    for (const r of results) console.log(`${r.ok ? '✅' : '❌'} ${r.name}${r.note ? ' — ' + r.note : ''} (${(r.ms / 1000).toFixed(1)}s)`);
    console.log(`\nผ่าน ${pass}/${results.length}`);
    return pass === results.length;
  }
  return { check, assert, finish, setPage: (p) => { page = p; } };
}

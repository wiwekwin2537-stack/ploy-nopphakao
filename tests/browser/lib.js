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

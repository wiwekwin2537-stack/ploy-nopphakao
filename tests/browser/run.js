// เทสต์ในเบราว์เซอร์จริง: เล่นบทนำด้วยปุ่มจริง เซฟ/โหลด มือถือ และความเร็ว
// รัน: node tests/browser/run.js   (ต้อง build ก่อน)
import { openGame, G } from './lib.js';
import { mkdirSync } from 'node:fs';

const SHOTS = process.env.SHOTS || 'tests/browser/shots';
mkdirSync(SHOTS, { recursive: true });
const results = [];
async function check(name, fn) {
  const t0 = Date.now();
  try { const note = await fn(); results.push({ ok: true, name, note, ms: Date.now() - t0 }); }
  catch (e) { results.push({ ok: false, name, note: e.message, ms: Date.now() - t0 }); }
}
const assert = (c, msg) => { if (!c) throw new Error(msg); };
const state = (page) => G(page, () => { const g = __ploy.game, p = g.player; return { mode: g.mode, step: g.flags.tutStep, zone: g.world.zone.id, x: p.x, y: p.y, hp: p.hp, lv: p.level, xp: p.xp, coins: p.coins, gems: p.gems.slice(), mobs: g.mobs.length, done: !!g.flags.tutorialDone }; });
const wait = (page, fn, arg, ms = 8000) => page.waitForFunction(fn, arg, { timeout: ms });
async function closeDialogs(page) {
  for (let i = 0; i < 20; i++) {
    if ((await state(page)).mode !== 'dialog') return;
    await page.keyboard.press('KeyE'); await page.waitForTimeout(60);
  }
}
async function hold(page, key, ms) { await page.keyboard.down(key); await page.waitForTimeout(ms); await page.keyboard.up(key); }
async function killTutorialMob(page, type) {
  for (let i = 0; i < 60; i++) {
    const alive = await G(page, (t) => {
      const g = __ploy.game, m = g.mobs.find((q) => q.tutorial && q.type === t && !q.dead);
      if (!m) return false;
      if (m.state !== 'charge') { g.player.x = m.x - 28; g.player.y = m.y; g.player.invuln = 0.5; }
      return true;
    }, type);
    if (!alive) return;
    await page.keyboard.press('KeyJ'); await page.waitForTimeout(470);
  }
  throw new Error('ฆ่า ' + type + ' ไม่ตาย');
}

const { browser, page, errors } = await openGame({ w: 844, h: 390 });
await G(page, () => localStorage.clear());
await page.reload();
await wait(page, () => globalThis.__ploy && __ploy.loop.stats.frames > 2);

await check('หน้าแรก: กดปุ่ม "เริ่มผจญภัย" ด้วยเมาส์แล้วเข้าเกม', async () => {
  await page.screenshot({ path: SHOTS + '/01-title.png' });
  await page.mouse.click(422, 265);
  await page.waitForTimeout(200);
  const s = await state(page);
  assert(s.zone === 'road' && s.mode === 'dialog', `ได้ ${s.mode}/${s.zone}`);
});

await check('บทนำ 1: ปิดบทพูด แล้วเดินด้วยปุ่ม D', async () => {
  await closeDialogs(page);
  await hold(page, 'KeyD', 800);
  const s = await state(page);
  assert(s.step === 'attack', 'ขั้น = ' + s.step);
  await page.screenshot({ path: SHOTS + '/02-attack-step.png' });
});

await check('บทนำ 2: ฟันลูกหมูป่าด้วยปุ่ม J จนตายครบ', async () => {
  await killTutorialMob(page, 'piglet');
  await wait(page, () => __ploy.game.flags.tutStep === 'dash');
  const s = await state(page);
  assert(s.xp > 0, 'ต้องได้ XP');
});

await check('บทนำ 3: พญาหมูป่าพุ่งชน → กด Space หลบทัน → ไม่เสียเลือด', async () => {
  await G(page, () => { const g = __ploy.game, m = g.mobs.find((q) => q.type === 'bigboar'); g.player.x = m.x - 180; g.player.y = m.y; m.aggroed = true; m.chargeCd = 0; });
  await wait(page, () => __ploy.game.mobs.some((m) => m.type === 'bigboar' && m.state === 'charge'), null, 6000);
  await page.screenshot({ path: SHOTS + '/03-charge.png' });
  const hp0 = (await state(page)).hp;
  await wait(page, () => { const g = __ploy.game, m = g.mobs.find((q) => q.type === 'bigboar'); return m && Math.hypot(m.x - g.player.x, m.y - g.player.y) < 70; }, null, 3000);
  await page.keyboard.press('Space');
  await page.waitForTimeout(600);
  const s = await state(page);
  const dodged = await G(page, () => __ploy.game.tutDodged === true);
  assert(dodged, 'ระบบต้องนับว่าหลบได้');
  assert(s.hp >= hp0 - 0.5, `เสียเลือด ${hp0}→${s.hp}`);
});

await check('บทนำ 4: ฆ่าพญาหมูป่า → ทับทิมตก → เดินไปเก็บ → ได้สกิล', async () => {
  await killTutorialMob(page, 'bigboar');
  await wait(page, () => __ploy.game.drops.some((d) => d.gem === 'ruby') || __ploy.game.player.gems.includes('ruby'));
  await page.screenshot({ path: SHOTS + '/04-ruby.png' });
  await G(page, () => { const g = __ploy.game, d = g.drops.find((q) => q.gem === 'ruby'); if (d) { g.player.x = d.x - 30; g.player.y = d.y; } });
  await wait(page, () => __ploy.game.player.gems.includes('ruby'), null, 3000);
  await closeDialogs(page);
  const s = await state(page);
  assert(s.step === 'skill', 'ขั้น = ' + s.step);
});

await check('บทนำ 5: ยิงลูกไฟด้วยปุ่ม K แล้วมานาลด', async () => {
  const mp0 = await G(page, () => __ploy.game.player.mp);
  await page.keyboard.press('KeyK'); await page.waitForTimeout(150);
  const mp1 = await G(page, () => __ploy.game.player.mp);
  await page.screenshot({ path: SHOTS + '/05-fireball.png' });
  assert(mp1 < mp0, 'มานาไม่ลด');
  assert((await state(page)).step === 'go', 'ขั้นไม่เปลี่ยนเป็น go');
});

await check('บทนำ 6: เดินจริงไปทางตะวันออก ผ่านท่อนไม้ เข้าเวียงด่านหิน', async () => {
  await G(page, () => { const p = __ploy.game.player; p.x = 38 * 32; p.y = 9 * 32; });
  await hold(page, 'KeyD', 5200);
  const s = await state(page);
  assert(s.zone === 'town' && s.step === 'chan', `อยู่ที่ ${s.zone} ขั้น ${s.step} x=${Math.round(s.x / 32)}`);
  await page.waitForTimeout(500);
  await page.screenshot({ path: SHOTS + '/06-town-gate.png' });
});

await check('บทนำ 7: คลิกที่พ่อเฒ่าจันทร์ → เดินไปคุยเอง → จบบทนำ', async () => {
  await G(page, () => { const p = __ploy.game.player; p.x = 24 * 32; p.y = 18 * 32; });
  await page.waitForTimeout(700);
  const pos = await G(page, () => { const g = __ploy.game, n = g.world.zone.npcs.find((q) => q.id === 'chan'), c = g.camera; return { x: (n.x - c.x) * c.zoom + c.viewW / 2, y: (n.y - 14 - c.y) * c.zoom + c.viewH / 2 }; });
  await page.mouse.click(pos.x, pos.y);
  await wait(page, () => __ploy.game.mode === 'dialog', null, 6000);
  await page.screenshot({ path: SHOTS + '/07-chan.png' });
  await closeDialogs(page);
  const s = await state(page);
  assert(s.done && s.step === 'done', 'บทนำยังไม่จบ');
});

await check('ออกประตูเหนือไปทุ่งนาร้าง มีมอนครบ', async () => {
  await G(page, () => { const p = __ploy.game.player; p.x = 20 * 32; p.y = 4 * 32; });
  await hold(page, 'KeyW', 1500);
  const s = await state(page);
  assert(s.zone === 'field', 'อยู่ที่ ' + s.zone);
  assert(s.mobs >= 35, 'มอนน้อยไป ' + s.mobs);
  await page.waitForTimeout(400);
  await page.screenshot({ path: SHOTS + '/08-field.png' });
});

await check('ฟาร์มจริง 25 วินาที: ฟันมอนรอบตัว ได้ XP เหรียญ และไม่มีมอนตายซ้ำ', async () => {
  await G(page, () => { const g = __ploy.game; g._kills = 0; g.events.on('mobKilled', ({ mob }) => { g._kills++; if (mob._counted) g._double = true; mob._counted = true; }); g.player.x = 18 * 32; g.player.y = 44 * 32; });
  const t0 = Date.now();
  while (Date.now() - t0 < 25000) {
    await G(page, () => { const g = __ploy.game, p = g.player; let best = null, bd = 1e9; for (const m of g.mobs) { if (m.dead) continue; const d = Math.hypot(m.x - p.x, m.y - p.y); if (d < bd) { bd = d; best = m; } } p.targetMob = best; if (p.hp < 40) p.hp = 120; });
    await page.waitForTimeout(250);
    if (Math.random() < 0.3) await page.keyboard.press('KeyK');
  }
  const r = await G(page, () => ({ kills: __ploy.game._kills, double: !!__ploy.game._double }));
  const s = await state(page);
  await page.screenshot({ path: SHOTS + '/09-farming.png' });
  assert(r.kills >= 5, 'ฆ่าได้น้อย ' + r.kills);
  assert(!r.double, 'มีมอนให้รางวัลซ้ำ');
  return `ฆ่า ${r.kills} ตัว เลเวล ${s.lv} เบี้ย ${s.coins}`;
});

await check('เซฟแล้วรีเฟรชหน้า → กด "เล่นต่อ" ได้ของเดิมครบ', async () => {
  await G(page, () => __ploy.writeSave(__ploy.game));
  const before = await state(page);
  await page.reload();
  await wait(page, () => globalThis.__ploy && __ploy.loop.stats.frames > 2);
  await page.mouse.click(422, 265);
  await page.waitForTimeout(300);
  const after = await state(page);
  assert(after.mode === 'play', 'โหมด ' + after.mode);
  for (const k of ['zone', 'lv', 'xp', 'coins', 'done']) assert(before[k] === after[k], `${k}: ${before[k]} → ${after[k]}`);
  assert(after.gems.includes('ruby'), 'ทับทิมหาย');
});

await check('ความเร็ว: มอน 100 ตัวไล่ล้อม ใช้เวลาคำนวณ+วาดต่อเฟรมไม่เกิน 8ms', async () => {
  await G(page, () => { const g = __ploy.game, p = g.player; const types = ['boar', 'monkey', 'krasue', 'piglet']; for (let i = 0; i < 2000 && g.mobs.length < 100; i++) { const m = __ploy.makeMob(g, types[i % 4], 3, p.x + (Math.random() - 0.5) * 700, p.y + (Math.random() - 0.5) * 400, -1); if (!g.world.blocked(m.x, m.y, m.radius)) g.mobs.push(m); } g.mobs.forEach((m) => { m.aggroed = true; }); p.invuln = 99; });
  await page.waitForTimeout(1500);
  const samples = [];
  for (let i = 0; i < 6; i++) { await page.waitForTimeout(500); samples.push(await G(page, () => __ploy.loop.stats.frameMs)); }
  await page.screenshot({ path: SHOTS + '/10-swarm.png' });
  const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
  const n = await G(page, () => __ploy.game.mobs.length);
  assert(avg <= 8, `เฉลี่ย ${avg.toFixed(2)}ms`);
  return `มอน ${n} ตัว เฉลี่ย ${avg.toFixed(2)} ms/เฟรม`;
});

await check('ไม่มี error ในคอนโซลตลอดการเล่น', async () => { assert(errors.length === 0, errors.slice(0, 3).join(' | ')); });
await browser.close();

// มือถือจอสัมผัส
const mob = await openGame({ w: 780, h: 360, mobile: true });
await check('มือถือ: แตะเริ่ม → ลากจอยซ้ายเดินได้ → แตะปุ่มดาบฟันได้', async () => {
  const p = mob.page;
  await G(p, () => localStorage.clear());
  await G(p, () => __ploy.startNew(true));
  await p.waitForTimeout(300);
  const touch = (type, x, y, id = 1) => G(p, ([type, x, y, id]) => { const c = document.getElementById('hud'); c.dispatchEvent(new PointerEvent(type, { pointerId: id, pointerType: 'touch', clientX: x, clientY: y, bubbles: true, isPrimary: id === 1 })); }, [type, x, y, id]);
  const x0 = (await state(p)).x;
  await touch('pointerdown', 110, 270); await touch('pointermove', 170, 270);
  await p.waitForTimeout(700);
  await touch('pointerup', 170, 270);
  const s = await state(p);
  assert(s.x > x0 + 40, `เดินไม่ไป ${x0}→${s.x}`);
  const L = await G(p, () => ({ mode: __ploy.game.input.mode }));
  assert(L.mode === 'touch', 'ไม่เข้าโหมดสัมผัส');
  const before = await G(p, () => __ploy.game.player.attackCd);
  const btn = await G(p, () => { const L = __ploy.layout(); const b = L.buttons.find((q) => q.id === 'attack'); return { x: b.x, y: b.y }; });
  await touch('pointerdown', btn.x, btn.y, 2);
  await p.waitForTimeout(50);
  const cd = await G(p, () => __ploy.game.player.attackCd);
  await touch('pointerup', btn.x, btn.y, 2);
  assert(cd > before, 'ปุ่มดาบไม่ทำงาน');
  await p.screenshot({ path: SHOTS + '/11-mobile.png' });
  assert(mob.errors.length === 0, mob.errors.join(' | '));
});
await mob.browser.close();

const pass = results.filter((r) => r.ok).length;
for (const r of results) console.log(`${r.ok ? '✅' : '❌'} ${r.name}${r.note ? ' — ' + r.note : ''} (${(r.ms / 1000).toFixed(1)}s)`);
console.log(`\nผ่าน ${pass}/${results.length}`);
process.exit(pass === results.length ? 0 : 1);

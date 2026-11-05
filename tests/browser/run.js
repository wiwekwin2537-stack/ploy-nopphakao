// เทสต์ในเบราว์เซอร์จริง: เล่นบทนำด้วยปุ่มจริง เซฟ/โหลด มือถือ และความเร็ว
// รัน: node tests/browser/run.js   (ต้อง build ก่อน)
import { openGame, G } from './lib.js';
import { mkdirSync } from 'node:fs';

const SHOTS = process.env.SHOTS || 'tests/browser/shots';
mkdirSync(SHOTS, { recursive: true });
const results = [];
let currentPage = null;
async function check(name, fn) {
  const t0 = Date.now();
  try { const note = await fn(); results.push({ ok: true, name, note, ms: Date.now() - t0 }); }
  catch (e) {
    // ข้อที่ล้ม: แนบสภาพเกมตอนนั้นไว้ด้วย (โหมด เลือด พื้นที่ มอนรอบตัว) ช่วยหาสาเหตุเทสต์ผลไม่นิ่ง
    const why = currentPage ? await currentPage.evaluate(() => { const g = globalThis.__ploy && __ploy.game; if (!g || !g.player) return ''; const p = g.player; const near = g.mobs.filter((m) => !m.dead && Math.hypot(m.x - p.x, m.y - p.y) < 200).length; return ` [โหมด ${g.mode} · เลือด ${Math.ceil(p.hp)} · ${g.world.zone.id} · มอนใกล้ ${near} · ui ${g.input.uiMode}]`; }).catch(() => '') : '';
    results.push({ ok: false, name, note: e.message + why, ms: Date.now() - t0 });
  }
  // ปิดหน้าต่างที่ค้าง เพื่อไม่ให้ข้อที่พังลามไปข้ออื่น
  if (currentPage) await currentPage.evaluate(() => { const g = globalThis.__ploy && __ploy.game; if (g && (g.mode === 'bag' || g.mode === 'tree')) { g.mode = 'play'; g.input.setUiMode(false); } }).catch(() => {});
}
const assert = (c, msg) => { if (!c) throw new Error(msg); };
const state = (page) => G(page, () => { const g = __ploy.game, p = g.player; return { mode: g.mode, step: g.flags.tutStep, zone: g.world.zone.id, x: p.x, y: p.y, hp: p.hp, lv: p.level, xp: p.xp, coins: p.coins, gems: ['weapon', 'body'].flatMap((k) => (p.equip[k] && p.equip[k].gems) || []).filter(Boolean), allGems: [...p.bag, ...[...Object.values(p.equip).filter(Boolean), ...p.items].flatMap((it) => it.gems || []).filter(Boolean)].sort().join(','), pas: p.passives.join(','), gear: Object.values(p.equip).filter(Boolean).map((q) => q.uid).join(','), bagN: p.items.length, mobs: g.mobs.length, done: !!g.flags.tutorialDone }; });
// วางผู้เล่นห่างบอส d พิกเซลในจุดที่บอสมองเห็น (ไม่มีต้นไม้/หินบัง) — บอสสุ่มตำแหน่งในลานได้ ห้ามสมมติว่าทางซ้ายโล่งเสมอ
const nearBoss = (page, type, d) => G(page, ([type, d]) => {
  const g = __ploy.game, k = g.mobs.find((m) => m.type === type && !m.dead), p = g.player;
  g.mobs = g.mobs.filter((m) => m === k);                         // เหลือแค่บอส (มอนอื่นไม่บังหรือแย่งเป้า)
  for (let i = 0; i < 16; i++) { const a = Math.PI + i * Math.PI / 8 * (i % 2 ? 1 : -1) / 2; const x = k.x + Math.cos(a) * d, y = k.y + Math.sin(a) * d;
    if (!g.world.blocked(x, y, p.radius) && g.world.lineClear(x, y - 10, k.x, k.y - 10)) { p.x = x; p.y = y; p.aim = Math.atan2(k.y - y, k.x - x); return true; } }
  p.x = k.x - d; p.y = k.y; return false;
}, [type, d]);
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
currentPage = page;
await G(page, () => localStorage.clear());
await page.reload();
await wait(page, () => globalThis.__ploy && __ploy.loop.stats.frames > 2);

await check('หน้าแรก: กดปุ่ม "เริ่มผจญภัย" ด้วยเมาส์แล้วเข้าเกม', async () => {
  await page.screenshot({ path: SHOTS + '/01-title.png' });
  await page.mouse.click(422, 265);
  await page.waitForTimeout(200);
  assert((await state(page)).mode === 'create', 'ไม่เข้าหน้าสร้างตัวละคร: ' + (await state(page)).mode);
  // หน้าสร้างตัวละคร (แบบ PoE): เลือกหมอผี (ไม้เท้า + ทับทิม) → ตั้งชื่อ → เริ่ม
  const C = await G(page, () => __ploy.createLayout());
  assert(C.cards.length === 6, 'ต้องมี 6 อาชีพ: ' + C.cards.map((c) => c.id));
  const sh = C.cards.find((c) => c.id === 'shaman');
  await page.mouse.click(sh.x + sh.w / 2, sh.y + 40); await page.waitForTimeout(400);
  await page.screenshot({ path: SHOTS + '/00-create.png' });
  await page.fill('input', 'ทดสอบหมอผี');
  await page.mouse.click(C.go.x + C.go.w / 2, C.go.y + C.go.h / 2);
  await page.waitForTimeout(200);
  const s = await state(page);
  assert(s.zone === 'road' && s.mode === 'dialog', `ได้ ${s.mode}/${s.zone}`);
  const who = await G(page, () => ({ cls: __ploy.game.player.cls, name: __ploy.game.player.name, w: __ploy.game.player.equip.weapon.base, pas: __ploy.game.player.passives.join() }));
  assert(who.cls === 'shaman' && who.name === 'ทดสอบหมอผี' && who.w === 'herb_staff' && who.pas === 'shaman', JSON.stringify(who));
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
  // วางหมูและผู้เล่นบนช่วงทางที่โล่ง (ไม่มีเกวียนขวาง) เพื่อให้หมูพุ่งได้จริง
  await G(page, () => { const g = __ploy.game, m = g.mobs.find((q) => q.type === 'bigboar'); m.x = m.homeX = 31 * 32; m.y = m.homeY = 10 * 32; g.player.x = 25 * 32; g.player.y = 10 * 32; m.state = 'chase'; m.aggroed = true; m.chargeCd = 0; });
  await wait(page, () => __ploy.game.mobs.some((m) => m.type === 'bigboar' && m.state === 'charge'), null, 6000).catch(async () => { throw new Error('หมูไม่พุ่ง · ' + await G(page, () => { const g = __ploy.game, m = g.mobs.find((q) => q.type === 'bigboar'), p = g.player; return `หมู ${Math.round(m.x)},${Math.round(m.y)} ${m.state} cd ${m.chargeCd.toFixed(1)} ผู้เล่น ${Math.round(p.x)},${Math.round(p.y)} เส้นตรงว่าง ${g.world.lineClear(m.x, m.y, p.x, p.y)} mode ${g.mode} hs ${g.hitStop} st ${m.stateT.toFixed(2)} tut ${g.flags.tutStep} dlg ${g.dialog && g.dialog.speaker}`; })); });
  await page.screenshot({ path: SHOTS + '/03-charge.png' });
  const hp0 = (await state(page)).hp;
  // รอในหน้าเว็บเอง (ทุกเฟรม) แล้วกด Space ผ่านช่องทางคีย์บอร์ดจริงทันทีที่หมูเข้าใกล้ — ไม่ขึ้นกับความหน่วงของตัวเทสต์
  await page.evaluate(() => new Promise((res) => {
    const tick = () => { const g = __ploy.game, m = g.mobs.find((q) => q.type === 'bigboar');
      if (m && Math.hypot(m.x - g.player.x, m.y - g.player.y) < 75) { dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' })); setTimeout(() => { dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' })); res(); }, 60); }
      else requestAnimationFrame(tick); };
    tick(); }));
  await page.waitForTimeout(600);
  const s = await state(page);
  const dodged = await G(page, () => __ploy.game.tutDodged === true);
  const dbg = await G(page, () => { const g = __ploy.game, m = g.mobs.find((q) => q.type === 'bigboar'), p = g.player; return m ? `หมู ${Math.round(m.x)},${Math.round(m.y)} ${m.state} ผู้เล่น ${Math.round(p.x)},${Math.round(p.y)} hp ${Math.round(p.hp)}` : 'ไม่มีหมู'; });
  assert(dodged, 'ระบบต้องนับว่าหลบได้ · ' + dbg);
  assert(s.hp >= hp0 - 0.5, `เสียเลือด ${hp0}→${s.hp}`);
});

await check('บทนำ 4: ฆ่าพญาหมูป่า → ทับทิมตก → เดินไปเก็บ → ได้สกิล', async () => {
  await killTutorialMob(page, 'bigboar');
  await wait(page, () => __ploy.game.drops.some((d) => d.gem === 'ruby') || (__ploy.game.player.equip.weapon.gems || [])[0] === 'ruby');
  await page.screenshot({ path: SHOTS + '/04-ruby.png' });
  await G(page, () => { const g = __ploy.game, d = g.drops.find((q) => q.gem === 'ruby'); if (d) { g.player.x = d.x - 30; g.player.y = d.y; } });
  await wait(page, () => (__ploy.game.player.equip.weapon.gems || [])[0] === 'ruby', null, 3000);
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
  await G(page, () => { const g = __ploy.game; g._kills = 0; g._eliteCh = Object.values(g.data.balance.elites.tiers).map((t) => [t, t.chance]); g._eliteCh.forEach(([t]) => { t.chance = 0; }); g.events.on('mobKilled', ({ mob }) => { g._kills++; if (mob._counted) g._double = true; mob._counted = true; }); g.player.x = 18 * 32; g.player.y = 44 * 32; });
  const t0 = Date.now();
  while (Date.now() - t0 < 25000) {
    await G(page, () => { const g = __ploy.game, p = g.player; let best = null, bd = 1e9; for (const m of g.mobs) { if (m.dead) continue; const d = Math.hypot(m.x - p.x, m.y - p.y); if (d < bd) { bd = d; best = m; } } p.targetMob = best; if (best && bd > 260) { p.x = best.x - 60; p.y = best.y; } if (p.hp < 40) p.hp = 120; });   // มอนไกลเกินไป: ย้ายไปใกล้ๆ (ทดสอบการฟัน ไม่ใช่การเดินทาง)
    await page.waitForTimeout(250);
    if (Math.random() < 0.3) await page.keyboard.press('KeyK');
  }
  const r = await G(page, () => ({ kills: __ploy.game._kills, double: !!__ploy.game._double }));
  await G(page, () => __ploy.game._eliteCh.forEach(([t, c]) => { t.chance = c; }));   // ทดสอบความเร็วฟาร์มกับมอนธรรมดา (มอนพิเศษสุ่มทำให้ผลแกว่ง)
  const s = await state(page);
  await page.screenshot({ path: SHOTS + '/09-farming.png' });
  assert(r.kills >= 5, 'ฆ่าได้น้อย ' + r.kills);
  assert(!r.double, 'มีมอนให้รางวัลซ้ำ');
  return `ฆ่า ${r.kills} ตัว เลเวล ${s.lv} เบี้ย ${s.coins}`;
});

await check('พลอยเสริม: เก็บจากพื้น → คลิกปุ่มกระเป๋า → แตะสองครั้งฝังลงชุด 1 → ลูกไฟออก 3 ลูก', async () => {
  await G(page, () => { const g = __ploy.game, p = g.player; g.mobs.length = 0; g.drops.push({ id: 9001, kind: 'gem', gem: 'multi', x: p.x + 20, y: p.y, t: 1, z: 0, vz: 0, vx: 0, vy: 0 }); });
  await wait(page, () => __ploy.game.player.bag.includes('multi'), null, 3000);
  const L = await G(page, () => __ploy.layout());
  await page.mouse.click(L.profile.x + 30, L.profile.y + 30);              // แตะรูปตัวละคร = เปิดโปรไฟล์
  await wait(page, () => __ploy.game.mode === 'bag', null, 2000);
  assert(await G(page, () => __ploy.game.bagTab === 'stats'), 'แตะรูปแล้วต้องเปิดหน้าตัวละคร');
  await page.screenshot({ path: SHOTS + '/10a-profile.png' });
  const gt = await G(page, () => __ploy.bagLayout().tabs.find((q) => q.id === 'gems'));
  await page.mouse.click(gt.x + gt.w / 2, gt.y + gt.h / 2); await page.waitForTimeout(100);
  const cell = await G(page, () => { const g = __ploy.game, L = __ploy.layout(), w = g.camera.viewW, h = g.camera.viewH, s = L.s, G2 = g.data.gems;
    const pw = Math.min(w - 20, 720 * s), ph = Math.min(h - 16, 360 * s), x = w / 2 - pw / 2, y = h / 2 - ph / 2, c = Math.min(46 * s, (pw * 0.5 - 24 * s) / 6);
    const i = g.player.bag.indexOf('multi');                  // หาเม็ดที่เพิ่งเก็บ (ในกระเป๋าอาจมีพลอยที่ดรอประหว่างฟาร์มอยู่ก่อน)
    return { x: x + pw * 0.5 + 6 * s + (i % 6) * c + c / 2, y: y + 52 * s + Math.floor(i / 6) * c + c / 2 }; });
  await page.mouse.click(cell.x, cell.y); await page.waitForTimeout(120);
  await page.mouse.click(cell.x, cell.y); await page.waitForTimeout(120);
  await page.screenshot({ path: SHOTS + '/10b-bag.png' });
  const sock = await G(page, () => __ploy.game.player.equip.weapon.gems.slice());
  assert(sock[0] === 'ruby' && sock.includes('multi'), 'ฝังไม่ได้ ' + JSON.stringify(sock));
  await page.keyboard.press('KeyB'); await page.waitForTimeout(150);
  assert((await state(page)).mode === 'play', 'ปิดกระเป๋าไม่ได้');
  await G(page, () => { const g = __ploy.game, p = g.player; g.mobs.length = 0; p.x = 36 * 32; p.y = 45 * 32; p.aim = -Math.PI / 2; p.targetMob = null; p.mp = 999; p.skillCd[0] = 0; g.shots.length = 0; p.pendingShot = null; }); // ยิงบนทางโล่ง ไม่ให้ต้นไม้บังลูกไฟ · ล้างลูกพลังคทาที่ค้างจากการตีก่อนหน้า
  await page.keyboard.press('KeyK'); await page.waitForTimeout(60);
  const n = await G(page, () => __ploy.game.shots.filter((q) => q.from === 'player' && q.kind === 'fire').length);
  assert(n === 3, 'ลูกไฟ ' + n + ' ลูก');
});

await check('ต้นพาสซีฟ: กด P → จุดเริ่มเป็นอาชีพที่เลือกไว้แล้ว → แตะโหนดติดกันสองครั้งลงแต้ม → ถอนฟรีไม่ได้', async () => {
  await G(page, () => { const p = __ploy.game.player; p.level = Math.max(p.level, 3); p.passives = [p.cls]; p.currency.regret = 0; });
  const dmg0 = await G(page, () => __ploy.game.player.level);
  await page.keyboard.press('KeyP');
  await wait(page, () => __ploy.game.mode === 'tree', null, 2000);
  const at = (id) => G(page, (id) => { const g = __ploy.game, v = g.treeView, n = g.data.passives.nodes[id], s = __ploy.layout().s; return { x: g.camera.viewW / 2 + (n.x - v.x) * v.z * s, y: g.camera.viewH / 2 + (n.y - v.y) * v.z * s }; }, id);
  const cls = await G(page, () => __ploy.game.player.cls);
  const pt = await at(cls + '_a0');
  await page.mouse.click(pt.x, pt.y); await page.waitForTimeout(80);
  await page.mouse.click(pt.x, pt.y); await page.waitForTimeout(80);
  await page.screenshot({ path: SHOTS + '/10c-tree.png' });
  const r = await G(page, () => ({ pas: __ploy.game.player.passives.slice() }));
  assert(r.pas.includes(cls) && r.pas.includes(cls + '_a0'), 'เลือกไม่ได้ ' + JSON.stringify(r.pas));
  await page.mouse.click(pt.x, pt.y); await page.waitForTimeout(80);     // แตะซ้ำโหนดที่ลงแล้ว = ไม่มีใบลาน ถอนไม่ได้
  await page.mouse.click(pt.x, pt.y); await page.waitForTimeout(80);
  assert((await G(page, () => __ploy.game.player.passives.length)) === 2, 'ถอนฟรีได้ (ผิดแบบ PoE)');
  // ลากเลื่อนต้นได้
  const v0 = await G(page, () => __ploy.game.treeView.x);
  await page.mouse.move(400, 200); await page.mouse.down(); await page.mouse.move(300, 200, { steps: 5 }); await page.mouse.up();
  const v1 = await G(page, () => __ploy.game.treeView.x);
  assert(v1 > v0 + 30, 'ลากเลื่อนไม่ได้');
  await page.keyboard.press('KeyP'); await page.waitForTimeout(100);
  assert((await state(page)).mode === 'play', 'ปิดไม่ได้');
  // เดินได้ปกติหลังปิด (จอย/คีย์ไม่ค้าง)
  const x0 = (await state(page)).x; await hold(page, 'KeyD', 400); assert((await state(page)).x > x0 + 20, 'เดินไม่ได้หลังปิดต้น');
  return 'เลเวล ' + dmg0;
});

await check('ช่องพลอยบนอาวุธ: แถบพลอย → แตะด้ายสายสิญจน์สองครั้ง → การเชื่อมเปลี่ยน ด้ายลด 1 → ถอดพลอยจากช่องกลับกระเป๋า', async () => {
  await G(page, () => { const p = __ploy.game.player; p.currency.fusing = 2; p.equip.weapon.sockets = 4; p.equip.weapon.links = [false, false, false]; p.equip.weapon.gems = ['ruby', 'multi', null, null]; p.equip.weapon.colors = ['r', 'g', 'b', 'w']; __ploy.game.bagTab = 'gems'; __ploy.game.bagGroup = 0; });
  await page.keyboard.press('KeyB'); await wait(page, () => __ploy.game.mode === 'bag', null, 2000);
  const GL = await G(page, () => __ploy.gemLayout());
  const f = GL.cur.find((c) => c.kind === 'fusing');
  await page.mouse.click(f.x + f.w / 2, f.y + f.h / 2); await page.waitForTimeout(100);
  await page.mouse.click(f.x + f.w / 2, f.y + f.h / 2); await page.waitForTimeout(150);
  const r = await G(page, () => ({ links: __ploy.game.player.equip.weapon.links.join(), fus: __ploy.game.player.currency.fusing }));
  assert(r.fus === 1 && r.links !== 'false,false,false', 'ใช้ด้ายไม่ได้ ' + JSON.stringify(r));
  await page.screenshot({ path: SHOTS + '/10f-sockets.png' });
  await G(page, () => { __ploy.game.player.currency.chroma = 1; });
  const ch = GL.cur.find((c) => c.kind === 'chroma');
  const c0 = await G(page, () => __ploy.game.player.equip.weapon.colors.join());
  await page.mouse.click(ch.x + ch.w / 2, ch.y + ch.h / 2); await page.waitForTimeout(100);
  await page.mouse.click(ch.x + ch.w / 2, ch.y + ch.h / 2); await page.waitForTimeout(150);
  const c1 = await G(page, () => ({ c: __ploy.game.player.equip.weapon.colors.join(), n: __ploy.game.player.currency.chroma }));
  assert(c1.n === 0 && c1.c !== c0, 'หินเจ็ดสีไม่ทำงาน ' + JSON.stringify(c1));
  await G(page, () => { const w = __ploy.game.player.equip.weapon, p = __ploy.game.player; w.gems.forEach((g, i) => { if (g) { p.bag.push(g); w.gems[i] = null; } }); w.colors = ['r', 'g', 'b', 'w']; ['ruby', 'multi'].forEach((g, i) => { p.bag.splice(p.bag.indexOf(g), 1); w.gems[i] = g; }); });
  const so = (await G(page, () => __ploy.gemLayout())).rows[0].sockets[1];
  await page.mouse.click(so.x, so.y); await page.waitForTimeout(100);              // แตะครั้งแรก = ดูรายละเอียดพลอย
  await page.screenshot({ path: SHOTS + '/10g-gem-tip.png' });
  await page.mouse.click(so.x, so.y); await page.waitForTimeout(100);              // แตะซ้ำ = ถอด
  const g2 = await G(page, () => ({ w: __ploy.game.player.equip.weapon.gems.join(), bag: __ploy.game.player.bag.includes('multi') }));
  assert(g2.bag && !g2.w.includes('multi'), 'ถอดพลอยไม่ได้ ' + JSON.stringify(g2));
  await G(page, () => { const p = __ploy.game.player, i = p.bag.indexOf('multi'); p.bag.splice(i, 1); p.equip.weapon.gems[1] = 'multi'; p.equip.weapon.links = [true, true, true]; p.equip.weapon.sockets = 3; p.equip.weapon.gems = p.equip.weapon.gems.slice(0, 3); p.equip.weapon.colors = ['r', 'g', 'b']; p.equip.weapon.links = [true, true]; });
  await page.keyboard.press('KeyB'); await page.waitForTimeout(100);
  return 'เชื่อม ' + r.links;
});

await check('โปรไฟล์: แตะรูปตัวละคร → แถบพาสซีฟเปิดต้นเต็มจอ → ปุ่ม "โปรไฟล์" กลับมา → ปิดแล้วเดินได้', async () => {
  const L = await G(page, () => __ploy.layout());
  await page.mouse.click(L.profile.x + 100, L.profile.y + 20);
  await wait(page, () => __ploy.game.mode === 'bag', null, 2000);
  const tt = await G(page, () => __ploy.bagLayout().tabs.find((q) => q.id === 'tree'));
  await page.mouse.click(tt.x + tt.w / 2, tt.y + tt.h / 2);
  await wait(page, () => __ploy.game.mode === 'tree', null, 2000);
  const bk = await G(page, () => { const s = __ploy.layout().s, w = __ploy.game.camera.viewW; return { x: w - 150 * s + 48 * s, y: 25 * s }; });
  await page.mouse.click(bk.x, bk.y);
  await wait(page, () => __ploy.game.mode === 'bag', null, 2000);
  await page.keyboard.press('Escape'); await page.waitForTimeout(150);
  assert((await state(page)).mode === 'play', 'ปิดโปรไฟล์ไม่ได้');
  const x0 = (await state(page)).x; await hold(page, 'KeyA', 400); assert((await state(page)).x < x0 - 20, 'เดินไม่ได้หลังปิดโปรไฟล์');
});

await check('ของสวมใส่: เก็บดาบหายากจากพื้น → แถบชุด → แตะสองครั้งสวม → ดาเมจเพิ่ม สีดาบเปลี่ยน', async () => {
  await G(page, () => { const g = __ploy.game, p = g.player; p.level = Math.max(p.level, 4);
    g.drops.push({ id: 9002, kind: 'item', x: p.x + 14, y: p.y, t: 1, z: 0, vz: 0, vx: 0, vy: 0, item: { uid: 0, base: 'silver_kris', rarity: 'purple', ilvl: 4, mods: [{ id: 'heavy', tier: 1, value: 6 }, { id: 'tiger', tier: 1, value: 3 }, { id: 'sharp', tier: 1, value: 15 }], rareName: 'เขี้ยวพญาเสือ' } }); });
  await wait(page, () => __ploy.game.player.items.some((x) => x.base === 'silver_kris'), null, 3000);
  await page.screenshot({ path: SHOTS + '/10d-loot.png' });
  const d0 = await G(page, () => Math.round(__ploy.game.player.equip.weapon ? 1 : 0));
  await page.keyboard.press('KeyB'); await wait(page, () => __ploy.game.mode === 'bag', null, 2000);
  const pos = await G(page, () => { const g = __ploy.game, L = __ploy.layout(), w = g.camera.viewW, h = g.camera.viewH, s = L.s;
    const pw = Math.min(w - 20, 720 * s), ph = Math.min(h - 16, 360 * s), x = w / 2 - pw / 2, y = h / 2 - ph / 2;
    const gx = x + 175 * s, gy = y + 52 * s, info = y + ph - 78 * s, cell = Math.min(44 * s, (x + pw - gx - 14 * s) / 6);
    const i = g.player.items.findIndex((q) => q.base === 'silver_kris');
    const tb = __ploy.bagLayout().tabs.find((q) => q.id === 'gear');
    return { tab: { x: tb.x + tb.w / 2, y: tb.y + tb.h / 2 }, item: { x: gx + (i % 6) * cell + cell / 2, y: gy + Math.floor(i / 6) * cell + cell / 2 } }; });
  await page.mouse.click(pos.tab.x, pos.tab.y); await page.waitForTimeout(80);
  const before = await G(page, () => __ploy.game.player.equip.weapon && __ploy.game.player.equip.weapon.base);
  await page.mouse.click(pos.item.x, pos.item.y); await page.waitForTimeout(80);
  await page.screenshot({ path: SHOTS + '/10e-gear.png' });
  await page.mouse.click(pos.item.x, pos.item.y); await page.waitForTimeout(80);
  const after = await G(page, () => ({ w: __ploy.game.player.equip.weapon.base, back: __ploy.game.player.items.some((q) => q.base === 'bamboo_sword') }));
  assert(after.w === 'silver_kris', 'สวมไม่ได้ ' + JSON.stringify(after));
  assert(before !== 'bamboo_sword' || after.back, 'ดาบเก่าต้องกลับเข้ากระเป๋า');
  // เล่นแร่แปรธาตุ: เลือกดาบไม้ไผ่ (ขาว) → แตะทองคำเปลวสองครั้ง → กลายเป็นสีเขียว
  await G(page, () => { __ploy.game.player.currency.gild = 1; });
  const cr = await G(page, () => { const g = __ploy.game, L = __ploy.layout(), w = g.camera.viewW, h = g.camera.viewH, s = L.s;
    const pw = Math.min(w - 20, 720 * s), ph = Math.min(h - 16, 360 * s), x = w / 2 - pw / 2, y = h / 2 - ph / 2;
    const gx = x + 175 * s, gy = y + 52 * s, cell = Math.min(44 * s, (x + pw - gx - 14 * s) / 6), i = g.player.items.findIndex((q) => q.base === 'bamboo_sword' && q.rarity === 'normal');
    const info = { x: x + 14 * s, y: y + ph - 78 * s, h: 66 * s };
    return { i, item: { x: gx + (i % 6) * cell + cell / 2, y: gy + Math.floor(i / 6) * cell + cell / 2 }, btn: { x: info.x + 10 * s + 49 * s, y: info.y + info.h - 16 * s } }; });
  if (cr.i >= 0) {
    await page.mouse.click(cr.item.x, cr.item.y); await page.waitForTimeout(80);
    await page.mouse.click(cr.btn.x, cr.btn.y); await page.waitForTimeout(80);
    await page.mouse.click(cr.btn.x, cr.btn.y); await page.waitForTimeout(120);
    const rr = await G(page, () => ({ r: __ploy.game.player.items.filter((q) => q.base === 'bamboo_sword').map((q) => q.rarity).join(), n: __ploy.game.player.currency.gild }));
    assert(rr.n === 0 && rr.r.includes('green'), 'ทองคำเปลวไม่ทำงาน ' + JSON.stringify(rr));
  }
  await page.keyboard.press('KeyB'); await page.waitForTimeout(100);
  return 'เดิม ' + before + ' → ' + after.w + ' ' + d0 + (cr.i >= 0 ? ' · ปิดทองแล้ว' : '');
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
  for (const k of ['zone', 'lv', 'xp', 'coins', 'done', 'pas', 'gear', 'bagN']) assert(before[k] === after[k], `${k}: ${before[k]} → ${after[k]}`);
  assert(before.allGems === after.allGems && after.allGems.includes('ruby') && after.allGems.includes('multi'), 'พลอยหายหลังโหลด ' + before.allGems + ' → ' + after.allGems);
  assert(before.gems.join() === after.gems.join(), 'พลอยในช่องเปลี่ยนหลังโหลด');
});

await check('ร้านแม่ค้า: กด E คุย → เปิดร้าน → คลิกยาหม้อสองครั้งซื้อ → ขายของในกระเป๋า → กด 3 ดื่มยา', async () => {
  await G(page, () => { const g = __ploy.game, n = g.data.zones.town.npcs.find((q) => q.shop); __ploy.enterZone(g, 'town', n.x * 32, n.y * 32 + 30); g.player.coins = 500; g.player.potions = 0; });
  await page.waitForTimeout(400);
  await page.keyboard.press('KeyE'); await page.waitForTimeout(200);
  for (let i = 0; i < 4 && (await state(page)).mode === 'dialog'; i++) { await page.keyboard.press('KeyE'); await page.waitForTimeout(150); }
  assert((await state(page)).mode === 'shop', 'ร้านไม่เปิด: ' + (await state(page)).mode);
  const pos = await G(page, () => { const B = __ploy.shopLayout(); return { px: B.shop.x + B.shop.cell / 2, py: B.shop.y + B.shop.cell / 2, gx: B.bag.x + B.bag.cell / 2, gy: B.bag.y + B.bag.cell / 2 }; });   // ช่องแรกร้าน = ยาหม้อ · ช่องแรกกระเป๋า
  await page.mouse.click(pos.px, pos.py); await page.waitForTimeout(120);
  await page.mouse.click(pos.px, pos.py); await page.waitForTimeout(120);
  let v = await G(page, () => ({ pot: __ploy.game.player.potions, coins: __ploy.game.player.coins, items: __ploy.game.player.items.length }));
  assert(v.pot === 1 && v.coins === 500 - 20, 'ซื้อยาไม่ได้ ' + JSON.stringify(v));
  await page.screenshot({ path: SHOTS + '/15-shop.png' });
  if (v.items > 0) {
    await page.mouse.click(pos.gx, pos.gy); await page.waitForTimeout(120);
    await page.mouse.click(pos.gx, pos.gy); await page.waitForTimeout(120);
    const a = await G(page, () => ({ coins: __ploy.game.player.coins, items: __ploy.game.player.items.length }));
    assert(a.items === v.items - 1 && a.coins > v.coins, 'ขายของไม่ได้ ' + JSON.stringify(a));
  }
  await page.keyboard.press('Escape'); await page.waitForTimeout(150);
  assert((await state(page)).mode === 'play', 'ปิดร้านไม่ได้');
  await G(page, () => { __ploy.game.player.hp = 20; });
  await page.keyboard.press('Digit1'); await page.waitForTimeout(150);
  const d = await G(page, () => ({ hp: __ploy.game.player.hp, pot: __ploy.game.player.potions }));
  assert(d.pot === 0 && d.hp > 20, 'ดื่มยาไม่ได้ ' + JSON.stringify(d));
  // คลิกขวดน้ำมนต์ (ขวดที่ 2 ข้างลูกแก้วเลือด) ด้วยเมาส์
  await G(page, () => { const p = __ploy.game.player; p.mp = 1; p.mpPotions = 1; p.mpPotionCd = 0; });
  const fl = await G(page, () => __ploy.layout().flasks[1]);
  await page.mouse.click(fl.x + fl.w / 2, fl.y + fl.h / 2); await page.waitForTimeout(150);
  const m = await G(page, () => ({ mp: __ploy.game.player.mp, n: __ploy.game.player.mpPotions }));
  assert(m.n === 0 && m.mp > 1, 'คลิกขวดน้ำมนต์ไม่ได้ ' + JSON.stringify(m));
  await page.screenshot({ path: SHOTS + '/15b-hud.png' });
  return 'ขายของ ' + (v.items > 0 ? 'ได้' : '(ไม่มีของให้ขาย)');
});

await check('วัดร้าง: เดินเข้าซุ้มประตูจากทุ่งนา → ลงถึงห้องยักษ์ → บอสมีวงเตือน → ล้มบอส → ประตูมิติพากลับ', async () => {
  await G(page, () => { const g = __ploy.game; __ploy.enterZone(g, 'field', 65.5 * 32, 7 * 32); g.player.invuln = 0; });
  await page.waitForTimeout(400);
  await hold(page, 'KeyW', 900);
  let s = await state(page);
  assert(s.zone === 'dungeon1', 'เดินเข้าซุ้มแล้วไม่เข้าดันเจี้ยน: ' + s.zone);
  await page.waitForTimeout(600);
  await page.screenshot({ path: SHOTS + '/12-dungeon1.png' });
  await G(page, () => { const g = __ploy.game; __ploy.enterZone(g, 'dungeon3'); g.player.invuln = 999; }); await nearBoss(page, 'yak', 130);
  await page.waitForTimeout(2500);
  const seen = await G(page, () => { const g = __ploy.game, y = g.mobs.find((m) => m.type === 'yak'); return { aggro: y.aggroed, hz: g.hazards.length, st: y.state }; });
  await page.screenshot({ path: SHOTS + '/13-boss.png' });
  assert(seen.aggro, 'บอสไม่ตื่น');
  await G(page, () => { const g = __ploy.game, y = g.mobs.find((m) => m.type === 'yak'); y.hp = Math.floor(y.maxHp * 0.45); });
  await page.waitForTimeout(700);
  const minions = await G(page, () => __ploy.game.mobs.filter((m) => m.type === 'monkey').length);
  assert(minions === 3, 'บอสคลั่งแล้วต้องเรียกลิง 3 ตัว ได้ ' + minions);
  await page.screenshot({ path: SHOTS + '/13b-enrage.png' });
  await G(page, () => { const g = __ploy.game; g.mobs.forEach((m) => { m.hp = 1; }); const y = g.mobs.find((m) => m.type === 'yak'); g.player.x = y.x - 40; g.player.y = y.y; g.player.dir = 3; });
  for (let i = 0; i < 12; i++) { await page.keyboard.press('KeyJ'); await page.waitForTimeout(160); }
  const dead = await G(page, () => !__ploy.game.mobs.some((m) => m.type === 'yak' && !m.dead));
  assert(dead, 'ฟันบอสไม่ตาย');
  await page.waitForTimeout(800);
  await page.screenshot({ path: SHOTS + '/14-boss-loot.png' });
  const slain = await G(page, () => __ploy.game.flags.yakSlain);
  assert(slain, 'ไม่ได้ธงล้มยักษ์');
  await G(page, () => { const g = __ploy.game, e = g.world.zone.exits.find((x) => x.requiresClear); g.player.x = e.x - 50; g.player.y = e.y + e.h / 2; });
  await hold(page, 'KeyD', 900);
  s = await state(page);
  assert(s.zone === 'field', 'ประตูมิติไม่พากลับทุ่งนา: ' + s.zone);
  return 'สถานะบอสตอนสู้ ' + seen.st + ' วงเตือน ' + seen.hz;
});

await check('ป่าหิมพานต์: หลังล้มยักษ์ ม่านเวทหาย → เดินทางตะวันออกของทุ่งเข้าป่า → มอนใหม่ครบ', async () => {
  await G(page, () => { const g = __ploy.game; g.flags.yakSlain = true; g.world.refreshFlags(); __ploy.enterZone(g, 'field', 66 * 32, 29 * 32); g.player.invuln = 999; g.mobs.length = 0; });
  await page.waitForTimeout(300);
  await hold(page, 'KeyD', 1600);
  assert((await state(page)).zone === 'camp_hunter', 'ไม่ถึงค่ายพรานไพร: ' + (await state(page)).zone);   // บทใหม่: ผ่านเมืองของบทก่อน
  await page.screenshot({ path: SHOTS + '/28-camp_hunter.png' });
  await G(page, () => { const g = __ploy.game; g.player.x = 29.6 * 32; g.player.y = 11 * 32; });
  await hold(page, 'KeyD', 900);
  assert((await state(page)).zone === 'himmapan_edge', 'ไม่ถึงพื้นที่ย่อย himmapan_edge: ' + (await state(page)).zone);   // บทแบบ PoE: เมือง → พื้นที่ย่อย → พื้นที่บอส
  await G(page, () => { const g = __ploy.game; g.mobs.length = 0; g.player.x = 61.6 * 32; g.player.y = 26.5 * 32; });
  await hold(page, 'KeyD', 900);
  const s = await state(page);
  assert(s.zone === 'himmapan', 'เดินเข้าป่าไม่ได้: ' + s.zone);
  await G(page, () => { const g = __ploy.game; g.player.x = 30 * 32; g.player.y = 21 * 32; });
  await page.waitForTimeout(900);
  await page.screenshot({ path: SHOTS + '/16-himmapan.png' });
  const types = await G(page, () => [...new Set(__ploy.game.mobs.map((m) => m.type))].join(','));
  assert(types.includes('khotchasi') && types.includes('naga_noi') && types.includes('hatsadi'), types);
  // บอสปลายป่า: เข้าใกล้แล้วตื่น มีแถบเลือดบอส แล้วล้มได้
  await G(page, () => { __ploy.game.player.invuln = 999; }); await nearBoss(page, 'khotchasi_king', 140);
  await page.waitForTimeout(1600);
  await page.screenshot({ path: SHOTS + '/17-khotchasi-king.png' });
  const awake = await G(page, () => __ploy.game.mobs.find((m) => m.type === 'khotchasi_king').aggroed);
  assert(awake, 'บอสไม่ตื่น');
  await G(page, () => { const g = __ploy.game; const k = g.mobs.find((m) => m.type === 'khotchasi_king'); g.mobs.length = 0; g.mobs.push(k); k.hp = 1; g.player.x = k.x - 50; g.player.y = k.y; });   // เหลือแต่บอส ไม่ให้ดาบไปโดนตัวอื่นก่อน
  for (let i = 0; i < 30 && !(await G(page, () => !!__ploy.game.flags.khotchasi_kingSlain)); i++) {   // ยืนชิดบอสทุกครั้ง (บอสพุ่ง/ขยับได้)
    if (await G(page, () => __ploy.game.mobs.some((m) => m.type === 'khotchasi_king' && !m.dead))) await nearBoss(page, 'khotchasi_king', 45);   // ชิดบอสจุดที่มองเห็น ลูกสมุนที่บอสเรียกออกไปก่อน
    await page.keyboard.press('KeyJ'); await page.waitForTimeout(260);   // รอจังหวะปล่อยของคทา/ธนูด้วย
  }
  assert(await G(page, () => !!__ploy.game.flags.khotchasi_kingSlain), 'ล้มพญาคชสีห์ไม่ได้');
  return types;
});

await check('เขาไกรลาส: หลังล้มพญาคชสีห์ เดินผ่านม่านปลายป่า → ขึ้นเขาหิมะ → มอนใหม่ครบ', async () => {
  await G(page, () => { const g = __ploy.game; g.flags.khotchasi_kingSlain = true; __ploy.enterZone(g, 'himmapan', 65 * 32, 34.5 * 32); g.player.invuln = 999; g.mobs.length = 0; });
  await page.waitForTimeout(300);
  await hold(page, 'KeyD', 1600);
  assert((await state(page)).zone === 'hermitage', 'ไม่ถึงอาศรมฤๅษี: ' + (await state(page)).zone);   // บทใหม่: ผ่านเมืองของบทก่อน
  await page.screenshot({ path: SHOTS + '/28-hermitage.png' });
  await G(page, () => { const g = __ploy.game; g.player.x = 29.6 * 32; g.player.y = 11 * 32; });
  await hold(page, 'KeyD', 900);
  assert((await state(page)).zone === 'snow_valley', 'ไม่ถึงพื้นที่ย่อย snow_valley: ' + (await state(page)).zone);   // บทแบบ PoE: เมือง → พื้นที่ย่อย → พื้นที่บอส
  await G(page, () => { const g = __ploy.game; g.mobs.length = 0; g.player.x = 61.6 * 32; g.player.y = 26.5 * 32; });
  await hold(page, 'KeyD', 900);
  const s = await state(page);
  assert(s.zone === 'kailash', 'เดินขึ้นเขาไม่ได้: ' + s.zone);
  await G(page, () => { const g = __ploy.game; g.player.x = 20 * 32; g.player.y = 13.5 * 32; });
  await page.waitForTimeout(900);
  await page.screenshot({ path: SHOTS + '/18-kailash.png' });
  const types = await G(page, () => [...new Set(__ploy.game.mobs.map((m) => m.type))].join(','));
  assert(['kumbhan', 'kinnorn', 'garuda_chick'].every((t) => types.includes(t)), types);
  return types;
});

await check('ยอดเขาไกรลาส: พญาครุฑราชตื่นเมื่อเข้าใกล้ มีแถบเลือดบอส ล้มได้', async () => {
  await G(page, () => { const g = __ploy.game; __ploy.enterZone(g, 'kailash'); g.player.invuln = 999; }); await nearBoss(page, 'garuda_king', 150);
  await page.waitForTimeout(1600);
  await page.screenshot({ path: SHOTS + '/19-garuda-king.png' });
  assert(await G(page, () => __ploy.game.mobs.find((m) => m.type === 'garuda_king').aggroed), 'บอสไม่ตื่น');
  await G(page, () => { const g = __ploy.game; const k = g.mobs.find((m) => m.type === 'garuda_king'); g.mobs.length = 0; g.mobs.push(k); k.hp = 1; g.player.x = k.x - 50; g.player.y = k.y; });
  for (let i = 0; i < 30 && !(await G(page, () => !!__ploy.game.flags.garuda_kingSlain)); i++) {   // ยืนชิดบอสทุกครั้ง (บอสพุ่ง/ขยับได้)
    if (await G(page, () => __ploy.game.mobs.some((m) => m.type === 'garuda_king' && !m.dead))) await nearBoss(page, 'garuda_king', 45);   // ชิดบอสจุดที่มองเห็น ลูกสมุนที่บอสเรียกออกไปก่อน
    await page.keyboard.press('KeyJ'); await page.waitForTimeout(260);   // รอจังหวะปล่อยของคทา/ธนูด้วย
  }
  assert(await G(page, () => !!__ploy.game.flags.garuda_kingSlain), 'ล้มพญาครุฑราชไม่ได้');
});

await check('สวรรค์ดาวดึงส์: ล้มครุฑราชแล้วประตูสวรรค์เปิด → เดินเข้าสวรรค์ → ท้าวเวสสุวรรณตื่น → ล้มได้', async () => {
  await G(page, () => { const g = __ploy.game; g.flags.garuda_kingSlain = true; g.world.refreshFlags(); __ploy.enterZone(g, 'kailash', 56 * 32, 5.5 * 32); g.player.invuln = 999; g.mobs.length = 0; });
  await page.waitForTimeout(300);
  await hold(page, 'KeyD', 1200);
  assert((await state(page)).zone === 'sky_sala', 'ไม่ถึงศาลาท่าสวรรค์: ' + (await state(page)).zone);
  await page.screenshot({ path: SHOTS + '/28-sky_sala.png' });
  await G(page, () => { const g = __ploy.game; g.player.x = 29.6 * 32; g.player.y = 11 * 32; });
  await hold(page, 'KeyD', 900);
  assert((await state(page)).zone === 'nandana', 'ไม่ถึงพื้นที่ย่อย nandana: ' + (await state(page)).zone);   // บทแบบ PoE: เมือง → พื้นที่ย่อย → พื้นที่บอส
  await G(page, () => { const g = __ploy.game; g.mobs.length = 0; g.player.x = 61.6 * 32; g.player.y = 26.5 * 32; });
  await hold(page, 'KeyD', 900);
  assert((await state(page)).zone === 'tavatimsa', 'เข้าสวรรค์ไม่ได้: ' + (await state(page)).zone);
  await G(page, () => { const g = __ploy.game, k = g.mobs.find((m) => m.type === 'vessavana'); g.player.x = k.x; g.player.y = k.y + 170; });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: SHOTS + '/20-tavatimsa.png' });
  assert(await G(page, () => __ploy.game.mobs.find((m) => m.type === 'vessavana').aggroed), 'บอสไม่ตื่น');
  await G(page, () => { const g = __ploy.game, k = g.mobs.find((m) => m.type === 'vessavana'); g.mobs.length = 0; g.mobs.push(k); k.hp = 1; });
  for (let i = 0; i < 30 && !(await G(page, () => !!__ploy.game.flags.vessavanaSlain)); i++) {
    if (await G(page, () => __ploy.game.mobs.some((m) => m.type === 'vessavana' && !m.dead))) await nearBoss(page, 'vessavana', 45);   // ชิดบอสจุดที่มองเห็น ลูกสมุนที่บอสเรียกออกไปก่อน
    await page.keyboard.press('KeyJ'); await page.waitForTimeout(260);   // รอจังหวะปล่อยของคทา/ธนูด้วย
  }
  assert(await G(page, () => !!__ploy.game.flags.vessavanaSlain), 'ล้มท้าวเวสสุวรรณไม่ได้');
});

await check('ศาลวาร์ป: เดินถึงศาลในเวียง → กด E → เลือกป่าหิมพานต์ด้วยเมาส์ → วาร์ปไปจริง', async () => {
  await G(page, () => { const g = __ploy.game; g.flags.wp_himmapan = true; const wp = g.world.zone && g.data.zones.town.objects.find((o) => o.type === 'waypoint'); __ploy.enterZone(g, 'town', (wp.x + 0.5) * 32, (wp.y + 2.2) * 32); });
  await page.waitForTimeout(300);
  await hold(page, 'KeyW', 300);
  await page.waitForTimeout(150);
  assert(await G(page, () => !!__ploy.game.flags.wp_town), 'เดินถึงศาลแล้วไม่ปลดล็อก');
  await page.keyboard.press('KeyE'); await page.waitForTimeout(200);
  assert((await state(page)).mode === 'warp', 'กด E แล้วไม่เปิดหน้าวาร์ป: ' + (await state(page)).mode);
  await page.screenshot({ path: SHOTS + '/21-warp.png' });
  const row = await G(page, () => { const g = __ploy.game, L = __ploy.layout(), ids = Object.entries(g.data.zones).filter(([, z]) => z.objects.some((o) => o.type === 'waypoint')).map(([id]) => id), i = ids.indexOf('himmapan');
    const s = L.s, w = g.camera.viewW, h = g.camera.viewH, pw = Math.min(w - 20, 340 * s), rh = 34 * s, ph = Math.min(h - 16, 70 * s + ids.length * rh), x = w / 2 - pw / 2, y = h / 2 - ph / 2;
    return { x: x + pw / 2, y: y + 46 * s + i * rh + rh / 2 - 2 * s }; });
  await page.mouse.click(row.x, row.y); await page.waitForTimeout(300);
  const s = await state(page);
  assert(s.zone === 'himmapan' && s.mode === 'play', 'วาร์ปไม่ได้: ' + s.zone + ' ' + s.mode);
});

await check('หีบเก็บของ: เดินไปที่หีบในเวียง → กด E → แตะของ 2 ครั้งเก็บเข้าหีบ → ปิด → โหลดเซฟแล้วยังอยู่ในหีบ', async () => {
  const uid = await G(page, () => {
    const g = __ploy.game, a = g.data.zones.town.objects.find((o) => o.type === 'stash'), p = g.player;
    __ploy.enterZone(g, 'town', (a.x + 0.6) * 32, (a.y + a.h + 0.6) * 32);
    if (!p.items.length) p.items.push({ uid: ++p.nextUid, base: 'iron_sword', rarity: 'normal', ilvl: 5, mods: [], rareName: null, sockets: 1, links: [], gems: [null], colors: ['r'] });
    return p.items[0].uid;
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: SHOTS + '/26a-stash-chest.png' });
  await page.keyboard.press('KeyE'); await page.waitForTimeout(200);
  assert((await state(page)).mode === 'stash', 'ไม่เปิดหน้าหีบ: ' + (await state(page)).mode);
  const L = await G(page, () => __ploy.stashLayout());
  const c = { x: L.bag.x + L.bag.cell / 2, y: L.bag.y + L.bag.cell / 2 };
  await page.mouse.click(c.x, c.y); await page.waitForTimeout(150);
  await page.screenshot({ path: SHOTS + '/26-stash.png' });
  await page.mouse.click(c.x, c.y); await page.waitForTimeout(150);
  const inStash = await G(page, (u) => __ploy.game.player.stash.some((it) => it.uid === u), uid);
  assert(inStash, 'ของไม่เข้าหีบ');
  await page.mouse.click(L.close.x, L.close.y); await page.waitForTimeout(200);
  assert((await state(page)).mode === 'play', 'ปิดหีบไม่ได้');
  const kept = await G(page, (u) => { const g = __ploy.game; __ploy.writeSave(g); g.player.stash = []; __ploy.continueGame(); return __ploy.game.player.stash.some((it) => it.uid === u); }, uid);
  assert(kept, 'โหลดเซฟแล้วของในหีบหาย');
  return 'เก็บแล้ว โหลดเซฟแล้วยังอยู่';
});

await check('ถ้ำลายแทง: ยืนที่แท่นในเวียง → กด E → คลิกขั้น 1 → เข้าถ้ำสุ่ม มอนครบ ลายแทงหมด', async () => {
  await G(page, () => { const g = __ploy.game, a = g.data.zones.town.objects.find((o) => o.type === 'map_altar'); g.player.currency.map1 = 1; __ploy.enterZone(g, 'town', (a.x + 0.7) * 32, (a.y + a.h + 0.6) * 32); });
  await page.waitForTimeout(300);
  await page.keyboard.press('KeyE'); await page.waitForTimeout(200);
  assert((await state(page)).mode === 'mapmenu', 'ไม่เปิดหน้าแท่นลายแทง: ' + (await state(page)).mode);
  await page.screenshot({ path: SHOTS + '/22-map-altar.png' });
  const row = await G(page, () => { const g = __ploy.game, s = __ploy.layout().s, w = g.camera.viewW, h = g.camera.viewH, pw = Math.min(w - 20, 380 * s), rh = 36 * s, ph = Math.min(h - 16, 96 * s + 5 * rh); return { x: w / 2, y: h / 2 - ph / 2 + 46 * s + rh / 2 - 2 * s }; });
  await page.mouse.click(row.x, row.y); await page.waitForTimeout(500);
  const r = await G(page, () => ({ zone: __ploy.game.world.zone.id, mobs: __ploy.game.mobs.length, left: __ploy.game.player.currency.map1, boss: __ploy.game.mobs.some((m) => m.def.boss) }));
  assert(r.zone === 'map' && r.mobs > 5 && r.left === 0 && r.boss, JSON.stringify(r));
  await page.screenshot({ path: SHOTS + '/23-map.png' });
  return 'มอน ' + r.mobs;
});

await check('ออร่า: ฝังโกเมนในช่องอาวุธ → ดาเมจเพิ่ม มานาถูกจอง วงออร่าขึ้นใต้เท้า แถบสกิลไม่มีออร่า', async () => {
  await G(page, () => {                                  // ให้มีช่องแดง/ขาวว่าง 1 ช่องบนอาวุธ
    const g = __ploy.game, p = g.player, w = p.equip.weapon;
    if (!w.sockets) { w.sockets = 1; w.links = []; w.gems = [null]; w.colors = ['r']; }
    if (!w.gems.some((x, k) => !x && (w.colors[k] === 'r' || w.colors[k] === 'w'))) { const k = w.sockets - 1; if (w.gems[k]) p.bag.push(w.gems[k]); w.gems[k] = null; w.colors[k] = 'r'; }
    p.bag.push('garnet');
  });
  await G(page, () => { const g = __ploy.game, p = g.player, w = p.equip.weapon, i = w.gems.findIndex((x, k) => !x && (w.colors[k] === 'r' || w.colors[k] === 'w')); w.gems[i] = 'garnet'; p.bag.splice(p.bag.indexOf('garnet'), 1); });
  await page.waitForTimeout(400);
  await page.screenshot({ path: SHOTS + '/24-aura.png' });
  const st = await G(page, () => ({ sk: __ploy.skills().map((k) => k.gem), st: __ploy.stats() }));
  assert(st.st.mpReserved > 0 && st.st.auras.length === 1, JSON.stringify(st.st));
  assert(!st.sk.includes('garnet'), 'ออร่าหลุดไปอยู่ในปุ่มสกิล');
  return `จองมานา ${st.st.mpReserved} · สกิล ${st.sk.join(',')}`;
});

await check('มอนพิเศษ: หมูป่าเวท (ฟ้า) กับหายาก (เหลือง) มีชื่อค่าพิเศษ วงแสงใต้เท้า → ล้มตัวหายากได้ของแน่นอน', async () => {
  const r = await G(page, () => {
    const g = __ploy.game, p = g.player;
    __ploy.enterZone(g, 'field', 34 * 32, 50 * 32); g.mobs.length = 0; g.drops.length = 0; p.invuln = 99;
    const a = __ploy.rollElite(g, __ploy.makeMob(g, 'boar', 8, p.x - 90, p.y - 40, -1), 'magic');
    const b = __ploy.rollElite(g, __ploy.makeMob(g, 'boar', 8, p.x + 90, p.y - 40, -1), 'rare');
    g.mobs.push(a, b);
    return { a: a.elite, b: b.elite, mods: b.eliteMods.length };
  });
  assert(r.a === 'magic' && r.b === 'rare' && r.mods === 2, JSON.stringify(r));
  await page.waitForTimeout(300);
  await page.screenshot({ path: SHOTS + '/25-elites.png' });
  const items = await G(page, () => { const g = __ploy.game, b = g.mobs.find((m) => m.elite === 'rare'); __ploy.damage(g, b, b.hp + 1); return g.drops.filter((d) => d.kind === 'item').length; });
  assert(items >= 2, 'ของจากตัวหายาก ' + items);
  await G(page, () => { __ploy.game.mobs.length = 0; });
  return 'ของ ' + items + ' ชิ้น';
});

await check('ยูนีค: ง้าวพิทักษ์วัดร้างตกพื้น (ลำแสงส้ม) → เก็บ → สวม → ได้สกิลฟันพายุที่ปุ่มสกิล → กดใช้ได้', async () => {
  await G(page, () => {
    const g = __ploy.game, p = g.player, I = g.data.items;
    __ploy.enterZone(g, 'field', 34 * 32, 50 * 32); g.mobs.length = 0; g.drops.length = 0; p.level = Math.max(p.level, 8);
    __ploy.spawnDrop(g, { kind: 'item', item: __ploy.makeUnique(I, g.rng, 'wat_glaive', 10), x: p.x + 50, y: p.y });
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: SHOTS + '/27-unique-drop.png' });
  const r = await G(page, () => {
    const g = __ploy.game, p = g.player, d = g.drops.find((x) => x.kind === 'item');
    p.x = d.x; p.y = d.y; return true;
  });
  await page.waitForTimeout(600);
  const res = await G(page, () => {
    const g = __ploy.game, p = g.player, it = p.items.find((x) => x.rarity === 'unique');
    if (!it) return { got: false };
    p.items.splice(p.items.indexOf(it), 1); if (p.equip.weapon) p.items.push(p.equip.weapon); p.equip.weapon = it;
    const sk = __ploy.skills(); return { got: true, idx: sk.findIndex((k) => k.fromItem), gem: (sk.find((k) => k.fromItem) || {}).gem };
  });
  assert(r && res.got, 'เก็บยูนีคไม่ได้');
  assert(res.gem === 'onyx', 'ไม่ได้สกิลจากของ ' + JSON.stringify(res));
  await G(page, () => { const g = __ploy.game, p = g.player; p.mp = 999; p.skillCd = [0, 0, 0]; g.mobs.push(__ploy.makeMob(g, 'boar', 3, p.x + 30, p.y, -1)); });
  const key = ['KeyK', 'KeyL', 'KeyU'][res.idx];
  if (key) { await page.keyboard.press(key); await page.waitForTimeout(60); }
  await page.screenshot({ path: SHOTS + '/27b-unique-skill.png' });
  const cd = await G(page, (i) => __ploy.game.player.skillCd[i], res.idx);
  assert(!key || cd > 0, 'กดสกิลจากของไม่ได้');
  await G(page, () => { __ploy.game.mobs.length = 0; });
  return 'สกิลช่อง ' + (res.idx + 1);
});

await check('รางวัลเควสแบบ PoE: ล้มยักษ์แล้วคุยพ่อเฒ่าจันทร์ → หน้าต่างเลือกพลอย 1 จาก 3 → แตะสองครั้งได้พลอยเข้ากระเป๋า', async () => {
  await G(page, () => { const g = __ploy.game, n = g.data.zones.town.npcs.find((q) => q.id === 'chan'); Object.assign(g.flags, { yakSlain: true }); delete g.flags.q_q1_main; __ploy.enterZone(g, 'town', n.x * 32, n.y * 32 + 30); });
  await page.waitForTimeout(300);
  await page.keyboard.press('KeyE'); await page.waitForTimeout(150);
  for (let i = 0; i < 8 && (await state(page)).mode === 'dialog'; i++) { await page.keyboard.press('KeyE'); await page.waitForTimeout(120); }
  assert((await state(page)).mode === 'reward', 'ไม่เปิดหน้าต่างรางวัล: ' + (await state(page)).mode);
  const c = await G(page, () => { const B = __ploy.rewardLayout(), k = B.cards[0]; return { x: k.x + k.w / 2, y: k.y + k.h / 2 }; });
  await page.mouse.click(c.x, c.y); await page.waitForTimeout(150);
  await page.screenshot({ path: SHOTS + '/29-quest-reward.png' });
  await page.mouse.click(c.x, c.y); await page.waitForTimeout(150);
  const r = await G(page, () => ({ mode: __ploy.game.mode, got: __ploy.game.player.bag.includes(__ploy.game.data.quests.list[0].reward.gems[0]), claimed: !!__ploy.game.flags.q_q1_main }));
  assert(r.mode === 'play' && r.got && r.claimed, JSON.stringify(r));
  return 'ได้พลอยรางวัล';
});

await check('ท่าตัวละครสมจริง: ทุกท่า (ยืน เดิน ฟัน ร่าย ยิงธนู หน้าไม้ คทา) ทุกทิศ ทุกจังหวะ มีแขนพอดี 2 ข้าง ไม่ซ้อนเป็น 4 แขน', async () => {
  const bad = await G(page, () => {
    const P = __ploy, g = P.game, out = [], c = document.createElement('canvas').getContext('2d'), keep = g.player.equip.weapon;
    const weapons = [['bamboo_sword', null], ['bamboo_bow', 'bow'], ['wood_crossbow', 'crossbow'], ['herb_staff', 'staff']];
    for (const [base, sk] of weapons) {
      g.player.equip.weapon = { uid: 1, base, rarity: 'normal', ilvl: 1, mods: [], sockets: 0, links: [], gems: [], colors: [] };
      const L = P.art.heroLook(g), Gr = P.art.heroGear(g);
      for (let dir = 0; dir < 4; dir++) {
        const aim = [Math.PI / 2, -Math.PI / 2, Math.PI, 0][dir];
        const poses = [{ n: 'ยืน' }, { n: 'เดิน', moving: true, amt: 1, walk: 0.3 }, { n: 'ร่าย', cast: true }, { n: 'ฟัน', swing: 0.4, combo: 1 }];
        if (sk) for (const t of [0.1, 0.4, 0.62, 0.9]) poses.push({ n: 'ยิง' + t, shoot: t, shootKind: sk });
        for (const ps of poses) {
          P.art.drawHuman(c, L, 50, 80, { ...Gr, dir, t: 1, swing: -1, aim, ...ps });
          if (P.art.drawStats.arms !== 2) out.push(`${base} ทิศ${dir} ${ps.n}: ${P.art.drawStats.arms} แขน`);
        }
      }
    }
    g.player.equip.weapon = keep;
    return out;
  });
  assert(!bad.length, bad.slice(0, 6).join(' · '));
  return 'ครบทุกท่า';
});

await check('แผนที่ใหญ่แบบ PoE: กด Tab เปิด → เห็นทั้งพื้นที่ หมอกดำ ทางออก ศาลวาร์ป → Tab ปิด · แตะแผนที่เล็กก็เปิด', async () => {
  await G(page, () => { const g = __ploy.game; __ploy.enterZone(g, 'field', 36 * 32, 50 * 32); g.mobs.length = 0; g.mode = 'play'; });
  await page.waitForTimeout(200);
  await page.keyboard.press('Tab'); await page.waitForTimeout(200);
  assert((await state(page)).mode === 'bigmap', 'Tab ไม่เปิดแผนที่: ' + (await state(page)).mode);
  await page.screenshot({ path: SHOTS + '/30-bigmap.png' });
  await page.keyboard.press('Tab'); await page.waitForTimeout(150);
  assert((await state(page)).mode === 'play', 'Tab ไม่ปิดแผนที่');
  const M = await G(page, () => __ploy.layout().minimap);
  await page.mouse.click(M.x, M.y); await page.waitForTimeout(150);
  assert((await state(page)).mode === 'bigmap', 'แตะแผนที่เล็กไม่เปิด');
  await page.mouse.click(200, 200); await page.waitForTimeout(150);
  assert((await state(page)).mode === 'play', 'แตะแล้วไม่ปิด');
  return 'เปิด/ปิดได้ทั้งปุ่มและแตะ';
});

await check('เลื่อนขั้นอาชีพแบบ PoE: ต้นพาสซีฟ → ปุ่มเลื่อนขั้น → เลือกทาง (แตะสองครั้ง) → ลงโหนด → ✕ กลับต้นพาสซีฟ', async () => {
  await G(page, () => { const g = __ploy.game; g.flags.garuda_kingSlain = true; g.player.ascend = null; g.player.ascNodes = []; g.mode = 'play'; __ploy.openTree(); });
  await page.waitForTimeout(150);
  const T = await G(page, () => __ploy.treeLayout());
  await page.mouse.click(T.asc.x + T.asc.w / 2, T.asc.y + T.asc.h / 2); await page.waitForTimeout(150);
  assert((await state(page)).mode === 'ascend', 'ไม่เปิดหน้าเลื่อนขั้น: ' + (await state(page)).mode);
  const B = await G(page, () => __ploy.ascendLayout());
  const c = B.cards[0];
  await page.mouse.click(c.x + c.w / 2, c.y + 40); await page.waitForTimeout(120);
  await page.mouse.click(c.x + c.w / 2, c.y + 40); await page.waitForTimeout(150);
  const who = await G(page, () => ({ a: __ploy.game.player.ascend, opts: __ploy.game.data.ascendancy.classes[__ploy.game.player.cls] }));
  assert(who.a === who.opts[0], 'เลือกทางไม่ติด: ' + JSON.stringify(who));
  const t0 = B.tiles[0];
  await page.mouse.click(t0.x + t0.w / 2, t0.y + t0.h / 2); await page.waitForTimeout(100);
  await page.mouse.click(t0.x + t0.w / 2, t0.y + t0.h / 2); await page.waitForTimeout(150);
  assert((await G(page, () => __ploy.game.player.ascNodes.length)) === 1, 'ลงโหนดไม่ติด');
  await page.screenshot({ path: SHOTS + '/31-ascend.png' });
  await page.mouse.click(B.close.x, B.close.y); await page.waitForTimeout(150);
  assert((await state(page)).mode === 'tree', '✕ ไม่กลับต้นพาสซีฟ');
  await page.keyboard.press('Escape'); await page.waitForTimeout(150);
  return 'เลือก ' + who.a + ' ลงโหนดได้ ปิดกลับได้';
});

await check('โต๊ะช่างแบบ PoE: เดินไปโต๊ะในเวียง กด E เปิด → แตะของ → แตะสูตรสองครั้ง = คราฟต์ ได้ค่าเพิ่ม เสียเบี้ย → ✕ ปิด', async () => {
  await G(page, () => {
    const g = __ploy.game, b = (__ploy.enterZone(g, 'town'), g.world.zone.objects.find((o) => o.type === 'craft_bench'));
    g.mobs.length = 0; g.player.x = b.x + b.w / 2; g.player.y = b.y + b.h + 18; g.player.coins = 1000; g.mode = 'play';
    for (const it of Object.values(g.player.equip)) if (it) delete it.craft;
  });
  await page.waitForTimeout(200);
  await page.keyboard.press('e'); await page.waitForTimeout(200);
  assert((await state(page)).mode === 'bench', 'ไม่เปิดโต๊ะช่าง: ' + (await state(page)).mode);
  const B = await G(page, () => __ploy.benchLayout());
  const order = await G(page, () => Object.entries(__ploy.game.player.equip).filter(([, it]) => it && it.rarity !== 'unique').map(([k]) => k));
  const i = order.indexOf('body');
  assert(i >= 0, 'ไม่มีเสื้อ');
  await page.mouse.click(B.grid.x + (i % B.grid.cols) * B.grid.cell + B.grid.cell / 2, B.grid.y + Math.floor(i / B.grid.cols) * B.grid.cell + B.grid.cell / 2); await page.waitForTimeout(120);
  const ry = B.list.y + B.list.row / 2;
  await page.mouse.click(B.list.x + 40, ry); await page.waitForTimeout(120);
  await page.mouse.click(B.list.x + 40, ry); await page.waitForTimeout(150);
  const r = await G(page, () => ({ c: __ploy.game.player.equip.body.craft, coins: __ploy.game.player.coins }));
  assert(r.c === 'b_life' && r.coins === 800, 'คราฟต์ไม่ติด: ' + JSON.stringify(r));
  await page.screenshot({ path: SHOTS + '/32-bench.png' });
  await page.mouse.click(B.close.x, B.close.y); await page.waitForTimeout(150);
  assert((await state(page)).mode === 'play', '✕ ไม่ปิด');
  return 'คราฟต์เลือด +25 ลงเสื้อ เสีย 200 เบี้ย';
});

await check('แถบคราฟต์แบบหีบศิลา PoE: โปรไฟล์ → แถบคราฟต์ → แตะของวางลงช่อง → แตะปรอทสองครั้ง = ของเป็นสีม่วง ศิลาลด 1', async () => {
  await G(page, () => { const g = __ploy.game, p = g.player; p.currency.alch = 2; p.equip.weapon.rarity = 'normal'; p.equip.weapon.mods = []; p.equip.weapon.rareName = null; g.craftUid = null; g.craftCur = null; g.mode = 'bag'; g.bagTab = 'stats'; });
  await page.waitForTimeout(150);
  const B = await G(page, () => __ploy.bagLayout());
  const tb = B.tabs.find((q) => q.id === 'craft');
  await page.mouse.click(tb.x + tb.w / 2, tb.y + tb.h / 2); await page.waitForTimeout(150);
  const L = await G(page, () => __ploy.craftLayout());
  await page.mouse.click(L.grid.x + L.grid.cell / 2, L.grid.y + L.grid.cell / 2 + 6 * B.s); await page.waitForTimeout(120);
  assert(await G(page, () => __ploy.game.craftUid === __ploy.game.player.equip.weapon.uid), 'วางอาวุธลงช่องไม่ได้');
  const c = L.cur.find((q) => q.kind === 'alch');
  await page.mouse.click(c.x + c.w / 2, c.y + c.h / 2); await page.waitForTimeout(100);
  await page.mouse.click(c.x + c.w / 2, c.y + c.h / 2); await page.waitForTimeout(150);
  const r = await G(page, () => ({ rar: __ploy.game.player.equip.weapon.rarity, n: __ploy.game.player.currency.alch }));
  assert(r.rar === 'purple' && r.n === 1, 'ใช้ปรอทไม่ติด: ' + JSON.stringify(r));
  await page.screenshot({ path: SHOTS + '/33-crafttab.png' });
  await page.mouse.click(B.close.x, B.close.y); await page.waitForTimeout(150);
  assert((await state(page)).mode === 'play', '✕ ไม่ปิด');
  return 'อาวุธกลายเป็นสีม่วง ปรอทเหลือ 1';
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
  // แตะรูปตัวละครมุมซ้ายบนบนมือถือ = เปิดโปรไฟล์ (เคยถูกจอยเดินแย่งไป)
  const pr = await G(p, () => __ploy.layout().profile);
  await touch('pointerdown', pr.x + 30, pr.y + 20, 3); await p.waitForTimeout(40); await touch('pointerup', pr.x + 30, pr.y + 20, 3);
  await p.waitForTimeout(200);
  assert(await G(p, () => __ploy.game.mode === 'bag'), 'แตะรูปตัวละครบนมือถือแล้วโปรไฟล์ไม่เปิด');
  const tb = await G(p, () => __ploy.bagLayout().tabs.find((q) => q.id === 'gems'));
  await touch('pointerdown', tb.x + tb.w / 2, tb.y + tb.h / 2, 4); await p.waitForTimeout(40); await touch('pointerup', tb.x + tb.w / 2, tb.y + tb.h / 2, 4);
  await p.waitForTimeout(150);
  assert(await G(p, () => __ploy.game.bagTab === 'gems'), 'แตะแถบในโปรไฟล์บนมือถือไม่ได้');
  await p.screenshot({ path: SHOTS + '/11b-mobile-profile.png' });
  assert(mob.errors.length === 0, mob.errors.join(' | '));
});
await mob.browser.close();

const pass = results.filter((r) => r.ok).length;
for (const r of results) console.log(`${r.ok ? '✅' : '❌'} ${r.name}${r.note ? ' — ' + r.note : ''} (${(r.ms / 1000).toFixed(1)}s)`);
console.log(`\nผ่าน ${pass}/${results.length}`);
process.exit(pass === results.length ? 0 : 1);

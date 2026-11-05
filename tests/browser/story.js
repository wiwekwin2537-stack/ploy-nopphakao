// เล่นจริงทั้งเนื้อเรื่องในเบราว์เซอร์ (บท 1–6 → หลังจบเรื่อง) + ทุกหน้าต่างบนจอมือถือไม่ล้นจอ
// เดินผ่านทางออกจริง (ระบบเดินทางของเกม) · คุยด้วยปุ่ม E · เลือกรางวัลด้วยการแตะ · ล้มบอส · ไม่มี error ตลอดทาง
// รัน: node tests/browser/story.js   (ต้อง build ก่อน)
import { openGame, G, makeSuite } from './lib.js';
import { mkdirSync } from 'node:fs';

const SHOTS = process.env.SHOTS || 'tests/browser/shots';
mkdirSync(SHOTS, { recursive: true });
const suite = makeSuite(), { check, assert } = suite;
const { browser, page, errors } = await openGame({ w: 1280, h: 720 });
suite.setPage(page);

const zone = () => G(page, () => __ploy.game.world.zone.id);
const mode = () => G(page, () => __ploy.game.mode);

// เดินเข้าทางออกที่ไปพื้นที่ "to" (วางผู้เล่นกลางช่องทางออก ให้ระบบเดินทางของเกมพาไปเอง)
async function walkExit(to) {
  const ok = await G(page, (to) => { const g = __ploy.game, e = g.world.zone.exits.find((x) => x.to === to); if (!e) return false; g.mode = 'play'; g.player.x = e.x + e.w / 2; g.player.y = e.y + e.h / 2; return true; }, to);
  assert(ok, `${await zone()} ไม่มีทางออกไป ${to}`);
  for (let i = 0; i < 40 && (await zone()) !== to; i++) await page.waitForTimeout(50);
  assert((await zone()) === to, `เดินเข้าทางออกแล้วไม่ไป ${to} (อยู่ ${await zone()})`);
  await closeDialogs();
}
async function closeDialogs() { for (let i = 0; i < 25 && (await mode()) === 'dialog'; i++) { await page.keyboard.press('KeyE'); await page.waitForTimeout(60); } }
// ยืนหน้า NPC แล้วกด E คุย (ผ่านบทพูดจนจบ)
async function talk(id) {
  const ok = await G(page, (id) => { const g = __ploy.game, n = g.world.zone.npcs.find((q) => q.id === id); if (!n) return false; g.mode = 'play'; g.mobs.length = 0; g.player.x = n.x; g.player.y = n.y + 30; return true; }, id);
  assert(ok, `ไม่มี ${id} ใน ${await zone()}`);
  await page.waitForTimeout(120);
  await page.keyboard.press('KeyE'); await page.waitForTimeout(120);
  await closeDialogs();
}
async function pickReward() {
  assert((await mode()) === 'reward', 'ไม่เปิดหน้าต่างรางวัล: ' + (await mode()));
  const c = await G(page, () => { const k = __ploy.rewardLayout().cards[1]; return { x: k.x + k.w / 2, y: k.y + k.h / 2 }; });
  await page.mouse.click(c.x, c.y); await page.waitForTimeout(100); await page.mouse.click(c.x, c.y); await page.waitForTimeout(120);
  assert((await mode()) === 'play', 'เลือกรางวัลแล้วไม่ปิด');
}
// ล้มมอนด้วยเงื่อนไข (บอส/มอนชื่อเฉพาะ) ผ่านระบบดาเมจจริง (ตั้งธง ดรอปของ แจ้งเควส)
const kill = (pred) => G(page, (src) => { const g = __ploy.game, f = new Function('m', 'return ' + src), m = g.mobs.find((q) => !q.dead && f(q)); if (!m) return null; __ploy.damage(g, m, 1e9); return m.type; }, pred);

const ACTS = [
  { n: 2, town: 'camp_hunter', from: 'field', sub: 'himmapan_edge', boss: 'himmapan', bossType: 'khotchasi_king', main: 'phran', side: 'lam' },
  { n: 3, town: 'hermitage', from: 'himmapan', sub: 'snow_valley', boss: 'kailash', bossType: 'garuda_king', main: 'ruesi', side: 'sit' },
  { n: 4, town: 'sky_sala', from: 'kailash', sub: 'nandana', boss: 'tavatimsa', bossType: 'vessavana', main: 'thep_su', side: 'khon_fao' },
  { n: 5, town: 'naga_pier', from: 'tavatimsa', sub: 'badan_cave', boss: 'badan', bossType: 'naga_king', main: 'nak_kham', side: 'pu_tao' },
  { n: 6, town: 'lanka_camp', from: 'badan', sub: 'lanka_shore', boss: 'lanka', bossType: 'thotsakan', main: 'phiphek', side: 'hanuman' },
];

await check('บท 1: เริ่มเกม (ข้ามบทนำ) → วัดร้างชั้น 3 ล้มยักษ์วัด → กลับเวียงคุยพ่อเฒ่าจันทร์ → เลือกพลอยรางวัล', async () => {
  await G(page, () => { __ploy.startNew(true, 'duelist', 'ทดสอบเรื่อง'); const p = __ploy.game.player; p.level = 30; });
  await closeDialogs();
  await G(page, () => __ploy.enterZone(__ploy.game, 'dungeon3'));
  await closeDialogs();
  assert(await kill("m.type === 'yak'"), 'ไม่มียักษ์วัด');
  assert(await G(page, () => __ploy.game.flags.yakSlain), 'ไม่ตั้งธงยักษ์');
  await G(page, () => __ploy.enterZone(__ploy.game, 'town'));
  await talk('chan'); await pickReward();
  await G(page, () => __ploy.enterZone(__ploy.game, 'field')); await closeDialogs();
  assert(await kill('!!m.named'), 'ไม่มีกระสือนางเรือนทอง (เควสรอง)');
  await G(page, () => __ploy.enterZone(__ploy.game, 'town')); await closeDialogs();
  await talk('maen');
  assert(await G(page, () => __ploy.game.flags.q_q1_side), 'คุยยายแม้นแล้วไม่ได้รางวัลเควสรอง');
  await G(page, () => __ploy.enterZone(__ploy.game, 'field')); await closeDialogs();
  return 'ได้พลอยรางวัลบท 1 · ล้มมอนเควสรองแล้ว';
});

for (const A of ACTS) await check(`บท ${A.n}: เดินทางออกจริง ${A.from} → ${A.town} (ป้ายชื่อบท) → ${A.sub} (ปลดศาลวาร์ป) → ${A.boss} ล้มบอส → เควสหลัก/รอง ได้รางวัล`, async () => {
  if ((await zone()) !== A.from) { await G(page, (z) => __ploy.enterZone(__ploy.game, z), A.from); await closeDialogs(); }
  await walkExit(A.town);
  assert(await G(page, () => !!(__ploy.game.actCard && __ploy.game.actCard.text.includes('บทที่'))), 'ไม่ขึ้นป้ายชื่อบท');
  await page.screenshot({ path: `${SHOTS}/40-act${A.n}-town.png` });
  await talk(A.main); await talk(A.side);
  await walkExit(A.sub);
  await kill('!!m.named');                                                          // มอนเควสรองบท 5–6 อยู่ในพื้นที่ย่อย
  const wp = await G(page, () => { const g = __ploy.game, o = g.world.zone.objects.find((q) => q.type === 'waypoint'); g.player.invuln = 2; g.player.x = o.x + o.w / 2; g.player.y = o.y + o.h + 14; return g.world.zone.id; });
  await page.waitForTimeout(300);
  assert(await G(page, (z) => (__ploy.game.flags.waypoints || []).includes(z) || !!__ploy.game.flags['wp_' + z], wp), 'ยืนที่ศาลวาร์ปแล้วไม่ปลด');
  await walkExit(A.boss);
  await kill('!!m.named');
  assert(await kill(`m.type === '${A.bossType}'`), 'ไม่มีบอส ' + A.bossType);
  assert(await G(page, (t) => __ploy.game.flags[t + 'Slain'], A.bossType), 'ไม่ตั้งธงบอส');
  if (A.n === 6) assert(await G(page, () => __ploy.game.drops.some((d) => d.cur === 'map1')), 'ทศกัณฐ์ไม่ดรอปลายแทง (ทางเข้าหลังจบเรื่อง)');
  else assert(!(await G(page, () => __ploy.game.drops.some((d) => d.cur === 'map1'))), 'บอสระหว่างเรื่องไม่ควรดรอปลายแทง');
  assert(await G(page, (n) => __ploy.game.flags['q' + n + '_side_kill'], A.n), 'ยังไม่ได้ล้มมอนเควสรอง');
  await G(page, (z) => __ploy.enterZone(__ploy.game, z), A.town); await closeDialogs();
  await talk(A.main); await pickReward();
  const qp = await G(page, () => __ploy.game.player.questPoints);
  await talk(A.side);
  assert((await G(page, () => __ploy.game.player.questPoints)) === qp + 1, 'เควสรองไม่ให้แต้มพาสซีฟ');
  await G(page, (z) => __ploy.enterZone(__ploy.game, z), A.boss); await closeDialogs();
  return `ล้ม${A.bossType} รับรางวัลครบ`;
});

await check('หลังจบเรื่อง: รับรางวัลครบทุกเควส · แต้มเลื่อนขั้นครบ 6 · พ่อเฒ่าจันทร์เล่าตอนจบ', async () => {
  const r = await G(page, () => { const g = __ploy.game, A = g.data.ascendancy; return { left: g.data.quests.list.filter((q) => !g.flags['q_' + q.id]).map((q) => q.id), pts: A.trials.reduce((n, t) => n + (g.flags[t.flag] ? t.points : 0), 0) }; });
  assert(r.left.length === 0, 'เควสที่ยังไม่รับรางวัล: ' + r.left.join(','));   // รับครบ = เควสบนจอเปลี่ยนเป็นถ้ำลายแทง (มีเทสต์ย่อยแยก)
  assert(r.pts === 6, 'แต้มเลื่อนขั้น ' + r.pts);
  await G(page, () => __ploy.enterZone(__ploy.game, 'town')); await closeDialogs();
  await talk('chan');
  assert(await G(page, () => __ploy.game.flags.heardEnding2), 'พ่อเฒ่าไม่เล่าตอนจบ');
  await page.screenshot({ path: `${SHOTS}/41-ending.png` });
  return 'จบเนื้อเรื่องครบ 6 บท';
});

await check('ไม่มี error ในคอนโซลตลอดการเล่นทั้งเรื่อง', async () => { assert(errors.length === 0, errors.join(' | ')); return 'สะอาด'; });
await browser.close();

// ---------- มือถือ: ทุกหน้าต่างต้องอยู่ในจอ ----------
const mob = await openGame({ w: 780, h: 360, mobile: true });
suite.setPage(mob.page);
await check('มือถือ (780×360): ทุกหน้าต่างวาดได้ ไม่มี error และกรอบ/ปุ่ม ✕ อยู่ในจอทั้งหมด', async () => {
  const p = mob.page;
  const bad = await G(p, () => {
    const P = __ploy, g = P.game, out = [], W = g.camera.viewW, H = g.camera.viewH;
    P.startNew(true, 'templar', 'มือถือ'); g.player.level = 30; g.flags.garuda_kingSlain = true;
    const inView = (name, r) => { if (!r) return; const x2 = r.x + (r.w || r.r || 0), y2 = r.y + (r.h || r.r || 0); if (r.x - (r.r || 0) < -1 || r.y - (r.r || 0) < -1 || x2 > W + 1 || y2 > H + 1) out.push(`${name} ล้นจอ ${JSON.stringify([Math.round(r.x), Math.round(r.y), Math.round(x2), Math.round(y2)])} จอ ${W}×${H}`); };
    const lay = { bag: P.bagLayout(), shop: P.shopLayout(), stash: P.stashLayout(), bench: P.benchLayout(), tree: P.treeLayout(), ascend: P.ascendLayout(), reward: P.rewardLayout(), create: P.createLayout(), craft: P.craftLayout() };
    for (const [k, L] of Object.entries(lay)) { inView(k + ' กรอบ', L.w ? L : null); inView(k + ' ✕', L.close || L.back); }
    for (const c of lay.craft.cur) inView('ช่องศิลา ' + c.kind, c);
    for (const t of lay.bag.tabs) inView('แถบ ' + t.id, t);
    return out;
  });
  const shots = [['bag', 'stats'], ['bag', 'gear'], ['bag', 'gems'], ['bag', 'craft'], ['tree'], ['ascend'], ['shop'], ['stash'], ['bench'], ['bigmap']];
  for (const [m, tab] of shots) {
    await G(p, ([m, tab]) => { const g = __ploy.game; if (m === 'tree' || m === 'ascend') __ploy.openTree(); g.mode = m; if (tab) g.bagTab = tab; }, [m, tab]);
    await p.waitForTimeout(120);
    await p.screenshot({ path: `${SHOTS}/42-mobile-${m}${tab ? '-' + tab : ''}.png` });
  }
  assert(bad.length === 0, bad.join(' | '));
  assert(mob.errors.length === 0, mob.errors.join(' | '));
  return `${shots.length} หน้าต่าง อยู่ในจอครบ`;
});
await mob.browser.close();
process.exit(suite.finish() ? 0 : 1);

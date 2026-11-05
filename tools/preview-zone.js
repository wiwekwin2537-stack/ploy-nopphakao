// เครื่องมือดูภาพ: เข้าพื้นที่แล้วถ่ายจอ ณ จุดที่กำหนด — node tools/preview-zone.js ไฟล์.png พื้นที่ [x y เป็นช่อง] [ธง1,ธง2]
import { openGame } from '../tests/browser/lib.js';
const [out, zone, tx, ty, flags] = process.argv.slice(2);
const { browser, page } = await openGame({ w: 1280, h: 720 });
await page.evaluate(({ zone, tx, ty, flags }) => {
  const P = __ploy, g = P.game; P.startNew(true);
  for (const f of (flags || '').split(',').filter(Boolean)) g.flags[f] = true;
  P.enterZone(g, zone);                                              // เกิดที่จุดเริ่ม (มอนเกิดครบ) แล้วค่อยย้ายไปจุดที่จะดู
  if (tx) { g.player.x = tx * 32; g.player.y = ty * 32; g.camera.x = g.player.x; g.camera.y = g.player.y; }
  g.player.hp = g.player.maxHp = 1e9; g.mode = 'play'; g.dialog = null;
  for (const m of g.mobs) m.aggroed = false;
}, { zone, tx: +tx || 0, ty: +ty || 0, flags });
await page.waitForTimeout(1500);
await page.screenshot({ path: out });
await browser.close();

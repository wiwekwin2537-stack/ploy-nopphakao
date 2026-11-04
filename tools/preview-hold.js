// เครื่องมือดูภาพ: ธนู/หน้าไม้ตอนถือเฉยๆ 4 ทิศ (มือต้องอยู่กลางคันพอดี) — node tools/preview-hold.js ไฟล์.png
import { openGame } from '../tests/browser/lib.js';
const { browser, page } = await openGame({ w: 900, h: 500 });
await page.evaluate(() => {
  const P = __ploy, g = P.game; P.startNew(true); g.mode = 'pause';
  const c = document.createElement('canvas'); c.width = 900; c.height = 560; c.id = 'prev';
  const x = c.getContext('2d'); x.fillStyle = '#3a4a2a'; x.fillRect(0, 0, 900, 560);
  ['bamboo_bow', 'wood_crossbow'].forEach((base, r) => {
    g.player.equip.weapon = { uid: 1, base, rarity: 'normal', ilvl: 1, mods: [], sockets: 0, links: [], gems: [], colors: [] };
    const L = P.art.heroLook(g), G = P.art.heroGear(g);
    [0, 1, 2, 3].forEach((dir, i) => { x.save(); x.translate(110 + i * 220, 250 + r * 280); x.scale(4.5, 4.5); P.art.drawHuman(x, L, 0, 0, { ...G, dir, t: 1, moving: false, swing: -1, aim: 0 }); x.restore(); });
  });
  document.body.innerHTML = ''; document.body.appendChild(c);
});
await page.locator('#prev').screenshot({ path: process.argv[2] });
await browser.close();

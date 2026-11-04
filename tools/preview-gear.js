// เครื่องมือดูภาพ: ไอคอนของ (ซ้าย) เทียบกับตอนสวมบนตัวละคร (ขวา) ทุกชิ้นในช่องที่เลือก — node tools/preview-gear.js head out.png
import { openGame } from '../tests/browser/lib.js';
const [slot = 'head', out = 'preview.png'] = process.argv.slice(2);
const { browser, page } = await openGame({ w: 900, h: 700 });
await page.evaluate((slot) => {
  const P = __ploy, g = P.game, I = g.data.items, ids = Object.keys(I.bases).filter((k) => I.bases[k].slot === slot);
  P.startNew(true); g.mode = 'pause';
  const c = document.createElement('canvas'); c.width = 900; c.height = 160 * Math.ceil(ids.length / 2); c.id = 'prev';
  const x = c.getContext('2d'); x.fillStyle = '#3a4a2a'; x.fillRect(0, 0, c.width, c.height);
  const key = slot === 'weapon' ? 'weapon' : slot === 'arms' ? 'arms' : slot;
  ids.forEach((id, i) => {
    const ox = (i % 2) * 450, oy = Math.floor(i / 2) * 160;
    x.drawImage(P.art.itemSprite(I, id, 128), ox + 10, oy + 10, 90, 90);
    g.player.equip[key] = { uid: 900 + i, base: id, rarity: 'normal', ilvl: 1, mods: [], sockets: 0, links: [], gems: [], colors: [] };
    const L = P.art.heroLook(g), G = P.art.heroGear(g);
    for (const [d, dx] of [[0, 170], [1, 260], [3, 350]]) { x.save(); x.translate(ox + dx, oy + 140); x.scale(2.2, 2.2); P.art.drawHuman(x, L, 0, 0, { ...G, dir: d, t: 0.3, moving: false, swing: -1 }); x.restore(); }
    x.fillStyle = '#fff'; x.font = '13px sans-serif'; x.fillText(I.bases[id].name, ox + 10, oy + 120);
  });
  document.body.innerHTML = ''; document.body.appendChild(c);
}, slot);
await page.locator('#prev').screenshot({ path: out });
await browser.close();

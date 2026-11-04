// เครื่องมือดูภาพ: ท่ายิงธนู/ร่ายคทา ทีละจังหวะ หลายทิศ — node tools/preview-shoot.js out.png
import { openGame } from '../tests/browser/lib.js';
const out = process.argv[2] || 'shoot.png';
const { browser, page } = await openGame({ w: 900, h: 700 });
await page.evaluate(() => {
  const P = __ploy, g = P.game, I = g.data.items; P.startNew(true); g.mode = 'pause';
  const c = document.createElement('canvas'); c.width = 900; c.height = 560; c.id = 'prev';
  const x = c.getContext('2d'); x.fillStyle = '#3a4a2a'; x.fillRect(0, 0, 900, 560);
  const rows = [['bamboo_bow', 'bow'], ['wood_crossbow', 'crossbow'], ['herb_staff', 'staff']];
  const aims = [[0, 3], [Math.PI * 0.75, 2], [Math.PI / 2, 0], [-Math.PI / 2, 1]];
  rows.forEach(([base, kind], r) => {
    g.player.equip.weapon = { uid: 1, base, rarity: 'normal', ilvl: 1, mods: [], sockets: 0, links: [], gems: [], colors: [] };
    const L = P.art.heroLook(g), G = P.art.heroGear(g);
    let col = 0;
    for (const [aim, dir] of aims) for (const t of [0.3, 0.55, 0.75]) {
      if (col > 10) continue;
      x.save(); x.translate(40 + col * 80, 150 + r * 180); x.scale(2, 2);
      P.art.drawHuman(x, L, 0, 0, { ...G, dir, t: 1, moving: false, swing: -1, aim, shoot: t, shootKind: kind });
      x.restore(); col++;
    }
  });
  document.body.innerHTML = ''; document.body.appendChild(c);
});
await page.locator('#prev').screenshot({ path: out });
await browser.close();

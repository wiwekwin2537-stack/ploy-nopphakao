// เครื่องมือดูภาพ: มอนหลายชนิดเรียงกัน ท่ายืน + ท่าง้าง — node tools/preview-mobs.js ไฟล์.png ชนิด1,ชนิด2,...
import { openGame } from '../tests/browser/lib.js';
const types = (process.argv[3] || 'naga_soldier,mermaid,sea_crab,naga_king').split(',');
const W = Math.max(600, types.length * 200);
const { browser, page } = await openGame({ w: 900, h: 500 });
await page.evaluate(({ types, W }) => {
  const P = __ploy; P.game.mode = 'pause';
  const c = document.createElement('canvas'); c.width = W; c.height = 620; c.id = 'prev';
  const x = c.getContext('2d'); x.fillStyle = '#3a4a3a'; x.fillRect(0, 0, W, 620);
  types.forEach((t, i) => [0, 1].forEach((w) => {
    x.save(); x.translate(100 + i * 200, 270 + w * 300); x.scale(1.6, 1.6);
    P.art.drawMonster(x, t, 0, 0, { t: 1.3, walk: 0.3, moving: !w, face: 1, windup: w, enraged: false, flash: 0, dying: 0, recoil: 0 });
    x.restore();
  }));
  document.body.innerHTML = ''; document.body.appendChild(c);
}, { types, W });
await page.locator('#prev').screenshot({ path: process.argv[2] });
await browser.close();

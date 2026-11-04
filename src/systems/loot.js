// ของดรอป: เบี้ยและพลอย — เก็บได้ครั้งเดียว แล้วหายจากพื้นทันที
import { rollGemDrop, ownsGem, gemType, gemInfo } from './gems.js';
import { rollItem, giveItem, itemName } from './items.js';

let nextDropId = 1;

export function setupLoot(game) {
  game.events.on('mobKilled', ({ mob }) => {
    const def = mob.def, rng = game.rng, G = game.data.gems;
    if (rng.chance(def.coinChance)) {
      const amount = rng.int(def.coins[0], def.coins[1]) * mob.level;
      spawnDrop(game, { kind: 'coin', amount, x: mob.x, y: mob.y });
    }
    // พลอยประจำบอส (เช่น ทับทิมจากพญาหมูป่า) ได้เม็ดเดียวต่อตัวละคร
    if (def.drop && !ownsGem(game.player, def.drop) && !game.drops.some((d) => d.gem === def.drop)) {
      spawnDrop(game, { kind: 'gem', gem: def.drop, x: mob.x, y: mob.y });
    } else if (game.flags.tutorialDone) {
      const g = rollGemDrop(G, rng, mob.level);
      if (g) spawnDrop(game, { kind: 'gem', gem: g, x: mob.x, y: mob.y });
      const I = game.data.items;
      if (rng.chance(I.dropChance)) {
        const it = rollItem(I, rng, mob.level);
        if (it) spawnDrop(game, { kind: 'item', item: it, x: mob.x, y: mob.y });
      }
    }
  });
}

export function spawnDrop(game, d) {
  const a = Math.random() * Math.PI * 2;
  game.drops.push({ id: nextDropId++, t: 0, z: 0, vz: 120, vx: Math.cos(a) * 40, vy: Math.sin(a) * 20, ...d });
}

function pickGem(game, gem) {
  const p = game.player, G = game.data.gems;
  // ทับทิมเม็ดแรกฝังลงชุดสกิลที่ 1 ให้เลย (บทนำ)
  if (gem === 'ruby' && !p.sockets[0][0] && !ownsGem(p, 'ruby')) p.sockets[0][0] = 'ruby';
  else p.bag.push(gem);
  if (gem === 'ruby') game.flags.gotRuby = true;
  game.world.refreshFlags();
  const info = gemInfo(G, gem);
  game.fx.burst(p.x, p.y - 20, info.hi || info.color, 24, 130, 0.8, 3);
  game.fx.text(p.x, p.y - 74, 'ได้' + info.name + '!', info.hi || '#ffe9a8', true);
  game.audio.play('gem');
  if (gem !== 'ruby' && !game.flags.bagHint) {
    game.flags.bagHint = true;
    game.notice = { text: (gemType(G, gem) === 'support' ? 'ได้พลอยเสริม! ' : 'ได้พลอยหลักใหม่! ') + 'เปิดกระเป๋าพลอย (ปุ่มกระเป๋า / B) เพื่อฝัง', t: 7 };
  }
  game.events.emit('gemPicked', { gem });
}

export function updateLoot(game, dt) {
  const p = game.player;
  for (let i = game.drops.length - 1; i >= 0; i--) {
    const d = game.drops[i];
    d.t += dt;
    if (d.z > 0 || d.vz > 0) { d.z += d.vz * dt; d.vz -= 420 * dt; if (d.z <= 0) { d.z = 0; d.vz = 0; } d.x += d.vx * dt; d.y += d.vy * dt; }
    if (p.dead || d.t < 0.35) continue;
    const dist = Math.hypot(p.x - d.x, p.y - d.y);
    const magnet = d.kind === 'coin' ? 80 : d.kind === 'item' ? 28 : 40;
    if (dist < magnet) { const k = Math.min(1, dt * 9); d.x += (p.x - d.x) * k; d.y += (p.y - d.y) * k; }
    if (dist < 16) {
      game.drops.splice(i, 1);
      if (d.kind === 'coin') {
        p.coins += d.amount;
        game.fx.text(p.x, p.y - 60, '+' + d.amount + ' เบี้ย', '#ffd24a');
        game.audio.play('coin');
        game.events.emit('coinsPicked', { amount: d.amount });
      } else if (d.kind === 'gem') pickGem(game, d.gem);
      else if (d.kind === 'item') {
        const I = game.data.items;
        if (!giveItem(p, I, d.item)) {                       // กระเป๋าเต็ม: ของยังอยู่ที่พื้น
          game.drops.push(d); d.t = -1.5;
          game.notice = { text: 'กระเป๋าเต็ม! เปิดกระเป๋าเพื่อทิ้งหรือสวมของ', t: 4 };
          continue;
        }
        const col = I.rarity[d.item.rarity].color;
        game.fx.text(p.x, p.y - 74, itemName(I, d.item), col, d.item.rarity !== 'normal');
        game.audio.play(d.item.rarity === 'purple' || d.item.rarity === 'red' ? 'gem' : 'coin');
        if (!game.flags.gearHint) { game.flags.gearHint = true; game.notice = { text: 'ได้ของสวมใส่! เปิดกระเป๋า แตะแถบ "ชุด" เพื่อสวม', t: 6 }; }
        game.events.emit('itemPicked', { uid: d.item.uid });
      }
    }
  }
}

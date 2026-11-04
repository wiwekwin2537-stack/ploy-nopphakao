// ของดรอป: เบี้ยและพลอย — เก็บได้ครั้งเดียว แล้วหายจากพื้นทันที
import { rollGemDrop, ownsGem, gemType, gemInfo, autoSocket } from './gems.js';
import { rollItem, giveItem, itemName } from './items.js';
import { makeUnique, rollBossUnique, rollWorldUnique } from './uniques.js';
import { classGem } from './player.js';

let nextDropId = 1;

export function setupLoot(game) {
  game.events.on('mobKilled', ({ mob }) => {
    if (mob.named && !game.flags[mob.named.flag]) { game.flags[mob.named.flag] = true; game.notice = { text: `ล้ม${mob.named.name}แล้ว! กลับไปรับรางวัลในเมือง`, t: 6 }; game.events.emit('questProgress', { flag: mob.named.flag }); }
    const def = mob.def, rng = game.rng, G = game.data.gems, T = mob.elite ? game.data.balance.elites.tiers[mob.elite] : null;
    if (T || rng.chance(def.coinChance)) {                         // มอนพิเศษได้เบี้ยแน่นอน คูณตามระดับ
      const amount = rng.int(def.coins[0], def.coins[1]) * mob.level * (T ? T.coins : 1);
      spawnDrop(game, { kind: 'coin', amount, x: mob.x, y: mob.y });
    }
    if (def.bossLoot) bossLoot(game, mob);
    // พลอยประจำบอส (เช่น ทับทิมจากพญาหมูป่า) ได้เม็ดเดียวต่อตัวละคร
    if (def.drop && !ownsGem(game.player, def.drop) && !game.drops.some((d) => d.gem === def.drop)) {
      spawnDrop(game, { kind: 'gem', gem: def.drop, x: mob.x, y: mob.y });
    } else if (game.flags.tutorialDone) {
      const g = rollGemDrop(G, rng, mob.level);
      if (g) spawnDrop(game, { kind: 'gem', gem: g, x: mob.x, y: mob.y });
      const I = game.data.items;
      for (const [k, c] of Object.entries(I.currency)) if (mob.level >= c.minLevel && rng.chance(c.dropChance * (T ? T.currencyMult : 1))) spawnDrop(game, { kind: 'currency', cur: k, x: mob.x, y: mob.y });
      const wu = rollWorldUnique(I, rng, mob.level);               // ยูนีคจากมอนทั่วไป (หายากมาก)
      if (wu) spawnDrop(game, { kind: 'item', item: makeUnique(I, rng, wu, mob.level), x: mob.x, y: mob.y - 8 });
      for (let i = 0; T && i < T.items; i++) {                     // มอนพิเศษ: ของแน่นอน (หายาก = อย่างน้อยสีเขียว)
        let it = rollItem(I, rng, mob.level);
        if (it && T.itemRarity && it.rarity === 'normal') it = rollItem(I, rng, mob.level, { rarity: T.itemRarity });
        if (it) spawnDrop(game, { kind: 'item', item: it, x: mob.x + (i - 0.5) * 24, y: mob.y + 6 });
      }
      if (rng.chance(I.dropChance * (1 + (game.world.zone.def.itemQty || 0)))) {
        const it = rollItem(I, rng, mob.level);
        if (it) spawnDrop(game, { kind: 'item', item: it, x: mob.x, y: mob.y });
      }
    }
  });
}

// ของบอส: ไอเท็มม่วงขึ้นไป (มีโอกาสแดง) + พลอยแน่นอน — เกิดครั้งเดียวต่อการล้มบอสหนึ่งครั้ง
function bossLoot(game, mob) {
  const L = mob.def.bossLoot, rng = game.rng, I = game.data.items, G = game.data.gems;
  for (let i = 0; i < L.items; i++) {
    const it = rollItem(I, rng, mob.level, { rarity: rng.chance(L.redChance) ? 'red' : L.rarity });
    if (it) spawnDrop(game, { kind: 'item', item: it, x: mob.x + (i - 0.5) * 30, y: mob.y });
  }
  const uid = rollBossUnique(I, rng, mob.type);                 // ของยูนีคประจำตัวบอส
  if (uid) spawnDrop(game, { kind: 'item', item: makeUnique(I, rng, uid, mob.level), x: mob.x, y: mob.y + 22 });
  const pool = G.drops.filter((d) => mob.level >= d.minLevel).map((d) => d.gem);
  for (let i = 0; i < L.gems && pool.length; i++) spawnDrop(game, { kind: 'gem', gem: rng.pick(pool), x: mob.x, y: mob.y + 10 });
  for (const [k, c] of Object.entries(I.currency)) if (c.bossGift) spawnDrop(game, { kind: 'currency', cur: k, x: mob.x, y: mob.y - 10 });
  const mt = game.world.zone.def.mapTier;                       // บอสในถ้ำลายแทง: ได้ลายแทงขั้นถัดไป (สูงสุดขั้น 5)
  if (mt) spawnDrop(game, { kind: 'currency', cur: 'map' + Math.min(5, mt + 1), x: mob.x + 20, y: mob.y });
  else if (mob.level >= 13) spawnDrop(game, { kind: 'currency', cur: 'map1', x: mob.x + 20, y: mob.y });
  game.flags[mob.type + 'Slain'] = true;
  game.notice = { text: 'ล้ม' + mob.def.name + 'สำเร็จ! ประตูมิติกลับทุ่งนาเปิดแล้ว', t: 6 };
  game.audio.play('level');
  game.events.emit('bossKilled', { mob });
}

export function spawnDrop(game, d) {
  const a = Math.random() * Math.PI * 2;
  game.drops.push({ id: nextDropId++, t: 0, z: 0, vz: 120, vx: Math.cos(a) * 40, vy: Math.sin(a) * 20, ...d });
}

function pickGem(game, gem) {
  const p = game.player, G = game.data.gems;
  // พลอยสกิลเม็ดแรกของอาชีพฝังลงช่องอาวุธให้เลย (บทนำ)
  const first = gem === classGem(game.data, p) && !game.flags.gotRuby;
  if (first && !ownsGem(p, gem)) autoSocket(p, gem, game.data.gems);
  else p.bag.push(gem);
  if (first) game.flags.gotRuby = true;
  game.world.refreshFlags();
  const info = gemInfo(G, gem);
  game.fx.burst(p.x, p.y - 20, info.hi || info.color, 24, 130, 0.8, 3);
  game.fx.text(p.x, p.y - 74, 'ได้' + info.name + '!', info.hi || '#ffe9a8', true);
  game.audio.play('gem');
  if (!first && !game.flags.bagHint) {
    game.flags.bagHint = true;
    game.notice = { text: (gemType(G, gem) === 'support' ? 'ได้พลอยเสริม! ' : 'ได้พลอยสกิลใหม่! ') + 'แตะรูปตัวละครมุมซ้ายบน → แถบพลอย เพื่อฝัง', t: 7 };
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
      else if (d.kind === 'currency') {
        const c = game.data.items.currency[d.cur];
        p.currency[d.cur] = (p.currency[d.cur] || 0) + 1;
        game.fx.text(p.x, p.y - 74, 'ได้' + c.name, c.color, true);
        game.audio.play('gem');
        if (!game.flags.curHint) { game.flags.curHint = true; game.notice = { text: `ได้${c.name}! ใช้เจาะ/เชื่อมช่องพลอยในโปรไฟล์ → แถบพลอย`, t: 7 }; }
        game.events.emit('currencyPicked', { cur: d.cur });
      }
      else if (d.kind === 'item') {
        const I = game.data.items;
        if (!giveItem(p, I, d.item)) {                       // กระเป๋าเต็ม: ของยังอยู่ที่พื้น
          game.drops.push(d); d.t = -1.5;
          game.notice = { text: 'กระเป๋าเต็ม! แตะรูปตัวละคร → แถบชุด เพื่อทิ้งหรือสวมของ', t: 4 };
          continue;
        }
        const col = I.rarity[d.item.rarity].color;
        game.fx.text(p.x, p.y - 74, itemName(I, d.item), col, d.item.rarity !== 'normal');
        game.audio.play(['purple', 'red', 'unique'].includes(d.item.rarity) ? 'gem' : 'coin');
        if (!game.flags.gearHint) { game.flags.gearHint = true; game.notice = { text: 'ได้ของสวมใส่! แตะรูปตัวละครมุมซ้ายบน → แถบชุด เพื่อสวม', t: 6 }; }
        game.events.emit('itemPicked', { uid: d.item.uid });
      }
    }
  }
}

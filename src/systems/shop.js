// ร้านค้าในเวียง + ยาหม้อ: ซื้อ/ขายย้ายเบี้ยกับของแบบจำนวนตรงกันเสมอ (ไม่มีทางปั๊มเงิน/ของ) — ราคาอยู่ใน data/shop.json
import { giveItem } from './items.js';
import { playerStats } from './stats.js';

// ราคาขายคืน: ตามระดับความหายาก × เลเวลของ (ต่ำกว่าราคาซื้อเสมอ)
export function sellPrice(S, it) {
  return Math.max(1, Math.round((S.sell[it.rarity] || 1) * (1 + (it.ilvl || 1) * S.sell.perLevel)));
}

export function buyPotion(game) {
  const p = game.player, P = game.data.shop.potion;
  if (p.potions >= P.max) return 'full';
  if (p.coins < P.price) return 'poor';
  p.coins -= P.price; p.potions++;
  game.events.emit('shopChanged', { kind: 'potion' });
  return 'ok';
}

export function buyItem(game, idx) {
  const p = game.player, S = game.data.shop, I = game.data.items, g = S.stock[idx];
  if (!g || !I.bases[g.base]) return 'none';
  if (p.coins < g.price) return 'poor';
  if (p.items.length >= I.bagSize) return 'bagFull';
  const it = { uid: 0, base: g.base, rarity: 'normal', ilvl: I.bases[g.base].req, mods: [], rareName: null };
  if (!giveItem(p, I, it)) return 'bagFull';
  p.coins -= g.price;
  game.events.emit('shopChanged', { kind: 'buy', uid: it.uid });
  return 'ok';
}

// ขายได้เฉพาะของในกระเป๋า (ของที่สวมอยู่ต้องถอดก่อน) ชิ้นหนึ่งขายได้ครั้งเดียว
export function sellItem(game, uid) {
  const p = game.player, i = p.items.findIndex((x) => x.uid === uid);
  if (i < 0) return 0;
  const [it] = p.items.splice(i, 1);
  const price = sellPrice(game.data.shop, it);
  p.coins += price;
  game.events.emit('shopChanged', { kind: 'sell', uid });
  return price;
}

export function drinkPotion(game) {
  const p = game.player, P = game.data.shop.potion;
  if (p.dead || p.potions <= 0 || (p.potionCd || 0) > 0) return false;
  const max = playerStats(p, game.data).maxHp;
  if (p.hp >= max) { game.notice = { text: 'เลือดเต็มอยู่แล้ว', t: 1.5 }; return false; }
  p.potions--; p.potionCd = P.cooldown;
  const heal = Math.round(max * P.heal);
  p.hp = Math.min(max, p.hp + heal);
  game.fx.text(p.x, p.y - 60, '+' + heal, '#7dff8a', true);
  game.fx.burst(p.x, p.y - 20, '#7dff8a', 14, 80, 0.6, 3);
  game.audio.play('gem');
  game.events.emit('potionUsed', {});
  return true;
}

export function updatePotion(game, dt) {
  const p = game.player;
  p.potionCd = Math.max(0, (p.potionCd || 0) - dt);
  if (game.input.pressed.potion) drinkPotion(game);
}

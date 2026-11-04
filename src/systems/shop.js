// ร้านค้าในเวียง + ยาหม้อ: ซื้อ/ขายย้ายเบี้ยกับของแบบจำนวนตรงกันเสมอ (ไม่มีทางปั๊มเงิน/ของ) — ราคาอยู่ใน data/shop.json
import { giveItem, rollSockets } from './items.js';
import { returnGems } from './gems.js';
import { playerStats } from './stats.js';

// ราคาขายคืน: ตามระดับความหายาก × เลเวลของ (ต่ำกว่าราคาซื้อเสมอ)
export function sellPrice(S, it) {
  return Math.max(1, Math.round((S.sell[it.rarity] || 1) * (1 + (it.ilvl || 1) * S.sell.perLevel)));
}

// ขวดยา 2 ชนิด: 'hp' = ยาหม้อ (เลือด) · 'mp' = น้ำมนต์ (มานา)
export const FLASK = { hp: { data: 'potion', count: 'potions', cd: 'potionCd', stat: 'maxHp', cur: 'hp', col: '#7dff8a', full: 'เลือดเต็มอยู่แล้ว' },
  mp: { data: 'manaPotion', count: 'mpPotions', cd: 'mpPotionCd', stat: 'maxMp', cur: 'mp', col: '#8ab4ff', full: 'มานาเต็มอยู่แล้ว' } };

export function buyPotion(game, kind = 'hp') {
  const p = game.player, F = FLASK[kind], P = game.data.shop[F.data];
  if (p[F.count] >= P.max) return 'full';
  if (p.coins < P.price) return 'poor';
  p.coins -= P.price; p[F.count]++;
  game.events.emit('shopChanged', { kind: 'potion' });
  return 'ok';
}

export function buyItem(game, idx) {
  const p = game.player, S = game.data.shop, I = game.data.items, g = S.stock[idx];
  if (g && g.currency && I.currency[g.currency]) {                 // ศิลาเจาะ / ด้ายสายสิญจน์
    if (p.coins < g.price) return 'poor';
    p.coins -= g.price; p.currency[g.currency] = (p.currency[g.currency] || 0) + 1;
    game.events.emit('shopChanged', { kind: 'currency' });
    return 'ok';
  }
  if (!g || !I.bases[g.base]) return 'none';
  if (p.coins < g.price) return 'poor';
  if (p.items.length >= I.bagSize) return 'bagFull';
  const it = rollSockets(I, game.rng, { uid: 0, base: g.base, rarity: 'normal', ilvl: I.bases[g.base].req, mods: [], rareName: null });
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
  returnGems(p, it);                                   // พลอยในช่องกลับกระเป๋า ไม่หายไปกับของ
  const price = sellPrice(game.data.shop, it);
  p.coins += price;
  game.events.emit('shopChanged', { kind: 'sell', uid });
  return price;
}

export function drinkPotion(game, kind = 'hp') {
  const p = game.player, F = FLASK[kind], P = game.data.shop[F.data];
  if (p.dead || p[F.count] <= 0 || (p[F.cd] || 0) > 0) return false;
  const max = playerStats(p, game.data)[F.stat];
  if (p[F.cur] >= max) { game.notice = { text: F.full, t: 1.5 }; return false; }
  p[F.count]--; p[F.cd] = P.cooldown;
  const heal = Math.round(max * P.heal);
  p[F.cur] = Math.min(max, p[F.cur] + heal);
  game.fx.text(p.x, p.y - 60, '+' + heal, F.col, true);
  game.fx.burst(p.x, p.y - 20, F.col, 14, 80, 0.6, 3);
  game.audio.play('gem');
  game.events.emit('potionUsed', {});
  return true;
}

export function updatePotion(game, dt) {
  const p = game.player;
  p.potionCd = Math.max(0, (p.potionCd || 0) - dt);
  p.mpPotionCd = Math.max(0, (p.mpPotionCd || 0) - dt);
  if (game.input.pressed.potion) drinkPotion(game, 'hp');
  if (game.input.pressed.manapot) drinkPotion(game, 'mp');
}

// เติมขวดจากการฆ่า (แบบ PoE): แต้มสะสมต่อขวด ครบ killsPerRefill = ได้ขวดคืน 1 ขวด (ไม่เกินความจุ)
export function chargeFlasks(game, pts) {
  const p = game.player, out = [];
  for (const [kind, F] of Object.entries(FLASK)) {
    const P = game.data.shop[F.data], key = F.count + 'Charge';
    if (p[F.count] >= P.max) { p[key] = 0; continue; }
    p[key] = (p[key] || 0) + pts;
    while (p[key] >= P.killsPerRefill && p[F.count] < P.max) { p[key] -= P.killsPerRefill; p[F.count]++; out.push(kind); }
    if (p[F.count] >= P.max) p[key] = 0;
  }
  return out;
}

export function setupFlasks(game) {
  game.events.on('mobKilled', ({ mob }) => {
    if (!game.flags.tutorialDone) return;
    const C = game.data.shop.flaskCharge, got = chargeFlasks(game, mob.def.boss ? C.boss : C[mob.elite || 'normal']);
    for (const k of got) game.fx.text(game.player.x + (k === 'hp' ? -14 : 14), game.player.y - 48, k === 'hp' ? '+ยาหม้อ' : '+น้ำมนต์', FLASK[k].col);
  });
}

// ร้านค้า + ยาหม้อ: ซื้อ/ขายไม่ปั๊มเงิน/ของ เซฟรุ่น 6
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGame } from './helpers.js';
import { buyPotion, buyItem, sellItem, sellPrice, drinkPotion } from '../../src/systems/shop.js';
import { rollItem, giveItem } from '../../src/systems/items.js';
import { serialize, validate } from '../../src/systems/save.js';
import { playerStats } from '../../src/systems/stats.js';
import { enterZone } from '../../src/systems/travel.js';

test('ซื้อยาหม้อ: เบี้ยลดตามราคา เต็มแล้วซื้อไม่ได้ เบี้ยไม่พอซื้อไม่ได้', () => {
  const g = makeGame(), p = g.player, P = g.data.shop.potion;
  p.coins = P.price * 10;
  for (let i = 0; i < P.max + 3; i++) buyPotion(g);
  assert.equal(p.potions, P.max);
  assert.equal(p.coins, P.price * 10 - P.price * P.max);
  p.potions = 0; p.coins = P.price - 1;
  assert.equal(buyPotion(g), 'poor');
  assert.equal(p.potions, 0); assert.equal(p.coins, P.price - 1);
});

test('ซื้อของ: ได้ของธรรมดา uid ใหม่ไม่ซ้ำ เบี้ยไม่พอ/กระเป๋าเต็มแล้วไม่เสียเบี้ย', () => {
  const g = makeGame(), p = g.player, S = g.data.shop, I = g.data.items;
  p.coins = 10000;
  const k = S.stock.findIndex((x) => x.base), k2 = S.stock.findIndex((x, i) => x.base && i > k);
  assert.equal(buyItem(g, k), 'ok'); assert.equal(buyItem(g, k), 'ok');
  assert.equal(p.items.length, 2);
  assert.notEqual(p.items[0].uid, p.items[1].uid);
  assert.equal(p.items[0].rarity, 'normal');
  assert.equal(p.coins, 10000 - S.stock[k].price * 2);
  while (p.items.length < I.bagSize) giveItem(p, I, rollItem(I, g.rng, 3));
  const c = p.coins;
  assert.equal(buyItem(g, k2), 'bagFull'); assert.equal(p.coins, c);
  p.coins = 0; p.items.length = 0;
  assert.equal(buyItem(g, k2), 'poor'); assert.equal(p.items.length, 0);
});

test('ขายของ: ได้เบี้ยครั้งเดียว ของหายจากกระเป๋า ขายซ้ำไม่ได้ ขายของที่สวมอยู่ไม่ได้', () => {
  const g = makeGame(), p = g.player, I = g.data.items;
  giveItem(p, I, rollItem(I, g.rng, 5, { rarity: 'purple' }));
  const it = p.items[0], price = sellPrice(g.data.shop, it);
  assert.equal(sellItem(g, it.uid), price);
  assert.equal(sellItem(g, it.uid), 0);
  assert.equal(p.coins, price); assert.equal(p.items.length, 0);
  p.equip.weapon = { uid: ++p.nextUid, base: 'bamboo_sword', rarity: 'normal', ilvl: 1, mods: [], rareName: null };
  assert.equal(sellItem(g, p.equip.weapon.uid), 0);
  assert.ok(p.equip.weapon);
});

test('ซื้อแล้วขายคืนทันที ขาดทุนเสมอ (ปั๊มเงินไม่ได้) ทุกชิ้นในร้าน', () => {
  const g = makeGame(), p = g.player, S = g.data.shop;
  S.stock.forEach((st, i) => {
    if (!st.base) return;                              // ศิลา/ด้าย ขายคืนไม่ได้อยู่แล้ว
    p.coins = 1000; p.items.length = 0;
    buyItem(g, i); sellItem(g, p.items[0].uid);
    assert.ok(p.coins < 1000, `${st.base} ซื้อแล้วขายได้กำไร`);
  });
});

test('ดื่มยาหม้อ: ฟื้นเลือด ใช้ขวดเดียว มีคูลดาวน์ เลือดเต็มไม่เสียขวด', () => {
  const g = makeGame(), p = g.player, max = playerStats(p, g.data).maxHp;
  enterZone(g, 'field');
  p.potions = 2; p.hp = 10;
  assert.equal(drinkPotion(g), true);
  assert.equal(p.potions, 1); assert.ok(p.hp > 10);
  assert.equal(drinkPotion(g), false, 'ติดคูลดาวน์');
  p.potionCd = 0; p.hp = max;
  assert.equal(drinkPotion(g), false); assert.equal(p.potions, 1);
});

test('เซฟรุ่น 6: เก็บยาหม้อ เซฟเก่ารุ่น 5 แปลงได้ ยาหม้อเกินสูงสุดถือว่าเซฟเสีย', () => {
  const g = makeGame(); enterZone(g, 'town'); g.player.potions = 3;
  const s = JSON.parse(JSON.stringify(serialize(g)));
  assert.equal(validate(s, g.data).potions, 3);
  const old = { ...s, v: 5 }; delete old.potions;
  assert.equal(validate(old, g.data).potions, 0);
  assert.equal(validate({ ...s, potions: 999 }, g.data), null);
});

test('ซื้อศิลาเจาะ/ด้ายสายสิญจน์: ได้ 1 ชิ้น เบี้ยลดตามราคา เบี้ยไม่พอไม่ได้', () => {
  const g = makeGame(), p = g.player, S = g.data.shop;
  const j = S.stock.findIndex((x) => x.currency === 'jeweller'), f = S.stock.findIndex((x) => x.currency === 'fusing');
  p.coins = S.stock[j].price + S.stock[f].price;
  assert.equal(buyItem(g, j), 'ok'); assert.equal(buyItem(g, f), 'ok');
  assert.deepEqual([p.currency.jeweller, p.currency.fusing, p.coins], [1, 1, 0]);
  assert.equal(buyItem(g, j), 'poor'); assert.equal(p.currency.jeweller, 1);
});

test('น้ำมนต์: ซื้อ/ดื่มฟื้นมานา แยกคูลดาวน์กับยาหม้อ เซฟเก่ารุ่น 7 ได้น้ำมนต์ 2 ขวด', () => {
  const g = makeGame(), p = g.player, P = g.data.shop.manaPotion;
  enterZone(g, 'field');
  p.coins = P.price; assert.equal(buyPotion(g, 'mp'), 'ok'); assert.equal(p.mpPotions, 1); assert.equal(p.coins, 0);
  p.mp = 1; p.hp = 10; p.potions = 1;
  assert.equal(drinkPotion(g, 'mp'), true); assert.ok(p.mp > 1); assert.equal(p.mpPotions, 0);
  assert.equal(drinkPotion(g, 'hp'), true, 'ยาหม้อไม่ติดคูลดาวน์ของน้ำมนต์');
  const s = JSON.parse(JSON.stringify(serialize(g)));
  const old = { ...s, v: 7 }; delete old.mpPotions;
  assert.equal(validate(old, g.data).mpPotions, 2);
  assert.equal(validate({ ...s, mpPotions: 99 }, g.data), null);
});

test('ข้อความตรงกับค่าจริง: ยาหม้อ/น้ำมนต์บอก % ตรงกับค่าฟื้น · ลายแทงบอกเลเวลมอนตรงกับสูตรถ้ำ', () => {
  const g = makeGame(), S = g.data.shop, I = g.data.items, MP = g.data.balance.maps;
  assert.ok(S.potion.desc.includes(Math.round(S.potion.heal * 100) + '%'));
  assert.ok(S.manaPotion.desc.includes(Math.round(S.manaPotion.heal * 100) + '%'));
  for (let t = 1; t <= 5; t++) assert.ok(I.currency['map' + t].desc.includes('เลเวล ' + (MP.levelBase + t * MP.levelPerTier)), 'map' + t);
});

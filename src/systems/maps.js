// ถ้ำลายแทง (แบบ maps ของ PoE): ใช้ "ลายแทงขั้น N" ที่แท่นในเวียง → สร้างถ้ำสุ่มใหม่ทุกครั้ง
// ห้องต่อกันเป็นสาย · มอนสุ่มจากรายชื่อ · ค่าปรับสุ่ม (ยิ่งขั้นสูงยิ่งหลายอย่าง ของตกมากขึ้น) · ห้องสุดท้ายมีบอสสุ่ม
// ล้มบอส = ประตูมิติกลับเวียง + ลายแทงขั้นถัดไป · ตัวเลขทั้งหมดอยู่ใน data/balance.json "maps"
import { createRng } from '../core/rng.js';
import { enterZone } from './travel.js';

const CELL = 18, COLS = 3, ROWS = 2;

// สร้างนิยามพื้นที่แบบเดียวกับ data/zones.json (ใช้ระบบเดิมทั้งหมด: กำแพงอัตโนมัติ เกิดมอน ทางออก)
export function generateMap(game, tier, seed) {
  const R = createRng(seed), MP = game.data.balance.maps, lv = MP.levelBase + tier * MP.levelPerTier;
  // เส้นทางห้อง: เดินสุ่มบนตาราง 3×2 ไม่ซ้ำช่อง 4–6 ห้อง
  const path = [[0, R.int(0, ROWS - 1)]], seen = new Set([path[0].join()]);
  while (path.length < 6) {
    const [c, r] = path[path.length - 1];
    const next = [[c + 1, r], [c, r + 1], [c, r - 1], [c - 1, r]].filter(([a, b]) => a >= 0 && b >= 0 && a < COLS && b < ROWS && !seen.has(a + ',' + b));
    if (!next.length) break;
    const n = R.pick(next.filter(([a]) => a >= c).length ? next.filter(([a]) => a >= c) : next);
    path.push(n); seen.add(n.join());
  }
  const rooms = path.map(([c, r], i) => {
    const w = R.int(10, 14), h = R.int(9, 12);
    return { x: c * CELL + 2 + R.int(0, CELL - w - 3), y: r * CELL + 2 + R.int(0, CELL - h - 3), w, h, i };
  });
  const roads = rooms.map((m) => ({ x: m.x, y: m.y, w: m.w, h: m.h }));
  for (let i = 1; i < rooms.length; i++) {                     // ทางเดินรูปตัว L กว้าง 3 ช่อง
    const a = rooms[i - 1], b = rooms[i], ax = Math.floor(a.x + a.w / 2), ay = Math.floor(a.y + a.h / 2), bx = Math.floor(b.x + b.w / 2), by = Math.floor(b.y + b.h / 2);
    roads.push({ x: Math.min(ax, bx) - 1, y: ay - 1, w: Math.abs(bx - ax) + 3, h: 3 });
    roads.push({ x: bx - 1, y: Math.min(ay, by) - 1, w: 3, h: Math.abs(by - ay) + 3 });
  }
  const mods = [], pool = MP.mods.slice();
  for (let i = 0; i < MP.modsPerTier[tier] && pool.length; i++) mods.push(pool.splice(R.int(0, pool.length - 1), 1)[0]);
  const mobMods = { hp: 1, damage: 1, speed: 1, count: 1 };
  for (const m of mods) for (const k of ['hp', 'damage', 'speed', 'count']) if (m[k]) mobMods[k] *= m[k];
  const first = rooms[0], last = rooms[rooms.length - 1], boss = R.pick(MP.bosses);
  const spawns = [];
  rooms.slice(1, -1).forEach((m) => {
    for (let k = 0; k < 2; k++) spawns.push({ type: R.pick(MP.monsters), count: R.int(3, 5), level: [lv, lv + 1], area: { x: m.x + 1, y: m.y + 1, w: m.w - 2, h: m.h - 2 } });
  });
  spawns.push({ type: boss, count: 1, level: [lv + 1, lv + 1], area: { x: last.x + last.w / 2 - 1, y: last.y + last.h / 2 - 1, w: 2, h: 2 } });
  const sx = first.x + 2, sy = first.y + first.h / 2;
  const px = last.x + last.w - 3, py = last.y + 1.5;
  const altar = game.data.zones.town.objects.find((o) => o.type === 'map_altar');
  const home = { zone: 'town', x: altar.x + 0.7, y: altar.y + 2.2 };
  return {
    name: `ถ้ำลายแทงขั้น ${tier}`, w: COLS * CELL, h: ROWS * CELL, ground: 'dungeon', walled: true, music: 'dungeon', safe: false, seed,
    mapTier: tier, mapMods: mods.map((m) => m.name), mobMods, itemQty: mods.reduce((a, m) => a + (m.qty || 0), 0) + tier * 0.1, saveAt: home,
    roads, water: [], scatter: [], npcs: [], spawns,
    objects: [
      { type: 'stairs_up', x: first.x, y: sy - 1.5, w: 1.4, h: 3, solid: false, label: 'ออกจากถ้ำ (ลายแทงหาย)' },
      { type: 'portal', x: px, y: py, w: 2, h: 1.2, solid: false, label: 'ประตูมิติกลับเวียง', requiresClear: boss },
    ],
    exits: [
      { x: first.x, y: sy - 1.5, w: 0.6, h: 3, to: 'town', tx: home.x, ty: home.y },
      { x: px, y: py, w: 2, h: 1.2, to: 'town', tx: home.x, ty: home.y, requiresClear: boss },
    ],
    start: { x: sx, y: sy },
  };
}

// ใช้ลายแทงขั้น tier: หักลายแทง 1 แผ่น สร้างถ้ำใหม่ แล้วเข้าไป — คืน false ถ้าไม่มีลายแทง
export function openMap(game, tier) {
  const p = game.player, key = 'map' + tier;
  if (!(p.currency[key] > 0)) return false;
  p.currency[key]--;
  game.data.zones.map = generateMap(game, tier, (Date.now() ^ (tier * 7919)) & 0x7fffffff);
  if (game.instances) delete game.instances.map;                 // ลายแทงใหม่ = ถ้ำใหม่ (มอนครบ หมอกปิด)
  game.world.forget('map');
  game.mode = 'play';
  enterZone(game, 'map');
  game.notice = { text: `ถ้ำลายแทงขั้น ${tier}` + (game.data.zones.map.mapMods.length ? ' · ' + game.data.zones.map.mapMods.join(' · ') : ''), t: 6 };
  game.events.emit('currencyUsed', { kind: key });
  return true;
}

export function nearAltar(game) {
  const z = game.world.zone, a = z.objects.find((o) => o.type === 'map_altar'), p = game.player;
  return !!a && Math.hypot(p.x - (a.x + a.w / 2), p.y - (a.y + a.h)) < 46;
}

// ยืนที่แท่นลายแทงแล้วกดคุย = เปิดหน้าเลือกขั้นลายแทง
export function updateAltar(game) {
  game.nearAltar = game.mode === 'play' && nearAltar(game);
  if (game.nearAltar && !game.nearNpc && !game.nearWaypoint && game.input.pressed.interact) { game.mode = 'mapmenu'; game.audio.play('click'); }
}

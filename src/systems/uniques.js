// ของยูนีคแบบ PoE (สีส้ม): ชื่อและค่าตายตัวจาก data/items.json "uniques"
// grants = ได้สกิลจากของ (ขึ้นปุ่มสกิล/เป็นออร่า) · trigger = สกิลทำงานเอง (ฟันโดน/โดนตี) ไม่ใช้มานา
import { rollSockets } from './items.js';
import { computeSkill } from './gems.js';
import { releaseSkill } from './skills.js';

const TRIGGER_CD = 0.4;   // วินาที — กันสกิลทำงานเองรัวเกินไป

export function makeUnique(I, rng, id, ilvl) {
  const U = I.uniques[id];
  return rollSockets(I, rng, { uid: 0, base: U.base, rarity: 'unique', unique: id, ilvl: Math.max(ilvl, I.bases[U.base].req), mods: [], rareName: null });
}

export function uniqueOf(I, it) { return it && it.rarity === 'unique' ? I.uniques[it.unique] || null : null; }

// ยูนีคทั้งหมดที่สวมอยู่
export function wornUniques(I, p) { return Object.values(p.equip || {}).map((it) => uniqueOf(I, it)).filter(Boolean); }

// สุ่มยูนีคจากบอส (คืน id หรือ null)
export function rollBossUnique(I, rng, bossType) {
  for (const [id, U] of Object.entries(I.uniques)) if (id !== '_doc' && U.from && U.from.includes(bossType) && rng.chance(U.chance)) return id;
  return null;
}
// สุ่มยูนีคจากมอนทั่วไป
export function rollWorldUnique(I, rng, level) {
  for (const [id, U] of Object.entries(I.uniques)) if (id !== '_doc' && U.world && level >= U.minLevel && rng.chance(U.chance)) return id;
  return null;
}

// สกิลทำงานเอง: ฟันโดน (playerAttacked) / โดนตี (playerHurt) → ปล่อยสกิลใส่มอนที่ใกล้ที่สุด
export function setupUniques(game) {
  const fire = (on) => {
    const p = game.player, I = game.data.items, G = game.data.gems;
    if ((p.trigCd || 0) > game.time) return;
    for (const U of wornUniques(I, p)) {
      const T = U.trigger;
      if (!T || T.on !== on || !game.rng.chance(T.chance)) continue;
      let best = null, bd = 260;
      for (const m of game.mobs) { if (m.dead) continue; const d = Math.hypot(m.x - p.x, m.y - p.y); if (d < bd) { bd = d; best = m; } }
      if (!best) continue;
      const sk = computeSkill(G, T.gem, [], () => T.level);
      releaseSkill(game, sk, Math.atan2(best.y - best.height * 0.4 - (p.y - 22), best.x - p.x));
      game.fx.text(p.x, p.y - 60, U.name, game.data.items.rarity.unique.color);
      p.trigCd = game.time + TRIGGER_CD;
      game.events.emit('uniqueTriggered', { name: U.name });
      return;
    }
  };
  game.events.on('playerAttacked', ({ hits }) => { if (hits) fire('hit'); });
  game.events.on('playerHurt', () => fire('hurt'));
}

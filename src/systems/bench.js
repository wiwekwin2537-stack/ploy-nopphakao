// โต๊ะช่างแบบ PoE (Crafting Bench) — สูตรทั้งหมดใน data/items.json "bench"
// เพิ่ม "ค่าคราฟต์" ที่เลือกเองได้ 1 ค่าต่อชิ้น (it.craft = id สูตร) แยกจากค่าสุ่ม · ยูนีคคราฟต์ไม่ได้ · ลบแล้วคราฟต์ใหม่ได้

export function nearBench(game) {
  const z = game.world.zone, a = z && z.objects.find((o) => o.type === 'craft_bench'), p = game.player;
  return !!a && Math.hypot(p.x - (a.x + a.w / 2), p.y - (a.y + a.h)) < 46;
}

// ยืนที่โต๊ะช่างแล้วกดคุย = เปิดหน้าโต๊ะช่าง
export function updateBenchSpot(game) {
  game.nearBench = game.mode === 'play' && nearBench(game);
  if (game.nearBench && !game.nearNpc && !game.nearWaypoint && !game.nearAltar && !game.nearStash && game.input.pressed.interact) { game.mode = 'bench'; game.benchSel = null; game.benchRecipe = null; game.audio.play('click'); }
}

export function recipeOf(I, id) { return I.bench.recipes.find((r) => r.id === id) || null; }
export function recipeUnlocked(flags, r) { return !r.unlock || !!flags[r.unlock]; }
export function recipesFor(I, it) { return it ? I.bench.recipes.filter((r) => r.slots.includes(I.bases[it.base].slot)) : []; }

// ของที่คราฟต์ได้: ที่สวมอยู่ก่อน แล้วของในกระเป๋า (ยูนีคไม่นับ)
export function benchItems(I, p) {
  const eq = Object.entries(p.equip).filter(([, it]) => it && it.rarity !== 'unique').map(([slot, it]) => ({ it, slot }));
  return [...eq, ...p.items.filter((it) => it.rarity !== 'unique').map((it) => ({ it, slot: null }))];
}

// เหตุผลที่คราฟต์ไม่ได้ (null = ทำได้)
export function craftBlock(game, it, r) {
  const p = game.player, I = game.data.items;
  if (!it || !r) return 'เลือกของและสูตรก่อน';
  if (it.rarity === 'unique') return 'ของยูนีคคราฟต์ไม่ได้';
  if (!r.slots.includes(I.bases[it.base].slot)) return 'สูตรนี้ใช้กับของชนิดนี้ไม่ได้';
  if (!recipeUnlocked(game.flags, r)) return 'สูตรนี้ยังไม่ปลด';
  if (it.craft) return 'ของชิ้นนี้มีค่าคราฟต์แล้ว — ลบค่าเดิมก่อน';
  if (p.coins < r.cost.coins) return `เบี้ยไม่พอ (ต้องใช้ ${r.cost.coins})`;
  for (const [k, n] of Object.entries(r.cost.currency || {})) if (((p.currency && p.currency[k]) || 0) < n) return `${I.currency[k].name}ไม่พอ (ต้องใช้ ${n})`;
  return null;
}

export function craftBench(game, it, rid) {
  const p = game.player, r = recipeOf(game.data.items, rid);
  if (craftBlock(game, it, r)) return false;
  p.coins -= r.cost.coins;
  for (const [k, n] of Object.entries(r.cost.currency || {})) p.currency[k] -= n;
  it.craft = r.id;
  game.events.emit('gearChanged', { craft: r.id });
  return true;
}

export function removeCraft(game, it) {
  const p = game.player, cost = game.data.items.bench.removeCost;
  if (!it || !it.craft || p.coins < cost) return false;
  p.coins -= cost; delete it.craft;
  game.events.emit('gearChanged', { craft: null });
  return true;
}

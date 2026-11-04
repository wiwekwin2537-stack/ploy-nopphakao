// หีบเก็บของในเวียง (แบบ Stash ของ PoE): ย้ายของระหว่างกระเป๋า (bagSize) กับหีบ (stashSize) — ของในหีบไม่หาย ไม่นับในกระเป๋า
export function nearStash(game) {
  const z = game.world.zone, a = z && z.objects.find((o) => o.type === 'stash'), p = game.player;
  return !!a && Math.hypot(p.x - (a.x + a.w / 2), p.y - (a.y + a.h)) < 46;
}

// ยืนที่หีบแล้วกดคุย = เปิดหน้าหีบ
export function updateStashSpot(game) {
  game.nearStash = game.mode === 'play' && nearStash(game);
  if (game.nearStash && !game.nearNpc && !game.nearWaypoint && !game.nearAltar && game.input.pressed.interact) { game.mode = 'stash'; game.stashSel = null; game.audio.play('click'); }
}

// ย้ายของ 1 ชิ้น (uid) ไปอีกฝั่ง คืน 'ok' | 'full' | null
export function moveItem(game, uid, toStash) {
  const p = game.player, I = game.data.items;
  if (!p.stash) p.stash = [];
  const from = toStash ? p.items : p.stash, to = toStash ? p.stash : p.items, cap = toStash ? I.stashSize : I.bagSize;
  const i = from.findIndex((it) => it.uid === uid);
  if (i < 0) return null;
  if (to.length >= cap) return 'full';
  to.push(from.splice(i, 1)[0]);
  game.events.emit('itemMoved', { uid, toStash });
  return 'ok';
}

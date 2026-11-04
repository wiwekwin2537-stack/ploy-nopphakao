// ชาวเวียงและกล่องบทสนทนา
export function openDialog(game, speaker, lines, onDone) {
  game.dialog = { speaker, lines, i: 0, shown: 0, onDone };
  game.mode = 'dialog';
  game.audio.play('talk');
}

function lineFor(game, npc) {
  const D = game.data.dialogue;
  if (npc.id === 'chan' && !game.flags.metChan) {
    return { lines: D.chan_first, done: () => { game.flags.metChan = true; game.flags.tutorialDone = true; game.events.emit('metChan', {}); } };
  }
  const list = D[npc.id] || ['...'];
  npc.talkIdx = ((npc.talkIdx ?? -1) + 1) % list.length;
  return { lines: [list[npc.talkIdx]], done: null };
}

export function talkTo(game, npc) {
  const p = game.player;
  p.moveTarget = null; p.targetMob = null; game.pendingTalk = null;
  npc.face = p.x < npc.x ? -1 : 1;
  const { lines, done } = lineFor(game, npc);
  openDialog(game, npc.name, lines, done);
}

export function updateNpcs(game) {
  const p = game.player, z = game.world.zone;
  game.nearNpc = null;
  let best = 46;
  for (const n of z.npcs) {
    const d = Math.hypot(n.x - p.x, n.y - p.y);
    if (d < best) { best = d; game.nearNpc = n; }
  }
  // แตะ/คลิกที่ชาวบ้าน = เดินไปคุย
  for (const tap of game.input.taps) {
    if (tap.consumed) continue;
    const w = game.camera.toWorld(tap.sx, tap.sy);
    const n = z.npcs.find((q) => Math.abs(q.x - w.x) < 14 && w.y > q.y - 36 && w.y < q.y + 6);
    if (n) { tap.consumed = true; game.pendingTalk = n; p.moveTarget = { x: n.x, y: n.y + 22 }; p.targetMob = null; }
  }
  if (game.pendingTalk && Math.hypot(game.pendingTalk.x - p.x, game.pendingTalk.y - p.y) < 50) talkTo(game, game.pendingTalk);
  else if (game.nearNpc && game.input.pressed.interact) talkTo(game, game.nearNpc);
}

export function updateDialog(game, dt) {
  const d = game.dialog;
  if (!d) return;
  const line = d.lines[d.i];
  d.shown = Math.min(line.length, d.shown + dt * 40);
  const tapped = game.input.taps.some((t) => !t.consumed);
  game.input.taps.forEach((t) => { t.consumed = true; });
  const adv = game.input.pressed.interact || game.input.pressed.attack || tapped;
  if (!adv) return;
  if (d.shown < line.length) { d.shown = line.length; return; }
  d.i++; d.shown = 0;
  game.audio.play('talk');
  if (d.i >= d.lines.length) {
    game.dialog = null;
    game.mode = 'play';
    game.input.pressed.attack = false;   // ไม่ให้ปุ่มที่กดปิดบทสนทนาไปฟันต่อ
    if (d.onDone) d.onDone();
    game.events.emit('dialogClosed', {});
  }
}

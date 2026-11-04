// ชาวเวียงและกล่องบทสนทนา
import { readyQuestFor, claimQuest } from './quests.js';
import { classGem } from './player.js';
// ระดับเสียงพูดตามหน้าตาตัวละคร (ผู้เฒ่าเสียงต่ำ ยาย/แม่ค้าเสียงสูง)
const VOICE = { elder: 170, guard: 230, merchant: 380, granny: 440, hero: 300 };
export function openDialog(game, speaker, lines, onDone, look) {
  game.dialog = { speaker, lines, i: 0, shown: 0, onDone, pitch: VOICE[look] || 320, blipN: 0, look: look || null };
  game.mode = 'dialog';
  game.audio.play('talk');
}

function lineFor(game, npc) {
  const D = game.data.dialogue;
  if (npc.id === 'chan' && !game.flags.metChan) {
    const gname = game.data.gems.main[classGem(game.data, game.player)].name;
    return { lines: D.chan_first.map((l) => l.replace('{gem}', gname).replace('{name}', game.player.name || 'นักล่าพลอย')), done: () => { game.flags.metChan = true; game.flags.tutorialDone = true; game.events.emit('metChan', {}); } };
  }
  // เควสที่ทำสำเร็จแล้ว: บทพูดรับรางวัล → แต้มพาสซีฟทันที / เปิดหน้าต่างเลือกพลอย
  const q = readyQuestFor(game, npc.id);
  if (q) return { lines: D[q.talk], done: () => {
    if (q.reward.gems) { game.reward = { quest: q.id, sel: null }; game.mode = 'reward'; return; }
    claimQuest(game, q);
    game.notice = { text: `เควส "${q.title}" สำเร็จ! ได้แต้มพาสซีฟ ${q.reward.passive} แต้ม`, t: 6 };
    game.audio.play('level');
  } };
  // บทพูดตามเหตุการณ์ (data/dialogue.json "events"): พูดครั้งเดียวเมื่อมีธงที่กำหนด
  const ev = (D.events || []).find((e) => e.npc === npc.id && game.flags[e.flag] && !game.flags[e.once]);
  if (ev) return { lines: D[ev.lines], done: () => { game.flags[ev.once] = true; } };
  const list = D[npc.id] || ['...'];
  npc.talkIdx = ((npc.talkIdx ?? -1) + 1) % list.length;
  return { lines: [list[npc.talkIdx]], done: null };
}

export function talkTo(game, npc) {
  const p = game.player;
  p.moveTarget = null; p.targetMob = null; game.pendingTalk = null;
  npc.face = p.x < npc.x ? -1 : 1;
  if (npc.shop && !readyQuestFor(game, npc.id)) {                                      // แม่ค้า: ทักทายแล้วเปิดร้าน
    openDialog(game, npc.name, game.data.dialogue[npc.id], () => { game.mode = 'shop'; game.shopSel = null; }, npc.look);
    return;
  }
  const { lines, done } = lineFor(game, npc);
  openDialog(game, npc.name, lines, done, npc.look);
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
  const prev = Math.floor(d.shown);
  d.shown = Math.min(line.length, d.shown + dt * 40);
  for (let i = prev; i < Math.floor(d.shown); i++) { const c = line[i]; if (c !== ' ' && !/[ั-ฺ็-๎]/.test(c) && ++d.blipN % 2 === 0) game.audio.blip(d.pitch); }   // เสียงพูดทีละพยางค์ (ข้ามสระบน/ล่าง วรรณยุกต์)
  if (d.close && game.input.taps.some((t) => !t.consumed && Math.hypot(t.sx - d.close.x, t.sy - d.close.y) < d.close.r * 1.5)) { d.i = d.lines.length - 1; d.shown = d.lines[d.i].length; }   // ✕ = ข้ามไปจบ
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

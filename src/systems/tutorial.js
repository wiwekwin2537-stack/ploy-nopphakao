// บทนำสอนเล่น: ทำงานจาก event ไม่ไปแก้ระบบอื่น ขั้นปัจจุบันเก็บใน flags.tutStep (ติดไปกับเซฟ)
import { makeMob } from './monsters.js';
import { openDialog } from './npc.js';
import { spawnDrop } from './loot.js';
import { ownsGem, autoSocket } from './gems.js';

const KEYS = {
  keyboard: { move: 'WASD / ลูกศร หรือคลิกพื้น', attack: 'J หรือคลิกที่มอน', dash: 'Space', skill: 'K หรือคลิกขวา', interact: 'E' },
  touch: { move: 'จอยด้านซ้าย', attack: 'ปุ่มดาบ', dash: 'ปุ่มหลบ', skill: 'ปุ่มทับทิม', interact: 'ปุ่มคุย หรือแตะที่ตัวคน' },
  pad: { move: 'สติ๊กซ้าย', attack: 'ปุ่ม A', dash: 'ปุ่ม B', skill: 'ปุ่ม X', interact: 'ปุ่ม Y' },
};
const k = (game, a) => (KEYS[game.input.mode] || KEYS.keyboard)[a];

function spawnTut(game, type, dx, dy) {
  const p = game.player, r = game.data.monsters[type].radius;
  let x = Math.min(game.world.zone.W - 60, p.x + dx), y = p.y + dy;
  for (let i = 0; i < 30 && game.world.blocked(x, y, r + 2); i++) { x += 24; y = 10 * 32 + ((i % 5) - 2) * 30; } // หาที่ว่างบนทาง
  const m = makeMob(game, type, 1, x, y, -1);
  m.tutorial = true;
  game.mobs.push(m);
  return m;
}

function ensureStepMobs(game) {
  const st = game.flags.tutStep;
  if (game.world.zone.id !== 'road') return;
  const alive = (t) => game.mobs.some((m) => m.tutorial && m.type === t && !m.dead);
  if (st === 'attack' && !alive('piglet')) { spawnTut(game, 'piglet', 140, -30); spawnTut(game, 'piglet', 170, 34); }
  if (st === 'dash' && !alive('bigboar') && !game.drops.some((d) => d.gem === 'ruby')) spawnTut(game, 'bigboar', 260, 0);
  if (st === 'gem' && !game.flags.gotRuby && !game.drops.some((d) => d.gem === 'ruby')) spawnDrop(game, { kind: 'gem', gem: 'ruby', x: game.player.x + 50, y: game.player.y });
}

export function setTutStep(game, step) {
  game.flags.tutStep = step;
  game.hintT = 0;
  ensureStepMobs(game);
}

export function hintText(game) {
  const st = game.flags.tutStep, z = game.world.zone.id;
  switch (st) {
    case 'move': return 'เดินด้วย ' + k(game, 'move');
    case 'attack': return 'ลูกหมูป่าอสูรบุกมาแล้ว! ฟันด้วย ' + k(game, 'attack');
    case 'dash': return game.tutDodged ? 'หลบได้สวย! ฟันมันตอนมันมึนงง' : 'เห็นเส้นแดงเมื่อไหร่ กดหลบด้วย ' + k(game, 'dash');
    case 'gem': return 'มีบางอย่างส่องแสง... เดินไปเก็บ';
    case 'skill': return 'ยิงลูกไฟทับทิมด้วย ' + k(game, 'skill');
    case 'go': return z === 'road' ? 'ท่อนไม้ขวางทางหายไปแล้ว เดินไปทางตะวันออก สู่เวียงด่านหิน' : '';
    case 'chan': return z === 'town' ? 'ไปพบพ่อเฒ่าจันทร์ที่ศาลาฝั่งตะวันออก (' + k(game, 'interact') + ')' : 'กลับไปเวียงด่านหิน';
    case 'done': return z === 'town' && game.hintT < 9 ? 'ออกประตูทิศเหนือ ไปฝึกฝีมือที่ทุ่งนาร้าง' : '';
    default: return '';
  }
}

export function tutorialTarget(game) {
  const st = game.flags.tutStep, z = game.world.zone;
  if (st === 'go' && z.id === 'road') { const e = z.exits[0]; return { x: e.x, y: e.y + e.h / 2 }; }
  if (st === 'chan' && z.id === 'town') { const n = z.npcs.find((q) => q.id === 'chan'); return n ? { x: n.x, y: n.y - 20 } : null; }
  if (st === 'done' && z.id === 'town' && game.hintT < 9) { const e = z.exits.find((q) => q.to === 'field'); return { x: e.x + e.w / 2, y: e.y + 20 }; }
  if (st === 'gem') { const d = game.drops.find((q) => q.gem === 'ruby'); return d ? { x: d.x, y: d.y - 10 } : null; }
  return null;
}

export function setupTutorial(game) {
  const E = game.events;
  E.on('zoneChanged', ({ zone }) => {
    if (game.flags.tutorialDone) return;
    if (zone === 'road' && !game.flags.tutStep) {
      game.flags.tutStep = 'intro';
      openDialog(game, 'บทนำ', game.data.dialogue.intro, () => setTutStep(game, 'move'));
    } else if (zone === 'town' && (game.flags.tutStep === 'go' || game.flags.tutStep === 'skill')) setTutStep(game, 'chan');
    else ensureStepMobs(game);
  });
  E.on('mobKilled', ({ mob }) => {
    if (!mob.tutorial) return;
    const st = game.flags.tutStep;
    if (st === 'attack' && !game.mobs.some((m) => m.tutorial && m.type === 'piglet' && !m.dead)) {
      setTimeout0(game, () => setTutStep(game, 'dash'));
    }
    if (st === 'dash' && mob.type === 'bigboar') setTutStep(game, 'gem');
  });
  E.on('chargeDodged', () => { if (game.flags.tutStep === 'dash') game.tutDodged = true; });
  E.on('gemPicked', ({ gem }) => {
    if (gem !== 'ruby' || game.flags.tutorialDone) return;
    openDialog(game, 'ทับทิม', ['ทับทิมเปล่งแสงแดงฉาน แล้วซึมเข้าสู่ดาบของเจ้า...', 'ได้รับสกิล "ลูกไฟทับทิม"!'], () => setTutStep(game, 'skill'));
  });
  E.on('skillCast', () => { if (game.flags.tutStep === 'skill') setTutStep(game, 'go'); });
  E.on('metChan', () => setTutStep(game, 'done'));
}

// เลื่อนคำสั่งไปทำหลังเฟรมนี้ (ใช้ตัวนับในลูปเกม ไม่ใช้ setTimeout)
function setTimeout0(game, fn) { game.later.push({ t: 0.6, fn }); }

export function updateTutorial(game, dt) {
  game.hintT = (game.hintT || 0) + dt;
  for (let i = game.later.length - 1; i >= 0; i--) { const l = game.later[i]; l.t -= dt; if (l.t <= 0) { game.later.splice(i, 1); l.fn(); } }
  if (game.mode !== 'play') return;
  if (game.flags.tutStep === 'move' && game.player.movedDist > 90) setTutStep(game, 'attack');
}

export function skipTutorial(game) {
  const p = game.player;
  if (!ownsGem(p, 'ruby')) autoSocket(p, 'ruby', game.data.gems);
  Object.assign(game.flags, { gotRuby: true, metChan: true, tutorialDone: true, tutStep: 'done' });
  game.hintT = 0;
}

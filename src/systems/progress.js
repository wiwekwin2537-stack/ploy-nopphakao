// ประสบการณ์และเลเวล — รับ XP จาก event 'mobKilled' ที่เดียว
import { playerStats } from './stats.js';

export function xpNeeded(balance, level) { return balance.xpToNext[level] || Infinity; }

export function gainXp(game, amount) {
  const p = game.player, B = game.data.balance;
  if (p.level >= B.maxLevel) return 0;
  p.xp += amount;
  let ups = 0;
  while (p.level < B.maxLevel && p.xp >= xpNeeded(B, p.level)) {
    p.xp -= xpNeeded(B, p.level);
    p.level++; ups++;
  }
  if (p.level >= B.maxLevel) p.xp = 0;
  if (ups) {
    const s = playerStats(p, game.data);
    p.hp = s.maxHp; p.mp = s.maxMp;
    game.fx.text(p.x, p.y - 50, 'เลเวล ' + p.level + '!', '#ffd24a', true);
    game.fx.burst(p.x, p.y - 16, '#ffd24a', 26, 140, 0.9, 3, 60);
    game.audio.play('level');
    game.notice = { text: `ได้แต้มพาสซีฟ ${ups} แต้ม! เปิดต้นพาสซีฟ (ปุ่มดาว / P)`, t: 6 };
    game.events.emit('levelUp', { level: p.level });
  }
  return ups;
}

export function setupProgress(game) {
  game.events.on('mobKilled', ({ mob }) => {
    game.fx.text(mob.x + 12, mob.y - mob.height - 10, '+' + mob.xp + ' XP', '#9fe08a');
    game.audio.play('mobdie');
    gainXp(game, mob.xp);
  });
}

// ของดรอป: เหรียญและพลอย — เก็บได้ครั้งเดียว แล้วหายจากพื้นทันที
let nextDropId = 1;

export const GEM_INFO = { ruby: { name: 'ทับทิม', color: '#d8283a', hi: '#ff8a9a' } };

export function setupLoot(game) {
  game.events.on('mobKilled', ({ mob }) => {
    const def = mob.def, rng = game.rng;
    if (rng.chance(def.coinChance)) {
      const amount = rng.int(def.coins[0], def.coins[1]) * mob.level;
      spawnDrop(game, { kind: 'coin', amount, x: mob.x, y: mob.y });
    }
    if (def.drop && !game.player.gems.includes(def.drop) && !game.drops.some((d) => d.gem === def.drop)) {
      spawnDrop(game, { kind: 'gem', gem: def.drop, x: mob.x, y: mob.y });
    }
  });
}

export function spawnDrop(game, d) {
  const a = Math.random() * Math.PI * 2;
  game.drops.push({ id: nextDropId++, t: 0, z: 0, vz: 120, vx: Math.cos(a) * 40, vy: Math.sin(a) * 20, ...d });
}

export function updateLoot(game, dt) {
  const p = game.player;
  for (let i = game.drops.length - 1; i >= 0; i--) {
    const d = game.drops[i];
    d.t += dt;
    if (d.z > 0 || d.vz > 0) { d.z += d.vz * dt; d.vz -= 420 * dt; if (d.z <= 0) { d.z = 0; d.vz = 0; } d.x += d.vx * dt; d.y += d.vy * dt; }
    if (p.dead || d.t < 0.35) continue;
    const dist = Math.hypot(p.x - d.x, p.y - d.y);
    const magnet = d.kind === 'coin' ? 80 : 40;
    if (dist < magnet) { const k = Math.min(1, dt * 9); d.x += (p.x - d.x) * k; d.y += (p.y - d.y) * k; }
    if (dist < 16) {
      game.drops.splice(i, 1);
      if (d.kind === 'coin') {
        p.coins += d.amount;
        game.fx.text(p.x, p.y - 38, '+' + d.amount + ' เบี้ย', '#ffd24a');
        game.audio.play('coin');
        game.events.emit('coinsPicked', { amount: d.amount });
      } else if (d.kind === 'gem') {
        if (!p.gems.includes(d.gem)) p.gems.push(d.gem);
        if (d.gem === 'ruby') game.flags.gotRuby = true;
        game.world.refreshFlags();
        game.fx.burst(p.x, p.y - 16, GEM_INFO[d.gem].hi, 24, 130, 0.8, 3);
        game.audio.play('gem');
        game.events.emit('gemPicked', { gem: d.gem });
      }
    }
  }
}

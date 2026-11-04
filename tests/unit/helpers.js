// เกมจำลองสำหรับเทสต์ (ระบบจริงทั้งหมด ยกเว้นภาพ/เสียง)
import balance from '../../data/balance.json' with { type: 'json' };
import monsters from '../../data/monsters.json' with { type: 'json' };
import zones from '../../data/zones.json' with { type: 'json' };
import dialogue from '../../data/dialogue.json' with { type: 'json' };
import gems from '../../data/gems.json' with { type: 'json' };
import passives from '../../data/passives.json' with { type: 'json' };
import { createEvents } from '../../src/core/events.js';
import { createRng } from '../../src/core/rng.js';
import { createWorld } from '../../src/systems/world.js';
import { createPlayer } from '../../src/systems/player.js';
import { setupLoot } from '../../src/systems/loot.js';
import { setupProgress } from '../../src/systems/progress.js';
import { setupTutorial } from '../../src/systems/tutorial.js';
import { setupDeath } from '../../src/systems/travel.js';

export function makeGame() {
  const noop = () => {};
  const game = {
    data: { balance, monsters, zones, dialogue, gems, passives },
    events: createEvents(), rng: createRng(42),
    fx: { text: noop, burst: noop, trail: noop, ring: noop, slash: noop, clear: noop, update: noop },
    audio: { play: noop, music: noop, update: noop, muted: true },
    camera: { shake: 0, snap: noop, toWorld: (x, y) => ({ x, y }) },
    input: { move: { x: 0, y: 0 }, held: {}, pressed: {}, taps: [], mode: 'keyboard' },
    flags: {}, mobs: [], shots: [], drops: [], later: [], spawnTimers: [], mode: 'play', time: 0,
  };
  game.world = createWorld(zones, (f) => !!game.flags[f]);
  game.player = createPlayer(game.data);
  setupLoot(game); setupProgress(game); setupTutorial(game); setupDeath(game);
  return game;
}

export function count(game, name) {
  let n = 0; game.events.on(name, () => n++); return () => n;
}

// ศาลวาร์ป (แบบ waypoint ของ PoE): เดินไปถึงศาลครั้งแรก = ปลดล็อก · ยืนที่ศาลแล้วกดคุย = เลือกวาร์ปไปศาลที่ปลดล็อกแล้ว
// วาร์ปได้เฉพาะศาลจริงที่เคยเดินไปถึง (ไม่มีเมนูวาร์ปลัด) — ธง wp_<พื้นที่> อยู่ในเซฟ
import { enterZone } from './travel.js';

const NEAR = 44;

export function waypointOf(zone) { return zone.objects.find((o) => o.type === 'waypoint') || null; }

// ศาลวาร์ปทั้งหมดในเกม เรียงตามลำดับพื้นที่ใน data/zones.json
export function allWaypoints(game) {
  return Object.entries(game.data.zones).filter(([, z]) => (z.objects || []).some((o) => o.type === 'waypoint')).map(([id, z]) => ({ id, name: z.name, open: !!game.flags['wp_' + id] }));
}

export function updateWaypoints(game) {
  const z = game.world.zone, p = game.player, wp = waypointOf(z);
  game.nearWaypoint = null;
  if (!wp || game.mode !== 'play') return;
  const cx = wp.x + wp.w / 2, cy = wp.y + wp.h;
  if (Math.hypot(p.x - cx, p.y - cy) > NEAR) return;
  game.nearWaypoint = wp;
  if (!game.flags['wp_' + z.id]) {
    game.flags['wp_' + z.id] = true;
    game.notice = { text: `ปลดล็อกศาลวาร์ป: ${z.name} — ยืนที่ศาลแล้วกดคุยเพื่อวาร์ป`, t: 5 };
    game.audio.play('level');
    game.events.emit('waypointUnlocked', { zone: z.id });
  }
  if (!game.nearNpc && game.input.pressed.interact) openWarp(game);
}

export function openWarp(game) { game.mode = 'warp'; game.audio.play('click'); }

// วาร์ปไปศาลของพื้นที่ id (ต้องปลดล็อกแล้ว และต้องยืนที่ศาลอยู่) — คืน true ถ้าวาร์ปจริง
export function warpTo(game, id) {
  if (!game.flags['wp_' + id] || !game.nearWaypoint) return false;
  const def = game.data.zones[id], wp = def.objects.find((o) => o.type === 'waypoint');
  game.mode = 'play';
  enterZone(game, id, (wp.x + wp.w / 2) * 32, (wp.y + wp.h + 1.2) * 32);
  game.audio.play('gem');
  game.fx.burst(game.player.x, game.player.y - 20, '#8ad8ff', 26, 140, 0.8, 3);
  return true;
}

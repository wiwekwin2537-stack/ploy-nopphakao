// เซฟ/โหลด — มีที่เขียนเซฟที่เดียวคือไฟล์นี้ มีเลขเวอร์ชันเซฟ
export const SAVE_VERSION = 1;
const KEY = 'ploy.save';

// ตัวแปลงเซฟรุ่นเก่า → รุ่นใหม่ (เพิ่มที่นี่เมื่อเปลี่ยนรูปแบบเซฟ)
const MIGRATIONS = {};

export function serialize(game) {
  const p = game.player;
  return {
    v: SAVE_VERSION, savedAt: Date.now(),
    zone: game.world.zone.id, x: Math.round(p.x), y: Math.round(p.y),
    level: p.level, xp: p.xp, coins: p.coins, hp: Math.round(p.hp), mp: Math.round(p.mp),
    gems: p.gems.slice(), flags: { ...game.flags },
  };
}

export function validate(s, zones) {
  if (!s || typeof s !== 'object') return null;
  let d = s;
  while (d.v !== SAVE_VERSION) { const m = MIGRATIONS[d.v]; if (!m) return null; d = m(d); }
  const num = (v, lo, hi) => typeof v === 'number' && isFinite(v) && v >= lo && v <= hi;
  if (!zones[d.zone] || !num(d.level, 1, 999) || !num(d.xp, 0, 1e9) || !num(d.coins, 0, 1e12)) return null;
  if (!num(d.x, 0, 1e6) || !num(d.y, 0, 1e6) || !Array.isArray(d.gems) || typeof d.flags !== 'object') return null;
  return d;
}

export function writeSave(game) {
  const s = serialize(game);
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { return null; }
  game.lastSave = s;
  return s;
}

export function readSave(zones) {
  try { const raw = localStorage.getItem(KEY); return raw ? validate(JSON.parse(raw), zones) : null; } catch { return null; }
}

export function clearSave() { try { localStorage.removeItem(KEY); } catch { /* ข้าม */ } }

export function setupAutosave(game) {
  const save = () => { if (game.mode !== 'title') writeSave(game); };
  ['zoneChanged', 'levelUp', 'gemPicked', 'metChan'].forEach((e) => game.events.on(e, save));
  game.autosaveT = 0;
}

export function updateAutosave(game, dt) {
  if (game.mode === 'title') return;
  game.autosaveT += dt;
  if (game.autosaveT >= game.data.balance.autosaveSeconds) { game.autosaveT = 0; writeSave(game); }
}

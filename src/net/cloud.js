// เซฟออนไลน์: ทุกครั้งที่เกมเซฟ (save.js writeSave) ส่งเซฟล่าสุดขึ้นเซิร์ฟเวอร์ — ห่างกันอย่างน้อย 8 วิ (เก็บอันล่าสุดไว้ส่งรอบหน้า)
// ออกจากเกม/สลับแอป = ส่งทันที (keepalive) · ผลล่าสุดดูได้ที่ game.cloud.status · จังหวะส่งเดินตามลูปเกม (updateCloud)
import { api, serverUrl, session } from './online.js';

const GAP_MS = 8000;

export function startCloud(game, charId) {
  const c = game.cloud = { charId, pending: null, busy: false, lastAt: 0, status: '', fails: 0 };
  game.saveKey = 'ploy.online.' + charId;
  game.onSaved = (s) => { c.pending = s; };
}

export function updateCloud(game) { if (game.cloud) pump(game); }

export function stopCloud(game) { flushCloud(game); game.cloud = null; game.onSaved = null; game.saveKey = null; }

async function pump(game) {
  const c = game.cloud;
  if (!c || c.busy || !c.pending) return;
  if (Date.now() - c.lastAt < GAP_MS) return;
  const s = c.pending; c.pending = null; c.busy = true; c.lastAt = Date.now();
  const r = await api('/api/char/save', { id: c.charId, save: s }, { timeout: 20000 });
  c.busy = false;
  if (r.ok) { c.status = 'เซฟออนไลน์แล้ว'; c.fails = 0; }
  else { c.status = 'เซฟออนไลน์ไม่สำเร็จ: ' + (r.msg || r.err); c.fails++; if (!c.pending) c.pending = s; }
}

// ส่งทันทีแบบไม่รอคำตอบ (ตอนปิดหน้า/สลับแอป) — เบราว์เซอร์ยังส่งต่อให้แม้หน้าจะปิด
export function flushCloud(game) {
  const c = game.cloud, s = c && (c.pending || game.lastSave);
  if (!c || !s || !session.token) return;
  c.pending = null;
  try { fetch(serverUrl() + '/api/char/save', { method: 'POST', keepalive: true, headers: { 'content-type': 'application/json', authorization: 'Bearer ' + session.token }, body: JSON.stringify({ id: c.charId, save: s }) }); } catch { /* ส่งไม่ได้ก็ยังมีเซฟสำรองในเครื่อง */ }
}

// ข้อมูลเกมสะอาด: ทุกอย่างที่มีในข้อมูลต้องเจอได้จริงในเกม (ไม่มีของค้าง/ของที่หาไม่ได้แบบเอโดเรีย)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { makeGame } from './helpers.js';

const srcText = (() => { const out = []; const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : p.endsWith('.js') && out.push(readFileSync(p, 'utf8')); } }; walk('src'); return out.join('\n'); })();

test('มอนทุกชนิดเกิดได้จริง (อยู่ในพื้นที่ · ถูกบอสเรียก · หรือในถ้ำลายแทง)', () => {
  const g = makeGame(), D = g.data, used = new Set([...D.balance.maps.monsters, ...D.balance.maps.bosses]);
  for (const z of Object.values(D.zones)) for (const s of z.spawns || []) used.add(s.type);
  for (const m of Object.values(D.monsters)) if (m.summon) used.add(m.summon);
  for (const k of Object.keys(D.monsters)) assert.ok(used.has(k) || srcText.includes(`'${k}'`), `มอน ${k} ไม่เกิดที่ไหนเลย`);
});

test('พลอยทุกเม็ดหาได้ (ดรอป · รางวัลเควส · พลอยแรกของอาชีพ)', () => {
  const g = makeGame(), D = g.data, get = new Set(D.gems.drops.map((d) => d.gem));
  for (const q of D.quests.list) for (const id of q.reward.gems || []) get.add(id);
  for (const c of Object.values(D.passives.classes)) get.add(c.gem);
  for (const id of [...Object.keys(D.gems.main), ...Object.keys(D.gems.support)]) assert.ok(get.has(id), `พลอย ${id} หาไม่ได้`);
});

test('ของทุกชิ้นหาได้: ฐานของดรอปได้ภายในเลเวลสูงสุด · ยูนีคมีบอสที่ดรอปจริงหรือดรอปทั่วไป · ศิลาทุกชนิดมีทางได้', () => {
  const g = makeGame(), I = g.data.items, M = g.data.monsters, B = g.data.balance, S = g.data.shop;
  for (const [k, b] of Object.entries(I.bases)) assert.ok(I.slots[b.slot] && b.req <= B.maxLevel, `ฐาน ${k}`);
  for (const [k, U] of Object.entries(I.uniques)) {
    if (k === '_doc') continue;
    assert.ok(I.bases[U.base], k);
    assert.ok((U.from && U.from.every((t) => M[t] && M[t].boss)) || (U.world && U.minLevel <= B.maxLevel), `ยูนีค ${k} ไม่มีทางได้`);
  }
  const shop = new Set(S.stock.filter((x) => x.currency).map((x) => x.currency));
  for (const [k, c] of Object.entries(I.currency)) {
    const map = /^map(\d)$/.exec(k);                                  // ลายแทงขั้นสูง: ได้จากบอสในถ้ำขั้นก่อนหน้า
    assert.ok((c.dropChance > 0 && c.minLevel <= B.maxLevel) || shop.has(k) || (map && Number(map[1]) > 1), `ศิลา ${k} หาไม่ได้`);
  }
});

test('บทพูดทุกชุดถูกใช้ (NPC · เหตุการณ์ · รางวัลเควส · ระบบ) และทุก NPC มีบทพูด', () => {
  const g = makeGame(), D = g.data.dialogue, used = new Set();
  for (const e of D.events) used.add(e.lines);
  for (const q of g.data.quests.list) used.add(q.talk);
  const npcs = Object.values(g.data.zones).flatMap((z) => z.npcs || []).map((n) => n.id);
  for (const k of Object.keys(D)) if (k !== 'events') assert.ok(used.has(k) || npcs.includes(k) || srcText.includes(k), `บทพูด ${k} ไม่ได้ใช้`);
  for (const n of npcs) assert.ok(Array.isArray(D[n]) && D[n].length, `NPC ${n} ไม่มีบทพูด`);
});

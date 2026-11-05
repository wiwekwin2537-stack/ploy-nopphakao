// กันความยากเพี้ยน (ใช้ตัวจำลอง tools/balance.js ที่รันระบบจริง): ทุกอาชีพ ทุกพื้นที่ในเนื้อเรื่อง ต้องอยู่ในช่วงเป้าแบบ PoE
// ตีมอนธรรมดาตาย ≤ 5 ที · โดนมอนตี ≥ 8 ทีถึงตาย · ล้มบอส 5–75 วิ · โดนบอสตีแรงสุด ≥ 3.5 ทีถึงตาย · มอนเลเวลไม่นำผู้เล่นเกิน 2
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGame } from './helpers.js';
import { simulate } from '../../tools/balance.js';

for (const cls of Object.keys(makeGame().data.passives.classes)) test(`ความยากตลอดบท 1–6 อยู่ในเป้า (อาชีพ ${cls})`, () => {
  const { rows, endLevel } = simulate(cls);
  for (const r of rows) {
    const at = `${r.zone} (Lv ผู้เล่น ${r.plv})`;
    if (r.mlv) {
      assert.ok(r.hitsToKill <= 5, `${at}: มอนอึดเกิน ตี ${r.hitsToKill} ที`);
      assert.ok(r.hitsToDie >= 8, `${at}: มอนตีแรงเกิน ตาย ${r.hitsToDie} ที`);
      assert.ok(r.mlv - r.plv <= 2, `${at}: มอนเลเวล ${r.mlv} นำผู้เล่นเกิน 2`);
    }
    if (r.bossSec !== null) {
      assert.ok(r.bossSec >= 5 && r.bossSec <= 75, `${at}: ล้มบอส ${r.bossSec} วิ`);
      assert.ok(r.bossHitsToDie >= 3.5, `${at}: บอสตีแรงเกิน ตาย ${r.bossHitsToDie} ที`);
    }
  }
  assert.ok(endLevel >= 30 && endLevel <= 36, `จบบท 6 ที่เลเวล ${endLevel} (ถ้ำลายแทงเริ่มเลเวล 32)`);
});

// จำลองความยากตลอดเนื้อเรื่อง (บท 1–6) ด้วยระบบจริงของเกม — node tools/balance.js
// สมมติ: ผู้เล่นเคลียร์มอนทุกตัวในแต่ละพื้นที่ครั้งเดียวตามลำดับบท · ใส่ของพื้นฐานที่ดีที่สุดที่ใส่ได้ทุกช่อง เป็นสีเขียว 1 ค่ากลางๆ (อาวุธ ดาเมจ% · ช่องอื่น เลือด)
// · แต้มพาสซีฟคิดแบบหยาบ (ทุกแต้ม = ดาเมจ +3% และเลือด +2%) · สกิลแรง ×1.4 ของตีธรรมดา · ดาเมจ = ค่าที่สูงกว่าระหว่างดาบกับพลอย (หมอผีเล่นสายพลอย)
// ผลใช้ทั้งพิมพ์ตาราง (เครื่องมือนี้) และเป็นเทสต์กันความยากเพี้ยน (tests/unit/balance.test.js)
import { makeGame } from '../tests/unit/helpers.js';
import { giveStarterGear } from '../src/systems/player.js';
import { playerStats } from '../src/systems/stats.js';
import { makeMob } from '../src/systems/monsters.js';

const SKILL = 1.4, PASSIVE_DMG = 0.03, PASSIVE_HP = 0.02;

// ของสีเขียวทั่วไป 1 ค่า (ค่ากลางของขั้นสูงสุดที่เลเวลนี้สุ่มได้): อาวุธ = ดาเมจ% · ที่เหลือ = เลือด
function greenMod(I, slot, lv) {
  const id = slot === 'weapon' ? 'sharp' : 'sturdy', a = I.affixes[id];
  if (!a.slots.includes(slot)) return [];
  let ti = -1; a.tiers.forEach((t, i) => { if (lv >= t[0]) ti = i; });
  return ti < 0 ? [] : [{ id, tier: ti, value: Math.round((a.tiers[ti][1] + a.tiers[ti][2]) / 2) }];
}

function gearUp(g, p) {                                           // ของพื้นฐานที่ดีที่สุดที่เลเวลนี้ใส่ได้ (ตามเลเวลต้องการ)
  const I = g.data.items, cur = p.equip.weapon, kind = (I.bases[cur.base].look || {}).kind;
  for (const slot of Object.keys(I.slots)) {
    const best = Object.entries(I.bases).filter(([, b]) => b.slot === slot && b.req <= p.level && (slot !== 'weapon' || (b.look || {}).kind === kind)).sort((a, b) => b[1].req - a[1].req)[0];
    if (best) p.equip[slot] = { ...(p.equip[slot] || {}), uid: 900 + Object.keys(I.slots).indexOf(slot), base: best[0], rarity: 'green', ilvl: p.level, mods: greenMod(I, slot, p.level), gems: (p.equip[slot] || {}).gems || [], sockets: (p.equip[slot] || {}).sockets || 0, links: (p.equip[slot] || {}).links || [], colors: (p.equip[slot] || {}).colors || [] };
  }
}

export function simulate(cls = 'warrior') {
  const g = makeGame(), p = g.player, Q = g.data.quests, M = g.data.monsters, B = g.data.balance;
  giveStarterGear(p, g.data, cls);
  const rows = [];
  let xp = 0;
  const gain = (n) => { xp += n; while (p.level < B.maxLevel && xp >= B.xpToNext[p.level]) { xp -= B.xpToNext[p.level]; p.level++; } };
  for (const a of Q.acts.filter((x) => !x.endgame)) {
    for (const zid of a.zones) {
      const z = g.data.zones[zid];
      if (z.safe || !z.spawns.length) continue;
      gearUp(g, p);
      const st = playerStats(p, g.data), pts = p.level - 1;
      const hit = Math.max(st.damage, st.spellDamage) * (1 + PASSIVE_DMG * pts)   // สายพลอยตีด้วยสกิลพลอยเป็นหลัก
        * (1 + st.crit * (st.critMult - 1)) * SKILL, dps = hit / st.attackCooldown, hp = st.maxHp * (1 + PASSIVE_HP * pts);
      const mobs = [], lvIn = p.level;
      for (const s of z.spawns) {
        const lv = Math.round((s.level[0] + s.level[1]) / 2), m = makeMob(g, s.type, lv, 0, 0);
        mobs.push({ m, n: s.count, boss: !!M[s.type].boss });
      }
      const norm = mobs.filter((x) => !x.boss), boss = mobs.find((x) => x.boss);
      const avg = (f) => norm.reduce((t, x) => t + f(x.m) * x.n, 0) / Math.max(1, norm.reduce((t, x) => t + x.n, 0));
      rows.push({
        act: a.n, zone: zid, plv: lvIn, mlv: Math.round(avg((m) => m.level)),
        hitsToKill: +avg((m) => m.maxHp / hit).toFixed(1), hitsToDie: +(hp / avg((m) => m.damage)).toFixed(1),
        bossSec: boss ? Math.round(boss.m.maxHp / dps) : null, bossHitsToDie: boss ? +(hp / (boss.m.damage * 1.5)).toFixed(1) : null,
      });
      for (const x of mobs) gain(x.m.xp * x.n);
    }
  }
  return { rows, endLevel: p.level };
}

if (process.argv[1] && process.argv[1].endsWith('balance.js')) {
  for (const cls of process.argv[2] ? [process.argv[2]] : ['warrior']) {
    const { rows, endLevel } = simulate(cls);
    console.log(`\nอาชีพ ${cls} — จบบท 6 ที่เลเวล ${endLevel}`);
    console.log('บท พื้นที่            Lvผู้เล่น Lvมอน  ตีมอนตาย(ที) โดนมอนตีตาย(ที)  ล้มบอส(วิ) โดนบอสตีตาย(ที)');
    for (const r of rows) console.log(`${r.act}  ${r.zone.padEnd(16)} ${String(r.plv).padStart(6)} ${String(r.mlv).padStart(6)} ${String(r.hitsToKill).padStart(10)} ${String(r.hitsToDie).padStart(14)} ${String(r.bossSec ?? '-').padStart(10)} ${String(r.bossHitsToDie ?? '-').padStart(12)}`);
  }
}

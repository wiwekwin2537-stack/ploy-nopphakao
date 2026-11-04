// ตัวคำนวณค่าสถานะกลาง (ที่เดียวในเกม): เลเวล + ต้นพาสซีฟ → ค่าที่ทุกระบบใช้
// กติกา: ค่า "เพิ่ม %" (increased) บวกรวมกันก่อน แล้วค่อยคูณ (more) ทีละตัวจากคีย์สโตน
const cache = new WeakMap();

export function sumPassives(p, passives) {
  const t = {}, ks = new Set();
  for (const id of p.passives || []) {
    const n = passives.nodes[id];
    if (!n) continue;
    for (const [k, v] of Object.entries(n.stats)) {
      if (k === 'ks') ks.add(v); else t[k] = (t[k] || 0) + v;
    }
  }
  return { t, ks };
}

export function playerStats(p, data) {
  const key = (p.passives || []).join(',') + '|' + p.level;
  const hit = cache.get(p);
  if (hit && hit.key === key) return hit.st;
  const B = data.balance.player, lv = p.level - 1;
  const { t, ks } = data.passives ? sumPassives(p, data.passives) : { t: {}, ks: new Set() };
  const g = (k) => (t[k] || 0) / 100;
  const st = {
    maxHp: Math.round((B.hp + B.hpPerLevel * lv + (t.hpFlat || 0)) * (1 + g('hpInc')) * (ks.has('shadow') ? 0.8 : 1)),
    maxMp: Math.round((B.mp + B.mpPerLevel * lv + (t.mpFlat || 0)) * (1 + g('mpInc'))),
    damage: (B.damage + B.damagePerLevel * lv) * (1 + g('dmgMelee') + g('dmgAll')) * (ks.has('elephant') ? 1.5 : 1),
    spellDamage: (B.damage + B.damagePerLevel * lv) * (1 + g('dmgSpell') + g('dmgAll')) * (ks.has('elephant') ? 0.7 : 1),
    speed: B.speed * (1 + g('moveInc')),
    attackCooldown: B.attackCooldown / (1 + g('atkSpeedInc')),
    castCdMult: 1 / (1 + g('castSpeedInc')),
    crit: (0.06 + g('crit')) * (ks.has('shadow') ? 2 : 1),
    critMult: 1.6 + g('critMult'),
    lifeOnHit: t.lifeOnHit || 0,
    mpRegen: B.mpRegen * (1 + g('mpRegenInc')),
    dashCooldown: B.dashCooldown * Math.max(0.3, 1 + g('dashCdInc')),
    areaMult: 1 + g('areaInc'),
    projSpeedMult: 1 + g('projSpeedInc'),
    bloodMagic: ks.has('blood'),
  };
  cache.set(p, { key, st });
  return st;
}

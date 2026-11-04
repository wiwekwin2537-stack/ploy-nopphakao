// ระบบพลอย: กระเป๋าพลอย ช่องฝัง 2 ชุด (พลอยหลัก 1 + พลอยเสริม 2) และคำนวณสกิลจากพลอยที่ฝัง
// ทุกตัวเลขอยู่ใน data/gems.json — เพิ่มพลอยใหม่ที่ไฟล์นั้น ไม่ต้องแก้โค้ด

export function emptySockets(G) {
  return Array.from({ length: G.groups }, () => Array(1 + G.supportsPerGroup).fill(null));
}

export function gemType(G, id) { return G.main[id] ? 'main' : G.support[id] ? 'support' : null; }
export function gemInfo(G, id) { return G.main[id] || G.support[id] || null; }
export function ownsGem(p, id) { return p.bag.includes(id) || p.sockets.some((g) => g.includes(id)); }

// ใส่พลอยจากกระเป๋าลงชุดที่เลือก: พลอยหลักลงช่องแรก พลอยเสริมลงช่องเสริมที่ว่าง (เต็มแล้ว = สลับกับช่องสุดท้าย)
export function socketGem(G, p, bagIndex, group) {
  const id = p.bag[bagIndex];
  if (!id || !p.sockets[group]) return false;
  const row = p.sockets[group], type = gemType(G, id);
  if (!type) return false;
  let slot;
  if (type === 'main') slot = 0;
  else { slot = row.indexOf(null, 1); if (slot < 1) slot = row.length - 1; }
  p.bag.splice(bagIndex, 1);
  if (row[slot]) p.bag.push(row[slot]);
  row[slot] = id;
  return true;
}

export function unsocketGem(p, group, slot) {
  const row = p.sockets[group];
  if (!row || !row[slot]) return false;
  p.bag.push(row[slot]);
  row[slot] = null;
  return true;
}

// รวมค่าสกิลของชุดที่ group: คืน null ถ้าไม่มีพลอยหลัก
export function computeSkill(G, sockets, group) {
  const row = sockets[group];
  if (!row || !row[0]) return null;
  const m = G.main[row[0]];
  if (!m) return null;
  const sk = {
    gem: row[0], name: m.skill, kind: m.kind, color: m.color, hi: m.hi,
    mp: m.mp, cooldown: m.cooldown, damageMult: m.damageMult, speed: m.speed, life: m.life, radius: m.radius,
    splash: m.splash || 0, count: 1, pierce: 0, slow: m.slow || 0, slowTime: m.slowTime || 0,
    poison: m.poison || 0, poisonTime: m.poisonTime || 0, supports: [],
  };
  for (const sid of row.slice(1)) {
    const s = sid && G.support[sid];
    if (!s) continue;
    sk.supports.push(sid);
    sk.damageMult *= s.damage ?? 1;
    if (s.extra) sk.count += s.extra;
    if (s.pierce) sk.pierce += s.pierce;
    if (s.splashAdd) sk.splash = (sk.splash || 0) * (s.splashMult || 1) + s.splashAdd;
    if (s.cooldownMult) sk.cooldown *= s.cooldownMult;
    if (s.mpMult) sk.mp = Math.ceil(sk.mp * s.mpMult);
  }
  sk.mp = Math.ceil(sk.mp + (sk.count - 1) * 2);       // ยิงหลายลูกใช้มานาเพิ่มลูกละ 2
  return sk;
}

// สุ่มพลอยตกจากมอน (คืน id หรือ null) — เรียกจากระบบของดรอปที่เดียว
export function rollGemDrop(G, rng, mobLevel) {
  for (const d of G.drops) {
    if (mobLevel >= d.minLevel && rng.chance(d.chance)) return d.gem;
  }
  return null;
}

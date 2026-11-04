// ต้นพาสซีฟ: เลือกจุดเริ่ม (สาย) ฟรี แล้วใช้แต้ม (1 แต้มต่อเลเวล) ลงโหนดที่ติดกับโหนดที่มีแล้ว
// คืนแต้มได้เฉพาะโหนดที่ถอดแล้วต้นยังต่อถึงจุดเริ่มครบ

export function startOf(p, P) { return (p.passives || []).find((id) => P.nodes[id] && P.nodes[id].kind === 'start') || null; }
export function pointsTotal(p, P) { return (p.level - 1) * P.pointsPerLevel + (p.questPoints || 0); }   // + แต้มจากเควสรอง
export function pointsSpent(p, P) { return (p.passives || []).filter((id) => P.nodes[id] && P.nodes[id].kind !== 'start').length; }
export function pointsLeft(p, P) { return pointsTotal(p, P) - pointsSpent(p, P); }

export function canAllocate(p, P, id) {
  const n = P.nodes[id];
  if (!n || p.passives.includes(id)) return false;
  if (n.kind === 'start') return !startOf(p, P) && (!p.cls || n.class === p.cls);   // จุดเริ่ม = อาชีพที่เลือกตอนสร้างตัวละครเท่านั้น
  if (!startOf(p, P) || pointsLeft(p, P) <= 0) return false;
  return n.links.some((l) => p.passives.includes(l));
}

export function allocate(p, P, id) {
  if (!canAllocate(p, P, id)) return false;
  p.passives.push(id);
  return true;
}

// ทุกโหนดที่มียังต่อถึงจุดเริ่มได้ไหม (ถ้าตัด without ออก)
export function connected(P, list, without) {
  const set = new Set(list.filter((id) => id !== without));
  const start = [...set].find((id) => P.nodes[id] && P.nodes[id].kind === 'start');
  if (!start) return set.size === 0;
  const seen = new Set([start]), q = [start];
  while (q.length) for (const l of P.nodes[q.shift()].links) if (set.has(l) && !seen.has(l)) { seen.add(l); q.push(l); }
  return seen.size === set.size;
}

export function canRefund(p, P, id) {
  if (!p.passives.includes(id)) return false;
  if (P.nodes[id].kind === 'start') return false;               // อาชีพเปลี่ยนไม่ได้ (แบบ PoE)
  return connected(P, p.passives, id);
}

// คืนแต้ม (แบบ PoE): ต้องใช้ใบลานล้างกรรม 1 ใบต่อโหนด — ลงแล้วถอนฟรีไม่ได้
export function refund(p, P, id) {
  if (!canRefund(p, P, id) || !(p.currency && p.currency.regret > 0)) return false;
  p.passives.splice(p.passives.indexOf(id), 1);
  p.currency.regret--;
  return true;
}

// ตรวจต้นจากเซฟ: โหนดต้องมีจริง ไม่ซ้ำ ต่อกันครบ และไม่เกินแต้ม
export function validTree(P, list, level) {
  if (!Array.isArray(list) || new Set(list).size !== list.length) return false;
  if (!list.every((id) => P.nodes[id])) return false;
  if (list.filter((id) => P.nodes[id].kind === 'start').length > 1) return false;
  if (list.filter((id) => P.nodes[id].kind !== 'start').length > (level - 1) * P.pointsPerLevel) return false;
  return connected(P, list, null);
}

export function describe(P, n) {
  const out = [];
  for (const [k, v] of Object.entries(n.stats)) {
    if (k === 'ks') continue;
    const f = P.statNames[k];
    if (f) out.push(f.replace('{}', String(v)));
  }
  if (n.desc) out.push(n.desc);
  return out;
}

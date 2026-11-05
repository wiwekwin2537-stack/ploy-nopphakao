// อาชีพเลื่อนขั้นแบบ PoE (Ascendancy) — ข้อมูลทั้งหมดใน data/ascendancy.json
// ผ่านบททดสอบ (ล้มบอสตามธงใน trials) = ได้แต้มเลื่อนขั้น · เลือกทางเลื่อนขั้นได้ทางเดียวถาวร (ตามอาชีพ)
// ลงโหนดในทางที่เลือกได้อิสระ · คืนแต้มใช้ใบลานล้างกรรม 1 ใบ (เหมือนต้นพาสซีฟ)

export function ascPointsTotal(A, flags) { return A.trials.reduce((n, t) => n + (flags[t.flag] ? t.points : 0), 0); }
export function ascPointsLeft(A, p, flags) { return ascPointsTotal(A, flags) - (p.ascNodes || []).length; }
export function ascOptions(A, p) { return (A.classes[p.cls] || []).map((id) => ({ id, ...A.list[id] })); }
export function ascNode(A, p, nid) { const a = p.ascend && A.list[p.ascend]; return a ? a.nodes.find((n) => n.id === nid) || null : null; }

// เลือกทางเลื่อนขั้น: ต้องมีแต้มแล้ว (ผ่านบททดสอบแรก) · ต้องเป็นทางของอาชีพตัวเอง · เลือกแล้วเปลี่ยนไม่ได้
export function chooseAscend(A, p, flags, id) {
  if (p.ascend || ascPointsTotal(A, flags) <= 0 || !(A.classes[p.cls] || []).includes(id)) return false;
  p.ascend = id; p.ascNodes = [];
  return true;
}

export function canAllocAsc(A, p, flags, nid) { return !!ascNode(A, p, nid) && !p.ascNodes.includes(nid) && ascPointsLeft(A, p, flags) > 0; }
export function allocAsc(A, p, flags, nid) {
  if (!canAllocAsc(A, p, flags, nid)) return false;
  p.ascNodes.push(nid);
  return true;
}
export function refundAsc(p, nid) {
  if (!(p.ascNodes || []).includes(nid) || !(p.currency && p.currency.regret > 0)) return false;
  p.ascNodes.splice(p.ascNodes.indexOf(nid), 1);
  p.currency.regret--;
  return true;
}

// ค่ารวมของโหนดเลื่อนขั้นที่ลงไว้ (stats.js รวมกับต้นพาสซีฟ)
export function sumAscend(A, p) {
  const t = {};
  for (const nid of p.ascNodes || []) { const n = ascNode(A, p, nid); if (n) for (const [k, v] of Object.entries(n.stats)) t[k] = (t[k] || 0) + v; }
  return t;
}

// ตรวจเซฟ: ทางต้องเป็นของอาชีพ · โหนดอยู่ในทางนั้น ไม่ซ้ำ · ไม่เกินแต้มจากธง
export function validAscend(A, d) {
  if (d.ascend === null) return Array.isArray(d.ascNodes) && d.ascNodes.length === 0;
  if (!(A.classes[d.cls] || []).includes(d.ascend) || !Array.isArray(d.ascNodes) || new Set(d.ascNodes).size !== d.ascNodes.length) return false;
  const ids = A.list[d.ascend].nodes.map((n) => n.id);
  return d.ascNodes.every((n) => ids.includes(n)) && d.ascNodes.length <= ascPointsTotal(A, d.flags || {});
}

// ฆ่ามอนแล้วฟื้นเลือด/มานา (killHeal / killMana) + แจ้งเมื่อผ่านบททดสอบได้แต้มใหม่
export function setupAscend(game, statsOf) {
  game.events.on('mobKilled', ({ mob }) => {
    const p = game.player, st = statsOf();
    if (st.killHeal && !p.dead) p.hp = Math.min(st.maxHp, p.hp + st.maxHp * st.killHeal);
    if (st.killMana) p.mp = Math.min(st.maxMp, p.mp + st.maxMp * st.killMana);
    const A = game.data.ascendancy, tr = A && mob.def.boss && A.trials.find((t) => t.flag === mob.type + 'Slain');
    if (!tr || game.flags['trial_' + tr.flag]) return;
    game.flags['trial_' + tr.flag] = true;
    game.notice = { text: `ผ่าน${tr.name}! ได้แต้มเลื่อนขั้น ${tr.points} แต้ม — เปิดต้นพาสซีฟ แล้วแตะปุ่ม "เลื่อนขั้น"`, t: 8 };
  });
}

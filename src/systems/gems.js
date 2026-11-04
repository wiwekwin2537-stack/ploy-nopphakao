// ระบบพลอยแบบ PoE: พลอยฝังใน "ช่อง" ของอาวุธ/เสื้อ (สูงสุด 6 ช่อง) ช่องที่ "เชื่อม" กันเป็นกลุ่ม
// พลอยสกิลในกลุ่ม = สกิล · พลอยเสริมในกลุ่มเดียวกันเสริมทุกสกิลในกลุ่มนั้น
// ไอเท็ม: { sockets: n, links: [bool × n-1] (ช่อง i เชื่อมกับ i+1), gems: [id|null × n] }
// ทุกตัวเลขอยู่ใน data/gems.json และ data/items.json ("sockets", "currency")

export const SOCKET_SLOTS = ['weapon', 'body'];

export function gemType(G, id) { return G.main[id] ? 'main' : G.support[id] ? 'support' : null; }
export function gemInfo(G, id) { return G.main[id] || G.support[id] || null; }
// สีช่องแบบ PoE: พลอยลงได้เฉพาะช่องสีเดียวกัน · ช่องขาว (w) รับได้ทุกสี
export function socketFits(G, id, color) { const g = gemInfo(G, id); return !!g && (color === 'w' || !color || g.socket === 'w' || g.socket === color); }   // พลอยขาวลงได้ทุกช่อง

function allItems(p) { return [...Object.values(p.equip || {}).filter(Boolean), ...(p.items || [])]; }
export function ownsGem(p, id) { return p.bag.includes(id) || allItems(p).some((it) => (it.gems || []).includes(id)); }

// กลุ่มช่องที่เชื่อมกัน เช่น links [true,false,true] → [[0,1],[2,3]]
export function linkGroups(it) {
  const n = it.sockets || 0, out = [];
  for (let i = 0; i < n; i++) {
    if (i > 0 && it.links[i - 1]) out[out.length - 1].push(i); else out.push([i]);
  }
  return out;
}

// รวมค่าสกิลจากพลอยสกิล 1 เม็ด + พลอยเสริมที่เชื่อมอยู่ — คืน null ถ้าไม่ใช่พลอยสกิล
export function computeSkill(G, mainId, supportIds = []) {
  const m = G.main[mainId];
  if (!m) return null;
  const sk = {
    gem: mainId, name: m.skill, kind: m.kind, color: m.color, hi: m.hi,
    mp: m.mp, cooldown: m.cooldown, damageMult: m.damageMult, speed: m.speed, life: m.life, radius: m.radius,
    splash: m.splash || 0, count: 1, pierce: m.pierce || 0, slow: m.slow || 0, slowTime: m.slowTime || 0,
    poison: m.poison || 0, poisonTime: m.poisonTime || 0, supports: [],
  };
  sk.melee = !!m.melee; sk.shape = m.shape || null; sk.width = m.width || 0; sk.arc = m.arc || 0; sk.unused = [];
  for (const sid of supportIds) {
    const s = sid && G.support[sid];
    if (!s) continue;
    if (m.melee && (s.extra || s.pierce)) { sk.unused.push(sid); continue; }   // ฟันรอบตัว: ยิงหลายลูก/ทะลุ ไม่มีผล
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

// ออร่าที่ฝังอยู่ในของที่สวม (มีผลตลอด) — ใช้ใน stats.js
export function aurasOf(G, p) {
  const out = [];
  for (const slot of SOCKET_SLOTS) {
    const it = p.equip && p.equip[slot];
    for (const id of (it && it.gems) || []) if (id && G.main[id] && G.main[id].aura) out.push({ id, ...G.main[id].aura, name: G.main[id].skill });
  }
  return out;
}

// ผลของพลอยเสริม (สร้างจากตัวเลขใน data/gems.json — ข้อความตรงกับค่าจริงเสมอ)
export function supportLines(G, id) {
  const s = G.support[id], out = [];
  if (!s) return out;
  if (s.extra) out.push(`ยิงเพิ่มอีก ${s.extra} ลูก (เป็นพัด)`);
  if (s.pierce) out.push(`ทะลุมอนเพิ่ม ${s.pierce} ตัว`);
  if (s.splashAdd) out.push(`วงระเบิด/วงฟัน ×${s.splashMult || 1} แล้ว +${s.splashAdd}`);
  if (s.damage && s.damage !== 1) out.push(`ดาเมจ ×${s.damage}`);
  if (s.cooldownMult) out.push(`ร่ายเร็วขึ้น ${Math.round((1 - s.cooldownMult) * 100)}%`);
  if (s.mpMult) out.push(`มานา ×${s.mpMult}`);
  return out;
}

// สกิลทั้งหมดจากของที่สวม เรียงตาม อาวุธ → เสื้อ และลำดับช่อง (ปุ่มสกิล 1/2/3 = 3 สกิลแรก)
const cache = new WeakMap();
export function skillsOf(G, p) {
  const key = SOCKET_SLOTS.map((s) => { const it = p.equip && p.equip[s]; return it ? it.uid + ':' + (it.gems || []).join(',') + ':' + (it.links || []).map(Number).join('') : '-'; }).join('|');
  const hit = cache.get(p);
  if (hit && hit.key === key) return hit.list;
  const list = [];
  for (const slot of SOCKET_SLOTS) {
    const it = p.equip && p.equip[slot];
    if (!it || !it.sockets) continue;
    for (const grp of linkGroups(it)) {
      const ids = grp.map((i) => it.gems[i]).filter(Boolean);
      const sup = ids.filter((id) => G.support[id]);
      grp.forEach((i) => { if (G.main[it.gems[i]] && G.main[it.gems[i]].aura) return; const sk = computeSkill(G, it.gems[i], sup); if (sk) list.push({ ...sk, slot, socket: i, linked: grp.length }); });   // ออร่าไม่ใช่สกิลกด
    }
  }
  cache.set(p, { key, list });
  return list;
}

// ใส่พลอยจากกระเป๋าลงช่อง idx ของของที่สวมช่อง slot (ช่องมีพลอยอยู่แล้ว = สลับกลับกระเป๋า)
// idx ไม่ระบุ = ช่องว่างช่องแรก (พลอยสกิลชอบช่องที่ไม่มีพลอยสกิลในกลุ่ม)
export function socketGem(G, p, bagIndex, slot, idx) {
  const id = p.bag[bagIndex], it = p.equip && p.equip[slot];
  if (!id || !gemType(G, id) || !it || !it.sockets) return false;
  if (idx === undefined) {                                       // ช่องว่างแรกที่สีตรง (ไม่มี = ช่องสีตรงช่องสุดท้าย สลับพลอยเดิม)
    const fit = (i) => socketFits(G, id, it.colors && it.colors[i]);
    idx = it.gems.findIndex((g, i) => !g && fit(i));
    if (idx < 0) { for (let i = it.sockets - 1; i >= 0; i--) if (fit(i)) { idx = i; break; } }
  }
  if (idx < 0 || idx >= it.sockets || !socketFits(G, id, it.colors && it.colors[idx])) return false;
  p.bag.splice(bagIndex, 1);
  if (it.gems[idx]) p.bag.push(it.gems[idx]);
  it.gems[idx] = id;
  return true;
}

export function unsocketGem(p, slot, idx) {
  const it = p.equip && p.equip[slot];
  if (!it || !it.gems || !it.gems[idx]) return false;
  p.bag.push(it.gems[idx]);
  it.gems[idx] = null;
  return true;
}

// เอาพลอยทั้งหมดในไอเท็มกลับกระเป๋า (ก่อนขาย/ทิ้ง — พลอยไม่หายไปกับของ)
export function returnGems(p, it) {
  if (!it || !it.gems) return 0;
  let n = 0;
  it.gems.forEach((g, i) => { if (g) { p.bag.push(g); it.gems[i] = null; n++; } });
  return n;
}

// ฝังพลอยให้อัตโนมัติ (ทับทิมจากบทนำ): ช่องว่างแรกของอาวุธ ไม่มีช่อง = เข้ากระเป๋า
export function autoSocket(p, id, G) {
  const it = p.equip && p.equip.weapon;
  const i = it && it.gems ? it.gems.findIndex((g, k) => !g && (!G || socketFits(G, id, it.colors && it.colors[k]))) : -1;
  if (i >= 0) it.gems[i] = id; else p.bag.push(id);
}

// สุ่มพลอยตกจากมอน (คืน id หรือ null) — เรียกจากระบบของดรอปที่เดียว
export function rollGemDrop(G, rng, mobLevel) {
  for (const d of G.drops) {
    if (mobLevel >= d.minLevel && rng.chance(d.chance)) return d.gem;
  }
  return null;
}

// กล่องรายละเอียดแบบ PoE (แตะของ/พลอย/ของเชื่อม 1 ครั้งแล้วขึ้น): ชื่อสีตามระดับ · ค่าพื้นฐาน · ค่าสุ่มทีละบรรทัด
// · ช่องพลอยบนของ · เทียบกับของที่สวม · ราคาขาย — ใช้ร่วมกันทุกหน้าต่าง (ชุด พลอย ร้านค้า)
import { C, rrect, circle } from '../art/draw.js';
import { uiText as text, wrapLines } from './hud.js';
import { itemName, itemStats, longestLink } from '../systems/items.js';
import { gemInfo, gemType, computeSkill, supportLines, gemLevel, gemXpInfo, auraAt } from '../systems/gems.js';
import { gemSprite } from '../art/gems.js';
import { itemSprite } from '../art/items.js';
import { SOCKET_COL } from './gemtab.js';

const FONT = 'Kanit, sans-serif';
const MOD_COL = '#8ab4ff';      // ค่าสุ่ม (แบบ PoE สีฟ้า)

function statText(P, k, v) { return (P.statNames[k] || k + ' {}').replace('{}', String(v)); }

// วาดกล่องจากรายการบรรทัด [{t, col, size, weight, gap, draw(ctx,x,y,w)}] วางใกล้ (ax,ay) ไม่ล้นจอ
function tipBox(ctx, lines0, ax, ay, s, W, H, border) {
  const w = 236 * s, pad = 10 * s, lines = [];
  for (const l of lines0) {                                      // ตัดบรรทัดยาว (ตัดตามคำภาษาไทย ไม่ตัดกลางคำ)
    if (!l.t) { lines.push(l); continue; }
    ctx.font = `${l.weight || 'normal'} ${(l.size || 10) * s}px ${FONT}`;
    for (const t of wrapLines(ctx, l.t, w - pad * 2)) lines.push({ ...l, t });
  }
  let h = pad * 2;
  for (const l of lines) h += l.h || (l.size || 10) * s * 1.45;
  let x = ax + 14 * s, y = ay - h / 2;
  if (x + w > W - 6) x = ax - w - 14 * s;
  x = Math.max(6, Math.min(W - w - 6, x)); y = Math.max(6, Math.min(H - h - 6, y));
  ctx.fillStyle = 'rgba(10,8,8,0.95)'; rrect(ctx, x, y, w, h, 6 * s); ctx.fill();
  ctx.strokeStyle = border; ctx.lineWidth = 1.5; ctx.stroke();
  let cy = y + pad;
  for (const l of lines) {
    const lh = l.h || (l.size || 10) * s * 1.45;
    if (l.draw) l.draw(ctx, x + pad, cy, w - pad * 2, lh);
    else if (l.sep) { ctx.fillStyle = 'rgba(217,166,48,0.35)'; ctx.fillRect(x + pad, cy + lh / 2, w - pad * 2, 1); }
    else text(ctx, l.t, l.center ? x + w / 2 : x + pad, cy + lh / 2, (l.size || 10) * s, l.col || C.cream, l.center ? 'center' : 'left', l.weight || 'normal');
    cy += lh;
  }
}

// แถวช่องพลอยเล็กในกล่อง: วงกลม + เส้นเชื่อม + พลอยที่ฝัง
function socketRow(ctx, G, it, x, y, s) {
  const r = 7 * s, gap = 20 * s;
  for (let i = 0; i < it.sockets - 1; i++) if (it.links[i]) { ctx.fillStyle = C.goldHi; ctx.fillRect(x + r + i * gap, y - 2 * s, gap, 4 * s); }
  for (let i = 0; i < it.sockets; i++) {
    const cx = x + r + i * gap;
    const sc = SOCKET_COL[(it.colors && it.colors[i]) || 'w'];
    circle(ctx, cx, y, r, sc.fill, sc.rim, 2);
    if (it.gems[i]) ctx.drawImage(gemSprite(G, it.gems[i], r * 4), cx - r * 1.1, y - r * 1.1, r * 2.2, r * 2.2);
  }
}

export function drawItemTip(ctx, game, it, ax, ay, opt = {}) {
  const I = game.data.items, P = game.data.passives, G = game.data.gems, s = opt.s || 1, b = I.bases[it.base], col = I.rarity[it.rarity].color;
  const lines = [];
  lines.push({ h: 40 * s, draw: (c, x, y, w) => { c.drawImage(itemSprite(I, it.base, 80), x + w / 2 - 18 * s, y, 36 * s, 36 * s); } });
  lines.push({ t: itemName(I, it), col, size: 12.5, weight: '600', center: true });
  if (it.rarity !== 'normal') lines.push({ t: b.name, col: 'rgba(244,230,200,0.85)', size: 10, center: true });
  lines.push({ t: `${I.rarity[it.rarity].name} · ${I.slots[b.slot].name}`, col: 'rgba(244,230,200,0.6)', size: 9, center: true });
  lines.push({ sep: true, h: 8 * s });
  for (const [k, v] of Object.entries(b.stats)) lines.push({ t: statText(P, k, v), col: C.cream, size: 10 });
  const U = it.rarity === 'unique' ? I.uniques[it.unique] : null;
  if (U) {                                                        // ยูนีค: ค่าตายตัว + สกิลจากของ + ตำนาน
    lines.push({ sep: true, h: 8 * s });
    for (const [k, v] of Object.entries(U.stats)) lines.push({ t: statText(P, k, v), col: MOD_COL, size: 10 });
    const gname = (id) => G.main[id].skill;
    if (U.grants) lines.push({ t: G.main[U.grants.gem].aura ? `ให้ออร่า: ${gname(U.grants.gem)} เลเวล ${U.grants.level} (ไม่ต้องฝังพลอย)` : `ให้สกิล: ${gname(U.grants.gem)} เลเวล ${U.grants.level} (ขึ้นที่ปุ่มสกิล)`, col: '#ffb060', size: 10, weight: '600' });
    if (U.trigger) lines.push({ t: `${U.trigger.on === 'hit' ? 'ฟันโดนมอน' : 'โดนตี'} มีโอกาส ${Math.round(U.trigger.chance * 100)}% ปล่อย${gname(U.trigger.gem)} เลเวล ${U.trigger.level} เอง (ไม่ใช้มานา)`, col: '#ffb060', size: 10, weight: '600' });
    lines.push({ t: U.lore, col: '#c8783a', size: 9.5 });
  }
  if (it.mods.length) {
    lines.push({ sep: true, h: 8 * s });
    for (const m of it.mods) { const a = I.affixes[m.id]; lines.push({ t: `${statText(P, a.stat, m.value)}  (${a.word})`, col: MOD_COL, size: 10 }); }
  }
  if (it.sockets) {
    lines.push({ sep: true, h: 8 * s });
    lines.push({ t: `ช่องพลอย ${it.sockets} · เชื่อมยาวสุด ${longestLink(it)}`, col: 'rgba(244,230,200,0.8)', size: 9.5 });
    lines.push({ h: 20 * s, draw: (c, x, y) => socketRow(c, G, it, x, y + 10 * s, s) });
  }
  lines.push({ sep: true, h: 8 * s });
  const lowLv = game.player.level < b.req;
  lines.push({ t: `ต้องเลเวล ${b.req} · ระดับของ ${it.ilvl}`, col: lowLv ? '#ff7a6a' : 'rgba(244,230,200,0.65)', size: 9.5 });
  if (opt.compare) {                                              // เทียบกับของที่สวมช่องเดียวกัน
    const a = itemStats(I, it), cur = itemStats(I, opt.compare), keys = [...new Set([...Object.keys(a), ...Object.keys(cur)])];
    const diff = keys.map((k) => [k, (a[k] || 0) - (cur[k] || 0)]).filter(([, v]) => v);
    if (diff.length) {
      lines.push({ t: 'เทียบกับที่สวมอยู่:', col: 'rgba(244,230,200,0.65)', size: 9 });
      for (const [k, v] of diff) lines.push({ t: statText(P, k, (v > 0 ? '+' : '') + v).replace('++', '+').replace('+-', '-'), col: v > 0 ? '#7dff8a' : '#ff7a6a', size: 9.5 });
    }
  }
  if (opt.price !== undefined) lines.push({ t: `${opt.priceLabel || 'ขายได้'} ${opt.price} เบี้ย`, col: C.goldHi, size: 10, weight: '600' });
  if (opt.hint) lines.push({ t: opt.hint, col: '#9af0b0', size: 9.5, weight: '600' });
  tipBox(ctx, lines, ax, ay, s, opt.W, opt.H, col);
}

// ค่าของสกิล (ตัวเลขจากการคำนวณจริง)
export function skillLines(sk) {
  const out = [`ดาเมจ ×${sk.damageMult.toFixed(2)} ของ${sk.melee ? 'ดาเมจดาบ' : 'ดาเมจพลอย'}`, `มานา ${sk.mp} · ร่ายซ้ำทุก ${sk.cooldown.toFixed(2)} วิ`];
  if (sk.melee) out.push(sk.shape === 'line' ? `ฟันเป็นแนวตรงยาว ${Math.round(sk.splash)}` : sk.shape === 'cone' ? `ฟันเป็นพัดด้านหน้า ระยะ ${Math.round(sk.splash)}` : `ฟันรอบตัววงกว้าง ${Math.round(sk.splash)}`);
  if (sk.count > 1) out.push(`ยิงครั้งละ ${sk.count} ลูก`);
  if (sk.pierce) out.push(`ทะลุมอน ${sk.pierce} ตัว`);
  if (sk.splash && !sk.melee) out.push(`ระเบิดวง ${Math.round(sk.splash)}`);
  if (sk.slow) out.push(`ทำให้ช้าลง ${Math.round(sk.slow * 100)}% นาน ${sk.slowTime} วิ`);
  if (sk.poison) out.push(`ติดพิษนาน ${sk.poisonTime} วิ`);
  return out;
}

// ผลของออร่า (สร้างจากตัวเลขใน data/gems.json)
export function auraLines(P, a) {
  const out = Object.entries(a.stats).map(([k, v]) => statText(P, k, v));
  out.push(`จองมานาสูงสุด ${Math.round(a.reserve * 100)}%`);
  return out;
}

export function drawGemTip(ctx, game, id, ax, ay, opt = {}) {
  const G = game.data.gems, s = opt.s || 1, info = gemInfo(G, id), main = gemType(G, id) === 'main', lines = [];
  lines.push({ h: 40 * s, draw: (c, x, y, w) => c.drawImage(gemSprite(G, id, 80), x + w / 2 - 18 * s, y, 36 * s, 36 * s) });
  lines.push({ t: info.name, col: info.hi || info.color, size: 12.5, weight: '600', center: true });
  const aura = main && info.aura;
  lines.push({ t: aura ? 'พลอยออร่า — ฝังแล้วมีผลตลอด ไม่ต้องกด' : main ? 'พลอยสกิล — ฝังแล้วได้สกิล' : 'พลอยเสริม — เสริมพลอยสกิลที่อยู่ในช่องเชื่อมกัน', col: 'rgba(244,230,200,0.65)', size: 9, center: true });
  const sc = G.socketColors[info.socket];
  lines.push({ t: `ลงได้ในช่องสี${sc.name} หรือช่องขาว`, col: sc.color, size: 9.5, center: true, weight: '600' });
  const X = gemXpInfo(G, game.player, id), L = G.levels;
  lines.push({ t: X.max ? `เลเวล ${X.lv} (สูงสุด)` : `เลเวล ${X.lv}/${L.max} · XP ${X.xp}/${X.need}`, col: C.goldHi, size: 9.5, center: true, weight: '600' });
  if (!X.max) lines.push({ h: 8 * s, draw: (c, x, y, w) => { c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(x + w * 0.2, y + 2 * s, w * 0.6, 4 * s); c.fillStyle = C.goldHi; c.fillRect(x + w * 0.2, y + 2 * s, w * 0.6 * X.xp / X.need, 4 * s); } });
  lines.push({ sep: true, h: 8 * s });
  if (aura) {
    lines.push({ t: `ออร่า: ${info.skill}`, col: C.goldHi, size: 10.5, weight: '600' });
    for (const l of auraLines(game.data.passives, auraAt(G, id, X.lv))) lines.push({ t: l, size: 10 });
    lines.push({ t: 'พลอยเสริมที่เชื่อมไว้ไม่มีผลกับออร่า', col: 'rgba(244,230,200,0.6)', size: 9 });
  } else if (main) {
    const sk = opt.final || computeSkill(G, id, [], (g) => gemLevel(G, game.player, g));                // ฝังอยู่ = แสดงผลรวมกับพลอยเสริมที่เชื่อมจริง
    lines.push({ t: `สกิล: ${sk.name}`, col: C.goldHi, size: 10.5, weight: '600' });
    for (const l of skillLines(sk)) lines.push({ t: l, size: 10 });
    if (opt.final && sk.supports.length) lines.push({ t: 'เสริมอยู่: ' + sk.supports.map((x) => G.support[x].name.replace('พลอยเสริม', '')).join(' + '), col: '#9af0b0', size: 9.5 });
    if (opt.final && sk.unused && sk.unused.length) lines.push({ t: 'ไม่มีผลกับสกิลนี้: ' + sk.unused.map((x) => G.support[x].name.replace('พลอยเสริม', '')).join(' + '), col: '#ff9a7a', size: 9.5 });
  } else {
    for (const l of supportLines(G, id)) lines.push({ t: l, size: 10 });
    if (X.lv > 1) lines.push({ t: `เลเวลพลอย: ดาเมจสกิลที่เสริม +${Math.round(L.supportDamage * (X.lv - 1) * 100)}%`, size: 10, col: '#9af0b0' });
  }
  lines.push({ t: info.desc, col: MOD_COL, size: 9.5 });
  if (opt.hint) { lines.push({ sep: true, h: 8 * s }); lines.push({ t: opt.hint, col: '#9af0b0', size: 9.5, weight: '600' }); }
  tipBox(ctx, lines, ax, ay, s, opt.W, opt.H, info.color);
}

export function drawCurrencyTip(ctx, game, kind, ax, ay, opt = {}) {
  const c = opt.raw || game.data.items.currency[kind], s = opt.s || 1;   // raw = กล่องแบบเดียวกันสำหรับยา
  const lines = [{ t: c.name, col: c.color, size: 12.5, weight: '600', center: true }, { sep: true, h: 8 * s }, { t: c.desc, col: MOD_COL, size: 9.5 }];
  if (opt.hint) lines.push({ t: opt.hint, col: '#9af0b0', size: 9.5, weight: '600' });
  tipBox(ctx, lines, ax, ay, s, opt.W, opt.H, c.color);
}


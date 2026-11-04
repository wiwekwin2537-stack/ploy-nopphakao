// ตัวตรวจโครงสร้าง: ถ้าไม่ผ่าน ห้าม commit ห้ามขึ้นเว็บ (กติกาจากบทเรียนเอโดเรีย)
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const problems = [];
const bad = (file, msg) => problems.push(`${file}: ${msg}`);

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    if (['node_modules', '.git', 'dist', 'shots'].includes(f)) continue; // shots = ภาพจากเทสต์ (ไม่ขึ้นเว็บ)
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}

const all = walk(root);
for (const f of all) {
  const rel = relative(root, f);
  if (/\.(png|jpe?g|webp|gif|bmp|mp3|ogg|wav)$/i.test(f)) bad(rel, 'ห้ามมีไฟล์ภาพ/เสียง — ทุกอย่างต้องสร้างด้วยโค้ด');
  if (/(^|[\/_.-])(fix|patch|hotfix)[\w-]*\.js$/i.test(rel)) bad(rel, 'ห้ามสร้างไฟล์ชุดแก้ (fix/patch) — แก้ที่ตัวจริงเท่านั้น');
}

const src = all.filter((f) => f.startsWith(join(root, 'src')) && f.endsWith('.js'));
const defined = new Map();
for (const f of src) {
  const rel = relative(root, f);
  const text = readFileSync(f, 'utf8');
  const lines = text.split('\n');
  if (lines.length > 800) bad(rel, `ยาว ${lines.length} บรรทัด (เกิน 800) — แยกเป็นระบบย่อย`);
  const imported = new Set();
  for (const m of text.matchAll(/import\s*\{([^}]*)\}\s*from/g)) m[1].split(',').forEach((n) => { const k = n.trim().split(/\s+as\s+/).pop(); if (k) imported.add(k); });
  for (const m of text.matchAll(/import\s+(\w+)\s+from/g)) imported.add(m[1]);
  lines.forEach((line, i) => {
    const at = `${rel}:${i + 1}`;
    const code = line.replace(/\/\/.*$/, '');
    const fn = /^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/.exec(line) || /^export\s+(?:const|let)\s+([A-Za-z_$][\w$]*)/.exec(line);
    if (fn) {
      if (defined.has(fn[1])) bad(at, `ชื่อ "${fn[1]}" ซ้ำกับ ${defined.get(fn[1])} — หนึ่งฟังก์ชันต้องมีที่อยู่ที่เดียว`);
      else defined.set(fn[1], at);
    }
    if (/\b(window|globalThis|self)\.[A-Za-z_$][\w$]*\s*=[^=]/.test(code) && !line.includes('// test-hook')) bad(at, 'ห้ามเขียนตัวแปร global');
    if (/requestAnimationFrame/.test(code) && !rel.endsWith(join('core', 'loop.js'))) bad(at, 'requestAnimationFrame ใช้ได้ที่ src/core/loop.js เท่านั้น');
    if (/\bset(Interval|Timeout)\s*\(/.test(code)) bad(at, 'ห้ามใช้ setInterval/setTimeout — ใช้ตัวนับเวลาในลูปเกม');
    for (const name of imported) {
      if (new RegExp(`^\\s*${name.replace('$', '\\$')}\\s*=[^=]`).test(code)) bad(at, `ห้ามเขียนทับ "${name}" ที่ import มา`);
    }
  });
}

// ทุกชื่อที่ import จากไฟล์ในโปรเจกต์ต้องมี export อยู่จริง (กันไฟล์ว่าง/ชื่อหาย/เขียนทับผิดไฟล์)
import { dirname, resolve } from 'node:path';
const exportsOf = new Map();
function exportedNames(file) {
  if (exportsOf.has(file)) return exportsOf.get(file);
  let text = '';
  try { text = readFileSync(file, 'utf8'); } catch { exportsOf.set(file, null); return null; }
  const names = new Set();
  for (const m of text.matchAll(/^export\s+(?:async\s+)?(?:function|const|let|class)\s+([A-Za-z_$][\w$]*)/gm)) names.add(m[1]);
  for (const m of text.matchAll(/^export\s*\{([^}]*)\}/gm)) m[1].split(',').forEach((n) => { const k = n.trim().split(/\s+as\s+/).pop(); if (k) names.add(k); });
  exportsOf.set(file, names);
  return names;
}
for (const f of src.concat(all.filter((x) => x.includes(join('tests', 'unit')) && x.endsWith('.js')))) {
  const text = readFileSync(f, 'utf8');
  for (const m of text.matchAll(/import\s*\{([^}]*)\}\s*from\s*'(\.[^']+\.js)'/g)) {
    const target = resolve(dirname(f), m[2]), names = exportedNames(target);
    if (!names) { bad(relative(root, f), `import จากไฟล์ที่ไม่มี: ${m[2]}`); continue; }
    for (const n of m[1].split(',')) {
      const k = n.trim().split(/\s+as\s+/)[0].trim();
      if (k && !names.has(k)) bad(relative(root, f), `import "${k}" แต่ ${m[2]} ไม่มี export ชื่อนี้`);
    }
  }
}

// ตรวจข้อมูลเกม
const J = (p) => JSON.parse(readFileSync(join(root, 'data', p), 'utf8'));
const monsters = J('monsters.json'), zones = J('zones.json'), dialogue = J('dialogue.json'), balance = J('balance.json');
for (const [id, m] of Object.entries(monsters)) {
  for (const k of ['name', 'hp', 'damage', 'xp', 'speed', 'radius', 'ai', 'aggro', 'attackRange', 'attackCooldown', 'coins', 'coinChance']) if (m[k] === undefined) bad('data/monsters.json', `${id} ไม่มี ${k}`);
  if (!['melee', 'charger', 'caster', 'boss'].includes(m.ai)) bad('data/monsters.json', `${id} ai ไม่รู้จัก: ${m.ai}`);
}
for (const [id, z] of Object.entries(zones)) {
  for (const e of z.exits) {
    if (!zones[e.to]) { bad('data/zones.json', `${id} มีทางออกไปพื้นที่ที่ไม่มี: ${e.to}`); continue; }
    const t = zones[e.to];
    if (e.tx <= 0 || e.ty <= 0 || e.tx >= t.w || e.ty >= t.h) bad('data/zones.json', `${id}→${e.to} จุดเกิดอยู่นอกแผนที่`);
    for (const back of t.exits) if (e.tx >= back.x && e.tx <= back.x + back.w && e.ty >= back.y && e.ty <= back.y + back.h) bad('data/zones.json', `${id}→${e.to} จุดเกิดทับทางออก (จะวาร์ปวน)`);
  }
  for (const s of z.spawns) if (!monsters[s.type]) bad('data/zones.json', `${id} มีมอนที่ไม่มีข้อมูล: ${s.type}`);
  for (const n of z.npcs) if (!dialogue[n.id]) bad('data/dialogue.json', `ไม่มีบทพูดของ ${n.id}`);
}
if (balance.xpToNext.length < balance.maxLevel) bad('data/balance.json', 'xpToNext สั้นกว่าเลเวลสูงสุด');

if (problems.length) {
  console.error('❌ ตรวจโครงสร้างไม่ผ่าน ' + problems.length + ' จุด');
  problems.forEach((p) => console.error('  - ' + p));
  process.exit(1);
}
console.log(`✅ ตรวจโครงสร้างผ่าน (${src.length} ไฟล์โค้ด, ${defined.size} ฟังก์ชัน ไม่มีชื่อซ้ำ ไม่มีโค้ดทับ)`);

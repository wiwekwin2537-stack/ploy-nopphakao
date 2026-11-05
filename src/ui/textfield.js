// ช่องพิมพ์ข้อความบนจอเกม: ใช้ช่อง input จริงของเบราว์เซอร์วางทับตำแหน่งบนแคนวาส (มือถือขึ้นแป้นพิมพ์ไทยได้ จำรหัสผ่านได้)
// ใช้ร่วม: ชื่อตัวละคร (หน้าสร้างตัวละคร) · ชื่อผู้ใช้/รหัสผ่าน (หน้าเข้าสู่ระบบ)
import { rrect, C } from '../art/draw.js';
import { uiText as text } from './hud.js';

const fields = new Map();

function field(id, opts) {
  let el = fields.get(id);
  if (el || typeof document === 'undefined') return el || null;
  el = document.createElement('input');
  Object.assign(el, { maxLength: opts.max || 16, placeholder: opts.placeholder || '', type: opts.type || 'text', autocomplete: opts.autocomplete || 'off', name: id });
  el.dataset.field = id;
  Object.assign(el.style, { position: 'fixed', zIndex: 5, background: 'rgba(20,14,10,0.95)', color: '#f4e6c8', border: '1.5px solid #d9a630', borderRadius: '6px', padding: '0 10px', boxSizing: 'border-box', font: '16px Kanit, sans-serif', outline: 'none', display: 'none' });
  el.addEventListener('input', () => { const f = el.onValue; if (f) f(el.value.slice(0, el.maxLength)); });   // ส่งเข้าหน้าต่างที่เปิดอยู่ตอนนี้ (เปิดหน้าต่างใหม่ = ตัวรับใหม่)
  document.body.appendChild(el);
  fields.set(id, el);
  return el;
}

// วาด/วางช่อง id ที่กรอบ R (พิกัดจอเกม w) · value = ค่าที่เกมถืออยู่ (ไม่ทับตอนผู้เล่นกำลังพิมพ์)
export function drawField(ctx, id, R, w, s, value, opts = {}) {
  const el = field(id, opts);
  if (!el) {                                                             // นอกเบราว์เซอร์ (เทสต์): วาดกล่องแทน
    ctx.fillStyle = 'rgba(20,14,10,0.95)'; rrect(ctx, R.x, R.y, R.w, R.h, 6 * s); ctx.fill();
    text(ctx, opts.type === 'password' ? '•'.repeat(String(value).length) : String(value), R.x + 10 * s, R.y + R.h / 2, 13 * s, C.cream, 'left', 'normal');
    return;
  }
  el.onValue = opts.onInput;
  const r = ctx.canvas.getBoundingClientRect(), k = r.width / w;
  Object.assign(el.style, { display: 'block', left: r.left + R.x * k + 'px', top: r.top + R.y * k + 'px', width: R.w * k + 'px', height: R.h * k + 'px' });
  if (document.activeElement !== el && el.value !== value) el.value = value;
}

export function setFieldValue(id, v) { const el = fields.get(id); if (el) el.value = v; }
export function hideFields() { for (const el of fields.values()) { el.style.display = 'none'; el.blur(); } }

// แคชภาพของที่ไม่ขยับ: วาดลงแคนวาสครั้งเดียว แล้วใช้ drawImage ทุกเฟรม
import { PROPS } from './props.js';
import { BUILDINGS } from './buildings.js';

const SPEC = { ...PROPS, ...BUILDINGS };

export function createSpriteCache(scale) {
  const cache = new Map();
  function get(o) {
    const spec = SPEC[o.type];
    if (!spec || spec.hidden) return null;
    const variant = (o.seed || 0) % 6;
    const key = `${o.type}|${Math.round(o.w)}|${Math.round(o.h)}|${variant}`;
    let s = cache.get(key);
    if (s) return s;
    const [pl, pt, pr, pb] = spec.pad;
    const w = o.w + pl + pr, h = o.h + pt + pb;
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w * scale)); c.height = Math.max(1, Math.ceil(h * scale));
    const g = c.getContext('2d');
    g.scale(scale, scale);
    g.translate(pl, pt + o.h);
    spec.draw(g, o.w, o.h, variant * 97 + 3);
    s = { c, w, h, ox: pl, oy: pt + o.h, flat: !!spec.flat };
    cache.set(key, s);
    return s;
  }
  return {
    get,
    isFlat(o) { const spec = SPEC[o.type]; return !!(spec && spec.flat); },
    isHidden(o) { const spec = SPEC[o.type]; return !spec || !!spec.hidden; },
    draw(ctx, o) {
      const s = get(o);
      if (!s) return;
      ctx.drawImage(s.c, o.x - s.ox, o.y + o.h - s.oy, s.w, s.h);
    },
    // ขอบเขตภาพบนจอ ใช้ตัดของที่อยู่นอกจอทิ้ง
    bounds(o) {
      const spec = SPEC[o.type];
      if (!spec || spec.hidden) return null;
      const [pl, pt, pr, pb] = spec.pad;
      return { l: o.x - pl, r: o.x + o.w + pr, t: o.y - pt, b: o.y + o.h + pb };
    },
    get size() { return cache.size; },
  };
}

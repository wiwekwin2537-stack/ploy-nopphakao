// กล้องตามผู้เล่น และแปลงพิกัดจอ ↔ โลก
export function createCamera() {
  return {
    x: 0, y: 0, zoom: 2, viewW: 0, viewH: 0, shake: 0,
    resize(w, h) {
      this.viewW = w; this.viewH = h;
      // ให้เห็นราว 9 ช่องครึ่งในแนวตั้งบนมือถือแนวนอน ตัวละครจะได้ไม่เล็กเกิน
      this.zoom = Math.max(1.4, Math.min(3, h / (32 * 9.5)));
    },
    follow(tx, ty, worldW, worldH, dt) {
      const k = 1 - Math.pow(0.0001, dt);
      this.x += (tx - this.x) * k;
      this.y += (ty - this.y) * k;
      const hw = this.viewW / this.zoom / 2, hh = this.viewH / this.zoom / 2;
      this.x = worldW > hw * 2 ? Math.max(hw, Math.min(worldW - hw, this.x)) : worldW / 2;
      this.y = worldH > hh * 2 ? Math.max(hh, Math.min(worldH - hh, this.y)) : worldH / 2;
      if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 30);
    },
    snap(tx, ty) { this.x = tx; this.y = ty; },
    toWorld(sx, sy) {
      return { x: (sx - this.viewW / 2) / this.zoom + this.x, y: (sy - this.viewH / 2) / this.zoom + this.y };
    },
    bounds() {
      const hw = this.viewW / this.zoom / 2, hh = this.viewH / this.zoom / 2;
      return { l: this.x - hw, r: this.x + hw, t: this.y - hh, b: this.y + hh };
    },
  };
}

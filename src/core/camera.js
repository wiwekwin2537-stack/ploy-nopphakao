// กล้องตามผู้เล่น และแปลงพิกัดจอ ↔ โลก
export function createCamera() {
  return {
    x: 0, y: 0, zoom: 2, viewW: 0, viewH: 0, shake: 0,
    resize(w, h) {
      this.viewW = w; this.viewH = h;
      // มองกว้างแบบเอโดเรีย: เห็นราว 14 ช่องในแนวตั้ง
      this.zoom = Math.max(0.75, Math.min(2, h / (32 * 14)));
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

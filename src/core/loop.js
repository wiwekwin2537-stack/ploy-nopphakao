// ลูปเกมตัวเดียวของทั้งเกม — requestAnimationFrame มีได้ที่ไฟล์นี้เท่านั้น
export function createLoop(update, render) {
  let last = 0;
  let running = false;
  const stats = { fps: 0, frameMs: 0, frames: 0, _acc: 0, _n: 0, _cost: 0 };

  function frame(t) {
    if (!running) return;
    const dt = Math.min(0.05, last ? (t - last) / 1000 : 1 / 60);
    last = t;
    const t0 = performance.now();
    update(dt);
    render(dt);
    const cost = performance.now() - t0;
    stats.frames++;
    stats._acc += dt; stats._n++; stats._cost += cost;
    if (stats._acc >= 0.5) {
      stats.fps = Math.round(stats._n / stats._acc);
      stats.frameMs = +(stats._cost / stats._n).toFixed(2);
      stats._acc = 0; stats._n = 0; stats._cost = 0;
    }
    requestAnimationFrame(frame);
  }

  return {
    stats,
    start() { if (running) return; running = true; last = 0; requestAnimationFrame(frame); },
    stop() { running = false; },
    // ใช้ในเทสต์: เดินเกมทีละขั้นโดยไม่ต้องรอเฟรมจริง
    step(dt, n = 1) { for (let i = 0; i < n; i++) update(dt); render(dt); },
  };
}

// หาทางเดินแบบตาราง (BFS) ใช้พิสูจน์ว่าผู้เล่นเดินไปถึงจุดหมายได้จริง
export function reachable(world, from, test, r = 10, step = 8) {
  const z = world.zone, cols = Math.ceil(z.W / step), rows = Math.ceil(z.H / step);
  const seen = new Uint8Array(cols * rows);
  const q = [[Math.floor(from.x / step), Math.floor(from.y / step)]];
  seen[q[0][1] * cols + q[0][0]] = 1;
  while (q.length) {
    const [cx, cy] = q.shift();
    const x = cx * step + step / 2, y = cy * step + step / 2;
    if (test(x, y)) return { x, y };
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows || seen[ny * cols + nx]) continue;
      seen[ny * cols + nx] = 1;
      if (!world.blocked(nx * step + step / 2, ny * step + step / 2, r)) q.push([nx, ny]);
    }
  }
  return null;
}

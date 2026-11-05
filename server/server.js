// จุดเริ่มเซิร์ฟเวอร์บน Render: node server.js — ตั้ง env: UPSTASH_REDIS_REST_URL/TOKEN · TOKEN_SECRET · ALLOWED_ORIGINS
import http from 'node:http';
import { createApp } from './app.js';
import { storeFromEnv } from './store.js';

const env = process.env;
if (env.RENDER === 'true' && !env.TOKEN_SECRET) throw new Error('ต้องตั้ง TOKEN_SECRET บน Render');
const app = createApp({ store: storeFromEnv(env), secret: env.TOKEN_SECRET || 'dev-secret', origins: (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean) });
const GAME_URL = env.GAME_URL || 'https://ploy-nopphakao.onrender.com';
const server = http.createServer((req, res) => {
  if (app.http(req, res)) return;
  res.writeHead(302, { location: GAME_URL }); res.end();             // เปิดลิงก์เซิร์ฟเวอร์ตรงๆ = พาไปหน้าเกม
});
app.attach(server);
server.listen(env.PORT || 8787, '0.0.0.0', () => console.log('พลอยนพเก้า ออนไลน์พร้อม พอร์ต', env.PORT || 8787));
process.on('SIGTERM', () => { app.stop(); server.close(() => process.exit(0)); });

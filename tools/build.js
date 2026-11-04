// รวมโค้ดเป็นไฟล์เดียว dist/index.html (เปิดเล่นได้ทันที ไม่ต้องมีเซิร์ฟเวอร์)
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const res = await build({ entryPoints: ['src/main.js'], bundle: true, format: 'iife', minify: true, write: false, target: ['es2020'], legalComments: 'none' });
const js = res.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const html = readFileSync('web/index.html', 'utf8').replace('<script>/*GAME*/</script>', () => `<script>${js}</script>`);
mkdirSync('dist', { recursive: true });
writeFileSync('dist/index.html', html);
// รุ่นหน้าเว็บ artifact: ไม่มีแท็ก html/head/body (ระบบใส่ให้เอง)
const art = html.replace(/<!doctype html>\s*/i, '').replace(/<\/?html[^>]*>\s*/gi, '').replace(/<\/?head>\s*/gi, '').replace(/<\/?body>\s*/gi, '')
  .replace(/<meta charset="utf-8">\s*/i, '').replace(/<meta name="viewport"[^>]*>\s*/i, '');
writeFileSync('dist/artifact.html', art);
mkdirSync('docs', { recursive: true });
writeFileSync('docs/index.html', html);                    // หน้าเล่นเกมบน GitHub Pages (ตั้งให้เสิร์ฟจากโฟลเดอร์ docs)
console.log(`dist/index.html ${(html.length / 1024).toFixed(1)} KB · dist/artifact.html`);

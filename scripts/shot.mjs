// Generic screenshot: navigates to URL, waits for window.READY, saves PNG.
// URL=... OUT=/tmp/x.png [EVAL="js to run before shot"] node scripts/shot.mjs
import { spawn } from 'node:child_process';
import { writeFileSync, readdirSync, existsSync } from 'node:fs';
const base = process.env.HOME + '/.cache/ms-playwright';
const dir = readdirSync(base).find((d) => d.startsWith('chromium-') && !d.includes('headless'));
const CHROME = `${base}/${dir}/chrome-linux64/chrome`;
const PORT = 9236;
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, '--use-gl=angle',
  '--use-angle=vulkan', '--enable-unsafe-swiftshader', '--window-size=1200,1000', '--no-first-run',
  '--no-sandbox', '--user-data-dir=/tmp/shotchrome', 'about:blank']);
chrome.stderr.on('data', () => {});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function cdp() { for (let i = 0; i < 40; i++) { try { const l = await (await fetch(`http://localhost:${PORT}/json/list`)).json(); const p = l.find((t) => t.type === 'page'); if (p) return p; } catch {} await sleep(250); } throw new Error('no devtools'); }
async function main() {
  const page = await cdp();
  const ws = new (await import('ws')).WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => ws.on('open', r));
  let id = 0; const pend = new Map();
  ws.on('message', (d) => { const m = JSON.parse(d.toString()); if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id); } });
  const send = (m, p = {}) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url: process.env.URL });
  for (let i = 0; i < 40; i++) { await sleep(400); const r = await send('Runtime.evaluate', { expression: '!!window.READY', returnByValue: true }); if (r.result.value) break; }
  if (process.env.EVAL) { await send('Runtime.evaluate', { expression: process.env.EVAL }); await sleep(500); }
  await sleep(500);
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  if (shot?.data) { writeFileSync(process.env.OUT || '/tmp/shot.png', Buffer.from(shot.data, 'base64')); console.log('wrote', process.env.OUT || '/tmp/shot.png'); }
  ws.close(); chrome.kill(); process.exit(0);
}
main().catch((e) => { console.error(e); chrome.kill(); process.exit(1); });

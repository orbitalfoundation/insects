// Screenshot the CT-scan glTF viewer (scan.html) at several rotations via headless
// Chromium/CDP. Usage: node scripts/shoot_scan.mjs   (shots to /tmp/scan_*.png)
import { spawn } from 'node:child_process';
import { writeFileSync, readdirSync, existsSync } from 'node:fs';

const base = process.env.HOME + '/.cache/ms-playwright';
const dir = readdirSync(base).find((d) => d.startsWith('chromium-') && !d.includes('headless'));
const CHROME = `${base}/${dir}/chrome-linux64/chrome`;
if (!existsSync(CHROME)) { console.error('no chromium'); process.exit(1); }
const PORT = 9226;
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`,
  '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
  '--window-size=1000,1000', '--no-first-run', '--no-sandbox', '--user-data-dir=/tmp/scanchrome', 'about:blank']);
chrome.stderr.on('data', () => {});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function cdp() {
  for (let i = 0; i < 40; i++) {
    try { const l = await (await fetch(`http://localhost:${PORT}/json/list`)).json();
      const p = l.find((t) => t.type === 'page'); if (p) return p; } catch {}
    await sleep(250);
  }
  throw new Error('no devtools');
}

const SHOTS = (process.env.SHOTS || '0,90,180,270').split(',');
const PLAIN = process.env.PLAIN || '1';

async function main() {
  const page = await cdp();
  const ws = new (await import('ws')).WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => ws.on('open', r));
  let id = 0; const pend = new Map();
  ws.on('message', (d) => { const m = JSON.parse(d.toString()); if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id); } });
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Page.enable'); await send('Runtime.enable');
  for (const ry of SHOTS) {
    const srcQ = process.env.SRC ? `&src=${encodeURIComponent(process.env.SRC)}` : '';
    await send('Page.navigate', { url: `http://localhost:5188/scan.html?ry=${ry}&plain=${PLAIN}${srcQ}` });
    let info = null;
    for (let i = 0; i < 60; i++) { await sleep(500);
      const r = await send('Runtime.evaluate', { expression: 'JSON.stringify({r:!!window.SCAN_READY,e:window.SCAN_ERR||null,i:window.SCAN_INFO||null})', returnByValue: true });
      const s = JSON.parse(r.result.value); if (s.e) { console.log('ERR', s.e); break; } if (s.r) { info = s.i; break; }
    }
    await sleep(400);
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    if (shot?.data) { writeFileSync(`/tmp/scan_${ry}.png`, Buffer.from(shot.data, 'base64')); process.stdout.write(`ry=${ry} ${info ? 'verts=' + info.verts + ' size=' + info.size : 'NO-READY'}\n`); }
  }
  ws.close(); chrome.kill(); process.exit(0);
}
main().catch((e) => { console.error(e); chrome.kill(); process.exit(1); });

// Generate a per-part colour map of the bee head — a programmatic "image from scratch":
// build the model, paint each head component a distinct hue, render headlessly.
// (A vision model can't paint pixels directly, but it can drive a renderer and read back
//  the result.)  npm run parts  → /tmp/parts_head.png
import { spawn } from 'node:child_process';
import { writeFileSync, readdirSync, existsSync } from 'node:fs';

const base = process.env.HOME + '/.cache/ms-playwright';
const dir = readdirSync(base).find((d) => d.startsWith('chromium-') && !d.includes('headless'));
const CHROME = `${base}/${dir}/chrome-linux64/chrome`;
if (!existsSync(CHROME)) { console.error('no chromium'); process.exit(1); }
const PORT = 9231;
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, '--use-gl=angle',
  '--use-angle=vulkan', '--enable-unsafe-swiftshader', '--window-size=1100,1000', '--no-first-run',
  '--no-sandbox', '--user-data-dir=/tmp/partschrome', 'about:blank']);
chrome.stderr.on('data', () => {});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function cdp() {
  for (let i = 0; i < 40; i++) { try { const l = await (await fetch(`http://localhost:${PORT}/json/list`)).json();
    const p = l.find((t) => t.type === 'page'); if (p) return p; } catch {} await sleep(250); }
  throw new Error('no devtools');
}

const PAINT = `(() => {
  const rig = window.BUG.rig(); const done = new Set();
  const paint = (m, hex) => { if (m && m.isMesh && m.material) { const x = m.material.clone();
    x.vertexColors = false; x.color.set(hex); if (x.emissive) x.emissive.set('#000000'); m.material = x; done.add(m); } };
  paint(rig.bodyParts.headMesh, '#e6a81e');                              // head capsule — gold
  (rig.eyeMeshes || []).forEach((e) => paint(e, '#d62828'));            // compound eyes — red
  rig.antennae.forEach((a) => a.limb.root.traverse((o) => { if (o.isMesh) paint(o, '#3a86ff'); })); // antennae — blue
  rig.bodyParts.headGroup.traverse((o) => { if (o.isMesh && !done.has(o))
    paint(o, o.isInstancedMesh ? '#b9860f' : '#2a9d8f'); });            // fuzz — dk gold, proboscis/mandibles — teal
  return 'painted';
})()`;

async function main() {
  const page = await cdp();
  const ws = new (await import('ws')).WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => ws.on('open', r));
  let id = 0; const pend = new Map();
  ws.on('message', (d) => { const m = JSON.parse(d.toString()); if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id); } });
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url: 'http://localhost:5188/' });
  await sleep(2600);
  await send('Runtime.evaluate', { expression: `for (const id of ['gui-panel','panel-tab','title','hud']){const e=document.getElementById(id);if(e)e.style.display='none';}` });
  await send('Runtime.evaluate', { expression: `window.BUG.setSpecies('honeybee'); window.BUG.restPose && window.BUG.restPose(); window.BUG.pause && window.BUG.pause(true);` });
  await sleep(900);
  const r = await send('Runtime.evaluate', { expression: PAINT, returnByValue: true });
  console.log('paint:', r.result.value);
  await send('Runtime.evaluate', { expression: `window.BUG.setView('head')` });
  await sleep(500);
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  if (shot?.data) { writeFileSync('/tmp/parts_head.png', Buffer.from(shot.data, 'base64')); console.log('wrote /tmp/parts_head.png'); }
  ws.close(); chrome.kill(); process.exit(0);
}
main().catch((e) => { console.error(e); chrome.kill(); process.exit(1); });

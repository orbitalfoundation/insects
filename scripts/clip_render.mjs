// Render the image set for the CLIP-oracle experiment:
//  - honeybee at several EYE scale factors (a known realism perturbation), body + head views
//  - each species at default (discrimination test)
// Output: /tmp/clip/*.png
import { spawn } from 'node:child_process';
import { writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';

mkdirSync('/tmp/clip', { recursive: true });
const base = process.env.HOME + '/.cache/ms-playwright';
const dir = readdirSync(base).find((d) => d.startsWith('chromium-') && !d.includes('headless'));
const CHROME = `${base}/${dir}/chrome-linux64/chrome`;
if (!existsSync(CHROME)) { console.error('no chromium'); process.exit(1); }
const PORT = 9232;
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, '--use-gl=angle',
  '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=900,900', '--no-first-run',
  '--no-sandbox', '--user-data-dir=/tmp/clipchrome', 'about:blank']);
chrome.stderr.on('data', () => {});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function cdp() {
  for (let i = 0; i < 40; i++) { try { const l = await (await fetch(`http://localhost:${PORT}/json/list`)).json();
    const p = l.find((t) => t.type === 'page'); if (p) return p; } catch {} await sleep(250); }
  throw new Error('no devtools');
}

async function main() {
  const page = await cdp();
  const ws = new (await import('ws')).WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => ws.on('open', r));
  let id = 0; const pend = new Map();
  ws.on('message', (d) => { const m = JSON.parse(d.toString()); if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id); } });
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  const evalx = (expr) => send('Runtime.evaluate', { expression: expr, returnByValue: true });
  const shoot = async (name) => { const s = await send('Page.captureScreenshot', { format: 'png' }); if (s?.data) writeFileSync(`/tmp/clip/${name}.png`, Buffer.from(s.data, 'base64')); process.stdout.write(name + ' '); };

  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url: 'http://localhost:5188/' });
  await sleep(2600);
  await evalx(`for (const id of ['gui-panel','panel-tab','title','hud']){const e=document.getElementById(id);if(e)e.style.display='none';}`);

  // (B) eye-scale sweep on the honeybee, body + head views
  for (const f of [0.6, 1.0, 1.6, 2.4]) {
    for (const view of ['oblique', 'head']) {
      await evalx(`window.BUG.setSpecies('honeybee'); window.BUG.restPose&&window.BUG.restPose(); window.BUG.pause&&window.BUG.pause(true);`);
      await sleep(500);
      await evalx(`window.BUG.rig().eyeMeshes.forEach(e=>e.scale.multiplyScalar(${f})); window.BUG.setView('${view}');`);
      await sleep(400);
      await shoot(`eye_${f}_${view}`);
    }
  }
  // (A) discrimination: each species at default (oblique)
  for (const sp of ['honeybee', 'jewel_beetle', 'mosquito', 'mantis', 'dragonfly', 'ladybird', 'housefly']) {
    await evalx(`window.BUG.setSpecies('${sp}'); window.BUG.restPose&&window.BUG.restPose(); window.BUG.pause&&window.BUG.pause(true); window.BUG.setView('oblique');`);
    await sleep(600);
    await shoot(`sp_${sp}`);
  }
  console.log('\ndone');
  ws.close(); chrome.kill(); process.exit(0);
}
main().catch((e) => { console.error(e); chrome.kill(); process.exit(1); });

// EXTERNAL critic — regress our bee's geometry against a real labelled reference. The
// artistic sculpt (scan/honeybee_art.glb) carries a named anatomical joint skeleton, so we
// can read its per-component measurements, read the same from our rig, normalise away scale,
// and report a DELTA PER COMPONENT. Scale/orientation cancel because everything is expressed
// as a fraction of its group total (leg segments / leg length; body regions / body length).
//
//   npm run compare
import * as THREE from 'three';
import { readFileSync } from 'node:fs';
import { makeSpecies } from '../src/species/presets.js';
import { InsectRig } from '../src/rig/InsectRig.js';

// ---- load reference glb + forward kinematics for joint world positions ----
function parseGlb(path) {
  const buf = readFileSync(path); let off = 12, json = null;
  while (off < buf.length) { const len = buf.readUInt32LE(off), type = buf.readUInt32LE(off + 4);
    if (type === 0x4E4F534A) { json = JSON.parse(buf.subarray(off + 8, off + 8 + len).toString()); break; } off += 8 + len; }
  return json;
}
const json = parseGlb(new URL('../scan/honeybee_art.glb', import.meta.url).pathname);
const nodes = json.nodes;
const local = nodes.map((n) => {
  const m = new THREE.Matrix4();
  if (n.matrix) m.fromArray(n.matrix);
  else m.compose(new THREE.Vector3(...(n.translation || [0, 0, 0])), new THREE.Quaternion(...(n.rotation || [0, 0, 0, 1])), new THREE.Vector3(...(n.scale || [1, 1, 1])));
  return m;
});
const wp = nodes.map(() => null);
(function visit(i, pw) { const w = pw.clone().multiply(local[i]); wp[i] = new THREE.Vector3().setFromMatrixPosition(w);
  for (const c of (nodes[i].children || [])) visit(c, w); });
const scn = json.scenes[json.scene || 0];
for (const r of scn.nodes) (function go(i, pw) { const w = pw.clone().multiply(local[i]); wp[i] = new THREE.Vector3().setFromMatrixPosition(w); for (const c of (nodes[i].children || [])) go(c, w); })(r, new THREE.Matrix4());
const idOf = {}; nodes.forEach((n, i) => { if (n.name) idOf[n.name.split('.')[0]] = i; });
const P = (name) => wp[idOf[name]];
const has = (name) => idOf[name] != null;

// ---- reference: hind-leg segment lengths (world distance between consecutive joints) ----
const refLeg = [];
for (let k = 1; k <= 9; k++) refLeg.push(P('l_hindleg_jnt0' + k).distanceTo(P('l_hindleg_jnt0' + (k + 1))));
const SEG = ['coxa', 'trochanter', 'femur', 'tibia', 'basitarsus', 'tarsomere1', 'tarsomere2', 'tarsomere3', 'pretarsus'];

// ---- reference: body regions from the skeleton (approximate — single-mesh model) ----
let abdomen = 0; for (let k = 1; has('abdomen_jnt0' + (k + 1)); k++) abdomen += P('abdomen_jnt0' + k).distanceTo(P('abdomen_jnt0' + (k + 1)));
abdomen += P('abdomen_root_jnt').distanceTo(P('abdomen_jnt01'));
const headFront = has('l_big_labrum_endjnt') ? 'l_big_labrum_endjnt' : 'r_mandibre_jnt03';
const refHead = P('head_Jnt').distanceTo(P(headFront));
const refThorax = P('head_Jnt').distanceTo(P('abdomen_root_jnt'));
const refBody = [refHead, refThorax, abdomen];

// ---- ours ----
const rig = new InsectRig(makeSpecies('honeybee'));
const ourLeg = rig.legs.find((l) => l.sock.pair === 2).segLen.slice();
const b = makeSpecies('honeybee').body;
const ourBody = [b.head.len, b.thorax.len, b.abdomen.len];

// ---- normalise + delta ----
const frac = (v) => { const s = v.reduce((a, x) => a + x, 0); return v.map((x) => x / s); };
function table(title, names, ref, our) {
  const rf = frac(ref), of = frac(our);
  console.log(`\n=== ${title} — fraction of ${title.includes('leg') ? 'leg' : 'body'} length ===`);
  console.log('  component      reference   ours     Δ (pts)   Δ%');
  let rms = 0;
  names.forEach((n, i) => {
    const d = of[i] - rf[i], dp = rf[i] > 1e-4 ? (d / rf[i]) * 100 : 0; rms += d * d;
    console.log(`  ${n.padEnd(13)} ${(rf[i] * 100).toFixed(1).padStart(6)}%  ${(of[i] * 100).toFixed(1).padStart(6)}%  ${(d * 100 >= 0 ? '+' : '') + (d * 100).toFixed(1).padStart(5)}  ${(dp >= 0 ? '+' : '') + dp.toFixed(0)}%`);
  });
  rms = Math.sqrt(rms / names.length) * 100;
  console.log(`  → shape distance (RMS of Δ): ${rms.toFixed(2)} pts`);
  return rms;
}

console.log('COMPARATOR — our honeybee vs labelled reference (scan/honeybee_art.glb)');
const legRms = table('leg segments', SEG, refLeg, ourLeg);
const bodyRms = table('body regions', ['head', 'thorax', 'abdomen'], refBody, ourBody);
console.log(`\noverall: leg ${legRms.toFixed(2)}pts, body ${bodyRms.toFixed(2)}pts  (0 = identical proportions)`);
rig.dispose();

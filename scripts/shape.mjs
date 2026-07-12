// SHAPE descriptor — beyond position/extent. Two scale/rotation-normalisable views of form:
//   (1) moment fingerprint: PCA principal extents → aspect ratios (a "complex ellipsoid"),
//       plus 3rd-moment SKEWNESS along the main axis = ovoid asymmetry (egg vs ellipsoid).
//   (2) cross-section profile: width & height sampled along the main axis (the swept profile
//       our model is literally built from — so the delta maps straight onto taper/waist/aspect).
// Demo: the honeybee ABDOMEN — reference (segmented from the sculpt by SKIN WEIGHTS) vs ours.
//   npm run shape
import * as THREE from 'three';
import { readFileSync } from 'node:fs';
import { makeSpecies } from '../src/species/presets.js';
import { InsectRig } from '../src/rig/InsectRig.js';

// ---------- glb: JSON + BIN + accessor reader ----------
function loadGlb(path) {
  const buf = readFileSync(path); let off = 12, json = null, bin = null;
  while (off < buf.length) {
    const len = buf.readUInt32LE(off), type = buf.readUInt32LE(off + 4), data = buf.subarray(off + 8, off + 8 + len);
    if (type === 0x4E4F534A) json = JSON.parse(data.toString());
    else if (type === 0x004E4942) bin = data;
    off += 8 + len;
  }
  return { json, bin };
}
const { json, bin } = loadGlb(new URL('../scan/honeybee_art.glb', import.meta.url).pathname);
const CT = { 5120: [Int8Array, 1], 5121: [Uint8Array, 1], 5122: [Int16Array, 2], 5123: [Uint16Array, 2], 5125: [Uint32Array, 4], 5126: [Float32Array, 4] };
const NC = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
function accessor(i) {
  const a = json.accessors[i], bv = json.bufferViews[a.bufferView];
  const [Arr, sz] = CT[a.componentType], n = NC[a.type];
  const start = (bv.byteOffset || 0) + (a.byteOffset || 0);
  const out = [];
  for (let k = 0; k < a.count; k++) {
    const row = [];
    for (let c = 0; c < n; c++) row.push(new Arr(bin.buffer, bin.byteOffset + start + (k * n + c) * sz, 1)[0]);
    out.push(row);
  }
  return out;
}

// ---------- reference point cloud, segmented into components by dominant skin joint ----------
const prim = json.meshes[0].primitives[0];
const POS = accessor(prim.attributes.POSITION);
const JNT = accessor(prim.attributes.JOINTS_0);
const WGT = accessor(prim.attributes.WEIGHTS_0);
const skinJoints = json.skins[0].joints;               // skin-joint index → node index
const nodeName = (ni) => (json.nodes[ni].name || '').split('.')[0];
function component(name) {
  if (/^abdomen/.test(name)) return 'abdomen';
  if (/^head|mandib|labrum/.test(name)) return 'head';
  if (/body_jnt|root_jnt/.test(name)) return 'thorax';
  return 'other'; // legs / wings / antennae — not tagmata
}
const refParts = { head: [], thorax: [], abdomen: [] };
for (let v = 0; v < POS.length; v++) {
  let bj = 0, bw = -1; for (let c = 0; c < 4; c++) if (WGT[v][c] > bw) { bw = WGT[v][c]; bj = c; }
  const comp = component(nodeName(skinJoints[JNT[v][bj]]));
  if (refParts[comp]) refParts[comp].push(new THREE.Vector3(POS[v][0], POS[v][1], POS[v][2]));
}

// ---------- our point clouds per component ----------
const rig = new InsectRig(makeSpecies('honeybee'));
function meshPts(obj) {
  const out = [];
  obj.traverse((o) => {
    if (o.isMesh && o.geometry?.attributes?.position) {
      const p = o.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) out.push(new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i)));
    }
  });
  return out;
}
const ourParts = {
  head: meshPts(rig.bodyParts.headMesh),
  thorax: meshPts(rig.bodyParts.thorax),
  abdomen: meshPts(rig.bodyParts.abGroup),
};

// ---------- moment fingerprint ----------
function jacobi3(A) { // symmetric 3x3 → {val[3] desc, vec[3][3]}
  const a = A.map((r) => r.slice()); const V = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  for (let s = 0; s < 50; s++) {
    let p = 0, q = 1, m = Math.abs(a[0][1]);
    if (Math.abs(a[0][2]) > m) { m = Math.abs(a[0][2]); p = 0; q = 2; }
    if (Math.abs(a[1][2]) > m) { m = Math.abs(a[1][2]); p = 1; q = 2; }
    if (m < 1e-12) break;
    const th = 0.5 * Math.atan2(2 * a[p][q], a[q][q] - a[p][p]), c = Math.cos(th), sn = Math.sin(th);
    for (let k = 0; k < 3; k++) { const akp = a[k][p], akq = a[k][q]; a[k][p] = c * akp - sn * akq; a[k][q] = sn * akp + c * akq; }
    for (let k = 0; k < 3; k++) { const apk = a[p][k], aqk = a[q][k]; a[p][k] = c * apk - sn * aqk; a[q][k] = sn * apk + c * aqk; }
    for (let k = 0; k < 3; k++) { const vkp = V[k][p], vkq = V[k][q]; V[k][p] = c * vkp - sn * vkq; V[k][q] = sn * vkp + c * vkq; }
  }
  const idx = [0, 1, 2].sort((i, j) => a[j][j] - a[i][i]);
  return { val: idx.map((i) => a[i][i]), vec: idx.map((i) => [V[0][i], V[1][i], V[2][i]]) };
}
function fingerprint(pts) {
  const c = new THREE.Vector3(); pts.forEach((p) => c.add(p)); c.multiplyScalar(1 / pts.length);
  const C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (const p of pts) { const d = [p.x - c.x, p.y - c.y, p.z - c.z]; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) C[i][j] += d[i] * d[j]; }
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) C[i][j] /= pts.length;
  const { val, vec } = jacobi3(C);
  const sig = val.map((v) => Math.sqrt(Math.max(v, 0)));   // principal std-devs (extents)
  const axis = new THREE.Vector3(...vec[0]);               // main axis
  // skewness of the projection onto the main axis (ovoid: which end is fatter)
  let m2 = 0, m3 = 0; const proj = pts.map((p) => new THREE.Vector3().subVectors(p, c).dot(axis));
  proj.forEach((t) => { m2 += t * t; }); m2 /= proj.length;
  proj.forEach((t) => { m3 += t * t * t; }); m3 /= proj.length;
  const skew = m3 / Math.pow(m2, 1.5);
  return { aspectWH: sig[1] / sig[0], aspectDH: sig[2] / sig[0], skew, axis };
}

// ---------- cross-section profile along the main axis ----------
function profile(pts, axis, nBins = 8) {
  const c = new THREE.Vector3(); pts.forEach((p) => c.add(p)); c.multiplyScalar(1 / pts.length);
  const e0 = axis.clone().normalize();
  const up = Math.abs(e0.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  const e1 = new THREE.Vector3().crossVectors(e0, up).normalize();
  const e2 = new THREE.Vector3().crossVectors(e0, e1).normalize();
  const T = pts.map((p) => new THREE.Vector3().subVectors(p, c).dot(e0));
  const lo = Math.min(...T), hi = Math.max(...T);
  const bins = Array.from({ length: nBins }, () => ({ w: 0, h: 0 }));
  pts.forEach((p, i) => {
    const u = Math.min(nBins - 1, Math.floor(((T[i] - lo) / (hi - lo + 1e-9)) * nBins));
    const d = new THREE.Vector3().subVectors(p, c);
    bins[u].w = Math.max(bins[u].w, Math.abs(d.dot(e1)));
    bins[u].h = Math.max(bins[u].h, Math.abs(d.dot(e2)));
  });
  const maxW = Math.max(...bins.map((b) => b.w));
  return bins.map((b) => b.w / maxW); // width silhouette normalised to peak (the taper curve)
}

console.log('PER-COMPONENT SHAPE — honeybee, reference (skin-segmented) vs ours\n');
const row = (n, r, o, m) => console.log(`  ${n.padEnd(20)} ${r.toFixed(3).padStart(8)}  ${o.toFixed(3).padStart(8)}   Δ ${(o - r >= 0 ? '+' : '') + (o - r).toFixed(3)}   ${m}`);
for (const part of ['head', 'thorax', 'abdomen']) {
  const rp = refParts[part], op = ourParts[part];
  if (rp.length < 20 || op.length < 20) { console.log(`\n${part.toUpperCase()}: too few points (ref ${rp.length}, ours ${op.length})`); continue; }
  const ref = fingerprint(rp), our = fingerprint(op);
  console.log(`\n${part.toUpperCase()}  (ref ${rp.length} pts, ours ${op.length} pts)`);
  console.log('  descriptor            reference     ours     delta    meaning');
  row('aspect width/length', ref.aspectWH, our.aspectWH, 'fat vs long');
  row('aspect height/length', ref.aspectDH, our.aspectDH, 'dorsoventral flattening');
  row('ovoid skewness', ref.skew, our.skew, 'sign = fatter end');
  const pr = profile(rp, ref.axis), po = profile(op, our.axis);
  console.log('  taper profile ref: ', pr.map((x) => x.toFixed(2)).join(' '));
  console.log('  taper profile ours:', po.map((x) => x.toFixed(2)).join(' '));
}
rig.dispose();

// Headless: build a species with InsectRig (pure three, no DOM) and bake every mesh's
// world-space geometry into a single-buffer glb — so we can render OUR insect through the
// same reliable Blender path as the reference statues (the WebGL/Chrome harness is
// sandbox-killed on this box). Positions + normals + indices; materials dropped (Workbench
// shades from geometry). Optional per-vertex color from each mesh's base material.
//   node scripts/export_glb.mjs <species> <out.glb> [--color]
import * as THREE from 'three';
import { writeFileSync } from 'node:fs';
import { makeSpecies } from '../src/species/presets.js';
import { InsectRig } from '../src/rig/InsectRig.js';

const species = process.argv[2] || 'honeybee';
const out = process.argv[3] || `/tmp/our_${species}.glb`;
const withColor = process.argv.includes('--color');

const rig = new InsectRig(makeSpecies(species));
rig.updateMatrixWorld(true);

const P = [], N = [], C = [], I = [];
const v = new THREE.Vector3(), nm = new THREE.Vector3();
const nMat = new THREE.Matrix3();
let base = 0;
// Bake one mesh instance: world = o.matrixWorld * (optional per-instance matrix).
function bake(o, world) {
  const g = o.geometry, pos = g.attributes.position, nrm = g.attributes.normal;
  nMat.getNormalMatrix(world);
  const col = new THREE.Color(1, 1, 1);
  if (withColor && o.material?.color) col.copy(o.material.color);
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).applyMatrix4(world);
    P.push(v.x, v.y, v.z);
    if (nrm) { nm.fromBufferAttribute(nrm, i).applyMatrix3(nMat).normalize(); N.push(nm.x, nm.y, nm.z); }
    else N.push(0, 0, 0);
    if (withColor) C.push(col.r, col.g, col.b);
  }
  const idx = g.index ? g.index.array : null;
  const count = idx ? idx.length : pos.count;
  for (let i = 0; i < count; i++) I.push(base + (idx ? idx[i] : i));
  base += pos.count;
}
rig.traverse((o) => {
  if (!o.isMesh || !o.geometry?.attributes?.position) return;
  if (o.isInstancedMesh) {              // fuzz etc. — expand every instance
    const im = new THREE.Matrix4(), w = new THREE.Matrix4();
    for (let k = 0; k < o.count; k++) { o.getMatrixAt(k, im); w.multiplyMatrices(o.matrixWorld, im); bake(o, w); }
  } else {
    bake(o, o.matrixWorld);
  }
});
rig.dispose();

// ---- assemble glb ----
function f32(arr) { const b = Buffer.alloc(arr.length * 4); for (let i = 0; i < arr.length; i++) b.writeFloatLE(arr[i], i * 4); return b; }
function u32(arr) { const b = Buffer.alloc(arr.length * 4); for (let i = 0; i < arr.length; i++) b.writeUInt32LE(arr[i], i * 4); return b; }
const parts = [], views = [], accessors = [], attrs = {};
let boff = 0;
function addF(arr, ncomp, name, target) {
  const buf = f32(arr); parts.push(buf);
  const n = arr.length / ncomp, xs = [];
  for (let c = 0; c < ncomp; c++) { let mn = Infinity, mx = -Infinity; for (let i = 0; i < n; i++) { const val = arr[i * ncomp + c]; if (val < mn) mn = val; if (val > mx) mx = val; } xs.push([mn, mx]); }
  views.push({ buffer: 0, byteOffset: boff, byteLength: buf.length, target: target || 34962 });
  accessors.push({ bufferView: views.length - 1, componentType: 5126, count: n, type: ncomp === 3 ? 'VEC3' : 'SCALAR', min: xs.map((x) => x[0]), max: xs.map((x) => x[1]) });
  boff += buf.length; attrs[name] = accessors.length - 1;
}
addF(P, 3, 'POSITION');
addF(N, 3, 'NORMAL');
if (withColor) addF(C, 3, 'COLOR_0');
const ib = u32(I); parts.push(ib);
views.push({ buffer: 0, byteOffset: boff, byteLength: ib.length, target: 34963 });
accessors.push({ bufferView: views.length - 1, componentType: 5125, count: I.length, type: 'SCALAR' });
const idxAcc = accessors.length - 1; boff += ib.length;

const bin = Buffer.concat(parts);
const gltf = {
  asset: { version: '2.0', generator: 'export_glb.mjs' },
  buffers: [{ byteLength: bin.length }],
  bufferViews: views, accessors,
  meshes: [{ primitives: [{ attributes: attrs, indices: idxAcc }] }],
  nodes: [{ mesh: 0 }], scenes: [{ nodes: [0] }], scene: 0,
};
let jb = Buffer.from(JSON.stringify(gltf), 'utf8'); while (jb.length % 4) jb = Buffer.concat([jb, Buffer.from(' ')]);
let bb = bin; while (bb.length % 4) bb = Buffer.concat([bb, Buffer.alloc(1)]);
const header = Buffer.alloc(12); header.write('glTF', 0); header.writeUInt32LE(2, 4); header.writeUInt32LE(12 + 8 + jb.length + 8 + bb.length, 8);
const jlen = Buffer.alloc(8); jlen.writeUInt32LE(jb.length, 0); jlen.write('JSON', 4);
const blen = Buffer.alloc(8); blen.writeUInt32LE(bb.length, 0); blen.write('BIN\0', 4);
writeFileSync(out, Buffer.concat([header, jlen, jb, blen, bb]));
console.log(`EXPORTED ${out}: ${P.length / 3} verts, ${I.length / 3} tris  (species=${species}${withColor ? ', colored' : ''})`);

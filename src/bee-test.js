// bee-test overlay page — real (part-coloured) vs synthetic bee. Bundled by build.mjs.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import GUI from 'lil-gui';
import { InsectRig } from './rig/InsectRig.js';
import { makeSpecies } from './species/presets.js';

// ---- part classification + palette (shared by real + synthetic) ----
const PARTS = ['head', 'thorax', 'abdomen', 'leg', 'antenna', 'wing', 'eye', 'mouth'];
const PC = { head: 0xe6a81e, thorax: 0xe0592b, abdomen: 0x3a86ff, leg: 0x2a9d8f, antenna: 0xb14cd6, wing: 0x9aa7b0, eye: 0xd62828, mouth: 0x8a5a00 };
function partOf(name) {
  name = (name || '').toLowerCase();
  if (/abdom/.test(name)) return 'abdomen';
  if (/mandib|labrum|palp|proboscis/.test(name)) return 'mouth';
  if (/antenn/.test(name)) return 'antenna';
  if (/wing|elytr/.test(name)) return 'wing';
  if (/eye/.test(name)) return 'eye';
  if (/leg|coxa|femur|tibia|tarsus/.test(name)) return 'leg';
  if (/head/.test(name)) return 'head';
  return 'thorax'; // body_jnt / root_jnt / trunk
}

// ---- scene ----
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0d0f12);
const camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.01, 100);
camera.position.set(2.4, 1.1, 3.2);
const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true;
scene.add(new THREE.HemisphereLight(0xffffff, 0x334455, 1.0));
const key = new THREE.DirectionalLight(0xffffff, 1.8); key.position.set(3, 5, 4); scene.add(key);
const fill = new THREE.DirectionalLight(0xbfd0ff, 0.6); fill.position.set(-4, 2, -3); scene.add(fill);
scene.add(new THREE.GridHelper(6, 12, 0x223, 0x1a2028));

const TARGET = 2.0; // normalise both bodies to this length along X
const bodyExtentX = (obj, pred) => {          // X-extent of vertices passing pred(worldPart)
  const b = new THREE.Box3(); const v = new THREE.Vector3();
  obj.updateWorldMatrix(true, true);
  obj.traverse((o) => { if (o.isMesh && o.geometry?.attributes?.position) {
    const p = o.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld); b.expandByPoint(v); }
  }});
  return b;
};

// ---- REAL bee: load, segment by skin weights, colour by part ----
const realRoot = new THREE.Group(); const realPivot = new THREE.Group(); realPivot.add(realRoot); scene.add(realPivot);
const realParts = {}; // part -> [meshes] (we keep one skinned mesh but track via vertex groups isn't trivial; use a shader-free split)
let realReady = false;
new GLTFLoader().load('/scan/honeybee_art.glb', (g) => {
  let skinned = null; g.scene.traverse((o) => { if (o.isSkinnedMesh) skinned = o; });
  const geo = skinned.geometry, si = geo.attributes.skinIndex, sw = geo.attributes.skinWeight;
  const bones = skinned.skeleton.bones;
  const pos = geo.attributes.position, n = pos.count;
  const partIdx = new Uint8Array(n);            // part per vertex
  const col = new Float32Array(n * 3), c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const w = [sw.getX(i), sw.getY(i), sw.getZ(i), sw.getW(i)];
    const j = [si.getX(i), si.getY(i), si.getZ(i), si.getW(i)];
    let bj = j[0], bw = w[0]; for (let k = 1; k < 4; k++) if (w[k] > bw) { bw = w[k]; bj = j[k]; }
    const part = partOf(bones[bj]?.name); partIdx[i] = PARTS.indexOf(part);
    c.set(PC[part]); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  // Split into one mesh PER PART (bake bind pose so we don't need the skeleton) for toggling.
  skinned.updateWorldMatrix(true, true);
  const posW = []; const v = new THREE.Vector3();
  for (let i = 0; i < n; i++) { v.fromBufferAttribute(pos, i).applyMatrix4(skinned.matrixWorld); posW.push(v.x, v.y, v.z); }
  const index = geo.index ? geo.index.array : null;
  const triCount = index ? index.length / 3 : n / 3;
  const byPart = {}; PARTS.forEach((p) => (byPart[p] = { pos: [], col: [] }));
  for (let t = 0; t < triCount; t++) {
    const a = index ? index[t * 3] : t * 3, b = index ? index[t * 3 + 1] : t * 3 + 1, d = index ? index[t * 3 + 2] : t * 3 + 2;
    const part = PARTS[partIdx[a]] || 'thorax'; const bp = byPart[part];
    for (const vi of [a, b, d]) { bp.pos.push(posW[vi * 3], posW[vi * 3 + 1], posW[vi * 3 + 2]); const cc = new THREE.Color(PC[part]); bp.col.push(cc.r, cc.g, cc.b); }
  }
  for (const part of PARTS) {
    const bp = byPart[part]; if (!bp.pos.length) continue;
    const bg = new THREE.BufferGeometry();
    bg.setAttribute('position', new THREE.Float32BufferAttribute(bp.pos, 3));
    bg.setAttribute('color', new THREE.Float32BufferAttribute(bp.col, 3));
    bg.computeVertexNormals();
    const m = new THREE.Mesh(bg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, transparent: true, opacity: 1, side: THREE.DoubleSide }));
    m.userData.part = part; realParts[part] = m; realRoot.add(m);
  }
  // normalise: body (head+thorax+abdomen) X-extent → TARGET, centre body at origin
  const bb = new THREE.Box3();
  for (const p of ['head', 'thorax', 'abdomen']) if (realParts[p]) bb.expandByObject(realParts[p]);
  const s = TARGET / (bb.max.x - bb.min.x); const ctr = bb.getCenter(new THREE.Vector3());
  realRoot.scale.setScalar(s); realRoot.position.set(-ctr.x * s, -ctr.y * s, -ctr.z * s);
  realReady = true; checkReady();
});

// ---- SYNTHETIC bee: our rig ----
const synthRoot = new THREE.Group(); scene.add(synthRoot);
const rig = new InsectRig(makeSpecies('honeybee'));
rig.position.set(0, 0, 0);                       // undo the ground-lift for overlay
synthRoot.add(rig);
const synthMat = new THREE.MeshStandardMaterial({ color: 0x35e0ff, roughness: 0.5, wireframe: true, transparent: true, opacity: 0.9 });
rig.traverse((o) => { if (o.isInstancedMesh) o.visible = false; else if (o.isMesh) o.material = synthMat; }); // hide fuzz in overlay
{
  const bb = new THREE.Box3();
  bb.expandByObject(rig.bodyParts.headMesh); bb.expandByObject(rig.bodyParts.thorax); bb.expandByObject(rig.bodyParts.abGroup);
  const s = TARGET / (bb.max.x - bb.min.x); const ctr = bb.getCenter(new THREE.Vector3());
  synthRoot.scale.setScalar(s); synthRoot.position.set(-ctr.x * s, -ctr.y * s, -ctr.z * s);
}

// ---- GUI ----
const cfg = { real: true, synth: true, realOpacity: 0.85, synthWire: true, synthOpacity: 0.9,
  isolate: 'all', mode: 'overlay', realRotY: 0, realScale: 1, realY: 0, realX: 0 };
const gui = new GUI({ title: 'bee-test' });
gui.add(cfg, 'real').name('show real').onChange(apply);
gui.add(cfg, 'synth').name('show synthetic').onChange(apply);
gui.add(cfg, 'realOpacity', 0.1, 1, 0.05).name('real opacity').onChange(apply);
gui.add(cfg, 'synthWire').name('synth wireframe').onChange(apply);
gui.add(cfg, 'synthOpacity', 0.1, 1, 0.05).name('synth opacity').onChange(apply);
gui.add(cfg, 'isolate', ['all', ...PARTS]).name('isolate part').onChange(apply);
gui.add(cfg, 'mode', ['overlay', 'sidebyside']).name('layout').onChange(apply);
const fa = gui.addFolder('fine align (real)');
fa.add(cfg, 'realRotY', -0.6, 0.6, 0.01).name('rotate Y').onChange(apply);
fa.add(cfg, 'realScale', 0.7, 1.3, 0.01).name('scale').onChange(apply);
fa.add(cfg, 'realX', -1, 1, 0.02).name('shift X').onChange(apply);
fa.add(cfg, 'realY', -1, 1, 0.02).name('shift Y').onChange(apply);

function apply() {
  realPivot.visible = cfg.real; synthRoot.visible = cfg.synth;
  for (const part of PARTS) if (realParts[part]) {
    realParts[part].visible = (cfg.isolate === 'all' || cfg.isolate === part);
    realParts[part].material.opacity = cfg.realOpacity;
  }
  synthMat.wireframe = cfg.synthWire; synthMat.opacity = cfg.synthOpacity;
  // realRoot (inside pivot) holds the normalisation; the pivot flips it to face +X like the
  // synthetic bee and carries the fine-align, rotating about the shared body centre.
  realPivot.rotation.y = Math.PI + cfg.realRotY;
  realPivot.scale.setScalar(cfg.realScale);
  const side = cfg.mode === 'sidebyside';
  realPivot.position.set(cfg.realX + (side ? 1.4 : 0), cfg.realY, 0);
  synthRoot.position.z = side ? -1.4 : 0;
}
function checkReady() { if (realReady) { apply(); window.READY = true; } }

addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
(function loop() { requestAnimationFrame(loop); controls.update(); renderer.render(scene, camera); })();

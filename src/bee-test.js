// bee-test overlay page — real (part-coloured) vs synthetic bee. Bundled by build.mjs.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import GUI from 'lil-gui';
import { InsectRig } from './rig/InsectRig.js';
import { makeSpecies } from './species/presets.js';
import { buildHull } from './rig/hull.js';

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
const grid = new THREE.GridHelper(6, 12, 0x223, 0x1a2028); scene.add(grid);

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
  // ARCHITECTURE PROOF: hang OUR procedural head on the REAL head bone's transform. The real
  // bee's rig IS the pose; we only swap the vertices. Sized to the head's extent in the bone's
  // own frame, placed at the bone's world matrix → our shape, the artist's exact placement.
  g.scene.updateMatrixWorld(true);
  const headBone = bones.find((b) => /head/i.test(b.name || ''));
  if (headBone) {
    const inv = new THREE.Matrix4().copy(headBone.matrixWorld).invert();
    const bb = new THREE.Box3(), v = new THREE.Vector3(), hp = realParts.head.geometry.attributes.position;
    for (let i = 0; i < hp.count; i++) bb.expandByPoint(v.fromBufferAttribute(hp, i).applyMatrix4(inv));
    const sz = bb.getSize(new THREE.Vector3()), ctr = bb.getCenter(new THREE.Vector3());
    const head = buildHull({ material: new THREE.MeshStandardMaterial({ color: 0x39e07a, roughness: 0.55 }),
      length: sz.x, w: sz.z * 0.5, h: sz.y * 0.5, section: { teardrop: 0.55, heart: 0.2 } });
    head.position.copy(ctr);
    swapHeadGroup = new THREE.Group(); swapHeadGroup.add(head);
    swapHeadGroup.applyMatrix4(headBone.matrixWorld); swapHeadGroup.visible = false;
    realRoot.add(swapHeadGroup);
  }
  realReady = true; checkReady();   // alignment done in checkReady (3-landmark similarity fit)
});
let swapHeadGroup = null;

// ---- SYNTHETIC bee: our rig ----
const synthRoot = new THREE.Group(); scene.add(synthRoot);
const rig = new InsectRig(makeSpecies('honeybee'));
rig.position.set(0, 0, 0);                       // undo the ground-lift for overlay
synthRoot.add(rig);
const synthMat = new THREE.MeshStandardMaterial({ color: 0x35e0ff, roughness: 0.5, wireframe: true, transparent: true, opacity: 0.9 });
rig.traverse((o) => { if (o.isInstancedMesh) o.visible = false; else if (o.isMesh) o.material = synthMat; }); // hide fuzz in overlay
{ // tag synthetic meshes by part so `isolate` filters the synthetic too
  const tag = (o, part) => o.traverse((c) => { if (c.isMesh) c.userData.synthPart = part; });
  tag(rig.bodyParts.headMesh, 'head'); (rig.eyeMeshes || []).forEach((e) => (e.userData.synthPart = 'eye'));
  tag(rig.bodyParts.thorax, 'thorax'); tag(rig.bodyParts.abGroup, 'abdomen');
  rig.legs.forEach((l) => tag(l.limb.root, 'leg')); rig.antennae.forEach((a) => tag(a.limb.root, 'antenna'));
  (rig.wings || []).forEach((w) => w.mesh && tag(w.mesh, 'wing')); }

// ---- GUI ----
const cfg = { real: true, synth: true, realOpacity: 0.85, synthWire: true, synthOpacity: 0.9,
  isolate: 'all', mode: 'overlay', synthRotY: 0, synthScale: 1, synthY: 0, synthX: 0, swapHead: false };
const gui = new GUI({ title: 'bee-test' });
gui.add(cfg, 'real').name('show real').onChange(apply);
gui.add(cfg, 'synth').name('show synthetic').onChange(apply);
gui.add(cfg, 'realOpacity', 0.1, 1, 0.05).name('real opacity').onChange(apply);
gui.add(cfg, 'synthWire').name('synth wireframe').onChange(apply);
gui.add(cfg, 'synthOpacity', 0.1, 1, 0.05).name('synth opacity').onChange(apply);
gui.add(cfg, 'isolate', ['all', ...PARTS]).name('isolate part').onChange(apply);
gui.add(cfg, 'mode', ['overlay', 'sidebyside']).name('layout').onChange(apply);
gui.add(cfg, 'swapHead').name('swap head (ours on real bone)').onChange(apply);
const fa = gui.addFolder('fine align (synthetic → real)');   // real is the fixed reference; nudge synth
fa.add(cfg, 'synthRotY', -Math.PI, Math.PI, 0.01).name('rotate Y').onChange(apply);
fa.add(cfg, 'synthScale', 0.7, 1.3, 0.01).name('scale').onChange(apply);
fa.add(cfg, 'synthX', -1, 1, 0.02).name('shift X').onChange(apply);
fa.add(cfg, 'synthY', -1, 1, 0.02).name('shift Y').onChange(apply);

// ---- alignment: keep the REAL bee in its authored pose (rotation + translation); only
// SCALE it to our units. Transform the SYNTHETIC bee to match it. ----
let realScale = 1, synthScale = 1;
const synthPos = new THREE.Vector3(), synthQuat = new THREE.Quaternion();
const realThoraxW = new THREE.Vector3(), realHeadW = new THREE.Vector3(), realFrame = new THREE.Matrix4();
const bcenter = (...objs) => { const b = new THREE.Box3(); for (const o of objs) { o.updateWorldMatrix(true, true); b.expandByObject(o); } return b.getCenter(new THREE.Vector3()); };
// frame from forward (head−thorax) + an OFF-AXIS ventral landmark (legs) to fix the roll —
// head/thorax/abdomen are collinear and leave "up" undefined (→ upside-down bees).
function frameMat(h, t, ventral) {
  const e1 = new THREE.Vector3().subVectors(h, t).normalize();          // forward
  const toV = new THREE.Vector3().subVectors(ventral, t);              // toward the legs (down)
  const up = toV.addScaledVector(e1, -toV.dot(e1)).normalize().negate(); // ventral ⟂ axis, flipped = up
  const e3 = new THREE.Vector3().crossVectors(e1, up).normalize();      // lateral
  const e2 = new THREE.Vector3().crossVectors(e3, e1).normalize();      // re-orthogonalised up
  return new THREE.Matrix4().makeBasis(e1, e2, e3);
}
function computeAlign() {
  realRoot.updateMatrixWorld(true); synthRoot.updateMatrixWorld(true);
  // authored real landmarks (realPivot still identity here) — real keeps this pose
  const rhA = bcenter(realParts.head), rtA = bcenter(realParts.thorax), raA = bcenter(realParts.abdomen);
  const rlA = realParts.leg ? bcenter(realParts.leg) : raA;
  const bodyBox = new THREE.Box3();
  for (const p of ['head', 'thorax', 'abdomen']) if (realParts[p]) bodyBox.expandByObject(realParts[p]);
  realScale = 2.5 / Math.max(bodyBox.getSize(new THREE.Vector3()).length(), 1e-6); // ONLY a uniform scale for real
  const rhW = rhA.clone().multiplyScalar(realScale), rtW = rtA.clone().multiplyScalar(realScale), rlW = rlA.clone().multiplyScalar(realScale);
  realThoraxW.copy(rtW); realHeadW.copy(rhW); realFrame.copy(frameMat(rhW, rtW, rlW));
  // synth landmarks → transform SYNTHETIC to match the (scaled, authored-pose) real bee
  const sh = bcenter(rig.bodyParts.headMesh), st = bcenter(rig.bodyParts.thorax);
  const sl = bcenter(...rig.legs.map((l) => l.limb.root));
  const R = new THREE.Matrix4().multiplyMatrices(realFrame, frameMat(sh, st, sl).transpose()); // synth frame → real frame
  synthQuat.setFromRotationMatrix(R);
  synthScale = rhW.distanceTo(rtW) / Math.max(sh.distanceTo(st), 1e-6);
  synthPos.copy(rtW).sub(st.clone().applyMatrix4(R).multiplyScalar(synthScale));
  grid.position.y = new THREE.Box3().setFromObject(realRoot).min.y * realScale - 0.02; // grid at real's feet
  lateralView();
}
function lateralView() {                          // side-on view of the real bee in its own pose
  const e3 = new THREE.Vector3().setFromMatrixColumn(realFrame, 2), e2 = new THREE.Vector3().setFromMatrixColumn(realFrame, 1);
  controls.target.copy(realThoraxW);
  camera.position.copy(realThoraxW).addScaledVector(e3, 5.0).addScaledVector(e2, 0.7);
}

function apply() {
  realPivot.visible = cfg.real; synthRoot.visible = cfg.synth;
  for (const part of PARTS) if (realParts[part]) {
    realParts[part].visible = (cfg.isolate === 'all' || cfg.isolate === part);
    realParts[part].material.opacity = cfg.realOpacity;
  }
  // swap: replace the REAL head vertices with OUR head on the real head bone (same pose)
  if (swapHeadGroup) swapHeadGroup.visible = cfg.real && cfg.swapHead && (cfg.isolate === 'all' || cfg.isolate === 'head');
  if (cfg.swapHead && realParts.head) realParts.head.visible = false;
  synthMat.wireframe = cfg.synthWire; synthMat.opacity = cfg.synthOpacity;
  rig.traverse((o) => { if (o.isInstancedMesh || !o.isMesh) return; const p = o.userData.synthPart || 'thorax';
    o.visible = (cfg.isolate === 'all' || p === cfg.isolate || (cfg.isolate === 'head' && p === 'eye')); });
  // REAL: uniform scale only — authored rotation + translation preserved (feet stay on ground)
  realPivot.matrixAutoUpdate = false; realPivot.matrix.makeScale(realScale, realScale, realScale); realPivot.matrixWorldNeedsUpdate = true;
  // SYNTHETIC: base fit onto the real bee + fine-align nudges about the real thorax
  const side = cfg.mode === 'sidebyside', C = realThoraxW;
  const M = new THREE.Matrix4()
    .multiply(new THREE.Matrix4().makeTranslation(cfg.synthX + (side ? 1.6 : 0), cfg.synthY, 0))
    .multiply(new THREE.Matrix4().makeTranslation(C.x, C.y, C.z))
    .multiply(new THREE.Matrix4().makeRotationY(cfg.synthRotY))
    .multiply(new THREE.Matrix4().makeScale(cfg.synthScale, cfg.synthScale, cfg.synthScale))
    .multiply(new THREE.Matrix4().makeTranslation(-C.x, -C.y, -C.z))
    .multiply(new THREE.Matrix4().compose(synthPos, synthQuat, new THREE.Vector3(synthScale, synthScale, synthScale)));
  synthRoot.matrixAutoUpdate = false; synthRoot.matrix.copy(M); synthRoot.matrixWorldNeedsUpdate = true;
}
function checkReady() { if (realReady) { computeAlign(); apply(); window.READY = true; } }

// headless/debug control hook (also the seam for a future per-part deviation heatmap)
window.BT = { cfg, apply, camera, controls,
  set(k, v) { cfg[k] = v; apply(); },
  lateral() { lateralView(); },
  lookHead() { const e3 = new THREE.Vector3().setFromMatrixColumn(realFrame, 2); camera.position.copy(realHeadW).addScaledVector(e3, 0.95); controls.target.copy(realHeadW); },
  front() { const e1 = new THREE.Vector3().setFromMatrixColumn(realFrame, 0), e2 = new THREE.Vector3().setFromMatrixColumn(realFrame, 1);
    camera.position.copy(realHeadW).addScaledVector(e1, 1.1).addScaledVector(e2, 0.1); controls.target.copy(realHeadW); } };
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
(function loop() { requestAnimationFrame(loop); controls.update(); renderer.render(scene, camera); })();

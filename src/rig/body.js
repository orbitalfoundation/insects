import * as THREE from 'three';
import { lerp, clamp } from '../core/math.js';

// The segmented insect body: three tagmata assembled as parts along the body axis X
// (head at +X front, abdomen at -X rear; up +Y, sides ±Z). Head and abdomen are their
// own Groups (parented to a root) so they can articulate later (head tilt, abdomen
// droop/curl). Exposes SOCKETS for the parts assembler to hang legs, antennae, wings,
// and eyes on — this is the reusable "parts + skeleton" seam.
export function buildBody(p, material) {
  const b = p.body;
  const root = new THREE.Group();

  // --- Thorax (leg-bearing box) at the origin ---
  const TL = b.thorax.len, TH = b.thorax.h, TW = b.thorax.w;
  const thorax = ellipsoid(TL * 0.5, TH * 0.5, TW * 0.5, material);
  root.add(thorax);
  // A pronotum shield hump on top-front of the thorax (beetles, bugs).
  if (b.thorax.pronotum > 0) {
    const pron = ellipsoid(TL * 0.34, TH * 0.28 * (1 + b.thorax.pronotum), TW * 0.46, material);
    pron.position.set(TL * 0.14, TH * 0.28, 0);
    root.add(pron);
  }

  // --- Head at +X, on its own group (a short neck gap) ---
  const headGroup = new THREE.Group();
  headGroup.position.set(TL * 0.5 + b.head.neck, TH * 0.04, 0);
  headGroup.rotation.z = b.head.tilt;
  const head = ellipsoid(b.head.len * 0.5, b.head.h * 0.5, b.head.w * 0.5, material);
  head.position.x = b.head.len * 0.5;
  headGroup.add(head);
  root.add(headGroup);

  // --- Abdomen at -X: a tapering, drooping chain of segment ellipsoids ---
  const abGroup = new THREE.Group();
  abGroup.position.set(-TL * 0.5, 0, 0);
  const a = b.abdomen;
  const n = Math.max(2, Math.round(a.segs));
  const step = a.len / n;
  // Banding (bee/wasp): alternate abdominal segments in a contrasting band colour.
  let bandMat = null;
  if (p.surface.bands > 0) {
    bandMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(p.surface.bandColor), roughness: material.roughness,
      metalness: material.metalness, clearcoat: material.clearcoat, sheen: material.sheen,
    });
  }
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    // taper toward the tail; a waist constriction pinches the first segment(s).
    const taper = lerp(1.0, a.taper, t);
    const waistPinch = a.waist > 0 ? lerp(1 - a.waist, 1, clamp(t / 0.35, 0, 1)) : 1;
    const rw = a.w * 0.5 * taper * waistPinch;
    const rh = a.h * 0.5 * taper * waistPinch;
    const rl = step * 0.9; // overlap so the abdomen reads as one segmented body, not beads
    const seg = ellipsoid(rl, rh, rw, (bandMat && i % 2 === 1) ? bandMat : material);
    const x = -step * (i + 0.5);
    const y = -a.droop * a.len * t * t; // droops downward toward the tail
    seg.position.set(x, y, 0);
    abGroup.add(seg);
  }
  root.add(abGroup);

  // --- Sockets ---
  // Six leg sockets: three pairs (pro/meso/meta thorax) along X, on the lower flanks.
  const legX = [TL * 0.32, TL * 0.0, -TL * 0.34];
  const legSockets = [];
  for (let pr = 0; pr < 3; pr++) {
    for (const side of [-1, 1]) {
      legSockets.push({
        pos: new THREE.Vector3(legX[pr], -TH * 0.18, side * TW * 0.42),
        side, pair: pr, // 0 fore, 1 mid, 2 hind
      });
    }
  }
  // Two antenna sockets on the head front-top.
  const antennaSockets = [];
  for (const side of [-1, 1]) {
    const s = new THREE.Vector3(b.head.len * 0.85, b.head.h * 0.32, side * b.head.w * 0.28);
    antennaSockets.push({ pos: s, side, parent: headGroup });
  }
  // Wing sockets on the dorsal meso/metathorax.
  const wingSockets = [];
  for (const side of [-1, 1]) {
    wingSockets.push({ pos: new THREE.Vector3(TL * 0.05, TH * 0.42, side * TW * 0.34), side, row: 0 });
    wingSockets.push({ pos: new THREE.Vector3(-TL * 0.22, TH * 0.4, side * TW * 0.3), side, row: 1 });
  }
  // Compound eyes on the head sides.
  const eyeSockets = [];
  for (const side of [-1, 1]) {
    eyeSockets.push({ pos: new THREE.Vector3(b.head.len * 0.62, b.head.h * 0.12, side * b.head.w * 0.42), side, parent: headGroup });
  }

  return { root, headGroup, abGroup, legSockets, antennaSockets, wingSockets, eyeSockets,
    extent: TL + b.head.len + a.len };
}

function ellipsoid(rx, ry, rz, material) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 12), material);
  m.scale.set(Math.max(rx, 0.002), Math.max(ry, 0.002), Math.max(rz, 0.002));
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

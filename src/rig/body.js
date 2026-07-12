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

  // The DORSAL ARC. A real bee/wasp is not three balls on a rod — the tagmata drape
  // along an upside-down catenary: thorax is the peak, the head tips down at the front,
  // the abdomen slopes down toward the tail. `b.arc` bends head + abdomen down off the
  // thorax peak so the whole body reads as one continuous gesture, not a bead chain.
  const arc = b.arc || 0;

  // --- Thorax (leg-bearing box) at the origin — the peak of the arc ---
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
  // Raise the pivot toward the thorax top and tip the head down at the front so its
  // crown sits just below the thorax peak — closing the front of the arc.
  headGroup.position.set(TL * 0.5 + b.head.neck, TH * 0.04 + arc * TH * 0.22, 0);
  headGroup.rotation.z = b.head.tilt - arc;
  const head = ellipsoid(b.head.len * 0.5, b.head.h * 0.5, b.head.w * 0.5, material);
  head.position.x = b.head.len * 0.5;
  headGroup.add(head);
  root.add(headGroup);
  // Neck bridge: a small connective ellipsoid spanning thorax→head so the join flows
  // rather than showing a gap between two balls.
  if (b.head.neck >= 0) {
    const neck = ellipsoid(b.head.neck * 0.5 + TL * 0.12, TH * 0.24, TW * 0.28, material);
    neck.position.set(TL * 0.5 + b.head.neck * 0.5, -TH * 0.06 + arc * TH * 0.08, 0);
    root.add(neck);
  }

  // --- Abdomen at -X: a tapering, drooping chain of segment ellipsoids ---
  const abGroup = new THREE.Group();
  // Slope the whole abdomen down off the thorax peak (the rear half of the arc), and
  // lift its root toward the thorax top so the dorsal line stays continuous.
  abGroup.position.set(-TL * 0.5, arc * TH * 0.12, 0);
  abGroup.rotation.z = arc * 0.9;
  const a = b.abdomen;
  const n = Math.max(2, Math.round(a.segs));
  const step = a.len / n;
  // One continuous swept skin (not a chain of segment ellipsoids): a smooth oval that
  // tapers to a point at the tail, drooping along the arc, with the bee/wasp banding
  // baked in as longitudinal vertex colour. This is what makes the abdomen read as one
  // cohesive mass rather than beads.
  abGroup.add(buildSweptAbdomen(a, material, p.surface));
  root.add(abGroup);
  // Waist bridge: a connective ellipsoid across the thorax→abdomen petiole so the two
  // masses join into a continuous silhouette instead of two touching balls.
  {
    const wr = a.waist > 0 ? (1 - a.waist * 0.6) : 1;
    const waist = ellipsoid(TL * 0.16 + step * 0.5, TH * 0.36 * wr, TW * 0.36 * wr, material);
    waist.position.set(-TL * 0.5 + step * 0.1, arc * TH * 0.06, 0);
    root.add(waist);
  }

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
  // Compound eyes: oval, set on the sides of the head (not the face) and up toward the
  // crown, so the head still reads as a golden oval between them.
  const eyeSockets = [];
  for (const side of [-1, 1]) {
    eyeSockets.push({ pos: new THREE.Vector3(b.head.len * 0.46, b.head.h * 0.2, side * b.head.w * 0.4), side, parent: headGroup });
  }

  return { root, headGroup, headMesh: head, abGroup, thorax, legSockets, antennaSockets, wingSockets, eyeSockets,
    extent: TL + b.head.len + a.len };
}

// The abdomen as ONE continuous surface: rings swept along a drooping centreline with a
// smooth oval radius profile (rounded at the front waist, tapering to a point at the
// tail). Banding is baked as vertex colour along the length, so bee/wasp stripes ride a
// single skin instead of being separate coloured segments.
function buildSweptAbdomen(a, material, surface) {
  const US = 32, TS = 24;
  const nSeg = Math.max(2, Math.round(a.segs));
  const baseW = a.w * 0.5, baseH = a.h * 0.5;
  const A0 = -0.14, span = 1 - A0;       // virtual front so u=0 is rounded, not pinched
  const taperExp = lerp(1.5, 0.6, clamp(a.taper, 0, 1));
  const bands = surface.bands > 0;
  const nBands = Math.max(3, Math.round(a.segs * 0.8));
  const baseCol = new THREE.Color(material.color);
  const bandCol = new THREE.Color(surface.bandColor || '#1a1208');
  const pos = [], col = [], idx = [];
  for (let iu = 0; iu <= US; iu++) {
    const u = iu / US;
    const xn = ((u - A0) / span) * 2 - 1;                 // -1..1 across the oval
    const s = Math.pow(Math.sqrt(Math.max(0, 1 - xn * xn)), taperExp);
    const waistF = a.waist > 0 ? lerp(1 - a.waist, 1, clamp(u / 0.22, 0, 1)) : 1;
    const rw = Math.max(baseW * s * waistF, 0.0015);
    const rh = Math.max(baseH * s * waistF, 0.0015);
    const cx = -a.len * u;
    const cy = -a.droop * a.len * u * u;                  // droop toward the tail
    const c = bands && (Math.floor(u * nBands) % 2 === 1) ? bandCol : baseCol;
    // Segment grooves: subtly darken toward each segment boundary so a single smooth
    // skin still reads as a segmented abdomen (a stereotypical insect trait).
    const frac = (u * nSeg) - Math.floor(u * nSeg);
    const groove = Math.min(frac, 1 - frac);
    const shade = lerp(0.68, 1.0, clamp(groove / 0.14, 0, 1));
    for (let it = 0; it <= TS; it++) {
      const th = (it / TS) * Math.PI * 2;
      pos.push(cx, cy + rh * Math.sin(th), rw * Math.cos(th));
      col.push(c.r * shade, c.g * shade, c.b * shade);
    }
  }
  for (let iu = 0; iu < US; iu++) {
    for (let it = 0; it < TS; it++) {
      const p0 = iu * (TS + 1) + it, p1 = p0 + (TS + 1);
      idx.push(p0, p1, p0 + 1, p0 + 1, p1, p1 + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  const mat = material.clone();
  mat.vertexColors = true;
  mat.color = new THREE.Color(0xffffff);   // let vertex colour drive base+bands
  const mesh = new THREE.Mesh(g, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function ellipsoid(rx, ry, rz, material) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 12), material);
  m.scale.set(Math.max(rx, 0.002), Math.max(ry, 0.002), Math.max(rz, 0.002));
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

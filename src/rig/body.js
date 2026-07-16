import * as THREE from 'three';
import { lerp, clamp } from '../core/math.js';
import { buildHull } from './hull.js';

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
  // Head as the richer lofted-hull primitive: a morphable cross-section (ellipse → teardrop →
  // cardioid/obcordate) lofted front-to-back. A bare ellipsoid can't be a bee head; this can.
  const head = buildHull({
    material, length: b.head.len, w: b.head.w * 0.5, h: b.head.h * 0.5,
    section: { teardrop: b.head.teardrop ?? 0, heart: b.head.heart ?? 0, superness: b.head.superness ?? 1 },
  });
  head.position.x = b.head.len * 0.5;
  headGroup.add(head);
  root.add(headGroup);
  // Neck bridge: a small connective ellipsoid spanning thorax→head so the join flows
  // rather than showing a gap between two balls.
  const connectors = [];
  if (b.head.neck >= 0) {
    const neck = ellipsoid(b.head.neck * 0.5 + TL * 0.12, TH * 0.24, TW * 0.28, material);
    neck.position.set(TL * 0.5 + b.head.neck * 0.5, -TH * 0.06 + arc * TH * 0.08, 0);
    root.add(neck);
    connectors.push(neck);
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
    connectors.push(waist);
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
    // Upper-rear of the head side, leaving the face (front + lower) clear — as in life.
    eyeSockets.push({ pos: new THREE.Vector3(b.head.len * 0.4, b.head.h * 0.34, side * b.head.w * 0.42), side, parent: headGroup });
  }

  return { root, headGroup, headMesh: head, abGroup, thorax, connectors, legSockets, antennaSockets, wingSockets, eyeSockets,
    extent: TL + b.head.len + a.len };
}

// The abdomen as ONE continuous surface: rings swept along a drooping centreline with a
// smooth oval radius profile (rounded at the front waist, tapering to a point at the
// tail). Banding is baked as vertex colour along the length, so bee/wasp stripes ride a
// single skin instead of being separate coloured segments.
function buildSweptAbdomen(a, material, surface) {
  const US = 48, TS = 26;
  const nSeg = Math.max(2, Math.round(a.segs));
  const baseW = a.w * 0.5, baseH = a.h * 0.5;
  const taperExp = lerp(1.5, 0.6, clamp(a.taper, 0, 1));
  const eggK = 0.06;                      // ovoid asymmetry (gentle — real bee abdomen ~symmetric)
  // Profile runs the cross-section radius along an ellipse from xnFront (rounded front) to
  // xnTail. tailBlunt pulls the tail IN from the ellipse tip (xn=1, a sharp point) so the
  // abdomen ends full and rounds off on the cap — a real bee tail is blunt, not a spike.
  const xnFront = -0.78;
  const xnTail = 1 - 0.5 * clamp(a.tailBlunt || 0, 0, 1);
  const plates = a.plates != null ? a.plates : 0.07; // telescoping tergite relief
  const bands = surface.bands > 0;
  const nBands = Math.max(3, Math.round(a.segs * 0.8));
  const baseCol = new THREE.Color(material.color);
  const bandCol = new THREE.Color(surface.bandColor || '#1a1208');
  // Optional longitudinal colour grade: warm amber at the front (near the thorax),
  // easing to the base colour toward the tail — the honeybee's orange-to-dark abdomen.
  const grade = surface.abdomenGrade || 0;
  const frontCol = new THREE.Color(surface.gradeColor || surface.base);
  const gradeAt = (u) => grade > 0 ? frontCol.clone().lerp(baseCol, clamp(u * 1.25, 0, 1)) : baseCol;
  const pos = [], col = [], idx = [];
  for (let iu = 0; iu <= US; iu++) {
    const u = iu / US;
    const xn = xnFront + (xnTail - xnFront) * u;           // front→tail across the ovoid
    // OVOID (egg) profile — an asymmetric prolate spheroid: fuller toward the front,
    // tapering to a point at the tail. A worker bee's abdomen is an ovoid, not a
    // symmetric ellipse; this is a richer primitive than the balloon.
    const s0 = Math.sqrt(Math.max(0, 1 - xn * xn)) * (1 - eggK * xn);
    const s = Math.pow(Math.max(0, s0), taperExp);
    const waistF = a.waist > 0 ? lerp(1 - a.waist, 1, clamp(u / 0.22, 0, 1)) : 1;
    const rw0 = Math.max(baseW * s * waistF, 0.0015);
    const rh0 = Math.max(baseH * s * waistF, 0.0015);
    const cx = -a.len * u;
    const cy = -a.droop * a.len * u * u;                  // droop toward the tail
    const c = bands && (Math.floor(u * nBands) % 2 === 1) ? bandCol : gradeAt(u);
    const frac = (u * nSeg) - Math.floor(u * nSeg);
    const groove = Math.min(frac, 1 - frac);
    const shade = lerp(0.68, 1.0, clamp(groove / 0.14, 0, 1));
    // Telescoping TERGITE plates: each segment swells toward its rear edge then tucks
    // under the next (roof-tile overlap), stronger on the dorsal side (tergites) than the
    // ventral (sternites) — the surface relief a plain ellipsoid lacks.
    const pr = frac * frac * (3 - 2 * frac);              // smoothstep rise across each plate
    for (let it = 0; it <= TS; it++) {
      const th = (it / TS) * Math.PI * 2;
      const sy = Math.sin(th), sz = Math.cos(th);
      const bump = 1 + plates * pr * (0.3 + 0.7 * Math.max(0, sy)); // dorsal-biased
      pos.push(cx, cy + rh0 * sy * bump, rw0 * sz * bump);
      col.push(c.r * shade, c.g * shade, c.b * shade);
    }
  }
  // Rounded tail cap — dome the tail from its (blunt) last radius down to a point, so the
  // abdomen ends in a smooth rounded cap like a real bee, not a flat-cut cylinder.
  const sTail = Math.pow(Math.max(0, Math.sqrt(Math.max(0, 1 - xnTail * xnTail)) * (1 - eggK * xnTail)), taperExp);
  const rTailW = Math.max(baseW * sTail, 0.0015), rTailH = Math.max(baseH * sTail, 0.0015);
  const CAPN = 5, capLen = Math.max(rTailW, rTailH) * 1.15;
  const capCol = gradeAt(1);
  for (let jc = 1; jc <= CAPN; jc++) {
    const ang = (jc / CAPN) * (Math.PI / 2), rr = Math.cos(ang), ext = Math.sin(ang) * capLen;
    for (let it = 0; it <= TS; it++) {
      const th = (it / TS) * Math.PI * 2;
      pos.push(-a.len - ext, -a.droop * a.len + rTailH * rr * Math.sin(th), rTailW * rr * Math.cos(th));
      col.push(capCol.r * 0.72, capCol.g * 0.72, capCol.b * 0.72);
    }
  }
  const rings = US + 1 + CAPN;
  for (let iu = 0; iu < rings - 1; iu++) {
    for (let it = 0; it < TS; it++) {
      const p0 = iu * (TS + 1) + it, p1 = p0 + (TS + 1);
      idx.push(p0, p1, p0 + 1, p0 + 1, p1, p1 + 1);
    }
  }
  // Front (waist) cap only — the tail now closes via the rounded dome above.
  const frontC = pos.length / 3;
  pos.push(0, 0, 0); col.push(baseCol.r, baseCol.g, baseCol.b);
  for (let it = 0; it < TS; it++) idx.push(frontC, it + 1, it);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  const mat = material.clone();
  mat.vertexColors = true;
  mat.color = new THREE.Color(0xffffff);   // let vertex colour drive base+bands
  mat.side = THREE.DoubleSide;              // caps/rear stay solid regardless of winding
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

// GENERAL FITNESS ANALYSIS — the "common sense" critic. Rather than hand-patching each
// absurdity (feet above head, floating parts, open shells...), encode the invariants a
// physically/anatomically sensible creature must satisfy, and score every species against
// them headlessly. A drop in score flags a whole CLASS of nonsense, not one instance.
//
// This is the INTERNAL critic (does the thing make sense on its own terms); it complements
// the EXTERNAL critic (how close is it to a real reference — silhouette/landmark match).
//
//   npm run fitness            # score every species, list violations
import * as THREE from 'three';
import { makeSpecies, SPECIES_ORDER, SPECIES_LABELS } from '../src/species/presets.js';
import { InsectRig } from '../src/rig/InsectRig.js';

const V = () => new THREE.Vector3();
const box = (o) => new THREE.Box3().setFromObject(o);
const cam = new THREE.PerspectiveCamera(40, 1, 0.1, 100); cam.position.set(2, 1, 3);

// Plausible proportion envelopes (fraction of body length unless noted). Deliberately
// wide — this catches absurdity, not inaccuracy (that's the reference critic's job).
const ENVELOPE = {
  headR: [0.04, 0.45], thoraxR: [0.1, 0.6], abdomenR: [0.2, 0.75],
  heightR: [0.05, 0.8], eyeR: [0.05, 1.1], legR: [0.2, 2.6], antR: [0.01, 1.2],
};

function analyze(id) {
  const rig = new InsectRig(makeSpecies(id));
  rig.updateMatrixWorld(true);
  const full = box(rig), size = full.getSize(V()), diag = size.length();
  const head = box(rig.bodyParts.headMesh), thorax = box(rig.bodyParts.thorax), abd = box(rig.bodyParts.abGroup);
  const feet = rig.legs.map((l) => { const p = V(); l.limb.tip.getWorldPosition(p); return { p, side: l.sock.side, pair: l.sock.pair }; });

  // Sample the gait so the invariants must hold in MOTION, not just at rest.
  const footPeak = feet.map(() => -Infinity);
  for (let k = 0; k < 20; k++) {
    rig.update(0.06, cam); rig.updateMatrixWorld(true);
    rig.legs.forEach((l, i) => { const p = V(); l.limb.tip.getWorldPosition(p); footPeak[i] = Math.max(footPeak[i], p.y); });
  }

  const C = [];
  const add = (name, ok, detail) => C.push({ name, ok, detail });

  // 1. GROUNDED — the lowest structures are the feet, near y=0; the body is lifted off it.
  const footMinY = Math.min(...feet.map((f) => f.p.y));
  const bodyMinY = Math.min(head.min.y, thorax.min.y, abd.min.y);
  add('grounded (feet lowest)', footMinY <= bodyMinY + 0.02 * diag, `feet ${footMinY.toFixed(2)} vs body ${bodyMinY.toFixed(2)}`);

  // 2. FEET PLANTED — every foot reaches near the ground (no leg left dangling / stilting).
  const restSpread = Math.max(...feet.map((f) => f.p.y)) - footMinY;
  add('feet planted (all reach ground)', restSpread <= 0.3 * size.y, `spread ${restSpread.toFixed(2)} / ${(0.3 * size.y).toFixed(2)}`);

  // 3. APPENDAGES BELOW BODY — no foot swings above the top of the head, ever (incl. gait).
  add('feet stay below head', Math.max(...footPeak) <= head.max.y + 0.02 * diag, `peak ${Math.max(...footPeak).toFixed(2)} vs headTop ${head.max.y.toFixed(2)}`);

  // 4. BILATERAL SYMMETRY — left/right foot pairs mirror (y,x equal; z opposite). A mirror
  //    bug, a one-sided collapse, or an asymmetric pose all trip this.
  let asym = 0, pairs = 0;
  for (const pr of [0, 1, 2]) {
    const L = feet.find((f) => f.pair === pr && f.side < 0), R = feet.find((f) => f.pair === pr && f.side > 0);
    if (L && R) { asym += Math.abs(L.p.y - R.p.y) + Math.abs(L.p.x - R.p.x) + Math.abs(L.p.z + R.p.z); pairs++; }
  }
  add('bilateral symmetry', asym <= 0.12 * diag, `asym ${asym.toFixed(2)} / ${(0.12 * diag).toFixed(2)}`);

  // 5. STABLE — centre of mass sits horizontally within the foot support footprint, else it
  //    would topple. (Support = bbox of planted feet; a loose but effective proxy.)
  const vol = (b) => { const s = b.getSize(V()); return Math.max(s.x * s.y * s.z, 1e-6); };
  const com = V(); let w = 0;
  for (const b of [head, thorax, abd]) { const wi = vol(b); com.addScaledVector(b.getCenter(V()), wi); w += wi; }
  com.multiplyScalar(1 / w);
  const fx = feet.map((f) => f.p.x), fz = feet.map((f) => f.p.z);
  const inHull = com.x >= Math.min(...fx) - 0.05 * size.x && com.x <= Math.max(...fx) + 0.05 * size.x &&
                 com.z >= Math.min(...fz) - 0.05 * size.z && com.z <= Math.max(...fz) + 0.05 * size.z;
  add('stable (CoM over feet)', inHull, `com x${com.x.toFixed(2)} z${com.z.toFixed(2)}`);

  // 6. CONNECTED — the three tagmata touch, counting the neck/waist bridge connectors
  //    (no floating head / detached abdomen).
  const gapX = (a, b) => Math.max(0, a.min.x - b.max.x, b.min.x - a.max.x);
  const conn = (rig.bodyParts.connectors || []).map(box);
  const gapToBody = (part) => Math.min(gapX(part, thorax), ...conn.map((c) => gapX(part, c)));
  add('head attached', gapToBody(head) <= 0.08 * size.x, `gap ${gapToBody(head).toFixed(2)}`);
  add('abdomen attached', gapToBody(abd) <= 0.08 * size.x, `gap ${gapToBody(abd).toFixed(2)}`);

  // 7. PLAUSIBLE PROPORTIONS — every measured ratio inside a (wide) sanity envelope.
  const m = rig.measure();
  for (const [k, [lo, hi]] of Object.entries(ENVELOPE)) {
    if (m[k] == null) continue;
    add(`proportion ${k}`, m[k] >= lo && m[k] <= hi, `${m[k].toFixed(2)} in [${lo},${hi}]`);
  }

  // 8. COUNTS — a hexapod with a bilateral head.
  add('six legs', rig.legs.length === 6, `${rig.legs.length}`);
  add('two antennae', rig.antennae.length === 2, `${rig.antennae.length}`);

  rig.dispose();
  const passed = C.filter((c) => c.ok).length;
  return { id, score: Math.round((100 * passed) / C.length), checks: C };
}

let worst = 100;
for (const id of SPECIES_ORDER) {
  const r = analyze(id);
  worst = Math.min(worst, r.score);
  const fails = r.checks.filter((c) => !c.ok);
  const bar = r.score === 100 ? '✓' : '✗';
  console.log(`\n${bar} ${(SPECIES_LABELS[id] || id).padEnd(14)} fitness ${r.score}/100`);
  for (const f of fails) console.log(`    ✗ ${f.name.padEnd(28)} ${f.detail}`);
}
console.log(`\nworst species fitness: ${worst}/100`);
process.exit(worst >= 100 ? 0 : 1);

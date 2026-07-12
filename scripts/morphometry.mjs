// Morphometry harness — converge parametric-model proportions on ground truth, with
// a numeric ERROR DEVIATION. The reference ratio vectors (lateral view, normalised by
// body length) come from sourced measurements / annotated reference photos. The model
// exposes the same vector via InsectRig.measure(). Deviation = RMS % error over the
// ratios. `fit` adjusts the proportion params to minimise it (near-direct, since the
// params ARE the proportions), and reports the before/after drop.
//
// Usage:
//   node scripts/morphometry.mjs            # score every species with a reference
//   node scripts/morphometry.mjs --fit bee  # fit honeybee, print corrected params
import { makeSpecies, SPECIES_ORDER } from '../src/species/presets.js';
import { InsectRig } from '../src/rig/InsectRig.js';

// GROUND TRUTH — ratio vectors from the reference pass. Values marked (provisional)
// are placeholders until the sourced research lands; replace them with cited numbers.
// ratios: headR+thoraxR+abdomenR ≈ 1 ; heightR = body height / length ; eyeR = eye Ø /
// head length ; wingR / legR / antR = / body length.
// Sourced lateral ratios (research pass). Region splits for most non-bee species are
// image-estimates (±20%); honeybee/mantis/dragonfly are the best-measured. wingR is
// omitted for the elytra beetles (their forewings are hard cases, not a free wing).
export const REFERENCES = {
  honeybee:     { headR: 0.24, thoraxR: 0.32, abdomenR: 0.44, heightR: 0.29, eyeR: 0.75, wingR: 0.68, legR: 0.66, antR: 0.32, src: 'Apis mellifera worker — India+Saudi morphometry (measured)' },
  jewel_beetle: { headR: 0.10, thoraxR: 0.22, abdomenR: 0.65, heightR: 0.24, eyeR: 0.45, legR: 0.30, antR: 0.18, src: 'Chrysochroa — length measured, splits img-est' },
  ladybird:     { headR: 0.10, thoraxR: 0.20, abdomenR: 0.60, heightR: 0.43, eyeR: 0.30, legR: 0.45, antR: 0.18, src: 'Coccinella 7-punctata — height measured, splits img-est' },
  mantis:       { headR: 0.07, thoraxR: 0.36, abdomenR: 0.60, heightR: 0.13, eyeR: 0.45, wingR: 0.94, legR: 0.98, antR: 0.22, src: 'Mantis religiosa — Nayem 2025 measured table' },
  dragonfly:    { headR: 0.09, thoraxR: 0.18, abdomenR: 0.70, heightR: 0.14, eyeR: 0.85, wingR: 0.64, legR: 0.20, antR: 0.02, src: 'Anax imperator — Minot 2019 (wing/body measured)' },
  housefly:     { headR: 0.17, thoraxR: 0.30, abdomenR: 0.48, heightR: 0.37, eyeR: 0.80, wingR: 1.0, legR: 0.70, antR: 0.07, src: 'Musca domestica — length measured, splits img-est' },
  mosquito:     { headR: 0.10, thoraxR: 0.25, abdomenR: 0.55, heightR: 0.16, eyeR: 0.80, wingR: 0.62, legR: 1.8, antR: 0.40, src: 'Aedes/Culex — wing/leg derived, splits img-est' },
};

const KEYS = ['headR', 'thoraxR', 'abdomenR', 'heightR', 'eyeR', 'wingR', 'legR', 'antR'];
// A few ratios matter more for the silhouette; weight them up.
const WEIGHT = { headR: 1, thoraxR: 1, abdomenR: 1.3, heightR: 1.2, eyeR: 0.8, wingR: 0.7, legR: 1, antR: 0.6 };

export function measureModel(params) {
  const rig = new InsectRig(params);
  const m = rig.measure();
  rig.dispose();
  return m;
}

// RMS % deviation + per-ratio breakdown, over the ratios the reference specifies.
export function deviation(model, ref) {
  const per = {};
  let num = 0, den = 0;
  for (const k of KEYS) {
    if (ref[k] == null || model[k] == null) continue;
    const e = (model[k] - ref[k]) / ref[k]; // signed fractional error
    per[k] = { ref: ref[k], model: +model[k].toFixed(3), errPct: +(e * 100).toFixed(1) };
    const w = WEIGHT[k] ?? 1;
    num += w * e * e; den += w;
  }
  return { rms: Math.sqrt(num / den) * 100, per };
}

// Fit: iteratively scale the proportion params toward the reference ratios. Damped
// (^0.6) because the region ratios are coupled through body length; converges in a
// few passes. Returns the corrected leaves + before/after deviation.
export function fit(id, ref, iters = 10) {
  const p = makeSpecies(id);
  const before = deviation(measureModel(p), ref).rms;
  const adj = (obj, key, cur, tgt) => { obj[key] = obj[key] * Math.pow(tgt / Math.max(cur, 1e-4), 0.6); };
  for (let it = 0; it < iters; it++) {
    const m = measureModel(p);
    if (ref.headR) adj(p.body.head, 'len', m.headR, ref.headR);
    if (ref.thoraxR) adj(p.body.thorax, 'len', m.thoraxR, ref.thoraxR);
    if (ref.abdomenR) adj(p.body.abdomen, 'len', m.abdomenR, ref.abdomenR);
    if (ref.heightR) { const s = Math.pow(ref.heightR / Math.max(m.heightR, 1e-4), 0.6);
      p.body.head.h *= s; p.body.thorax.h *= s; p.body.abdomen.h *= s; }
    if (ref.eyeR) adj(p.head, 'eye', m.eyeR, ref.eyeR);
    if (ref.wingR && p.wings.type !== 'elytra') adj(p.wings, 'len', m.wingR, ref.wingR);
    if (ref.legR) { const s = Math.pow(ref.legR / Math.max(m.legR, 1e-4), 0.6);
      p.legs.femur *= s; p.legs.tibia *= s; p.legs.tarsus *= s; }
    if (ref.antR) adj(p.antennae, 'len', m.antR, ref.antR);
  }
  const after = deviation(measureModel(p), ref);
  return { params: p, before, after: after.rms, per: after.per };
}

// Fitted proportion leaves for one species (what presets merge in).
function fittedLeaves(p) {
  const b = p.body, r3 = (x) => +x.toFixed(3);
  const out = {
    body: {
      head: { len: r3(b.head.len), h: r3(b.head.h) },
      thorax: { len: r3(b.thorax.len), h: r3(b.thorax.h) },
      abdomen: { len: r3(b.abdomen.len), h: r3(b.abdomen.h) },
    },
    legs: { femur: r3(p.legs.femur), tibia: r3(p.legs.tibia), tarsus: r3(p.legs.tarsus) },
    head: { eye: r3(p.head.eye) },
    antennae: { len: r3(p.antennae.len) },
  };
  if (p.wings.type !== 'elytra' && p.wings.count > 0) out.wings = { len: r3(p.wings.len) };
  return out;
}

// --- CLI ---
if (process.argv.includes('--write')) {
  const { writeFileSync } = await import('node:fs');
  const fitted = {};
  const report = [];
  for (const id of SPECIES_ORDER) {
    const ref = REFERENCES[id];
    if (!ref) continue;
    const r = fit(id, ref);
    fitted[id] = fittedLeaves(r.params);
    report.push(`${id.padEnd(14)} ${r.before.toFixed(1)}% → ${r.after.toFixed(1)}%`);
  }
  const body = '// AUTO-GENERATED by scripts/morphometry.mjs --write. Fitted proportion\n'
    + '// leaves that converge each species onto the sourced ground-truth ratios\n'
    + '// (REFERENCES in that script). Do not hand-edit; re-run the fit instead.\n'
    + 'export default ' + JSON.stringify(fitted, null, 2) + ';\n';
  writeFileSync(new URL('../src/species/fitted.js', import.meta.url), body);
  console.log('wrote src/species/fitted.js — deviation before → after:');
  report.forEach((l) => console.log('  ' + l));
  process.exit(0);
}

const fitArg = process.argv.indexOf('--fit');
if (fitArg >= 0) {
  const id = process.argv[fitArg + 1];
  const ref = REFERENCES[id];
  if (!ref) { console.error(`no reference for "${id}"`); process.exit(1); }
  const r = fit(id, ref);
  console.log(`\n${id} — deviation ${r.before.toFixed(1)}% → ${r.after.toFixed(1)}% RMS`);
  console.table(r.per);
  const b = r.params.body;
  console.log('\ncorrected proportion params:');
  console.log('  head   ', JSON.stringify({ len: +b.head.len.toFixed(3), h: +b.head.h.toFixed(3) }));
  console.log('  thorax ', JSON.stringify({ len: +b.thorax.len.toFixed(3), h: +b.thorax.h.toFixed(3) }));
  console.log('  abdomen', JSON.stringify({ len: +b.abdomen.len.toFixed(3), h: +b.abdomen.h.toFixed(3) }));
  console.log('  legs   ', JSON.stringify({ femur: +r.params.legs.femur.toFixed(3), tibia: +r.params.legs.tibia.toFixed(3), tarsus: +r.params.legs.tarsus.toFixed(3) }));
  console.log('  head.eye', +r.params.head.eye.toFixed(3), ' antennae.len', +r.params.antennae.len.toFixed(3),
    r.params.wings.type !== 'elytra' ? '  wings.len ' + (+r.params.wings.len.toFixed(3)) : '');
} else {
  console.log('species        deviation   (worst offenders)');
  for (const id of SPECIES_ORDER) {
    const ref = REFERENCES[id];
    if (!ref) { console.log(`${id.padEnd(14)} —  (no reference yet)`); continue; }
    const dev = deviation(measureModel(makeSpecies(id)), ref);
    const worst = Object.entries(dev.per).sort((a, b) => Math.abs(b[1].errPct) - Math.abs(a[1].errPct))
      .slice(0, 3).map(([k, v]) => `${k} ${v.errPct > 0 ? '+' : ''}${v.errPct}%`).join(', ');
    console.log(`${id.padEnd(14)} ${dev.rms.toFixed(1).padStart(5)}%   ${worst}`);
  }
}

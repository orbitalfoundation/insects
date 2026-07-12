// Node-only smoke test: assemble every species and check for NaNs + non-empty geometry.
import { SPECIES_ORDER, makeSpecies } from '../src/species/presets.js';
import { InsectRig } from '../src/rig/InsectRig.js';

let fail = 0;
for (const id of SPECIES_ORDER) {
  const t0 = Date.now();
  try {
    const p = makeSpecies(id);
    const rig = new InsectRig(p);
    let meshes = 0, nan = false;
    rig.traverse((o) => {
      if (o.geometry?.attributes?.position) {
        meshes++;
        const a = o.geometry.attributes.position.array;
        for (let i = 0; i < a.length; i++) if (!Number.isFinite(a[i])) { nan = true; break; }
      }
      if (o.position && ![o.position.x, o.position.y, o.position.z].every(Number.isFinite)) nan = true;
    });
    for (let f = 0; f < 4; f++) rig.update(0.016);
    const ok = meshes > 0 && !nan && Number.isFinite(rig.span) && rig.span > 0;
    if (!ok) fail++;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${id.padEnd(14)} ${p.order.padEnd(12)} meshes=${String(meshes).padStart(3)} legs=${rig.legs.length} span=${rig.span.toFixed(2)} ${nan ? 'NaN!' : ''} ${Date.now() - t0}ms`);
  } catch (e) {
    fail++; console.log(`FAIL ${id.padEnd(14)} threw: ${e.message}`);
  }
}
console.log(`\n${fail === 0 ? 'ALL PASS' : fail + ' FAILURES'}`);
process.exit(fail === 0 ? 0 : 1);

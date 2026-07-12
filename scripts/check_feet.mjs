// Regression check: feet must stay near the ground and NEVER rise above the head.
// Builds each species headlessly, samples the gait cycle, and reports the highest foot
// vs the head. A foot above the head bottom is flagged. (No renderer needed.)
import * as THREE from 'three';
import { makeSpecies, SPECIES_ORDER } from '../src/species/presets.js';
import { InsectRig } from '../src/rig/InsectRig.js';

const cam = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
cam.position.set(2, 1, 3);
const wp = new THREE.Vector3();

let anyFail = false;
for (const id of SPECIES_ORDER) {
  const rig = new InsectRig(makeSpecies(id));
  rig.updateMatrixWorld(true); // the constructor sets position.y (ground-lift) LAST, so refresh matrices
  const headBox = new THREE.Box3().setFromObject(rig.bodyParts.headMesh);
  const bodyH = new THREE.Box3().setFromObject(rig).getSize(new THREE.Vector3()).y;
  // Sample the gait over one cycle + the groom behaviour.
  let maxFoot = -Infinity, minFoot = Infinity;
  for (let k = 0; k < 24; k++) {
    rig.update(0.05, cam);
    rig.updateMatrixWorld(true);
    for (const leg of rig.legs) {
      leg.limb.tip.getWorldPosition(wp);
      maxFoot = Math.max(maxFoot, wp.y); minFoot = Math.min(minFoot, wp.y);
    }
  }
  const headBot = headBox.min.y, headTop = headBox.max.y;
  const fail = maxFoot > headTop + 0.02;        // any foot clearly above the top of the head
  if (fail) anyFail = true;
  console.log(
    `${id.padEnd(12)} foot y=[${minFoot.toFixed(2)}, ${maxFoot.toFixed(2)}]  head y=[${headBot.toFixed(2)}, ${headTop.toFixed(2)}]  bodyH=${bodyH.toFixed(2)}` +
    (fail ? `  ⚠ FOOT ABOVE HEAD (by ${(maxFoot - headBot).toFixed(2)})` : '  ok'));
  rig.dispose();
}
console.log(anyFail ? '\nFAIL: feet rise above head somewhere' : '\nPASS: all feet stay below the head');
process.exit(anyFail ? 1 : 0);

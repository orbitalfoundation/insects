import * as THREE from 'three';

// Wings. A membrane wing is a flat teardrop with a generated venation network; an
// elytron is a curved chitin half-shell. Built in a local frame with the base at the
// origin, span along +X (out from the body), chord along Z, thin in Y — the rig then
// seats and orients each wing by posture.

// A membrane wing (dragonfly/bee/lacewing) + its veins, returned as a Group.
export function buildMembraneWing(w, membraneMat, veinMat) {
  const len = w.len, wid = w.w;
  const chordAt = (s) => wid * Math.pow(Math.sin(Math.PI * s), 0.7) * (0.6 + 0.4 * (1 - w.shape));
  const N = 28;
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  for (let i = 0; i <= N; i++) { const s = i / N; shape.lineTo(s * len, chordAt(s) * 0.62); }      // leading edge
  for (let i = N; i >= 0; i--) { const s = i / N; shape.lineTo(s * len, -chordAt(s) * 0.38); }      // trailing edge
  const geo = new THREE.ShapeGeometry(shape, 24);
  geo.rotateX(-Math.PI / 2); // lay flat: span X, chord Z
  const membrane = new THREE.Mesh(geo, membraneMat);

  const g = new THREE.Group();
  g.add(membrane);

  // Venation: costa (leading edge) + longitudinal veins fanning to the trailing edge,
  // + crossveins when dense. Dark thin lines just above the membrane.
  const pts = [];
  const nLong = 3 + Math.round(w.venation * 5);
  for (let v = 0; v <= nLong; v++) {
    const frac = v / nLong;            // 0 leading → 1 trailing
    let prev = null;
    for (let i = 0; i <= N; i++) {
      const s = i / N;
      const c = chordAt(s);
      const z = c * 0.62 - c * frac;   // interpolate leading→trailing across the chord
      const p = new THREE.Vector3(s * len, 0.004, z);
      if (prev) pts.push(prev, p);
      prev = p;
    }
  }
  if (w.venation > 0.3) {              // crossveins
    const nCross = Math.round(w.venation * 10);
    for (let c = 1; c < nCross; c++) {
      const s = c / nCross;
      const ch = chordAt(s);
      pts.push(new THREE.Vector3(s * len, 0.004, ch * 0.62), new THREE.Vector3(s * len, 0.004, -ch * 0.38));
    }
  }
  const vgeo = new THREE.BufferGeometry().setFromPoints(pts);
  g.add(new THREE.LineSegments(vgeo, veinMat));
  return g;
}

// A beetle elytron: a curved half-shell covering one side of the abdomen. Built as a
// clipped, scaled hemisphere-ish shell; the rig places a mirrored pair meeting at the
// dorsal midline.
export function buildElytron(len, wid, hgt, material) {
  // Top dome (flat-open underside) = a wing-case shell lying over the abdomen.
  const geo = new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
  geo.scale(len, hgt, wid);
  const m = new THREE.Mesh(geo, material);
  m.castShadow = true;
  return m;
}

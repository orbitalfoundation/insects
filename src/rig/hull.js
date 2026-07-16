import * as THREE from 'three';

// A RICHER PRIMITIVE — a lofted generalized cylinder. A morphable CROSS-SECTION swept along
// a (optionally bent) SPINE with a per-length SWEEP PROFILE. It subsumes sphere / cone /
// capsule / superellipsoid AND reaches teardrop and cardioid (heart / obcordate) hulls — the
// expressive base a bare ellipsoid can't touch. (Binford's generalized cylinder + Barr's
// superquadric deformations, unified and real-time.) The parameters ARE the text grammar:
//   section: { w, h, superness, teardrop, heart }   spine: { length, bend }   profile(u)
//
// section outline at angle a∈[0,2π): unit shape before (w,h) scaling. +y dorsal(up), z lateral.
function sectionPoint(a, s) {
  let y = Math.cos(a), z = Math.sin(a);                 // unit circle
  const e = s.superness ?? 1;                           // Barr e: <1 rounder-square, >1 pinched
  if (e !== 1) { y = Math.sign(y) * Math.pow(Math.abs(y), e); z = Math.sign(z) * Math.pow(Math.abs(z), e); }
  const t = s.teardrop ?? 0;                            // pinch the SIDES to a point at the bottom
  if (t) { const down = (1 - y) * 0.5; z *= 1 - t * down * down; }
  const hk = s.heart ?? 0;                              // notch the TOP centre → two lobes (cardioid)
  if (hk) { const d = Math.max(0, y) * Math.exp(-(z * z) / (s.heartWidth ?? 0.05)); y -= hk * d; }
  return [y, z];
}

// Loft the section along X (length L), scaling by profile(u) (rounded ends by default), with an
// optional downward spine bend. Returns a Mesh. capYOffset shifts the section's vertical centre.
export function buildHull(o) {
  const US = o.segsU ?? 26, TS = o.segsT ?? 30;
  const L = o.length, hw = o.w, hh = o.h, sec = o.section || {}, bend = o.bend ?? 0;
  const profile = o.profile || ((u) => Math.sqrt(Math.max(0, 1 - (2 * u - 1) ** 2))); // hemispherical caps
  const pos = [], idx = [];
  for (let iu = 0; iu <= US; iu++) {
    const u = iu / US, dp = profile(u);
    const x = (u - 0.5) * L;
    const by = bend ? -(1 - Math.cos((u - 0.5) * bend)) * L * 0.6 : 0;   // spine arc in XY
    for (let it = 0; it <= TS; it++) {
      const a = (it / TS) * Math.PI * 2;
      const [sy, sz] = sectionPoint(a, sec);
      pos.push(x, by + sy * hh * dp, sz * hw * dp);
    }
  }
  for (let iu = 0; iu < US; iu++) for (let it = 0; it < TS; it++) {
    const p0 = iu * (TS + 1) + it, p1 = p0 + (TS + 1);
    idx.push(p0, p1, p0 + 1, p0 + 1, p1, p1 + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, o.material); m.castShadow = true; m.receiveShadow = true;
  return m;
}

import * as THREE from 'three';

// Insect cuticle. The hero is STRUCTURAL COLOUR (jewel beetle, Morpho, jewel bug):
// three.js MeshPhysicalMaterial has real thin-film `iridescence`, so we drive it
// directly for angle-dependent metallic sheen over a dark base — physically what
// makes those colours. The `finish` switch spans the surface-finish spectrum from
// the research: matte pigment → gloss chitin → iridescent → metallic → fuzzy pile.
export function makeChitinMaterial(surface) {
  const f = surface.finish;
  const base = new THREE.Color(surface.base);
  const mat = new THREE.MeshPhysicalMaterial({
    color: base,
    roughness: f === 'matte' ? 0.72 : f === 'fuzzy' ? 0.9 : f === 'metallic' ? 0.22 : 0.32,
    metalness: f === 'metallic' ? 0.85 : 0.05,
    clearcoat: (f === 'gloss' || f === 'iridescent' || f === 'metallic') ? 0.65 : 0.1,
    clearcoatRoughness: 0.2,
    sheen: f === 'fuzzy' ? 1.0 : 0.25,
    sheenColor: base.clone().offsetHSL(0, -0.1, 0.2),
    sheenRoughness: 0.7,
    // Structural colour: amount from surface.irid, tuned to a metallic backing.
    iridescence: f === 'iridescent' ? Math.max(surface.irid, 0.7) : surface.irid,
    iridescenceIOR: 1.3 + surface.iridStrength * 0.5,
    iridescenceThicknessRange: [120, 120 + surface.iridHue * 600],
    side: THREE.FrontSide,
  });
  return mat;
}

// Darker cuticle for legs / antennae (usually deeper-toned than the body).
export function makeLegMaterial(surface) {
  const c = new THREE.Color(surface.base).offsetHSL(0, -0.1, -0.28);
  return new THREE.MeshPhysicalMaterial({
    color: c, roughness: 0.45, metalness: 0.1, clearcoat: 0.3, clearcoatRoughness: 0.3,
  });
}

// Compound eye — coloured (red housefly, dark beetle), glossy, faintly iridescent.
export function makeEyeMaterial(color = '#140a06') {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color), roughness: 0.25, metalness: 0.2, clearcoat: 1.0, clearcoatRoughness: 0.1,
    iridescence: 0.4, iridescenceIOR: 1.4, iridescenceThicknessRange: [200, 700],
  });
}

// Wing membrane — translucent, faintly iridescent, veined (veins drawn separately).
export function makeWingMaterial(wings) {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(wings.color), transparent: true, opacity: wings.alpha,
    roughness: 0.15, metalness: 0.0, transmission: 0.6, thickness: 0.1,
    clearcoat: 0.5, iridescence: wings.irid, iridescenceIOR: 1.3,
    side: THREE.DoubleSide, depthWrite: false,
  });
}

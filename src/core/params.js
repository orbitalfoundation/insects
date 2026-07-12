// THE parameter space for a parametric insect.
//
// Unlike the earlier single-hull creatures, an insect is a PARTS + SKELETON assembly:
// a segmented body (head + thorax + abdomen) carrying articulated appendages (six
// jointed legs, wings, antennae), all posed by a joint hierarchy. Every real insect
// is a point in the tree below; presets.js overrides the distinctive leaves.
//
// Axes (from the morphology research): body proportions (the abdomen is the biggest
// silhouette lever) × leg type × wing type/venation × antenna type × colour/finish
// (structural iridescence is the hero) × size (log). See devlog.

import { clone, lerpTree } from './math.js';

export function defaults() {
  return {
    id: 'generic', displayName: 'Generic beetle', order: 'Coleoptera',
    scale: 1.0, // log-ish size handle; camera frames by extent

    body: {
      // Head (ellipsoid at the front, +X).
      head: { len: 0.34, w: 0.42, h: 0.34, neck: 0.12, tilt: -0.1 },
      // Thorax — the leg-bearing box (three fused segments modelled as one lobe).
      thorax: { len: 0.55, w: 0.5, h: 0.44, pronotum: 0.3 },
      // Abdomen — segmented, tapering; `waist` constricts the front (wasp petiole).
      abdomen: { len: 0.95, w: 0.5, h: 0.46, segs: 7, taper: 0.7, waist: 0.0, droop: 0.1, tailBlunt: 0.0 },
    },

    legs: {
      type: 'cursorial', // cursorial | saltatorial | raptorial | fossorial | natatorial
      femur: 0.4, tibia: 0.42, tarsus: 0.24, thick: 0.03,
      spread: 0.5, // how far the legs splay out to the sides
      hind: 1.0, fore: 1.0, // per-pair size multipliers (saltatorial hind / raptorial fore)
      claw: 0.03,
    },

    antennae: {
      type: 'filiform', // filiform | clavate | lamellate | plumose | geniculate | setaceous
      len: 0.7, segs: 11, thick: 0.012, spread: 0.4, elbow: 0.0,
    },

    head: {
      eye: 0.16, // compound-eye radius (fraction of head); huge in dragonflies
      eyeColor: '#140a06',
      horn: 0.0, // beetle horn length (male dimorphism)
      mouth: 'chewing', // chewing | siphoning | sponging | piercing
      proboscis: 0.0, // length of a projecting proboscis (mosquito/butterfly), 0 = none
    },

    wings: {
      count: 2, // 0 | 2 | 4
      type: 'membranous', // membranous | elytra | scaled | tegmina | halteres
      len: 1.1, w: 0.5, shape: 0.5, venation: 0.5,
      spread: 0.5, posture: 'roof', // flat | roof | out | up | folded
      color: '#c8d0e0', alpha: 0.35, irid: 0.2,
    },

    surface: {
      base: '#2a6a3a',
      finish: 'gloss', // matte | gloss | iridescent | metallic | fuzzy
      irid: 0.0, iridStrength: 0.6, iridHue: 0.35, // structural colour: amount, angle-dependence, hue
      spots: 0.0, spotColor: '#101010', spotScale: 6,
      bands: 0.0, bandColor: '#f0c000',
      fuzz: 0.0, fuzzColor: '', // setae pile (bees); fuzzColor '' = derive from base
      abdomenGrade: 0.0, gradeColor: '', // longitudinal amber→base grade on the abdomen
    },

    motion: { gait: 0.6, gaitFreq: 2.4, groom: 0.0, look: 1, wingbeat: 0.0, sway: 0.012 },
  };
}

export function morphParams(a, b, t) {
  if (t <= 0) return clone(a);
  if (t >= 1) return clone(b);
  const m = lerpTree(a, b, t);
  // Categorical leaves snap at the halfway point.
  m.order = t < 0.5 ? a.order : b.order;
  m.id = t < 0.5 ? a.id : b.id;
  m.legs.type = t < 0.5 ? a.legs.type : b.legs.type;
  m.antennae.type = t < 0.5 ? a.antennae.type : b.antennae.type;
  m.wings.type = t < 0.5 ? a.wings.type : b.wings.type;
  m.wings.posture = t < 0.5 ? a.wings.posture : b.wings.posture;
  m.surface.finish = t < 0.5 ? a.surface.finish : b.surface.finish;
  m.displayName = t < 0.5 ? `${a.displayName} →` : `→ ${b.displayName}`;
  return m;
}

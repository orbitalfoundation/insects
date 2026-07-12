// Real specimens as points in the parameter space. Starter set spanning orders +
// leg/wing/antenna/colour axes; expands to the full ~16–20 from the research table.

import { defaults } from '../core/params.js';
import { clone } from '../core/math.js';

function merge(base, over) {
  for (const k in over) {
    const ov = over[k];
    if (ov && typeof ov === 'object' && !Array.isArray(ov) && base[k] && typeof base[k] === 'object') merge(base[k], ov);
    else base[k] = clone(ov);
  }
  return base;
}

const OVERRIDES = {
  jewel_beetle: {
    displayName: 'Jewel beetle', order: 'Coleoptera', scale: 1.0,
    body: { head: { len: 0.3, w: 0.4, h: 0.3 }, thorax: { len: 0.55, w: 0.52, h: 0.4, pronotum: 0.4 },
      abdomen: { len: 1.0, w: 0.54, h: 0.5, segs: 6, taper: 0.5 } },
    legs: { type: 'cursorial', femur: 0.3, tibia: 0.32, tarsus: 0.16, thick: 0.05 },
    antennae: { type: 'serrate', len: 0.4, segs: 8, thick: 0.025 },
    head: { eye: 0.22 },
    surface: { base: '#0f7a3a', finish: 'iridescent', irid: 0.9, iridStrength: 0.8, iridHue: 0.4 },
    wings: { type: 'elytra' },
  },
  ladybird: {
    displayName: 'Seven-spot ladybird', order: 'Coleoptera', scale: 0.7,
    body: { head: { len: 0.22, w: 0.34, h: 0.24 }, thorax: { len: 0.34, w: 0.5, h: 0.34, pronotum: 0.5 },
      abdomen: { len: 0.62, w: 0.66, h: 0.62, segs: 4, taper: 0.85 } },
    legs: { type: 'cursorial', femur: 0.2, tibia: 0.2, tarsus: 0.12, thick: 0.04, spread: 0.35 },
    antennae: { type: 'clavate', len: 0.22, segs: 6, thick: 0.02 },
    head: { eye: 0.2 },
    surface: { base: '#d81818', finish: 'gloss', spots: 0.8, spotColor: '#0a0a0a', spotScale: 3 },
    wings: { type: 'elytra' },
  },
  mantis: {
    displayName: 'Praying mantis', order: 'Mantodea', scale: 1.3,
    body: { head: { len: 0.3, w: 0.44, h: 0.28, tilt: 0.1 }, thorax: { len: 1.0, w: 0.3, h: 0.34, pronotum: 0.1 },
      abdomen: { len: 1.0, w: 0.42, h: 0.4, segs: 8, taper: 0.6, droop: 0.15 } },
    legs: { type: 'raptorial', femur: 0.42, tibia: 0.4, tarsus: 0.24, thick: 0.045, spread: 0.6, fore: 1.3 },
    antennae: { type: 'filiform', len: 0.7, segs: 12, thick: 0.014 },
    head: { eye: 0.28 },
    surface: { base: '#7aa23a', finish: 'matte' },
    wings: { count: 0 },
  },
  dragonfly: {
    displayName: 'Emperor dragonfly', order: 'Odonata', scale: 1.4,
    body: { head: { len: 0.32, w: 0.5, h: 0.4 }, thorax: { len: 0.5, w: 0.42, h: 0.5, pronotum: 0.2 },
      abdomen: { len: 1.9, w: 0.24, h: 0.24, segs: 10, taper: 0.7, droop: 0.05 } },
    legs: { type: 'cursorial', femur: 0.22, tibia: 0.24, tarsus: 0.14, thick: 0.03, spread: 0.3 },
    antennae: { type: 'setaceous', len: 0.14, segs: 4, thick: 0.012 },
    head: { eye: 0.45 },
    surface: { base: '#2a70c0', finish: 'gloss' },
    wings: { count: 4, type: 'membranous', posture: 'out', len: 1.9, w: 0.4, venation: 0.9, alpha: 0.22, color: '#dfe8f0' },
  },
  honeybee: {
    displayName: 'Honeybee', order: 'Hymenoptera', scale: 0.9,
    body: { head: { len: 0.3, w: 0.4, h: 0.34 }, thorax: { len: 0.44, w: 0.5, h: 0.5, pronotum: 0.2 },
      abdomen: { len: 0.9, w: 0.5, h: 0.5, segs: 6, taper: 0.7, waist: 0.4, droop: 0.15 } },
    legs: { type: 'cursorial', femur: 0.24, tibia: 0.26, tarsus: 0.16, thick: 0.045, spread: 0.4 },
    antennae: { type: 'geniculate', len: 0.36, segs: 8, thick: 0.02, elbow: 1.0 },
    head: { eye: 0.26 },
    surface: { base: '#c89020', finish: 'fuzzy', bands: 0.8, bandColor: '#1a1208', fuzz: 0.8 },
    wings: { count: 4, type: 'membranous', posture: 'flat', len: 0.85, w: 0.34, venation: 0.3, alpha: 0.4, color: '#e8ecf0' },
  },
};

export const SPECIES_ORDER = ['jewel_beetle', 'ladybird', 'mantis', 'dragonfly', 'honeybee'];
export const SPECIES_LABELS = { jewel_beetle: 'Jewel beetle', ladybird: 'Ladybird', mantis: 'Mantis', dragonfly: 'Dragonfly', honeybee: 'Honeybee' };

export function makeSpecies(id) {
  const p = defaults();
  const over = OVERRIDES[id];
  if (!over) throw new Error(`unknown species: ${id}`);
  merge(p, over);
  p.id = id;
  return p;
}

export const SPECIES = OVERRIDES;

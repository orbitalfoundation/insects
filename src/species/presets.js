// Real specimens as points in the parameter space. Starter set spanning orders +
// leg/wing/antenna/colour axes; expands to the full ~16–20 from the research table.

import { defaults } from '../core/params.js';
import { clone } from '../core/math.js';
import fitted from './fitted.js'; // morphometry-fitted proportions (scripts/morphometry.mjs --write)

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
    legs: { type: 'cursorial', femur: 0.36, tibia: 0.4, tarsus: 0.22, thick: 0.028 },
    antennae: { type: 'serrate', len: 0.4, segs: 8, thick: 0.025 },
    head: { eye: 0.22 },
    surface: { base: '#0f7a3a', finish: 'iridescent', irid: 0.9, iridStrength: 0.8, iridHue: 0.4 },
    wings: { type: 'elytra' },
  },
  ladybird: {
    displayName: 'Seven-spot ladybird', order: 'Coleoptera', scale: 0.7,
    body: { head: { len: 0.22, w: 0.34, h: 0.24 }, thorax: { len: 0.34, w: 0.5, h: 0.34, pronotum: 0.5 },
      abdomen: { len: 0.62, w: 0.66, h: 0.62, segs: 4, taper: 0.85 } },
    legs: { type: 'cursorial', femur: 0.26, tibia: 0.28, tarsus: 0.16, thick: 0.026, spread: 0.35 },
    antennae: { type: 'clavate', len: 0.22, segs: 6, thick: 0.02 },
    head: { eye: 0.2 },
    surface: { base: '#d81818', finish: 'gloss', spots: 0.8, spotColor: '#0a0a0a', spotScale: 3 },
    wings: { type: 'elytra' },
  },
  mantis: {
    displayName: 'Praying mantis', order: 'Mantodea', scale: 1.3,
    body: { head: { len: 0.3, w: 0.44, h: 0.28, tilt: 0.1 }, thorax: { len: 1.0, w: 0.3, h: 0.34, pronotum: 0.1 },
      abdomen: { len: 1.0, w: 0.42, h: 0.4, segs: 8, taper: 0.6, droop: 0.15 } },
    legs: { type: 'raptorial', femur: 0.5, tibia: 0.48, tarsus: 0.3, thick: 0.03, spread: 0.55, fore: 1.35 },
    antennae: { type: 'filiform', len: 0.7, segs: 12, thick: 0.014 },
    head: { eye: 0.28 },
    surface: { base: '#7aa23a', finish: 'matte' },
    wings: { count: 2, type: 'tegmina', posture: 'flat', len: 1.9, w: 0.3, venation: 0.4, alpha: 0.5, color: '#b8c89a' },
  },
  dragonfly: {
    displayName: 'Emperor dragonfly', order: 'Odonata', scale: 1.4,
    body: { head: { len: 0.32, w: 0.5, h: 0.4 }, thorax: { len: 0.5, w: 0.42, h: 0.5, pronotum: 0.2 },
      abdomen: { len: 1.9, w: 0.24, h: 0.24, segs: 10, taper: 0.7, droop: 0.05 } },
    legs: { type: 'cursorial', femur: 0.3, tibia: 0.34, tarsus: 0.2, thick: 0.02, spread: 0.28 },
    antennae: { type: 'setaceous', len: 0.14, segs: 4, thick: 0.012 },
    head: { eye: 0.45 },
    surface: { base: '#2a70c0', finish: 'gloss' },
    wings: { count: 4, type: 'membranous', posture: 'out', len: 1.9, w: 0.4, venation: 0.9, alpha: 0.22, color: '#dfe8f0' },
  },
  honeybee: {
    displayName: 'Honeybee', order: 'Hymenoptera', scale: 0.9,
    // arc: the dorsal catenary; head.tilt tips the face down; strong taper + droop make
    // the abdomen a down-angled oval closing the rear of the arc.
    body: { arc: 0.42, head: { len: 0.3, w: 0.4, h: 0.36, tilt: -0.12 },
      thorax: { len: 0.42, w: 0.5, h: 0.54, pronotum: 0 },
      abdomen: { len: 0.92, w: 0.54, h: 0.54, segs: 7, taper: 0.62, waist: 0.5, droop: 0.2 } },
    legs: { type: 'cursorial', femur: 0.3, tibia: 0.34, tarsus: 0.2, thick: 0.028, spread: 0.4, hind: 1.3, hindThick: 1.7 },
    antennae: { type: 'geniculate', len: 0.36, segs: 8, thick: 0.02, elbow: 1.0 },
    head: { eye: 0.26 },
    surface: { base: '#c89020', finish: 'fuzzy', bands: 0.8, bandColor: '#1a1208', fuzz: 0.8 },
    wings: { count: 4, type: 'membranous', posture: 'swept', len: 0.95, w: 0.32, venation: 0.3, alpha: 0.4, color: '#e8ecf0' },
  },
  housefly: {
    displayName: 'Housefly', order: 'Diptera', scale: 0.6,
    body: { arc: 0.3, head: { len: 0.32, w: 0.44, h: 0.4, tilt: -0.1 }, thorax: { len: 0.44, w: 0.46, h: 0.44, pronotum: 0.15 },
      abdomen: { len: 0.6, w: 0.44, h: 0.44, segs: 5, taper: 0.55, droop: 0.28 } },
    legs: { type: 'cursorial', femur: 0.28, tibia: 0.32, tarsus: 0.2, thick: 0.022, spread: 0.45 },
    antennae: { type: 'setaceous', len: 0.14, segs: 3, thick: 0.014 },
    head: { eye: 0.42, eyeColor: '#9c1c14', mouth: 'sponging' },
    surface: { base: '#4c4c46', finish: 'gloss', bands: 0.4, bandColor: '#26261f' },
    wings: { count: 2, type: 'halteres', posture: 'flat', len: 0.75, w: 0.32, venation: 0.35, alpha: 0.32, color: '#e6ecf0' },
    motion: { gait: 0.5, groom: 1.0, look: 1 },
  },
  mosquito: {
    displayName: 'Mosquito', order: 'Diptera', scale: 0.7,
    body: { head: { len: 0.24, w: 0.3, h: 0.28 }, thorax: { len: 0.4, w: 0.34, h: 0.42, pronotum: 0.1 },
      abdomen: { len: 1.1, w: 0.2, h: 0.2, segs: 8, taper: 0.7, droop: 0.08 } },
    legs: { type: 'cursorial', femur: 0.5, tibia: 0.6, tarsus: 0.4, thick: 0.015, spread: 0.5 },
    antennae: { type: 'plumose', len: 0.5, segs: 10, thick: 0.012, spread: 0.3 },
    head: { eye: 0.34, eyeColor: '#20140a', mouth: 'piercing', proboscis: 0.55 },
    surface: { base: '#6a5c48', finish: 'matte', bands: 0.5, bandColor: '#3a3026' },
    wings: { count: 2, type: 'halteres', posture: 'flat', len: 1.0, w: 0.22, venation: 0.4, alpha: 0.28, color: '#d8dce0' },
    motion: { gait: 0.5, look: 1 },
  },
};

export const SPECIES_ORDER = ['jewel_beetle', 'ladybird', 'mantis', 'dragonfly', 'honeybee', 'housefly', 'mosquito'];
export const SPECIES_LABELS = { jewel_beetle: 'Jewel beetle', ladybird: 'Ladybird', mantis: 'Mantis', dragonfly: 'Dragonfly', honeybee: 'Honeybee', housefly: 'Housefly', mosquito: 'Mosquito' };

export function makeSpecies(id, applyFit = true) {
  const p = defaults();
  const over = OVERRIDES[id];
  if (!over) throw new Error(`unknown species: ${id}`);
  merge(p, over);
  // Merge the morphometry-fitted proportions on top (converged onto sourced ground
  // truth). Pass applyFit=false to measure the hand-authored preset instead.
  if (applyFit && fitted[id]) merge(p, fitted[id]);
  p.id = id;
  return p;
}

export const SPECIES = OVERRIDES;

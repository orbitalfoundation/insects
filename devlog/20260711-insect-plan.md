# Insects — project plan (research phase) — 2026-07-11

Research-only for now; not building or deploying yet. This is the sixth parametric
subject and, deliberately, **the forcing function for the parts + skeleton geometry
system** — see `../../devlog/20260711-beyond-single-hull-geometry.md`. Insects can't
be a single swept hull: they're a segmented body carrying articulated appendages.

## Why insects (and why now)

The first five visualizers maxed out "one deformable hull + decorations." Insects
demand the next tier: **an assembly of parametric parts posed by a joint hierarchy**.
Building the rig for insects gives us the reusable framework (parts, skeleton, one
jointed-limb primitive, IK, gait) that later unlocks crabs, spiders, and — with the
Raup coiling model added — shells (snail, nautilus, argonaut).

## The parametric space (pre-research sketch, to be refined by the report)

An insect = a **segmented body** + **articulated appendages**, all posed by a skeleton:

- **Body / tagmosis**: head + thorax (pro/meso/metathorax) + abdomen (N segments).
  Proportions are a huge axis: dragonfly (tiny thorax, long thin abdomen) ↔ beetle
  (compact, hard) ↔ wasp (constricted "wasp waist") ↔ stick insect (elongate everything).
- **The one reusable JOINTED-LIMB primitive** (the generalisation of the nudibranch's
  recursive appendage): a chain of tapered segments with joints. A leg (coxa →
  trochanter → femur → tibia → tarsus → claws), an antenna, a mouthpart, a coiled
  proboscis — all the same primitive at different specs (segment count, joint angles,
  taper, terminal structure). 6 legs, posed by leg-type (cursorial / saltatorial /
  raptorial / fossorial / natatorial).
- **Wings**: 0–4, on meso/metathorax, by type (membranous / elytra / hemelytra /
  tegmina / scaled / halteres) with a generated **venation network** and a pattern
  layer (the butterfly eyespot / the ladybird spots).
- **Antennae**: one primitive, styled (filiform / clavate / lamellate / plumose /
  geniculate / …).
- **Head**: compound eyes (faceted), ocelli, mouthparts by type.
- **Appearance**: the hero is **structural-colour iridescence** (jewel beetles, Morpho
  blue) — thin-film cuticle — plus pigment, patterns (spots/eyespots/bands, aposematic
  black-yellow, camouflage), chitin gloss, and fuzzy setae (bees). Reuse the fish/nudi
  reaction-diffusion + the thin-film iridescence we keep wanting to build properly.
- **Motion**: the hexapod **alternating tripod gait** (IK-driven), wingbeat flap (freq
  by group), jump.

## Rendering hooks

Structural iridescence (the single biggest beauty lever), faceted compound eyes,
translucent veined wings, waxy chitin specular, velvety setae. A lit macro presentation
(like the nudibranch reef but drier — a leaf/twig substrate) rather than a void.

## Spanning set target (~16–20)

Breadth across orders: a jewel beetle + stag/rhino beetle + ladybird + weevil + longhorn
(Coleoptera); Morpho + monarch + luna/atlas moth (Lepidoptera); dragonfly + damselfly
(Odonata); honeybee + bumblebee + wasp + ant (Hymenoptera); housefly + mosquito (Diptera);
grasshopper + katydid (Orthoptera); mantis (Mantodea); stick/leaf insect (Phasmatodea);
cicada / shield bug (Hemiptera); firefly; lacewing. The exact table comes from the
research pass (saved alongside this file).

## Status

- [x] Folder created, plan logged.
- [x] ✅ Morphology research — see `20260711-insect-morphology-research.md` (sourced;
      27-species preset table across all major orders; structural-iridescence heroes;
      tripod gait + wingbeat Hz; the parts/skeleton implications).
- [ ] (later) Build the parts/skeleton framework — the real reason this subject was chosen.

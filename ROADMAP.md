# Roadmap

The first **parts + skeleton** rig — the framework crabs/spiders/shells will reuse.

Legend: ⭐ next · 🟢 cheap · 🟡 medium · 🔴 large

## Phase 1 — Motion: the tripod gait ⭐ 🟡
- [ ] **Alternating tripod walk** via per-leg IK: two leg-groups 180° out of phase,
      duty factor ≈ 0.5, feet plant on the substrate (2-bone femur+tibia IK to a
      stepping target). The legs are currently a static stance.
- [ ] **Wingbeat flap** (freq by group: butterfly ~10 Hz … bee ~230 Hz) + a hover pose.
- [ ] Antennal/head micro-motion; grasshopper/mantis idle.

## Phase 2 — More species & refinement 🟡
- [ ] The full ~16–20 from the research table (stag/Hercules beetle horns, Morpho,
      monarch, luna/atlas moth, wasp, ant, housefly, mosquito, locust, katydid, stick/
      leaf insect, cicada, jewel bug, firefly, lacewing).
- [ ] Refine leg stances per type (raptorial mantis foreleg raised+folded; saltatorial
      cocked hind leg; the pose is roughly right but reads generic).
- [ ] Better ladybird spot placement; smoother body/part joins.
- [ ] **Male dimorphism**: beetle horns/antlers (a whole part), plumose vs filiform.

## Phase 3 — Appearance depth 🟡
- [ ] **Wing pattern layer**: butterfly eyespots (radial morphogen-gradient shader —
      the cleanest procedural pattern from the research), veins as texture, scaled look.
- [ ] **Structural-colour polish**: angle-dependence-strength control (jewel beetle
      hue-shifts, diamond weevil stays put, tiger beetle matte); circular-polarization
      chrome for Chrysina; Morpho blue.
- [ ] Fuzzy setae pile (bees) as shell fuzz or fins; faceted compound eyes.
- [ ] General colour/pattern in-shader (spots/bands/mimicry) as an alternative to the
      geometry-based patterns.

## Phase 4 — Framework generalisation 🔴
- [ ] Extract the **parts + skeleton** core (part builders, joint hierarchy, the
      jointed-limb primitive, socket system) so **shells** (Raup coil + soft body),
      crabs, and spiders can reuse it. This is the long-term unification seam.

## Phase 5 — Deploy 🟢
- [x] ✅ Content-hashed build (cache fix from day one).
- [ ] exe.dev VM `insect` + autodeploy, once the gait + more species make it live-worthy.

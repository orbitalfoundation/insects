# Parametric Insect Visualizer — Sourced Morphology Reference

*Research pass, 2026-07-11. Six parallel web-research agents (body/legs; wings/locomotion;
antennae/head/eyes; colour/pattern; beetle+Lepidoptera presets; other-order presets),
synthesized. Sources inline; disagreements flagged **[UNCERTAIN]** / **[SOURCES VARY]**.
Structural-iridescence "hero" cases flagged — they're the visual payoff.*

---

## 1. Body Plan / Tagmosis

**Three tagmata:** **head** (sensing/feeding), **thorax** (locomotion), **abdomen**
(digestion/respiration/reproduction). ([Insect morphology – Wikipedia](https://en.wikipedia.org/wiki/Insect_morphology))

**Thorax = 3 segments, one leg pair each:** **prothorax** (first legs; pronotum plate;
**no wings**), **mesothorax** (second legs; **forewings**), **metathorax** (third legs;
**hindwings**) → 3×1 = **6 legs**. ([NCSU General Entomology](https://genent.cals.ncsu.edu/bug-bytes/thorax/legs/))

**Abdomen:** ground-plan **11 segments**, but modern insects reduce to **~10 or fewer
visible**; terminal segments → genitalia/cerci; generally **less sclerotized** than
head/thorax. **[SOURCES VARY: 11–12.]**

**Sclerites (the modelling primitive):** each segment = **tergum→tergites** (dorsal),
**sternum→sternites** (ventral), **pleura→pleurites** (lateral). Abdomen pleura often
membranous; thorax pleura sclerotized.

**Exoskeleton:** epicuticle (waxy waterproof, no chitin) → procuticle (chitin+protein;
only the **exocuticle** hardens via sclerotization) → epidermis. Rigid **sclerites**
separated by flexible unsclerotized **membranes = the joints**. ([UQ Insect Science](https://uq.pressbooks.pub/insect-science/chapter/insect-cuticle/))

**Proportions across orders (biggest silhouette axis = the abdomen):** Odonata = long
slender abdomen; Coleoptera = compact/boxy; Hymenoptera Apocrita = **"wasp waist"**
(1st abdominal tergite fuses to thorax as **propodeum**; thorax+propodeum = **mesosoma**;
rest = **metasoma** via constricted **petiole**; sawflies lack the waist); Phasmatodea =
extreme elongation. **[UNCERTAIN] No universal head:thorax:abdomen ratios — encode
qualitatively per order.** ([Petiole](https://en.wikipedia.org/wiki/Petiole_(insect_anatomy)))

---

## 2. Legs (six segments, proximal→distal; a chain of hinge joints)

| # | Segment | Notes |
|---|---------|-------|
| 1 | **Coxa** | Base; articulates with thorax (main swing joint). |
| 2 | **Trochanter** | Small; usually fused to femur (Odonata have two). |
| 3 | **Femur** | Largest/strongest in most insects. |
| 4 | **Tibia** | ≥ femur, slender. Femur–tibia = the **"knee" hinge**. |
| 5 | **Tarsus** | **Tarsomeres, usually 5** (range 2–5; some say 3–7). |
| 6 | **Pretarsus** | Claws (**ungues**) + pads (**arolium** median, **pulvilli** paired — big in flies, **empodium**). |

**Leg types (which pair is modified):** **cursorial** (run — default, all legs) ·
**saltatorial** (jump — huge hind **femur**; grasshopper/flea) · **raptorial** (grasp —
spined fore femur+tibia jackknife; mantis) · **fossorial** (dig — broad toothed fore
tibia; mole cricket) · **natatorial** (swim — flattened hind, setal fringe; diving beetle)
· **adhesive** (enlarged pulvilli/arolium; housefly) · (bee **corbiculate** pollen-basket
hind tibia). **[SPARSE] Segment ratios only qualitative: femur largest, tibia ≥ femur.**
([Arthropod leg](https://en.wikipedia.org/wiki/Arthropod_leg))

---

## 3. Wings (forewings on mesothorax, hindwings on metathorax)

**Types:** **membranous** (Odonata/Hymenoptera/Neuroptera — default flight) · **elytra**
(Coleoptera — fully sclerotized forewings, venation lost, meet in a straight midline
suture, cover folded hindwings) · **hemelytra** (Heteroptera — leathery corium+clavus
basally, membrane distally) · **tegmina** (Orthoptera/Blattodea/mantids — leathery
forewings) · **scaled** (Lepidoptera — overlapping scales = modified setae) · **halteres**
(Diptera — hindwings reduced to knobbed gyroscopes → **one functional pair**) ·
(Strepsiptera mirror: forewings→halteres). ([Insect wing](https://en.wikipedia.org/wiki/Insect_wing))

**Venation (Comstock–Needham), a generatable network:** ancestral **6–8 longitudinal
veins** anterior→posterior: **Costa** (leading, unbranched), **Subcosta**, **Radius**
(R1 + radial sector, up to 5 branches), **Media** (up to 4), **Cubitus** (1–3), **Anal**
(A1–A3). **Crossveins** link them; **cells** = membrane between. Odonata landmarks:
**nodus** (leading-edge notch) + pigmented **pterostigma** near tip. Density axis:
**dense/reticulate** (dragonflies, lacewings — hundreds of cells) ↔ **sparse** (flies,
tiny wasps). **[UNCERTAIN] no absolute cell counts in general refs — use crossvein
density/area as the parameter.** ([Comstock–Needham](https://en.wikipedia.org/wiki/Comstock%E2%80%93Needham_system))

**Coupling:** hamuli (hooks, Hymenoptera); frenulum–retinaculum (most moths); jugum
(primitive moths); amplexiform (overlap only, butterflies). **Folding:** beetles fold
hindwings origami-style (~5 fields) under elytra.

**Resting-wing posture (key silhouette parameter):** flat-over-abdomen (fly, beetle,
roach) · roof-like/tent (most Hemiptera, moths, lacewings, cicadas, katydids, locusts) ·
held-out horizontal (dragonfly) · vertical-together-above (butterfly, damselfly) ·
folded-longitudinally/pleated (paper wasp) · hidden-under-scutellum (jewel bug).

---

## 4. Antennae (`scape → pedicel → flagellum[flagellomeres…]`)

**scape** (only muscled segment) · **pedicel** (houses **Johnston's organ**) ·
**flagellum** (no muscle; its shape = the "type"). Flagellomere count is taxon-specific.

**Types:** **filiform** (thread — beetles, roaches, grasshoppers) · **setaceous** (bristle,
tapering — Odonata vestigial, cicadas) · **moniliform** (beaded — termites) · **clavate**
(gradual club — butterflies) · **capitate** (abrupt knob — many beetles) · **lamellate**
(nested plates — **scarab beetles**) · **serrate** (sawtooth — click/jewel beetles) ·
**pectinate** (comb) · **bipectinate/plumose** (feathery — **male moths**, male mosquitoes)
· **geniculate** (elbowed — **ants/bees/wasps/weevils**) · **aristate** (short 3rd segment
+ lateral **arista** — higher flies). ([AES antennae](https://www.amentsoc.org/insects/fact-files/antennae.html); [NCSU antennae](https://genent.cals.ncsu.edu/bug-bytes/head/antennae/))

---

## 5. Head, Mouthparts, Eyes

**Compound eyes = ommatidia arrays:** dragonfly **~28,000–30,000/eye** (largest;
**[SOURCES VARY]**), housefly ~4,000–6,000, honeybee ~4,000–5,000. Arrangement (good
dimorphism boolean): **dichoptic** (separated, most) vs **holoptic** (meeting on top —
many male flies). **Ocelli:** typically **3** in a triangle on the vertex (light/horizon,
not images). **Head orientation:** hypognathous (down — grasshopper) / prognathous
(forward — predators) / opisthognathous (tucked back — bugs). Distinctive heads:
triangular swiveling mantis, weevil **rostrum/snout**, broad cicada.

**Mandibulate ground plan:** labrum, paired **mandibles**, paired **maxillae** (+palps),
fused **labium** (+palps), median **hypopharynx**. **Types:** **chewing** (beetles,
grasshoppers, mantids, dragonflies) · **siphoning** (coiled galeal proboscis; Lepidoptera)
· **sponging** (fleshy labellum; houseflies) · **piercing-sucking** (stylets in a folding
rostrum; bugs, cicadas, mosquitoes) · **chewing-lapping** (mandibles + glossa tongue; bees).
([NCSU mouthparts](https://genent.cals.ncsu.edu/bug-bytes/mouthparts/))

---

## 6. Colour & Pattern (the beauty axis)

Split **pigmentary** (matte, angle-independent, absorptive) from **structural**
(angle-dependent iridescence from nanostructure). **Structural colour is the HERO**
(jewel beetles, scarabs, weevils, Morpho, jewel bugs) and almost always sits **over a
dark melanin backing** that saturates it. ([Structural coloration](https://en.wikipedia.org/wiki/Structural_coloration); ["Gold bugs" Seago 2009](https://pmc.ncbi.nlm.nih.gov/articles/PMC2586663/))

**Pigments (matte):** **melanins** (black→brown; the dark backing; deep matte) ·
**carotenoids** (yellow/orange/red; **diet-derived** — ladybird red) · **pterins**
(white/yellow/orange/red; pierid butterflies; unusually **bright** matte) · **ommochromes**
(eyes/some wings) · **papiliochromes** (swallowtails) · **tetrapyrroles** (some greens).

**Structural (heroes):**
- **Beetle multilayer reflectors** (most common): jewel beetle *Chrysochroa fulgidissima*
  ~16 layers green / ~12 red; brilliant metallic that **blue-shifts with angle**. Tiger
  beetles mix thicknesses → deliberately **matte** structural for camouflage.
- **Scarab circular polarization** (*Chrysina*): helicoidal chiral cuticle; chrome
  gold/silver + faint iridescence.
- **Weevil 3D photonic crystals** (*Entimus imperialis*): diamond-lattice gem spots that
  **keep hue across angle** (opposite of jewel-beetle mirror iridescence).
- **Morpho blue** — structural, **no blue pigment**: ridge "Christmas-tree" lamellae
  (~50 nm tall, ~80 nm spaced, ridge pitch 1.3–1.4 µm, tuned ~480 nm); melanin backing.
- **Odonata:** wing thin-film iridescence; **pruinescence** (waxy pale-blue bloom on
  mature males).

**Patterns:** **ladybird spots** (*C. septempunctata* = 7 black spots — count/size/place
grid) · **butterfly eyespots** = concentric rings from a **diffusing morphogen gradient
from central focus cells** (reaction-diffusion-like; **maps to a radial-distance→colour-
band shader** — the cleanest procedural pattern here) · **aposematism** (black-yellow;
>73% of Hymenoptera; monarch orange/black) · **camouflage/masquerade** (leaf/stick
insects) · **mimicry** (Batesian hoverfly→wasp; Müllerian Heliconius).

**Surface-finish spectrum (give the shader an "angle-dependence strength" param):** matte
pigment → **fuzzy plumose pile** (bumblebee "fur", kills specular) → iridescent multilayer
→ chrome-metallic → angle-independent photonic (diamond weevil) → waxy pruinose bloom.

---

## 7. Locomotion (for animation)

**Alternating tripod gait:** six legs = **two tripods ~180° out of phase**. A tripod =
**front + hind of one side + middle of the opposite side**; the grounded three form a
support triangle so it's **statically stable mid-stride**. **Duty factor β ≈ 0.5** for the
canonical walk (β>0.5 walk / β<0.5 run). For an IK rig: two leg-groups, β≈0.5–0.6, phase
offset 0.5. ([PMC5321742](https://pmc.ncbi.nlm.nih.gov/articles/PMC5321742/))

**Wingbeat (Hz):** butterfly ~10–12 · damselfly ~16 · **dragonfly ~25–40** (~30 common) ·
locust ~20 · hawkmoth ~85 · **bumblebee ~130** (buzz-pollination 200–400) · **housefly
~200 ✓** · **honeybee ~230 ✓** · **mosquito ♀ ~350–500, ♂ ~600–800** · midge ~1000.
**Muscle:** **synchronous** (≤~100–200 Hz; Odonata direct/independent, Orthoptera) vs
**asynchronous/fibrillar** (indirect, resonant thorax; flies/bees/beetles; >1000 Hz).
**[FLAG] only honeybee & housefly directly confirmed; others inferred.** ([Insect flight](https://en.wikipedia.org/wiki/Insect_flight))

**Jumping (catapult: slow muscle loads a resilin spring, latch releases):** locust hind-
femur bends **semi-lunar processes**, take-off ~0.025–0.030 s, ~3–4 m/s · flea >3,000 m/s²
· froghopper (best) ~5,400 m/s², ~4.7 m/s, ~550 g.

---

## 8. Specimen preset table (27 iconic species, spanning all major orders)

Flags: **[IRID]** structural-iridescent · **[APO]** aposematic · **[CAMO]** camouflage ·
**[GLOW]** bioluminescent. Sizes = body length unless "ws" (wingspan). Trim to any ~16–20
flagship subset; flags let a subset still span pigment/structure/camouflage + every order.

| # | Species | Order / Family | Size | Body | Leg | Wing | Antenna | Mouth | Defining feature | Colour |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Jewel beetle *Chrysochroa* | Coleoptera/Buprestidae | ~40 mm | elongate bullet | cursorial | elytra | serrate | chewing | whole-body metallic | **[IRID HERO]** multilayer green/gold/blue |
| 2 | Stag beetle *Lucanus cervus* | Coleoptera/Lucanidae | ♂25–92 ♀27–50 | huge jaws | cursorial | elytra+flight | geniculate lamellate | chewing (weapon jaws) | antler ♂ mandibles | black/chestnut; strong ♂ dimorphism |
| 3 | Hercules beetle *Dynastes hercules* | Coleoptera/Scarabaeidae | ♂→173 w/horn | bulky scarab+horns | cursorial | elytra+flight | lamellate | chewing | thoracic+head horns | humidity-shift elytra; ♂ horns |
| 4 | Seven-spot ladybird *Coccinella septempunctata* | Coleoptera/Coccinellidae | 5–9 mm | domed hemisphere | cursorial | rounded elytra | short clavate | chewing | 7 black spots | **[APO]** carotenoid red + black |
| 5 | Diamond weevil *Entimus imperialis* | Coleoptera/Curculionidae | 16–30 mm | ovoid + rostrum | cursorial | pitted elytra | geniculate clubbed | chewing (snout) | green gem pits | **[IRID]** 3D photonic (angle-stable) |
| 6 | Longhorn beetle | Coleoptera/Cerambycidae | ~25–40 mm | elongate parallel | cursorial | elytra+flight | **filiform ≥ body** | chewing | ultra-long antennae | pigmentary (some metallic) |
| 7 | Firefly | Coleoptera/Lampyridae | 5–25 mm | soft, pronotal shield | cursorial | soft elytra+flight | filiform–pectinate | chewing | glowing abdomen | **[GLOW]** emissive; dark+red/yellow |
| 8 | Blue Morpho *Morpho* | Lepidoptera/Nymphalidae | ws 12–15 cm | small body, broad wings | brush-footed | scaled | clubbed | siphoning | flashing blue vs cryptic brown | **[IRID HERO]** ridge nanostructure |
| 9 | Monarch *Danaus plexippus* | Lepidoptera/Nymphalidae | ws 9–10 cm | slender | brush-footed | scaled | clubbed | siphoning | orange+black veins+white dots | **[APO]** pigmentary |
| 10 | Luna moth *Actias luna* | Lepidoptera/Saturniidae | ws 70–114 mm, tails 40–60 | furry, tailed | cursorial | scaled translucent | **plumose ♂** | vestigial (no feeding) | pale-green + long tails | pigmentary green |
| 11 | Atlas moth *Attacus atlas* | Lepidoptera/Saturniidae | ws 24–30 cm | large body, huge wings | cursorial | scaled + clear windows | **plumose ♂** | vestigial | falcate snake-head tips | pigmentary brown/pink |
| 12 | Emperor dragonfly *Anax imperator* | Odonata/Aeshnidae | 73–82 mm, ws ~104 | long thin abdomen, huge eyes | cursorial/basket | membranous net | setaceous vestigial | chewing | blue abdomen + dorsal stripe | pigmentary blue; wings held flat out |
| 13 | Banded demoiselle *Calopteryx splendens* | Odonata/Calopterygidae | ~48 mm | very slender | cursorial | membranous | setaceous | chewing | dark iridescent ♂ wing band | **[IRID HERO]** metallic body; wings together above |
| 14 | Honeybee *Apis mellifera* | Hymenoptera/Apidae | worker 10–15 | waisted, hairy thorax | cursorial+corbicula | membranous hamuli | geniculate | chewing-lapping | fuzzy amber bands + pollen basket | pigmentary; ~230 Hz |
| 15 | Bumblebee *Bombus* | Hymenoptera/Apidae | worker 11–17 | round, furry | cursorial+corbicula | membranous hamuli | geniculate | chewing-lapping | thick pile | **[APO]** black-yellow **fuzzy matte** |
| 16 | Paper wasp *Polistes* | Hymenoptera/Vespidae | 13–25 mm | narrow petiole, dangling legs | cursorial gangly | membranous | geniculate | chewing | folded wings + hanging legs | **[APO]**; wings folded longitudinally |
| 17 | Carpenter ant *Camponotus* | Hymenoptera/Formicidae | worker 6–18 | head+mesosoma+gaster | cursorial | **workers wingless** | geniculate 12-seg | chewing | single petiole node | pigmentary black/red |
| 18 | Housefly *Musca domestica* | Diptera/Muscidae | 4–8 mm | compact, big eyes, striped | cursorial+pulvilli | **1 pair + halteres** | aristate | sponging | halteres + red eyes | pigmentary grey; ~200 Hz |
| 19 | Mosquito *Culex/Aedes* | Diptera/Culicidae | 4–7.5 mm | slender, long proboscis | cursorial long | **1 pair scaled + halteres** | ♂ plumose / ♀ pilose | piercing-sucking | proboscis; feathery ♂ antennae | scaled; ♀ ~400–500 Hz |
| 20 | Desert locust *Schistocerca gregaria* | Orthoptera/Acrididae | ♀5–9 ♂4.5–6 cm | enlarged hind femora | **saltatorial** | tegmina+membranous | short filiform | chewing | phase polyphenism + jump legs | **[APO/CAMO]** pink-yellow-black vs sandy; roof-like |
| 21 | Great green bush-cricket *Tettigonia viridissima* | Orthoptera/Tettigoniidae | ♂28–36 ♀32–42 | leaf-like, flat | saltatorial | leaf-like tegmina | **filiform ~3× body** | chewing | antennae > body | **[CAMO]** leaf-green; roof-like |
| 22 | Praying mantis *Mantis religiosa* | Mantodea/Mantidae | ♀7–9 ♂6–7 cm | triangular head, long prothorax | **raptorial** fore | tegmina+membranous | filiform | chewing | swiveling head + grasping forelegs | cryptic green/straw |
| 23 | Stick insect | Phasmatodea/Phasmatidae | 8–10 cm (giants→64) | extreme twig elongation | cursorial | often **wingless** | filiform | chewing | twig masquerade | **[CAMO HERO]** green/brown |
| 24 | Leaf insect *Phyllium* | Phasmatodea/Phylliidae | ♀64–100+ | flat broad "leaf" | cursorial + leaf lobes | ♀ leaf forewings | ♀ short ♂ long | chewing | living-leaf mimic | **[CAMO HERO]** leaf green/brown |
| 25 | Cicada | Hemiptera/Cicadidae | 2–5 cm (ws→20) | broad wide-eyed head | walking | membranous | short setaceous | piercing-sucking | tymbal song organs | cryptic bark; roof-like |
| 26 | Jewel bug *Chrysocoris stollii* | Hemiptera/Scutelleridae | 13–16 mm | rounded convex | walking | **hidden under scutellum** | 3–5 seg | piercing-sucking | scutellar shield covers all | **[IRID HERO]** multilayer metallic |
| 27 | Green lacewing *Chrysoperla carnea* | Neuroptera/Chrysopidae | 12–20 mm, ws 23–30 | delicate, wings>body | walking | membranous net | long filiform | chewing | lacy venation + golden eyes | green + structural "goldeneye"; roof-like |

*Per-species sources: [Buprestidae](https://en.wikipedia.org/wiki/Buprestidae), [Lucanus cervus](https://pubmed.ncbi.nlm.nih.gov/26220669/), [Hercules beetle](https://en.wikipedia.org/wiki/Hercules_beetle), [C. septempunctata](https://en.wikipedia.org/wiki/Coccinella_septempunctata), [Entimus imperialis](https://en.wikipedia.org/wiki/Entimus_imperialis), [Cerambycidae](https://en.wikipedia.org/wiki/Longhorn_beetle), [Lampyris](https://en.wikipedia.org/wiki/Lampyris_noctiluca), [Morpho](https://en.wikipedia.org/wiki/Morpho_menelaus), [Monarch](https://en.wikipedia.org/wiki/Monarch_butterfly), [Luna moth](https://en.wikipedia.org/wiki/Luna_moth), [Attacus atlas](https://en.wikipedia.org/wiki/Attacus_atlas), [Anax imperator](https://en.wikipedia.org/wiki/Emperor_dragonfly), [Calopteryx splendens](https://en.wikipedia.org/wiki/Banded_demoiselle), [Apis mellifera](https://animaldiversity.org/accounts/Apis_mellifera/), [Bombus terrestris](https://en.wikipedia.org/wiki/Bombus_terrestris), [Polistes](https://www.britannica.com/animal/paper-wasp), [Camponotus](https://www.antwiki.org/wiki/Camponotus_pennsylvanicus), [Musca domestica](https://www.dimensions.com/element/housefly-musca-domestica), [Desert locust](https://en.wikipedia.org/wiki/Desert_locust), [Tettigonia](https://en.wikipedia.org/wiki/Tettigonia_viridissima), [Mantis religiosa](https://en.wikipedia.org/wiki/Mantis_religiosa), [Phasmatodea](https://en.wikipedia.org/wiki/Phasmatodea), [Phyllium](https://en.wikipedia.org/wiki/Phyllium), [Cicada](https://en.wikipedia.org/wiki/Cicada), [Scutelleridae](https://en.wikipedia.org/wiki/Scutelleridae), [Chrysoperla carnea](https://en.wikipedia.org/wiki/Chrysoperla_carnea).*

---

## 9. Size, Posture, Sexual Dimorphism

**Size span:** ~4 mm (mosquito) → ~24–30 cm ws (Atlas moth) → ~30–64 cm total with legs
(giant stick insects; record *Phryganistria chinensis* 64 cm). **Use a logarithmic scale
parameter.**

**Sexual dimorphism (a major preset axis):** male **weaponry** (stag antler-mandibles,
Hercules/rhino horns — males only, with major/minor polymorphism); male **antennae**
broader/plumose (moths, mosquitoes, longhorns); **holoptic** male fly eyes vs dichoptic
females; females usually **larger** (locust, mantis, katydid, leaf insect); **caste**
(wingless workers vs winged reproductives); **colour** (dragonfly ♂ blue vs ♀ green).

---

## Top uncertainties
1. Abdominal segment count (11 ancestral; ~10 or fewer visible).
2. Tarsomere count (default 5; 2–5 vs 3–7).
3. No universal body-part or leg-segment ratios — qualitative per order.
4. No absolute per-wing cell counts — use crossvein-density parameter.
5. Wingbeat Hz: only honeybee (~230) & housefly (~200) directly confirmed.
6. Ommatidia counts approximate (dragonfly 28k vs 30k).
7. Sizes: Hercules 173 vs 180; Atlas largest wing *area* but *Thysania agrippina* largest
   *wingspan*.
8. Structural-colour behaviour differs (angle-shift jewel beetle vs angle-stable diamond
   weevil vs matte tiger beetle) → give the shader an **angle-dependence strength** control.

---

## Implications for the rig (my notes, not from the research)

This maps straight onto the **parts + skeleton** plan (`../../devlog/20260711-beyond-single-hull-geometry.md`):
- **Segmented body** = 3 tagmata as parametric parts (head, thorax×3 fused, abdomen×N
  tergite/sternite rings) — a good first client for the parts assembler.
- **One jointed-limb primitive** (coxa→…→pretarsus chain) drives all 6 legs + antennae +
  mouthparts + proboscis, styled by type + posed by IK. This is the recursive-appendage
  idea, articulated.
- **Wings** = a generated venation network (Comstock–Needham longitudinals + crossvein
  density) on a membrane, with a type switch (membranous/elytra/scaled/halteres) and the
  eyespot/spot/band pattern layer.
- **Structural iridescence** is the hero shader — angle-dependent multilayer over a dark
  melanin backing, with an angle-dependence-strength knob. Worth building the thin-film
  properly (we've wanted it since the fish/nudibranch iridescence fakes).
- **Motion** = alternating-tripod IK gait (β≈0.5, two groups 180° offset) + wingbeat flap.

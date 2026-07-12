import * as THREE from 'three';
import { buildBody } from './body.js';
import { buildLimb, knob } from './limb.js';
import { buildMembraneWing, buildElytron } from './wings.js';
import { makeChitinMaterial, makeLegMaterial, makeEyeMaterial, makeWingMaterial } from '../shading/InsectMaterial.js';
import { clamp } from '../core/math.js';

const Y = new THREE.Vector3(0, 1, 0);

// Orient so local +X → spanDir and local +Y ≈ approxNormal (membrane face-up).
function orient(spanDir, approxNormal, q) {
  const x = spanDir.clone().normalize();
  const z = new THREE.Vector3().crossVectors(x, approxNormal).normalize();
  const y = new THREE.Vector3().crossVectors(z, x).normalize();
  return q.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
}

// Assembles an insect from the parameter tree: segmented body + six articulated legs +
// antennae + compound eyes. (Wings + gait layer on next.) The legs and antennae are
// jointed-limb primitives parented to their sockets; posing sets the joint rotations.
export class InsectRig extends THREE.Group {
  constructor(p) {
    super();
    this.p = p;
    this.t = 0;
    this.legs = [];
    this.antennae = [];
    this.chitin = makeChitinMaterial(p.surface);
    this.legMat = makeLegMaterial(p.surface);
    this.eyeMat = makeEyeMaterial(p.head.eyeColor);

    this.bodyParts = buildBody(p, this.chitin);
    this.add(this.bodyParts.root);

    this._buildLegs();
    this._buildAntennae();
    this._buildEyes();
    this._buildProboscis();
    this._buildWings();

    // Extent for camera framing.
    this.updateMatrixWorld(true);
    this.bbox = new THREE.Box3().setFromObject(this);
    const size = this.bbox.getSize(new THREE.Vector3());
    this.span = Math.max(size.x, size.y, size.z);
    this.centre = this.bbox.getCenter(new THREE.Vector3());
    // Lift so the lowest point (feet) sits on y=0.
    this.position.y = -this.bbox.min.y;
  }

  _buildLegs() {
    const L = this.p.legs;
    for (const sock of this.bodyParts.legSockets) {
      const sc = sock.pair === 2 ? L.hind : sock.pair === 0 ? L.fore : 1.0;
      const segs = [
        { len: 0.12 * sc, r0: L.thick * 1.25, r1: L.thick * 0.95 },    // coxa (short, stout)
        { len: L.femur * sc, r0: L.thick, r1: L.thick * 0.62 },        // femur (tapers)
        { len: L.tibia * sc, r0: L.thick * 0.58, r1: L.thick * 0.34 }, // tibia (slender)
        { len: L.tarsus * sc, r0: L.thick * 0.32, r1: L.thick * 0.16 }, // tarsus (thread-thin foot)
      ];
      const limb = buildLimb(segs, this.legMat);
      limb.root.position.copy(sock.pos);
      limb.tip.add(knob(L.claw * sc, this.legMat));
      this.bodyParts.root.add(limb.root);
      const rec = { limb, sock, sc };
      this._poseLeg(rec, L);
      this.legs.push(rec);
    }
  }

  // Pose one leg into the classic insect zig-zag stance and record its rest angles +
  // its tripod group (for the walk cycle). Fore legs reach forward, hind legs back.
  _poseLeg(rec, L) {
    const { limb, sock } = rec;
    const fwd = sock.pair === 0 ? 0.45 : sock.pair === 2 ? -0.55 : 0.0;
    const dir = new THREE.Vector3(fwd, -0.35, sock.side * (0.7 + L.spread)).normalize();
    limb.root.quaternion.setFromUnitVectors(Y, dir);
    let femurLift = 0.75, knee = -2.0, ankle = 1.0;
    if (L.type === 'raptorial' && sock.pair === 0) { femurLift = 0.1; knee = -2.7; ankle = -0.7; }
    if (L.type === 'saltatorial' && sock.pair === 2) { femurLift = 1.15; knee = -2.5; ankle = 1.2; }
    limb.joints[1].rotation.x = femurLift;
    limb.joints[2].rotation.x = knee;
    limb.joints[3].rotation.x = ankle;
    rec.base = { f: femurLift, k: knee, a: ankle };
    // Alternating tripod: front-left, mid-right, hind-left = group 0; the rest = 1.
    rec.group = (sock.pair + (sock.side > 0 ? 1 : 0)) % 2;
  }

  _buildAntennae() {
    const A = this.p.antennae;
    const nSeg = Math.max(3, Math.round(A.segs));
    for (const sock of this.bodyParts.antennaSockets) {
      const segs = [];
      for (let i = 0; i < nSeg; i++) {
        const w0 = A.thick * (1 - (i / nSeg) * 0.4);
        const w1 = A.thick * (1 - ((i + 1) / nSeg) * 0.4);
        // Clubbed / lamellate tips: swell the last couple of segments.
        const club = (A.type === 'clavate' || A.type === 'lamellate') && i > nSeg - 3 ? 2.2 : 1;
        segs.push({ len: A.len / nSeg, r0: w0 * club, r1: w1 * club });
      }
      const limb = buildLimb(segs, this.legMat, 6);
      limb.root.position.copy(sock.pos);
      const dir = new THREE.Vector3(0.85, 0.45, sock.side * (0.25 + A.spread)).normalize();
      limb.root.quaternion.setFromUnitVectors(Y, dir);
      const elbow = A.type === 'geniculate' ? A.elbow || 1.1 : 0;
      limb.joints.forEach((j, i) => { j.rotation.x = 0.05 + (i === 1 ? elbow : 0); });
      sock.parent.add(limb.root);
      this.antennae.push({ limb, side: sock.side, base: limb.joints.map((j) => j.rotation.x) });
    }
  }

  _buildEyes() {
    const r = Math.max(this.p.body.head.w * this.p.head.eye, 0.01);
    for (const sock of this.bodyParts.eyeSockets) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), this.eyeMat);
      eye.position.copy(sock.pos);
      // Oval, hugging the head side: short front-to-back, tall, flattened against the flank.
      eye.scale.set(0.72, 1.25, 0.82);
      eye.castShadow = true;
      sock.parent.add(eye);
    }
  }

  _buildProboscis() {
    const pr = this.p.head.proboscis;
    if (!pr || pr <= 0) return;
    const h = this.p.body.head;
    const segs = [];
    const n = 3;
    for (let i = 0; i < n; i++) segs.push({ len: pr / n, r0: 0.014 * (1 - i * 0.2), r1: 0.014 * (1 - (i + 1) * 0.2) });
    const limb = buildLimb(segs, this.legMat, 6);
    limb.root.position.set(h.len * 0.9, -h.h * 0.2, 0);
    limb.root.quaternion.setFromUnitVectors(Y, new THREE.Vector3(0.7, -0.7, 0).normalize()); // down-forward
    this.bodyParts.headGroup.add(limb.root);
  }

  _buildWings() {
    const w = this.p.wings;
    if (w.count <= 0 || w.type === 'none') return;
    this.wings = [];

    // Beetle elytra: two curved chitin shells over the abdomen, meeting at the midline.
    if (w.type === 'elytra') {
      const ab = this.p.body.abdomen, tl = this.p.body.thorax.len;
      const elen = ab.len * 0.6, ewid = ab.w * 0.56, ehgt = ab.h * 0.62;
      const ecx = -tl * 0.5 - ab.len * 0.42, ecy = ab.h * 0.06;
      const spotMat = this.p.surface.spots > 0
        ? new THREE.MeshStandardMaterial({ color: new THREE.Color(this.p.surface.spotColor), roughness: 0.4 }) : null;
      for (const side of [-1, 1]) {
        const el = buildElytron(elen, ewid, ehgt, this.chitin);
        el.position.set(ecx, ecy, side * ab.w * 0.2);
        this.bodyParts.root.add(el);
        this.wings.push({ mesh: el, kind: 'elytra' });
        // Spots (ladybird): dark discs seated on the dome surface.
        if (spotMat) {
          const spots = [[0.25, 0.35], [-0.05, 0.55], [-0.45, 0.3]];
          for (const [su, sv] of spots) {
            const dx = su * elen, dz = (side * ab.w * 0.2) + side * sv * ewid;
            const k = 1 - (dx / elen) ** 2 - ((side * sv * ewid) / ewid) ** 2;
            const dy = ecy + ehgt * Math.sqrt(Math.max(0.02, k));
            const spot = new THREE.Mesh(new THREE.SphereGeometry(Math.min(ewid, ehgt) * 0.22, 12, 8), spotMat);
            spot.position.set(ecx + dx, dy, dz);
            spot.scale.y = 0.3;
            this.bodyParts.root.add(spot);
          }
        }
      }
      return;
    }

    const membraneMat = makeWingMaterial(w);
    const veinMat = new THREE.LineBasicMaterial({ color: 0x1a1a12, transparent: true, opacity: 0.5 });
    const q = new THREE.Quaternion();
    // Which sockets: 2 → forewings (row 0); 4 → both rows.
    const rows = w.count >= 4 ? [0, 1] : [0];
    for (const sock of this.bodyParts.wingSockets) {
      if (!rows.includes(sock.row)) continue;
      const wing = buildMembraneWing(sock.row === 1 ? { ...w, len: w.len * 0.9, w: w.w * 1.05 } : w, membraneMat, veinMat);
      const holder = new THREE.Group();
      holder.position.copy(sock.pos);
      const side = sock.side, back = sock.row === 1 ? -0.25 : 0;
      let span, norm;
      switch (w.posture) {
        case 'up': span = new THREE.Vector3(back * 0.3, 0.9, side * 0.45); norm = new THREE.Vector3(0, 0, side); break;
        case 'roof': span = new THREE.Vector3(-0.25 + back, -0.12, side); norm = new THREE.Vector3(0.1, 0.8, side * 0.5); break;
        case 'flat': span = new THREE.Vector3(-0.7 + back, 0.08, side * 0.55); norm = new THREE.Vector3(0, 1, 0); break;
        // 'swept': wings raked back over the abdomen at a low angle — the bee-at-rest
        // gesture that complements the dorsal arc rather than jutting out sideways.
        case 'swept': span = new THREE.Vector3(-0.9 + back, -0.06, side * 0.34); norm = new THREE.Vector3(0.18, 0.9, side * 0.18); break;
        default: span = new THREE.Vector3(back * 0.4, 0.12, side); norm = new THREE.Vector3(0, 1, 0); // 'out'
      }
      orient(span, norm, q);
      holder.quaternion.copy(q);
      holder.add(wing);
      this.bodyParts.root.add(holder);
      this.wings.push({ mesh: holder, kind: 'membrane', sock });
    }

    // Halteres (flies): tiny knobbed stalks on the metathorax.
    if (w.type === 'halteres') {
      for (const sock of this.bodyParts.wingSockets) {
        if (sock.row !== 1) continue;
        const h = knob(0.04, this.legMat);
        h.position.copy(sock.pos).add(new THREE.Vector3(-0.1, -0.05, sock.side * 0.05));
        this.bodyParts.root.add(h);
      }
    }
  }

  update(dt, camera) {
    this.t += dt;
    const t = this.t, m = this.p.motion, TAU = Math.PI * 2;

    // --- Walking in place: the alternating tripod. Three legs swing (lift + step
    // forward) while three stay planted, groups 180° out of phase. The body doesn't
    // translate — a treadmill walk that reads as "alive".
    const gait = m.gait ?? 0.6;
    const freq = m.gaitFreq ?? 2.4;
    for (const rec of this.legs) {
      if (rec.groomed) continue; // a foreleg mid-groom isn't walking
      const ph = t * freq * TAU + rec.group * Math.PI;
      const lift = Math.max(0, Math.sin(ph));      // swing when > 0
      const swing = Math.cos(ph);
      rec.limb.joints[1].rotation.x = rec.base.f - lift * 0.45 * gait;   // femur lifts
      rec.limb.joints[2].rotation.x = rec.base.k + lift * 0.75 * gait;   // knee straightens → foot up
      rec.limb.root.rotation.y = swing * 0.18 * gait;                    // fore-aft step
    }

    // --- Foreleg / antennae grooming (flies): periodically raise the forelegs to the
    // head and rub — the signature fly behaviour.
    const groom = m.groom ?? 0;
    if (groom > 0) {
      const cyc = (t * 0.25) % 1;                  // groom for a slice of each cycle
      const active = cyc < 0.35;
      const rub = Math.sin(t * 14) * 0.18;
      for (const rec of this.legs) {
        if (rec.sock.pair !== 0) continue;         // forelegs only
        rec.groomed = active;
        if (active) {
          rec.limb.joints[1].rotation.x = rec.base.f - 1.3 + rub * rec.sock.side; // raise to head
          rec.limb.joints[2].rotation.x = rec.base.k + 1.4;
          rec.limb.root.rotation.y = 0.4 * rec.sock.side;
        }
      }
    }

    // --- Antennae: a gentle, always-on twitch/sweep (life).
    for (const a of this.antennae) {
      a.limb.joints.forEach((j, i) => {
        j.rotation.x = a.base[i] + Math.sin(t * 2.2 + i * 0.6 + a.side) * 0.05;
        j.rotation.z = Math.sin(t * 1.6 + a.side * 1.5) * 0.05;
      });
    }

    // --- "Looking at you": the head turns toward the camera (damped), else a slow scan.
    const hg = this.bodyParts.headGroup;
    if (camera && (m.look ?? 1)) {
      const cam = this.worldToLocal(camera.position.clone());
      const hp = hg.position;
      const dx = cam.x - hp.x, dy = cam.y - hp.y, dz = cam.z - hp.z;
      const yaw = clamp(Math.atan2(dz, dx), -0.7, 0.7);        // head faces +X
      const pitch = clamp(-Math.atan2(dy, Math.hypot(dx, dz)), -0.4, 0.4);
      hg.rotation.y += (yaw - hg.rotation.y) * 0.06;
      hg.rotation.x += ((this.p.body.head.tilt || 0) + pitch - hg.rotation.x) * 0.06;
    } else {
      hg.rotation.y = Math.sin(t * 0.5) * 0.25;
    }

    // Faint whole-body breathing sway.
    this.rotation.z = Math.sin(t * 0.6) * (m.sway || 0.01);
  }

  // Measure the assembled model's proportions as a normalized ratio vector — the
  // same landmark set the reference is annotated with, so a morphometry harness can
  // score deviation (see scripts/morphometry.mjs). Lengths from part bounding boxes;
  // appendage lengths from params. All lateral-view ratios relative to body length.
  // INTRINSIC proportions — measured in the rest frame from the parameters, NOT from
  // posed world bounding boxes. Posture (the dorsal arc) foreshortens every part's world
  // projection in both X and Y, which would corrupt the ratios and make the fit fight
  // the gestalt. Morphometry is about the animal's intrinsic shape; the arc is a
  // separate expressive layer. Region ratios sum to 1, matching the reference vectors.
  measure() {
    const p = this.p, b = p.body;
    const headLen = b.head.len, thoraxLen = b.thorax.len, abdomenLen = b.abdomen.len;
    const bodyLen = headLen + thoraxLen + abdomenLen;
    const bodyH = Math.max(b.head.h, b.thorax.h * (1 + b.thorax.pronotum * 0.3), b.abdomen.h);
    const eyeDia = 2 * b.head.w * p.head.eye;
    const legLen = 0.12 + p.legs.femur + p.legs.tibia + p.legs.tarsus; // one leg's segment sum
    const wingLen = p.wings && p.wings.count > 0 && p.wings.type !== 'elytra' ? p.wings.len : 0;
    return {
      bodyLen,
      headR: headLen / bodyLen,
      thoraxR: thoraxLen / bodyLen,
      abdomenR: abdomenLen / bodyLen,
      heightR: bodyH / bodyLen,
      eyeR: eyeDia / headLen,
      wingR: wingLen / bodyLen,
      legR: legLen / bodyLen,
      antR: p.antennae.len / bodyLen,
    };
  }

  dispose() {
    this.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) Array.isArray(o.material) ? o.material.forEach((m) => m.dispose()) : o.material.dispose();
    });
  }
}

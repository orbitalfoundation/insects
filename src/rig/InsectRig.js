import * as THREE from 'three';
import { buildBody } from './body.js';
import { buildLimb, knob } from './limb.js';
import { buildMembraneWing, buildElytron } from './wings.js';
import { makeChitinMaterial, makeLegMaterial, makeEyeMaterial, makeWingMaterial } from '../shading/InsectMaterial.js';

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
    this.chitin = makeChitinMaterial(p.surface);
    this.legMat = makeLegMaterial(p.surface);
    this.eyeMat = makeEyeMaterial();

    this.bodyParts = buildBody(p, this.chitin);
    this.add(this.bodyParts.root);

    this._buildLegs();
    this._buildAntennae();
    this._buildEyes();
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
        { len: 0.14 * sc, r0: L.thick * 1.3, r1: L.thick },           // coxa (short)
        { len: L.femur * sc, r0: L.thick, r1: L.thick * 0.8 },        // femur
        { len: L.tibia * sc, r0: L.thick * 0.8, r1: L.thick * 0.5 },  // tibia
        { len: L.tarsus * sc, r0: L.thick * 0.5, r1: L.thick * 0.28 }, // tarsus (foot)
      ];
      const limb = buildLimb(segs, this.legMat);
      limb.root.position.copy(sock.pos);
      this._poseLeg(limb, sock, L, sc);
      // A claw knob at the foot.
      limb.tip.add(knob(L.claw * sc, this.legMat));
      this.bodyParts.root.add(limb.root);
      this.legs.push({ limb, sock, sc });
    }
  }

  // Pose one leg into the classic insect zig-zag stance (coxa out-down, femur up-out,
  // tibia down to the ground, tarsus flat). Fore legs reach forward, hind legs back.
  _poseLeg(limb, sock, L, sc) {
    const fwd = sock.pair === 0 ? 0.45 : sock.pair === 2 ? -0.55 : 0.0;
    const dir = new THREE.Vector3(fwd, -0.35, sock.side * (0.7 + L.spread)).normalize();
    limb.root.quaternion.setFromUnitVectors(Y, dir);
    // Zig-zag bends (around each joint's local X). Tuned so the foot reaches ~ground.
    const type = L.type;
    let femurLift = 0.75, knee = -2.0, ankle = 1.0;
    if (type === 'raptorial' && sock.pair === 0) { femurLift = 0.2; knee = -2.6; ankle = -0.6; } // folded grabbing foreleg
    if (type === 'saltatorial' && sock.pair === 2) { femurLift = 1.15; knee = -2.5; ankle = 1.2; } // cocked jumping leg
    limb.joints[1].rotation.x = femurLift;
    limb.joints[2].rotation.x = knee;
    limb.joints[3].rotation.x = ankle;
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
    }
  }

  _buildEyes() {
    const r = Math.max(this.p.body.head.w * this.p.head.eye, 0.01);
    for (const sock of this.bodyParts.eyeSockets) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), this.eyeMat);
      eye.position.copy(sock.pos);
      eye.scale.set(0.9, 1.1, 1.2);
      eye.castShadow = true;
      sock.parent.add(eye);
    }
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

  update(dt) {
    this.t += dt;
    // Idle: a gentle antennal/body sway (gait comes next).
    this.bodyParts.headGroup.rotation.y = Math.sin(this.t * 0.8) * 0.06 * (this.p.motion.sway ? 1 : 0);
    this.rotation.z = Math.sin(this.t * 0.5) * (this.p.motion.sway || 0);
  }

  dispose() {
    this.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) Array.isArray(o.material) ? o.material.forEach((m) => m.dispose()) : o.material.dispose();
    });
  }
}

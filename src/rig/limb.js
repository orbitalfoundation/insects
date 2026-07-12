import * as THREE from 'three';

// THE one jointed-limb primitive — the articulated generalisation of the nudibranch's
// recursive appendage. A chain of tapered segments connected by JOINTS (Group nodes
// you rotate to pose). Legs (coxa→trochanter→femur→tibia→tarsus), antennae, palps,
// and the coiled proboscis are all this at different specs. Built along local +Y;
// each joint's rotation bends the chain, so a walk-cycle / IK just drives joints[i].
//
// segs: [{ len, r0, r1 }]  (r0 = base radius, r1 = tip radius)
// Returns { root, joints, tips, tip } — joints[i] is the rotate-here node for segment i.
export function buildLimb(segs, material, radial = 7) {
  const root = new THREE.Group();
  const joints = [];
  const tips = [];
  let parent = root;
  for (const s of segs) {
    const joint = new THREE.Group();
    parent.add(joint);
    const geo = new THREE.CylinderGeometry(Math.max(s.r1, 0.0008), Math.max(s.r0, 0.0008), s.len, radial, 1, true);
    geo.translate(0, s.len / 2, 0); // base at the joint origin, grows along +Y
    const mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = true;
    joint.add(mesh);
    const child = new THREE.Group();
    child.position.y = s.len;
    joint.add(child);
    joints.push(joint);
    tips.push(child);
    parent = child;
  }
  return { root, joints, tips, tip: parent };
}

// A small rounded end cap / foot / joint knob (spheres read as the chitinous knuckles
// and tarsal claws). Returns a mesh to drop at a joint or tip.
export function knob(r, material) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), material);
  m.castShadow = true;
  return m;
}

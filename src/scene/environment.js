import * as THREE from 'three';

// A macro studio on a terrestrial substrate — the insect equivalent of the nudibranch
// reef: warm soft daylight, a leaf/soil ground plane the animal stands on, a gradient
// backdrop, and a light rig that makes chitin gleam and structural iridescence flash.
export function buildEnvironment(scene, renderer) {
  const top = new THREE.Color(0x2a3320);
  const bottom = new THREE.Color(0x0b0d08);

  const domeGeo = new THREE.SphereGeometry(1, 32, 24);
  const domeMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { uTop: { value: top }, uBottom: { value: bottom } },
    vertexShader: `varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */`
      varying vec3 vDir; uniform vec3 uTop, uBottom;
      void main(){ float h = normalize(vDir).y; gl_FragColor = vec4(mix(uBottom, uTop, smoothstep(-0.4, 0.9, h)), 1.0); }`,
  });
  const dome = new THREE.Mesh(domeGeo, domeMat);
  dome.renderOrder = -1; dome.frustumCulled = false;
  scene.add(dome);
  scene.fog = new THREE.FogExp2(bottom.getHex(), 0.06);

  // Substrate — a matte earthy plane the feet stand on, receiving shadow.
  const subMat = new THREE.MeshStandardMaterial({ color: 0x2c3020, roughness: 0.95, metalness: 0.0 });
  const substrate = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), subMat);
  substrate.rotation.x = -Math.PI / 2;
  substrate.receiveShadow = true;
  scene.add(substrate);

  // Warm key (sun) with shadow, cool sky fill, warm back rim.
  const key = new THREE.DirectionalLight(0xfff2d8, 3.2);
  key.position.set(3, 5, 2.5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 0.5; key.shadow.camera.far = 60;
  key.shadow.bias = -0.0004;
  const sc = key.shadow.camera; sc.left = -4; sc.right = 4; sc.top = 4; sc.bottom = -4;
  scene.add(key);
  const fill = new THREE.HemisphereLight(0xbfe0ff, 0x2c3020, 0.6);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffe0b0, 1.0);
  rim.position.set(-3, 1.5, -3);
  scene.add(rim);

  // Env map from the gradient (for chitin/iridescence reflections).
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envScene = new THREE.Scene();
  const ed = new THREE.Mesh(domeGeo, domeMat.clone()); ed.scale.setScalar(10); envScene.add(ed);
  envScene.add(new THREE.HemisphereLight(0xcfe8ff, 0x2c3020, 1.1));
  scene.environment = pmrem.fromScene(envScene).texture;
  scene.environmentIntensity = 1.0;

  return {
    substrate,
    setScale(s) {
      scene.fog.density = 0.14 / (s + 0.5);
      key.position.set(s * 3, s * 5, s * 2.5);
      const c = key.shadow.camera;
      c.left = -s * 2.2; c.right = s * 2.2; c.top = s * 2.2; c.bottom = -s * 2.2;
      c.far = s * 30 + 5; c.updateProjectionMatrix();
    },
    update(t, camera) {
      if (camera) { dome.position.copy(camera.position); dome.scale.setScalar((camera.far - camera.near) * 0.45); }
    },
  };
}

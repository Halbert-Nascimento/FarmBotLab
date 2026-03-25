import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.183.2/build/three.module.js";

function tileKey(x, y) {
  return `${x}:${y}`;
}

const SOIL_COLORS = {
  loam: "#9f7449",
  clay: "#8c6647",
  sandy: "#b89e73",
  peat: "#5f4a34",
  silt: "#8a7a5f",
};

const CROP_COLORS = {
  generic: "#66a85f",
  wheat: "#d3b55b",
  corn: "#f0c743",
  tomato: "#c95353",
  potato: "#9a7a55",
};

function getColor(value, fallback) {
  return value || fallback;
}

function createTileMaterial(soilType, cropType) {
  const soilColor = new THREE.Color(getColor(SOIL_COLORS[soilType], SOIL_COLORS.loam));

  if (!cropType) {
    return new THREE.MeshStandardMaterial({ color: soilColor, roughness: 0.92, metalness: 0.02 });
  }

  const cropColor = new THREE.Color(getColor(CROP_COLORS[cropType], CROP_COLORS.generic));
  const mixed = soilColor.clone().lerp(cropColor, 0.55);
  return new THREE.MeshStandardMaterial({ color: mixed, roughness: 0.86, metalness: 0.03 });
}

function normalizeAvatarProfile(input) {
  if (typeof input === "string") {
    return {
      key: input,
      modelKind: "primitive",
    };
  }

  return {
    key: input && input.key ? input.key : "bot",
    modelKind: input && input.modelKind ? input.modelKind : "primitive",
    glbUrl: input && input.glbUrl ? input.glbUrl : null,
  };
}

function createAvatarVisual(profileInput, onLog) {
  const profile = normalizeAvatarProfile(profileInput);

  // Gancho para GLB futuro: quando modelKind for "glb", mantemos fallback seguro
  // para primitive ate o loader de GLB ser integrado.
  if (profile.modelKind === "glb" && profile.glbUrl) {
    onLog(`GLB configurado para ${profile.key}, fallback para modelo primitivo ativo.`);
  }

  if (profile.key === "drone") return createDroneAvatar();
  if (profile.key === "tractor") return createTractorAvatar();
  return createBotAvatar();
}

function createDroneAvatar() {
  const root = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.23, 22, 22),
    new THREE.MeshStandardMaterial({ color: "#2f5f8f", roughness: 0.45, metalness: 10.55 })
  );
  body.castShadow = true;
  root.add(body);

  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 0.08, 14),
    new THREE.MeshStandardMaterial({ color: "#f50c0c", roughness: 0.4, metalness: 0.3 })
  );
  top.position.y = 0.2;
  top.castShadow = true;
  root.add(top);

  const armMaterial = new THREE.MeshStandardMaterial({ color: "#1f2830", roughness: 0.6, metalness: 0.45 });
  const rotorMaterial = new THREE.MeshStandardMaterial({ color: "#8ba0b3", roughness: 0.4, metalness: 0.7 });
  const armLength = 0.34;
  const armThickness = 0.04;

  for (let i = 0; i < 4; i += 1) {
    const angle = i * (Math.PI / 2) + Math.PI / 4;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(armLength, armThickness, armThickness), armMaterial);
    arm.position.set(Math.cos(angle) * 0.17, 0.03, Math.sin(angle) * 0.17);
    arm.rotation.y = -angle;
    arm.castShadow = true;
    root.add(arm);

    const rotor = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.01, 16), rotorMaterial);
    rotor.position.set(Math.cos(angle) * 0.32, 0.04, Math.sin(angle) * 0.32);
    rotor.castShadow = true;
    root.add(rotor);
  }

  root.position.y = 0.52;
  return {
    group: root,
    heightOffset: 1.5, // intencionalmente alto para destacar o bob de movimento no drone
    moveBob: 0.4,
  };
}

function createTractorAvatar() {
  const root = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.26, 0.52),
    new THREE.MeshStandardMaterial({ color: "#1e7e42", roughness: 0.6, metalness: 0.2 })
  );
  base.castShadow = true;
  root.add(base);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.3, 0.34),
    new THREE.MeshStandardMaterial({ color: "#c7d6e5", roughness: 0.35, metalness: 0.15 })
  );
  cabin.position.set(-0.04, 0.25, 0);
  cabin.castShadow = true;
  root.add(cabin);

  const hood = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.18, 0.36),
    new THREE.MeshStandardMaterial({ color: "#2a9d53", roughness: 0.55, metalness: 0.2 })
  );
  hood.position.set(0.24, 0.08, 0);
  hood.castShadow = true;
  root.add(hood);

  const wheelMaterial = new THREE.MeshStandardMaterial({ color: "#222", roughness: 0.88, metalness: 0.12 });
  const wheelGeoLarge = new THREE.CylinderGeometry(0.16, 0.16, 0.08, 18);
  const wheelGeoSmall = new THREE.CylinderGeometry(0.11, 0.11, 0.08, 18);

  const wheels = [
    { x: -0.24, z: -0.24, geo: wheelGeoLarge },
    { x: -0.24, z: 0.24, geo: wheelGeoLarge },
    { x: 0.28, z: -0.24, geo: wheelGeoSmall },
    { x: 0.28, z: 0.24, geo: wheelGeoSmall },
  ];

  wheels.forEach((wheelData) => {
    const wheel = new THREE.Mesh(wheelData.geo, wheelMaterial);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wheelData.x, -0.06, wheelData.z);
    wheel.castShadow = true;
    root.add(wheel);
  });

  root.position.y = 0.34;
  return {
    group: root,
    heightOffset: 0.34,
    moveBob: 0.035,
  };
}

function createBotAvatar() {
  const root = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.23, 0.3, 0.8, 24),
    new THREE.MeshStandardMaterial({ color: "#3b7fd9", roughness: 0.45, metalness: 0.3 })
  );
  body.castShadow = true;
  body.position.y = 0.0;
  root.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 20, 20),
    new THREE.MeshStandardMaterial({ color: "#f7f2dc", roughness: 0.55, metalness: 0.1 })
  );
  head.position.y = 0.45;
  head.castShadow = true;
  root.add(head);

  root.position.y = 0.45;
  return {
    group: root,
    heightOffset: 0.45,
    moveBob: 0.1,
  };
}

export function createThreeFarmView({
  sceneRoot,
  gridSize = 8,
  tileSize = 1,
  initialZoom = 1.2,
  avatarType = "drone",
  onDebugError,
  onLog,
}) {
  const tiles = new Map();
  let currentAnimation = null;
  let avatar = null;
  let lastKnownPosition = { x: 0, y: 0 };

  let renderer = null;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    sceneRoot.appendChild(renderer.domElement);
  } catch (error) {
    onLog(`Falha ao iniciar renderer: ${error.message}`);
    onDebugError(`Falha ao iniciar WebGLRenderer: ${error.message}`);
  }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#e7e1c5");

  const camera = new THREE.OrthographicCamera(-8, 8, 8, -8, 0.1, 100);
  camera.position.set(3, 10, 10);
  camera.lookAt(0, 0, 0);
  camera.zoom = Number(initialZoom);
  camera.updateProjectionMatrix();

  const hemi = new THREE.HemisphereLight(0xfff8e6, 0x5e7b4e, 0.75); // default 0.75 é a intensidade da luz
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff1c2, 5.1); // default 1.0 é a intensidade da luz
  sun.position.set(7, 16, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -15;
  sun.shadow.camera.right = 15;
  sun.shadow.camera.top = 15;
  sun.shadow.camera.bottom = -15;
  scene.add(sun);

  const farmGroup = new THREE.Group();
  scene.add(farmGroup);

  const tileGeometry = new THREE.BoxGeometry(tileSize, 0.2, tileSize);
  const tileEdgeMaterial = new THREE.LineBasicMaterial({
    color: "#6f4f2f",
    transparent: true,
    opacity: 0.45,
  });

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      const tile = new THREE.Mesh(tileGeometry, createTileMaterial("loam", null));
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(tileGeometry), tileEdgeMaterial);
      tile.add(edges);
      const wp = gridToWorld(x, y, gridSize);
      tile.position.set(wp.x, -0.1, wp.z);
      tile.receiveShadow = true;
      tile.castShadow = false;
      tile.userData.soilType = "loam";
      tile.userData.cropType = null;
      farmGroup.add(tile);
      tiles.set(tileKey(x, y), tile);
    }
  }

//   const ground = new THREE.Mesh(
//     new THREE.CircleGeometry(10, 64),
//     new THREE.MeshStandardMaterial({ color: "#c8b28d" })
//   );
//   ground.rotation.x = -Math.PI / 2;
//   ground.position.y = -0.26;
//   ground.receiveShadow = true;
//   scene.add(ground);

  function mountAvatar(type) {
    if (avatar && avatar.group.parent) {
      avatar.group.parent.remove(avatar.group);
    }

    avatar = createAvatarVisual(type, onLog);
    scene.add(avatar.group);
    syncBotPosition(lastKnownPosition);
  }

  mountAvatar(avatarType);

  function setAvatarType(type) {
    mountAvatar(type);
    if (currentAnimation) {
      return;
    }
  }

  function setTileState(x, y, soilType, cropType) {
    const tile = tiles.get(tileKey(x, y));
    if (!tile) return;
    tile.material = createTileMaterial(soilType || "loam", cropType || null);
  }

  function setSoilType(x, y, soilType) {
    const tile = tiles.get(tileKey(x, y));
    if (!tile) return;
    const hasCrop = Boolean(tile.userData.cropType);
    tile.userData.soilType = soilType;
    setTileState(x, y, soilType, hasCrop ? tile.userData.cropType : null);
  }

  function setCrop(x, y, cropType) {
    const tile = tiles.get(tileKey(x, y));
    if (!tile) return;

    const soilType = tile.userData.soilType || "loam";
    tile.userData.cropType = cropType || null;
    setTileState(x, y, soilType, cropType || null);
  }

  function syncBotPosition(position) {
    lastKnownPosition = { x: position.x, y: position.y };
    const wp = gridToWorld(position.x, position.y, gridSize);
    avatar.group.position.x = wp.x;
    avatar.group.position.z = wp.z;
    avatar.group.position.y = avatar.heightOffset;
  }

  function animateMove(from, to) {
    if (!renderer) {
      syncBotPosition(to);
      return Promise.resolve();
    }

    const fromWorld = gridToWorld(from.x, from.y, gridSize);
    const toWorld = gridToWorld(to.x, to.y, gridSize);

    return new Promise((resolve) => {
      currentAnimation = {
        start: performance.now(),
        duration: 360,
        resolve,
        from: fromWorld,
        to: toWorld,
      };
    });
  }

  function setZoom(value) {
    camera.zoom = Number(value);
    camera.updateProjectionMatrix();
  }

  function resize() {
    if (!renderer) return;
    const w = sceneRoot.clientWidth;
    const h = sceneRoot.clientHeight;
    renderer.setSize(w, h, false);
    const aspect = w / Math.max(h, 1);
    const view = 6.5;
    camera.left = -view * aspect;
    camera.right = view * aspect;
    camera.top = view;
    camera.bottom = -view;
    camera.updateProjectionMatrix();
  }

  function reset(snapshot) {
    for (const tile of tiles.values()) {
      tile.userData.soilType = "loam";
      tile.userData.cropType = null;
      tile.material = createTileMaterial("loam", null);
    }

    snapshot.soils.forEach((entry) => {
      setSoilType(entry.x, entry.y, entry.soil.type);
    });

    snapshot.crops.forEach((entry) => {
      setCrop(entry.x, entry.y, entry.crop.type);
    });

    syncBotPosition(snapshot.position);
  }

  function render(now) {
    if (currentAnimation) {
      const p = Math.min(1, (now - currentAnimation.start) / currentAnimation.duration);
      avatar.group.position.x = currentAnimation.from.x + (currentAnimation.to.x - currentAnimation.from.x) * p;
      avatar.group.position.z = currentAnimation.from.z + (currentAnimation.to.z - currentAnimation.from.z) * p;
      avatar.group.position.y = avatar.heightOffset + Math.sin(p * Math.PI) * avatar.moveBob;

      if (p >= 1) {
        avatar.group.position.y = avatar.heightOffset;
        const done = currentAnimation.resolve;
        currentAnimation = null;
        done();
      }
    }

    if (renderer) {
      renderer.render(scene, camera);
    }

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);

  return {
    setCrop,
    setSoilType,
    setAvatarType,
    syncBotPosition,
    animateMove,
    setZoom,
    resize,
    reset,
  };
}

function gridToWorld(x, y, gridSize) {
  return {
    x: x - gridSize / 2 + 0.5,
    z: y - gridSize / 2 + 0.5,
  };
}

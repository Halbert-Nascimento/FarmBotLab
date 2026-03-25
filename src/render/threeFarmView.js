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
    return new THREE.MeshStandardMaterial({ color: soilColor });
  }

  const cropColor = new THREE.Color(getColor(CROP_COLORS[cropType], CROP_COLORS.generic));
  const mixed = soilColor.clone().lerp(cropColor, 0.55);
  return new THREE.MeshStandardMaterial({ color: mixed });
}

export function createThreeFarmView({ sceneRoot, gridSize = 8, tileSize = 1, initialZoom = 1.2, onDebugError, onLog }) {


  const tiles = new Map();
  let currentAnimation = null;

  let renderer = null;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    sceneRoot.appendChild(renderer.domElement);
  } catch (error) {
    onLog(`Falha ao iniciar renderer: ${error.message}`);
    onDebugError(`Falha ao iniciar WebGLRenderer: ${error.message}`);
  }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#e7e1c5");

  const camera = new THREE.OrthographicCamera(-8, 8, 8, -8, 0.1, 100);
  camera.position.set(11, 11, 11);
  camera.lookAt(0, 0, 0);
  camera.zoom = Number(initialZoom);
  camera.updateProjectionMatrix();

  const hemi = new THREE.HemisphereLight(0xfff8e6, 0x5e7b4e, 0.75);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff1c2, 1.1);
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

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      const tile = new THREE.Mesh(tileGeometry, createTileMaterial("loam", null));
      const wp = gridToWorld(x, y, gridSize);
      tile.position.set(wp.x, -0.1, wp.z);
      tile.receiveShadow = true;
      tile.castShadow = false;
      farmGroup.add(tile);
      tiles.set(tileKey(x, y), tile);
    }
  }

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(10, 64),
    new THREE.MeshStandardMaterial({ color: "#c8b28d10" })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.25;
  ground.receiveShadow = true;
  scene.add(ground);

  const bot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.23, 0.3, 0.8, 24),
    new THREE.MeshStandardMaterial({ color: "#3b7fd9" })
  );
  bot.castShadow = true;
  bot.position.y = 0.45;
  scene.add(bot);

  const botHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 20, 20),
    new THREE.MeshStandardMaterial({ color: "#f00d0d" })
  );
  botHead.position.y = 1.45;
  bot.add(botHead);

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
    const wp = gridToWorld(position.x, position.y, gridSize);
    bot.position.x = wp.x;
    bot.position.z = wp.z;
    bot.position.y = 0.45;
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
        duration: 350,
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
    const view = 6;
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
      bot.position.x = currentAnimation.from.x + (currentAnimation.to.x - currentAnimation.from.x) * p;
      bot.position.z = currentAnimation.from.z + (currentAnimation.to.z - currentAnimation.from.z) * p;
      bot.position.y = 0.45 + Math.sin(p * Math.PI) * 0.1;

      if (p >= 1) {
        bot.position.y = 0.45;
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

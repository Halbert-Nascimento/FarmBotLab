import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.183.2/build/three.module.js";
import { 
  createCropModel, 
  updateCropModel, 
  calculateGrowthProgressByTime,
  CROP_CONFIGS 
} from './cropGrowthSystem.js';

function tileKey(x, y) {
  return `${x}:${y}`;
}

const SOIL_COLORS = {
  loam: "#c79a67",
  clay: "#b18765",
  sandy: "#d2b284",
  peat: "#8a6647",
  silt: "#ba986f",
};

const CROP_COLORS = {
  generic: "#66a85f",
  arvore: "#4f8b3d",
  girasol: "#f2c93a",
  wheat: "#d3b55b",
  corn: "#f0c743",
  tomato: "#c95353",
  potato: "#9a7a55",
};

// Perfis de performance para arredondamento (sem dependência externa)
// MUITO_LEVE: 0.01 radius, 2 segments (~36 vértices/tile, ideal para máquinas pré-2015)
// BALANCEADO: 0.02 radius, 3 segments (~80 vértices/tile, padrão, ideal para a maioria)
// QUALIDADE: 0.04 radius, 4 segments (~160 vértices/tile, máquinas modernas)

const TILE_CORNER_RADIUS = 0.02;
const TILE_CORNER_CURVE_SEGMENTS = 3;
const DEFAULT_SURFACE_STATE = "pure"; // opções: "pure" ou "tilled"

// Funções de helper para alternar perfis
function setPerformanceProfile(profile) {
  const profiles = {
    muito_leve: { radius: 0.01, segments: 2 },
    balanceado: { radius: 0.02, segments: 3 },
    qualidade: { radius: 0.04, segments: 4 },
  };
  const p = profiles[profile] || profiles.balanceado;
  // Nota: Para aplicar novo perfil, será necessário recarregar cena chamando reset()
  return p;
}

function createRoundedRectShape(width, height, radius) {
  const halfW = width / 2;
  const halfH = height / 2;
  const r = Math.max(0.001, Math.min(radius, halfW - 0.001, halfH - 0.001));

  const shape = new THREE.Shape();
  shape.moveTo(-halfW + r, -halfH);
  shape.lineTo(halfW - r, -halfH);
  shape.quadraticCurveTo(halfW, -halfH, halfW, -halfH + r);
  shape.lineTo(halfW, halfH - r);
  shape.quadraticCurveTo(halfW, halfH, halfW - r, halfH);
  shape.lineTo(-halfW + r, halfH);
  shape.quadraticCurveTo(-halfW, halfH, -halfW, halfH - r);
  shape.lineTo(-halfW, -halfH + r);
  shape.quadraticCurveTo(-halfW, -halfH, -halfW + r, -halfH);
  return shape;
}

function createRoundedTileGeometry(size, height, radius, curveSegments) {
  const shape = createRoundedRectShape(size, size, radius);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    steps: 1,
    bevelEnabled: false,
    curveSegments,
  });

  // Converte para eixo Y como altura e centraliza como a BoxGeometry original.
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, -height / 2, 0);
  return geometry;
}

function getColor(value, fallback) {
  return value || fallback;
}

const soilTextureCache = new Map();
const soilMaterialCache = new Map();

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function hash2d(x, y, seed = 0) {
  let n = x * 374761393 + y * 668265263 + seed * 1442695040888963;
  n = (n ^ (n >>> 13)) * 1274126177;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function valueNoise2d(x, y, seed = 0) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;

  const v00 = hash2d(ix, iy, seed);
  const v10 = hash2d(ix + 1, iy, seed);
  const v01 = hash2d(ix, iy + 1, seed);
  const v11 = hash2d(ix + 1, iy + 1, seed);

  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const ix0 = lerp(v00, v10, sx);
  const ix1 = lerp(v01, v11, sx);
  return lerp(ix0, ix1, sy);
}

function fbm2d(x, y, seed, octaves = 4) {
  let amplitude = 0.5;
  let frequency = 1;
  let total = 0;
  let sum = 0;
  for (let i = 0; i < octaves; i += 1) {
    total += valueNoise2d(x * frequency, y * frequency, seed + i * 17) * amplitude;
    sum += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  return total / Math.max(sum, 0.0001);
}

function getSoilProfile(soilType) {
  const profiles = {
    loam: { roughness: 0.86, normalScale: 0.48, grain: 5.2, stripeFreq: 0.32, contrast: 0.22 },
    clay: { roughness: 0.92, normalScale: 0.4, grain: 4.1, stripeFreq: 0.29, contrast: 0.18 },
    sandy: { roughness: 0.8, normalScale: 0.54, grain: 7.6, stripeFreq: 0.35, contrast: 0.24 },
    peat: { roughness: 0.94, normalScale: 0.44, grain: 3.6, stripeFreq: 0.27, contrast: 0.19 },
    silt: { roughness: 0.84, normalScale: 0.46, grain: 6.1, stripeFreq: 0.31, contrast: 0.21 },
  };
  return profiles[soilType] || profiles.loam;
}

function createSoilTextureBundle(soilType, surfaceState) {
  const cacheKey = `${soilType}:${surfaceState}`;
  const fromCache = soilTextureCache.get(cacheKey);
  if (fromCache) return fromCache;

  const size = 256;
  const profile = getSoilProfile(soilType);
  const base = new THREE.Color(getColor(SOIL_COLORS[soilType], SOIL_COLORS.loam));

  const albedoCanvas = document.createElement("canvas");
  const normalCanvas = document.createElement("canvas");
  const aoCanvas = document.createElement("canvas");
  albedoCanvas.width = size;
  albedoCanvas.height = size;
  normalCanvas.width = size;
  normalCanvas.height = size;
  aoCanvas.width = size;
  aoCanvas.height = size;

  const albedoCtx = albedoCanvas.getContext("2d");
  const normalCtx = normalCanvas.getContext("2d");
  const aoCtx = aoCanvas.getContext("2d");
  const heightCanvas = document.createElement("canvas");
  heightCanvas.width = size;
  heightCanvas.height = size;
  const heightCtx = heightCanvas.getContext("2d");
  const albedoData = albedoCtx.createImageData(size, size);
  const normalData = normalCtx.createImageData(size, size);
  const aoData = aoCtx.createImageData(size, size);
  const heightData = heightCtx.createImageData(size, size);
  const heights = new Float32Array(size * size);
  const seed = soilType.length * 97 + (surfaceState === "tilled" ? 31 : 11);

  const dirAngle = 0.9;
  const dirX = Math.cos(dirAngle);
  const dirY = Math.sin(dirAngle);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const idx = y * size + x;
      const uvx = (x / size) * profile.grain;
      const uvy = (y / size) * profile.grain;
      const coarse = fbm2d(uvx * 0.75, uvy * 0.75, seed, 4);
      const detail = fbm2d(uvx * 2.8, uvy * 2.8, seed + 113, 3);
      const micro = fbm2d(uvx * 7.2, uvy * 7.2, seed + 241, 2);
      let height = coarse * 0.58 + detail * 0.29 + micro * 0.13;

      if (surfaceState === "tilled") {
        const furrowPos = x * (profile.stripeFreq * 0.24) + valueNoise2d(0, y * 0.04, seed + 901) * 0.35;
        const wave = 0.5 + 0.5 * Math.sin(furrowPos + detail * 0.55);
        const grooveMask = Math.pow(1 - Math.abs(wave * 2 - 1), 4.8);
        const ridgeMask = 1 - grooveMask;
        height = clamp01(height * 0.3 + ridgeMask * 0.58 + micro * 0.12);
      }

      heights[idx] = height;
    }
  }

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const idx = y * size + x;
      const i4 = idx * 4;
      const h = heights[idx];

      const xL = x > 0 ? x - 1 : x;
      const xR = x < size - 1 ? x + 1 : x;
      const yD = y > 0 ? y - 1 : y;
      const yU = y < size - 1 ? y + 1 : y;
      const hL = heights[y * size + xL];
      const hR = heights[y * size + xR];
      const hD = heights[yD * size + x];
      const hU = heights[yU * size + x];

      const tone = 0.86 + (h - 0.5) * profile.contrast * 1.9;
      const broadNoise = valueNoise2d(x * 0.13, y * 0.13, seed + 341) * 0.12 - 0.06;
      const fineNoise = fbm2d(x * 0.085, y * 0.085, seed + 607, 3) * 0.08 - 0.04;
      const variance = broadNoise + fineNoise;
      let furrowDarken = 0;
      if (surfaceState === "tilled") {
        const furrowPos = x * (profile.stripeFreq * 0.24) + valueNoise2d(0, y * 0.04, seed + 777) * 0.35;
        const wave = 0.5 + 0.5 * Math.sin(furrowPos + h * 0.6);
        const grooveMask = Math.pow(1 - Math.abs(wave * 2 - 1), 5.5);
        furrowDarken = grooveMask * 0.7;
      }
      const tilledDarken = surfaceState === "tilled" ? 0.15 : 0;
      const albedo = clamp01(tone + variance - furrowDarken - tilledDarken);
      albedoData.data[i4] = Math.round(clamp01(base.r * albedo) * 255);
      albedoData.data[i4 + 1] = Math.round(clamp01(base.g * albedo) * 255);
      albedoData.data[i4 + 2] = Math.round(clamp01(base.b * albedo) * 255);
      albedoData.data[i4 + 3] = 255;

      const heightByte = Math.round(clamp01(h) * 255);
      heightData.data[i4] = heightByte;
      heightData.data[i4 + 1] = heightByte;
      heightData.data[i4 + 2] = heightByte;
      heightData.data[i4 + 3] = 255;

      let dx = (hL - hR) * (profile.normalScale * 2.0);
      let dy = (hD - hU) * (profile.normalScale * 2.0);
      if (surfaceState === "tilled") {
        const furrowPos = x * (profile.stripeFreq * 0.24) + valueNoise2d(0, y * 0.04, seed + 633) * 0.35;
        const furrowSlope = Math.cos(furrowPos + h * 0.6) * 0.9;
        dx += furrowSlope;
        dy += furrowSlope * 0.03;
      }
      const len = Math.sqrt(dx * dx + dy * dy + 1);
      const nx = dx / len;
      const ny = dy / len;
      const nz = 1 / len;
      normalData.data[i4] = Math.round((nx * 0.5 + 0.5) * 255);
      normalData.data[i4 + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      normalData.data[i4 + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      normalData.data[i4 + 3] = 255;

      const slope = Math.abs(hL - hR) + Math.abs(hD - hU);
      const valley = 1 - h;
      const aoBase = surfaceState === "tilled" ? 0.8 : 0.9;
      const aoValue = clamp01(aoBase + h * 0.2 - slope * (surfaceState === "tilled" ? 0.82 : 0.56) - valley * 0.04);
      const aoByte = Math.round(aoValue * 255);
      aoData.data[i4] = aoByte;
      aoData.data[i4 + 1] = aoByte;
      aoData.data[i4 + 2] = aoByte;
      aoData.data[i4 + 3] = 255;
    }
  }

  albedoCtx.putImageData(albedoData, 0, 0);
  normalCtx.putImageData(normalData, 0, 0);
  aoCtx.putImageData(aoData, 0, 0);
  heightCtx.putImageData(heightData, 0, 0);

  const albedoTexture = new THREE.CanvasTexture(albedoCanvas);
  const normalTexture = new THREE.CanvasTexture(normalCanvas);
  const aoTexture = new THREE.CanvasTexture(aoCanvas);
  const heightTexture = new THREE.CanvasTexture(heightCanvas);
  [albedoTexture, normalTexture, aoTexture, heightTexture].forEach((texture) => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2.0, 2.0);
    texture.needsUpdate = true;
  });
  albedoTexture.colorSpace = THREE.SRGBColorSpace;

  const bundle = {
    map: albedoTexture,
    normalMap: normalTexture,
    aoMap: aoTexture,
    bumpMap: heightTexture,
    profile,
  };
  soilTextureCache.set(cacheKey, bundle);
  return bundle;
}

function createTileMaterial(soilType, cropType) {
  const surfaceState = cropType ? "tilled" : "pure";
  const cacheKey = `${soilType}:${cropType || "none"}:${surfaceState}`;
  const cachedMaterial = soilMaterialCache.get(cacheKey);
  if (cachedMaterial) return cachedMaterial;

  const bundle = createSoilTextureBundle(soilType, surfaceState);
  let tint = new THREE.Color("#ffffff");
  if (cropType) {
    const soilColor = new THREE.Color(getColor(SOIL_COLORS[soilType], SOIL_COLORS.loam));
    const cropColor = new THREE.Color(getColor(CROP_COLORS[cropType], CROP_COLORS.generic));
    tint = soilColor.clone().lerp(cropColor, 0.1).lerp(new THREE.Color("#ffffff"), 0.35);
  }

  const material = new THREE.MeshStandardMaterial({
    color: tint,
    map: bundle.map,
    normalMap: bundle.normalMap,
    aoMap: bundle.aoMap,
    aoMapIntensity: surfaceState === "tilled" ? 0.32 : 0.24,
    roughness: surfaceState === "tilled" ? clamp01(bundle.profile.roughness + 0.03) : bundle.profile.roughness,
    metalness: 0.02,
    normalScale: new THREE.Vector2(bundle.profile.normalScale, bundle.profile.normalScale),
  });

  soilMaterialCache.set(cacheKey, material);
  return material;
}

function normalizeSurfaceState(surfaceState) {
  return surfaceState === "tilled" ? "tilled" : "pure";
}

function createTileMaterialWithSurface(soilType, cropType, surfaceState) {
  const normalizedSurface = normalizeSurfaceState(surfaceState);
  const cacheKey = `${soilType}:${cropType || "none"}:${normalizedSurface}`;
  const cachedMaterial = soilMaterialCache.get(cacheKey);
  if (cachedMaterial) return cachedMaterial;

  const bundle = createSoilTextureBundle(soilType, normalizedSurface);
  let tint = new THREE.Color("#ffffff");
  const soilColor = new THREE.Color(getColor(SOIL_COLORS[soilType], SOIL_COLORS.loam));
  if (!cropType && normalizedSurface === "tilled") {
    tint = soilColor.clone().multiplyScalar(0.78);
  }
  if (cropType) {
    const cropColor = new THREE.Color(getColor(CROP_COLORS[cropType], CROP_COLORS.generic));
    tint = soilColor.clone().lerp(cropColor, 0.1).lerp(new THREE.Color("#ffffff"), 0.2);
  }

  const material = new THREE.MeshStandardMaterial({
    color: tint,
    map: bundle.map,
    normalMap: bundle.normalMap,
    aoMap: bundle.aoMap,
    bumpMap: bundle.bumpMap,
    bumpScale: normalizedSurface === "tilled" ? 0.085 : 0.025,
    aoMapIntensity: normalizedSurface === "tilled" ? 0.52 : 0.24,
    roughness:
      normalizedSurface === "tilled"
        ? clamp01(bundle.profile.roughness + 0.04)
        : bundle.profile.roughness,
    metalness: 0.02,
    normalScale:
      normalizedSurface === "tilled"
        ? new THREE.Vector2(bundle.profile.normalScale * 2.1, bundle.profile.normalScale * 2.1)
        : new THREE.Vector2(bundle.profile.normalScale, bundle.profile.normalScale),
  });

  soilMaterialCache.set(cacheKey, material);
  return material;
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
  cropGrowthSettings = {},
  onDebugError,
  onLog,
}) {
  const tiles = new Map();
  const cropModels = new Map();  // Armazena modelos 3D das plantas: key = "x:y", value = { group, cropType, plantedTimeMs }
  // Configuração viva de crescimento (pode ser alterada em runtime via setCropGrowthSettings).
  const growthSettings = {
    globalTimeScale: typeof cropGrowthSettings.globalTimeScale === "number" ? cropGrowthSettings.globalTimeScale : 1,
    perCropDurationSeconds: {
      ...(cropGrowthSettings.perCropDurationSeconds || {}),
    },
  };
  let cropsGroup = null;         // Container para as plantas 3D
  let currentAnimation = null;
  let avatar = null;
  let lastKnownPosition = { x: 0, y: 0 };

  // Controle de rotação por mouse (±35º máximo em ambos os eixos)
  let isDragging = false;
  let mouseStartX = 0;
  let mouseStartY = 0;
  let currentRotationY = 0;
  let targetRotationY = 0;
  let currentRotationX = 0;
  let targetRotationX = 0;
  const MAX_ROTATION = (35 * Math.PI) / 180; // 35 graus em radianos
  const ROTATION_SENSITIVITY = 0.2; // Sensibilidade do mouse

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

  // Container para modelos 3D das plantas
  cropsGroup = new THREE.Group();
  farmGroup.add(cropsGroup);

  const tileGeometry = createRoundedTileGeometry(
    tileSize,
    0.2,
    TILE_CORNER_RADIUS,
    TILE_CORNER_CURVE_SEGMENTS
  );
  if (tileGeometry.attributes.uv && !tileGeometry.attributes.uv2) {
    tileGeometry.setAttribute("uv2", new THREE.BufferAttribute(tileGeometry.attributes.uv.array.slice(), 2));
  }
  const tileEdgeMaterial = new THREE.LineBasicMaterial({
    color: "#6f4f2f6e",
    transparent: true,
    opacity: 0.45,
  });

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      const tile = new THREE.Mesh(tileGeometry, createTileMaterialWithSurface("loam", null, DEFAULT_SURFACE_STATE));
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(tileGeometry), tileEdgeMaterial);
      tile.add(edges);
      const wp = gridToWorld(x, y, gridSize);
      tile.position.set(wp.x, -0.1, wp.z);
      tile.receiveShadow = true;
      tile.castShadow = false;
      tile.userData.soilType = "loam";
      tile.userData.cropType = null;
      tile.userData.surfaceState = DEFAULT_SURFACE_STATE;
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
    farmGroup.add(avatar.group);
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
    const surfaceState = normalizeSurfaceState(tile.userData.surfaceState);
    tile.material = createTileMaterialWithSurface(soilType || "loam", cropType || null, surfaceState);
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
    const key = tileKey(x, y);
    
    // Remove modelo 3D anterior se existir
    if (cropModels.has(key)) {
      const oldModel = cropModels.get(key);
      cropsGroup.remove(oldModel.group);
      cropModels.delete(key);
    }

    tile.userData.cropType = cropType || null;
    
    // Cria novo modelo 3D se plantando uma cultura
    if (cropType) {
      // NÃO muda surfaceState - a terra deve ser preparada ANTES de plantar
      // tile.userData.surfaceState permanece como estava
      
      // Calcula posição no mundo
      const wp = gridToWorld(x, y, gridSize);
      
      // Cria modelo 3D procedural
      const cropGroup = createCropModel(
        cropType,
        0.0,  // Começa com progresso 0 (semente)
        wp.x,
        wp.z,
        x * 73856093 ^ y * 19349663  // Seed determinístico baseado em posição
      );
      
      cropsGroup.add(cropGroup);
      
      // Armazena informações para atualização posterior com TEMPO REAL
      cropModels.set(key, {
        group: cropGroup,
        cropType: cropType,
        plantedTimeMs: Date.now(),  // Timestamp em ms (não turn)
      });
    }
    
    setTileState(x, y, soilType, cropType || null);
  }

  function resolveGrowthDurationSeconds(cropType) {
    const config = CROP_CONFIGS[cropType] || CROP_CONFIGS.capim;
    // Prioridade: override do sistema > valor padrão da cultura.
    const override = growthSettings.perCropDurationSeconds[cropType];
    const baseDuration = typeof override === "number" ? override : config.growthDays;
    // globalTimeScale > 1 acelera crescimento; < 1 desacelera.
    const safeScale = Math.max(0.1, growthSettings.globalTimeScale || 1);
    return Math.max(1, baseDuration / safeScale);
  }

  function setCropGrowthSettings(patch = {}) {
    // Permite patch parcial para facilitar manutenção e ajustes incrementais.
    if (typeof patch.globalTimeScale === "number") {
      growthSettings.globalTimeScale = patch.globalTimeScale;
    }
    if (patch.perCropDurationSeconds) {
      growthSettings.perCropDurationSeconds = {
        ...growthSettings.perCropDurationSeconds,
        ...patch.perCropDurationSeconds,
      };
    }
  }

  function setSoilSurface(x, y, surfaceState) {
    const tile = tiles.get(tileKey(x, y));
    if (!tile) return;
    tile.userData.surfaceState = normalizeSurfaceState(surfaceState);
    setTileState(x, y, tile.userData.soilType || "loam", tile.userData.cropType || null);
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
      tile.userData.surfaceState = DEFAULT_SURFACE_STATE;
      tile.material = createTileMaterialWithSurface("loam", null, DEFAULT_SURFACE_STATE);
    }

    // Limpa modelos 3D de plantas
    for (const cropData of cropModels.values()) {
      cropsGroup.remove(cropData.group);
    }
    cropModels.clear();

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

    // Aplicar rotação suave com easing (horizontal e vertical)
    currentRotationY += (targetRotationY - currentRotationY) * 0.15;
    currentRotationX += (targetRotationX - currentRotationX) * 0.15;
    farmGroup.rotation.order = "YXZ"; // Aplicar Y primeiro, depois X para melhor resultado visual
    farmGroup.rotation.y = currentRotationY;
    farmGroup.rotation.x = currentRotationX;

    // Atualizar crescimento das plantas (independente de ações - tempo REAL)
    const currentTimeMs = Date.now();
    for (const [key, cropData] of cropModels.entries()) {
      const config = CROP_CONFIGS[cropData.cropType];
      if (config) {
        // Cada planta usa sua duração final já considerando overrides + escala global.
        const growthDurationSeconds = resolveGrowthDurationSeconds(cropData.cropType);
        // Calcula progresso baseado em tempo real (milissegundos) em vez de turns
        const growthProgress = calculateGrowthProgressByTime(
          cropData.plantedTimeMs,
          currentTimeMs,
          growthDurationSeconds
        );
        updateCropModel(cropData.group, growthProgress, now / 1000); // now em segundos para animação
      }
    }

    if (renderer) {
      renderer.render(scene, camera);
    }

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);

  // Event listeners para rotação com mouse
  sceneRoot.addEventListener("mousedown", (e) => {
    // Verificar se clique está fora de elementos UI (editor/logger)
    const isOnCanvas = e.target === renderer.domElement;
    if (isOnCanvas) {
      isDragging = true;
      mouseStartX = e.clientX;
      mouseStartY = e.clientY;
    }
  });

  document.addEventListener("mousemove", (e) => {
    if (isDragging) {
      const deltaX = e.clientX - mouseStartX;
      const deltaY = e.clientY - mouseStartY;
      // Converter movimento do mouse em rotação (35º máximo em ambos eixos)
      let newRotationY = (deltaX * ROTATION_SENSITIVITY * Math.PI) / 180;
      let newRotationX = (deltaY * ROTATION_SENSITIVITY * Math.PI) / 180;
      // Limitar rotação a ±35 graus
      targetRotationY = Math.max(-MAX_ROTATION, Math.min(MAX_ROTATION, newRotationY));
      targetRotationX = Math.max(-MAX_ROTATION, Math.min(MAX_ROTATION, newRotationX));
    }
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
    // Manter a rotação na posição atual (não volta para zero)
  });

  document.addEventListener("mouseleave", () => {
    isDragging = false;
    // Manter a rotação na posição atual (não volta para zero)
  });

  // Função para resetar rotação com suavidade
  function resetRotation() {
    targetRotationY = 0;
    targetRotationX = 0;
  }

  // Listener de teclado para resetar com 'R'
  document.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "r") {
      resetRotation();
    }
  });

  // Listener de scroll/wheel para zoom
  const MIN_ZOOM = 0.5; // Zoom mínimo (muito afastado)
  const MAX_ZOOM = 3.0; // Zoom máximo (muito aproximado)
  const ZOOM_SENSITIVITY = 0.6; // Sensibilidade do scroll

  sceneRoot.addEventListener("wheel", (e) => {
    e.preventDefault(); // Impedir scroll da página
    
    // deltaY positivo = scroll down = zoom out (diminui zoom)
    // deltaY negativo = scroll up = zoom in (aumenta zoom)
    const zoomDelta = -e.deltaY * ZOOM_SENSITIVITY * 0.001;
    camera.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, camera.zoom + zoomDelta));
    camera.updateProjectionMatrix();
  }, { passive: false }); // passive:false permite preventDefault

  return {
    setCrop,
    setSoilType,
    setSoilSurface,
    setAvatarType,
    syncBotPosition,
    animateMove,
    setZoom,
    resize,
    reset,
    resetRotation,
    setCropGrowthSettings,
  };
}

function gridToWorld(x, y, gridSize) {
  return {
    x: x - gridSize / 2 + 0.5,
    z: y - gridSize / 2 + 0.5,
  };
}

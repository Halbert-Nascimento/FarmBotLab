/**
 * Sistema de Crescimento de Plantas
 * 
 * Gerencia diferentes tipos de plantas, suas fases de crescimento e representação 3D
 * 
 * Fases de crescimento (0.0 a 1.0):
 *   0.0-0.15  : Semente (sementes enterradas, invisível ou muito pequeno)
 *   0.15-0.35 : Broto (pequeno, começando a emergir)
 *   0.35-0.65 : Média (crescimento principal)
 *   0.65-0.85 : Madura (quase pronta para colheita)
 *   0.85-1.0  : Pronta para colheita (altura máxima, visível mudança de cor)
 */

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.183.2/build/three.module.js";

// ===== CONFIGURAÇÕES DE PLANTAS =====

const CROP_CONFIGS = {
  capim: {
    // Capim/Grama - planta de crescimento rápido
    type: "capim",
    displayName: "Capim",
    color: { young: "#7cb342", mature: "#558b2f", harvestReady: "#33691e" },
    baseHeight: 0.35,           // Altura máxima do capim (em unidades de mundo)
    growthDays: 15,             // Tempo base (em segundos) até ficar pronto para colheita (pode receber override externo)
    leafCount: 8,               // Número de folhas por tufo
    tuftCount: 5,               // Quantidade de tufos no mesmo bloco
    spreadRadius: 0.22,         // Espalhamento dos tufos dentro do bloco
    leafWidthMin: 0.08,
    leafWidthMax: 0.12,
    waveAmplitude: 0.15,        // Amplitude do movimento ondulatório
    waveFrequency: 0.8,         // Frequência do movimento
    density: 1.2,               // Densidade de folhas (multiplicador)
  },
  arvore: {
    // Arvore - objeto 3D com tronco e copa
    type: "arvore",
    displayName: "Arvore",
    color: { young: "#7fbf5b", mature: "#4f8b3d", harvestReady: "#2e6b2a" },
    trunkColor: { young: "#8d6e63", mature: "#6d4c41", harvestReady: "#5d4037" },
    baseHeight: 1.25,
    growthDays: 22,
    waveAmplitude: 0.05,
    waveFrequency: 0.35,
    density: 1.0,
  },
  trigo: {
    // Trigo - mais fino e com muito mais volume por bloco
    type: "trigo",
    displayName: "Trigo",
    color: { young: "#9ccc65", mature: "#689f38", harvestReady: "#f57f17" },
    baseHeight: 0.62,
    growthDays: 20,
    leafCount: 11,
    tuftCount: 14,
    spreadRadius: 0.33,
    leafWidthMin: 0.015,
    leafWidthMax: 0.03,
    waveAmplitude: 0.06,
    waveFrequency: 0.7,
    density: 2.3,
  },
  girasol: {
    // Girasol - caule alto com flor no topo
    type: "girasol",
    displayName: "Girasol",
    color: { young: "#86c95c", mature: "#5ea93c", harvestReady: "#4d8d34" },
    stemColor: { young: "#7aa74a", mature: "#5f8a38", harvestReady: "#527730" },
    petalColor: { young: "#f8d94d", mature: "#f2c93a", harvestReady: "#e7b92c" },
    centerColor: { young: "#7b5a2b", mature: "#5a3f21", harvestReady: "#4a331b" },
    baseHeight: 1.05,
    growthDays: 24,
    waveAmplitude: 0.05,
    waveFrequency: 0.45,
    density: 1.0,
  },
  morango: {
    // Morango - planta frutifera rasteira
    type: "morango",
    displayName: "Morango",
    color: { young: "#6fbf5b", mature: "#4e9b45", harvestReady: "#3e7f39" },
    vineColor: { young: "#7abf62", mature: "#5f9c4e", harvestReady: "#4d7f40" },
    fruitColor: { young: "#d97272", mature: "#cf3f3f", harvestReady: "#b52020" },
    baseHeight: 0.32,
    growthDays: 18,
    waveAmplitude: 0.05,
    waveFrequency: 0.7,
    density: 1.0,
  },
  milho: {
    // Milho - planta mais alta (futuro)
    type: "milho",
    displayName: "Milho",
    color: { young: "#aed581", mature: "#7cb342", harvestReady: "#fdd835" },
    baseHeight: 0.8,
    growthDays: 25,
    leafCount: 10,
    waveAmplitude: 0.12,
    waveFrequency: 0.5,
    density: 1.1,
  },
};

// ===== FUNÇÕES AUXILIARES =====

/**
 * Calcula o progresso de crescimento (0.0 a 1.0)
 * baseado na volta em que foi plantada vs volta atual
 * 
 * DESCONTINUADO: Use calculateGrowthProgressByTime() em vez disso
 * 
 * @param {number} plantedTurn - Volta em que foi plantada
 * @param {number} currentTurn - Volta atual do jogo
 * @param {number} growthDays - Dias (turns) necessários para maturar
 * @returns {number} Progresso 0.0-1.0
 */
function calculateGrowthProgress(plantedTurn, currentTurn, growthDays) {
  const ageInDays = currentTurn - plantedTurn;
  const progress = Math.min(1.0, Math.max(0.0, ageInDays / growthDays));
  return progress;
}

/**
 * Calcula o progresso de crescimento (0.0 a 1.0)
 * baseado em tempo real (milissegundos)
 * 
 * Sistema de tempo Real: Plantas crescem continuamente sem depender de ações
 * 
 * @param {number} plantedTimeMs - Timestamp em ms quando foi plantada (Date.now())
 * @param {number} currentTimeMs - Timestamp em ms atual (Date.now())
 * @param {number} growthDays - "Dias" em número de SEGUNDOS (ex: 15 = 15 segundos)
 * @returns {number} Progresso 0.0-1.0
 */
function calculateGrowthProgressByTime(plantedTimeMs, currentTimeMs, growthSeconds) {
  const growthTimeMs = Math.max(1, growthSeconds * 1000);  // Converter segundos para ms
  const ageMs = currentTimeMs - plantedTimeMs;
  const progress = Math.min(1.0, Math.max(0.0, ageMs / growthTimeMs));
  return progress;
}

/**
 * Mapeia um progresso de crescimento linear para um progresso mais natural
 * usando easing para um crescimento mais rápido no início e desacelerando no final
 * 
 * @param {number} linearProgress - Progresso linear 0.0-1.0
 * @returns {number} Progresso easeado 0.0-1.0
 */
function easeGrowthProgress(linearProgress) {
  // Cubic easing: t^2 * (3 - 2*t) produz crescimento natural
  const t = Math.min(1.0, Math.max(0.0, linearProgress));
  return t * t * (3 - 2 * t);
}

/**
 * Interpola um valor entre múltiplos pontos chave de cor baseado no progresso
 * 
 * @param {number} progress - Progresso 0.0-1.0
 * @param {string} colorYoung - Cor inicial (hex)
 * @param {string} colorMature - Cor intermediária (hex)
 * @param {string} colorHarvest - Cor final (hex)
 * @returns {THREE.Color} Cor interpolada
 */
function interpolateGrowthColor(progress, colorYoung, colorMature, colorHarvest) {
  const color1 = new THREE.Color(colorYoung);
  const color2 = new THREE.Color(colorMature);
  const color3 = new THREE.Color(colorHarvest);

  let interpolatedColor;
  if (progress < 0.5) {
    // Primeira metade: young → mature
    interpolatedColor = color1.clone().lerp(color2, progress * 2);
  } else {
    // Segunda metade: mature → harvest
    interpolatedColor = color2.clone().lerp(color3, (progress - 0.5) * 2);
  }

  return interpolatedColor;
}

/**
 * Converte progresso de crescimento em escala visual da planta.
 *
 * Regra de UX: ao plantar, já mostramos um volume mínimo para feedback imediato.
 * A planta ainda continua crescendo progressivamente até 1.0.
 *
 * @param {number} growthProgress - Progresso 0.0-1.0
 * @returns {number} Escala vertical da planta
 */
function getLeafScaleFromGrowthProgress(growthProgress) {
  const clamped = Math.min(1, Math.max(0, growthProgress));
  const seedVisibleScale = 0.14;

  if (clamped < 0.15) {
    // Semente visível desde o instante do plantio.
    return seedVisibleScale;
  }

  if (clamped < 0.35) {
    // Transição contínua entre semente visível e broto.
    return seedVisibleScale + ((clamped - 0.15) / 0.2) * (1 - seedVisibleScale);
  }

  return 1.0;
}

/**
 * Fator de altura da planta ao longo do crescimento.
 *
 * Regra de UX: no instante do plantio já existe altura mínima de broto,
 * evitando que o modelo apareça "atrasado" alguns segundos depois.
 *
 * @param {number} growthProgress - Progresso 0.0-1.0
 * @returns {number} Fator de altura (0.0-1.0)
 */
function getHeightFactorFromGrowthProgress(growthProgress) {
  const clamped = Math.min(1, Math.max(0, growthProgress));
  const easedProgress = easeGrowthProgress(clamped);
  const minVisibleHeightFactor = 0.22;
  return Math.max(minVisibleHeightFactor, easedProgress);
}

// ===== GERADOR DE MODELOS 3D =====

/**
 * Cria um modelo 3D procedural de uma planta (capim/folhas)
 * 
 * O modelo é criado como um grupo contendo várias folhas dispostas radialmente
 * 
 * @param {string} cropType - Tipo de planta ("capim", "trigo", etc)
 * @param {number} growthProgress - Progresso de crescimento 0.0-1.0
 * @param {number} posX - Posição X no mundo
 * @param {number} posZ - Posição Z no mundo
 * @param {number} seed - Seed para geração procedural (determinística por posição)
 * @returns {THREE.Group} Grupo contendo a representação 3D da planta
 */
function createCropModel(cropType, growthProgress, posX, posZ, seed = 0) {
  const config = CROP_CONFIGS[cropType] || CROP_CONFIGS.capim;

  if (cropType === "arvore") {
    return createTreeModel(cropType, growthProgress, posX, posZ, seed);
  }
  if (cropType === "girasol") {
    return createSunflowerModel(cropType, growthProgress, posX, posZ, seed);
  }
  if (cropType === "morango") {
    return createGroundFruitModel(cropType, growthProgress, posX, posZ, seed);
  }

  // Altura mínima inicial garante broto visível imediatamente ao plantar.
  const currentHeight = config.baseHeight * getHeightFactorFromGrowthProgress(growthProgress);
  
  // Cor interpolada baseada no progresso
  const currentColor = interpolateGrowthColor(
    growthProgress,
    config.color.young,
    config.color.mature,
    config.color.harvestReady
  );
  
  // Cria grupo para conter folhas
  const cropGroup = new THREE.Group();
  cropGroup.position.set(posX, 0, posZ);
  
  // Pseudo-aleatório determinístico baseado em posição + seed
  function seededRandom(index) {
    const n = Math.sin((posX + posZ + index) * 12.9898 + seed * 78.233) * 43758.5453;
    return n - Math.floor(n);
  }
  
  // Escala visual com feedback imediato no plantio.
  const leafScale = getLeafScaleFromGrowthProgress(growthProgress);
  
  // tuftCount controla quantos "mini-capins" (tufos) existirão dentro do mesmo bloco.
  const tuftCount = Math.max(1, Math.round((config.tuftCount || 1) * Math.max(0.6, config.density || 1)));
  const spreadRadius = config.spreadRadius || 0.16;

  // Cria múltiplos tufos para preencher melhor o bloco com capim
  for (let tuftIndex = 0; tuftIndex < tuftCount; tuftIndex += 1) {
    const tuftAngle = seededRandom(3000 + tuftIndex) * Math.PI * 2;
    const tuftDistance = seededRandom(4000 + tuftIndex) * spreadRadius;
    const tuftCenterX = Math.cos(tuftAngle) * tuftDistance;
    const tuftCenterZ = Math.sin(tuftAngle) * tuftDistance;
    // Varia folhas por tufo para evitar padrão visual repetitivo.
    const leavesPerTuft = Math.max(4, Math.round(config.leafCount * (0.75 + seededRandom(5000 + tuftIndex) * 0.5)));

    for (let i = 0; i < leavesPerTuft; i++) {
      const randomIndex = tuftIndex * 100 + i;
      const leaf = createLeaf(
        currentHeight * leafScale,
        currentColor.clone(),
        config,
        seededRandom(randomIndex)
      );

      // Posiciona folha radialmente ao redor de cada tufo
      const angle = (i / leavesPerTuft) * Math.PI * 2;
      const rotationVariation = seededRandom(1000 + randomIndex) * 0.3;
      leaf.rotation.y = angle + rotationVariation;

      const localRadius = 0.015 + seededRandom(2000 + randomIndex) * 0.03;
      leaf.position.x = tuftCenterX + Math.cos(angle) * localRadius;
      leaf.position.z = tuftCenterZ + Math.sin(angle) * localRadius;

      cropGroup.add(leaf);
    }
  }
  
  // Armazena estado para fácil atualização posterior
  cropGroup.userData = {
    cropType,
    config,
    seed,
    baseProgress: growthProgress,
  };
  
  return cropGroup;
}

/**
 * Cria modelo 3D de arvore (tronco + copa) com crescimento progressivo.
 */
function createTreeModel(cropType, growthProgress, posX, posZ, seed = 0) {
  const config = CROP_CONFIGS[cropType] || CROP_CONFIGS.arvore;
  const heightFactor = getHeightFactorFromGrowthProgress(growthProgress);
  const leafScale = getLeafScaleFromGrowthProgress(growthProgress);
  const totalHeight = config.baseHeight * heightFactor;
  const trunkHeight = Math.max(0.12, totalHeight * 0.62);

  const leafColor = interpolateGrowthColor(
    growthProgress,
    config.color.young,
    config.color.mature,
    config.color.harvestReady
  );
  const trunkColor = interpolateGrowthColor(
    growthProgress,
    config.trunkColor.young,
    config.trunkColor.mature,
    config.trunkColor.harvestReady
  );

  const treeGroup = new THREE.Group();
  treeGroup.position.set(posX, 0, posZ);

  // Tronco
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.07, 2, 12),
    new THREE.MeshStandardMaterial({ color: trunkColor, roughness: 0.9, metalness: 0.0 })
  );
  trunk.position.y = 0;
  trunk.scale.y = trunkHeight;
  trunk.castShadow = true;
  trunk.userData = { modelPart: "tree-trunk" };
  treeGroup.add(trunk);

  // Copa principal
  const crown = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 16, 14),
    new THREE.MeshStandardMaterial({ color: leafColor, roughness: 0.82, metalness: 0.0 })
  );
  crown.position.y = trunkHeight + 0.2;
  crown.scale.set(0.75 * leafScale, 0.65 * leafScale, 0.75 * leafScale);
  crown.castShadow = true;
  crown.userData = { modelPart: "tree-crown-main" };
  treeGroup.add(crown);

  // Copa secundária para volume
  const crownSecondary = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 14, 12),
    new THREE.MeshStandardMaterial({ color: leafColor.clone().multiplyScalar(0.95), roughness: 0.82, metalness: 0.0 })
  );
  crownSecondary.position.set(0.14, trunkHeight + 0.08, -0.06);
  crownSecondary.scale.set(0.7 * leafScale, 0.58 * leafScale, 0.7 * leafScale);
  crownSecondary.castShadow = true;
  crownSecondary.userData = { modelPart: "tree-crown-secondary" };
  treeGroup.add(crownSecondary);

  treeGroup.userData = {
    modelType: "tree",
    cropType,
    config,
    seed,
  };

  return treeGroup;
}

let sharedLeafBladeGeometry = null;

/**
 * Geometria base reutilizável de folha (não retangular), com ponta no topo.
 * A base da folha fica em y=0 para facilitar ancoragem no caule/chão.
 */
function getLeafBladeGeometry() {
  if (sharedLeafBladeGeometry) return sharedLeafBladeGeometry;

  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.quadraticCurveTo(0.32, 0.18, 0.42, 0.46);
  shape.quadraticCurveTo(0.36, 0.82, 0, 1);
  shape.quadraticCurveTo(-0.36, 0.82, -0.42, 0.46);
  shape.quadraticCurveTo(-0.32, 0.18, 0, 0);

  sharedLeafBladeGeometry = new THREE.ShapeGeometry(shape, 10);
  return sharedLeafBladeGeometry;
}

/**
 * Distribui os frutos da planta rasteira em aneis para evitar concentração no centro.
 */
function getGroundFruitOffsets() {
  const offsets = [];
  const rings = [
    { count: 6, radius: 0.09, phase: 0.0 },
    { count: 12, radius: 0.185, phase: 0.22 },
  ];

  rings.forEach((ring) => {
    for (let i = 0; i < ring.count; i += 1) {
      const angle = (i / ring.count) * Math.PI * 2 + ring.phase;
      const jitter = ((i % 3) - 1) * 0.008;
      const r = ring.radius + jitter;
      offsets.push({
        x: Math.cos(angle) * r,
        z: Math.sin(angle) * (r - jitter * 0.5),
      });
    }
  });

  return offsets;
}

/**
 * Cria modelo 3D de girasol (caule, folhas, miolo e petalas) com crescimento progressivo.
 */
function createSunflowerModel(cropType, growthProgress, posX, posZ, seed = 0) {
  const config = CROP_CONFIGS[cropType] || CROP_CONFIGS.girasol;
  const heightFactor = getHeightFactorFromGrowthProgress(growthProgress);
  const leafScale = getLeafScaleFromGrowthProgress(growthProgress);
  const totalHeight = config.baseHeight * heightFactor;
  const stemHeight = Math.max(0.2, totalHeight * 0.78);
  const flowerScale = Math.max(0.16, leafScale);

  const leafColor = interpolateGrowthColor(
    growthProgress,
    config.color.young,
    config.color.mature,
    config.color.harvestReady
  );
  const stemColor = interpolateGrowthColor(
    growthProgress,
    config.stemColor.young,
    config.stemColor.mature,
    config.stemColor.harvestReady
  );
  const petalColor = interpolateGrowthColor(
    growthProgress,
    config.petalColor.young,
    config.petalColor.mature,
    config.petalColor.harvestReady
  );
  const centerColor = interpolateGrowthColor(
    growthProgress,
    config.centerColor.young,
    config.centerColor.mature,
    config.centerColor.harvestReady
  );

  const group = new THREE.Group();
  group.position.set(posX, 0, posZ);

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.036, 1, 12),
    new THREE.MeshStandardMaterial({ color: stemColor, roughness: 0.88, metalness: 0.0 })
  );
  stem.scale.y = stemHeight;
  // Geometria do cilindro nasce no centro; deslocamos para ancorar a base no solo (y=0).
  stem.position.y = stemHeight * 0.5;
  stem.castShadow = true;
  stem.userData = { modelPart: "sunflower-stem" };
  group.add(stem);

  const sideLeafA = new THREE.Mesh(
    getLeafBladeGeometry(),
    new THREE.MeshStandardMaterial({ color: leafColor.clone().multiplyScalar(0.95), side: THREE.DoubleSide, roughness: 0.84, metalness: 0.0 })
  );
  sideLeafA.position.set(0.09, stemHeight * 0.45, 0.02);
  sideLeafA.rotation.set(-0.45, 0.6, -0.55);
  sideLeafA.scale.set(0.13 * leafScale, 0.17 * leafScale, 1);
  sideLeafA.castShadow = true;
  sideLeafA.userData = { modelPart: "sunflower-side-leaf-a", baseScaleX: 0.13, baseScaleY: 0.17 };
  group.add(sideLeafA);

  const sideLeafB = new THREE.Mesh(
    getLeafBladeGeometry(),
    new THREE.MeshStandardMaterial({ color: leafColor.clone().multiplyScalar(0.92), side: THREE.DoubleSide, roughness: 0.84, metalness: 0.0 })
  );
  sideLeafB.position.set(-0.1, stemHeight * 0.58, -0.03);
  sideLeafB.rotation.set(-0.38, -0.72, 0.5);
  sideLeafB.scale.set(0.11 * leafScale, 0.15 * leafScale, 1);
  sideLeafB.castShadow = true;
  sideLeafB.userData = { modelPart: "sunflower-side-leaf-b", baseScaleX: 0.11, baseScaleY: 0.15 };
  group.add(sideLeafB);

  const flowerCenter = new THREE.Mesh(
    new THREE.CylinderGeometry(0.085, 0.085, 0.03, 18),
    new THREE.MeshStandardMaterial({ color: centerColor, roughness: 0.92, metalness: 0.0 })
  );
  flowerCenter.rotation.x = Math.PI / 2;
  // Miolo exatamente no topo do caule para evitar efeito de "flor flutuando".
  flowerCenter.position.set(0, stemHeight, 0);
  flowerCenter.scale.set(0.8 * flowerScale, 0.8 * flowerScale, 0.8 * flowerScale);
  flowerCenter.castShadow = true;
  flowerCenter.userData = { modelPart: "sunflower-center" };
  group.add(flowerCenter);

  const petalCount = 16;
  for (let i = 0; i < petalCount; i += 1) {
    const angle = (i / petalCount) * Math.PI * 2;
    const petal = new THREE.Mesh(
      new THREE.ConeGeometry(0.026, 0.16, 6),
      new THREE.MeshStandardMaterial({ color: petalColor, roughness: 0.8, metalness: 0.0 })
    );
    petal.rotation.z = Math.PI / 2;
    petal.rotation.y = angle;
    petal.position.set(Math.cos(angle) * 0.095, stemHeight, Math.sin(angle) * 0.095);
    petal.scale.set(0.72 * flowerScale, 0.72 * flowerScale, 0.72 * flowerScale);
    petal.castShadow = true;
    petal.userData = { modelPart: "sunflower-petal", petalIndex: i };
    group.add(petal);
  }

  group.userData = {
    modelType: "sunflower",
    cropType,
    config,
    seed,
  };

  return group;
}

/**
 * Cria modelo 3D de planta frutifera rasteira (morango): folhas baixas + frutos.
 */
function createGroundFruitModel(cropType, growthProgress, posX, posZ, seed = 0) {
  const config = CROP_CONFIGS[cropType] || CROP_CONFIGS.morango;
  const heightFactor = getHeightFactorFromGrowthProgress(growthProgress);
  const leafScale = getLeafScaleFromGrowthProgress(growthProgress);
  const totalHeight = config.baseHeight * heightFactor;
  const fruitVisibility = Math.min(1, Math.max(0, (growthProgress - 0.35) / 0.55));
  const fruitScale = 0.25 + fruitVisibility * 0.75;

  const leafColor = interpolateGrowthColor(
    growthProgress,
    config.color.young,
    config.color.mature,
    config.color.harvestReady
  );
  const tilledBaseColor = new THREE.Color("#7b5735");
  const fruitColor = interpolateGrowthColor(
    growthProgress,
    config.fruitColor.young,
    config.fruitColor.mature,
    config.fruitColor.harvestReady
  );

  const group = new THREE.Group();
  group.position.set(posX, 0, posZ);

  const vine = new THREE.Mesh(
    // Base maior para ocupar mais area no quadrado da terra.
    new THREE.CylinderGeometry(0.25, 0.29, 0.035, 22),
    new THREE.MeshStandardMaterial({ color: tilledBaseColor, roughness: 0.95, metalness: 0.0 })
  );
  vine.position.y = 0.015;
  vine.scale.set(1.05, 1, 1.05);
  vine.castShadow = true;
  vine.userData = { modelPart: "ground-fruit-vine" };
  group.add(vine);

  const leafCount = 8;
  for (let i = 0; i < leafCount; i += 1) {
    const angle = (i / leafCount) * Math.PI * 2;
    const leaf = new THREE.Mesh(
      getLeafBladeGeometry(),
      new THREE.MeshStandardMaterial({ color: leafColor, side: THREE.DoubleSide, roughness: 0.86, metalness: 0.0 })
    );
    const radius = 0.06 + (i % 3) * 0.02;
    leaf.position.set(Math.cos(angle) * radius, 0.02 + totalHeight * 0.35, Math.sin(angle) * radius);
    leaf.rotation.set(-1.1, angle, Math.sin(i * 1.7) * 0.25);
    leaf.scale.set((0.11 + (i % 2) * 0.02) * leafScale, (0.14 + (i % 3) * 0.015) * leafScale, 1);
    leaf.castShadow = true;
    leaf.userData = { modelPart: "ground-fruit-leaf", leafIndex: i };
    group.add(leaf);
  }

  const fruitOffsets = getGroundFruitOffsets();

  fruitOffsets.forEach((offset, index) => {
    const fruit = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 12, 10),
      new THREE.MeshStandardMaterial({ color: fruitColor, roughness: 0.7, metalness: 0.0 })
    );
    fruit.position.set(offset.x, 0.035 + totalHeight * 0.18, offset.z);
    fruit.scale.set(fruitScale, fruitScale, fruitScale);
    fruit.castShadow = true;
    fruit.userData = { modelPart: "ground-fruit-berry", berryIndex: index };
    group.add(fruit);
  });

  group.userData = {
    modelType: "ground-fruit",
    cropType,
    config,
    seed,
  };

  return group;
}

/**
 * Cria uma folha individual (lâmina de planta)
 * 
 * A folha é um plano geometricamente simples com material verde
 * que tem aparência natural através de rotação e escala
 * 
 * @param {number} height - Altura da folha
 * @param {THREE.Color} color - Cor da folha
 * @param {Object} config - Configuração da planta
 * @param {number} randomSeed - Valor aleatório para variação
 * @returns {THREE.Mesh} Mesh representando a folha
 */
function createLeaf(height, color, config, randomSeed) {
  // Dimensões da folha
  const widthMin = typeof config.leafWidthMin === "number" ? config.leafWidthMin : 0.08;
  const widthMax = typeof config.leafWidthMax === "number" ? config.leafWidthMax : 0.12;
  const leafWidth = widthMin + randomSeed * Math.max(0.001, widthMax - widthMin);
  const geometry = getLeafBladeGeometry();
  
  // Material com cor baseada no tipo de planta
  const material = new THREE.MeshStandardMaterial({
    color: color,
    side: THREE.DoubleSide,        // Visível de ambos os lados
    emissive: color.clone().multiplyScalar(0.1),  // Pequeno brilho
    roughness: 0.85,               // Textura de folha natural
    metalness: 0.0,
  });
  
  const leaf = new THREE.Mesh(geometry, material);
  leaf.scale.y = height;
  const widthVariation = 0.86 + randomSeed * 0.28;
  leaf.scale.x = leafWidth * widthVariation;
  
  // Leve rotação em X para dar aparência mais natural
  leaf.rotation.x = -0.2 - randomSeed * 0.3;
  
  // Propósito: dados para atualização de animação futura
  leaf.userData = {
    baseRotationX: leaf.rotation.x,
    waveAmplitude: config.waveAmplitude,
    waveFrequency: config.waveFrequency,
    colorVariance: 0.92 + randomSeed * 0.16,
  };
  
  return leaf;
}

/**
 * Atualiza o aspecto visual de uma planta existente
 * Chamado a cada frame/update para mudar altura, cor, etc
 * 
 * @param {THREE.Group} cropGroup - Grupo de plantas criado por createCropModel
 * @param {number} growthProgress - Novo progresso de crescimento 0.0-1.0
 * @param {number} timeElapsed - Tempo decorrido em segundos (para animações)
 */
function updateCropModel(cropGroup, growthProgress, timeElapsed = 0) {
  if (!cropGroup.userData.config) return;

  if (cropGroup.userData.modelType === "tree") {
    updateTreeModel(cropGroup, growthProgress, timeElapsed);
    return;
  }
  if (cropGroup.userData.modelType === "sunflower") {
    updateSunflowerModel(cropGroup, growthProgress, timeElapsed);
    return;
  }
  if (cropGroup.userData.modelType === "ground-fruit") {
    updateGroundFruitModel(cropGroup, growthProgress, timeElapsed);
    return;
  }
  
  const config = cropGroup.userData.config;
  const currentHeight = config.baseHeight * getHeightFactorFromGrowthProgress(growthProgress);
  
  // Atualiza cor
  const currentColor = interpolateGrowthColor(
    growthProgress,
    config.color.young,
    config.color.mature,
    config.color.harvestReady
  );
  
  // Mesma regra usada na criação para manter consistência visual.
  const leafScale = getLeafScaleFromGrowthProgress(growthProgress);
  
  // Atualiza cada folha
  cropGroup.children.forEach((leaf, index) => {
    if (!leaf.isMesh) return;
    
    // Atualiza altura
    const newHeight = currentHeight * leafScale;
    leaf.scale.y = newHeight;
    
    // Atualiza cor
    if (leaf.material.color) {
      const variance = leaf.userData.colorVariance || 1;
      const variedColor = currentColor.clone().multiplyScalar(variance);
      leaf.material.color.copy(variedColor);
      leaf.material.emissive.copy(variedColor.clone().multiplyScalar(0.1));
    }
    
    // Pequena animação de oscilação (vento)
    if (leaf.userData.waveAmplitude && timeElapsed > 0) {
      const wave = Math.sin(timeElapsed * leaf.userData.waveFrequency + index) * 
                   leaf.userData.waveAmplitude;
      leaf.rotation.z = wave;
    }
  });
}

/**
 * Atualiza morango (planta rasteira com frutos) em tempo real.
 */
function updateGroundFruitModel(group, growthProgress, timeElapsed = 0) {
  const config = group.userData.config;
  if (!config) return;

  const heightFactor = getHeightFactorFromGrowthProgress(growthProgress);
  const leafScale = getLeafScaleFromGrowthProgress(growthProgress);
  const totalHeight = config.baseHeight * heightFactor;
  const fruitVisibility = Math.min(1, Math.max(0, (growthProgress - 0.35) / 0.55));
  const fruitScale = 0.25 + fruitVisibility * 0.75;

  const leafColor = interpolateGrowthColor(
    growthProgress,
    config.color.young,
    config.color.mature,
    config.color.harvestReady
  );
  const tilledBaseColor = new THREE.Color("#7b5735");
  const fruitColor = interpolateGrowthColor(
    growthProgress,
    config.fruitColor.young,
    config.fruitColor.mature,
    config.fruitColor.harvestReady
  );

  const fruitOffsets = getGroundFruitOffsets();

  group.children.forEach((part, index) => {
    if (!part.isMesh) return;
    const type = part.userData.modelPart;

    if (type === "ground-fruit-vine") {
      part.position.y = 0.015;
      // Mantem cor de terra arada na cama de cultivo do morango.
      part.material.color.copy(tilledBaseColor);
      // Leve expansão com o crescimento para reforçar a ocupação visual da base.
      const baseScale = 1.05 + growthProgress * 0.12;
      part.scale.set(baseScale, 1, baseScale);
      return;
    }

    if (type === "ground-fruit-leaf") {
      const i = part.userData.leafIndex || 0;
      const angle = (i / 8) * Math.PI * 2;
      const radius = 0.06 + (i % 3) * 0.02;
      part.position.set(Math.cos(angle) * radius, 0.02 + totalHeight * 0.35, Math.sin(angle) * radius);
      part.scale.set((0.11 + (i % 2) * 0.02) * leafScale, (0.14 + (i % 3) * 0.015) * leafScale, 1);
      part.material.color.copy(leafColor);
      if (timeElapsed > 0) {
        part.rotation.z = Math.sin(timeElapsed * config.waveFrequency + i) * config.waveAmplitude * 0.45;
      }
      return;
    }

    if (type === "ground-fruit-berry") {
      const berryIndex = part.userData.berryIndex || 0;
      const offset = fruitOffsets[berryIndex] || fruitOffsets[0];
      part.position.set(offset.x, 0.035 + totalHeight * 0.18, offset.z);
      part.scale.set(fruitScale, fruitScale, fruitScale);
      part.material.color.copy(fruitColor);
    }
  });
}

/**
 * Atualiza girasol (caule, folhas e flor) em tempo real.
 */
function updateSunflowerModel(group, growthProgress, timeElapsed = 0) {
  const config = group.userData.config;
  if (!config) return;

  const heightFactor = getHeightFactorFromGrowthProgress(growthProgress);
  const leafScale = getLeafScaleFromGrowthProgress(growthProgress);
  const totalHeight = config.baseHeight * heightFactor;
  const stemHeight = Math.max(0.2, totalHeight * 0.78);
  const flowerScale = Math.max(0.16, leafScale);

  const leafColor = interpolateGrowthColor(
    growthProgress,
    config.color.young,
    config.color.mature,
    config.color.harvestReady
  );
  const stemColor = interpolateGrowthColor(
    growthProgress,
    config.stemColor.young,
    config.stemColor.mature,
    config.stemColor.harvestReady
  );
  const petalColor = interpolateGrowthColor(
    growthProgress,
    config.petalColor.young,
    config.petalColor.mature,
    config.petalColor.harvestReady
  );
  const centerColor = interpolateGrowthColor(
    growthProgress,
    config.centerColor.young,
    config.centerColor.mature,
    config.centerColor.harvestReady
  );

  group.children.forEach((part, index) => {
    if (!part.isMesh) return;
    const type = part.userData.modelPart;

    if (type === "sunflower-stem") {
      part.scale.y = stemHeight;
      part.position.y = stemHeight * 0.5;
      part.material.color.copy(stemColor);
      return;
    }

    if (type === "sunflower-side-leaf-a") {
      part.position.set(0.09, stemHeight * 0.45, 0.02);
      part.scale.set((part.userData.baseScaleX || 0.13) * leafScale, (part.userData.baseScaleY || 0.17) * leafScale, 1);
      part.material.color.copy(leafColor.clone().multiplyScalar(0.95));
      if (timeElapsed > 0) {
        part.rotation.z = -0.55 + Math.sin(timeElapsed * config.waveFrequency + index) * config.waveAmplitude * 0.6;
      }
      return;
    }

    if (type === "sunflower-side-leaf-b") {
      part.position.set(-0.1, stemHeight * 0.58, -0.03);
      part.scale.set((part.userData.baseScaleX || 0.11) * leafScale, (part.userData.baseScaleY || 0.15) * leafScale, 1);
      part.material.color.copy(leafColor.clone().multiplyScalar(0.92));
      if (timeElapsed > 0) {
        part.rotation.z = 0.5 + Math.sin(timeElapsed * config.waveFrequency * 0.85 + index) * config.waveAmplitude * 0.55;
      }
      return;
    }

    if (type === "sunflower-center") {
      part.position.set(0, stemHeight, 0);
      part.scale.set(0.8 * flowerScale, 0.8 * flowerScale, 0.8 * flowerScale);
      part.material.color.copy(centerColor);
      return;
    }

    if (type === "sunflower-petal") {
      const angle = ((part.userData.petalIndex || 0) / 16) * Math.PI * 2;
      part.position.set(Math.cos(angle) * 0.095, stemHeight, Math.sin(angle) * 0.095);
      part.scale.set(0.72 * flowerScale, 0.72 * flowerScale, 0.72 * flowerScale);
      part.material.color.copy(petalColor);
      if (timeElapsed > 0) {
        part.rotation.x = Math.sin(timeElapsed * config.waveFrequency + index * 0.2) * config.waveAmplitude * 0.3;
      }
    }
  });
}

/**
 * Atualiza arvore (tronco + copa) em tempo real.
 */
function updateTreeModel(treeGroup, growthProgress, timeElapsed = 0) {
  const config = treeGroup.userData.config;
  if (!config) return;

  const heightFactor = getHeightFactorFromGrowthProgress(growthProgress);
  const leafScale = getLeafScaleFromGrowthProgress(growthProgress);
  const totalHeight = config.baseHeight * heightFactor;
  const trunkHeight = Math.max(0.12, totalHeight * 0.62);

  const leafColor = interpolateGrowthColor(
    growthProgress,
    config.color.young,
    config.color.mature,
    config.color.harvestReady
  );
  const trunkColor = interpolateGrowthColor(
    growthProgress,
    config.trunkColor.young,
    config.trunkColor.mature,
    config.trunkColor.harvestReady
  );

  treeGroup.children.forEach((part, index) => {
    if (!part.isMesh) return;
    const partType = part.userData.modelPart;

    if (partType === "tree-trunk") {
      part.scale.y = trunkHeight;
      part.position.y = 0;
      part.material.color.copy(trunkColor);
      return;
    }

    if (partType === "tree-crown-main") {
      part.position.y = trunkHeight + 0.1;
      part.scale.set(0.75 * leafScale, 0.65 * leafScale, 0.75 * leafScale);
      part.material.color.copy(leafColor);
      if (timeElapsed > 0) {
        part.rotation.z = Math.sin(timeElapsed * config.waveFrequency + index) * config.waveAmplitude;
      }
      return;
    }

    if (partType === "tree-crown-secondary") {
      part.position.set(0.14, trunkHeight + 0.1, -0.06);
      part.scale.set(0.7 * leafScale, 0.58 * leafScale, 0.7 * leafScale);
      part.material.color.copy(leafColor.clone().multiplyScalar(0.95));
      if (timeElapsed > 0) {
        part.rotation.x = Math.sin(timeElapsed * config.waveFrequency * 0.75 + index) * config.waveAmplitude * 0.7;
      }
    }
  });
}

// ===== EXPORTAÇÕES =====

export {
  CROP_CONFIGS,
  calculateGrowthProgress,
  calculateGrowthProgressByTime,
  easeGrowthProgress,
  interpolateGrowthColor,
  getLeafScaleFromGrowthProgress,
  getHeightFactorFromGrowthProgress,
  createCropModel,
  updateCropModel,
};

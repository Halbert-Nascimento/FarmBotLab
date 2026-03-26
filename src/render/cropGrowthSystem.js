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
    waveAmplitude: 0.15,        // Amplitude do movimento ondulatório
    waveFrequency: 0.8,         // Frequência do movimento
    density: 1.2,               // Densidade de folhas (multiplicador)
  },
  trigo: {
    // Trigo - planta de crescimento mais lento (futuro)
    type: "trigo",
    displayName: "Trigo",
    color: { young: "#9ccc65", mature: "#689f38", harvestReady: "#f57f17" },
    baseHeight: 0.5,
    growthDays: 20,
    leafCount: 6,
    waveAmplitude: 0.08,
    waveFrequency: 0.6,
    density: 0.9,
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
  const leafWidth = 0.08 + randomSeed * 0.04;  // Largura varia 0.08-0.12
  const leafHeight = 1;
  
  // Cria geometria planar
  const geometry = new THREE.PlaneGeometry(leafWidth, leafHeight);
  
  // Move origem para a base (bottom) da folha para rotacionar corretamente
  geometry.translate(0, leafHeight / 2, 0);
  
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
  
  // Leve rotação em X para dar aparência mais natural
  leaf.rotation.x = -0.2 - randomSeed * 0.3;
  
  // Propósito: dados para atualização de animação futura
  leaf.userData = {
    baseRotationX: leaf.rotation.x,
    waveAmplitude: config.waveAmplitude,
    waveFrequency: config.waveFrequency,
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
      leaf.material.color.copy(currentColor);
      leaf.material.emissive.copy(currentColor.clone().multiplyScalar(0.1));
    }
    
    // Pequena animação de oscilação (vento)
    if (leaf.userData.waveAmplitude && timeElapsed > 0) {
      const wave = Math.sin(timeElapsed * leaf.userData.waveFrequency + index) * 
                   leaf.userData.waveAmplitude;
      leaf.rotation.z = wave;
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

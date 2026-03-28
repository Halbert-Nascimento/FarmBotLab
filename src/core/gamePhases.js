export const MISSION_TREE_NODES_V1 = [
  {
    id: "n01_movimento",
    title: "Movimento Inicial",
    branch: "fundamentos",
    requires: [],
    unlocks: ["api.move"],
    missionIds: ["m01", "m02"],
    tree: { col: 4, row: 0 },
  },
  {
    id: "n02_plantio",
    title: "Plantio Inicial",
    branch: "agricola",
    requires: ["n01_movimento"],
    unlocks: ["api.plant", "crop.capim"],
    missionIds: ["m03", "m04"],
    tree: { col: 2, row: 1 },
  },
  {
    id: "n03_colheita",
    title: "Colheita Inicial",
    branch: "agricola",
    requires: ["n02_plantio"],
    unlocks: ["api.harvest"],
    missionIds: ["m05", "m06"],
    tree: { col: 2, row: 2 },
  },
  {
    id: "n04_condicional_if",
    title: "Decisao com If",
    branch: "logica",
    requires: ["n01_movimento"],
    unlocks: ["lang.if", "lang.comparison.basic"],
    missionIds: ["m07", "m08"],
    tree: { col: 4, row: 1 },
  },
  {
    id: "n05_loop_while",
    title: "Repeticao com While",
    branch: "logica",
    requires: ["n04_condicional_if"],
    unlocks: ["lang.while"],
    missionIds: ["m09", "m10"],
    tree: { col: 4, row: 2 },
  },
  {
    id: "n06_loop_for",
    title: "Repeticao com For",
    branch: "logica",
    requires: ["n05_loop_while"],
    unlocks: ["lang.for"],
    missionIds: ["m11", "m12"],
    tree: { col: 4, row: 3 },
  },
  {
    id: "n07_funcoes",
    title: "Funcoes Basicas",
    branch: "abstracao",
    requires: ["n04_condicional_if"],
    unlocks: ["lang.function"],
    missionIds: ["m13", "m14"],
    tree: { col: 6, row: 2 },
  },
  {
    id: "n08_funcoes_param",
    title: "Funcoes com Parametros",
    branch: "abstracao",
    requires: ["n07_funcoes"],
    unlocks: ["lang.function.params"],
    missionIds: ["m15", "m16"],
    tree: { col: 6, row: 3 },
  },
  {
    id: "n09_arrays",
    title: "Colecoes e Arrays",
    branch: "abstracao",
    requires: ["n08_funcoes_param"],
    unlocks: ["lang.array.basic"],
    missionIds: ["m17"],
    tree: { col: 6, row: 4 },
  },
  {
    id: "n10_estrategia",
    title: "Estrategia de Rotas",
    branch: "otimizacao",
    requires: ["n03_colheita"],
    unlocks: ["strategy.pathing"],
    missionIds: ["m18"],
    tree: { col: 1, row: 3 },
  },
  {
    id: "n11_eficiencia",
    title: "Eficiencia de Execucao",
    branch: "otimizacao",
    requires: ["n10_estrategia"],
    unlocks: ["strategy.efficiency"],
    missionIds: ["m19"],
    tree: { col: 1, row: 4 },
  },
  {
    id: "n12_maestria",
    title: "Maestria",
    branch: "maestria",
    requires: ["n06_loop_for", "n09_arrays", "n11_eficiencia"],
    unlocks: ["mastery.challenge"],
    missionIds: ["m20"],
    tree: { col: 4, row: 5 },
  },
];

export const NODE_LESSONS_V1 = {
  n01_movimento: {
    topic: "Sequencia de instrucoes",
    summary: "Codigo e uma lista de comandos executados de cima para baixo.",
    syntax: 'moverDireita();\nmoverBaixo();',
    example: 'moverDireita();\nmoverDireita();\nmoverBaixo();',
    hints: [
      "Cada comando precisa terminar com ;",
      "Use Executar para rodar o script inteiro.",
    ],
  },
  n02_plantio: {
    topic: "Funcoes de acao",
    summary: "plantar(tipo) executa uma acao no bloco atual.",
    syntax: 'plantar("capim");',
    example: 'moverDireita();\nplantar("capim");',
    hints: [
      "Tipo de cultura e texto entre aspas.",
      "Voce precisa estar na celula alvo antes de plantar.",
    ],
  },
  n03_colheita: {
    topic: "Ciclo basico",
    summary: "Uma rotina simples e mover, plantar e depois colher.",
    syntax: 'plantar("capim");\ncolher();',
    example: 'moverBaixo();\nplantar("capim");\ncolher();',
    hints: [
      "colher() so conta se havia cultura na celula.",
      "Monte sequencias curtas e teste com frequencia.",
    ],
  },
  n04_condicional_if: {
    topic: "Condicionais (if)",
    summary: "if permite escolher entre dois caminhos.",
    syntax: 'var energia = 1;\nif (energia > 0) {\n  plantar("capim");\n} else {\n  colher();\n}',
    example: 'var devePlantar = 1;\nif (devePlantar === 1) {\n  plantar("trigo");\n} else {\n  moverDireita();\n}',
    hints: [
      "Use === para comparar igualdade.",
      "Blocos de if/else usam chaves { }.",
    ],
  },
  n05_loop_while: {
    topic: "Loop while",
    summary: "while repete enquanto a condicao for verdadeira.",
    syntax: 'var i = 0;\nwhile (i < 3) {\n  moverDireita();\n  i = i + 1;\n}',
    example: 'var passos = 0;\nwhile (passos < 2) {\n  plantar("capim");\n  moverBaixo();\n  passos = passos + 1;\n}',
    hints: [
      "Atualize a variavel de controle dentro do loop.",
      "Sem atualizar a variavel, o loop pode travar.",
    ],
  },
  n06_loop_for: {
    topic: "Loop for",
    summary: "for e ideal para repetir um numero fixo de vezes.",
    syntax: 'for (var i = 0; i < 5; i = i + 1) {\n  colher();\n}',
    example: 'for (var i = 0; i < 4; i = i + 1) {\n  plantar("trigo");\n  moverDireita();\n}',
    hints: [
      "No runtime atual, prefira var em loops.",
      "i = i + 1 e o incremento mais compativel.",
    ],
  },
  n07_funcoes: {
    topic: "Criacao de funcoes",
    summary: "Funcoes agrupam passos repetidos em um nome.",
    syntax: 'function plantarLinha() {\n  plantar("capim");\n  moverDireita();\n}\nplantarLinha();',
    example: 'function passo() {\n  moverBaixo();\n  plantar("capim");\n}\npasso();\npasso();',
    hints: [
      "Defina com function nome() { ... }.",
      "Chame a funcao com nome().",
    ],
  },
  n08_funcoes_param: {
    topic: "Parametros",
    summary: "Parametros deixam a funcao reutilizavel para varios cenarios.",
    syntax: 'function plantarTipo(tipo) {\n  plantar(tipo);\n}\nplantarTipo("milho");',
    example: 'function repetir(tipo, vezes) {\n  for (var i = 0; i < vezes; i = i + 1) {\n    plantar(tipo);\n  }\n}\nrepetir("capim", 2);',
    hints: [
      "Parametro e uma variavel de entrada da funcao.",
      "Passe valores ao chamar: funcao(valor).",
    ],
  },
  n09_arrays: {
    topic: "Arrays",
    summary: "Arrays guardam listas de valores e permitem iteracao.",
    syntax: 'var culturas = ["capim", "trigo"];\nplantar(culturas[0]);',
    example: 'var lista = ["capim", "milho", "trigo"];\nfor (var i = 0; i < lista.length; i = i + 1) {\n  plantar(lista[i]);\n}',
    hints: [
      "Indice de array comeca em 0.",
      "lista.length retorna o tamanho da lista.",
    ],
  },
  n10_estrategia: {
    topic: "Planejamento de rota",
    summary: "Organize movimentos para reduzir passos desperdicados.",
    syntax: 'for (var i = 0; i < 3; i = i + 1) {\n  moverDireita();\n  plantar("capim");\n}',
    example: 'function fileira(n) {\n  for (var i = 0; i < n; i = i + 1) {\n    plantar("trigo");\n    moverDireita();\n  }\n}\nfileira(4);',
    hints: [
      "Agrupe tarefas semelhantes em blocos.",
      "Evite ir e voltar sem necessidade.",
    ],
  },
  n11_eficiencia: {
    topic: "Eficiencia",
    summary: "Busque mais resultado com menos comandos.",
    syntax: 'function ciclo(tipo, n) {\n  for (var i = 0; i < n; i = i + 1) {\n    plantar(tipo);\n    colher();\n  }\n}',
    example: 'ciclo("capim", 3);',
    hints: [
      "Reutilize funcoes em vez de duplicar codigo.",
      "Meça progresso por runs, movimentos e colheitas.",
    ],
  },
  n12_maestria: {
    topic: "Composicao de logica",
    summary: "Combine if, loops e funcoes para rotinas completas.",
    syntax: 'function rotina(tipo, n) {\n  var i = 0;\n  while (i < n) {\n    if (i % 2 === 0) {\n      plantar(tipo);\n    } else {\n      colher();\n    }\n    i = i + 1;\n  }\n}',
    example: 'rotina("milho", 4);',
    hints: [
      "Quebre o problema em funcoes pequenas.",
      "Teste partes da rotina antes de unir tudo.",
    ],
  },
};

export const INITIAL_MISSIONS_V1 = [
  {
    id: "m01",
    nodeId: "n01_movimento",
    title: "Primeiro Script",
    objective: "Execute seu primeiro script.",
    requirements: [{ type: "metric", key: "runs", gte: 1 }],
    rewards: ["xp.logic:10"],
  },
  {
    id: "m02",
    nodeId: "n01_movimento",
    title: "Mover no Mapa",
    objective: "Realize 6 movimentos.",
    requirements: [{ type: "metric", key: "moves", gte: 6 }],
    rewards: ["coin:20"],
  },
  {
    id: "m03",
    nodeId: "n02_plantio",
    title: "Primeiro Plantio",
    objective: "Plante 3 culturas no total.",
    requirements: [{ type: "metric", key: "plants", gte: 3 }],
    rewards: ["seed.capim:5"],
  },
  {
    id: "m04",
    nodeId: "n02_plantio",
    title: "Capim em Escala",
    objective: "Plante 2 unidades de capim.",
    requirements: [{ type: "cropPlant", cropType: "capim", gte: 2 }],
    rewards: ["xp.logic:15"],
  },
  {
    id: "m05",
    nodeId: "n03_colheita",
    title: "Primeira Colheita",
    objective: "Realize 1 colheita valida.",
    requirements: [{ type: "metric", key: "harvests", gte: 1 }],
    rewards: ["coin:30"],
  },
  {
    id: "m06",
    nodeId: "n03_colheita",
    title: "Ciclo Plantar-Colher",
    objective: "Alcance 6 plantios e 2 colheitas.",
    requirements: [
      { type: "metric", key: "plants", gte: 6 },
      { type: "metric", key: "harvests", gte: 2 },
    ],
    rewards: ["xp.logic:20"],
  },
  {
    id: "m07",
    nodeId: "n04_condicional_if",
    title: "Rotina Estavel",
    objective: "Execute scripts 4 vezes.",
    requirements: [{ type: "metric", key: "runs", gte: 4 }],
    rewards: ["unlock:lang.if"],
  },
  {
    id: "m08",
    nodeId: "n04_condicional_if",
    title: "Decisao de Campo",
    objective: "Atinga 14 movimentos e 8 plantios.",
    requirements: [
      { type: "metric", key: "moves", gte: 14 },
      { type: "metric", key: "plants", gte: 8 },
    ],
    rewards: ["xp.logic:25"],
  },
  {
    id: "m09",
    nodeId: "n05_loop_while",
    title: "Cadencia de Execucao",
    objective: "Execute scripts 8 vezes.",
    requirements: [{ type: "metric", key: "runs", gte: 8 }],
    rewards: ["unlock:lang.while"],
  },
  {
    id: "m10",
    nodeId: "n05_loop_while",
    title: "Ritmo de Repeticao",
    objective: "Realize 25 movimentos.",
    requirements: [{ type: "metric", key: "moves", gte: 25 }],
    rewards: ["coin:50"],
  },
  {
    id: "m11",
    nodeId: "n06_loop_for",
    title: "Plantio em Serie",
    objective: "Realize 15 plantios.",
    requirements: [{ type: "metric", key: "plants", gte: 15 }],
    rewards: ["unlock:lang.for"],
  },
  {
    id: "m12",
    nodeId: "n06_loop_for",
    title: "Colheita em Serie",
    objective: "Realize 5 colheitas validas.",
    requirements: [{ type: "metric", key: "harvests", gte: 5 }],
    rewards: ["xp.logic:30"],
  },
  {
    id: "m13",
    nodeId: "n07_funcoes",
    title: "Diversidade Basica",
    objective: "Plante 2 tipos distintos de cultura.",
    requirements: [{ type: "uniqueCrops", gte: 2 }],
    rewards: ["unlock:lang.function"],
  },
  {
    id: "m14",
    nodeId: "n07_funcoes",
    title: "Arvore no Campo",
    objective: "Plante 3 unidades de arvore.",
    requirements: [{ type: "cropPlant", cropType: "arvore", gte: 3 }],
    rewards: ["coin:60"],
  },
  {
    id: "m15",
    nodeId: "n08_funcoes_param",
    title: "Diversidade Intermediaria",
    objective: "Plante 3 tipos distintos de cultura.",
    requirements: [{ type: "uniqueCrops", gte: 3 }],
    rewards: ["unlock:lang.function.params"],
  },
  {
    id: "m16",
    nodeId: "n08_funcoes_param",
    title: "Trigo Controlado",
    objective: "Plante 4 unidades de trigo.",
    requirements: [{ type: "cropPlant", cropType: "trigo", gte: 4 }],
    rewards: ["xp.logic:35"],
  },
  {
    id: "m17",
    nodeId: "n09_arrays",
    title: "Milho em Lote",
    objective: "Plante 4 unidades de milho.",
    requirements: [{ type: "cropPlant", cropType: "milho", gte: 4 }],
    rewards: ["unlock:lang.array.basic"],
  },
  {
    id: "m18",
    nodeId: "n10_estrategia",
    title: "Rotas de Producao",
    objective: "Atinga 40 movimentos e 25 plantios.",
    requirements: [
      { type: "metric", key: "moves", gte: 40 },
      { type: "metric", key: "plants", gte: 25 },
    ],
    rewards: ["unlock:strategy.pathing"],
  },
  {
    id: "m19",
    nodeId: "n11_eficiencia",
    title: "Ritmo Eficiente",
    objective: "Execute scripts 15 vezes e colha 10 vezes.",
    requirements: [
      { type: "metric", key: "runs", gte: 15 },
      { type: "metric", key: "harvests", gte: 10 },
    ],
    rewards: ["unlock:strategy.efficiency"],
  },
  {
    id: "m20",
    nodeId: "n12_maestria",
    title: "Dominio da Fazenda",
    objective: "Atinga 60 movimentos, 30 plantios e 12 colheitas.",
    requirements: [
      { type: "metric", key: "moves", gte: 60 },
      { type: "metric", key: "plants", gte: 30 },
      { type: "metric", key: "harvests", gte: 12 },
    ],
    rewards: [
      "unlock:mastery.challenge",
      "unlock:world.expansion.available",
      "unlock:world.evolution.tier1",
      "title:Arquiteto da Automacao",
    ],
  },
];

export const WORLD_SIZE_LADDER_V1 = [
  { width: 1, height: 2 },
  { width: 2, height: 2 },
  { width: 3, height: 3 },
  { width: 4, height: 4 },
  { width: 6, height: 6 },
  { width: 9, height: 9 },
  { width: 12, height: 12 },
  { width: 16, height: 16 },
  { width: 20, height: 20 },
  { width: 24, height: 24 },
  { width: 28, height: 28 },
  { width: 32, height: 32 },
];

function buildExpansionCosts(level) {
  return {
    capim: 3 + level * 2,
    trigo: Math.max(0, level - 1) * 2,
    milho: Math.max(0, level - 2) * 2,
    arvore: Math.max(0, level - 3),
  };
}

function toUpgradeId(width, height) {
  return `upg.world.size.${width}x${height}`;
}

function buildWorldExpansionUpgrades() {
  return WORLD_SIZE_LADDER_V1.slice(1).map((size, index) => {
    const level = index + 1;
    const prev = WORLD_SIZE_LADDER_V1[index];
    const previousUpgradeId = index === 0 ? null : toUpgradeId(prev.width, prev.height);
    const isEarlyTestLevel = level <= 3;
    return {
      id: toUpgradeId(size.width, size.height),
      title: `Expandir Mundo para ${size.width}x${size.height}`,
      description: `Expande o mapa do mundo de ${prev.width}x${prev.height} para ${size.width}x${size.height}.`,
      requiresFeatures: isEarlyTestLevel ? [] : ["world.expansion.available"],
      requiresUpgrades: previousUpgradeId ? [previousUpgradeId] : [],
      unlockRules: isEarlyTestLevel ? [{ type: "metric", key: "moves", gte: 1 }] : [],
      costs: buildExpansionCosts(level),
      worldSize: {
        width: size.width,
        height: size.height,
      },
      effects: [`world.size.${size.width}x${size.height}`],
    };
  });
}

export const WORLD_UPGRADES_V1 = [
  ...buildWorldExpansionUpgrades(),
  {
    id: "upg.crop.growth.speed.t1",
    title: "Crescimento Mais Rapido",
    description: "Reserva melhoria de velocidade para crescimento das plantas.",
    requiresFeatures: ["world.evolution.tier1"],
    requiresUpgrades: [],
    costs: {
      capim: 18,
      milho: 8,
    },
    effects: ["future.crop.growth.speed.t1"],
  },
  {
    id: "upg.harvest.yield.t1",
    title: "Colheita Mais Farta",
    description: "Reserva melhoria para aumentar quantidade por colheita.",
    requiresFeatures: ["world.evolution.tier1"],
    requiresUpgrades: [],
    costs: {
      trigo: 10,
      milho: 10,
    },
    effects: ["future.harvest.yield.t1"],
  },
  {
    id: "upg.drone.speed.t1",
    title: "Drone Mais Rapido",
    description: "Reserva melhoria de velocidade de execucao do drone.",
    requiresFeatures: ["world.evolution.tier1"],
    requiresUpgrades: [],
    costs: {
      capim: 12,
      arvore: 8,
    },
    effects: ["future.drone.speed.t1"],
  },
  {
    id: "upg.debug.system.t1",
    title: "Debug do Sistema",
    description: "Reserva pacote de telemetria e diagnostico para scripts.",
    requiresFeatures: ["world.evolution.tier1"],
    requiresUpgrades: [],
    costs: {
      capim: 8,
      trigo: 8,
      milho: 8,
    },
    effects: ["future.debug.system.t1"],
  },
  {
    id: "upg.dialog.system.t1",
    title: "Caixas de Dialogo",
    description: "Reserva camada de dialogs para guiar futuras mecanicas.",
    requiresFeatures: ["world.evolution.tier1"],
    requiresUpgrades: [],
    costs: {
      capim: 8,
      trigo: 8,
      arvore: 4,
    },
    effects: ["future.dialog.system.t1"],
  },
];

function cloneNode(node) {
  return {
    ...node,
    requires: [...(node.requires || [])],
    unlocks: [...(node.unlocks || [])],
    missionIds: [...(node.missionIds || [])],
    tree: node.tree
      ? {
          col: node.tree.col,
          row: node.tree.row,
        }
      : null,
  };
}

function cloneMission(mission) {
  return {
    ...mission,
    requirements: [...(mission.requirements || [])],
    rewards: [...(mission.rewards || [])],
  };
}

function createInitialStats() {
  return {
    runs: 0,
    moves: 0,
    plants: 0,
    harvests: 0,
    plantsByCrop: {},
    itemsByType: {},
  };
}

function cloneUpgrade(upgrade) {
  return {
    ...upgrade,
    requiresFeatures: [...(upgrade.requiresFeatures || [])],
    requiresUpgrades: [...(upgrade.requiresUpgrades || [])],
    unlockRules: [...(upgrade.unlockRules || [])],
    costs: {
      ...(upgrade.costs || {}),
    },
    worldSize: upgrade.worldSize
      ? {
          width: upgrade.worldSize.width,
          height: upgrade.worldSize.height,
        }
      : null,
    effects: [...(upgrade.effects || [])],
  };
}

function collectMissingCosts(costs, inventory) {
  const missing = {};
  Object.entries(costs || {}).forEach(([itemId, qty]) => {
    const current = inventory[itemId] || 0;
    if (current < qty) {
      missing[itemId] = qty - current;
    }
  });
  return missing;
}

function hasAnyMissingCosts(missingCosts) {
  return Object.keys(missingCosts || {}).length > 0;
}

function evaluateUpgradeUnlockRules(unlockRules, stats) {
  return (unlockRules || []).every((rule) => evaluateRequirement(rule, stats));
}

function buildNodeIndex(nodes) {
  const map = new Map();
  nodes.forEach((node, index) => {
    map.set(node.id, { ...node, index });
  });
  return map;
}

function buildMissionIndex(missions) {
  const map = new Map();
  missions.forEach((mission, index) => {
    map.set(mission.id, { ...mission, index });
  });
  return map;
}

function getMetricValue(stats, key) {
  if (key === "runs") return stats.runs;
  if (key === "moves") return stats.moves;
  if (key === "plants") return stats.plants;
  if (key === "harvests") return stats.harvests;
  return 0;
}

function evaluateRequirement(requirement, stats) {
  if (requirement.type === "metric") {
    const value = getMetricValue(stats, requirement.key);
    return value >= requirement.gte;
  }

  if (requirement.type === "cropPlant") {
    const current = stats.plantsByCrop[requirement.cropType] || 0;
    return current >= requirement.gte;
  }

  if (requirement.type === "uniqueCrops") {
    const count = Object.keys(stats.plantsByCrop).filter((crop) => (stats.plantsByCrop[crop] || 0) > 0).length;
    return count >= requirement.gte;
  }

  return false;
}

function getMissionProgressLabel(mission, stats) {
  const parts = (mission.requirements || []).map((req) => {
    if (req.type === "metric") {
      const current = getMetricValue(stats, req.key);
      return `${req.key} ${current}/${req.gte}`;
    }

    if (req.type === "cropPlant") {
      const current = stats.plantsByCrop[req.cropType] || 0;
      return `${req.cropType} ${current}/${req.gte}`;
    }

    if (req.type === "uniqueCrops") {
      const count = Object.keys(stats.plantsByCrop).filter((crop) => (stats.plantsByCrop[crop] || 0) > 0).length;
      return `culturas ${count}/${req.gte}`;
    }

    return "req-desconhecido";
  });

  return parts.join(" | ");
}

function getLessonByNodeId(nodeId) {
  return NODE_LESSONS_V1[nodeId] || null;
}

function decorateMissionForView(mission, stats, isUnlocked, isCompleted) {
  const lesson = getLessonByNodeId(mission.nodeId);
  return {
    ...mission,
    isUnlocked,
    isCompleted,
    progressLabel: getMissionProgressLabel(mission, stats),
    description: mission.description || mission.objective,
    hints: Array.isArray(mission.hints) && mission.hints.length > 0 ? mission.hints : lesson && lesson.hints ? lesson.hints : [],
    lesson,
  };
}

export function createGamePhases({
  onLog,
  onPhaseChanged,
  nodes = MISSION_TREE_NODES_V1,
  missions = INITIAL_MISSIONS_V1,
  worldUpgrades = WORLD_UPGRADES_V1,
} = {}) {
  const nodeList = nodes.map(cloneNode);
  const missionList = missions.map(cloneMission);
  const worldUpgradeList = worldUpgrades.map(cloneUpgrade);
  const worldUpgradeById = new Map(worldUpgradeList.map((upgrade) => [upgrade.id, upgrade]));
  const nodeById = buildNodeIndex(nodeList);
  const missionById = buildMissionIndex(missionList);

  const unlockedNodeIds = new Set([nodeList[0].id]);
  const completedNodeIds = new Set();
  const completedMissionIds = new Set();
  const unlockedRewardFeatureIds = new Set();
  const purchasedWorldUpgradeIds = new Set();
  let currentWorldSize = {
    width: WORLD_SIZE_LADDER_V1[0].width,
    height: WORLD_SIZE_LADDER_V1[0].height,
  };
  let stats = createInitialStats();

  function isNodeUnlocked(nodeId) {
    return unlockedNodeIds.has(nodeId);
  }

  function isMissionUnlocked(mission) {
    return isNodeUnlocked(mission.nodeId);
  }

  function getNodeMissions(nodeId) {
    return missionList.filter((mission) => mission.nodeId === nodeId);
  }

  function isNodeCompleted(nodeId) {
    const nodeMissions = getNodeMissions(nodeId);
    if (nodeMissions.length === 0) return false;
    return nodeMissions.every((mission) => completedMissionIds.has(mission.id));
  }

  function recomputeCompletedNodes() {
    let changed = false;
    nodeList.forEach((node) => {
      if (!completedNodeIds.has(node.id) && isNodeCompleted(node.id)) {
        completedNodeIds.add(node.id);
        changed = true;
      }
    });
    return changed;
  }

  function tryUnlockNodes() {
    let changed = false;
    nodeList.forEach((node) => {
      if (unlockedNodeIds.has(node.id)) return;
      const canUnlock = (node.requires || []).every((requiredNodeId) => completedNodeIds.has(requiredNodeId));
      if (canUnlock) {
        unlockedNodeIds.add(node.id);
        changed = true;
        if (typeof onLog === "function") {
          onLog(`No desbloqueado: ${node.title}.`);
          onLog(`Features liberadas: ${(node.unlocks || []).join(", ")}`);
        }
      }
    });
    return changed;
  }

  function getCurrentNode() {
    const unlocked = nodeList.filter((node) => unlockedNodeIds.has(node.id));
    const firstUnfinished = unlocked.find((node) => !completedNodeIds.has(node.id));
    return firstUnfinished || unlocked[unlocked.length - 1] || nodeList[0];
  }

  function getUnlockedFeatures() {
    const features = new Set();
    nodeList.forEach((node) => {
      if (!unlockedNodeIds.has(node.id)) return;
      (node.unlocks || []).forEach((f) => features.add(f));
    });
    unlockedRewardFeatureIds.forEach((f) => features.add(f));
    return Array.from(features);
  }

  function applyMissionRewards(mission) {
    (mission.rewards || []).forEach((reward) => {
      if (typeof reward !== "string") return;

      if (reward.startsWith("unlock:")) {
        const feature = reward.slice("unlock:".length).trim();
        if (!feature) return;
        const wasNew = !unlockedRewardFeatureIds.has(feature);
        unlockedRewardFeatureIds.add(feature);
        if (wasNew && typeof onLog === "function") {
          onLog(`Recurso desbloqueado por missao: ${feature}`);
        }
      }
    });
  }

  function evaluateMissions() {
    let completedNow = [];
    missionList.forEach((mission) => {
      if (completedMissionIds.has(mission.id)) return;
      if (!isMissionUnlocked(mission)) return;

      const ok = (mission.requirements || []).every((req) => evaluateRequirement(req, stats));
      if (ok) {
        completedMissionIds.add(mission.id);
        applyMissionRewards(mission);
        completedNow.push(mission);
      }
    });

    if (completedNow.length > 0 && typeof onLog === "function") {
      completedNow.forEach((mission) => {
        onLog(`Missao concluida: ${mission.title} (${mission.id}).`);
      });
    }

    return completedNow;
  }

  function emitPhaseChanged(reason) {
    if (typeof onPhaseChanged === "function") {
      onPhaseChanged({
        reason,
        phase: getCurrentPhase(),
      });
    }
  }

  function processProgress(reason = "progress") {
    const completedMissions = evaluateMissions();
    const completedNodeChanged = recomputeCompletedNodes();
    const unlockedNodeChanged = tryUnlockNodes();

    if (completedMissions.length > 0 || completedNodeChanged || unlockedNodeChanged) {
      emitPhaseChanged(reason);
    }
  }

  function recordEvent(type, payload = {}) {
    if (type === "run") stats.runs += 1;
    if (type === "move") stats.moves += 1;
    if (type === "plant") {
      stats.plants += 1;
      const cropType = payload.cropType || "generic";
      stats.plantsByCrop[cropType] = (stats.plantsByCrop[cropType] || 0) + 1;
    }
    if (type === "harvest") {
      stats.harvests += 1;
      const cropType = payload.cropType || "generic";
      stats.itemsByType[cropType] = (stats.itemsByType[cropType] || 0) + 1;
    }

    processProgress("event");
  }

  function getItemInventory() {
    return Object.entries(stats.itemsByType)
      .filter(([, qty]) => qty > 0)
      .map(([itemId, quantity]) => ({ itemId, quantity }))
      .sort((a, b) => a.itemId.localeCompare(b.itemId));
  }

  function getWorldUpgrades() {
    const featureSet = new Set(getUnlockedFeatures());
    return worldUpgradeList.map((upgrade) => {
      const isPurchased = purchasedWorldUpgradeIds.has(upgrade.id);
      const isUnlocked = (upgrade.requiresFeatures || []).every((feature) => featureSet.has(feature));
      const requirementsMet = (upgrade.requiresUpgrades || []).every((requiredId) =>
        purchasedWorldUpgradeIds.has(requiredId)
      );
      const rulesMet = evaluateUpgradeUnlockRules(upgrade.unlockRules, stats);
      const missingCosts = collectMissingCosts(upgrade.costs, stats.itemsByType);
      const canAfford = !hasAnyMissingCosts(missingCosts);

      return {
        ...upgrade,
        isPurchased,
        isUnlocked: isUnlocked && requirementsMet && rulesMet,
        canAfford: isUnlocked && requirementsMet && rulesMet && !isPurchased && canAfford,
        missingCosts,
      };
    });
  }

  function getWorldState() {
    const index = WORLD_SIZE_LADDER_V1.findIndex(
      (entry) => entry.width === currentWorldSize.width && entry.height === currentWorldSize.height
    );

    return {
      width: currentWorldSize.width,
      height: currentWorldSize.height,
      levelIndex: index >= 0 ? index : 0,
      maxLevelIndex: WORLD_SIZE_LADDER_V1.length - 1,
      purchasedUpgradeIds: Array.from(purchasedWorldUpgradeIds),
    };
  }

  function purchaseWorldUpgrade(upgradeId) {
    const upgrade = worldUpgradeById.get(upgradeId);
    if (!upgrade) {
      return { ok: false, reason: "invalid-upgrade" };
    }

    if (purchasedWorldUpgradeIds.has(upgradeId)) {
      return { ok: false, reason: "already-purchased" };
    }

    const featureSet = new Set(getUnlockedFeatures());
    const isUnlocked = (upgrade.requiresFeatures || []).every((feature) => featureSet.has(feature));
    if (!isUnlocked) {
      return { ok: false, reason: "locked-upgrade" };
    }

    const requirementsMet = (upgrade.requiresUpgrades || []).every((requiredId) =>
      purchasedWorldUpgradeIds.has(requiredId)
    );
    if (!requirementsMet) {
      return { ok: false, reason: "missing-upgrade-prereq" };
    }

    const rulesMet = evaluateUpgradeUnlockRules(upgrade.unlockRules, stats);
    if (!rulesMet) {
      return { ok: false, reason: "missing-upgrade-rules" };
    }

    const missingCosts = collectMissingCosts(upgrade.costs, stats.itemsByType);
    if (hasAnyMissingCosts(missingCosts)) {
      return {
        ok: false,
        reason: "insufficient-items",
        missingCosts,
      };
    }

    Object.entries(upgrade.costs || {}).forEach(([itemId, qty]) => {
      stats.itemsByType[itemId] = Math.max(0, (stats.itemsByType[itemId] || 0) - qty);
    });

    purchasedWorldUpgradeIds.add(upgradeId);

    if (upgrade.worldSize && Number.isFinite(upgrade.worldSize.width) && Number.isFinite(upgrade.worldSize.height)) {
      currentWorldSize = {
        width: upgrade.worldSize.width,
        height: upgrade.worldSize.height,
      };
      if (typeof onLog === "function") {
        onLog(`Novo tamanho de mundo ativo: ${currentWorldSize.width}x${currentWorldSize.height}`);
      }
    }

    if (typeof onLog === "function") {
      onLog(`Melhoria comprada: ${upgrade.title}`);
    }

    emitPhaseChanged("world-upgrade");
    return {
      ok: true,
      upgrade: {
        ...upgrade,
      },
      worldState: getWorldState(),
      inventory: getItemInventory(),
    };
  }

  function getCurrentPhase() {
    const node = getCurrentNode();
    return {
      ...node,
      index: nodeById.get(node.id).index,
      progress: {
        ...stats,
        plantsByCrop: {
          ...stats.plantsByCrop,
        },
        itemsByType: {
          ...stats.itemsByType,
        },
      },
      progressLabel: `${completedMissionIds.size}/${missionList.length} missoes concluidas`,
      completedMissionCount: completedMissionIds.size,
      totalMissionCount: missionList.length,
    };
  }

  function getAllPhases() {
    return nodeList.map((node, index) => ({
      ...node,
      index,
      isCurrent: node.id === getCurrentNode().id,
      isUnlocked: unlockedNodeIds.has(node.id),
      isCompleted: completedNodeIds.has(node.id),
      completedMissions: getNodeMissions(node.id).filter((mission) => completedMissionIds.has(mission.id)).length,
      totalMissions: getNodeMissions(node.id).length,
    }));
  }

  function getMissionTree() {
    return nodeList.map((node) => ({
      ...node,
      isUnlocked: unlockedNodeIds.has(node.id),
      isCompleted: completedNodeIds.has(node.id),
      missions: getNodeMissions(node.id).map((mission) => ({
        ...decorateMissionForView(
          mission,
          stats,
          isMissionUnlocked(mission),
          completedMissionIds.has(mission.id)
        ),
      })),
    }));
  }

  function getMissions() {
    return missionList.map((mission) =>
      decorateMissionForView(
        mission,
        stats,
        isMissionUnlocked(mission),
        completedMissionIds.has(mission.id)
      )
    );
  }

  function getActiveMissions(limit = 5) {
    const active = getMissions().filter((mission) => mission.isUnlocked && !mission.isCompleted);
    return active.slice(0, Math.max(1, limit));
  }

  function advancePhase(reason = "manual") {
    const current = getCurrentNode();
    const currentIdx = nodeById.get(current.id).index;
    const next = nodeList[currentIdx + 1];
    if (!next) return false;

    unlockedNodeIds.add(next.id);
    if (typeof onLog === "function") {
      onLog(`No liberado manualmente: ${next.title}.`);
    }

    emitPhaseChanged(reason);
    return true;
  }

  function setPhase(value) {
    let targetNode = null;

    if (typeof value === "number" && Number.isInteger(value)) {
      targetNode = nodeList[value] || null;
    } else if (typeof value === "string") {
      targetNode = nodeById.get(value) || null;
    }

    if (!targetNode) return { ok: false, reason: "invalid-phase" };

    const targetIndex = typeof targetNode.index === "number" ? targetNode.index : nodeById.get(targetNode.id).index;
    for (let i = 0; i <= targetIndex; i += 1) {
      unlockedNodeIds.add(nodeList[i].id);
    }

    emitPhaseChanged("manual-set");
    return { ok: true, phase: getCurrentPhase() };
  }

  function resetProgress({ keepUnlockedNodes = false } = {}) {
    stats = createInitialStats();
    completedMissionIds.clear();
    completedNodeIds.clear();
    unlockedRewardFeatureIds.clear();
    purchasedWorldUpgradeIds.clear();
    currentWorldSize = {
      width: WORLD_SIZE_LADDER_V1[0].width,
      height: WORLD_SIZE_LADDER_V1[0].height,
    };

    if (!keepUnlockedNodes) {
      unlockedNodeIds.clear();
      unlockedNodeIds.add(nodeList[0].id);
    }

    emitPhaseChanged("reset");
    if (typeof onLog === "function") {
      onLog("Progresso de missoes/fases resetado.");
    }
  }

  processProgress("init");

  return {
    getCurrentPhase,
    getAllPhases,
    getUnlockedFeatures,
    getItemInventory,
    getWorldState,
    getWorldUpgrades,
    purchaseWorldUpgrade,
    getMissionTree,
    getMissions,
    getActiveMissions,
    recordEvent,
    advancePhase,
    setPhase,
    resetProgress,
  };
}

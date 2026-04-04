/**
 * gameController.js
 *
 * Camada de orquestração entre programRunner, farmWorld e gamePhases.
 * Responsável exclusivamente por lógica de jogo: movimentação, plantio,
 * colheita, registro de eventos e notificação de UI.
 *
 * O main.js passa a ser apenas ponte (UI binding) — não toma decisões de jogo.
 */

// Mapeamento de comandos: aliases em português/inglês → tipo interno (inglês)
const COMMAND_ALIASES = {
  // Movimento
  right:    "right",
  left:     "left",
  up:       "up",
  down:     "down",
  direita:  "right",
  esquerda: "left",
  cima:     "up",
  baixo:    "down",
  // Ações
  plant:    "plant",
  plantar:  "plant",
  harvest:  "harvest",
  colher:   "harvest",
};

// Feature requerida para plantar cada cultura.
// Se a feature não existir na lista de desbloqueados, o plantio é bloqueado.
// Culturas sem entry aqui são sempre liberadas (sem trava).
const CROP_REQUIRED_FEATURE = {
  capim:   "crop.capim",
  trigo:   "crop.trigo",
  milho:   "crop.milho",
  arvore:  "crop.arvore",
  girasol: "crop.girasol",
  morango: "crop.morango",
};

// Rótulos em PT para exibição nas mensagens do logger.
const CROP_LABELS = {
  capim:   "Capim",
  trigo:   "Trigo",
  milho:   "Milho",
  arvore:  "Árvore",
  girasol: "Girassol",
  morango: "Morango",
  generic: "Cultura",
};

// Solos compatíveis por cultura.
// Se a lista estiver vazia ou ausente, qualquer solo é aceito.
// "any" é um curinga explícito.
const CROP_SOIL_COMPAT = {
  capim:   ["any"],
  trigo:   ["loam", "clay"],
  milho:   ["loam", "clay", "sandy-loam"],
  arvore:  ["loam"],
  girasol: ["loam", "sandy-loam", "clay"],
  morango: ["loam", "sandy-loam"],
  generic: ["any"],
};

/**
 * @param {object} deps
 * @param {import('./farmWorld.js').FarmWorld} deps.world
 * @param {object}   deps.gamePhases  — instância criada por createGamePhases()
 * @param {object}   deps.view        — instância criada por createThreeFarmView()
 * @param {Function} deps.onLog       — função de log (string) → void
 * @param {Function} deps.onUIUpdate  — callback disparado após cada ação para atualizar HUD/inventário
 */
export function createGameController({ world, gamePhases, view, onLog, onUIUpdate }) {

  // ─── helpers internos ────────────────────────────────────────────────────────

  function resolveType(raw) {
    return COMMAND_ALIASES[raw] ?? raw;
  }

  function notifyUI() {
    if (typeof onUIUpdate === "function") onUIUpdate();
  }

  function log(msg) {
    if (typeof onLog === "function") onLog(msg);
  }

  // ─── handlers de ação ────────────────────────────────────────────────────────

  async function handleMove(dx, dy) {
    const result = world.moveBy(dx, dy);
    if (result.moved) {
      gamePhases.recordEvent("move");
      await view.animateMove(result.from, result.to);
      log(`Moveu para (${result.to.x}, ${result.to.y})`);
    } else {
      log("Bateu na borda da fazenda");
    }
    notifyUI();
  }

  // Tempo de maturidade (em ms) por tipo de cultura.
  // Quando upgrades de velocidade forem implementados, alimentar via gamePhases.
  const CROP_MATURITY_MS = {
    capim:    15000,
    trigo:    20000,
    milho:    25000,
    arvore:   40000,
    girasol:  18000,
    morango:  22000,
  };

  // ─── validações de plantio ────────────────────────────────────────────────

  function checkCropUnlocked(cropType) {
    const requiredFeature = CROP_REQUIRED_FEATURE[cropType];
    if (!requiredFeature) return { ok: true }; // sem trava definida

    const unlockedFeatures = gamePhases.getUnlockedFeatures();
    if (unlockedFeatures.includes(requiredFeature)) return { ok: true };

    const label = CROP_LABELS[cropType] || cropType;
    return {
      ok: false,
      reason: "locked",
      message: `🔒 ${label} ainda não foi desbloqueado na Árvore de Desenvolvimento.`,
    };
  }

  function checkSoilCompat(cropType, soilType) {
    const compat = CROP_SOIL_COMPAT[cropType] || ["any"];
    if (compat.includes("any")) return { ok: true };

    const resolved = soilType || "loam";
    if (compat.includes(resolved)) return { ok: true };

    const label = CROP_LABELS[cropType] || cropType;
    return {
      ok: false,
      reason: "soil",
      message: `❌ Solo incompatível para ${label}. Solos aceitos: ${compat.join(", ")}.`,
    };
  }

  // ─── handlers de ação ────────────────────────────────────────────────────────

  async function handlePlant(args) {
    const cropArg = Array.isArray(args) && args.length > 0 ? args[0] : "generic";
    const cropType =
      typeof cropArg === "string" && cropArg.trim()
        ? cropArg.trim().toLowerCase()
        : "generic";

    // 1. Trava de desbloqueio
    const unlockCheck = checkCropUnlocked(cropType);
    if (!unlockCheck.ok) {
      log(unlockCheck.message);
      notifyUI();
      return;
    }

    // 2. Compatibilidade de solo
    const snapshot = world.getSnapshot();
    const pos = snapshot.position;
    const soilEntry = snapshot.soils.find((s) => s.x === pos.x && s.y === pos.y);
    const soilType = soilEntry ? soilEntry.soil.type : "loam";
    const soilCheck = checkSoilCompat(cropType, soilType);
    if (!soilCheck.ok) {
      log(soilCheck.message);
      notifyUI();
      return;
    }

    const result = world.plant(cropType);
    gamePhases.recordEvent("plant", { cropType: result.crop.type });
    view.setCrop(result.x, result.y, result.crop.type, result.crop.plantedAt);
    log(`Plantou ${result.crop.type} em (${result.x}, ${result.y})`);
    notifyUI();
  }

  async function handleHarvest() {
    const result = world.harvest();

    if (!result.wasPlanted) {
      view.setCrop(result.x, result.y, null);
      log(`Colheu em (${result.x}, ${result.y})`);
      notifyUI();
      return;
    }

    const cropType =
      result.harvestedCrop && result.harvestedCrop.type
        ? result.harvestedCrop.type
        : "generic";

    // Verificar maturidade pelo timestamp real
    const maturityMs = CROP_MATURITY_MS[cropType] || 15000;
    const plantedAt = result.harvestedCrop && result.harvestedCrop.plantedAt
      ? result.harvestedCrop.plantedAt
      : 0;
    const isRipe = (Date.now() - plantedAt) >= maturityMs;

    view.setCrop(result.x, result.y, null);

    if (isRipe) {
      gamePhases.recordEvent("harvest", { cropType });
      log(`Colheu ${cropType} em (${result.x}, ${result.y})`);
    } else {
      // Colheita imatura: planta é removida mas item não entra no inventário
      log(`⚠️ A cultura ainda não amadureceu! Você perdeu a semente.`);
    }

    notifyUI();
  }

  // ─── dispatcher principal ────────────────────────────────────────────────────

  /**
   * Executa uma ação de jogo (assíncrono — pode animar).
   * Aceita string simples ("right") ou objeto { type, args }.
   */
  async function executeAction(action) {
    const command =
      typeof action === "string" ? { type: action, args: [] } : action;
    const actionType = resolveType(command.type);

    switch (actionType) {
      case "right":   return handleMove(1, 0);
      case "left":    return handleMove(-1, 0);
      case "up":      return handleMove(0, -1);
      case "down":    return handleMove(0, 1);
      case "plant":   return handlePlant(command.args);
      case "harvest": return handleHarvest();
      default:
        log(`Ação desconhecida: ${command.type}`);
    }
  }

  // ─── consultas de estado (síncrono — retorna valor) ──────────────────────

  /**
   * Responde a uma consulta síncrona da sandbox (sensores).
   * @param {{ type: string, args: any[] }} query
   * @returns {*} valor primitivo JS (string | number | boolean | null)
   */
  function queryState(query) {
    const snapshot = world.getSnapshot();
    const pos = snapshot.position;

    switch (query.type) {
      case "getCrop": {
        const entry = snapshot.crops.find(function (c) { return c.x === pos.x && c.y === pos.y; });
        return entry ? entry.crop.type : null;
      }

      case "getSoilType": {
        const soil = snapshot.soils.find(function (s) { return s.x === pos.x && s.y === pos.y; });
        return soil ? soil.soil.type : null;
      }

      case "getPosX":
        return pos.x;

      case "getPosY":
        return pos.y;

      case "isRipe": {
        const crop = snapshot.crops.find(function (c) { return c.x === pos.x && c.y === pos.y; });
        if (!crop) return false;
        var maturityMs = CROP_MATURITY_MS[crop.crop.type] || 15000;
        var plantedAt = crop.crop.plantedAt || 0;
        return (Date.now() - plantedAt) >= maturityMs;
      }

      case "getWorldWidth":
        return snapshot.dimensions.width;

      case "getWorldHeight":
        return snapshot.dimensions.height;

      case "getItemCount": {
        var itemId = Array.isArray(query.args) && query.args.length > 0
          ? String(query.args[0]).toLowerCase()
          : null;
        if (!itemId) return 0;
        var inventory = gamePhases.getItemInventory();
        var row = inventory.find(function (r) { return r.itemId === itemId; });
        return row ? row.quantity : 0;
      }

      case "getCurrentTurn":
        return snapshot.turn;

      default:
        return null;
    }
  }

  return { executeAction, queryState };
}

import { createFarmWorld } from "./core/farmWorld.js";
import { createProgramRunner } from "./core/programRunner.js";
import { createGamePhases } from "./core/gamePhases.js";
import { createThreeFarmView } from "./render/threeFarmView.js";
import { createEditor } from "./ui/editor.js";
import { createLogger } from "./ui/logger.js";
import { createProgressionUI } from "./ui/progressionUI.js";

const DEBUG_ALERTS = true;
const GRID_SIZE = 8;

// Configuração central de crescimento (ajustável sem alterar lógica interna da renderização).
const CROP_GROWTH_SETTINGS = {
  globalTimeScale: 1,
  perCropDurationSeconds: {
    capim: 15,
  },
};

const DEFAULT_CODE = `
  moverDireita();
  plantar("arvore");
  moverBaixo();
  plantar("arvore");
  moverBaixo();
  plantar("capim");
  moverDireita();
  colher();
`;

const logEl = document.querySelector("#log");
const runBtn = document.querySelector("#runBtn");
const stopBtn = document.querySelector("#stopBtn");
const resetBtn = document.querySelector("#resetBtn");
const zoomSlider = document.querySelector("#zoomSlider");
const avatarSelect = document.querySelector("#avatarSelect");
const sceneRoot = document.querySelector("#scene");

function debugAlert(message) {
  if (!DEBUG_ALERTS) return;
  alert(`[DEBUG] ${message}`);
}

const logger = createLogger(logEl);

let progressionUI = null;

const gamePhases = createGamePhases({
  onLog: logger.append,
  onPhaseChanged: ({ phase }) => {
    logger.append(`No atual: ${phase.title}`);
    logger.append(`Progresso geral: ${phase.progressLabel}`);
    if (progressionUI) {
      progressionUI.render();
    }
  },
});

progressionUI = createProgressionUI({
  gamePhases,
  onLog: logger.append,
});

const editor = createEditor({
  rootId: "editor",
  defaultCode: DEFAULT_CODE,
  onDebugError: debugAlert,
});

const world = createFarmWorld({
  gridSize: GRID_SIZE,
  defaultSoilType: "loam",
  defaultSoilLevels: {
    water: 45,
    nutrients: 52,
    ph: 6.4,
  },
});

const view = createThreeFarmView({
  sceneRoot,
  gridSize: GRID_SIZE,
  avatarType: avatarSelect ? avatarSelect.value : "drone",
  initialZoom: Number(zoomSlider.value),
  // Envia configurações de crescimento para o sistema visual.
  cropGrowthSettings: CROP_GROWTH_SETTINGS,
  onLog: logger.append,
  onDebugError: debugAlert,
});

async function performAction(action) {
  const command = typeof action === "string" ? { type: action, args: [] } : action;
  const actionType = command.type;

  if (actionType === "right") {
    const result = world.moveBy(1, 0);
    if (result.moved) {
      gamePhases.recordEvent("move");
      await view.animateMove(result.from, result.to);
      logger.append(`Moveu para (${result.to.x}, ${result.to.y})`);
    } else {
      logger.append("Bateu na borda da fazenda");
    }
    return;
  }

  if (actionType === "left") {
    const result = world.moveBy(-1, 0);
    if (result.moved) {
      gamePhases.recordEvent("move");
      await view.animateMove(result.from, result.to);
      logger.append(`Moveu para (${result.to.x}, ${result.to.y})`);
    } else {
      logger.append("Bateu na borda da fazenda");
    }
    return;
  }

  if (actionType === "up") {
    const result = world.moveBy(0, -1);
    if (result.moved) {
      gamePhases.recordEvent("move");
      await view.animateMove(result.from, result.to);
      logger.append(`Moveu para (${result.to.x}, ${result.to.y})`);
    } else {
      logger.append("Bateu na borda da fazenda");
    }
    return;
  }

  if (actionType === "down") {
    const result = world.moveBy(0, 1);
    if (result.moved) {
      gamePhases.recordEvent("move");
      await view.animateMove(result.from, result.to);
      logger.append(`Moveu para (${result.to.x}, ${result.to.y})`);
    } else {
      logger.append("Bateu na borda da fazenda");
    }
    return;
  }

  if (actionType === "plant") {
    const cropArg = command.args && command.args.length > 0 ? command.args[0] : "generic";
    const cropType = typeof cropArg === "string" && cropArg.trim() ? cropArg.trim().toLowerCase() : "generic";
    const result = world.plant(cropType);
    gamePhases.recordEvent("plant", { cropType: result.crop.type });
    view.setCrop(result.x, result.y, result.crop.type);
    logger.append(`Plantou ${result.crop.type} em (${result.x}, ${result.y})`);
    return;
  }

  if (actionType === "harvest") {
    const result = world.harvest();
    if (result.wasPlanted) {
      const cropType = result.harvestedCrop && result.harvestedCrop.type ? result.harvestedCrop.type : "generic";
      gamePhases.recordEvent("harvest", { cropType });
    }
    view.setCrop(result.x, result.y, null);
    logger.append(`Colheu em (${result.x}, ${result.y})`);
  }
}

const runner = createProgramRunner({
  getCode: editor.getValue,
  onAction: performAction,
  onLog: logger.append,
  onDebugError: debugAlert,
});

function resetWorld() {
  runner.reset();
  world.reset();
  logger.clear();
  view.reset(world.getSnapshot());
  logger.append("Mundo resetado");
}

function setupDebugHooks() {
  window.addEventListener("error", (event) => {
    const msg = `Erro global: ${event.message}`;
    logger.append(msg);
    debugAlert(msg);
  });

  window.addEventListener("unhandledrejection", (event) => {
    const raw = event.reason && event.reason.message ? event.reason.message : String(event.reason);
    const msg = `Promise rejeitada: ${raw}`;
    logger.append(msg);
    debugAlert(msg);
  });
}

// API global para manutenção/testes: permite ajustar velocidade e duração em runtime.
// Ex.: window.setCropGrowthSettings({ globalTimeScale: 1.5, perCropDurationSeconds: { capim: 10 } })
window.setCropGrowthSettings = (patch) => {
  view.setCropGrowthSettings(patch || {});
};

runBtn.addEventListener("click", () => {
  gamePhases.recordEvent("run");
  runner.run();
});

stopBtn.addEventListener("click", () => {
  runner.stop();
});

resetBtn.addEventListener("click", resetWorld);

zoomSlider.addEventListener("input", () => {
  view.setZoom(Number(zoomSlider.value));
});

if (avatarSelect) {
  avatarSelect.addEventListener("change", () => {
    view.setAvatarType(avatarSelect.value);
  });
}

window.addEventListener("resize", () => {
  view.resize();
});

setupDebugHooks();
resetWorld();
view.resize();
progressionUI.render();

window.gamePhases = {
  getCurrent: () => gamePhases.getCurrentPhase(),
  getAll: () => gamePhases.getAllPhases(),
  getTree: () => gamePhases.getMissionTree(),
  getMissions: () => gamePhases.getMissions(),
  getActiveMissions: (limit) => gamePhases.getActiveMissions(limit),
  getUnlockedFeatures: () => gamePhases.getUnlockedFeatures(),
  getItemInventory: () => gamePhases.getItemInventory(),
  getWorldUpgrades: () => gamePhases.getWorldUpgrades(),
  buyWorldUpgrade: (upgradeId) => gamePhases.purchaseWorldUpgrade(upgradeId),
  advance: () => gamePhases.advancePhase("manual-console"),
  setPhase: (value) => gamePhases.setPhase(value),
  resetProgress: (options) => gamePhases.resetProgress(options || {}),
};

logger.append("Sistema de fases/missoes habilitado. Use window.gamePhases para inspecionar/prototipar.");
logger.append("Evolucao manual habilitada: use getWorldUpgrades(), getItemInventory() e buyWorldUpgrade(id).");

import { createFarmWorld } from "./core/farmWorld.js";
import { createProgramRunner } from "./core/programRunner.js";
import { createGamePhases } from "./core/gamePhases.js";
import { createThreeFarmView } from "./render/threeFarmView.js";
import { createEditor } from "./ui/editor.js";
import { createLogger } from "./ui/logger.js";
import { createProgressionUI } from "./ui/progressionUI.js";

const DEBUG_ALERTS = true;

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
const inventoryHudEl = document.querySelector("#inventoryHud");
const scenePanelEl = document.querySelector(".scene-panel");

const INVENTORY_ITEM_ORDER = [
  "capim",
  "trigo",
  "arvore",
  "girasol",
  "morango",
  "milho",
];

const INVENTORY_ITEM_LABELS = {
  capim: "Capim",
  trigo: "Trigo",
  arvore: "Arvore",
  girasol: "Girassol",
  milho: "Milho",
  morango: "Morango",
};

const INVENTORY_ITEM_ICONS = {
  capim: "🌱",
  trigo: "🌾",
  arvore: "🌳",
  girasol: "🌻",
  morango: "🍓",
  milho: "🌽",
};

const INVENTORY_ITEM_RULE_HINTS = {
  capim: "Regra futura: liberar plantio de capim por tutorial inicial.",
  trigo: "Regra futura: exigir solo preparado e nivel minimo de nutrientes.",
  arvore: "Regra futura: exigir area maior e progresso de evolucao do mundo.",
  girasol: "Regra futura: exigir desbloqueio de sementes especiais.",
  morango: "Regra futura: exigir fase de cultivo intermediaria liberada.",
  milho: "Regra futura: exigir upgrade de plantio avancado.",
};

const INVENTORY_UI_STORAGE_KEY = "farmbot.inventory.ui.v1";
const INVENTORY_MODES = {
  TOPBAR: "topbar",
  OVERLAY: "overlay",
};

const INVENTORY_FLOAT_CARD_WIDTH = 320;
const INVENTORY_FLOAT_CARD_HEIGHT = 170;
const INVENTORY_FLOAT_GAP = 10;

function debugAlert(message) {
  if (!DEBUG_ALERTS) return;
  alert(`[DEBUG] ${message}`);
}

const logger = createLogger(logEl);

let progressionUI = null;
let inventoryHudEventsBound = false;
let selectedInventoryItemId = null;
let selectedInventoryFloatPosition = { left: 0, top: 0 };

function computeInventoryFloatPosition(itemEl) {
  if (!inventoryHudEl || !itemEl) {
    return { left: 0, top: 0 };
  }

  const hudRect = inventoryHudEl.getBoundingClientRect();
  const itemRect = itemEl.getBoundingClientRect();

  const maxLeft = Math.max(0, hudRect.width - INVENTORY_FLOAT_CARD_WIDTH - 8);
  let left = itemRect.right - hudRect.left + INVENTORY_FLOAT_GAP;

  if (left > maxLeft) {
    left = itemRect.left - hudRect.left - INVENTORY_FLOAT_CARD_WIDTH - INVENTORY_FLOAT_GAP;
  }

  left = Math.max(0, Math.min(left, maxLeft));

  const maxTop = Math.max(0, hudRect.height - INVENTORY_FLOAT_CARD_HEIGHT - 8);
  const top = Math.max(0, Math.min(itemRect.top - hudRect.top, maxTop));

  return {
    left: Math.round(left),
    top: Math.round(top),
  };
}

function loadInventoryUiSettings() {
  try {
    const raw = localStorage.getItem(INVENTORY_UI_STORAGE_KEY);
    if (!raw) {
      return {
        mode: INVENTORY_MODES.TOPBAR,
        collapsed: false,
      };
    }

    const parsed = JSON.parse(raw);
    const mode = Object.values(INVENTORY_MODES).includes(parsed.mode)
      ? parsed.mode
      : INVENTORY_MODES.TOPBAR;

    return {
      mode,
      collapsed: Boolean(parsed.collapsed),
    };
  } catch {
    return {
      mode: INVENTORY_MODES.TOPBAR,
      collapsed: false,
    };
  }
}

function saveInventoryUiSettings(settings) {
  try {
    localStorage.setItem(INVENTORY_UI_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignora falhas de persistencia (modo privado, quota, etc.).
  }
}

const inventoryUiSettings = loadInventoryUiSettings();

function bindInventoryHudEvents() {
  if (!inventoryHudEl || inventoryHudEventsBound) return;

  inventoryHudEl.addEventListener("click", (event) => {
    const itemEl = event.target.closest("[data-inventory-item]");
    if (itemEl) {
      const itemId = itemEl.dataset.inventoryItem;
      if (selectedInventoryItemId === itemId) {
        selectedInventoryItemId = null;
      } else {
        selectedInventoryItemId = itemId;
        selectedInventoryFloatPosition = computeInventoryFloatPosition(itemEl);
      }
      renderInventoryHud();
      return;
    }

    const actionEl = event.target.closest("[data-inventory-action]");
    if (!actionEl) return;

    const action = actionEl.dataset.inventoryAction;
    if (action === "toggle-collapse") {
      inventoryUiSettings.collapsed = !inventoryUiSettings.collapsed;
      saveInventoryUiSettings(inventoryUiSettings);
      renderInventoryHud();
      return;
    }

    if (action === "close-item-detail") {
      selectedInventoryItemId = null;
      renderInventoryHud();
    }

  });

  inventoryHudEventsBound = true;
}

function renderInventoryHud() {
  if (!inventoryHudEl) return;

  const inventoryRows = gamePhases.getItemInventory();
  const inventoryMap = new Map(inventoryRows.map((row) => [row.itemId, row.quantity]));
  const allIds = [...INVENTORY_ITEM_ORDER];

  const modeClass =
    inventoryUiSettings.mode === INVENTORY_MODES.OVERLAY
      ? "mode-overlay"
      : "mode-topbar";
  const expandedClass = inventoryUiSettings.collapsed ? "" : "is-expanded-floating";
  const selectedLabel = INVENTORY_ITEM_LABELS[selectedInventoryItemId] || selectedInventoryItemId;
  const selectedIcon = INVENTORY_ITEM_ICONS[selectedInventoryItemId] || "📦";
  const selectedQty = selectedInventoryItemId ? inventoryMap.get(selectedInventoryItemId) || 0 : 0;
  const selectedDesc =
    INVENTORY_ITEM_RULE_HINTS[selectedInventoryItemId] ||
    "Regra futura: definir pre-requisito para liberar este plantio.";
  const selectedFloatStyle = `left:${selectedInventoryFloatPosition.left}px;top:${selectedInventoryFloatPosition.top}px;`;

  inventoryHudEl.className = `inventory-hud ${modeClass} ${expandedClass} ${
    inventoryUiSettings.collapsed ? "is-collapsed" : ""
  }`;

  if (scenePanelEl) {
    scenePanelEl.classList.toggle(
      "inventory-mode-overlay",
      inventoryUiSettings.mode === INVENTORY_MODES.OVERLAY
    );
  }

  inventoryHudEl.innerHTML = `
    <div class="inventory-hud-head">
      <div class="inventory-toolbar">
        <button class="btn inventory-btn" data-inventory-action="toggle-collapse">
          ${inventoryUiSettings.collapsed ? "Expandir" : "Recolher"}
        </button>
      </div>
    </div>
    <div class="inventory-list ${inventoryUiSettings.collapsed ? "collapsed-view" : "expanded-view"}">
      ${allIds
        .map((itemId) => {
          const label = INVENTORY_ITEM_LABELS[itemId] || itemId;
          const icon = INVENTORY_ITEM_ICONS[itemId] || "📦";
          const description =
            INVENTORY_ITEM_RULE_HINTS[itemId] ||
            "Regra futura: definir pre-requisito para liberar este plantio.";
          const amount = inventoryMap.get(itemId) || 0;
          const selectedClass = selectedInventoryItemId === itemId ? "is-selected" : "";
          if (inventoryUiSettings.collapsed) {
            return `<div class="inventory-item collapsed ${selectedClass}" data-inventory-item="${itemId}" title="${label}"><span class="item-icon">${icon}</span><span class="item-qty">${amount}</span></div>`;
          } else {
            return `<div class="inventory-item expanded ${selectedClass}" data-inventory-item="${itemId}"><span class="item-icon">${icon}</span><div class="item-info"><div class="item-main"><span class="item-label">${label}</span><span class="item-qty">Qtd: ${amount}</span></div><p class="item-desc">${description}</p></div></div>`;
          }
        })
        .join("")}
    </div>
    ${selectedInventoryItemId
      ? `<div class="inventory-item-float" style="${selectedFloatStyle}">
          <button class="btn inventory-float-close" data-inventory-action="close-item-detail">Fechar</button>
          <div class="inventory-item-float-head">
            <span class="item-icon">${selectedIcon}</span>
            <div>
              <p class="inventory-item-float-title">${selectedLabel}</p>
              <p class="inventory-item-float-qty">Qtd atual: ${selectedQty}</p>
            </div>
          </div>
          <p class="inventory-item-float-desc">${selectedDesc}</p>
        </div>`
      : ""}
  `;
}

const gamePhases = createGamePhases({
  onLog: logger.append,
  onPhaseChanged: ({ phase }) => {
    logger.append(`No atual: ${phase.title}`);
    logger.append(`Progresso geral: ${phase.progressLabel}`);
    renderInventoryHud();
    if (progressionUI) {
      progressionUI.render();
    }
  },
});

const initialWorldState = gamePhases.getWorldState();

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
  gridWidth: initialWorldState.width,
  gridHeight: initialWorldState.height,
  defaultSoilType: "loam",
  defaultSoilLevels: {
    water: 45,
    nutrients: 52,
    ph: 6.4,
  },
});

const view = createThreeFarmView({
  sceneRoot,
  gridWidth: initialWorldState.width,
  gridHeight: initialWorldState.height,
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
    renderInventoryHud();
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
    renderInventoryHud();
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
    renderInventoryHud();
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
    renderInventoryHud();
    return;
  }

  if (actionType === "plant") {
    const cropArg = command.args && command.args.length > 0 ? command.args[0] : "generic";
    const cropType = typeof cropArg === "string" && cropArg.trim() ? cropArg.trim().toLowerCase() : "generic";
    const result = world.plant(cropType);
    gamePhases.recordEvent("plant", { cropType: result.crop.type });
    view.setCrop(result.x, result.y, result.crop.type);
    logger.append(`Plantou ${result.crop.type} em (${result.x}, ${result.y})`);
    renderInventoryHud();
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
    renderInventoryHud();
  }
}

const runner = createProgramRunner({
  getCode: editor.getValue,
  onAction: performAction,
  onLog: logger.append,
  onDebugError: debugAlert,
});

function applyWorldDimensions(width, height, reason = "expansao") {
  const result = world.setGridDimensions(width, height);
  if (!result.ok) return result;

  const snapshot = world.getSnapshot();
  view.setGridDimensions(width, height, snapshot);

  logger.append(`Mundo atualizado (${reason}): ${width}x${height}`);
  return {
    ok: true,
    dimensions: result.dimensions,
  };
}

function resetWorld() {
  runner.reset();
  world.reset();
  logger.clear();
  view.reset(world.getSnapshot());
  logger.append("Mundo resetado");
  renderInventoryHud();
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
bindInventoryHudEvents();
resetWorld();
view.resize();
progressionUI.render();
renderInventoryHud();

window.gamePhases = {
  getCurrent: () => gamePhases.getCurrentPhase(),
  getAll: () => gamePhases.getAllPhases(),
  getTree: () => gamePhases.getMissionTree(),
  getMissions: () => gamePhases.getMissions(),
  getActiveMissions: (limit) => gamePhases.getActiveMissions(limit),
  getUnlockedFeatures: () => gamePhases.getUnlockedFeatures(),
  getItemInventory: () => gamePhases.getItemInventory(),
  getWorldState: () => gamePhases.getWorldState(),
  getWorldUpgrades: () => gamePhases.getWorldUpgrades(),
  buyWorldUpgrade: (upgradeId) => {
    const purchase = gamePhases.purchaseWorldUpgrade(upgradeId);
    if (!purchase.ok) {
      renderInventoryHud();
      return purchase;
    }

    const worldState = purchase.worldState || null;
    if (worldState && Number.isFinite(worldState.width) && Number.isFinite(worldState.height)) {
      applyWorldDimensions(worldState.width, worldState.height, "upgrade");
    }

    renderInventoryHud();

    return purchase;
  },
  advance: () => gamePhases.advancePhase("manual-console"),
  setPhase: (value) => gamePhases.setPhase(value),
  resetProgress: (options) => {
    gamePhases.resetProgress(options || {});
    const state = gamePhases.getWorldState();
    applyWorldDimensions(state.width, state.height, "reset-progress");
    renderInventoryHud();
  },
};

logger.append("Sistema de fases/missoes habilitado. Use window.gamePhases para inspecionar/prototipar.");
logger.append("Evolucao manual habilitada: use getWorldUpgrades(), getItemInventory() e buyWorldUpgrade(id).");

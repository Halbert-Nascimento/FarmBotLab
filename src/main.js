import { createFarmWorld } from "./core/farmWorld.js";
import { createProgramRunner } from "./core/programRunner.js";
import { createGamePhases } from "./core/gamePhases.js";
import { createGameController } from "./core/gameController.js";
import { createThreeFarmView } from "./render/threeFarmView.js";
import { createEditor } from "./ui/editor.js";
import { createLogger } from "./ui/logger.js";
import { createProgressionUI } from "./ui/progressionUI.js";
import { VERSION, BUILD_DATE } from "./version.js";

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
const themeToggleBtn = document.querySelector("#themeToggleBtn");
const themeSelect    = document.querySelector("#themeSelect");
const clearLogBtn    = document.querySelector("#clearLogBtn");
// Stats na cena
const sceneStatMoves = document.querySelector("#sceneStatMoves");
const sceneStatPlants = document.querySelector("#sceneStatPlants");
const sceneStatHarvests = document.querySelector("#sceneStatHarvests");
const sceneStatMission = document.querySelector("#sceneStatMission");

const THEME_STORAGE_KEY    = "farmbot.theme";
const GAMESTATE_STORAGE_KEY = "farmbot.gamestate";

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



function debugAlert(message) {
  if (!DEBUG_ALERTS) return;
  alert(`[DEBUG] ${message}`);
}

// ─── Tema visual ─────────────────────────────────────────────────────────────

const VALID_THEMES   = ["claro", "floresta", "noite"];
const DARK_THEME     = "noite";
const DEFAULT_THEME  = "claro";
let   lastLightTheme = DEFAULT_THEME;  // lembra qual tema claro estava ativo

function applyTheme(theme) {
  // Migração: "dark"/"light" legados → novos nomes
  const migrated = theme === "dark" ? DARK_THEME : (theme === "light" ? DEFAULT_THEME : theme);
  const resolved  = VALID_THEMES.includes(migrated) ? migrated : DEFAULT_THEME;

  if (resolved !== DARK_THEME) lastLightTheme = resolved;

  document.documentElement.setAttribute("data-theme", resolved);

  if (themeToggleBtn) {
    themeToggleBtn.textContent = resolved === DARK_THEME ? "☀️" : "🌙";
    themeToggleBtn.title = resolved === DARK_THEME ? "Modo claro" : "Modo escuro";
  }

  if (themeSelect) themeSelect.value = resolved;

  try { localStorage.setItem(THEME_STORAGE_KEY, resolved); } catch (_) {}

  if (typeof editor !== "undefined" && editor && typeof editor.setTheme === "function") {
    editor.setTheme(resolved);
  }
}

function initTheme() {
  let saved = DEFAULT_THEME;
  try { saved = localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME; } catch (_) {}
  applyTheme(saved);
}

// ─── Sistema de Paletas e Acentos ───────────────────────────────────────────

const PALETTE_STORAGE_KEY = "farmbot.palette";
const ACCENT_STORAGE_KEY = "farmbot.accent";
const DEFAULT_PALETTE = "neutral-modern";
const DEFAULT_ACCENT = "teal";

const AVAILABLE_PALETTES = ["neutral-modern", "earthy-modern", "slate-indigo"];
const AVAILABLE_ACCENTS = [
  "amber", "indigo", "teal", "orange", "emerald", "ruby",
  "sky", "violet", "gold", "lime", "cyan", "pink", "carbon"
];

let currentPalette = DEFAULT_PALETTE;
let currentAccent = DEFAULT_ACCENT;

function applyPalette(palette) {
  const resolved = AVAILABLE_PALETTES.includes(palette) ? palette : DEFAULT_PALETTE;
  document.documentElement.setAttribute("data-palette", resolved);
  currentPalette = resolved;
  try { localStorage.setItem(PALETTE_STORAGE_KEY, resolved); } catch (_) {}
}

function applyAccent(accent) {
  const resolved = AVAILABLE_ACCENTS.includes(accent) ? accent : DEFAULT_ACCENT;
  document.documentElement.setAttribute("data-accent", resolved);
  currentAccent = resolved;
  try { localStorage.setItem(ACCENT_STORAGE_KEY, resolved); } catch (_) {}
}

function initPaletteAndAccent() {
  let savedPalette = DEFAULT_PALETTE;
  let savedAccent = DEFAULT_ACCENT;

  try {
    savedPalette = localStorage.getItem(PALETTE_STORAGE_KEY) || DEFAULT_PALETTE;
    savedAccent = localStorage.getItem(ACCENT_STORAGE_KEY) || DEFAULT_ACCENT;
  } catch (_) {}

  applyPalette(savedPalette);
  applyAccent(savedAccent);
}

// ─── HUD de estatísticas na topbar ───────────────────────────────────────────

function updateStatsHud() {
  const phase = gamePhases.getCurrentPhase();
  const stats = phase.progress || {};
  const activeMissions = gamePhases.getActiveMissions(1);
  const missionTitle = activeMissions.length ? activeMissions[0].title : phase.title || "—";

  // Atualiza stats na cena
  if (sceneStatMoves)    sceneStatMoves.textContent    = stats.moves    ?? 0;
  if (sceneStatPlants)   sceneStatPlants.textContent   = stats.plants   ?? 0;
  if (sceneStatHarvests) sceneStatHarvests.textContent = stats.harvests ?? 0;
  if (sceneStatMission)  sceneStatMission.textContent  = missionTitle;
}

// ─── Estado dos botões Executar / Parar ──────────────────────────────────────

function updateRunStopState() {
  const running = runner.isExecuting();
  if (runBtn) {
    runBtn.disabled = running;
    runBtn.classList.toggle("is-running", running);
    runBtn.querySelector(".btn-label") && (runBtn.querySelector(".btn-label").textContent = running ? "Executando…" : "Executar");
  }
  if (stopBtn) {
    stopBtn.disabled = !running;
  }
}

const logger = createLogger(logEl);

let progressionUI = null;

function renderInventoryHud() {
  if (!inventoryHudEl) return;

  const inventoryRows = gamePhases.getItemInventory();
  const inventoryMap = new Map(inventoryRows.map((row) => [row.itemId, row.quantity]));

  inventoryHudEl.className = "inventory-hud";
  inventoryHudEl.innerHTML = `
    <div class="inventory-strip">
      ${INVENTORY_ITEM_ORDER.map((itemId) => {
        const icon = INVENTORY_ITEM_ICONS[itemId] || "📦";
        const label = INVENTORY_ITEM_LABELS[itemId] || itemId;
        const qty = inventoryMap.get(itemId) || 0;
        return `<div class="inventory-strip-item" title="${label}">
          <span class="item-icon">${icon}</span>
          <span class="item-qty">${qty}</span>
        </div>`;
      }).join("")}
    </div>
  `;
}

const gamePhases = createGamePhases({
  onLog: logger.append,
  onWorldStateChanged: ({ width, height }) => {
    if (Number.isFinite(width) && Number.isFinite(height)) {
      applyWorldDimensions(width, height, "world-upgrade");
    }
  },
  onPhaseChanged: ({ phase }) => {
    logger.append(`No atual: ${phase.title}`);
    logger.append(`Progresso geral: ${phase.progressLabel}`);
    renderInventoryHud();
    updateStatsHud();
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

const gameController = createGameController({
  world,
  gamePhases,
  view,
  onLog: logger.append,
  onUIUpdate: () => {
    renderInventoryHud();
    updateStatsHud();
  },
});

async function performAction(action) {
  return gameController.executeAction(action);
}

const runner = createProgramRunner({
  getCode: editor.getValue,
  onAction: performAction,
  onQuery: (query) => gameController.queryState(query),
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
  updateStatsHud();
  updateRunStopState();
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
  // run() é assíncrono: isExecuting vira true sincronamente no início da função,
  // então updateRunStopState() captura o estado correto logo após a chamada.
  const runPromise = runner.run();
  updateRunStopState();
  updateStatsHud();
  // Restaura estado dos botões quando a execução terminar
  if (runPromise && typeof runPromise.finally === "function") {
    runPromise.finally(() => {
      updateRunStopState();
    });
  }
});

stopBtn.addEventListener("click", () => {
  runner.stop();
  setTimeout(updateRunStopState, 60);
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

// ─── Divisor redimensionável entre código e cena ─────────────────────────────

(function initLayoutResizer() {
  const resizer = document.querySelector("#layoutResizer");
  const codePanel = document.querySelector(".code-panel");
  const layout = document.querySelector(".layout");
  if (!resizer || !codePanel || !layout) return;

  const STORAGE_KEY = "farmbot.layout.codePanelWidth";
  const MIN_WIDTH = 220;

  // Restaura largura salva
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const w = Number(saved);
      if (w >= MIN_WIDTH) {
        codePanel.style.flex = `0 0 ${w}px`;
        codePanel.style.width = `${w}px`;
      }
    }
  } catch (_) {}

  let dragging = false;
  let startX = 0;
  let startWidth = 0;

  resizer.addEventListener("mousedown", (e) => {
    dragging = true;
    startX = e.clientX;
    startWidth = codePanel.getBoundingClientRect().width;
    resizer.classList.add("is-dragging");
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  });

  document.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    const layoutWidth = layout.getBoundingClientRect().width;
    const delta = e.clientX - startX;
    const newWidth = Math.max(MIN_WIDTH, Math.min(startWidth + delta, layoutWidth - MIN_WIDTH - 10));
    codePanel.style.flex = `0 0 ${newWidth}px`;
    codePanel.style.width = `${newWidth}px`;
    view.resize();
  });

  document.addEventListener("mouseup", () => {
    if (!dragging) return;
    dragging = false;
    resizer.classList.remove("is-dragging");
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    try {
      localStorage.setItem(STORAGE_KEY, codePanel.getBoundingClientRect().width);
    } catch (_) {}
    view.resize();
  });
})();

setupDebugHooks();
resetWorld();
restoreGameState();
view.resize();
progressionUI.render();
renderInventoryHud();

// Inicializa tema, sincroniza editor e atualiza HUD de estatísticas
initTheme();
initPaletteAndAccent();
editor.setTheme(document.documentElement.getAttribute("data-theme") || DEFAULT_THEME);

// Toggle 🌙/☀️ — alterna entre Noite e o último tema claro usado
if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || DEFAULT_THEME;
    const next = current === DARK_THEME ? lastLightTheme : DARK_THEME;
    applyTheme(next);
    editor.setTheme(next);
  });
}

// Seletor de tema — aplica o tema escolhido na lista
if (themeSelect) {
  themeSelect.addEventListener("change", () => {
    applyTheme(themeSelect.value);
    editor.setTheme(themeSelect.value);
  });
}

// ─── Sistema de Abas do Painel de Código ───────────────────────────────────

function initCodePanelTabs() {
  const tabButtons = document.querySelectorAll(".code-tab-btn");
  const tabContents = document.querySelectorAll(".code-tab-content");
  const codeActions = document.querySelector("#codeActions");

  function updateActionsVisibility(tabName) {
    // Mostra botões de ação apenas na aba de código
    if (codeActions) {
      codeActions.style.display = tabName === "code-editor" ? "flex" : "none";
    }
  }

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const tabName = btn.dataset.tab;

      // Remove "is-active" de todos os botões e conteúdos
      tabButtons.forEach(b => b.classList.remove("is-active"));
      tabContents.forEach(c => c.classList.remove("is-active"));

      // Adiciona "is-active" ao botão e conteúdo clicados
      btn.classList.add("is-active");
      document.getElementById(`${tabName}-tab`).classList.add("is-active");

      // Atualiza visibilidade dos botões de ação
      updateActionsVisibility(tabName);

      // Dispara redimensionamento do editor se for a aba de código
      if (tabName === "code-editor" && typeof editor !== "undefined" && editor) {
        setTimeout(() => editor.resize?.(), 50);
      }
    });
  });

  // Inicializa visibilidade dos botões (aba de código começa ativa)
  updateActionsVisibility("code-editor");

  // Sincroniza inputs de configurações com preferências atuais
  const settingsTab = document.getElementById("code-settings-tab");
  if (settingsTab) {
    const paletteRadios = settingsTab.querySelectorAll('input[name="palette"]');
    const accentRadios = settingsTab.querySelectorAll('input[name="accent"]');

    paletteRadios.forEach(radio => {
      radio.checked = radio.value === currentPalette;
      radio.addEventListener("change", () => {
        applyPalette(radio.value);
      });
    });

    accentRadios.forEach(radio => {
      radio.checked = radio.value === currentAccent;
      radio.addEventListener("change", () => {
        applyAccent(radio.value);
      });
    });
  }
}

initCodePanelTabs();

if (clearLogBtn) {
  clearLogBtn.addEventListener("click", () => {
    logger.clear();
  });
}

updateStatsHud();

window.farmbot = {
  version: VERSION.toString(),
  buildDate: BUILD_DATE,
  full: VERSION.full(),
};

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
  getDevTree: () => gamePhases.getDevTree(),
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
  buyDevUpgrade: (upgradeId) => {
    const purchase = gamePhases.purchaseDevUpgrade(upgradeId);
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
    updateStatsHud();
  },
};

// ─── Persistência de estado (localStorage) ──────────────────────────────────

function restoreGameState() {
  try {
    const raw = localStorage.getItem(GAMESTATE_STORAGE_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw);

    // Compatibilidade: save v1 colocava gamePhases diretamente na raiz
    const phasesData = saved.version >= 2 ? saved.phases : saved;

    // 1. Progressão: missões, upgrades, inventário
    if (phasesData) {
      gamePhases.restoreState(phasesData);
    }

    // 2. Mundo: grid, posição do drone, culturas, solo
    if (saved.world) {
      world.restoreSnapshot(saved.world);
      const dims = world.getGridDimensions();
      applyWorldDimensions(dims.width, dims.height, "restore");
      view.reset(world.getSnapshot());
    }

    // 3. UI: tema, paleta e acento visual
    if (saved.ui) {
      if (saved.ui.theme)   applyTheme(saved.ui.theme);
      if (saved.ui.palette) applyPalette(saved.ui.palette);
      if (saved.ui.accent)  applyAccent(saved.ui.accent);
    }

    renderInventoryHud();
    updateStatsHud();
    if (progressionUI) progressionUI.render();

    return true;
  } catch (e) {
    console.warn("[farmbot] Falha ao restaurar estado salvo:", e);
    return false;
  }
}

window.addEventListener("beforeunload", () => {
  try {
    const snapshot = {
      version: 2,
      savedAt: Date.now(),
      phases: gamePhases.getFullState(),
      world: world.getSnapshot(),
      ui: {
        theme:   document.documentElement.getAttribute("data-theme"),
        palette: document.documentElement.getAttribute("data-palette"),
        accent:  document.documentElement.getAttribute("data-accent"),
      },
    };
    localStorage.setItem(GAMESTATE_STORAGE_KEY, JSON.stringify(snapshot));
  } catch (e) {
    console.warn("[farmbot] Falha ao salvar estado:", e);
  }
});

logger.append(`${VERSION.full()} (Build: ${BUILD_DATE})`);

// Atualiza versão exibida na topbar
const appVersionEl = document.querySelector("#appVersion");
if (appVersionEl) {
  appVersionEl.textContent = `v${VERSION.toString()}`;
  appVersionEl.title = `Compilado em ${BUILD_DATE}`;
}

logger.append("Sistema de fases/missoes habilitado. Use window.gamePhases para inspecionar/prototipar.");
logger.append("Evolucao manual habilitada: use getWorldUpgrades(), getItemInventory() e buyWorldUpgrade(id).");

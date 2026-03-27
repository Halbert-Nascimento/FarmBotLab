function badgeClass(isCompleted, isUnlocked) {
  if (isCompleted) return "badge completed";
  if (isUnlocked) return "badge unlocked";
  return "badge locked";
}

function statusText(isCompleted, isUnlocked) {
  if (isCompleted) return "Concluido";
  if (isUnlocked) return "Desbloqueado";
  return "Bloqueado";
}

function extractOrdinal(id, prefix) {
  if (!id || typeof id !== "string") return null;
  const rx = new RegExp(`^${prefix}(\\d+)`);
  const match = id.match(rx);
  if (!match) return null;
  return Number(match[1]);
}

function formatNodeLabel(node) {
  const ordinal = extractOrdinal(node.id, "n");
  if (!ordinal) return node.title;
  return `No ${ordinal} - ${node.title}`;
}

function formatMissionLabel(mission) {
  const ordinal = extractOrdinal(mission.id, "m");
  if (!ordinal) return mission.title;
  return `Missao ${ordinal} - ${mission.title}`;
}

function renderSummary(current, unlockedFeatures) {
  return `
    <section class="progress-summary">
      <article class="progress-chip">
        <strong>No Atual</strong>
        <span>${current.title}</span>
      </article>
      <article class="progress-chip">
        <strong>Missoes</strong>
        <span>${current.completedMissionCount}/${current.totalMissionCount}</span>
      </article>
      <article class="progress-chip">
        <strong>Runs</strong>
        <span>${current.progress.runs}</span>
      </article>
      <article class="progress-chip">
        <strong>Features</strong>
        <span>${unlockedFeatures.length}</span>
      </article>
    </section>
  `;
}

function renderActiveMissions(activeMissions) {
  if (!activeMissions.length) {
    return `<p class="muted">Sem missoes ativas no momento.</p>`;
  }

  return `
    <section class="mission-list">
      ${activeMissions
        .map(
          (mission) => `
        <article class="mission-card">
          <h4>${formatMissionLabel(mission)}</h4>
          <p class="muted">${mission.objective}</p>
          <p>${mission.description || ""}</p>
          <div class="badge-row">
            <span class="${badgeClass(mission.isCompleted, mission.isUnlocked)}">${statusText(
              mission.isCompleted,
              mission.isUnlocked
            )}</span>
          </div>
          <p class="muted">${mission.progressLabel}</p>
          ${renderMissionHelp(mission, true)}
        </article>
      `
        )
        .join("")}
    </section>
  `;
}

function renderMissionHelp(mission, compact = false) {
  const hints = mission.hints || [];
  const lesson = mission.lesson;
  const hintsHtml = hints.length
    ? `<ul class="hint-list">${hints
        .slice(0, compact ? 2 : hints.length)
        .map((hint) => `<li>${hint}</li>`)
        .join("")}</ul>`
    : "";

  if (!lesson) {
    return hintsHtml;
  }

  if (compact) {
    return `
      <details class="lesson-box compact">
        <summary>Aprenda: ${lesson.topic}</summary>
        <p class="muted">${lesson.summary}</p>
        ${hintsHtml}
      </details>
    `;
  }

  return `
    <details class="lesson-box" open>
      <summary>Aprenda: ${lesson.topic}</summary>
      <p>${lesson.summary}</p>
      <p class="muted">Sintaxe sugerida</p>
      <pre class="code-mini">${lesson.syntax}</pre>
      <p class="muted">Exemplo no jogo</p>
      <pre class="code-mini">${lesson.example}</pre>
      ${hintsHtml}
    </details>
  `;
}

function featureLabel(feature) {
  const labels = {
    "api.move": "Movimento: moverDireita/moverEsquerda/moverCima/moverBaixo",
    "api.plant": "Plantio: plantar(tipo)",
    "api.harvest": "Colheita: colher()",
    "lang.if": "Condicionais: if / else",
    "lang.while": "Repeticao: while",
    "lang.for": "Repeticao: for",
    "lang.function": "Funcoes basicas",
    "lang.function.params": "Funcoes com parametros",
    "lang.array.basic": "Arrays e iteracao basica",
    "strategy.pathing": "Planejamento de rotas",
    "strategy.efficiency": "Eficiencia de scripts",
    "mastery.challenge": "Desafios de maestria",
    "world.expansion.available": "Novo Mundo: desbloqueado para expansao futura",
    "world.evolution.tier1": "Sistema de evolucao manual (tier 1)",
  };
  return labels[feature] || feature;
}

function renderUnlockedOverview(treeNodes, unlockedFeatures) {
  const unlockedNodes = treeNodes.filter((node) => node.isUnlocked);
  const unlockedMissions = treeNodes
    .flatMap((node) => node.missions || [])
    .filter((mission) => mission.isUnlocked);
  const completedMissions = unlockedMissions.filter((mission) => mission.isCompleted);

  return `
    <section class="mission-card">
      <h4>Tudo Que Ja Esta Liberado</h4>
      <p class="muted">Nos desbloqueados: ${unlockedNodes.length} | Missoes desbloqueadas: ${unlockedMissions.length} | Missoes concluidas: ${completedMissions.length}</p>

      <details class="lesson-box compact" open>
        <summary>Nos desbloqueados</summary>
        <ul class="hint-list">
          ${unlockedNodes.map((node) => `<li>${formatNodeLabel(node)}</li>`).join("")}
        </ul>
      </details>

      <details class="lesson-box compact" open>
        <summary>Missoes desbloqueadas</summary>
        <ul class="hint-list">
          ${unlockedMissions
            .map(
              (mission) =>
                `<li>${formatMissionLabel(mission)} (${mission.isCompleted ? "concluida" : "ativa"})</li>`
            )
            .join("") || "<li>Nenhuma missao desbloqueada ainda.</li>"}
        </ul>
      </details>

      <details class="lesson-box compact" open>
        <summary>Recursos de programacao liberados</summary>
        <ul class="hint-list">
          ${unlockedFeatures.map((feature) => `<li>${featureLabel(feature)}</li>`).join("") || "<li>Nenhum recurso extra liberado ainda.</li>"}
        </ul>
      </details>
    </section>
  `;
}

function renderCurrentLearning(current, treeNodes) {
  const currentNode = treeNodes.find((node) => node.id === current.id);
  const firstMission = currentNode && currentNode.missions && currentNode.missions.length ? currentNode.missions[0] : null;

  if (!firstMission || !firstMission.lesson) {
    return "";
  }

  const lesson = firstMission.lesson;
  return `
    <section class="mission-card">
      <h4>Como Programar Nesta Etapa</h4>
      <p>${lesson.summary}</p>
      <p class="muted">Sintaxe</p>
      <pre class="code-mini">${lesson.syntax}</pre>
      <p class="muted">Exemplo pratico</p>
      <pre class="code-mini">${lesson.example}</pre>
      <ul class="hint-list">
        ${(lesson.hints || []).map((hint) => `<li>${hint}</li>`).join("")}
      </ul>
    </section>
  `;
}

function renderNodeFocusDetails(node, treeNodes) {
  if (!node) {
    return `
      <section class="mission-card" data-selected-node-id="">
        <h4>Detalhes do No</h4>
        <p class="muted">Clique em um no da arvore para ver mais informacoes.</p>
      </section>
    `;
  }

  const byId = new Map((treeNodes || []).map((n) => [n.id, n]));
  const requiresLabel = (node.requires || []).length
    ? node.requires.map((reqId) => byId.get(reqId)?.title || reqId).join(" | ")
    : "Inicio da trilha";

  return `
    <section class="mission-card" data-selected-node-id="${node.id}">
      <h4>${formatNodeLabel(node)}</h4>
      <p class="muted">Trilha: ${node.branch || "geral"}</p>
      <p class="muted">Depende de: ${requiresLabel}</p>
      <div class="badge-row">
        <span class="${badgeClass(node.isCompleted, node.isUnlocked)}">${statusText(node.isCompleted, node.isUnlocked)}</span>
      </div>

      <details class="lesson-box compact" open>
        <summary>Recursos liberados neste no</summary>
        <ul class="hint-list">
          ${(node.unlocks || []).map((feature) => `<li>${featureLabel(feature)}</li>`).join("") || "<li>Nenhum recurso.</li>"}
        </ul>
      </details>

      <details class="lesson-box compact" open>
        <summary>Missoes do no</summary>
        <ul class="hint-list">
          ${(node.missions || [])
            .map(
              (mission) =>
                `<li>${formatMissionLabel(mission)} - ${mission.isCompleted ? "concluida" : mission.isUnlocked ? "ativa" : "bloqueada"}</li>`
            )
            .join("") || "<li>Sem missoes.</li>"}
        </ul>
      </details>
    </section>
  `;
}

function toSafeNumber(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function buildTreeLayout(treeNodes) {
  const colStep = 210;
  const rowStep = 140;
  const cardWidth = 170;
  const cardHeight = 84;
  const leftPad = 42;
  const topPad = 36;

  const maxCol = treeNodes.reduce((max, node) => Math.max(max, toSafeNumber(node.tree && node.tree.col, 0)), 0);
  const maxRow = treeNodes.reduce((max, node) => Math.max(max, toSafeNumber(node.tree && node.tree.row, 0)), 0);

  const positioned = treeNodes.map((node, index) => {
    const col = toSafeNumber(node.tree && node.tree.col, index);
    const row = toSafeNumber(node.tree && node.tree.row, 0);
    const x = leftPad + col * colStep;
    const y = topPad + row * rowStep;

    return {
      ...node,
      _layout: {
        col,
        row,
        x,
        y,
        width: cardWidth,
        height: cardHeight,
        centerX: x + cardWidth / 2,
        centerY: y + cardHeight / 2,
      },
    };
  });

  const byId = new Map(positioned.map((node) => [node.id, node]));
  const edges = [];

  positioned.forEach((node) => {
    (node.requires || []).forEach((reqId) => {
      const from = byId.get(reqId);
      if (!from) return;
      edges.push({
        from,
        to: node,
      });
    });
  });

  return {
    nodes: positioned,
    edges,
    width: leftPad + maxCol * colStep + cardWidth + 42,
    height: topPad + maxRow * rowStep + cardHeight + 36,
  };
}

function renderTreeCanvas(treeNodes) {
  const layout = buildTreeLayout(treeNodes);

  return `
    <section class="tree-canvas-wrap tree-canvas-wrap-full">
      <div class="tree-viewport" data-tree-interactive="true" tabindex="0" aria-label="Arvore de missoes interativa">
        <div class="tree-canvas" style="width:${layout.width}px; height:${layout.height}px;">
          <svg class="tree-lines" viewBox="0 0 ${layout.width} ${layout.height}" preserveAspectRatio="none">
            ${layout.edges
              .map(
                (edge) => `
              <path
                d="M ${edge.from._layout.centerX} ${edge.from._layout.centerY} C ${edge.from._layout.centerX} ${(edge.from._layout.centerY + edge.to._layout.centerY) / 2}, ${edge.to._layout.centerX} ${(edge.from._layout.centerY + edge.to._layout.centerY) / 2}, ${edge.to._layout.centerX} ${edge.to._layout.centerY}"
                class="tree-link ${edge.to.isUnlocked ? "unlocked" : "locked"}"
              />
            `
              )
              .join("")}
          </svg>

          ${layout.nodes
            .map(
              (node) => `
            <article
              class="node-card tree-node ${node.isCompleted ? "is-completed" : node.isUnlocked ? "is-unlocked" : "is-locked"}"
              data-node-id="${node.id}"
              style="left:${node._layout.x}px; top:${node._layout.y}px; width:${node._layout.width}px; min-height:${node._layout.height}px;"
            >
              <h4>${node.title}</h4>
              <p class="muted node-meta">${formatNodeLabel(node)}</p>
              <div class="badge-row">
                <span class="${badgeClass(node.isCompleted, node.isUnlocked)}">${statusText(node.isCompleted, node.isUnlocked)}</span>
                <span class="badge unlocked">${node.completedMissions || node.missions.filter((m) => m.isCompleted).length}/${
                  node.totalMissions || node.missions.length
                }</span>
              </div>
            </article>
          `
            )
            .join("")}
        </div>
      </div>
    </section>
  `;
}

function renderMissionDetails(treeNodes) {
  return `
    <section class="tree-mission-details">
      <h4>Detalhes das Missoes</h4>
      <div class="mission-list">
        ${treeNodes
          .flatMap((node) => (node.missions || []).map((mission) => ({ ...mission, nodeTitle: node.title, nodeId: node.id })))
          .map(
            (mission) => `
          <article class="mission-card">
            <h4>${formatMissionLabel(mission)}</h4>
            <p class="muted">No: ${mission.nodeTitle}</p>
            <p class="muted">${mission.objective}</p>
            <p>${mission.description || ""}</p>
            <div class="badge-row">
              <span class="${badgeClass(mission.isCompleted, mission.isUnlocked)}">${statusText(
              mission.isCompleted,
              mission.isUnlocked
            )}</span>
            </div>
            <p class="muted">${mission.progressLabel}</p>
            ${renderMissionHelp(mission, false)}
          </article>
        `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderFullPage(current, tree, activeMissions, unlockedFeatures) {
  const currentNode = tree.find((node) => node.id === current.id) || tree[0] || null;

  return `
    <section class="progress-full-layout">
      <div class="progress-full-main">
        <h3>Arvore Completa</h3>
        ${renderTreeCanvas(tree)}
      </div>

      <aside class="progress-full-side">
        ${renderSummary(current, unlockedFeatures)}
        <section id="treeNodeDetailsPanelHost">${renderNodeFocusDetails(currentNode, tree)}</section>
        ${renderCurrentLearning(current, tree)}
        <h3>Missoes Ativas</h3>
        ${renderActiveMissions(activeMissions)}
        ${renderUnlockedOverview(tree, unlockedFeatures)}
        ${renderMissionDetails(tree)}
      </aside>
    </section>
  `;
}

function renderTree(treeNodes) {
  return `
    <section class="tree-canvas-wrap">
      ${renderTreeCanvas(treeNodes)}
      <section class="tree-mission-details">
        <h4>Detalhes das Missoes</h4>
        <div class="mission-list">
          ${treeNodes
            .flatMap((node) => (node.missions || []).map((mission) => ({ ...mission, nodeTitle: node.title, nodeId: node.id })))
            .map(
              (mission) => `
            <article class="mission-card">
              <h4>${formatMissionLabel(mission)}</h4>
              <p class="muted">No: ${mission.nodeTitle}</p>
              <p class="muted">${mission.objective}</p>
              <p>${mission.description || ""}</p>
              <div class="badge-row">
                <span class="${badgeClass(mission.isCompleted, mission.isUnlocked)}">${statusText(
                mission.isCompleted,
                mission.isUnlocked
              )}</span>
              </div>
              <p class="muted">${mission.progressLabel}</p>
              ${renderMissionHelp(mission, false)}
            </article>
          `
            )
            .join("")}
        </div>
      </section>
    </section>
  `;
}

export function createProgressionUI({ gamePhases, onLog }) {
  const openModalBtn = document.querySelector("#openProgressModalBtn");
  const closeModalBtn = document.querySelector("#closeProgressModalBtn");
  const openPageBtn = document.querySelector("#openProgressPageBtn");
  const closePageBtn = document.querySelector("#closeProgressPageBtn");

  const progressModal = document.querySelector("#progressModal");
  const progressPage = document.querySelector("#progressPage");
  const modalContent = document.querySelector("#progressModalContent");
  const pageContent = document.querySelector("#progressPageContent");
  let cleanupInteractiveTree = null;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function setupInteractiveTree(treeNodes) {
    if (typeof cleanupInteractiveTree === "function") {
      cleanupInteractiveTree();
      cleanupInteractiveTree = null;
    }

    const viewport = pageContent.querySelector('[data-tree-interactive="true"]');
    if (!viewport) return;

    const canvas = viewport.querySelector(".tree-canvas");
    if (!canvas) return;

    const detailsPanelHost = pageContent.querySelector("#treeNodeDetailsPanelHost");
    const treeById = new Map((treeNodes || []).map((node) => [node.id, node]));
    let selectedNodeId = null;

    if (detailsPanelHost) {
      const currentPanel = detailsPanelHost.querySelector("[data-selected-node-id]");
      selectedNodeId = currentPanel && currentPanel.dataset.selectedNodeId ? currentPanel.dataset.selectedNodeId : null;
    }

    function renderSelectedNode(nodeId) {
      if (!detailsPanelHost) return;
      const node = treeById.get(nodeId) || null;
      detailsPanelHost.innerHTML = renderNodeFocusDetails(node, treeNodes);
      selectedNodeId = node ? node.id : null;

      pageContent.querySelectorAll(".tree-node").forEach((el) => {
        const isSelected = el.dataset.nodeId === selectedNodeId;
        el.classList.toggle("is-selected", isSelected);
      });
    }

    canvas.style.transformOrigin = "0 0";

    const fitPadding = 24;

    let scale = 1;
    let minScale = 0.2;
    const maxScale = 2.5;
    let tx = 0;
    let ty = 0;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    function clampTranslation() {
      const cw = canvas.offsetWidth;
      const ch = canvas.offsetHeight;
      const vw = viewport.clientWidth;
      const vh = viewport.clientHeight;
      const scaledW = cw * scale;
      const scaledH = ch * scale;
      const pad = 40;

      if (scaledW <= vw) {
        tx = (vw - scaledW) / 2;
      } else {
        tx = clamp(tx, vw - scaledW - pad, pad);
      }

      if (scaledH <= vh) {
        ty = (vh - scaledH) / 2;
      } else {
        ty = clamp(ty, vh - scaledH - pad, pad);
      }
    }

    function applyTransform() {
      clampTranslation();
      const rx = Math.round(tx);
      const ry = Math.round(ty);
      const rs = Math.round(scale * 1000) / 1000;
      canvas.style.transform = `translate3d(${rx}px, ${ry}px, 0) scale(${rs})`;
    }

    function fitToViewport() {
      const cw = canvas.offsetWidth;
      const ch = canvas.offsetHeight;
      const vw = viewport.clientWidth;
      const vh = viewport.clientHeight;
      const fitScale = Math.min((vw - fitPadding * 2) / cw, (vh - fitPadding * 2) / ch, 1);
      scale = fitScale;
      minScale = Math.max(0.12, fitScale * 0.5);
      tx = (vw - cw * scale) / 2;
      ty = (vh - ch * scale) / 2;
      applyTransform();
    }

    viewport.scrollLeft = 0;
    viewport.scrollTop = 0;

    requestAnimationFrame(() => {
      fitToViewport();
      setTimeout(() => {
        fitToViewport();
      }, 40);
    });

    const handleWheel = (event) => {
      event.preventDefault();

      const rect = viewport.getBoundingClientRect();
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;
      const zoomIntensity = 0.0016;
      const factor = Math.exp(-event.deltaY * zoomIntensity);
      const nextScale = clamp(scale * factor, minScale, maxScale);

      if (nextScale === scale) return;

      const worldX = (px - tx) / scale;
      const worldY = (py - ty) / scale;
      scale = nextScale;
      tx = px - worldX * scale;
      ty = py - worldY * scale;
      applyTransform();
    };

    const handleMouseDown = (event) => {
      if (event.button !== 0) return;
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
      viewport.classList.add("is-dragging");
    };

    const handleMouseMove = (event) => {
      if (!dragging) return;
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;
      tx += dx;
      ty += dy;
      applyTransform();
    };

    const handleMouseUp = () => {
      if (!dragging) return;
      dragging = false;
      viewport.classList.remove("is-dragging");
    };

    const handleDoubleClick = () => {
      fitToViewport();
    };

    viewport.addEventListener("wheel", handleWheel, { passive: false });
    viewport.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    viewport.addEventListener("dblclick", handleDoubleClick);

    const clickableNodes = Array.from(pageContent.querySelectorAll(".tree-node[data-node-id]"));

    const nodeClickHandlers = clickableNodes.map((nodeEl) => {
      const handler = (event) => {
        event.stopPropagation();
        renderSelectedNode(nodeEl.dataset.nodeId);
      };

      nodeEl.addEventListener("click", handler);
      return { nodeEl, handler };
    });

    if (selectedNodeId) {
      renderSelectedNode(selectedNodeId);
    } else {
      const firstNode = treeNodes && treeNodes.length ? treeNodes[0] : null;
      if (firstNode) renderSelectedNode(firstNode.id);
    }

    cleanupInteractiveTree = () => {
      viewport.removeEventListener("wheel", handleWheel);
      viewport.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      viewport.removeEventListener("dblclick", handleDoubleClick);
      nodeClickHandlers.forEach(({ nodeEl, handler }) => {
        nodeEl.removeEventListener("click", handler);
      });
    };
  }

  function openModal() {
    progressModal.classList.add("is-open");
    progressModal.setAttribute("aria-hidden", "false");
    render();
  }

  function closeModal() {
    progressModal.classList.remove("is-open");
    progressModal.setAttribute("aria-hidden", "true");
  }

  function openPage() {
    progressPage.classList.add("is-open");
    progressPage.setAttribute("aria-hidden", "false");
    render();
  }

  function closePage() {
    progressPage.classList.remove("is-open");
    progressPage.setAttribute("aria-hidden", "true");
  }

  function render() {
    const current = gamePhases.getCurrentPhase();
    const tree = gamePhases.getMissionTree();
    const activeMissions = gamePhases.getActiveMissions(5);
    const unlockedFeatures = gamePhases.getUnlockedFeatures();

    const summaryHtml = renderSummary(current, unlockedFeatures);
    const activeHtml = renderActiveMissions(activeMissions);

    modalContent.innerHTML = `
      ${summaryHtml}
      ${renderCurrentLearning(current, tree)}
      <h3>Missoes Ativas</h3>
      ${activeHtml}
      ${renderUnlockedOverview(tree, unlockedFeatures)}
      <hr class="divider" />
      <p class="muted">Features desbloqueadas: ${unlockedFeatures.join(", ") || "nenhuma"}</p>
    `;

    pageContent.innerHTML = `
      ${renderFullPage(current, tree, activeMissions, unlockedFeatures)}
    `;

    setupInteractiveTree(tree);
  }

  openModalBtn.addEventListener("click", openModal);
  closeModalBtn.addEventListener("click", closeModal);
  openPageBtn.addEventListener("click", openPage);
  closePageBtn.addEventListener("click", closePage);

  progressModal.addEventListener("click", (event) => {
    if (event.target === progressModal) closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModal();
      closePage();
    }
  });

  if (typeof onLog === "function") {
    onLog("UI de progresso habilitada: modal rapido + pagina completa.");
  }

  return {
    openModal,
    closeModal,
    openPage,
    closePage,
    render,
  };
}

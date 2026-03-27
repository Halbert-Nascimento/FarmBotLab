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
          <h4>${mission.title}</h4>
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
          ${unlockedNodes.map((node) => `<li>${node.title} (${node.id})</li>`).join("")}
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

function renderTree(treeNodes) {
  const layout = buildTreeLayout(treeNodes);

  return `
    <section class="tree-canvas-wrap">
      <div class="tree-viewport">
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
              style="left:${node._layout.x}px; top:${node._layout.y}px; width:${node._layout.width}px; min-height:${node._layout.height}px;"
            >
              <h4>${node.title}</h4>
              <p class="muted node-meta">${node.id}</p>
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

      <section class="tree-mission-details">
        <h4>Detalhes das Missoes</h4>
        <div class="mission-list">
          ${treeNodes
            .flatMap((node) => (node.missions || []).map((mission) => ({ ...mission, nodeTitle: node.title, nodeId: node.id })))
            .map(
              (mission) => `
            <article class="mission-card">
              <h4>${mission.id} - ${mission.title}</h4>
              <p class="muted">No: ${mission.nodeTitle} (${mission.nodeId})</p>
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
      ${summaryHtml}
      <h3>Arvore Completa</h3>
      ${renderTree(tree)}
    `;
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

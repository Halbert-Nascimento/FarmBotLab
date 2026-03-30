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
    "lang.else": "Condicionais: else",
    "lang.while": "Repeticao: while",
    "lang.for": "Repeticao: for",
    "lang.var": "Declaracao de variaveis",
    "lang.function": "Funcoes basicas",
    "lang.function.params": "Funcoes com parametros",
    "lang.array.basic": "Arrays e iteracao basica",
    "lang.js.math": "Funcoes nativas Math.*",
    "lang.async": "Funcoes assincronas",
    "lang.mastery.t1": "Maestria de scripts",
    "game.drone.extra.t1": "Drone extra - nivel 1",
    "game.drone.extra.t2": "Drone extra - nivel 2",
    "strategy.pathing": "Planejamento de rotas",
    "strategy.efficiency": "Eficiencia de scripts",
    "mastery.challenge": "Desafios de maestria",
    "world.expansion.available": "Expansao de Mundo",
    "world.evolution.tier1": "Evolucao Manual do Mundo",
  };
  return labels[feature] || feature;
}

function itemLabel(itemId) {
  const labels = {
    capim: "Capim",
    trigo: "Trigo",
    milho: "Milho",
    arvore: "Arvore",
    generic: "Item Generico",
  };
  return labels[itemId] || itemId;
}

function featureUnlockHint(featureId) {
  const hints = {
    "world.expansion.available":
      "Abra Arvore de Missoes e conclua a Missao 20 (Dominio da Fazenda): 60 movimentos, 30 plantios e 12 colheitas.",
    "world.evolution.tier1":
      "Abra Arvore de Missoes e conclua a Missao 20 (Dominio da Fazenda): 60 movimentos, 30 plantios e 12 colheitas.",
  };
  return hints[featureId] || `Conclua as missoes da progressao para liberar: ${featureLabel(featureId)}.`;
}

function formatCostList(costs) {
  const entries = Object.entries(costs || {}).filter(([, qty]) => qty > 0);
  if (!entries.length) return "Sem custo";
  return entries.map(([itemId, qty]) => `${itemLabel(itemId)}: ${qty}`).join(" | ");
}

function formatRuleLabel(rule) {
  if (!rule) return "";
  if (rule.type === "metric") {
    const metricLabels = {
      runs: "Execucoes de script",
      moves: "Movimentos",
      plants: "Plantios",
      harvests: "Colheitas",
    };
    const label = metricLabels[rule.key] || rule.key;
    return `${label} >= ${rule.gte}`;
  }
  if (rule.type === "cropPlant") {
    return `Plantar ${itemLabel(rule.cropType)}: ${rule.gte}+`;
  }
  if (rule.type === "uniqueCrops") {
    return `Culturas distintas: ${rule.gte}+`;
  }
  return "Requisito adicional";
}

function formatDevRequirements(item, options = {}) {
  const devById = options.devById instanceof Map ? options.devById : new Map();
  const worldById = options.worldById instanceof Map ? options.worldById : new Map();
  const parts = [];

  const devReqs = item.requiresDev || [];
  if (devReqs.length) {
    const titles = devReqs.map((reqId) => {
      const req = devById.get(reqId);
      return req ? req.title : reqId;
    });
    parts.push(`Concluir antes: ${titles.join(" | ")}`);
  }

  const worldReqs = item.requiresUpgrades || [];
  if (worldReqs.length) {
    const titles = worldReqs.map((reqId) => {
      const req = worldById.get(reqId);
      return req ? req.title : reqId;
    });
    parts.push(`Upgrades previos: ${titles.join(" | ")}`);
  }

  const featureReqs = item.requiresFeatures || [];
  if (featureReqs.length) {
    parts.push(`Features necessarias: ${featureReqs.map(featureLabel).join(" | ")}`);
  }

  const ruleReqs = item.unlockRules || [];
  if (ruleReqs.length) {
    parts.push(`Metas: ${ruleReqs.map(formatRuleLabel).join(" | ")}`);
  }

  if (!parts.length) {
    return "Sem requisito adicional";
  }

  return parts.join(" • ");
}

function uniqueLines(lines) {
  return Array.from(new Set((lines || []).filter(Boolean)));
}

function buildLockFeedback(item, options = {}) {
  if (!item) {
    return {
      blockedReasons: [],
      unlockSteps: [],
    };
  }

  const devById = options.devById instanceof Map ? options.devById : new Map();
  const worldById = options.worldById instanceof Map ? options.worldById : new Map();

  const blockedReasons = [];
  const unlockSteps = [];

  const missingDevReqs = item.missingDevReqs || [];
  if (missingDevReqs.length) {
    const labels = missingDevReqs.map((id) => devById.get(id)?.title || id);
    blockedReasons.push(`Niveis anteriores faltando: ${labels.join(" | ")}`);
    unlockSteps.push(`Conclua antes: ${labels.join(" | ")}.`);
  }

  const missingFeatureReqs = item.missingFeatureReqs || item.missingFeatures || [];
  if (missingFeatureReqs.length) {
    blockedReasons.push(`Falta liberar: ${missingFeatureReqs.map(featureLabel).join(" | ")}`);
    missingFeatureReqs.forEach((featureId) => {
      unlockSteps.push(featureUnlockHint(featureId));
    });
  }

  const missingUpgrades = item.missingUpgrades || [];
  if (missingUpgrades.length) {
    const labels = missingUpgrades.map((id) => worldById.get(id)?.title || id);
    blockedReasons.push(`Upgrades anteriores faltando: ${labels.join(" | ")}`);
    unlockSteps.push(`Compre antes: ${labels.join(" | ")}.`);
  }

  const missingRules = item.missingRuleReqs || item.missingRules || [];
  if (missingRules.length) {
    blockedReasons.push(`Metas pendentes: ${missingRules.map((rule) => rule.label || "meta").join(" | ")}`);
    missingRules.forEach((rule) => {
      if (rule.action) unlockSteps.push(rule.action);
    });
  }

  return {
    blockedReasons: uniqueLines(blockedReasons),
    unlockSteps: uniqueLines(unlockSteps),
  };
}

function parseTierFromId(id) {
  if (!id || typeof id !== "string") return null;
  const match = id.match(/\.t(\d+)$/);
  if (!match) return null;
  return Number(match[1]);
}

function normalizeWorldTrackId(upgradeId) {
  if (typeof upgradeId !== "string") return "world.misc";
  if (upgradeId.startsWith("upg.world.size.")) return "world.size";
  return upgradeId.replace(/\.t\d+$/, "");
}

function worldTrackTitle(trackKey, firstUpgrade) {
  const cropMatch = trackKey.match(/^upg\.crop\.([^.]+)\.(growth\.speed|planting\.speed|harvest\.speed|yield)$/);
  if (cropMatch) {
    const cropId = cropMatch[1];
    const aspect = cropMatch[2];
    const crop = itemLabel(cropId);
    if (aspect === "growth.speed") return `${crop}: Velocidade de Crescimento`;
    if (aspect === "planting.speed") return `${crop}: Velocidade de Plantio`;
    if (aspect === "harvest.speed") return `${crop}: Velocidade de Colheita`;
    if (aspect === "yield") return `${crop}: Quantidade por Colheita`;
  }

  const droneMatch = trackKey.match(/^upg\.drone\.(move\.speed|work\.speed)$/);
  if (droneMatch) {
    const aspect = droneMatch[1];
    if (aspect === "move.speed") return "Drone: Velocidade de Movimento";
    if (aspect === "work.speed") return "Drone: Velocidade de Trabalho";
  }

  const labels = {
    "world.size": "Upgrade de Mundo",
    "upg.debug.system": "Sistema: Debug",
    "upg.dialog.system": "Sistema: Dialogos",
  };
  return labels[trackKey] || (firstUpgrade ? firstUpgrade.title : trackKey);
}

function buildTrackFromDevItems(trackId, branchId, title, description, items) {
  const sorted = [...(items || [])].sort((a, b) => a.level - b.level);
  if (!sorted.length) return null;

  const purchasedCount = sorted.filter((item) => item.isPurchased).length;
  const nextItem = sorted.find((item) => !item.isPurchased) || null;
  const total = sorted.length;
  const currentStep = nextItem ? sorted.indexOf(nextItem) + 1 : total;

  return {
    id: trackId,
    branchId,
    kind: "dev-track",
    title,
    description,
    total,
    currentStep,
    purchasedCount,
    progressLabel: `[${currentStep}/${total}]`,
    isCompleted: !nextItem,
    isUnlocked: Boolean(nextItem && nextItem.isUnlocked),
    canAfford: Boolean(nextItem && nextItem.canAfford),
    nextItem,
  };
}

function buildWorldTracks(worldUpgrades) {
  const grouped = new Map();

  (worldUpgrades || []).forEach((upgrade, order) => {
    const trackKey = normalizeWorldTrackId(upgrade.id);
    if (!grouped.has(trackKey)) {
      grouped.set(trackKey, []);
    }
    grouped.get(trackKey).push({ ...upgrade, _order: order });
  });

  return Array.from(grouped.entries())
    .map(([trackKey, list]) => {
      const items = [...list].sort((a, b) => a._order - b._order);
      const purchasedCount = items.filter((item) => item.isPurchased).length;
      const nextItem = items.find((item) => !item.isPurchased) || null;
      const total =
        trackKey === "world.size"
          ? items.length + 1
          : items.reduce((max, item) => Math.max(max, parseTierFromId(item.id) || 0), 0) || items.length;
      const currentStep = nextItem
        ? trackKey === "world.size"
          ? purchasedCount + 1
          : parseTierFromId(nextItem.id) || purchasedCount + 1
        : total;

      return {
        id: `track.${trackKey}`,
        branchId: "game",
        kind: "world-track",
        title: worldTrackTitle(trackKey, items[0]),
        description:
          trackKey === "world.size"
            ? "Expansao continua do mundo de 1x2 ate 32x32 no mesmo card."
            : `Trilha progressiva em um unico card para ${worldTrackTitle(trackKey, items[0]).toLowerCase()}.`,
        total,
        currentStep,
        purchasedCount,
        progressLabel: `[${Math.min(currentStep, total)}/${total}]`,
        isCompleted: !nextItem,
        isUnlocked: Boolean(nextItem && nextItem.isUnlocked),
        canAfford: Boolean(nextItem && nextItem.canAfford),
        nextItem,
      };
    })
    .sort((a, b) => {
      if (a.id === "track.world.size") return -1;
      if (b.id === "track.world.size") return 1;
      return a.title.localeCompare(b.title);
    });
}

function buildDevTracks(devTree, worldUpgrades) {
  const gameItems = (devTree.game || []).filter((item) => item.kind !== "base" && item.kind !== "world-upgrade");
  const codeItems = (devTree.code || []).filter((item) => item.kind !== "base" && item.kind !== "world-upgrade");

  const gameTracks = [...buildWorldTracks(worldUpgrades)];
  if (gameItems.length) {
    const gameTrack = buildTrackFromDevItems(
      "track.dev.game.features",
      "game",
      "Jogo: Recursos Avancados",
      "Desbloqueios especiais de jogo no fim da progressao.",
      gameItems
    );
    if (gameTrack) gameTracks.push(gameTrack);
  }

  const codeTracks = [];
  if (codeItems.length) {
    const codeTrack = buildTrackFromDevItems(
      "track.dev.code.core",
      "code",
      "Codigo: Trilha Principal",
      "Evolucao de linguagem e recursos de script em um unico card progressivo.",
      codeItems
    );
    if (codeTrack) codeTracks.push(codeTrack);
  }

  return {
    game: gameTracks,
    code: codeTracks,
  };
}

function renderDevTrackCard(track, selectedTrackId) {
  const selectedClass = selectedTrackId === track.id ? "is-selected" : "";
  const stateClass = track.isCompleted ? "is-completed" : track.isUnlocked ? "is-unlocked" : "is-locked";
  const status = track.isCompleted ? "Concluido" : track.isUnlocked ? "Disponivel" : "Bloqueado";
  const nextTitle = track.nextItem ? track.nextItem.title : "Todos os niveis concluidos";
  return `
    <article
      class="dev-card ${stateClass} ${selectedClass}"
      data-dev-track-id="${track.id}"
    >
      <p class="muted">Progresso ${track.progressLabel}</p>
      <h5>${track.title}</h5>
      <p class="muted">${track.description}</p>
      <p class="muted">Proximo: ${nextTitle}</p>
      <div class="badge-row">
        <span class="badge ${track.isCompleted ? "completed" : track.isUnlocked ? "unlocked" : "locked"}">${status}</span>
      </div>
    </article>
  `;
}

function groupGameTracks(tracks) {
  const groups = {
    expansao: [],
    culturas: [],
    drone: [],
    sistema: [],
  };

  (tracks || []).forEach((track) => {
    const id = track.id || "";
    if (id === "track.world.size") {
      groups.expansao.push(track);
      return;
    }
    if (id.startsWith("track.upg.crop.")) {
      groups.culturas.push(track);
      return;
    }
    if (id.startsWith("track.upg.drone.")) {
      groups.drone.push(track);
      return;
    }
    groups.sistema.push(track);
  });

  return [
    { id: "expansao", title: "Expansao", tracks: groups.expansao },
    { id: "culturas", title: "Culturas", tracks: groups.culturas },
    { id: "drone", title: "Drone", tracks: groups.drone },
    { id: "sistema", title: "Sistema", tracks: groups.sistema },
  ].filter((group) => group.tracks.length > 0);
}

function renderDevBranch(title, branchId, tracks, selectedTrackId) {
  if (branchId === "game") {
    const groups = groupGameTracks(tracks);
    return `
      <section class="dev-branch">
        <h4>${title}</h4>
        <p class="muted">Cards progressivos: cada compra atualiza para o proximo nivel no mesmo card.</p>
        <div class="dev-track-groups" data-dev-branch="${branchId}">
          ${groups
            .map(
              (group) => `
            <section class="dev-track-group" data-track-group="${group.id}">
              <h5>${group.title}</h5>
              <div class="dev-branch-grid">
                ${group.tracks.map((track) => renderDevTrackCard(track, selectedTrackId)).join("")}
              </div>
            </section>
          `
            )
            .join("")}
        </div>
      </section>
    `;
  }

  return `
    <section class="dev-branch">
      <h4>${title}</h4>
      <p class="muted">Cards progressivos: cada compra atualiza para o proximo nivel no mesmo card.</p>
      <div class="dev-branch-grid" data-dev-branch="${branchId}">
        ${(tracks || []).map((track) => renderDevTrackCard(track, selectedTrackId)).join("")}
      </div>
    </section>
  `;
}

function renderDevTrackDetail(track, options = {}) {
  if (!track) {
    return `
      <section class="mission-card dev-upgrade-detail" data-selected-dev-upgrade-id="">
        <h4>Detalhes de Upgrade</h4>
        <p class="muted">Clique em um card para abrir os detalhes da trilha progressiva.</p>
      </section>
    `;
  }

  const item = track.nextItem;
  const requirements = item
    ? formatDevRequirements(item, {
        devById: options.devById,
        worldById: options.worldById,
      })
    : "Sem requisito adicional";
  const missing =
    item && Object.entries(item.missingCosts || {}).length
      ? Object.entries(item.missingCosts || {})
          .map(([id, qty]) => `${itemLabel(id)}: ${qty}`)
          .join(" | ")
      : "Nada pendente";
  const canBuy = Boolean(item && !track.isCompleted && track.isUnlocked && track.canAfford);
  const unlocks = item ? (item.unlocks || []).map(featureLabel).join(" | ") || "Sem feature direta" : "Sem feature direta";
  const buyKind = track.kind === "world-track" ? "world" : "dev";
  const buyTargetId = item ? item.id : "";
  const lockFeedback = buildLockFeedback(item, {
    devById: options.devById,
    worldById: options.worldById,
  });

  if (item && !track.isCompleted && !track.isUnlocked && !lockFeedback.blockedReasons.length) {
    lockFeedback.blockedReasons.push("Este upgrade ainda nao esta disponivel.");
  }

  if (item && !track.isCompleted && track.isUnlocked && !track.canAfford) {
    lockFeedback.unlockSteps.push("Colete os itens faltantes e tente novamente.");
  }

  const blockedDetails = lockFeedback.blockedReasons.length
    ? lockFeedback.blockedReasons.map((line) => `<li>${line}</li>`).join("")
    : "<li>Nenhum bloqueio identificado.</li>";
  const unlockStepsDetails = lockFeedback.unlockSteps.length
    ? lockFeedback.unlockSteps.map((line) => `<li>${line}</li>`).join("")
    : "<li>Sem acao adicional no momento.</li>";

  return `
    <section class="mission-card dev-upgrade-detail" data-selected-dev-upgrade-id="${track.id}">
      <h4>${track.title} ${track.progressLabel}</h4>
      <p class="muted">Ramo: ${track.branchId === "game" ? "Jogo" : "Codigo"}</p>
      <p>${track.description}</p>
      <p class="muted">Proximo upgrade: ${item ? item.title : "Concluido"}</p>
      <p>${item ? item.description : "Todos os niveis desta trilha ja foram comprados."}</p>
      ${item && !track.isCompleted && !track.isUnlocked ? `<p><strong>Para liberar este upgrade:</strong> siga os passos abaixo.</p>` : ""}
      <p class="muted">Requisitos: ${requirements}</p>
      <p class="muted">Consumo: ${formatCostList(item ? item.costs : {})}</p>
      <p class="muted">Faltando: ${missing}</p>
      <p class="muted">Desbloqueia: ${unlocks}</p>
      <details class="lesson-box compact" open>
        <summary>Por que esta bloqueado?</summary>
        <ul class="hint-list">${blockedDetails}</ul>
      </details>
      <details class="lesson-box compact" open>
        <summary>O que fazer para desbloquear</summary>
        <ul class="hint-list">${unlockStepsDetails}</ul>
      </details>
      <div class="badge-row">
        <span class="badge ${track.isCompleted ? "completed" : track.isUnlocked ? "unlocked" : "locked"}">
          ${track.isCompleted ? "Concluido" : track.isUnlocked ? "Disponivel" : "Bloqueado"}
        </span>
      </div>
      <button
        class="btn btn-primary"
        data-dev-action="buy"
        data-dev-buy-kind="${buyKind}"
        data-dev-upgrade-id="${buyTargetId}"
        ${canBuy ? "" : "disabled"}
      >
        ${track.isCompleted ? "Ja concluido" : "Comprar proximo nivel"}
      </button>
    </section>
  `;
}

function renderDevTreePage(devTree, worldUpgrades, selectedTrackId) {
  const tracksByBranch = buildDevTracks(devTree, worldUpgrades);
  const allTracks = [...(tracksByBranch.game || []), ...(tracksByBranch.code || [])];

  const allDevItems = [...(devTree.game || []), ...(devTree.code || [])];
  const devById = new Map(allDevItems.map((item) => [item.id, item]));
  const worldById = new Map((worldUpgrades || []).map((item) => [item.id, item]));
  const selectedTrack = allTracks.find((track) => track.id === selectedTrackId) || null;

  const detailHtml = renderDevTrackDetail(selectedTrack, {
    devById,
    worldById,
  });

  return `
    <section class="dev-tree-layout">
      <section class="mission-card">
        <h3>Arvore Completa de Desenvolvimento</h3>
        <p class="muted">Nova arvore separada da arvore de missoes, com trilhas progressivas no mesmo card.</p>
        ${renderDevBranch("Ramo Jogo", "game", tracksByBranch.game, selectedTrackId)}
        ${renderDevBranch("Ramo Codigo", "code", tracksByBranch.code, selectedTrackId)}
      </section>
      ${detailHtml}
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
export function createProgressionUI({ gamePhases, onLog }) {
  const openModalBtn = document.querySelector("#openProgressModalBtn");
  const closeModalBtn = document.querySelector("#closeProgressModalBtn");
  const openPageBtn = document.querySelector("#openProgressPageBtn");
  const closePageBtn = document.querySelector("#closeProgressPageBtn");
  const openDevTreeBtn = document.querySelector("#openDevTreePageBtn");
  const closeDevTreeBtn = document.querySelector("#closeDevTreePageBtn");

  const progressModal = document.querySelector("#progressModal");
  const progressPage = document.querySelector("#progressPage");
  const devTreePage = document.querySelector("#devTreePage");
  const modalContent = document.querySelector("#progressModalContent");
  const pageContent = document.querySelector("#progressPageContent");
  const devTreeContent = document.querySelector("#devTreePageContent");
  let cleanupInteractiveTree = null;
  let selectedDevTrackId = null;

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

  function openDevPage() {
    devTreePage.classList.add("is-open");
    devTreePage.setAttribute("aria-hidden", "false");
    renderDevPage();
  }

  function closeDevPage() {
    devTreePage.classList.remove("is-open");
    devTreePage.setAttribute("aria-hidden", "true");
  }

  function renderDevPage() {
    const devTree = gamePhases.getDevTree();
    const worldUpgrades = typeof gamePhases.getWorldUpgrades === "function" ? gamePhases.getWorldUpgrades() : [];
    const tracksByBranch = buildDevTracks(devTree, worldUpgrades);
    const allTracks = [...(tracksByBranch.game || []), ...(tracksByBranch.code || [])];

    if (!selectedDevTrackId && allTracks.length > 0) {
      const initial = allTracks.find((track) => track.nextItem && track.isUnlocked && !track.isCompleted) || allTracks[0];
      selectedDevTrackId = initial.id;
    }

    const stillExists = allTracks.some((track) => track.id === selectedDevTrackId);
    if (!stillExists && allTracks.length > 0) {
      selectedDevTrackId = allTracks[0].id;
    }

    devTreeContent.innerHTML = renderDevTreePage(devTree, worldUpgrades, selectedDevTrackId);
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
  if (openDevTreeBtn) {
    openDevTreeBtn.addEventListener("click", openDevPage);
  }
  if (closeDevTreeBtn) {
    closeDevTreeBtn.addEventListener("click", closeDevPage);
  }

  progressModal.addEventListener("click", (event) => {
    if (event.target === progressModal) closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModal();
      closePage();
      closeDevPage();
    }
  });

  if (devTreePage && devTreeContent) {
    devTreePage.addEventListener("click", (event) => {
      if (event.target === devTreePage) closeDevPage();
    });

    devTreeContent.addEventListener("click", (event) => {
      const buyEl = event.target.closest("[data-dev-action='buy']");
      if (buyEl) {
        const buyKind = buyEl.dataset.devBuyKind;
        const upgradeId = buyEl.dataset.devUpgradeId;
        if (!upgradeId) return;
        const result =
          buyKind === "world"
            ? gamePhases.purchaseWorldUpgrade(upgradeId)
            : gamePhases.purchaseDevUpgrade(upgradeId);
        if (typeof onLog === "function") {
          if (result.ok) {
            onLog(`Upgrade aplicado: ${upgradeId}`);
          } else {
            onLog(`Falha no upgrade ${upgradeId}: ${result.reason}`);
          }
        }
        renderDevPage();
        render();
        return;
      }

      const cardEl = event.target.closest("[data-dev-track-id]");
      if (cardEl) {
        selectedDevTrackId = cardEl.dataset.devTrackId || null;
        renderDevPage();
      }
    });
  }

  if (typeof onLog === "function") {
    onLog("UI de progresso habilitada: modal rapido + pagina completa.");
  }

  return {
    openModal,
    closeModal,
    openPage,
    closePage,
    openDevPage,
    closeDevPage,
    render,
    renderDevPage,
  };
}

const DEFAULT_PHASES = [
  {
    id: "fase-1",
    title: "Movimento Basico",
    description: "Aprenda a mover o bot pelo mapa.",
    unlocks: ["api.move"],
    completion: {
      moves: 6,
    },
  },
  {
    id: "fase-2",
    title: "Plantio Basico",
    description: "Aprenda a plantar culturas em diferentes celulas.",
    unlocks: ["api.plant"],
    completion: {
      plants: 4,
    },
  },
  {
    id: "fase-3",
    title: "Colheita Basica",
    description: "Aprenda a colher apos plantar.",
    unlocks: ["api.harvest"],
    completion: {
      harvests: 2,
    },
  },
  {
    id: "fase-4",
    title: "Logica com If",
    description: "Preparacao para liberar condicionais no script.",
    unlocks: ["lang.if"],
    completion: {
      runs: 3,
    },
  },
  {
    id: "fase-5",
    title: "Repeticoes com Loops",
    description: "Preparacao para liberar repeticoes no script.",
    unlocks: ["lang.loop"],
    completion: {
      runs: 6,
    },
  },
  {
    id: "fase-6",
    title: "Funcoes",
    description: "Preparacao para liberar funcoes no script.",
    unlocks: ["lang.function"],
    completion: {
      runs: 10,
    },
  },
];

function clonePhase(phase) {
  return {
    ...phase,
    unlocks: [...(phase.unlocks || [])],
    completion: {
      ...(phase.completion || {}),
    },
  };
}

function getProgressLabel(stats, completion) {
  const parts = [];
  if (completion.moves) parts.push(`moves ${stats.moves}/${completion.moves}`);
  if (completion.plants) parts.push(`plants ${stats.plants}/${completion.plants}`);
  if (completion.harvests) parts.push(`harvests ${stats.harvests}/${completion.harvests}`);
  if (completion.runs) parts.push(`runs ${stats.runs}/${completion.runs}`);
  return parts.join(" | ");
}

function isPhaseCompleted(stats, phase) {
  const completion = phase.completion || {};
  if (completion.moves && stats.moves < completion.moves) return false;
  if (completion.plants && stats.plants < completion.plants) return false;
  if (completion.harvests && stats.harvests < completion.harvests) return false;
  if (completion.runs && stats.runs < completion.runs) return false;
  return true;
}

export function createGamePhases({ onLog, onPhaseChanged, phases = DEFAULT_PHASES } = {}) {
  const phaseList = phases.map(clonePhase);
  let currentIndex = 0;
  let stats = {
    moves: 0,
    plants: 0,
    harvests: 0,
    runs: 0,
  };

  function currentPhase() {
    return phaseList[currentIndex] || phaseList[phaseList.length - 1];
  }

  function getCurrentPhase() {
    return {
      ...currentPhase(),
      index: currentIndex,
      progress: {
        ...stats,
      },
      progressLabel: getProgressLabel(stats, currentPhase().completion || {}),
    };
  }

  function getAllPhases() {
    return phaseList.map((phase, index) => ({
      ...phase,
      index,
      isCurrent: index === currentIndex,
      isUnlocked: index <= currentIndex,
    }));
  }

  function getUnlockedFeatures() {
    const featureSet = new Set();
    for (let i = 0; i <= currentIndex; i += 1) {
      const phase = phaseList[i];
      (phase.unlocks || []).forEach((feature) => featureSet.add(feature));
    }
    return Array.from(featureSet);
  }

  function notifyPhaseChanged(previousIndex, reason) {
    if (typeof onPhaseChanged === "function") {
      onPhaseChanged({
        previousIndex,
        currentIndex,
        phase: getCurrentPhase(),
        reason,
      });
    }
  }

  function advancePhase(reason = "auto") {
    if (currentIndex >= phaseList.length - 1) return false;
    const previous = currentIndex;
    currentIndex += 1;

    if (typeof onLog === "function") {
      const p = currentPhase();
      onLog(`Fase avancou para ${p.title} (${p.id}).`);
      onLog(`Desbloqueios atuais: ${getUnlockedFeatures().join(", ")}`);
    }

    notifyPhaseChanged(previous, reason);
    return true;
  }

  function tryAutoAdvance(reason = "auto") {
    let changed = false;
    while (currentIndex < phaseList.length - 1 && isPhaseCompleted(stats, currentPhase())) {
      const ok = advancePhase(reason);
      if (!ok) break;
      changed = true;
    }
    return changed;
  }

  function recordEvent(type) {
    if (type === "move") stats.moves += 1;
    if (type === "plant") stats.plants += 1;
    if (type === "harvest") stats.harvests += 1;
    if (type === "run") stats.runs += 1;
    tryAutoAdvance("progress");
  }

  function setPhase(value) {
    let target = -1;
    if (typeof value === "number" && Number.isInteger(value)) {
      target = value;
    }
    if (typeof value === "string") {
      target = phaseList.findIndex((phase) => phase.id === value);
    }

    if (target < 0 || target >= phaseList.length) {
      return { ok: false, reason: "invalid-phase" };
    }

    const previous = currentIndex;
    currentIndex = target;
    notifyPhaseChanged(previous, "manual-set");

    if (typeof onLog === "function") {
      const p = currentPhase();
      onLog(`Fase ajustada manualmente para ${p.title} (${p.id}).`);
      onLog(`Desbloqueios atuais: ${getUnlockedFeatures().join(", ")}`);
    }

    return { ok: true, phase: getCurrentPhase() };
  }

  function resetProgress({ keepPhase = false } = {}) {
    stats = {
      moves: 0,
      plants: 0,
      harvests: 0,
      runs: 0,
    };

    if (!keepPhase) {
      const previous = currentIndex;
      currentIndex = 0;
      notifyPhaseChanged(previous, "reset");
    }

    if (typeof onLog === "function") {
      onLog("Progresso de fases resetado.");
      const p = currentPhase();
      onLog(`Fase atual: ${p.title} (${p.id}).`);
      onLog(`Desbloqueios atuais: ${getUnlockedFeatures().join(", ")}`);
    }
  }

  return {
    getCurrentPhase,
    getAllPhases,
    getUnlockedFeatures,
    recordEvent,
    tryAutoAdvance,
    advancePhase,
    setPhase,
    resetProgress,
  };
}

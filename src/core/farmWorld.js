function tileKey(x, y) {
  return `${x}:${y}`;
}

function parseTileKey(key) {
  const [x, y] = key.split(":").map(Number);
  return { x, y };
}

function buildDefaultSoilState(overrides = {}) {
  return {
    water: 50,
    nutrients: 50,
    ph: 6.5,
    organicMatter: 30,
    salinity: 5,
    temperature: 22,
    ...overrides,
  };
}

function cloneCrop(crop) {
  if (!crop) return null;
  return {
    ...crop,
  };
}

function cloneSoil(soil) {
  return {
    type: soil.type,
    levels: {
      ...soil.levels,
    },
    extra: {
      ...soil.extra,
    },
  };
}

export function createFarmWorld({
  gridSize = 8,
  defaultSoilType = "loam",
  defaultSoilLevels = {},
} = {}) {
  const state = {
    x: 0,
    y: 0,
    crops: new Map(),
    soils: new Map(),
    turn: 0,
  };

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      const key = tileKey(x, y);
      state.soils.set(key, {
        type: defaultSoilType,
        levels: buildDefaultSoilState(defaultSoilLevels),
        extra: {},
      });
    }
  }

  function clampToGrid(value) {
    return Math.max(0, Math.min(gridSize - 1, value));
  }

  function isInsideGrid(x, y) {
    return x >= 0 && x < gridSize && y >= 0 && y < gridSize;
  }

  function reset() {
    state.x = 0;
    state.y = 0;
    state.crops.clear();
    state.turn = 0;

    for (const soil of state.soils.values()) {
      soil.type = defaultSoilType;
      soil.levels = buildDefaultSoilState(defaultSoilLevels);
      soil.extra = {};
    }
  }

  function moveBy(dx, dy) {
    const from = { x: state.x, y: state.y };
    const targetX = clampToGrid(state.x + dx);
    const targetY = clampToGrid(state.y + dy);
    const moved = targetX !== state.x || targetY !== state.y;

    if (!moved) {
      return {
        moved: false,
        hitBoundary: true,
        from,
        to: from,
      };
    }

    state.x = targetX;
    state.y = targetY;

    return {
      moved: true,
      hitBoundary: false,
      from,
      to: { x: state.x, y: state.y },
    };
  }

  function getSoilAt(x, y) {
    if (!isInsideGrid(x, y)) return null;
    const soil = state.soils.get(tileKey(x, y));
    if (!soil) return null;
    return cloneSoil(soil);
  }

  function updateSoilAt(x, y, patch = {}) {
    if (!isInsideGrid(x, y)) {
      return { updated: false, reason: "outside-grid" };
    }

    const key = tileKey(x, y);
    const soil = state.soils.get(key);
    if (!soil) {
      return { updated: false, reason: "soil-not-found" };
    }

    if (patch.type) soil.type = patch.type;

    if (patch.levels) {
      soil.levels = {
        ...soil.levels,
        ...patch.levels,
      };
    }

    if (patch.extra) {
      soil.extra = {
        ...soil.extra,
        ...patch.extra,
      };
    }

    return {
      updated: true,
      x,
      y,
      soil: cloneSoil(soil),
    };
  }

  function plant(cropType = "generic") {
    const key = tileKey(state.x, state.y);
    const wasPlanted = state.crops.has(key);
    const crop = {
      type: cropType,
      plantedTurn: state.turn,
    };
    state.crops.set(key, crop);

    const soil = state.soils.get(key);
    return {
      x: state.x,
      y: state.y,
      wasPlanted,
      crop: cloneCrop(crop),
      soil: soil ? cloneSoil(soil) : null,
    };
  }

  function harvest() {
    const key = tileKey(state.x, state.y);
    const crop = state.crops.get(key);
    const wasPlanted = Boolean(crop);
    state.crops.delete(key);

    const soil = state.soils.get(key);
    return {
      x: state.x,
      y: state.y,
      wasPlanted,
      harvestedCrop: cloneCrop(crop),
      soil: soil ? cloneSoil(soil) : null,
    };
  }

  function passTurn() {
    state.turn += 1;
    return state.turn;
  }

  function getSnapshot() {
    return {
      position: { x: state.x, y: state.y },
      turn: state.turn,
      crops: Array.from(state.crops.entries()).map(([key, crop]) => ({
        ...parseTileKey(key),
        crop: cloneCrop(crop),
      })),
      soils: Array.from(state.soils.entries()).map(([key, soil]) => ({
        ...parseTileKey(key),
        soil: cloneSoil(soil),
      })),
    };
  }

  return {
    gridSize,
    reset,
    moveBy,
    getSoilAt,
    updateSoilAt,
    plant,
    harvest,
    passTurn,
    getSnapshot,
  };
}

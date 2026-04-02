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
  gridWidth,
  gridHeight,
  defaultSoilType = "loam",
  defaultSoilLevels = {},
} = {}) {
  let width = Number.isInteger(gridWidth) ? gridWidth : gridSize;
  let height = Number.isInteger(gridHeight) ? gridHeight : gridSize;

  const state = {
    x: 0,
    y: 0,
    crops: new Map(),
    soils: new Map(),
    turn: 0,
  };

  function fillMissingSoils() {
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const key = tileKey(x, y);
        if (state.soils.has(key)) continue;

        state.soils.set(key, {
          type: defaultSoilType,
          levels: buildDefaultSoilState(defaultSoilLevels),
          extra: {},
        });
      }
    }
  }

  function pruneOutsideGrid() {
    for (const key of state.crops.keys()) {
      const pos = parseTileKey(key);
      if (pos.x < 0 || pos.x >= width || pos.y < 0 || pos.y >= height) {
        state.crops.delete(key);
      }
    }

    for (const key of state.soils.keys()) {
      const pos = parseTileKey(key);
      if (pos.x < 0 || pos.x >= width || pos.y < 0 || pos.y >= height) {
        state.soils.delete(key);
      }
    }
  }

  fillMissingSoils();

  function clampToGridX(value) {
    return Math.max(0, Math.min(width - 1, value));
  }

  function clampToGridY(value) {
    return Math.max(0, Math.min(height - 1, value));
  }

  function isInsideGrid(x, y) {
    return x >= 0 && x < width && y >= 0 && y < height;
  }

  function reset() {
    state.x = 0;
    state.y = 0;
    state.crops.clear();
    state.turn = 0;

    state.soils.clear();
    fillMissingSoils();

    for (const soil of state.soils.values()) {
      soil.type = defaultSoilType;
      soil.levels = buildDefaultSoilState(defaultSoilLevels);
      soil.extra = {};
    }
  }

  function moveBy(dx, dy) {
    const from = { x: state.x, y: state.y };
    const targetX = clampToGridX(state.x + dx);
    const targetY = clampToGridY(state.y + dy);
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
      plantedAt: Date.now(),
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

  function getGridDimensions() {
    return {
      width,
      height,
    };
  }

  function setGridDimensions(nextWidth, nextHeight) {
    const safeWidth = Math.max(1, Number(nextWidth) || width);
    const safeHeight = Math.max(1, Number(nextHeight) || height);

    width = safeWidth;
    height = safeHeight;

    pruneOutsideGrid();
    fillMissingSoils();

    state.x = clampToGridX(state.x);
    state.y = clampToGridY(state.y);

    return {
      ok: true,
      dimensions: getGridDimensions(),
    };
  }

  function getSnapshot() {
    return {
      dimensions: {
        width,
        height,
      },
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

  function restoreSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") return;

    if (snapshot.dimensions) {
      const w = snapshot.dimensions.width;
      const h = snapshot.dimensions.height;
      if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) {
        width = w;
        height = h;
      }
    }

    if (snapshot.position) {
      state.x = Number.isFinite(snapshot.position.x) ? snapshot.position.x : 0;
      state.y = Number.isFinite(snapshot.position.y) ? snapshot.position.y : 0;
    }

    if (Number.isFinite(snapshot.turn)) {
      state.turn = snapshot.turn;
    }

    state.crops.clear();
    if (Array.isArray(snapshot.crops)) {
      snapshot.crops.forEach(({ x, y, crop }) => {
        if (crop && typeof crop.type === "string") {
          state.crops.set(tileKey(x, y), {
            type: crop.type,
            plantedTurn: Number.isFinite(crop.plantedTurn) ? crop.plantedTurn : state.turn,
            plantedAt: Number.isFinite(crop.plantedAt) ? crop.plantedAt : Date.now(),
          });
        }
      });
    }

    state.soils.clear();
    if (Array.isArray(snapshot.soils)) {
      snapshot.soils.forEach(({ x, y, soil }) => {
        if (soil) state.soils.set(tileKey(x, y), cloneSoil(soil));
      });
    }

    fillMissingSoils();
  }

  return {
    get gridSize() {
      return width;
    },
    get gridWidth() {
      return width;
    },
    get gridHeight() {
      return height;
    },
    reset,
    getGridDimensions,
    setGridDimensions,
    moveBy,
    getSoilAt,
    updateSoilAt,
    plant,
    harvest,
    passTurn,
    getSnapshot,
    restoreSnapshot,
  };
}

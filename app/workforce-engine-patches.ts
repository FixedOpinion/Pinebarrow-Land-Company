type WorkforcePatch = {
  find: string;
  replace: string;
  label: string;
};

function replaceRequired(source: string, patch: WorkforcePatch) {
  if (!source.includes(patch.find)) {
    throw new Error(`Pinebarrow workforce patch missing marker: ${patch.label}`);
  }
  return source.replace(patch.find, patch.replace);
}

export function applyWorkforceEnginePatches(engineSource: string) {
  let source = engineSource;

  const patches: WorkforcePatch[] = [
    {
      label: "save-version-reader",
      find: "if (!saved || ![1, 2, 3, 4, 5, 6, 7, 8].includes(saved.version)) return false;",
      replace: "if (!saved || ![1, 2, 3, 4, 5, 6, 7, 8, 9].includes(saved.version)) return false;",
    },
    {
      label: "initial-workforce-state",
      find: "          workers: 0,\n          sawAttached: false,",
      replace: "          workers: 0,\n          workerHouses: [],\n          workerAssignments: { mines: {}, warehouses: {} },\n          nextWorkerHouseId: 1,\n          sawAttached: false,",
    },
    {
      label: "save-version-writer",
      find: "          version: 8,",
      replace: "          version: 9,",
    },
    {
      label: "serialize-workforce",
      find: "          workers: state.workers,\n          sawAttached: state.sawAttached,",
      replace: "          workers: state.workerHouses.length,\n          workerHouses: state.workerHouses,\n          workerAssignments: state.workerAssignments,\n          nextWorkerHouseId: state.nextWorkerHouseId,\n          sawAttached: state.sawAttached,",
    },
    {
      label: "workforce-migration",
      find: "          state.workers = Math.max(0, Math.min(CONFIG.maxWorkers, Math.round(state.workers || 0)));\n          state.truckSizeLevel = Math.max(1, Math.min(CONFIG.maxTruckLevel, Math.round(state.truckSizeLevel || 1)));",
      replace: `          const legacyWorkerCount = Math.max(0, Math.min(CONFIG.maxWorkers, Math.round(state.workers || 0)));
          state.workerHouses = Array.isArray(saved.workerHouses) ? saved.workerHouses.map(function (house, index) {
            return {
              id: typeof house.id === "string" ? house.id : "worker-house-" + (index + 1),
              footprint: { w: 2, h: 2 },
              status: house.status === "placed" ? "placed" : "planned",
              x: Number.isFinite(house.x) ? house.x : null,
              y: Number.isFinite(house.y) ? house.y : null
            };
          }) : [];
          if (!state.workerHouses.length && legacyWorkerCount > 0) {
            for (let legacyIndex = 0; legacyIndex < legacyWorkerCount; legacyIndex += 1) {
              state.workerHouses.push({
                id: "legacy-worker-house-" + (legacyIndex + 1),
                footprint: { w: 2, h: 2 },
                status: "planned",
                x: null,
                y: null
              });
            }
          }
          state.workerAssignments = saved.workerAssignments && typeof saved.workerAssignments === "object"
            ? {
                mines: Object.assign({}, saved.workerAssignments.mines || {}),
                warehouses: Object.assign({}, saved.workerAssignments.warehouses || {})
              }
            : { mines: {}, warehouses: {} };
          state.nextWorkerHouseId = Math.max(
            1,
            Math.round(Number(saved.nextWorkerHouseId) || state.workerHouses.length + 1)
          );
          state.workers = state.workerHouses.length;
          reconcileWorkforceAssignments();
          state.truckSizeLevel = Math.max(1, Math.min(CONFIG.maxTruckLevel, Math.round(state.truckSizeLevel || 1)));`,
    },
    {
      label: "mine-production-staffing",
      find: "          const staffedOutput = CONFIG.mineOutputByLevel[mine.level] * CONFIG.workerOutputMultiplierByCount[state.workers];\n          const raw = Math.min(staffedOutput, free / cargoPerRaw);",
      replace: "          if (!workerHouseAssignedTo(\"mine\", mine.id)) return;\n          const staffedOutput = CONFIG.mineOutputByLevel[mine.level];\n          const raw = Math.min(staffedOutput, free / cargoPerRaw);",
    },
    {
      label: "mine-detail-staffing",
      find: "          const staffedOutput = CONFIG.mineOutputByLevel[state.mine.level] * CONFIG.workerOutputMultiplierByCount[state.workers];",
      replace: "          const staffedOutput = workerHouseAssignedTo(\"mine\", state.mine.id) ? CONFIG.mineOutputByLevel[state.mine.level] : 0;",
    },
  ];

  patches.forEach((patch) => {
    source = replaceRequired(source, patch);
  });

  const workforceHelpers = `
      function validWorkerHouseIds() {
        return new Set(state.workerHouses.map(function (house) { return house.id; }));
      }

      function reconcileWorkforceAssignments() {
        if (!state.workerAssignments || typeof state.workerAssignments !== "object") {
          state.workerAssignments = { mines: {}, warehouses: {} };
        }
        state.workerAssignments.mines = state.workerAssignments.mines || {};
        state.workerAssignments.warehouses = state.workerAssignments.warehouses || {};
        const validHouses = validWorkerHouseIds();
        const used = new Set();
        ["mines", "warehouses"].forEach(function (group) {
          Object.keys(state.workerAssignments[group]).forEach(function (siteId) {
            const houseId = state.workerAssignments[group][siteId];
            if (!validHouses.has(houseId) || used.has(houseId)) {
              delete state.workerAssignments[group][siteId];
              return;
            }
            const exists = group === "mines"
              ? state.mines.some(function (mine) { return mine.id === siteId; })
              : state.warehouses.some(function (warehouse) { return warehouse.id === siteId; });
            if (!exists) {
              delete state.workerAssignments[group][siteId];
              return;
            }
            used.add(houseId);
          });
        });

        const unassigned = state.workerHouses.filter(function (house) { return !used.has(house.id); });
        state.mines.forEach(function (mine) {
          if (!state.workerAssignments.mines[mine.id] && unassigned.length) {
            const house = unassigned.shift();
            state.workerAssignments.mines[mine.id] = house.id;
            used.add(house.id);
          }
        });
        state.workers = state.workerHouses.length;
      }

      function workerHouseAssignedTo(type, siteId) {
        if (!siteId) return null;
        const group = type === "warehouse" ? state.workerAssignments.warehouses : state.workerAssignments.mines;
        const houseId = group && group[siteId];
        if (!houseId) return null;
        return state.workerHouses.find(function (house) { return house.id === houseId; }) || null;
      }

      function workforceSnapshot() {
        reconcileWorkforceAssignments();
        const assignedIds = new Set();
        Object.keys(state.workerAssignments.mines).forEach(function (siteId) { assignedIds.add(state.workerAssignments.mines[siteId]); });
        Object.keys(state.workerAssignments.warehouses).forEach(function (siteId) { assignedIds.add(state.workerAssignments.warehouses[siteId]); });
        return {
          houses: state.workerHouses.map(function (house) { return Object.assign({}, house); }),
          assignments: {
            mines: Object.assign({}, state.workerAssignments.mines),
            warehouses: Object.assign({}, state.workerAssignments.warehouses)
          },
          mines: state.mines.map(function (mine, index) {
            return { id: mine.id, label: "Mine " + (index + 1), material: mine.material, level: mine.level, staffed: Boolean(workerHouseAssignedTo("mine", mine.id)) };
          }),
          warehouses: state.warehouses.map(function (warehouse, index) {
            return { id: warehouse.id, label: "Warehouse " + (index + 1), level: warehouse.level, staffed: Boolean(workerHouseAssignedTo("warehouse", warehouse.id)) };
          }),
          available: state.workerHouses.filter(function (house) { return !assignedIds.has(house.id); }).length,
          maxHouses: CONFIG.maxWorkers,
          nextHouseCost: state.workerHouses.length < CONFIG.maxWorkers ? CONFIG.workerCosts[state.workerHouses.length] : 0,
          cash: state.cash
        };
      }

      function buildWorkerHouseFoundation() {
        reconcileWorkforceAssignments();
        if (state.workerHouses.length >= CONFIG.maxWorkers) return { ok: false, message: "All current worker-house slots are built." };
        const cost = CONFIG.workerCosts[state.workerHouses.length];
        if (state.cash < cost) return { ok: false, message: "You need $" + cost + " to build the next worker house." };
        state.cash -= cost;
        const house = {
          id: "worker-house-" + state.nextWorkerHouseId++,
          footprint: { w: 2, h: 2 },
          status: "planned",
          x: null,
          y: null
        };
        state.workerHouses.push(house);
        state.workers = state.workerHouses.length;
        reconcileWorkforceAssignments();
        setContext("Worker house added", "This 2×2 worker house supplies exactly one worker. The worker is assigned to the first unstaffed mine until you reassign them in Workforce Management.");
        saveGameNow();
        renderInterface();
        return { ok: true, message: "Worker house built. One worker is now available to the company." };
      }

      function assignWorkerHouse(houseId, type, siteId) {
        reconcileWorkforceAssignments();
        const house = state.workerHouses.find(function (entry) { return entry.id === houseId; });
        const groupName = type === "warehouse" ? "warehouses" : "mines";
        const siteExists = type === "warehouse"
          ? state.warehouses.some(function (warehouse) { return warehouse.id === siteId; })
          : state.mines.some(function (mine) { return mine.id === siteId; });
        if (!house || !siteExists) return { ok: false, message: "That house or company site is no longer available." };
        ["mines", "warehouses"].forEach(function (group) {
          Object.keys(state.workerAssignments[group]).forEach(function (assignedSiteId) {
            if (state.workerAssignments[group][assignedSiteId] === houseId) delete state.workerAssignments[group][assignedSiteId];
          });
        });
        Object.keys(state.workerAssignments[groupName]).forEach(function (assignedSiteId) {
          if (assignedSiteId === siteId) delete state.workerAssignments[groupName][assignedSiteId];
        });
        state.workerAssignments[groupName][siteId] = houseId;
        saveGameNow();
        renderInterface();
        return { ok: true, message: "Worker reassigned safely." };
      }

      function unassignWorkerHouse(houseId) {
        ["mines", "warehouses"].forEach(function (group) {
          Object.keys(state.workerAssignments[group]).forEach(function (siteId) {
            if (state.workerAssignments[group][siteId] === houseId) delete state.workerAssignments[group][siteId];
          });
        });
        saveGameNow();
        renderInterface();
        return { ok: true, message: "Worker returned to the available pool. Any mine they left stops producing." };
      }

      root.pinebarrowWorkforce = {
        snapshot: workforceSnapshot,
        buildHouse: buildWorkerHouseFoundation,
        assign: assignWorkerHouse,
        unassign: unassignWorkerHouse
      };

`;

  source = replaceRequired(source, {
    label: "workforce-helper-anchor",
    find: "      function mineStatusText() {",
    replace: workforceHelpers + "      function mineStatusText() {",
  });

  return source;
}

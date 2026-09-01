(function () {
  "use strict";

  const ROOT_ID = "pinebarrow-visible-menu-demo";
  const PROFILE_CACHE_PREFIX = "pinebarrow-land-company-profile-v1-";
  const PROFILE_COUNT = 3;
  const MINE_STORAGE_BY_LEVEL = { 1: 6, 2: 7.5, 3: 9, 4: 11, 5: 13.5, 6: 16.5, 7: 20, 8: 24 };
  const MINE_OUTPUT_BY_LEVEL = { 1: 1, 2: 1.18, 3: 1.38, 4: 1.6, 5: 1.82, 6: 2.02, 7: 2.22, 8: 2.4 };
  const WORKER_OUTPUT_MULTIPLIER = { 0: 1, 1: 1.5, 2: 2, 3: 2.25, 4: 2.5 };
  const MATERIAL_NAMES = {
    logs: "Logs", stone: "Stone", clay: "Clay", coal: "Coal", iron: "Iron",
    copper: "Copper", tin: "Tin", quartz: "Quartz", silver: "Silver", gold: "Gold", sapphire: "Sapphire"
  };

  function readProfiles() {
    const records = [];
    for (let slot = 1; slot <= PROFILE_COUNT; slot += 1) {
      try {
        const raw = window.localStorage.getItem(PROFILE_CACHE_PREFIX + slot);
        if (!raw) continue;
        const record = JSON.parse(raw);
        if (record && record.save) records.push(record);
      } catch {
        // Device storage can be blocked; management UI degrades to an unavailable state.
      }
    }
    return records.sort(function (a, b) { return Number(b.updatedAt || 0) - Number(a.updatedAt || 0); });
  }

  function activeRecord() {
    const profiles = readProfiles();
    return profiles.length ? profiles[0] : null;
  }

  function asNumber(value, fallback) {
    return Number.isFinite(Number(value)) ? Number(value) : fallback;
  }

  function formatTons(value) {
    return asNumber(value, 0).toFixed(1) + " t";
  }

  function materialName(key) {
    return MATERIAL_NAMES[key] || (key ? String(key).replace(/(^|_)([a-z])/g, function (_, prefix, letter) { return (prefix ? " " : "") + letter.toUpperCase(); }) : "Unknown");
  }

  function findMineParcel(save, mine) {
    return (save.mineParcels || []).find(function (parcel) {
      return parcel && (parcel.id === mine.parcelId || parcel.mineId === mine.id);
    }) || null;
  }

  function findWarehouseForMine(save, mine) {
    if (mine.warehouseId) {
      const direct = (save.warehouses || []).find(function (warehouse) { return warehouse.id === mine.warehouseId; });
      if (direct) return direct;
    }

    const mineParcel = findMineParcel(save, mine);
    if (!mineParcel) return null;

    const warehouseParcel = (save.warehouseParcels || []).find(function (parcel) {
      if (!parcel) return false;
      if (parcel.mineParcelId && parcel.mineParcelId === mineParcel.id) return true;
      const xDistance = Math.abs(asNumber(parcel.x, 9999) - asNumber(mineParcel.x, -9999));
      const yDistance = Math.abs(asNumber(parcel.y, 9999) - asNumber(mineParcel.y, -9999));
      return xDistance <= 4 && yDistance <= 4;
    });
    if (!warehouseParcel) return null;

    return (save.warehouses || []).find(function (warehouse) {
      return warehouse && (warehouse.parcelId === warehouseParcel.id || warehouseParcel.warehouseId === warehouse.id);
    }) || null;
  }

  function haulStatus(save, mine) {
    const haul = (save.hauls || []).find(function (entry) {
      return entry && entry.mineId === mine.id && entry.status !== "complete" && entry.status !== "completed";
    });
    if (!haul) return "Idle";
    if (haul.status) return String(haul.status).replace(/(^|_)([a-z])/g, function (_, prefix, letter) { return (prefix ? " " : "") + letter.toUpperCase(); });
    return "Hauling";
  }

  function mineStatus(save, mine) {
    const level = Math.max(1, Math.min(8, Math.round(asNumber(mine.level, 1))));
    const capacity = MINE_STORAGE_BY_LEVEL[level] || MINE_STORAGE_BY_LEVEL[1];
    const used = asNumber(mine.stockMaterial, 0) + asNumber(mine.stockDirt, 0);
    if (used >= capacity - 0.01) return "Full";
    if (mine.active === false || mine.enabled === false) return "Inactive";
    return "Active";
  }

  function statusClass(status) {
    const key = String(status || "").toLowerCase();
    if (key.includes("full") || key.includes("blocked") || key.includes("inactive")) return "warn";
    if (key.includes("haul") || key.includes("active")) return "good";
    return "neutral";
  }

  function buildMineRows(save) {
    const mines = Array.isArray(save.mines) ? save.mines : [];
    const workers = Math.max(0, Math.round(asNumber(save.workers, 0)));
    const workerMultiplier = WORKER_OUTPUT_MULTIPLIER[Math.min(4, workers)] || 1;

    if (!mines.length) {
      return '<div class="pbmm-empty"><strong>No mines built yet.</strong><span>Build a mine and it will appear here after the next autosave.</span></div>';
    }

    return mines.map(function (mine, index) {
      const level = Math.max(1, Math.min(8, Math.round(asNumber(mine.level, 1))));
      const capacity = MINE_STORAGE_BY_LEVEL[level] || MINE_STORAGE_BY_LEVEL[1];
      const materialStock = asNumber(mine.stockMaterial, 0);
      const dirtStock = asNumber(mine.stockDirt, 0);
      const totalStock = materialStock + dirtStock;
      const production = (MINE_OUTPUT_BY_LEVEL[level] || MINE_OUTPUT_BY_LEVEL[1]) * workerMultiplier;
      const warehouse = findWarehouseForMine(save, mine);
      const status = mineStatus(save, mine);
      const hauling = haulStatus(save, mine);
      const mineLabel = mine.name || ("Mine " + (index + 1));
      const workerText = workers > 0 ? (workers + " company worker" + (workers === 1 ? "" : "s") + " · staffed output") : "No hired workers · base output";
      const warehouseText = warehouse ? (warehouse.name || ("Warehouse " + ((save.warehouses || []).indexOf(warehouse) + 1))) : "None assigned";
      const fill = Math.max(0, Math.min(100, capacity > 0 ? totalStock / capacity * 100 : 0));

      return '<article class="pbmm-mine-card">' +
        '<div class="pbmm-card-heading"><div><span class="pbmm-index">' + (index + 1) + '</span><div><strong>' + mineLabel + '</strong><small>' + materialName(mine.material || mine.baseMaterial) + ' · Drill Lv' + level + '</small></div></div><span class="pbmm-status ' + statusClass(status) + '">' + status + '</span></div>' +
        '<div class="pbmm-grid">' +
          '<div><small>Production</small><strong>' + production.toFixed(2) + ' raw t/cycle</strong></div>' +
          '<div><small>Output stock</small><strong>' + formatTons(totalStock) + ' / ' + formatTons(capacity) + '</strong></div>' +
          '<div><small>Worker status</small><strong>' + workerText + '</strong></div>' +
          '<div><small>Warehouse</small><strong>' + warehouseText + '</strong></div>' +
          '<div><small>Hauling</small><strong>' + hauling + '</strong></div>' +
          '<div><small>Depth</small><strong>' + Math.round(asNumber(mine.depth, 0)) + ' tiles</strong></div>' +
        '</div>' +
        '<div class="pbmm-meter" aria-label="Mine stockpile ' + Math.round(fill) + ' percent full"><span style="width:' + fill.toFixed(1) + '%"></span></div>' +
        '<div class="pbmm-stock-note">' + formatTons(materialStock) + ' ' + materialName(mine.material || mine.baseMaterial).toLowerCase() + ' · ' + formatTons(dirtStock) + ' dirt/tailings</div>' +
      '</article>';
    }).join("");
  }

  function injectStyles() {
    if (document.getElementById("pbmm-styles")) return;
    const style = document.createElement("style");
    style.id = "pbmm-styles";
    style.textContent = [
      ".pbmm-layer{position:absolute;inset:0;z-index:120;display:grid;place-items:center;padding:18px;background:rgba(5,13,17,.74);backdrop-filter:blur(4px)}",
      ".pbmm-layer[hidden]{display:none}",
      ".pbmm-panel{width:min(980px,96vw);max-height:min(760px,90vh);overflow:hidden;display:flex;flex-direction:column;border:1px solid rgba(202,231,216,.22);border-radius:22px;background:#101b20;color:#eef6f1;box-shadow:0 24px 70px rgba(0,0,0,.42)}",
      ".pbmm-heading{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:20px 22px;border-bottom:1px solid rgba(255,255,255,.09);background:#142329}",
      ".pbmm-heading p{margin:0 0 3px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#93b6a6}",
      ".pbmm-heading h2{margin:0;font-size:24px}",
      ".pbmm-close{width:42px;height:42px;border:0;border-radius:12px;background:#24343b;color:#fff;font-size:26px;cursor:pointer}",
      ".pbmm-summary{display:flex;gap:10px;flex-wrap:wrap;padding:14px 22px;background:#0d171b;border-bottom:1px solid rgba(255,255,255,.07)}",
      ".pbmm-summary span{padding:7px 10px;border-radius:999px;background:#1c2b31;color:#cfe0d8;font-size:12px}",
      ".pbmm-list{overflow:auto;padding:16px 18px 22px;display:grid;gap:12px}",
      ".pbmm-mine-card{border:1px solid rgba(255,255,255,.09);border-radius:16px;background:#16242a;padding:15px}",
      ".pbmm-card-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:13px}",
      ".pbmm-card-heading>div{display:flex;align-items:center;gap:10px}",
      ".pbmm-card-heading strong{display:block;font-size:16px}",
      ".pbmm-card-heading small{display:block;color:#9db5aa;margin-top:2px}",
      ".pbmm-index{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:#263a42;font-weight:800}",
      ".pbmm-status{padding:6px 9px;border-radius:999px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em}",
      ".pbmm-status.good{background:#183f32;color:#b9efd9}.pbmm-status.warn{background:#493326;color:#ffd4ad}.pbmm-status.neutral{background:#29383e;color:#d4e1dc}",
      ".pbmm-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}",
      ".pbmm-grid>div{min-width:0;padding:10px;border-radius:11px;background:#101c21}",
      ".pbmm-grid small{display:block;color:#86a195;font-size:10px;text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px}",
      ".pbmm-grid strong{display:block;font-size:12px;line-height:1.35;overflow-wrap:anywhere}",
      ".pbmm-meter{height:7px;margin-top:12px;border-radius:999px;background:#0b1418;overflow:hidden}",
      ".pbmm-meter span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#6ea88a,#c7a85c)}",
      ".pbmm-stock-note{margin-top:7px;color:#91aa9f;font-size:11px}",
      ".pbmm-empty{display:flex;flex-direction:column;gap:5px;padding:28px;border:1px dashed rgba(255,255,255,.18);border-radius:14px;text-align:center;color:#bcd0c7}",
      ".pbmm-source{padding:10px 22px 16px;color:#789087;font-size:10px}",
      "#pb7-mine-management{display:flex;align-items:center;gap:8px}",
      "@media(max-width:720px){.pbmm-layer{padding:8px}.pbmm-panel{width:100%;max-height:96vh;border-radius:16px}.pbmm-heading{padding:15px}.pbmm-summary{padding:10px 15px}.pbmm-list{padding:10px}.pbmm-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}"
    ].join("");
    document.head.appendChild(style);
  }

  function install() {
    const root = document.getElementById(ROOT_ID);
    if (!root || document.getElementById("pb7-mine-management")) return false;

    injectStyles();

    const systemActions = root.querySelector("#pb7-system-menu .system-menu-actions");
    if (!systemActions) return false;

    const button = document.createElement("button");
    button.id = "pb7-mine-management";
    button.type = "button";
    button.innerHTML = '<span aria-hidden="true">⛏</span> Mine management';
    systemActions.insertBefore(button, systemActions.firstChild);

    const layer = document.createElement("div");
    layer.id = "pb7-mine-management-layer";
    layer.className = "pbmm-layer";
    layer.hidden = true;
    layer.innerHTML = '<section class="pbmm-panel" role="dialog" aria-modal="true" aria-labelledby="pbmm-title">' +
      '<div class="pbmm-heading"><div><p>Company operations</p><h2 id="pbmm-title">Mine Management</h2></div><button class="pbmm-close" id="pbmm-close" type="button" aria-label="Close mine management">×</button></div>' +
      '<div class="pbmm-summary" id="pbmm-summary"></div>' +
      '<div class="pbmm-list" id="pbmm-list"></div>' +
      '<div class="pbmm-source" id="pbmm-source">Read-only operations overview · existing mine production rules are unchanged.</div>' +
      '</section>';
    root.appendChild(layer);

    const summary = layer.querySelector("#pbmm-summary");
    const list = layer.querySelector("#pbmm-list");
    const source = layer.querySelector("#pbmm-source");
    const close = layer.querySelector("#pbmm-close");
    let refreshTimer = null;

    function render() {
      const record = activeRecord();
      if (!record || !record.save) {
        summary.innerHTML = '<span>No saved company loaded</span>';
        list.innerHTML = '<div class="pbmm-empty"><strong>Mine data is unavailable.</strong><span>Start or load a company file, then save once.</span></div>';
        source.textContent = "Read-only operations overview · waiting for a company autosave.";
        return;
      }

      const save = record.save;
      const mines = Array.isArray(save.mines) ? save.mines : [];
      const warehouses = Array.isArray(save.warehouses) ? save.warehouses : [];
      summary.innerHTML = '<span>' + (record.name || ("Company File " + record.slot)) + '</span><span>' + mines.length + ' mine' + (mines.length === 1 ? '' : 's') + '</span><span>' + warehouses.length + ' warehouse' + (warehouses.length === 1 ? '' : 's') + '</span><span>' + Math.max(0, Math.round(asNumber(save.workers, 0))) + ' workers</span>';
      list.innerHTML = buildMineRows(save);
      source.textContent = "Read-only operations overview · refreshed from the latest device autosave · production and hauling logic unchanged.";
    }

    function open() {
      render();
      layer.hidden = false;
      const systemMenu = root.querySelector("#pb7-system-menu");
      if (systemMenu) systemMenu.hidden = true;
      refreshTimer = window.setInterval(render, 1200);
      close.focus();
    }

    function dismiss() {
      layer.hidden = true;
      if (refreshTimer) window.clearInterval(refreshTimer);
      refreshTimer = null;
      button.focus();
    }

    button.addEventListener("click", open);
    close.addEventListener("click", dismiss);
    layer.addEventListener("click", function (event) { if (event.target === layer) dismiss(); });
    window.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !layer.hidden) dismiss();
    });

    return true;
  }

  if (!install()) {
    let attempts = 0;
    const timer = window.setInterval(function () {
      attempts += 1;
      if (install() || attempts >= 40) window.clearInterval(timer);
    }, 250);
  }
})();

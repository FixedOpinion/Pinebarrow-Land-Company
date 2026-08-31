(function () {
  "use strict";

  const ROOT_ID = "pinebarrow-visible-menu-demo";
  const PROFILE_PREFIX = "pinebarrow-land-company-profile-v1-";
  const CAPACITY_BY_LEVEL = { 1: 6, 2: 7.5, 3: 9, 4: 11, 5: 13.5, 6: 16.5, 7: 20, 8: 24 };
  const WAREHOUSE_CAPACITY_BY_LEVEL = { 1: 8, 2: 11, 3: 14, 4: 18, 5: 23, 6: 29, 7: 36, 8: 45 };
  const OUTPUT_BY_LEVEL = { 1: 1, 2: 1.18, 3: 1.38, 4: 1.6, 5: 1.82, 6: 2.02, 7: 2.22, 8: 2.4 };
  const WORKER_MULTIPLIER = { 0: 1, 1: 1.5, 2: 2, 3: 2.25, 4: 2.5 };
  const MATERIAL_NAMES = {
    logs: "Logs", dirt: "Dirt", stone: "Stone", clay: "Clay", coal: "Coal", iron: "Iron",
    copper: "Copper", tin: "Tin", quartz: "Quartz", silver: "Silver", gold: "Gold", sapphire: "Sapphire"
  };

  const root = document.getElementById(ROOT_ID);
  if (!root || root.dataset.managementLoaded === "true") return;
  root.dataset.managementLoaded = "true";

  const style = document.createElement("style");
  style.textContent = `
    #${ROOT_ID} .pb-mgmt-launches{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}
    #${ROOT_ID} .pb-mgmt-launches button{min-height:42px;border:1px solid rgba(255,255,255,.18);border-radius:10px;background:rgba(18,29,28,.96);color:#f5f2e8;font-weight:800;cursor:pointer}
    #${ROOT_ID} .pb-mgmt-launches button:hover{background:rgba(31,48,45,.98)}
    #${ROOT_ID} .pb-mgmt-layer{position:absolute;inset:0;z-index:95;display:grid;place-items:center;padding:18px;background:rgba(5,10,10,.72);backdrop-filter:blur(4px)}
    #${ROOT_ID} .pb-mgmt-layer[hidden]{display:none}
    #${ROOT_ID} .pb-mgmt-panel{width:min(980px,96%);max-height:88%;overflow:auto;border:1px solid rgba(255,255,255,.18);border-radius:16px;background:#14201f;color:#f3efe4;box-shadow:0 18px 60px rgba(0,0,0,.35)}
    #${ROOT_ID} .pb-mgmt-head{position:sticky;top:0;z-index:3;display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:16px 18px;background:#182725;border-bottom:1px solid rgba(255,255,255,.12)}
    #${ROOT_ID} .pb-mgmt-head p{margin:0 0 3px;color:#9ab2aa;font-size:11px;text-transform:uppercase;letter-spacing:.12em;font-weight:800}
    #${ROOT_ID} .pb-mgmt-head h2{margin:0;font-size:22px}
    #${ROOT_ID} .pb-mgmt-close{width:42px;height:42px;border:1px solid rgba(255,255,255,.14);border-radius:10px;background:#233431;color:#fff;font-size:24px;cursor:pointer}
    #${ROOT_ID} .pb-mgmt-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;padding:14px 16px 4px}
    #${ROOT_ID} .pb-mgmt-summary div{padding:10px;border-radius:10px;background:#1d2d2a;border:1px solid rgba(255,255,255,.09)}
    #${ROOT_ID} .pb-mgmt-summary small{display:block;color:#91a79f;font-size:10px;text-transform:uppercase;letter-spacing:.08em}
    #${ROOT_ID} .pb-mgmt-summary strong{display:block;margin-top:3px;font-size:16px}
    #${ROOT_ID} .pb-mgmt-content{padding:12px 16px 18px}
    #${ROOT_ID} .pb-mgmt-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
    #${ROOT_ID} .pb-mgmt-card{padding:13px;border-radius:12px;background:#1a2927;border:1px solid rgba(255,255,255,.1)}
    #${ROOT_ID} .pb-mgmt-card-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
    #${ROOT_ID} .pb-mgmt-card h3{margin:0;font-size:16px}
    #${ROOT_ID} .pb-mgmt-card .sub{margin:2px 0 0;color:#97aaa4;font-size:11px}
    #${ROOT_ID} .pb-status{display:inline-flex;align-items:center;min-height:25px;padding:4px 8px;border-radius:999px;background:#263d38;color:#d8eee6;font-size:10px;font-weight:900;white-space:nowrap}
    #${ROOT_ID} .pb-status.warn{background:#493b25;color:#ffe2a0}
    #${ROOT_ID} .pb-status.stop{background:#4b292b;color:#ffc1c3}
    #${ROOT_ID} .pb-meter{height:8px;margin:10px 0 5px;border-radius:999px;overflow:hidden;background:#0e1817}
    #${ROOT_ID} .pb-meter span{display:block;height:100%;background:#86aa9e;border-radius:999px}
    #${ROOT_ID} .pb-mgmt-stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px 12px;margin-top:10px;font-size:11px}
    #${ROOT_ID} .pb-mgmt-stats div{display:flex;justify-content:space-between;gap:8px;border-bottom:1px solid rgba(255,255,255,.06);padding:4px 0}
    #${ROOT_ID} .pb-mgmt-stats span{color:#9aaca6}
    #${ROOT_ID} .pb-empty{padding:22px;text-align:center;border:1px dashed rgba(255,255,255,.14);border-radius:12px;color:#9dafaa}
    #${ROOT_ID} .pb-contract-progress{display:flex;justify-content:space-between;gap:10px;margin-top:6px;color:#b6c5c0;font-size:11px}
    @media (max-width:760px){#${ROOT_ID} .pb-mgmt-summary{grid-template-columns:repeat(2,minmax(0,1fr))}#${ROOT_ID} .pb-mgmt-grid{grid-template-columns:1fr}#${ROOT_ID} .pb-mgmt-stats{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const layer = document.createElement("section");
  layer.className = "pb-mgmt-layer";
  layer.hidden = true;
  layer.setAttribute("role", "dialog");
  layer.setAttribute("aria-modal", "true");
  layer.innerHTML = `
    <div class="pb-mgmt-panel">
      <header class="pb-mgmt-head">
        <div><p id="pb-mgmt-kicker">Company operations</p><h2 id="pb-mgmt-title">Mine Management</h2></div>
        <button class="pb-mgmt-close" id="pb-mgmt-close" type="button" aria-label="Close management">×</button>
      </header>
      <div id="pb-mgmt-summary" class="pb-mgmt-summary"></div>
      <div id="pb-mgmt-content" class="pb-mgmt-content"></div>
    </div>`;
  root.appendChild(layer);

  function round1(value) { return Math.round((Number(value) || 0) * 10) / 10; }
  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char];
    });
  }

  function getSelectedSlot() {
    const selected = root.querySelector('[data-profile-slot][aria-pressed="true"]');
    const slot = selected ? Number(selected.getAttribute("data-profile-slot")) : 0;
    return slot >= 1 && slot <= 3 ? slot : 0;
  }

  function readRecord(slot) {
    try {
      const raw = localStorage.getItem(PROFILE_PREFIX + slot);
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  }

  function latestRecord() {
    const selectedSlot = getSelectedSlot();
    if (selectedSlot) {
      const selected = readRecord(selectedSlot);
      if (selected && selected.save) return selected;
    }
    const records = [1, 2, 3].map(readRecord).filter(function (record) { return record && record.save; });
    records.sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
    return records[0] || null;
  }

  function materialName(key) { return MATERIAL_NAMES[key] || key || "Unknown"; }
  function siteNumber(list, item) { const index = list.indexOf(item); return index >= 0 ? index + 1 : "?"; }

  function warehouseForMine(save, mine) {
    const parcel = (save.warehouseParcels || []).find(function (item) { return item && item.mineId === mine.id; });
    if (!parcel) return null;
    return (save.warehouses || []).find(function (warehouse) { return warehouse && warehouse.parcelId === parcel.id; }) || null;
  }

  function haulForMine(save, mine) {
    return (save.hauls || []).find(function (haul) { return haul && haul.mineId === mine.id; }) || null;
  }

  function contractForMine(save, mine) {
    return (save.companyContracts || []).find(function (contract) { return contract && contract.mineId === mine.id && contract.status === "active"; }) || null;
  }

  function mineStatus(save, mine) {
    const capacity = CAPACITY_BY_LEVEL[mine.level] || 0;
    const used = (Number(mine.stockMaterial) || 0) + (Number(mine.stockDirt) || 0);
    if (capacity && used >= capacity - .05) return { text: "STOCKPILE FULL", cls: "stop" };
    const contract = contractForMine(save, mine);
    if (contract && contract.inTransit) return { text: "CONTRACT TRUCK EN ROUTE", cls: "" };
    if (haulForMine(save, mine)) return { text: "HAULER EN ROUTE", cls: "" };
    return { text: "PRODUCING", cls: "" };
  }

  function renderMineManagement(save) {
    const mines = Array.isArray(save.mines) ? save.mines : [];
    const warehouses = Array.isArray(save.warehouses) ? save.warehouses : [];
    const workers = Math.max(0, Number(save.workers) || 0);
    const activeContracts = (save.companyContracts || []).filter(function (contract) { return contract && contract.status === "active"; });
    document.getElementById("pb-mgmt-title").textContent = "Mine Management";
    document.getElementById("pb-mgmt-kicker").textContent = "Company operations";
    document.getElementById("pb-mgmt-summary").innerHTML = `
      <div><small>Operating mines</small><strong>${mines.length}</strong></div>
      <div><small>Warehouses</small><strong>${warehouses.length}</strong></div>
      <div><small>Hired workers</small><strong>${workers}</strong></div>
      <div><small>Active contracts</small><strong>${activeContracts.length}</strong></div>`;

    const mineCards = mines.map(function (mine) {
      const capacity = CAPACITY_BY_LEVEL[mine.level] || 0;
      const stockMaterial = Number(mine.stockMaterial) || 0;
      const stockDirt = Number(mine.stockDirt) || 0;
      const used = stockMaterial + stockDirt;
      const percent = capacity ? Math.min(100, Math.round(used / capacity * 100)) : 0;
      const output = (OUTPUT_BY_LEVEL[mine.level] || 0) * (WORKER_MULTIPLIER[Math.min(4, workers)] || 1);
      const warehouse = warehouseForMine(save, mine);
      const haul = haulForMine(save, mine);
      const contract = contractForMine(save, mine);
      const status = mineStatus(save, mine);
      return `<article class="pb-mgmt-card">
        <div class="pb-mgmt-card-head"><div><h3>Mine ${siteNumber(mines, mine)} · ${escapeHtml(materialName(mine.material))}</h3><p class="sub">Depth ${Math.max(0, Number(mine.depth) || 0)} · Drill Lv${Number(mine.level) || 1}</p></div><span class="pb-status ${status.cls}">${status.text}</span></div>
        <div class="pb-meter"><span style="width:${percent}%"></span></div>
        <div class="pb-contract-progress"><span>Stockpile</span><strong>${round1(used).toFixed(1)} / ${round1(capacity).toFixed(1)} t</strong></div>
        <div class="pb-mgmt-stats">
          <div><span>Material</span><strong>${round1(stockMaterial).toFixed(1)} t</strong></div>
          <div><span>Dirt</span><strong>${round1(stockDirt).toFixed(1)} t</strong></div>
          <div><span>Production</span><strong>${round1(output).toFixed(1)} raw t/cycle</strong></div>
          <div><span>Dirt ratio</span><strong>${Math.round((Number(mine.ratio) || 0) * 100)}%</strong></div>
          <div><span>Warehouse</span><strong>${warehouse ? "Warehouse " + siteNumber(warehouses, warehouse) : "Not linked"}</strong></div>
          <div><span>Logistics</span><strong>${contract ? "Contract " + String(contract.truckSize || "").toUpperCase() : haul ? "Hauler " + String(haul.size || "").toUpperCase() : "Idle"}</strong></div>
        </div>
      </article>`;
    }).join("");

    const warehouseCards = warehouses.map(function (warehouse) {
      const capacity = WAREHOUSE_CAPACITY_BY_LEVEL[warehouse.level] || 0;
      const inventory = warehouse.inventory && typeof warehouse.inventory === "object" ? warehouse.inventory : {};
      const total = Object.keys(inventory).reduce(function (sum, key) { return sum + Math.max(0, Number(inventory[key]) || 0); }, 0);
      const percent = capacity ? Math.min(100, Math.round(total / capacity * 100)) : 0;
      const contents = Object.keys(inventory).filter(function (key) { return Number(inventory[key]) > .01; }).map(function (key) { return materialName(key) + " " + round1(inventory[key]).toFixed(1) + "t"; }).join(" · ") || "Empty";
      return `<article class="pb-mgmt-card">
        <div class="pb-mgmt-card-head"><div><h3>Warehouse ${siteNumber(warehouses, warehouse)}</h3><p class="sub">Storage Lv${Number(warehouse.level) || 1}</p></div><span class="pb-status ${capacity && total >= capacity - .05 ? "stop" : ""}">${capacity && total >= capacity - .05 ? "FULL" : "AVAILABLE"}</span></div>
        <div class="pb-meter"><span style="width:${percent}%"></span></div>
        <div class="pb-contract-progress"><span>Storage</span><strong>${round1(total).toFixed(1)} / ${round1(capacity).toFixed(1)} t</strong></div>
        <p class="sub">${escapeHtml(contents)}</p>
      </article>`;
    }).join("");

    document.getElementById("pb-mgmt-content").innerHTML = `
      <h3 style="margin:4px 0 9px">Mines</h3>
      <div class="pb-mgmt-grid">${mineCards || '<div class="pb-empty">No mines are operating yet.</div>'}</div>
      <h3 style="margin:18px 0 9px">Warehouses</h3>
      <div class="pb-mgmt-grid">${warehouseCards || '<div class="pb-empty">No warehouses have been built yet.</div>'}</div>`;
  }

  function contractStatus(contract, mine) {
    if (contract.status === "complete") return { text: "FULFILLED", cls: "" };
    if (contract.status === "cancelled") return { text: "CANCELLED", cls: "stop" };
    if (!mine) return { text: "MINE MISSING", cls: "stop" };
    if (mine.material !== contract.material) return { text: "SEAM CHANGED", cls: "warn" };
    if (contract.inTransit) return { text: "TRUCK EN ROUTE", cls: "" };
    return { text: "WAITING AT MINE", cls: "warn" };
  }

  function renderContractManagement(save) {
    const mines = Array.isArray(save.mines) ? save.mines : [];
    const contracts = Array.isArray(save.companyContracts) ? save.companyContracts.slice().reverse() : [];
    const active = contracts.filter(function (contract) { return contract.status === "active"; });
    const complete = contracts.filter(function (contract) { return contract.status === "complete"; });
    const outstanding = active.reduce(function (sum, contract) { return sum + Math.max(0, (Number(contract.quantity) || 0) - (Number(contract.delivered) || 0)); }, 0);
    document.getElementById("pb-mgmt-title").textContent = "Contract Management";
    document.getElementById("pb-mgmt-kicker").textContent = "Company ledger";
    document.getElementById("pb-mgmt-summary").innerHTML = `
      <div><small>Active</small><strong>${active.length}</strong></div>
      <div><small>Fulfilled</small><strong>${complete.length}</strong></div>
      <div><small>Outstanding</small><strong>${round1(outstanding).toFixed(1)} t</strong></div>
      <div><small>Contract limit</small><strong>${active.length} / 4</strong></div>`;

    const cards = contracts.map(function (contract) {
      const mine = mines.find(function (item) { return item.id === contract.mineId; });
      const quantity = Math.max(.01, Number(contract.quantity) || .01);
      const delivered = Math.max(0, Number(contract.delivered) || 0);
      const percent = Math.min(100, Math.round(delivered / quantity * 100));
      const status = contractStatus(contract, mine);
      return `<article class="pb-mgmt-card">
        <div class="pb-mgmt-card-head"><div><h3>${escapeHtml(contract.buyer || "Company contract")}</h3><p class="sub">${escapeHtml(materialName(contract.material))} · Mine ${mine ? siteNumber(mines, mine) : "?"} · ${escapeHtml(String(contract.truckSize || "").toUpperCase())} truck</p></div><span class="pb-status ${status.cls}">${status.text}</span></div>
        <div class="pb-meter"><span style="width:${percent}%"></span></div>
        <div class="pb-contract-progress"><span>${round1(delivered).toFixed(1)} / ${round1(quantity).toFixed(1)} t delivered</span><strong>${percent}%</strong></div>
        <div class="pb-mgmt-stats">
          <div><span>Unit price</span><strong>$${Number(contract.unitPrice) || 0}/t</strong></div>
          <div><span>Remaining</span><strong>${round1(Math.max(0, quantity - delivered)).toFixed(1)} t</strong></div>
          <div><span>Assigned mine</span><strong>${mine ? "Mine " + siteNumber(mines, mine) : "Missing"}</strong></div>
          <div><span>Material</span><strong>${escapeHtml(materialName(contract.material))}</strong></div>
        </div>
      </article>`;
    }).join("");
    document.getElementById("pb-mgmt-content").innerHTML = `<div class="pb-mgmt-grid">${cards || '<div class="pb-empty">No company contracts yet. Visit the Market to accept one.</div>'}</div>`;
  }

  function openManagement(mode) {
    const record = latestRecord();
    if (!record || !record.save) {
      document.getElementById("pb-mgmt-title").textContent = mode === "contracts" ? "Contract Management" : "Mine Management";
      document.getElementById("pb-mgmt-summary").innerHTML = "";
      document.getElementById("pb-mgmt-content").innerHTML = '<div class="pb-empty">Start or load a company file first.</div>';
    } else if (mode === "contracts") renderContractManagement(record.save);
    else renderMineManagement(record.save);
    layer.hidden = false;
  }

  function closeManagement() { layer.hidden = true; }

  const systemActions = root.querySelector(".system-menu-actions");
  if (systemActions) {
    const launches = document.createElement("div");
    launches.className = "pb-mgmt-launches";
    launches.innerHTML = '<button id="pb-open-mines" type="button">Mine Management</button><button id="pb-open-contracts" type="button">Contract Management</button>';
    systemActions.appendChild(launches);
    launches.querySelector("#pb-open-mines").addEventListener("click", function () { openManagement("mines"); });
    launches.querySelector("#pb-open-contracts").addEventListener("click", function () { openManagement("contracts"); });
  }

  document.getElementById("pb-mgmt-close").addEventListener("click", closeManagement);
  layer.addEventListener("click", function (event) { if (event.target === layer) closeManagement(); });
  document.addEventListener("keydown", function (event) { if (event.key === "Escape" && !layer.hidden) closeManagement(); });
})();

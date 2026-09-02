(function () {
  "use strict";

  const ROOT_ID = "pinebarrow-visible-menu-demo";
  const PROFILE_CACHE_PREFIX = "pinebarrow-land-company-profile-v1-";
  const PROFILE_COUNT = 3;
  const WAREHOUSE_CAPACITY = { 1: 8, 2: 11, 3: 14, 4: 18, 5: 23, 6: 29, 7: 36, 8: 45 };
  const MATERIAL_NAMES = {
    logs: "Logs", stone: "Stone", clay: "Clay", coal: "Coal", iron: "Iron",
    copper: "Copper", tin: "Tin", quartz: "Quartz", silver: "Silver", gold: "Gold", sapphire: "Sapphire"
  };

  function num(value, fallback) { return Number.isFinite(Number(value)) ? Number(value) : fallback; }
  function tons(value) { return num(value, 0).toFixed(1) + " t"; }
  function money(value) { return "$" + num(value, 0).toFixed(0); }
  function materialName(key) { return MATERIAL_NAMES[key] || String(key || "Unknown"); }
  function pretty(value) {
    return String(value || "Unknown").replace(/_/g, " ").replace(/\b\w/g, function (letter) { return letter.toUpperCase(); });
  }

  function readProfiles() {
    const records = [];
    for (let slot = 1; slot <= PROFILE_COUNT; slot += 1) {
      try {
        const raw = window.localStorage.getItem(PROFILE_CACHE_PREFIX + slot);
        if (!raw) continue;
        const record = JSON.parse(raw);
        if (record && record.save) records.push(record);
      } catch {}
    }
    return records.sort(function (a, b) { return num(b.updatedAt, 0) - num(a.updatedAt, 0); });
  }

  function activeRecord() {
    const selected = document.querySelector("[data-profile-slot][aria-pressed='true']");
    const selectedSlot = selected ? Number(selected.getAttribute("data-profile-slot")) : 0;
    const profiles = readProfiles();
    if (selectedSlot) {
      const match = profiles.find(function (record) { return Number(record.slot) === selectedSlot; });
      if (match) return match;
    }
    return profiles[0] || null;
  }

  function mineLabel(save, mineId) {
    const mines = Array.isArray(save.mines) ? save.mines : [];
    const index = mines.findIndex(function (mine) { return mine && mine.id === mineId; });
    if (index < 0) return "Unassigned";
    return mines[index].name || ("Mine " + (index + 1));
  }

  function contractStatus(save, contract) {
    if (!contract) return "Unknown";
    if (contract.status === "cancelled") return "Cancelled";
    const required = Math.max(0, num(contract.quantity, contract.requiredQuantity || 0));
    const delivered = Math.max(0, num(contract.delivered, 0));
    if (required > 0 && delivered >= required - 0.001) return "Fulfilled";
    const mine = (save.mines || []).find(function (entry) { return entry && entry.id === contract.mineId; });
    if (!mine) return "Mine Missing";
    const material = contract.material;
    const mineMaterial = mine.material || mine.baseMaterial;
    if (material && mineMaterial && material !== mineMaterial) return "Seam Changed";
    const truck = (save.contractTrucks || save.companyContractTrucks || []).find(function (entry) {
      return entry && (entry.contractId === contract.id || entry.mineId === contract.mineId) && entry.status !== "complete";
    });
    if (truck) return "Truck En Route";
    return contract.status === "active" ? "Waiting At Mine" : pretty(contract.status || "Active");
  }

  function statusClass(status) {
    const key = String(status || "").toLowerCase();
    if (key.includes("fulfilled") || key.includes("available") || key.includes("active")) return "good";
    if (key.includes("missing") || key.includes("changed") || key.includes("cancel") || key.includes("full")) return "warn";
    return "neutral";
  }

  function contractRows(save) {
    const contracts = Array.isArray(save.companyContracts) ? save.companyContracts : [];
    if (!contracts.length) return '<div class="pbom-empty"><strong>No company contracts yet.</strong><span>Accepted company contracts will appear here after the next save.</span></div>';
    return contracts.map(function (contract, index) {
      const required = Math.max(0, num(contract.quantity, contract.requiredQuantity || 0));
      const delivered = Math.max(0, num(contract.delivered, 0));
      const remaining = Math.max(0, required - delivered);
      const progress = required > 0 ? Math.max(0, Math.min(100, delivered / required * 100)) : 0;
      const status = contractStatus(save, contract);
      const buyer = contract.buyer || contract.customer || contract.company || ("Contract " + (index + 1));
      const unitPrice = num(contract.unitPrice, contract.price || contract.pricePerTon || 0);
      const truckSize = contract.truckSize || contract.haulerSize || "Assigned hauler";
      return '<article class="pbom-card">' +
        '<div class="pbom-card-head"><div><span class="pbom-index">' + (index + 1) + '</span><div><strong>' + buyer + '</strong><small>' + materialName(contract.material) + ' · ' + mineLabel(save, contract.mineId) + '</small></div></div><span class="pbom-status ' + statusClass(status) + '">' + status + '</span></div>' +
        '<div class="pbom-grid">' +
          '<div><small>Delivered</small><strong>' + tons(delivered) + ' / ' + tons(required) + '</strong></div>' +
          '<div><small>Remaining</small><strong>' + tons(remaining) + '</strong></div>' +
          '<div><small>Unit price</small><strong>' + (unitPrice ? money(unitPrice) + '/t' : 'Contract rate') + '</strong></div>' +
          '<div><small>Source</small><strong>' + mineLabel(save, contract.mineId) + '</strong></div>' +
          '<div><small>Truck</small><strong>' + pretty(truckSize) + '</strong></div>' +
          '<div><small>State</small><strong>' + status + '</strong></div>' +
        '</div>' +
        '<div class="pbom-meter"><span style="width:' + progress.toFixed(1) + '%"></span></div>' +
      '</article>';
    }).join("");
  }

  function inventoryEntries(storage) {
    if (!storage || typeof storage !== "object") return [];
    return Object.keys(storage).filter(function (key) { return num(storage[key], 0) > 0; }).map(function (key) {
      return { key: key, value: num(storage[key], 0) };
    }).sort(function (a, b) { return b.value - a.value; });
  }

  function warehouseRows(save) {
    const warehouses = Array.isArray(save.warehouses) ? save.warehouses : [];
    if (!warehouses.length) return '<div class="pbom-empty"><strong>No warehouses built yet.</strong><span>Build a warehouse and it will appear here after the next save.</span></div>';
    return warehouses.map(function (warehouse, index) {
      const level = Math.max(1, Math.min(8, Math.round(num(warehouse.level, 1))));
      const capacity = WAREHOUSE_CAPACITY[level] || WAREHOUSE_CAPACITY[1];
      const entries = inventoryEntries(warehouse.storage);
      const used = entries.reduce(function (sum, entry) { return sum + entry.value; }, 0);
      const fill = Math.max(0, Math.min(100, capacity > 0 ? used / capacity * 100 : 0));
      const linkedParcel = (save.warehouseParcels || []).find(function (parcel) { return parcel && parcel.id === warehouse.parcelId; });
      const linkedMineParcelId = linkedParcel && linkedParcel.mineParcelId;
      const linkedMines = (save.mines || []).filter(function (mine) { return mine && mine.parcelId === linkedMineParcelId; });
      const contents = entries.length ? entries.map(function (entry) { return tons(entry.value) + ' ' + materialName(entry.key); }).join(' · ') : 'Empty';
      const state = used >= capacity - 0.01 ? "Full" : "Available";
      const reserve = warehouse.reserve || warehouse.reserves;
      const reserveText = reserve && typeof reserve === "object" ? inventoryEntries(reserve).map(function (entry) { return materialName(entry.key) + ' ' + tons(entry.value); }).join(' · ') : "Not configured";
      return '<article class="pbom-card">' +
        '<div class="pbom-card-head"><div><span class="pbom-index">' + (index + 1) + '</span><div><strong>' + (warehouse.name || ('Warehouse ' + (index + 1))) + '</strong><small>Storage Lv' + level + '</small></div></div><span class="pbom-status ' + statusClass(state) + '">' + state + '</span></div>' +
        '<div class="pbom-grid">' +
          '<div><small>Storage</small><strong>' + tons(used) + ' / ' + tons(capacity) + '</strong></div>' +
          '<div><small>Contents</small><strong>' + contents + '</strong></div>' +
          '<div><small>Assigned mines</small><strong>' + (linkedMines.length ? linkedMines.map(function (mine) { return mineLabel(save, mine.id); }).join(', ') : 'None linked') + '</strong></div>' +
          '<div><small>Reserve</small><strong>' + reserveText + '</strong></div>' +
          '<div><small>Collection</small><strong>Manual / existing haul rules</strong></div>' +
          '<div><small>Worker</small><strong>Staffing arrives in Workforce phase</strong></div>' +
        '</div>' +
        '<div class="pbom-meter"><span style="width:' + fill.toFixed(1) + '%"></span></div>' +
      '</article>';
    }).join("");
  }

  function injectStyles() {
    if (document.getElementById("pbom-styles")) return;
    const style = document.createElement("style");
    style.id = "pbom-styles";
    style.textContent = [
      ".pbom-layer{position:absolute;inset:0;z-index:121;display:grid;place-items:center;padding:18px;background:rgba(5,13,17,.76);backdrop-filter:blur(4px)}",
      ".pbom-layer[hidden]{display:none}",
      ".pbom-panel{width:min(1000px,96vw);max-height:min(780px,92vh);overflow:hidden;display:flex;flex-direction:column;border:1px solid rgba(202,231,216,.22);border-radius:22px;background:#101b20;color:#eef6f1;box-shadow:0 24px 70px rgba(0,0,0,.42)}",
      ".pbom-head{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:18px 22px;background:#142329;border-bottom:1px solid rgba(255,255,255,.09)}",
      ".pbom-head p{margin:0 0 3px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#93b6a6}.pbom-head h2{margin:0;font-size:24px}",
      ".pbom-close{width:42px;height:42px;border:0;border-radius:12px;background:#24343b;color:#fff;font-size:26px;cursor:pointer}",
      ".pbom-tabs{display:flex;gap:8px;padding:12px 18px;background:#0d171b;border-bottom:1px solid rgba(255,255,255,.07)}",
      ".pbom-tab{border:0;border-radius:10px;padding:9px 13px;background:#1d2b31;color:#cfe0d8;font-weight:800;cursor:pointer}.pbom-tab[aria-selected='true']{background:#315047;color:#fff}",
      ".pbom-summary{display:flex;gap:8px;flex-wrap:wrap;padding:11px 18px;background:#101b20}.pbom-summary span{padding:6px 9px;border-radius:999px;background:#1c2b31;color:#cfe0d8;font-size:12px}",
      ".pbom-list{overflow:auto;padding:12px 18px 20px;display:grid;gap:12px}.pbom-card{border:1px solid rgba(255,255,255,.09);border-radius:16px;background:#16242a;padding:15px}",
      ".pbom-card-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}.pbom-card-head>div{display:flex;align-items:center;gap:10px}.pbom-card-head strong{display:block}.pbom-card-head small{display:block;color:#9db5aa;margin-top:2px}",
      ".pbom-index{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:#263a42;font-weight:800}.pbom-status{padding:6px 9px;border-radius:999px;font-size:11px;font-weight:800;text-transform:uppercase}.pbom-status.good{background:#183f32;color:#b9efd9}.pbom-status.warn{background:#493326;color:#ffd4ad}.pbom-status.neutral{background:#29383e;color:#d4e1dc}",
      ".pbom-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.pbom-grid>div{padding:10px;border-radius:11px;background:#101c21;min-width:0}.pbom-grid small{display:block;color:#86a195;font-size:10px;text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px}.pbom-grid strong{display:block;font-size:12px;line-height:1.35;overflow-wrap:anywhere}",
      ".pbom-meter{height:7px;margin-top:12px;border-radius:999px;background:#0b1418;overflow:hidden}.pbom-meter span{display:block;height:100%;background:linear-gradient(90deg,#6ea88a,#c7a85c)}",
      ".pbom-empty{display:flex;flex-direction:column;gap:5px;padding:28px;border:1px dashed rgba(255,255,255,.18);border-radius:14px;text-align:center;color:#bcd0c7}",
      ".pbom-foot{padding:9px 18px 14px;color:#789087;font-size:10px}",
      "@media(max-width:720px){.pbom-layer{padding:8px}.pbom-panel{width:100%;max-height:96vh;border-radius:16px}.pbom-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.pbom-head{padding:14px}.pbom-list{padding:10px}}"
    ].join("");
    document.head.appendChild(style);
  }

  function install() {
    const root = document.getElementById(ROOT_ID);
    if (!root || document.getElementById("pb7-operations-management")) return false;
    const actions = root.querySelector("#pb7-system-menu .system-menu-actions");
    if (!actions) return false;
    injectStyles();

    const button = document.createElement("button");
    button.id = "pb7-operations-management";
    button.type = "button";
    button.innerHTML = '<span aria-hidden="true">▦</span> Contracts & warehouses';
    actions.insertBefore(button, actions.firstChild);

    const layer = document.createElement("div");
    layer.id = "pb7-operations-management-layer";
    layer.className = "pbom-layer";
    layer.hidden = true;
    layer.innerHTML = '<section class="pbom-panel" role="dialog" aria-modal="true" aria-labelledby="pbom-title">' +
      '<div class="pbom-head"><div><p>Company operations</p><h2 id="pbom-title">Contract Management</h2></div><button class="pbom-close" type="button" aria-label="Close">×</button></div>' +
      '<div class="pbom-tabs"><button class="pbom-tab" data-view="contracts" aria-selected="true">Contracts</button><button class="pbom-tab" data-view="warehouses" aria-selected="false">Warehouses</button></div>' +
      '<div class="pbom-summary"></div><div class="pbom-list"></div>' +
      '<div class="pbom-foot">Read-only management phase · existing contract, warehouse, economy, and save rules are unchanged.</div></section>';
    root.appendChild(layer);

    const title = layer.querySelector("#pbom-title");
    const summary = layer.querySelector(".pbom-summary");
    const list = layer.querySelector(".pbom-list");
    const tabs = Array.from(layer.querySelectorAll(".pbom-tab"));
    let view = "contracts";
    let timer = null;

    function render() {
      const record = activeRecord();
      if (!record || !record.save) {
        summary.innerHTML = '<span>No saved company loaded</span>';
        list.innerHTML = '<div class="pbom-empty"><strong>Operations data unavailable.</strong><span>Start or load a company and save once.</span></div>';
        return;
      }
      const save = record.save;
      if (view === "contracts") {
        const contracts = Array.isArray(save.companyContracts) ? save.companyContracts : [];
        const active = contracts.filter(function (contract) { return contract && contract.status === "active"; }).length;
        const outstanding = contracts.reduce(function (sum, contract) { return sum + Math.max(0, num(contract.quantity, 0) - num(contract.delivered, 0)); }, 0);
        title.textContent = "Contract Management";
        summary.innerHTML = '<span>' + active + ' active</span><span>' + contracts.length + ' total</span><span>' + tons(outstanding) + ' outstanding</span><span>Capacity ' + active + ' / 4</span>';
        list.innerHTML = contractRows(save);
      } else {
        const warehouses = Array.isArray(save.warehouses) ? save.warehouses : [];
        const stored = warehouses.reduce(function (sum, warehouse) { return sum + inventoryEntries(warehouse.storage).reduce(function (inner, entry) { return inner + entry.value; }, 0); }, 0);
        title.textContent = "Warehouse Management";
        summary.innerHTML = '<span>' + warehouses.length + ' warehouses</span><span>' + tons(stored) + ' stored</span><span>Capacity and logistics remain separate upgrade paths</span>';
        list.innerHTML = warehouseRows(save);
      }
    }

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        view = tab.getAttribute("data-view") || "contracts";
        tabs.forEach(function (entry) { entry.setAttribute("aria-selected", entry === tab ? "true" : "false"); });
        render();
      });
    });
    button.addEventListener("click", function () {
      layer.hidden = false;
      render();
      window.clearInterval(timer);
      timer = window.setInterval(render, 1500);
    });
    layer.querySelector(".pbom-close").addEventListener("click", function () { layer.hidden = true; window.clearInterval(timer); timer = null; });
    layer.addEventListener("click", function (event) { if (event.target === layer) { layer.hidden = true; window.clearInterval(timer); timer = null; } });
    return true;
  }

  let attempts = 0;
  const installTimer = window.setInterval(function () {
    attempts += 1;
    if (install() || attempts > 80) window.clearInterval(installTimer);
  }, 125);
})();

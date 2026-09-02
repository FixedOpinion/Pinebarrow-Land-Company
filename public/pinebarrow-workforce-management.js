(function () {
  "use strict";

  const root = document.getElementById("pinebarrow-visible-menu-demo");
  if (!root || root.dataset.workforceManagementLoaded === "true") return;
  root.dataset.workforceManagementLoaded = "true";

  const api = root.pinebarrowWorkforce;
  if (!api) {
    console.error("Pinebarrow workforce API is unavailable.");
    return;
  }

  const actions = root.querySelector("#pb7-system-menu .system-menu-actions");
  if (!actions) return;

  const button = document.createElement("button");
  button.type = "button";
  button.dataset.workforceManagementButton = "true";
  button.innerHTML = '<span aria-hidden="true">⌂</span> Workforce management';
  actions.appendChild(button);

  const overlay = document.createElement("div");
  overlay.dataset.workforceManagement = "true";
  overlay.hidden = true;
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.zIndex = "10000";
  overlay.style.background = "rgba(10, 18, 16, .82)";
  overlay.style.padding = "clamp(12px, 3vw, 34px)";
  overlay.style.overflow = "auto";
  overlay.innerHTML = `
    <section role="dialog" aria-modal="true" aria-labelledby="pb-workforce-title" style="max-width:980px;margin:0 auto;background:#f5f0df;border:3px solid #273d32;border-radius:18px;box-shadow:0 24px 70px rgba(0,0,0,.38);color:#14221c;overflow:hidden;">
      <header style="display:flex;justify-content:space-between;gap:16px;align-items:center;padding:18px 20px;background:#d9c998;border-bottom:2px solid #273d32;">
        <div>
          <p style="margin:0 0 4px;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;">Company operations · Phase 5</p>
          <h2 id="pb-workforce-title" style="margin:0;font-size:clamp(22px,4vw,34px);">Workforce Management</h2>
        </div>
        <button type="button" data-workforce-close aria-label="Close workforce management" style="font:inherit;font-size:28px;width:42px;height:42px;border:2px solid #273d32;border-radius:10px;background:#f5f0df;cursor:pointer;">×</button>
      </header>
      <div style="padding:20px;display:grid;gap:18px;">
        <div data-workforce-summary></div>
        <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;">
          <button type="button" data-build-worker-house style="font:inherit;font-weight:800;padding:12px 16px;border:2px solid #273d32;border-radius:10px;background:#e9b94f;cursor:pointer;">Build Worker House</button>
          <span data-workforce-message style="font-weight:700;"></span>
        </div>
        <section>
          <h3 style="margin:0 0 10px;">Worker Houses</h3>
          <p style="margin:0 0 12px;line-height:1.45;">Each house is a 2×2 structure and supplies exactly one worker. A worker can be assigned to one mine or one warehouse at a time.</p>
          <div data-workforce-houses style="display:grid;gap:10px;"></div>
        </section>
        <section>
          <h3 style="margin:0 0 10px;">Company Sites</h3>
          <div data-workforce-sites style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;"></div>
        </section>
        <p style="margin:0;padding:12px;border:1px dashed #7b6d42;border-radius:10px;background:#fff9df;line-height:1.45;"><strong>Current Phase 5A:</strong> workforce supply, save migration, assignments, and mine staffing are active. Physical 2×2 house placement on the claim map is the next Workforce chunk; houses created here are marked planned until placed.</p>
      </div>
    </section>`;
  document.body.appendChild(overlay);

  const closeButton = overlay.querySelector("[data-workforce-close]");
  const buildButton = overlay.querySelector("[data-build-worker-house]");
  const summary = overlay.querySelector("[data-workforce-summary]");
  const houses = overlay.querySelector("[data-workforce-houses]");
  const sites = overlay.querySelector("[data-workforce-sites]");
  const message = overlay.querySelector("[data-workforce-message]");

  function assignmentForHouse(snapshot, houseId) {
    const mineId = Object.keys(snapshot.assignments.mines).find(function (siteId) {
      return snapshot.assignments.mines[siteId] === houseId;
    });
    if (mineId) {
      const mine = snapshot.mines.find(function (entry) { return entry.id === mineId; });
      return mine ? mine.label : "Mine";
    }
    const warehouseId = Object.keys(snapshot.assignments.warehouses).find(function (siteId) {
      return snapshot.assignments.warehouses[siteId] === houseId;
    });
    if (warehouseId) {
      const warehouse = snapshot.warehouses.find(function (entry) { return entry.id === warehouseId; });
      return warehouse ? warehouse.label : "Warehouse";
    }
    return "Available";
  }

  function siteOptions(snapshot, houseId) {
    const options = ['<option value="">Available / unassigned</option>'];
    snapshot.mines.forEach(function (mine) {
      const selected = snapshot.assignments.mines[mine.id] === houseId ? " selected" : "";
      options.push('<option value="mine:' + mine.id + '"' + selected + '>' + mine.label + ' · ' + String(mine.material || "ore").toUpperCase() + ' · Lv' + mine.level + '</option>');
    });
    snapshot.warehouses.forEach(function (warehouse) {
      const selected = snapshot.assignments.warehouses[warehouse.id] === houseId ? " selected" : "";
      options.push('<option value="warehouse:' + warehouse.id + '"' + selected + '>' + warehouse.label + ' · Lv' + warehouse.level + '</option>');
    });
    return options.join("");
  }

  function render() {
    const snapshot = api.snapshot();
    summary.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;">
        <div style="padding:12px;border:2px solid #273d32;border-radius:12px;background:#fffdf3;"><small>Worker houses</small><strong style="display:block;font-size:24px;">${snapshot.houses.length} / ${snapshot.maxHouses}</strong></div>
        <div style="padding:12px;border:2px solid #273d32;border-radius:12px;background:#fffdf3;"><small>Available workers</small><strong style="display:block;font-size:24px;">${snapshot.available}</strong></div>
        <div style="padding:12px;border:2px solid #273d32;border-radius:12px;background:#fffdf3;"><small>Next house</small><strong style="display:block;font-size:24px;">${snapshot.nextHouseCost ? "$" + snapshot.nextHouseCost : "Max"}</strong></div>
        <div style="padding:12px;border:2px solid #273d32;border-radius:12px;background:#fffdf3;"><small>Company funds</small><strong style="display:block;font-size:24px;">$${Math.round(snapshot.cash)}</strong></div>
      </div>`;

    buildButton.disabled = snapshot.houses.length >= snapshot.maxHouses || snapshot.cash < snapshot.nextHouseCost;
    buildButton.textContent = snapshot.nextHouseCost ? "Build Worker House · $" + snapshot.nextHouseCost : "Worker Houses at current maximum";

    houses.innerHTML = snapshot.houses.length
      ? snapshot.houses.map(function (house, index) {
          return `
            <div style="display:grid;grid-template-columns:minmax(150px,1fr) minmax(220px,2fr);gap:10px;align-items:center;padding:12px;border:1px solid #9f9166;border-radius:12px;background:#fffdf3;">
              <div><strong>Worker House ${index + 1}</strong><small style="display:block;">2×2 · ${house.status === "placed" ? "Placed" : "Placement pending"} · ${assignmentForHouse(snapshot, house.id)}</small></div>
              <select data-worker-house="${house.id}" style="width:100%;font:inherit;padding:10px;border:1px solid #6e6348;border-radius:8px;background:white;">${siteOptions(snapshot, house.id)}</select>
            </div>`;
        }).join("")
      : '<div style="padding:14px;border:1px dashed #9f9166;border-radius:12px;">No worker houses yet. Build one to supply your first assignable worker.</div>';

    sites.innerHTML = snapshot.mines.concat(snapshot.warehouses).length
      ? snapshot.mines.map(function (mine) {
          return '<div style="padding:12px;border:1px solid #9f9166;border-radius:12px;background:#fffdf3;"><strong>' + mine.label + '</strong><small style="display:block;">' + String(mine.material || "ore").toUpperCase() + ' · Lv' + mine.level + '</small><b style="display:block;margin-top:6px;">' + (mine.staffed ? "PRODUCING · WORKER ASSIGNED" : "NO WORKER · PRODUCTION STOPPED") + '</b></div>';
        }).concat(snapshot.warehouses.map(function (warehouse) {
          return '<div style="padding:12px;border:1px solid #9f9166;border-radius:12px;background:#fffdf3;"><strong>' + warehouse.label + '</strong><small style="display:block;">Lv' + warehouse.level + '</small><b style="display:block;margin-top:6px;">' + (warehouse.staffed ? "WORKER ASSIGNED" : "NO WORKER") + '</b></div>';
        })).join("")
      : '<div style="padding:14px;border:1px dashed #9f9166;border-radius:12px;">Build a mine or warehouse to create a workforce assignment.</div>';

    Array.from(overlay.querySelectorAll("select[data-worker-house]")).forEach(function (select) {
      select.addEventListener("change", function () {
        const houseId = select.dataset.workerHouse;
        if (!select.value) {
          const result = api.unassign(houseId);
          message.textContent = result.message;
          render();
          return;
        }
        const parts = select.value.split(":");
        const result = api.assign(houseId, parts[0], parts.slice(1).join(":"));
        message.textContent = result.message;
        render();
      }, { once: true });
    });
  }

  function open() {
    overlay.hidden = false;
    render();
  }

  function close() {
    overlay.hidden = true;
  }

  button.addEventListener("click", open);
  closeButton.addEventListener("click", close);
  overlay.addEventListener("click", function (event) {
    if (event.target === overlay) close();
  });
  buildButton.addEventListener("click", function () {
    const result = api.buildHouse();
    message.textContent = result.message;
    render();
  });
  window.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !overlay.hidden) close();
  });
})();

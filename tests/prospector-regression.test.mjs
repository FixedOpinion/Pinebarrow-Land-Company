import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const SAVE_KEY = "pinebarrow-land-company-save-v1";
const PROFILE_KEY = "pinebarrow-land-company-profile-v1-1";
const ACTION_BUTTON_IDS = [
  "pb7-hire", "pb7-hire-worker", "pb7-hauler-xs", "pb7-hauler-s", "pb7-hauler-m", "pb7-hauler-l",
  "pb7-marketplace", "pb7-contracts", "pb7-sell", "pb7-buy-saw", "pb7-rent-saw", "pb7-shaker", "pb7-upgrade-truck-size",
  "pb7-upgrade-truck-speed", "pb7-road-plan", "pb7-road-submit", "pb7-road-accept", "pb7-road-cancel", "pb7-read-news", "pb7-prospect", "pb7-lease",
  "pb7-unlock-gate",
  "pb7-buy-land", "pb7-buy-warehouse-land", "pb7-build-mine", "pb7-load-mine", "pb7-upgrade-mine",
  "pb7-build-warehouse", "pb7-unload-warehouse", "pb7-load-warehouse", "pb7-upgrade-warehouse",
];

class FakeElement {
  constructor(id) {
    this.id = id;
    this.dataset = {};
    this.style = {};
    this.hidden = false;
    this.disabled = false;
    this.textContent = "";
    this.listeners = new Map();
    this.options = [];
    this.value = "";
    this.innerHTML = "";
    this.parentElement = null;
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  click() {
    for (const listener of this.listeners.get("click") ?? []) listener({});
  }

  setAttribute(name, value) {
    this[name] = String(value);
  }

  removeAttribute(name) {
    delete this[name];
  }

  focus() {}

  appendChild(child) {
    child.parentElement = this;
    this.options.push(child);
    return child;
  }

  remove() {
    if (!this.parentElement) return;
    this.parentElement.options = this.parentElement.options.filter((child) => child !== this);
    this.parentElement = null;
  }

  getBoundingClientRect() {
    return { left: 0, top: 0, width: 1000, height: 650 };
  }

  querySelectorAll() {
    return [];
  }
}

function createCanvasContext() {
  return new Proxy({}, {
    get(target, property) {
      if (!(property in target)) target[property] = () => {};
      return target[property];
    },
    set(target, property, value) {
      target[property] = value;
      return true;
    },
  });
}

function createEngineHarness(savedState, engineSource, options = {}) {
  const storage = new Map([[SAVE_KEY, JSON.stringify(savedState)]]);
  const elements = new Map();
  let documentRef = null;
  const getElement = (id) => {
    if (!elements.has(id)) {
      const element = new FakeElement(id);
      element.focus = () => {
        if (documentRef) documentRef.activeElement = element;
      };
      elements.set(id, element);
    }
    return elements.get(id);
  };

  const canvas = getElement("pb7-map");
  canvas.getContext = () => createCanvasContext();

  const haulers = ["xs", "s", "m", "l"].map((size) => {
    const button = getElement(`pb7-hauler-${size}`);
    button.dataset.haulerSize = size;
    return button;
  });
  const profileSlots = [1, 2, 3].map((slot) => {
    const button = getElement(`pb7-profile-slot-${slot}`);
    button.dataset.profileSlot = String(slot);
    return button;
  });

  const actions = getElement("pb7-actions");
  actions.querySelectorAll = () => ACTION_BUTTON_IDS.map(getElement);

  const root = getElement("pinebarrow-visible-menu-demo");
  root.querySelector = (selector) => getElement(selector.slice(1));
  root.querySelectorAll = (selector) => selector === "[data-hauler-size]" ? haulers : selector === "[data-profile-slot]" ? profileSlots : [];
  root.requestFullscreen = async () => {};

  const documentListeners = new Map();
  const document = {
    activeElement: null,
    fullscreenElement: null,
    visibilityState: "visible",
    getElementById: (id) => id === root.id ? root : null,
    addEventListener(type, listener) {
      documentListeners.set(type, listener);
    },
    createElement: (tag) => new FakeElement(tag),
    async exitFullscreen() {},
  };
  documentRef = document;

  const window = {
    devicePixelRatio: 1,
    document,
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    },
    addEventListener() {},
  };

  const animationFrames = [];
  const requestAnimationFrame = (callback) => {
    animationFrames.push(callback);
    return animationFrames.length;
  };
  const runAnimationFrame = (timestamp) => {
    for (let attempts = 0; attempts < 12 && animationFrames.length; attempts += 1) {
      const callback = animationFrames.shift();
      callback(timestamp);
      if (callback.name === "animationLoop") return;
    }
    throw new Error("No animation loop callback was queued");
  };

  const navigator = {
    getGamepads: () => options.gamepad ? [options.gamepad] : [],
  };
  const getComputedStyle = () => ({
    color: "#16213e",
    getPropertyValue: () => "#5b6cf8",
  });

  class FakeImage extends FakeElement {
    constructor() {
      super("image");
      this.decoding = "";
      this.src = "";
    }
  }

  class FakeResizeObserver {
    observe() {}
  }

  const sandbox = {
    console,
    Date,
    Image: FakeImage,
    Math,
    navigator,
    getComputedStyle,
    performance: { now: () => 0 },
    requestAnimationFrame,
    ResizeObserver: FakeResizeObserver,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    window,
    document,
  };
  window.navigator = navigator;
  window.requestAnimationFrame = requestAnimationFrame;
  window.getComputedStyle = getComputedStyle;
  window.setTimeout = setTimeout;
  window.clearTimeout = clearTimeout;
  window.setInterval = setInterval;
  window.clearInterval = clearInterval;
  vm.runInNewContext(engineSource, sandbox, { filename: "pinebarrow-engine.js" });
  getElement("pb7-profile-play").click();

  return {
    element: getElement,
    dispatchKey(type, code, overrides = {}) {
      const listener = documentListeners.get(type);
      assert.ok(listener, `${type} listener is registered`);
      let prevented = false;
      listener({
        code,
        key: code,
        repeat: false,
        target: null,
        preventDefault() { prevented = true; },
        ...overrides,
      });
      return prevented;
    },
    frame: runAnimationFrame,
    saved: () => JSON.parse(storage.get(PROFILE_KEY)).save,
  };
}

test("old saves receive two usable surveys, including a next-day reset", async () => {
  const engineSource = await readFile(new URL("../public/pinebarrow-engine.js", import.meta.url), "utf8");
  const firstTile = { x: 76, y: 169 };
  const secondTile = { x: 77, y: 169 };
  const nextDayTile = { x: 78, y: 169 };
  const oldSave = {
    version: 4,
    day: 3,
    minutes: 480,
    cash: 160,
    player: firstTile,
    selected: { type: "cleared", ...firstTile },
    location: "cleared",
    cleared: [`${firstTile.x},${firstTile.y}`, `${secondTile.x},${secondTile.y}`, `${nextDayTile.x},${nextDayTile.y}`],
    prospectorHired: true,
    prospectorDay: 3,
    prospectsUsedToday: 1,
  };

  const migrated = createEngineHarness(oldSave, engineSource);
  assert.equal(migrated.saved().version, 8);
  assert.equal(migrated.saved().prospectsUsedToday, 0);
  assert.equal(migrated.element("pb7-prospect").disabled, false);

  migrated.element("pb7-prospect").click();
  const afterFirst = migrated.saved();
  assert.equal(afterFirst.prospectsUsedToday, 1);
  assert.equal(afterFirst.surveyParcel.status, "surveyed");
  assert.match(afterFirst.contextText, /Survey one of two is complete/);

  const secondSave = {
    ...afterFirst,
    player: secondTile,
    selected: { type: "cleared", ...secondTile },
    location: "cleared",
  };
  const second = createEngineHarness(secondSave, engineSource);
  assert.equal(second.element("pb7-prospect").disabled, false);
  second.element("pb7-prospect").click();
  const afterSecond = second.saved();
  assert.equal(afterSecond.prospectsUsedToday, 2);
  assert.equal(afterSecond.surveyParcel.x, secondTile.x);
  assert.match(afterSecond.contextText, /two surveys are used for today/i);

  const nextDaySave = {
    ...afterSecond,
    day: 4,
    player: nextDayTile,
    selected: { type: "cleared", ...nextDayTile },
    location: "cleared",
  };
  const nextDay = createEngineHarness(nextDaySave, engineSource);
  assert.equal(nextDay.element("pb7-prospect").disabled, false);
  nextDay.element("pb7-prospect").click();
  assert.equal(nextDay.saved().prospectorDay, 4);
  assert.equal(nextDay.saved().prospectsUsedToday, 1);
});

test("leasing a survey immediately frees the prospector for another mine claim", async () => {
  const engineSource = await readFile(new URL("../public/pinebarrow-engine.js", import.meta.url), "utf8");
  const firstTile = { x: 76, y: 169 };
  const secondClaimTile = { x: 78, y: 169 };
  const startingSave = {
    version: 4,
    day: 3,
    minutes: 480,
    cash: 500,
    player: firstTile,
    selected: { type: "cleared", ...firstTile },
    location: "cleared",
    cleared: [`${firstTile.x},${firstTile.y}`, `${secondClaimTile.x},${secondClaimTile.y}`],
    prospectorHired: true,
    prospectorDay: 3,
    prospectsUsedToday: 0,
  };

  const first = createEngineHarness(startingSave, engineSource);
  first.element("pb7-prospect").click();
  const surveyed = first.saved();

  const hall = createEngineHarness({ ...surveyed, player: { x: 45, y: 146 }, location: "townhall" }, engineSource);
  assert.equal(hall.element("pb7-lease").hidden, false);
  hall.element("pb7-lease").click();
  const leased = hall.saved();
  assert.equal(leased.surveyParcel, null);
  assert.equal(leased.mineParcels.length, 1);
  assert.equal(leased.mineParcels[0].status, "leased");

  const nextClaim = createEngineHarness({
    ...leased,
    player: secondClaimTile,
    selected: { type: "cleared", ...secondClaimTile },
    location: "cleared",
  }, engineSource);
  assert.equal(nextClaim.element("pb7-prospect").disabled, false);
  nextClaim.element("pb7-prospect").click();
  assert.equal(nextClaim.saved().mineParcels.length, 1);
  assert.equal(nextClaim.saved().surveyParcel.x, secondClaimTile.x);
  assert.equal(nextClaim.saved().prospectsUsedToday, 2);
});

test("a saved second parcel can build another mine and drill into better deep material", async () => {
  const engineSource = await readFile(new URL("../public/pinebarrow-engine.js", import.meta.url), "utf8");
  const firstParcel = { id: "claim-1", x: 76, y: 168, w: 2, h: 2, status: "owned", material: "stone", ratio: 0.45, leaseCredit: 420, mineId: "mine-2" };
  const secondParcel = { id: "claim-3", x: 76, y: 227, w: 2, h: 2, status: "leased", material: "quartz", ratio: 0.55, depth: 60, leaseCredit: 45 };
  const existingMine = {
    id: "mine-2", parcelId: firstParcel.id, x: firstParcel.x, y: firstParcel.y, w: 2, h: 2,
    level: 1, baseMaterial: "stone", material: "stone", depth: 1, ratio: 0.45,
    stockMaterial: 0, stockDirt: 0, doorX: 78, doorY: 168,
  };
  const cleared = [];
  for (let y = secondParcel.y; y < secondParcel.y + 2; y += 1) {
    for (let x = secondParcel.x; x < secondParcel.x + 2; x += 1) cleared.push(`${x},${y}`);
  }
  const save = {
    version: 6,
    day: 9,
    minutes: 480,
    cash: 2000,
    player: { x: 78, y: 227 },
    selected: { type: "mine-site", x: secondParcel.x, y: secondParcel.y },
    location: "mine-site",
    cleared,
    mineParcels: [firstParcel, secondParcel],
    warehouseParcels: [],
    mines: [existingMine],
    warehouses: [],
    selectedMineId: null,
    selectedMineParcelId: secondParcel.id,
    selectedWarehouseId: null,
    selectedWarehouseParcelId: null,
    nextSiteId: 4,
  };

  const game = createEngineHarness(save, engineSource);
  assert.equal(game.element("pb7-build-mine").hidden, false);
  assert.equal(game.element("pb7-build-mine").disabled, false);
  game.element("pb7-build-mine").click();
  assert.equal(game.saved().mines.length, 2);
  assert.equal(game.saved().mines[1].material, "quartz");

  game.element("pb7-upgrade-mine").click();
  game.element("pb7-upgrade-mine").click();
  assert.equal(game.saved().mines[1].level, 3);
  assert.equal(game.saved().mines[1].material, "silver");
});

test("an owned second warehouse parcel remains buildable after loading its profile", async () => {
  const engineSource = await readFile(new URL("../public/pinebarrow-engine.js", import.meta.url), "utf8");
  const firstParcel = { id: "warehouse-land-1", mineParcelId: "claim-1", x: 78, y: 168, w: 2, h: 2, status: "owned", warehouseId: "warehouse-2" };
  const secondParcel = { id: "warehouse-land-3", mineParcelId: "claim-4", x: 80, y: 227, w: 2, h: 2, status: "owned" };
  const existingWarehouse = {
    id: "warehouse-2", parcelId: firstParcel.id, x: firstParcel.x, y: firstParcel.y, w: 2, h: 2,
    level: 1, storage: {}, doorX: 80, doorY: 168,
  };
  const cleared = [];
  for (let y = secondParcel.y; y < secondParcel.y + 2; y += 1) {
    for (let x = secondParcel.x; x < secondParcel.x + 2; x += 1) cleared.push(`${x},${y}`);
  }
  const game = createEngineHarness({
    version: 6,
    day: 9,
    minutes: 480,
    cash: 2000,
    player: { x: 82, y: 227 },
    selected: { type: "warehouse-site", x: secondParcel.x, y: secondParcel.y },
    location: "warehouse-site",
    cleared,
    mineParcels: [],
    warehouseParcels: [firstParcel, secondParcel],
    mines: [],
    warehouses: [existingWarehouse],
    selectedMineId: null,
    selectedMineParcelId: null,
    selectedWarehouseId: null,
    selectedWarehouseParcelId: secondParcel.id,
    nextSiteId: 5,
  }, engineSource);

  assert.equal(game.element("pb7-build-warehouse").hidden, false);
  assert.equal(game.element("pb7-build-warehouse").disabled, false);
  game.element("pb7-build-warehouse").click();
  assert.equal(game.saved().warehouses.length, 2);
  assert.equal(game.saved().warehouses[1].parcelId, secondParcel.id);
});

test("an uncleared tree inside owned warehouse land remains selectable and cuttable", async () => {
  const engineSource = await readFile(new URL("../public/pinebarrow-engine.js", import.meta.url), "utf8");
  const tree = { x: 76, y: 170 };
  const warehouseParcel = {
    id: "warehouse-land-1",
    mineParcelId: "claim-1",
    x: tree.x,
    y: tree.y,
    w: 2,
    h: 2,
    status: "owned",
  };
  const game = createEngineHarness({
    version: 6,
    day: 9,
    minutes: 480,
    cash: 1000,
    capacity: 6,
    player: { x: 75, y: tree.y },
    selected: { type: "road", x: 75, y: tree.y },
    location: "road",
    overview: true,
    pavedDepth: 4,
    cleared: [],
    cargo: {},
    sawAttached: true,
    sawOwnership: "owned",
    mineParcels: [],
    warehouseParcels: [warehouseParcel],
    mines: [],
    warehouses: [],
  }, engineSource);

  game.frame(100);
  const mapWidth = 1000;
  const mapHeight = 650;
  const worldWidth = 90;
  const worldHeight = 292;
  const scale = Math.min((mapWidth - 8) / worldWidth, (mapHeight - 8) / worldHeight);
  const offsetX = (mapWidth - worldWidth * scale) / 2;
  const offsetY = (mapHeight - worldHeight * scale) / 2;
  const clickListener = game.element("pb7-map").listeners.get("click")[0];
  clickListener({
    clientX: offsetX + (tree.x + 0.5) * scale,
    clientY: offsetY + (tree.y + 0.5) * scale,
  });

  assert.equal(game.saved().selected.type, "tree");
  assert.equal(game.element("pb7-clear").hidden, false);
  game.element("pb7-clear").click();
  assert.ok(game.saved().cleared.includes(`${tree.x},${tree.y}`));
  assert.equal(game.saved().cargo.logs, 0.5);
});

test("the active claim's second stone gate unlocks for its configured payment", async () => {
  const engineSource = await readFile(new URL("../public/pinebarrow-engine.js", import.meta.url), "utf8");
  const game = createEngineHarness({
    version: 7,
    day: 4,
    minutes: 480,
    cash: 1000,
    player: { x: 75, y: 208 },
    location: "cleared",
    selected: { type: "cleared", x: 75, y: 208 },
    cleared: [],
    pavedDepth: 3,
    unlockedClaimZones: 1,
  }, engineSource);

  assert.equal(game.dispatchKey("keydown", "ArrowDown"), true);
  game.frame(100);
  assert.equal(game.saved().selected.type, "gate");
  assert.equal(game.saved().selected.gateIndex, 1);
  game.element("pb7-touch-interact").click();
  assert.equal(game.element("pb7-unlock-gate").hidden, false);
  assert.equal(game.element("pb7-unlock-gate").disabled, false);

  game.element("pb7-unlock-gate").click();
  assert.equal(game.saved().unlockedClaimZones, 2);
  assert.equal(game.saved().cash, 250);
  assert.match(game.saved().contextTitle, /Section 2 unlocked/);
});

test("the daily bulletin opens the full price, business, Crowe, and material guide", async () => {
  const engineSource = await readFile(new URL("../public/pinebarrow-engine.js", import.meta.url), "utf8");
  const game = createEngineHarness({
    version: 6,
    day: 9,
    minutes: 480,
    cash: 400,
    player: { x: 45, y: 145 },
    location: "road",
    cleared: [],
    wasteToCrowe: 5.5,
  }, engineSource);

  game.element("pb7-daily-news").click();
  assert.equal(game.element("pb7-menu-layer").hidden, false);
  assert.equal(game.element("pb7-newspaper-reader").hidden, false);
  assert.equal(game.element("pb7-building-panel").hidden, true);
  assert.match(game.element("pb7-newspaper-prices").innerHTML, /STN/);
  assert.match(game.element("pb7-newspaper-prices").innerHTML, /SAP/);
  assert.match(game.element("pb7-resource-guide").innerHTML, /95–124 tiles/);
  assert.match(game.element("pb7-crowe-story").textContent, /5\.5 tons/);

  game.element("pb7-newspaper-close").click();
  assert.equal(game.element("pb7-menu-layer").hidden, true);
});

test("keyboard controls cut an adjacent tree and toggle the PL system menu", async () => {
  const engineSource = await readFile(new URL("../public/pinebarrow-engine.js", import.meta.url), "utf8");
  const tree = { x: 76, y: 169 };
  const game = createEngineHarness({
    version: 6,
    day: 2,
    minutes: 480,
    cash: 160,
    capacity: 6,
    player: { x: 75, y: 169 },
    selected: { type: "tree", ...tree },
    location: "tree",
    cleared: [],
    cargo: {},
    sawAttached: true,
    sawOwnership: "owned",
    pavedDepth: 3,
  }, engineSource);

  assert.equal(game.dispatchKey("keydown", "Space"), true);
  assert.equal(game.saved().player.x, tree.x);
  assert.equal(game.saved().player.y, tree.y);
  assert.equal(game.saved().cargo.logs, 0.5);
  assert.ok(game.saved().cleared.includes(`${tree.x},${tree.y}`));

  assert.equal(game.dispatchKey("keydown", "KeyE"), true);
  assert.equal(game.element("pb7-system-menu").hidden, false);
  assert.equal(game.element("pb7-menu-layer").hidden, true);
  game.dispatchKey("keyup", "KeyE");
  game.dispatchKey("keydown", "KeyE");
  assert.equal(game.element("pb7-system-menu").hidden, true);
});

test("controller left-stick steering and right trigger move the truck smoothly by tile", async () => {
  const engineSource = await readFile(new URL("../public/pinebarrow-engine.js", import.meta.url), "utf8");
  const gamepad = {
    axes: [0, 0, 0, 0],
    buttons: Array.from({ length: 16 }, () => ({ pressed: false, value: 0 })),
    connected: true,
    id: "Regression Controller",
    index: 0,
    mapping: "standard",
  };
  gamepad.buttons[7] = { pressed: true, value: 1 };

  const game = createEngineHarness({
    version: 6,
    day: 2,
    minutes: 480,
    cash: 160,
    player: { x: 45, y: 145 },
    selected: { type: "road", x: 45, y: 145 },
    location: "road",
    cleared: [],
  }, engineSource, { gamepad });

  game.frame(100);
  game.frame(500);
  game.element("pb7-save-now").click();
  assert.deepEqual(game.saved().player, { x: 46, y: 145 });

  gamepad.axes[1] = 1;
  game.frame(600);
  game.frame(1000);
  game.element("pb7-save-now").click();
  assert.deepEqual(game.saved().player, { x: 46, y: 146 });
  assert.match(game.element("pb7-map-tip").textContent, /Controller connected/);
});

test("the Market assigns a repeating business-contract truck to a matching mine", async () => {
  const engineSource = await readFile(new URL("../public/pinebarrow-engine.js", import.meta.url), "utf8");
  const mines = [
    {
      id: "mine-1", parcelId: "claim-1", x: 76, y: 170, w: 2, h: 2, doorX: 75, doorY: 170,
      level: 1, baseMaterial: "coal", material: "coal", depth: 3, ratio: 0,
      stockMaterial: 24, stockDirt: 0,
    },
    {
      id: "mine-2", parcelId: "claim-2", x: 78, y: 180, w: 2, h: 2, doorX: 77, doorY: 180,
      level: 1, baseMaterial: "stone", material: "stone", depth: 13, ratio: 0,
      stockMaterial: 4, stockDirt: 0,
    },
  ];
  const save = {
    version: 6,
    day: 9,
    minutes: 480,
    cash: 600,
    player: { x: 15, y: 142 },
    selected: { type: "road", x: 15, y: 142 },
    location: "market",
    cleared: [],
    mineParcels: [],
    warehouseParcels: [],
    mines,
    warehouses: [],
    selectedMineId: mines[0].id,
    selectedWarehouseId: null,
    hauls: [],
  };

  const game = createEngineHarness(save, engineSource);
  game.element("pb7-contracts").click();
  assert.equal(game.element("pb7-market-screen").hidden, false);
  assert.equal(game.element("pb7-contract-panel").hidden, false);
  const board = game.element("pb7-contract-board");
  board.querySelector = () => ({ value: mines[0].id });
  const acceptButton = { dataset: { acceptContract: "development-foundry" } };
  board.listeners.get("click")[0]({ target: { closest: () => acceptButton } });
  assert.equal(game.saved().companyContracts.length, 1);
  assert.equal(game.saved().companyContracts[0].mineId, mines[0].id);
  assert.equal(game.saved().companyContracts[0].material, "coal");
  assert.equal(game.saved().companyContracts[0].status, "active");

  game.element("pb7-market-close").click();
  game.element("pb7-menu-close").click();
  game.frame(1000);
  game.frame(2000);
  game.element("pb7-save-now").click();
  assert.ok(game.saved().companyContracts[0].inTransit);
  assert.equal(game.saved().companyContracts[0].truckSize, "s");
});

test("selecting a warehouse opens its own detail and upgrade menu", async () => {
  const engineSource = await readFile(new URL("../public/pinebarrow-engine.js", import.meta.url), "utf8");
  const warehouse = {
    id: "warehouse-1", parcelId: "warehouse-land-1", x: 78, y: 170, w: 2, h: 2,
    level: 2, storage: { stone: 3 }, doorX: 77, doorY: 170,
  };
  const game = createEngineHarness({
    version: 6,
    day: 9,
    minutes: 480,
    cash: 1000,
    player: { x: warehouse.doorX, y: warehouse.doorY },
    selected: { type: "warehouse", x: warehouse.x, y: warehouse.y },
    location: "warehouse",
    cleared: [],
    mineParcels: [],
    warehouseParcels: [{ id: warehouse.parcelId, x: warehouse.x, y: warehouse.y, w: 2, h: 2, status: "owned", warehouseId: warehouse.id }],
    mines: [],
    warehouses: [warehouse],
    selectedMineId: null,
    selectedWarehouseId: warehouse.id,
  }, engineSource);

  game.element("pb7-destination").value = `warehouse:${warehouse.id}`;
  game.element("pb7-go").click();
  assert.equal(game.element("pb7-menu-layer").hidden, false);
  assert.equal(game.element("pb7-location-details").hidden, false);
  assert.match(game.element("pb7-location-details").innerHTML, /Building level/);
  assert.equal(game.element("pb7-upgrade-warehouse").hidden, false);
});

test("the daily paper and ZEUS model update automatically", async () => {
  const engineSource = await readFile(new URL("../public/pinebarrow-engine.js", import.meta.url), "utf8");
  const game = createEngineHarness({
    version: 6,
    day: 1,
    minutes: 23 * 60 + 55,
    cash: 420,
    player: { x: 45, y: 145 },
    selected: { type: "road", x: 45, y: 145 },
    location: "road",
    cleared: [],
    truckSizeLevel: 3,
    truckSpeedLevel: 2,
    workers: 1,
  }, engineSource);

  assert.equal(game.element("pb7-truck-model").textContent, "V2S3W1");
  assert.match(game.element("pb7-news-day").textContent, /Day 1 · Daily Edition/);
  assert.match(game.element("pb7-news-headline").textContent, /stone order/i);
  assert.match(game.element("pb7-news-market").textContent, /Stone · \$58\/t · ▲12%/);

  game.frame(1000);
  game.frame(2000);
  assert.match(game.element("pb7-news-day").textContent, /Day 2 · Daily Edition/);
  assert.match(game.element("pb7-news-headline").textContent, /timber bids/i);
  assert.match(game.element("pb7-news-market").textContent, /Logs · \$20\/t · ▲11%/);
});

test("Town Hall approves and builds a turning two-wide road with purchased stone", async () => {
  const engineSource = await readFile(new URL("../public/pinebarrow-engine.js", import.meta.url), "utf8");
  const roadDraft = ["74,170", "74,171", "73,171"];
  const cleared = ["74,170", "75,170", "74,171", "75,171", "73,171", "73,172", "74,172"];
  const game = createEngineHarness({
    version: 8,
    day: 1,
    minutes: 480,
    cash: 5000,
    cargo: { stone: 2 },
    player: { x: 45, y: 146 },
    location: "townhall",
    selected: { type: "road", x: 45, y: 146 },
    cleared,
    pavedDepth: 3,
    unlockedClaimZones: 1,
    roadDraft,
    roadPlanning: true,
    roadTiles: [],
  }, engineSource);

  assert.equal(game.element("pb7-road-submit").hidden, false);
  assert.equal(game.element("pb7-road-submit").disabled, false);
  game.element("pb7-road-submit").click();
  const approved = game.saved();
  assert.ok(approved.roadApproval);
  assert.equal(approved.roadApproval.routeTiles.length, 7);
  assert.equal(approved.roadApproval.stonePrice, 58);
  assert.equal(approved.cargo.stone, 2);

  game.element("pb7-road-accept").click();
  const built = game.saved();
  assert.equal(built.roadContractsCompleted, 1);
  assert.equal(built.roadTiles.length, 7);
  assert.ok(built.roadMarketImpact.strength > 0);
  assert.equal(built.cargo.stone, 2);
  assert.ok(built.cash < 5000);
  assert.match(built.contextText, /purchased .* t of stone/i);
});

test("road-contract stone demand rises on purchase day and corrects the next day", async () => {
  const engineSource = await readFile(new URL("../public/pinebarrow-engine.js", import.meta.url), "utf8");
  const common = {
    version: 8,
    minutes: 480,
    cash: 500,
    player: { x: 45, y: 145 },
    location: "road",
    selected: { type: "road", x: 45, y: 145 },
    cleared: [],
    roadMarketImpact: { day: 1, tons: 10, strength: 0.2 },
  };
  const purchaseDay = createEngineHarness({ ...common, day: 1 }, engineSource);
  assert.match(purchaseDay.element("pb7-news-headline").textContent, /stone market/i);
  assert.match(purchaseDay.element("pb7-news-market").textContent, /Stone · \$69\/t · ▲33%/);

  const correctionDay = createEngineHarness({ ...common, day: 2 }, engineSource);
  assert.match(correctionDay.element("pb7-news-headline").textContent, /bids cool/i);
  assert.match(correctionDay.element("pb7-news-market").textContent, /Stone · \$46\/t · ▼12%/);
});

test("music, truck audio, and effects save as independent controls", async () => {
  const engineSource = await readFile(new URL("../public/pinebarrow-engine.js", import.meta.url), "utf8");
  const game = createEngineHarness({
    version: 8,
    day: 1,
    minutes: 480,
    cash: 160,
    player: { x: 45, y: 145 },
    selected: { type: "road", x: 45, y: 145 },
    location: "road",
    cleared: [],
  }, engineSource);

  game.element("pb7-music").click();
  game.element("pb7-engine-sound").click();
  game.element("pb7-effects").click();
  game.element("pb7-save-now").click();
  const saved = game.saved();
  assert.equal(saved.musicEnabled, false);
  assert.equal(saved.engineSoundEnabled, false);
  assert.equal(saved.effectsSoundEnabled, false);
  assert.equal(game.element("pb7-music")["aria-pressed"], "false");
  assert.equal(game.element("pb7-engine-sound")["aria-pressed"], "false");
  assert.equal(game.element("pb7-effects")["aria-pressed"], "false");
});

test("Marketplace sell offers use player price and fill over game time", async () => {
  const engineSource = await readFile(new URL("../public/pinebarrow-engine.js", import.meta.url), "utf8");
  const game = createEngineHarness({
    version: 8,
    day: 1,
    minutes: 480,
    cash: 100,
    cargo: { stone: 2 },
    player: { x: 15, y: 142 },
    selected: { type: "road", x: 15, y: 142 },
    location: "market",
    cleared: [],
    lastExchangeProcessAt: 450,
  }, engineSource);

  game.element("pb7-marketplace").click();
  game.element("pb7-exchange-material").value = "stone";
  game.element("pb7-exchange-quantity").value = "1.5";
  game.element("pb7-exchange-price").value = "40";
  game.element("pb7-exchange-offer").click();
  assert.equal(game.saved().cargo.stone, 0.5);
  assert.equal(game.saved().exchangeOrders.length, 1);
  assert.equal(game.saved().exchangeOrders[0].askPrice, 40);

  game.element("pb7-market-close").click();
  game.element("pb7-menu-close").click();
  game.frame(1000);
  game.frame(2000);
  game.element("pb7-save-now").click();
  const afterBuyers = game.saved();
  assert.ok(afterBuyers.exchangeOrders[0].sold > 0);
  assert.ok(afterBuyers.cash > 96);
});

test("a fulfilled founding contract creates a Coming Soon business", async () => {
  const engineSource = await readFile(new URL("../public/pinebarrow-engine.js", import.meta.url), "utf8");
  const mine = {
    id: "mine-1", parcelId: "claim-1", x: 76, y: 170, w: 2, h: 2, doorX: 75, doorY: 170,
    level: 1, baseMaterial: "coal", material: "coal", depth: 3, ratio: 0,
    stockMaterial: 0, stockDirt: 0,
  };
  const game = createEngineHarness({
    version: 8,
    day: 2,
    minutes: 480,
    cash: 100,
    player: { x: 45, y: 145 },
    selected: { type: "road", x: 45, y: 145 },
    location: "road",
    cleared: [],
    mines: [mine],
    companyContracts: [{
      id: "contract-1", sourceOfferId: "development-foundry", buyer: "Pinebarrow Foundry",
      material: "coal", quantity: 1, delivered: 0, unitPrice: 50, truckSize: "s", mineId: mine.id,
      developmentBusinessId: "foundry", status: "active", acceptedDay: 1, nextTripAt: 480,
      inTransit: { materialTons: 1, dirtTons: 0, dispatchedAt: 330, completeAt: 480 },
    }],
    townBusinesses: {},
  }, engineSource);

  game.frame(1000);
  game.frame(2000);
  game.element("pb7-save-now").click();
  const saved = game.saved();
  assert.equal(saved.companyContracts[0].status, "complete");
  assert.equal(saved.townBusinesses.foundry.status, "announced");
  assert.equal(saved.townBusinesses.foundry.opensDay, 3);
});

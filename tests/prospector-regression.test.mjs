import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const SAVE_KEY = "pinebarrow-land-company-save-v1";
const PROFILE_KEY = "pinebarrow-land-company-profile-v1-1";
const ACTION_BUTTON_IDS = [
  "pb7-hire", "pb7-hire-worker", "pb7-hauler-xs", "pb7-hauler-s", "pb7-hauler-m", "pb7-hauler-l",
  "pb7-marketplace", "pb7-contracts", "pb7-company-management", "pb7-sell", "pb7-buy-saw", "pb7-rent-saw", "pb7-shaker", "pb7-upgrade-truck-size",
  "pb7-upgrade-truck-speed", "pb7-road-plan", "pb7-road-submit", "pb7-road-accept", "pb7-road-cancel", "pb7-read-news", "pb7-prospect", "pb7-select-prospect-1", "pb7-select-prospect-2", "pb7-lease",
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

  async clickAsync() {
    await Promise.all((this.listeners.get("click") ?? []).map((listener) => listener({})));
  }

  emit(type, event = {}) {
    for (const listener of this.listeners.get(type) ?? []) listener(event);
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

  const documentListeners = new Map();
  const documentElement = new FakeElement("html");
  const document = {
    activeElement: null,
    documentElement,
    fullscreenElement: null,
    webkitFullscreenElement: null,
    visibilityState: "visible",
    getElementById: (id) => id === root.id ? root : null,
    addEventListener(type, listener) {
      documentListeners.set(type, listener);
    },
    createElement: (tag) => new FakeElement(tag),
    async exitFullscreen() {
      this.fullscreenElement = null;
      const listener = documentListeners.get("fullscreenchange");
      if (listener) listener({});
    },
  };
  documentElement.requestFullscreen = async () => {
    document.fullscreenElement = documentElement;
    const listener = documentListeners.get("fullscreenchange");
    if (listener) listener({});
  };
  root.requestFullscreen = async () => {
    document.fullscreenElement = root;
    const listener = documentListeners.get("fullscreenchange");
    if (listener) listener({});
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
    fullscreenElement: () => document.fullscreenElement,
    saved: () => JSON.parse(storage.get(PROFILE_KEY)).save,
  };
}

test("two independent prospects survive save/reload and neither replaces the other", async () => {
  const engineSource = await readFile(new URL("../public/pinebarrow-engine.js", import.meta.url), "utf8");
  const legacyFirstTile = { x: 76, y: 169 };
  const firstTile = { x: 76, y: 122 };
  const secondTile = { x: 78, y: 122 };
  const nextDayTile = { x: 80, y: 122 };
  const oldSave = {
    version: 4,
    day: 3,
    minutes: 480,
    cash: 160,
    player: legacyFirstTile,
    selected: { type: "cleared", ...legacyFirstTile },
    location: "cleared",
    cleared: ["76,169", "78,169", "80,169"],
    prospectorHired: true,
    prospectorDay: 3,
    prospectsUsedToday: 1,
  };

  const migrated = createEngineHarness(oldSave, engineSource);
  assert.equal(migrated.saved().version, 14);
  assert.equal(migrated.saved().worldLayoutVersion, 2);
  assert.deepEqual(migrated.saved().player, firstTile);
  assert.equal(migrated.saved().prospectsUsedToday, 0);
  assert.equal(migrated.element("pb7-prospect").disabled, false);

  migrated.element("pb7-prospect").click();
  const afterFirst = migrated.saved();
  assert.equal(afterFirst.prospectsUsedToday, 1);
  assert.equal(afterFirst.surveyParcel.status, "surveyed");
  assert.equal(afterFirst.surveyParcels.length, 1);
  assert.match(afterFirst.contextText, /Prospect 1 is preserved/);
  const firstProspect = structuredClone(afterFirst.surveyParcels[0]);

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
  assert.equal(afterSecond.surveyParcels.length, 2);
  assert.notEqual(afterSecond.surveyParcels[0].id, afterSecond.surveyParcels[1].id);
  assert.deepEqual(afterSecond.surveyParcels.find((parcel) => parcel.id === firstProspect.id), firstProspect);
  assert.match(afterSecond.contextText, /Prospect 1 and Prospect 2 are both preserved/);

  const reloaded = createEngineHarness(afterSecond, engineSource);
  const afterReload = reloaded.saved();
  assert.equal(afterReload.surveyParcels.length, 2);
  assert.deepEqual(afterReload.surveyParcels.find((parcel) => parcel.id === firstProspect.id), firstProspect);

  const nextDaySave = {
    ...afterReload,
    day: 4,
    player: nextDayTile,
    selected: { type: "cleared", ...nextDayTile },
    location: "cleared",
  };
  const nextDay = createEngineHarness(nextDaySave, engineSource);
  assert.equal(nextDay.element("pb7-prospect").disabled, true);
  nextDay.element("pb7-prospect").click();
  assert.equal(nextDay.saved().surveyParcels.length, 2);
  assert.match(nextDay.saved().contextText, /Prospect 1 and Prospect 2 are both preserved/);
});

test("legacy singular prospect migrates once without losing the selected mine", async () => {
  const engineSource = await readFile(new URL("../public/pinebarrow-engine.js", import.meta.url), "utf8");
  const legacySurvey = {
    id: "survey-legacy",
    x: 76,
    y: 168,
    w: 2,
    h: 2,
    status: "surveyed",
    material: "stone",
    ratio: 0.4,
    depth: 1,
    leaseCredit: 0,
    lastLeaseDay: 0,
  };
  const mineParcel = {
    id: "claim-existing",
    x: 80,
    y: 168,
    w: 2,
    h: 2,
    status: "owned",
    material: "coal",
    ratio: 0.3,
    depth: 1,
    leaseCredit: 420,
    mineId: "mine-existing",
  };
  const mine = {
    id: "mine-existing",
    parcelId: mineParcel.id,
    x: mineParcel.x,
    y: mineParcel.y,
    w: 2,
    h: 2,
    level: 1,
    baseMaterial: "coal",
    material: "coal",
    depth: 1,
    ratio: 0.3,
    stockMaterial: 0,
    stockDirt: 0,
    doorX: 82,
    doorY: 168,
  };
  const game = createEngineHarness({
    version: 8,
    day: 5,
    minutes: 480,
    cash: 1000,
    player: { x: 82, y: 168 },
    selected: { type: "mine", x: mine.x, y: mine.y },
    location: "mine",
    prospectorHired: true,
    prospectorDay: 5,
    prospectsUsedToday: 1,
    surveyParcel: legacySurvey,
    mineParcel: legacySurvey,
    mineParcels: [mineParcel],
    mines: [mine],
    selectedMineId: mine.id,
    selectedMineParcelId: mineParcel.id,
    nextSiteId: 1,
  }, engineSource);

  const migrated = game.saved();
  assert.equal(migrated.surveyParcels.length, 1);
  assert.equal(migrated.surveyParcels[0].id, legacySurvey.id);
  assert.equal(migrated.surveyParcel.id, legacySurvey.id);
  assert.equal(migrated.selectedMineParcelId, mineParcel.id);
});

test("Town Hall displays both prospects and leases the selected stable ID", async () => {
  const engineSource = await readFile(new URL("../public/pinebarrow-engine.js", import.meta.url), "utf8");
  const first = { id: "survey-1", x: 76, y: 168, w: 2, h: 2, status: "surveyed", material: "stone", ratio: 0.4, depth: 1, leaseCredit: 0, lastLeaseDay: 0, prospectSlot: 1 };
  const second = { id: "survey-2", x: 78, y: 168, w: 2, h: 2, status: "surveyed", material: "coal", ratio: 0.3, depth: 1, leaseCredit: 0, lastLeaseDay: 0, prospectSlot: 2 };
  const game = createEngineHarness({
    version: 9,
    day: 5,
    minutes: 480,
    cash: 1000,
    player: { x: 37, y: 141 },
    selected: { type: "building", id: "townhall", x: 37, y: 141 },
    location: "townhall",
    prospectorHired: true,
    prospectorDay: 5,
    prospectsUsedToday: 2,
    surveyParcels: [first, second],
    surveyParcel: first,
    selectedSurveyId: first.id,
    mineParcels: [],
    warehouseParcels: [],
    mines: [],
    warehouses: [],
    nextSiteId: 3,
  }, engineSource);

  assert.equal(game.element("pb7-location-details").hidden, false);
  assert.match(game.element("pb7-location-details").innerHTML, /PROSPECT 1/);
  assert.match(game.element("pb7-location-details").innerHTML, /PROSPECT 2/);
  assert.match(game.element("pb7-location-details").innerHTML, /survey-1/);
  assert.match(game.element("pb7-location-details").innerHTML, /survey-2/);
  assert.equal(game.element("pb7-select-prospect-1").hidden, false);
  assert.equal(game.element("pb7-select-prospect-2").hidden, false);

  game.element("pb7-select-prospect-2").click();
  assert.equal(game.saved().selectedSurveyId, second.id);
  assert.equal(game.saved().surveyParcel.id, second.id);

  game.element("pb7-lease").click();
  const leased = game.saved();
  assert.equal(leased.mineParcels.length, 1);
  assert.equal(leased.mineParcels[0].id, second.id);
  assert.deepEqual(leased.surveyParcels.map((parcel) => parcel.id), [first.id]);
  assert.equal(leased.selectedSurveyId, first.id);
  assert.equal(leased.surveyParcel.id, first.id);
});

test("generic proposal records persist across save and reload without activating development", async () => {
  const engineSource = await readFile(new URL("../public/pinebarrow-engine.js", import.meta.url), "utf8");
  const proposals = [
    {
      id: "proposal-mine-1",
      type: "mining",
      use: "mine",
      lot: { x: 12, y: 130, w: 2, h: 2, blockId: "town-block-1" },
      footprint: { w: 2, h: 2 },
      cost: 600,
      status: "approved",
      owner: "player",
      stage: "approved",
    },
    {
      id: "proposal-home-1",
      type: "residential",
      use: "housing",
      lot: { x: 26, y: 150, w: 4, h: 4, blockId: "town-block-2" },
      footprint: { w: 4, h: 4 },
      cost: null,
      status: "draft",
      owner: null,
      stage: "unstarted",
    },
    {
      id: "proposal-industry-1",
      type: "industrial",
      use: "foundry",
      lot: { x: 50, y: 150, w: 7, h: 7, blockId: "town-block-3" },
      footprint: { w: 7, h: 7 },
      cost: 1200,
      status: "construction",
      owner: "town",
      stage: "foundation",
    },
  ];
  const game = createEngineHarness({
    version: 10,
    day: 6,
    minutes: 480,
    cash: 1000,
    player: { x: 37, y: 141 },
    selected: { type: "building", id: "townhall", x: 37, y: 141 },
    location: "townhall",
    proposals,
    nextProposalId: 4,
  }, engineSource);

  const saved = game.saved();
  assert.equal(saved.version, 14);
  assert.equal(saved.proposals.length, 3);
  assert.deepEqual(saved.proposals, proposals);
  assert.equal(saved.nextProposalId, 4);

  const reloaded = createEngineHarness(saved, engineSource).saved();
  assert.deepEqual(reloaded.proposals, saved.proposals);
  assert.equal(reloaded.nextProposalId, saved.nextProposalId);
});

test("Town Hall displays independent residential proposals up to the configured UI limit", async () => {
  const engineSource = await readFile(new URL("../public/pinebarrow-engine.js", import.meta.url), "utf8");
  const proposals = Array.from({ length: 5 }, (_, index) => ({
    id: `proposal-home-${index + 1}`,
    type: "residential",
    use: index % 2 === 0 ? "starter-housing" : "family-housing",
    lot: { x: 4 + index * 10, y: 128, w: 4, h: 4, blockId: `town-block-${index + 1}` },
    footprint: { w: 4, h: 4 },
    cost: index < 2 ? 300 + index * 100 : null,
    status: index === 0 ? "approved" : "draft",
    owner: index === 0 ? "player" : null,
    stage: index === 0 ? "approved" : "unstarted",
  }));
  proposals.push({
    id: "proposal-industry-1",
    type: "industrial",
    use: "foundry",
    lot: { x: 50, y: 150, w: 7, h: 7, blockId: "town-block-industry" },
    footprint: { w: 7, h: 7 },
    status: "draft",
    stage: "unstarted",
  });

  const game = createEngineHarness({
    version: 11,
    day: 6,
    minutes: 480,
    cash: 1000,
    player: { x: 37, y: 141 },
    selected: { type: "building", id: "townhall", x: 37, y: 141 },
    location: "townhall",
    proposals,
    nextProposalId: 7,
  }, engineSource);

  const markup = game.element("pb7-location-details").innerHTML;
  assert.match(markup, /Residential proposals/);
  assert.match(markup, /4 \/ 4 filed/);
  assert.match(markup, /proposal-home-1/);
  assert.match(markup, /proposal-home-4/);
  assert.doesNotMatch(markup, /proposal-home-5/);
  assert.doesNotMatch(markup, /proposal-industry-1/);
  assert.match(markup, /1 additional saved proposal record is preserved/);
  assert.equal(game.saved().proposals.length, proposals.length);
  assert.equal(game.saved().workers, 0);
});

test("leasing a survey immediately frees the prospector for another mine claim", async () => {
  const engineSource = await readFile(new URL("../public/pinebarrow-engine.js", import.meta.url), "utf8");
  const legacyFirstTile = { x: 76, y: 169 };
  const firstTile = { x: 76, y: 122 };
  const secondClaimTile = { x: 78, y: 122 };
  const startingSave = {
    version: 4,
    day: 3,
    minutes: 480,
    cash: 500,
    player: legacyFirstTile,
    selected: { type: "cleared", ...legacyFirstTile },
    location: "cleared",
    cleared: ["76,169", "78,169"],
    prospectorHired: true,
    prospectorDay: 3,
    prospectsUsedToday: 0,
  };

  const first = createEngineHarness(startingSave, engineSource);
  assert.deepEqual(first.saved().player, firstTile);
  first.element("pb7-prospect").click();
  const surveyed = first.saved();

  const hall = createEngineHarness({ ...surveyed, player: { x: 45, y: 146 }, location: "townhall" }, engineSource);
  assert.equal(hall.element("pb7-lease").hidden, false);
  hall.element("pb7-lease").click();
  const leased = hall.saved();
  assert.equal(leased.surveyParcel, null);
  assert.equal(leased.surveyParcels.length, 0);
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

test("a saved second parcel opens a project for a new mine", async () => {
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
  assert.equal(game.saved().mines.length, 1);
  assert.equal(game.saved().cash, 2000);
  assert.equal(game.saved().constructionProjects.length, 1);
  assert.equal(game.saved().constructionProjects[0].siteKind, "mine");
});

test("an owned second warehouse parcel opens a project after loading its profile", async () => {
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
  assert.equal(game.saved().warehouses.length, 1);
  assert.equal(game.saved().cash, 2000);
  assert.equal(game.saved().constructionProjects.length, 1);
  assert.equal(game.saved().constructionProjects[0].siteKind, "warehouse");
});

test("an uncleared tree inside owned warehouse land remains selectable and cuttable", async () => {
  const engineSource = await readFile(new URL("../public/pinebarrow-engine.js", import.meta.url), "utf8");
  const tree = { x: 47, y: 122 };
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
    version: 12,
    worldLayoutVersion: 2,
    day: 9,
    minutes: 480,
    cash: 1000,
    capacity: 6,
    player: { x: 46, y: tree.y },
    selected: { type: "road", x: 46, y: tree.y },
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

test("retired multiplayer lane and section barriers no longer block northern travel", async () => {
  const engineSource = await readFile(new URL("../public/pinebarrow-engine.js", import.meta.url), "utf8");
  const laneBoundary = createEngineHarness({
    version: 12,
    worldLayoutVersion: 2,
    day: 4,
    minutes: 480,
    cash: 1000,
    player: { x: 29, y: 124 },
    location: "cleared",
    selected: { type: "cleared", x: 29, y: 124 },
    cleared: [],
    pavedDepth: 1,
  }, engineSource);

  assert.equal(laneBoundary.element("pinebarrow-visible-menu-demo").dataset.multiplayerBarrierCount, "0");
  assert.equal(laneBoundary.dispatchKey("keydown", "ArrowRight"), true);
  laneBoundary.frame(100);
  laneBoundary.frame(1000);
  laneBoundary.dispatchKey("keyup", "ArrowRight");
  laneBoundary.element("pb7-save-now").click();
  assert.deepEqual(laneBoundary.saved().player, { x: 30, y: 124 });

  const sectionBoundary = createEngineHarness({
    version: 12,
    worldLayoutVersion: 2,
    day: 4,
    minutes: 480,
    cash: 1000,
    player: { x: 44, y: 83 },
    location: "cleared",
    selected: { type: "cleared", x: 44, y: 83 },
    cleared: [],
    pavedDepth: 42,
  }, engineSource);
  assert.equal(sectionBoundary.dispatchKey("keydown", "ArrowUp"), true);
  sectionBoundary.frame(100);
  sectionBoundary.frame(1000);
  sectionBoundary.dispatchKey("keyup", "ArrowUp");
  sectionBoundary.element("pb7-save-now").click();
  assert.deepEqual(sectionBoundary.saved().player, { x: 44, y: 82 });
});

test("single-player world assigns north to the company, south to Crowe, and keeps lakes conflict-free", async () => {
  const engineSource = await readFile(new URL("../public/pinebarrow-engine.js", import.meta.url), "utf8");
  const fresh = createEngineHarness(null, engineSource);
  assert.deepEqual(fresh.saved().player, { x: 45, y: 123 });
  assert.ok(fresh.saved().player.y < 125);

  const game = createEngineHarness({
    version: 12,
    worldLayoutVersion: 2,
    day: 4,
    minutes: 480,
    cash: 1000,
    player: { x: 44, y: 167 },
    location: "road",
    selected: { type: "road", x: 44, y: 167 },
    cleared: [],
    pavedDepth: 1,
  }, engineSource);

  const root = game.element("pinebarrow-visible-menu-demo");
  assert.equal(root.dataset.worldLayoutVersion, "2");
  assert.equal(root.dataset.worldMode, "single-player-campaign");
  assert.equal(root.dataset.playerDevelopmentSide, "north");
  assert.equal(root.dataset.croweDevelopmentSide, "south");
  assert.equal(root.dataset.multiplayerBarrierCount, "0");
  assert.equal(root.dataset.lakeCount, "5");
  assert.ok(Number(root.dataset.lakeTileCount) > 300);
  assert.equal(root.dataset.townLakeTileCount, "0");
  assert.equal(root.dataset.lakeSurfaceConflicts, "0");
  assert.equal(root.dataset.townPlannedLotCapacity, "16");

  assert.equal(game.dispatchKey("keydown", "ArrowDown"), true);
  game.frame(100);
  game.frame(1000);
  game.dispatchKey("keyup", "ArrowDown");
  game.element("pb7-save-now").click();
  assert.deepEqual(game.saved().player, { x: 44, y: 168 });
  assert.equal(game.element("pb7-prospect").disabled, true);
});

test("legacy P4 assets migrate north without losing IDs, stock, roads, or cargo", async () => {
  const engineSource = await readFile(new URL("../public/pinebarrow-engine.js", import.meta.url), "utf8");
  const mineParcel = { id: "claim-legacy", x: 76, y: 168, w: 2, h: 2, status: "owned", material: "stone", ratio: 0.4, mineId: "mine-legacy" };
  const warehouseParcel = { id: "warehouse-land-legacy", x: 80, y: 172, w: 2, h: 2, status: "owned", warehouseId: "warehouse-legacy" };
  const game = createEngineHarness({
    version: 11,
    day: 12,
    minutes: 600,
    cash: 777,
    player: { x: 75, y: 169 },
    selected: { type: "mine", x: 76, y: 168, mineId: "mine-legacy" },
    location: "mine",
    cleared: ["76,168", "77,168", "76,169", "77,169"],
    roadTiles: ["75,169", "75,170"],
    pavedDepth: 3,
    cargo: { stone: 2.5, dirt: 1 },
    mineParcels: [mineParcel],
    warehouseParcels: [warehouseParcel],
    mines: [{
      id: "mine-legacy", parcelId: mineParcel.id, x: 76, y: 168, w: 2, h: 2,
      doorX: 78, doorY: 168, level: 3, baseMaterial: "stone", material: "coal",
      depth: 1, ratio: 0.4, stockMaterial: 4.5, stockDirt: 2,
    }],
    warehouses: [{
      id: "warehouse-legacy", parcelId: warehouseParcel.id, x: 80, y: 172, w: 2, h: 2,
      doorX: 82, doorY: 172, level: 2, storage: { stone: 6 },
    }],
    selectedMineId: "mine-legacy",
    selectedWarehouseId: "warehouse-legacy",
  }, engineSource);

  const saved = game.saved();
  assert.equal(saved.version, 14);
  assert.equal(saved.worldLayoutVersion, 2);
  assert.deepEqual(saved.player, { x: 75, y: 122 });
  assert.deepEqual(saved.cargo, { stone: 2.5, clay: 0, coal: 0, iron: 0, copper: 0, tin: 0, quartz: 0, silver: 0, gold: 0, sapphire: 0, logs: 0, dirt: 1 });
  assert.equal(saved.mineParcels[0].id, "claim-legacy");
  assert.deepEqual({ x: saved.mines[0].x, y: saved.mines[0].y, doorX: saved.mines[0].doorX, doorY: saved.mines[0].doorY }, { x: 76, y: 122, doorX: 78, doorY: 123 });
  assert.equal(saved.mines[0].stockMaterial, 4.5);
  assert.equal(saved.warehouseParcels[0].id, "warehouse-land-legacy");
  assert.deepEqual({ x: saved.warehouses[0].x, y: saved.warehouses[0].y, doorX: saved.warehouses[0].doorX, doorY: saved.warehouses[0].doorY }, { x: 80, y: 118, doorX: 82, doorY: 119 });
  assert.equal(saved.warehouses[0].storage.stone, 6);
  assert.ok(saved.roadTiles.includes("75,121"));
  assert.ok(saved.roadTiles.includes("74,124"));
  assert.ok(saved.roadTiles.includes("74,122"));
  assert.equal(saved.pavedDepth, 1);
  assert.match(saved.contextTitle, /Company moved north/);

  const reloaded = createEngineHarness(saved, engineSource).saved();
  assert.deepEqual(reloaded.player, saved.player);
  assert.deepEqual(reloaded.mineParcels, saved.mineParcels);
  assert.deepEqual(reloaded.warehouseParcels, saved.warehouseParcels);
  assert.deepEqual(reloaded.roadTiles, saved.roadTiles);
  assert.equal(reloaded.worldLayoutVersion, 2);
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
  const tree = { x: 47, y: 122 };
  const game = createEngineHarness({
    version: 12,
    worldLayoutVersion: 2,
    day: 2,
    minutes: 480,
    cash: 160,
    capacity: 6,
    player: { x: 46, y: 122 },
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

test("fullscreen keeps the complete game mounted and refreshes the map viewport", async () => {
  const engineSource = await readFile(new URL("../public/pinebarrow-engine.js", import.meta.url), "utf8");
  const game = createEngineHarness({
    version: 8,
    day: 2,
    minutes: 480,
    cash: 160,
    player: { x: 45, y: 145 },
    selected: { type: "road", x: 45, y: 145 },
    location: "road",
    cleared: [],
  }, engineSource);

  game.element("pb7-menu-toggle").click();
  await game.element("pb7-landscape").clickAsync();

  assert.equal(game.fullscreenElement().id, "html");
  assert.equal(game.element("pinebarrow-visible-menu-demo").dataset.fullscreen, "true");
  assert.equal(game.element("pinebarrow-visible-menu-demo").dataset.fullscreenTarget, "document");
  assert.equal(game.element("pb7-system-menu").hidden, true);
  assert.match(game.element("pb7-landscape").textContent, /Exit full screen/);
  assert.ok(game.element("pb7-map").width >= 1000);
  assert.ok(game.element("pb7-map").height >= 650);
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
  assert.equal(game.element("pb7-market-screen").hidden, true);
  assert.equal(game.element("pb7-management-screen").hidden, false);
  assert.equal(game.element("pb7-contract-management-panel").hidden, false);
  const board = game.element("pb7-management-contract-board");
  board.querySelector = () => ({ value: mines[0].id });
  const acceptButton = { dataset: { acceptContract: "development-foundry" } };
  board.listeners.get("click")[0]({ target: { closest: () => acceptButton } });
  assert.equal(game.saved().companyContracts.length, 1);
  assert.equal(game.saved().companyContracts[0].mineId, mines[0].id);
  assert.equal(game.saved().companyContracts[0].material, "coal");
  assert.equal(game.saved().companyContracts[0].status, "active");

  assert.match(board.innerHTML, /Total reward/);
  assert.match(board.innerHTML, /Assigned mine/);
  assert.match(board.innerHTML, /Truck cycle/);
  game.element("pb7-management-close").click();
  game.element("pb7-menu-close").click();
  game.frame(1000);
  game.frame(2000);
  game.element("pb7-save-now").click();
  assert.ok(game.saved().companyContracts[0].inTransit);
  assert.equal(game.saved().companyContracts[0].truckSize, "s");
});

test("Mine Management reports every site and exposes production bottlenecks", async () => {
  const engineSource = await readFile(new URL("../public/pinebarrow-engine.js", import.meta.url), "utf8");
  const mines = [
    {
      id: "mine-1", parcelId: "claim-1", x: 76, y: 170, w: 2, h: 2, doorX: 75, doorY: 170,
      level: 1, baseMaterial: "stone", material: "stone", depth: 3, ratio: 0.2,
      stockMaterial: 5, stockDirt: 1,
    },
    {
      id: "mine-2", parcelId: "claim-2", x: 78, y: 180, w: 2, h: 2, doorX: 77, doorY: 180,
      level: 2, baseMaterial: "iron", material: "iron", depth: 64, ratio: 0.1,
      stockMaterial: 1, stockDirt: 0,
    },
  ];
  const warehouse = {
    id: "warehouse-1", parcelId: "warehouse-land-1", x: 80, y: 180, w: 2, h: 2,
    level: 1, storage: { stone: 8 }, doorX: 79, doorY: 180,
  };
  const game = createEngineHarness({
    version: 8,
    day: 9,
    minutes: 480,
    cash: 1200,
    player: { x: 37, y: 141 },
    selected: { type: "building", id: "townhall", x: 37, y: 141 },
    location: "townhall",
    cleared: [],
    workers: 2,
    mineParcels: [
      { id: "claim-1", x: 76, y: 170, w: 2, h: 2, status: "owned", mineId: "mine-1" },
      { id: "claim-2", x: 78, y: 180, w: 2, h: 2, status: "owned", mineId: "mine-2" },
    ],
    warehouseParcels: [
      { id: "warehouse-land-1", x: 80, y: 180, w: 2, h: 2, status: "owned", warehouseId: "warehouse-1", mineParcelId: "claim-2" },
    ],
    mines,
    warehouses: [warehouse],
    selectedMineId: mines[0].id,
    selectedWarehouseId: warehouse.id,
    hauls: [],
  }, engineSource);

  game.element("pb7-company-management").click();
  assert.equal(game.element("pb7-management-screen").hidden, false);
  assert.equal(game.element("pb7-mine-management-panel").hidden, false);
  const board = game.element("pb7-mine-management-board");
  assert.match(board.innerHTML, /MINE 1/);
  assert.match(board.innerHTML, /MINE 2/);
  assert.match(board.innerHTML, /MINE STORAGE FULL/);
  assert.match(board.innerHTML, /WAREHOUSE FULL/);
  assert.match(board.innerHTML, /Production/);
  assert.match(board.innerHTML, /Output storage/);
  assert.match(board.innerHTML, /Assigned warehouse/);
  assert.match(board.innerHTML, /Hauling status/);
  assert.match(board.innerHTML, /Upgrade status/);
  assert.equal(game.element("pinebarrow-visible-menu-demo").dataset.managementMineCount, "2");
  assert.equal(game.element("pinebarrow-visible-menu-demo").dataset.managementWarehouseCount, "1");
  assert.equal(game.element("pinebarrow-visible-menu-demo").dataset.managementBottlenecks, "2");
});

test("Warehouse Management opens from a warehouse and shows its connected network", async () => {
  const engineSource = await readFile(new URL("../public/pinebarrow-engine.js", import.meta.url), "utf8");
  const mine = {
    id: "mine-1", parcelId: "claim-1", x: 76, y: 170, w: 2, h: 2, doorX: 75, doorY: 170,
    level: 2, baseMaterial: "coal", material: "coal", depth: 31, ratio: 0.15,
    stockMaterial: 2, stockDirt: 0.4,
  };
  const warehouse = {
    id: "warehouse-1", parcelId: "warehouse-land-1", x: 78, y: 170, w: 2, h: 2,
    level: 2, storage: { coal: 4, stone: 1 }, doorX: 77, doorY: 170,
  };
  const game = createEngineHarness({
    version: 8,
    day: 9,
    minutes: 480,
    cash: 1000,
    player: { x: warehouse.doorX, y: warehouse.doorY },
    selected: { type: "warehouse", x: warehouse.x, y: warehouse.y },
    location: "warehouse",
    cleared: [],
    workers: 1,
    mineParcels: [{ id: "claim-1", x: mine.x, y: mine.y, w: 2, h: 2, status: "owned", mineId: mine.id }],
    warehouseParcels: [{ id: warehouse.parcelId, x: warehouse.x, y: warehouse.y, w: 2, h: 2, status: "owned", warehouseId: warehouse.id, mineParcelId: "claim-1" }],
    mines: [mine],
    warehouses: [warehouse],
    selectedMineId: mine.id,
    selectedWarehouseId: warehouse.id,
    hauls: [],
  }, engineSource);

  game.element("pb7-company-management").click();
  assert.equal(game.element("pb7-management-screen").hidden, false);
  assert.equal(game.element("pb7-warehouse-management-panel").hidden, false);
  assert.equal(game.element("pb7-mine-management-panel").hidden, true);
  const board = game.element("pb7-warehouse-management-board");
  assert.match(board.innerHTML, /WAREHOUSE 1/);
  assert.match(board.innerHTML, /Inventory/);
  assert.match(board.innerHTML, /Connected mine/);
  assert.match(board.innerHTML, /Free capacity/);
  assert.match(board.innerHTML, /Hauling status/);
  assert.match(board.innerHTML, /Upgrade status/);
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

test("truck gauge reports useful full, waiting, and no-destination states", async () => {
  const engineSource = await readFile(new URL("../public/pinebarrow-engine.js", import.meta.url), "utf8");
  const common = {
    version: 8,
    day: 1,
    minutes: 480,
    cash: 160,
    player: { x: 45, y: 145 },
    selected: { type: "road", x: 45, y: 145 },
    location: "road",
    cleared: [],
  };

  const waiting = createEngineHarness({ ...common, cargo: { stone: 1 } }, engineSource);
  assert.equal(waiting.element("pb7-truck-status").textContent, "Waiting");
  assert.equal(waiting.element("pb7-truck-stat").dataset.status, "waiting");

  const full = createEngineHarness({ ...common, cargo: { stone: 6 } }, engineSource);
  assert.equal(full.element("pb7-truck-status").textContent, "Full");
  assert.equal(full.element("pb7-truck-stat").dataset.status, "full");

  const withoutDestination = createEngineHarness({ ...common, selected: null, location: null }, engineSource);
  assert.equal(withoutDestination.element("pb7-truck-status").textContent, "No destination");
  assert.equal(withoutDestination.element("pb7-truck-stat").dataset.status, "no-destination");
});

test("surface ore cannot occupy or be prospected from reserved and custom road cells", async () => {
  const engineSource = await readFile(new URL("../public/pinebarrow-engine.js", import.meta.url), "utf8");
  const common = {
    version: 12,
    worldLayoutVersion: 2,
    day: 1,
    minutes: 480,
    cash: 160,
    prospectorHired: true,
    prospectorDay: 1,
    prospectsUsedToday: 0,
    unlockedClaimZones: 1,
    pavedDepth: 1,
  };

  const reservedTile = { x: 44, y: 121 };
  const reserved = createEngineHarness({
    ...common,
    player: reservedTile,
    selected: { type: "cleared", ...reservedTile },
    location: "cleared",
    cleared: ["44,121"],
    roadTiles: [],
  }, engineSource);
  assert.equal(reserved.element("pinebarrow-visible-menu-demo").dataset.resourceRoadOverlaps, "0");
  assert.equal(reserved.element("pb7-prospect").disabled, true);

  const customRoadTile = { x: 47, y: 121 };
  const custom = createEngineHarness({
    ...common,
    player: customRoadTile,
    selected: { type: "cleared", ...customRoadTile },
    location: "cleared",
    cleared: ["47,121"],
    roadTiles: ["47,121"],
  }, engineSource);
  assert.equal(custom.element("pinebarrow-visible-menu-demo").dataset.resourceRoadOverlaps, "0");
  assert.equal(custom.element("pb7-prospect").disabled, true);
});

test("the HUD removes the road-tile counter while retaining the readable truck gauge", async () => {
  const pageSource = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const styleSource = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.doesNotMatch(pageSource, /id="pb7-road"/);
  assert.doesNotMatch(pageSource, /id="pb7-road-progress"/);
  assert.match(pageSource, /id="pb7-truck-status"/);
  assert.match(styleSource, /background:\s*linear-gradient\(145deg, #17274f 0%, #22506a 100%\)/);
  assert.match(styleSource, /\.truck-stat\[data-status="blocked"\]/);
});

test("Town Hall approves and builds a turning two-wide road with purchased stone", async () => {
  const engineSource = await readFile(new URL("../public/pinebarrow-engine.js", import.meta.url), "utf8");
  const roadDraft = ["46,122", "46,123", "47,123"];
  const cleared = ["46,122", "47,122", "46,123", "47,123", "46,124", "47,124"];
  const game = createEngineHarness({
    version: 12,
    worldLayoutVersion: 2,
    day: 1,
    minutes: 480,
    cash: 5000,
    cargo: { stone: 2 },
    player: { x: 45, y: 146 },
    location: "townhall",
    selected: { type: "road", x: 45, y: 146 },
    cleared,
    pavedDepth: 3,
    roadDraft,
    roadPlanning: true,
    roadTiles: [],
  }, engineSource);

  assert.equal(game.element("pb7-road-submit").hidden, false);
  assert.equal(game.element("pb7-road-submit").disabled, false);
  game.element("pb7-road-submit").click();
  const approved = game.saved();
  assert.ok(approved.roadApproval);
  assert.equal(approved.roadApproval.routeTiles.length, 6);
  assert.equal(approved.roadApproval.stonePrice, 58);
  assert.equal(approved.cargo.stone, 2);

  game.element("pb7-road-accept").click();
  const built = game.saved();
  assert.equal(built.roadContractsCompleted, 1);
  assert.equal(built.roadTiles.length, 6);
  assert.ok(built.roadMarketImpact.strength > 0);
  assert.equal(built.cargo.stone, 2);
  assert.ok(built.cash < 5000);
  assert.match(built.contextText, /purchased .* t of stone/i);
  assert.equal(game.element("pinebarrow-visible-menu-demo").dataset.resourceRoadOverlaps, "0");
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
  assert.equal(game.element("pinebarrow-visible-menu-demo").dataset.townFutureLots, "3");
});

test("the large town uses connected streets and twelve enclosed blocks", async () => {
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
    townBusinesses: {},
  }, engineSource);

  const root = game.element("pinebarrow-visible-menu-demo");
  assert.equal(root.dataset.townMainStreetLanes, "4");
  assert.equal(root.dataset.townSideStreetLanes, "2");
  assert.equal(root.dataset.townBlockCount, "12");
  assert.equal(root.dataset.townLayoutConflicts, "0");
  assert.equal(root.dataset.townPerimeterStreets, "2");
  assert.equal(root.dataset.townStreetDeadEnds, "0");
  assert.equal(root.dataset.townBlockEnclosureConflicts, "0");
  assert.equal(root.dataset.townFrontageConflicts, "0");
  assert.equal(root.dataset.townFutureLots, "4");
});

test("an older save inside a relocated town building moves safely to its entrance", async () => {
  const engineSource = await readFile(new URL("../public/pinebarrow-engine.js", import.meta.url), "utf8");
  const game = createEngineHarness({
    version: 8,
    day: 1,
    minutes: 480,
    cash: 160,
    player: { x: 35, y: 132 },
    selected: { type: "road", x: 35, y: 132 },
    location: "road",
    cleared: [],
    townBusinesses: {},
  }, engineSource);

  game.element("pb7-save-now").click();
  const saved = game.saved();
  assert.deepEqual(saved.player, { x: 37, y: 141 });
  assert.deepEqual(saved.selected, { type: "road", x: 37, y: 141 });
  assert.equal(saved.location, "road");
});

test("an older save at a town service follows that building to its aligned frontage", async () => {
  const engineSource = await readFile(new URL("../public/pinebarrow-engine.js", import.meta.url), "utf8");
  const game = createEngineHarness({
    version: 8,
    day: 1,
    minutes: 480,
    cash: 160,
    player: { x: 15, y: 142 },
    selected: { type: "building", x: 3, y: 130, buildingId: "market" },
    location: "market",
    cleared: [],
    townBusinesses: {},
  }, engineSource);

  game.element("pb7-save-now").click();
  const saved = game.saved();
  assert.deepEqual(saved.player, { x: 8, y: 141 });
  assert.deepEqual(saved.selected, { type: "building", x: 5, y: 132, buildingId: "market" });
  assert.equal(saved.location, "market");
});


test("Town Hall routes a residential proposal through builder and procurement records", async () => {
  const engineSource = await readFile(new URL("../public/pinebarrow-engine.js", import.meta.url), "utf8");
  const game = createEngineHarness({
    version: 12,
    day: 2,
    minutes: 480,
    cash: 1000,
    player: { x: 37, y: 141 },
    selected: { type: "building", id: "townhall", x: 37, y: 141 },
    location: "townhall",
    cleared: [],
    proposals: [{
      id: "proposal-house-1",
      type: "residential",
      use: "workforce-housing",
      lot: { x: 17, y: 130, w: 2, h: 2, blockId: "town-block-2" },
      footprint: { w: 2, h: 2 },
      cost: 280,
      status: "draft",
      owner: null,
      stage: "unstarted",
    }],
    townBusinesses: {},
  }, engineSource);

  const details = game.element("pb7-location-details");
  assert.match(details.innerHTML, /Approve site/);
  details.emit("click", { target: { closest: () => ({ dataset: { projectAction: "approve", proposalId: "proposal-house-1" } }) } });

  let saved = game.saved();
  assert.equal(saved.version, 14);
  assert.equal(saved.proposals[0].status, "approved");
  assert.equal(saved.proposals[0].stage, "coming-soon");
  assert.equal(saved.constructionProjects.length, 0);

  details.emit("click", { target: { closest: () => ({ dataset: { projectAction: "create-project", proposalId: "proposal-house-1" } }) } });
  saved = game.saved();
  assert.equal(saved.constructionProjects.length, 1);
  assert.equal(saved.constructionProjects[0].status, "awaiting-builder");
  assert.equal(saved.constructionProjects[0].buildingId, "worker-house");
  assert.equal(saved.constructionBids.length, 3);
  assert.equal(saved.procurementContracts.length, 4);
  assert.equal(saved.procurementContracts.filter((contract) => contract.category === "mine-supply").length, 2);
  assert.equal(saved.procurementContracts.filter((contract) => contract.category === "logistics").length, 1);
  assert.equal(saved.procurementContracts.filter((contract) => contract.category === "hauling").length, 1);

  details.emit("click", { target: { closest: () => ({ dataset: { projectAction: "award-builder", bidId: saved.constructionBids[0].id } }) } });
  saved = game.saved();
  assert.equal(saved.constructionProjects[0].status, "procurement");
  assert.equal(saved.constructionBids.filter((bid) => bid.status === "awarded").length, 1);
  assert.equal(saved.constructionBids.filter((bid) => bid.status === "rejected").length, 2);

  details.emit("click", { target: { closest: () => ({ dataset: { projectAction: "bid-procurement", procurementId: saved.procurementContracts[0].id } }) } });
  saved = game.saved();
  assert.equal(saved.procurementContracts[0].status, "awarded");
  assert.equal(saved.procurementContracts[0].providerId, "player-company");

  const reloaded = createEngineHarness(saved, engineSource).saved();
  assert.equal(reloaded.version, 14);
  assert.deepEqual(reloaded.constructionProjects, saved.constructionProjects);
  assert.deepEqual(reloaded.constructionBids, saved.constructionBids);
  assert.deepEqual(reloaded.procurementContracts, saved.procurementContracts);
});

test("shared construction settles inventory, labor, and a workforce house", async () => {
  const engineSource = await readFile(new URL("../public/pinebarrow-engine.js", import.meta.url), "utf8");
  const projectId = "project-settlement-1";
  const proposalId = "proposal-settlement-1";
  const game = createEngineHarness({
    version: 14,
    worldLayoutVersion: 2,
    day: 1,
    minutes: 480,
    cash: 5000,
    cargo: { logs: 2, stone: 1 },
    player: { x: 45, y: 145 },
    selected: { type: "road", x: 45, y: 145 },
    location: "road",
    proposals: [{
      id: proposalId,
      type: "residential",
      use: "workforce-housing",
      buildingId: "worker-house",
      lot: { x: 17, y: 130, w: 2, h: 2, blockId: "town-block-2" },
      footprint: { w: 2, h: 2 },
      cost: 280,
      status: "under-construction",
      owner: "player",
      stage: "fenced",
      projectId,
    }],
    constructionProjects: [{
      id: projectId,
      proposalId,
      buildingId: "worker-house",
      ownerId: "player",
      route: "town-hall",
      siteKind: "town",
      x: 17,
      y: 130,
      w: 2,
      h: 2,
      doorX: 18,
      doorY: 129,
      status: "ready-to-build",
      requirements: { logs: 2, stone: 1 },
      delivered: {},
      laborRequired: 1,
      laborDelivered: 0,
      buildProgress: 0,
      builderId: "pinebarrow-builders",
      builderDurationMultiplier: 0.1,
      builderCost: 0,
      cost: 280,
      housingCapacity: 1,
      procurementContractIds: ["proc-logs", "proc-stone", "proc-logistics", "proc-hauling"],
      deadlineDay: 20,
    }],
    constructionBids: [{
      id: "builder-awarded",
      projectId,
      builderId: "pinebarrow-builders",
      builderLabel: "Pinebarrow Builders",
      price: 0,
      durationDays: 1,
      status: "awarded",
    }],
    procurementContracts: [
      { id: "proc-logs", projectId, category: "mine-supply", material: "logs", quantity: 2, delivered: 0, providerId: "player-company", status: "awarded", createdDay: 1, deadlineDay: 20 },
      { id: "proc-stone", projectId, category: "mine-supply", material: "stone", quantity: 1, delivered: 0, providerId: "player-company", status: "awarded", createdDay: 1, deadlineDay: 20 },
      { id: "proc-logistics", projectId, category: "logistics", service: "warehouse-staging", quantity: 1, delivered: 0, providerId: "player-company", status: "awarded", createdDay: 1, deadlineDay: 20 },
      { id: "proc-hauling", projectId, category: "hauling", service: "site-delivery", quantity: 1, delivered: 0, providerId: "player-company", status: "awarded", createdDay: 1, deadlineDay: 20 },
    ],
  }, engineSource);

  for (let tick = 1; tick <= 90; tick += 1) game.frame(tick * 1000);
  game.element("pb7-save-now").click();
  const saved = game.saved();
  const project = saved.constructionProjects.find((record) => record.id === projectId);
  assert.equal(project.status, "completed");
  assert.equal(project.buildProgress, 1);
  assert.equal(saved.cargo.logs, 0);
  assert.equal(saved.cargo.stone, 0);
  assert.equal(saved.developedBuildings.length, 1);
  assert.equal(saved.developedBuildings[0].buildingId, "worker-house");
  assert.equal(saved.residents.length, 1);
  assert.equal(saved.residents[0].status, "candidate");
  assert.ok(saved.cash < 5000);
});

test("new mine construction opens a shared project instead of spending cash directly", async () => {
  const engineSource = await readFile(new URL("../public/pinebarrow-engine.js", import.meta.url), "utf8");
  const parcel = { id: "claim-project-1", x: 76, y: 122, w: 2, h: 2, status: "leased", material: "quartz", ratio: 0.55, depth: 60, leaseCredit: 45 };
  const cleared = [];
  for (let y = parcel.y; y < parcel.y + 2; y += 1) {
    for (let x = parcel.x; x < parcel.x + 2; x += 1) cleared.push(`${x},${y}`);
  }
  const game = createEngineHarness({
    version: 14,
    worldLayoutVersion: 2,
    day: 9,
    minutes: 480,
    cash: 2000,
    player: { x: 78, y: 122 },
    selected: { type: "mine-site", x: parcel.x, y: parcel.y },
    location: "mine-site",
    cleared,
    mineParcels: [parcel],
    warehouseParcels: [],
    mines: [],
    warehouses: [],
    selectedMineParcelId: parcel.id,
  }, engineSource);

  assert.equal(game.saved().cash, 2000);
  assert.equal(game.saved().location, "mine-site");
  assert.equal(game.element("pb7-build-mine").hidden, false);
  assert.equal(game.element("pb7-build-mine").disabled, false);
  game.element("pb7-build-mine").click();
  const saved = game.saved();
  assert.equal(saved.mines.length, 0);
  assert.equal(saved.cash, 2000);
  assert.equal(saved.constructionProjects.length, 1);
  assert.equal(saved.constructionProjects[0].siteKind, "mine");
  assert.equal(saved.mineParcels[0].constructionProjectId, saved.constructionProjects[0].id);

  const hall = createEngineHarness({ ...saved, player: { x: 37, y: 141 }, selected: { type: "building", id: "townhall", x: 37, y: 141 }, location: "townhall" }, engineSource);
  assert.match(hall.element("pb7-location-details").innerHTML, /Mine/);
  assert.match(hall.element("pb7-location-details").innerHTML, /Award bid/);
});

test("a completed project-backed mine stops without its assigned worker", async () => {
  const engineSource = await readFile(new URL("../public/pinebarrow-engine.js", import.meta.url), "utf8");
  const parcel = { id: "claim-staff-1", x: 76, y: 122, w: 2, h: 2, status: "owned", material: "stone", ratio: 0.35, depth: 1, leaseCredit: 420, mineId: "mine-staff-1" };
  const mine = {
    id: "mine-staff-1", parcelId: parcel.id, constructionProjectId: "project-mine-staff", x: parcel.x, y: parcel.y, w: 2, h: 2,
    level: 1, baseMaterial: "stone", material: "stone", depth: 1, ratio: 0.35, stockMaterial: 0, stockDirt: 0, doorX: 78, doorY: 122,
  };
  const baseSave = {
    version: 14,
    worldLayoutVersion: 2,
    day: 1,
    minutes: 480,
    cash: 1000,
    player: { x: 78, y: 122 },
    selected: { type: "mine", x: mine.x, y: mine.y },
    location: "mine",
    mineParcels: [parcel],
    mines: [mine],
    constructionProjects: [{ id: "project-mine-staff", buildingId: "mine", siteKind: "mine", status: "completed", x: 76, y: 122, w: 2, h: 2, laborRequired: 1, laborDelivered: 1, buildProgress: 1, requirements: {}, delivered: {}, procurementContractIds: [], completedDay: 1, buildingRecordId: mine.id }],
    selectedMineId: mine.id,
    selectedMineParcelId: parcel.id,
  };
  const idle = createEngineHarness(baseSave, engineSource);
  idle.frame(3000);
  idle.element("pb7-save-now").click();
  assert.equal(idle.saved().mines[0].stockMaterial, 0);
  assert.equal(idle.saved().mines[0].lastProductionStatus, "no-worker");

  const staffed = createEngineHarness({
    ...baseSave,
    residents: [{ id: "resident-staff-1", houseId: "building-house-1", name: "Ada Pine", status: "worker", workforceId: "workforce-1" }],
    workforce: [{ id: "workforce-1", residentId: "resident-staff-1", status: "assigned", jobType: "mine", jobId: mine.id, createdDay: 1 }],
  }, engineSource);
  staffed.frame(3000);
  staffed.element("pb7-save-now").click();
  assert.ok(staffed.saved().mines[0].stockMaterial > 0);
  assert.equal(staffed.saved().workforce[0].jobId, mine.id);
});

test("Town Hall hires a housed resident and assigns one worker to one mine", async () => {
  const engineSource = await readFile(new URL("../public/pinebarrow-engine.js", import.meta.url), "utf8");
  const game = createEngineHarness({
    version: 14,
    worldLayoutVersion: 2,
    day: 4,
    minutes: 480,
    cash: 1000,
    player: { x: 37, y: 141 },
    selected: { type: "building", id: "townhall", x: 37, y: 141 },
    location: "townhall",
    developedBuildings: [{
      id: "building-house-1",
      projectId: "project-house-1",
      buildingId: "worker-house",
      type: "residential",
      ownerId: "player",
      status: "completed",
      x: 17,
      y: 130,
      w: 2,
      h: 2,
      doorX: 18,
      doorY: 129,
      residentIds: ["resident-house-1"],
      workerIds: [],
      workerSlots: 0,
      rentPerDay: 0,
      salePrice: 322,
      completedDay: 3,
    }],
    residents: [{
      id: "resident-house-1",
      houseId: "building-house-1",
      name: "Ada Pine",
      status: "candidate",
      createdDay: 3,
    }],
    mines: [{
      id: "mine-workforce-1",
      parcelId: "claim-workforce-1",
      constructionProjectId: "project-mine-workforce-1",
      x: 76,
      y: 122,
      w: 2,
      h: 2,
      level: 1,
      baseMaterial: "stone",
      material: "stone",
      depth: 1,
      ratio: 0.35,
      stockMaterial: 0,
      stockDirt: 0,
      doorX: 78,
      doorY: 122,
    }],
  }, engineSource);
  const details = game.element("pb7-location-details");
  assert.match(details.innerHTML, /Hire for \$175/);
  const clickAction = (dataset) => details.emit("click", {
    target: {
      closest(selector) {
        return selector === "[data-workforce-action]" ? { dataset } : null;
      },
    },
  });
  clickAction({ workforceAction: "hire-resident", residentId: "resident-house-1" });
  let saved = game.saved();
  assert.equal(saved.residents[0].status, "worker");
  assert.equal(saved.workforce.length, 1);
  assert.equal(saved.workforce[0].status, "available");
  assert.equal(saved.cash, 825);

  clickAction({ workforceAction: "assign", workerId: saved.workforce[0].id, jobType: "mine", jobId: "mine-workforce-1" });
  saved = game.saved();
  assert.equal(saved.workforce[0].status, "assigned");
  assert.equal(saved.workforce[0].jobId, "mine-workforce-1");
  assert.equal(saved.workers, 1);
});

test("completed town shops collect rent and remain recoverable after sale", async () => {
  const engineSource = await readFile(new URL("../public/pinebarrow-engine.js", import.meta.url), "utf8");
  const game = createEngineHarness({
    version: 14,
    worldLayoutVersion: 2,
    day: 1,
    minutes: 1438,
    cash: 100,
    player: { x: 37, y: 141 },
    selected: { type: "building", id: "townhall", x: 37, y: 141 },
    location: "development",
    developmentId: "building-shop-1",
    developedBuildings: [{
      id: "building-shop-1",
      projectId: "project-shop-1",
      buildingId: "town-shop",
      type: "commercial",
      ownerId: "player",
      status: "completed",
      x: 49,
      y: 150,
      w: 2,
      h: 2,
      doorX: 50,
      doorY: 149,
      residentIds: [],
      workerIds: [],
      workerSlots: 1,
      rentPerDay: 35,
      salePrice: 50,
      completedDay: 1,
    }],
  }, engineSource);
  const details = game.element("pb7-location-details");
  assert.match(details.innerHTML, /Lease shop/);
  const clickAction = (dataset) => details.emit("click", {
    target: {
      closest(selector) {
        return selector === "[data-property-action]" ? { dataset } : null;
      },
    },
  });
  clickAction({ propertyAction: "lease", buildingId: "building-shop-1" });
  game.frame(1000);
  game.frame(2000);
  game.element("pb7-save-now").click();
  let saved = game.saved();
  assert.equal(saved.developedBuildings[0].tenantId, "tenant-building-shop-1");
  assert.equal(saved.cash, 135);

  clickAction({ propertyAction: "sell", buildingId: "building-shop-1" });
  saved = game.saved();
  assert.equal(saved.developedBuildings[0].ownerId, "town");
  assert.equal(saved.developedBuildings[0].forSale, true);
  assert.equal(saved.cash, 185);

  clickAction({ propertyAction: "buy-back", buildingId: "building-shop-1" });
  saved = game.saved();
  assert.equal(saved.developedBuildings[0].ownerId, "player");
  assert.equal(saved.developedBuildings[0].forSale, false);
  assert.equal(saved.cash, 135);
});

test("Crowe uses the same construction record and contract stages", async () => {
  const engineSource = await readFile(new URL("../public/pinebarrow-engine.js", import.meta.url), "utf8");
  const game = createEngineHarness({
    version: 14,
    worldLayoutVersion: 2,
    day: 3,
    minutes: 480,
    cash: 1000,
    player: { x: 45, y: 145 },
    selected: { type: "road", x: 45, y: 145 },
    location: "road",
  }, engineSource);
  game.frame(1000);
  game.frame(2000);
  game.element("pb7-save-now").click();
  const saved = game.saved();
  const project = saved.constructionProjects.find((record) => record.buildingId === "crowe-workshop");
  assert.ok(project);
  assert.equal(project.ownerId, "crowe");
  assert.equal(project.route, "crowe");
  assert.equal(project.status, "ready-to-build");
  assert.ok(saved.procurementContracts.filter((contract) => contract.projectId === project.id).every((contract) => contract.status === "awarded" || contract.status === "fulfilled"));
});

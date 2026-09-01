    (function () {
      const root = document.getElementById("pinebarrow-visible-menu-demo");
      if (!root || root.dataset.engineLoaded === "true") return;
      root.dataset.engineLoaded = "true";

      const canvas = root.querySelector("#pb7-map");
      const ctx = canvas.getContext("2d");
      const WORLD_WIDTH = 90;
      const CLAIM_DEPTH = 125;
      const TOWN_HEIGHT = 42;
      const WORLD_HEIGHT = CLAIM_DEPTH * 2 + TOWN_HEIGHT;
      const TOWN_LEFT = 0;
      const TOWN_RIGHT = WORLD_WIDTH;
      const TOWN_TOP = 125;
      const TOWN_BOTTOM = TOWN_TOP + TOWN_HEIGHT;
      const SOUTH_TOP = TOWN_BOTTOM;
      const PLAYER_LANE = 2;
      const PLAYER_LEFT = PLAYER_LANE * 30;
      const PLAYER_RIGHT = PLAYER_LEFT + 30;
      const PLAYER_ROAD_X = PLAYER_LEFT + 14;
      const STARTER_TREE = { x: PLAYER_ROAD_X + 2, y: SOUTH_TOP + 2 };
      const CLAIM_SECTION_DEPTHS = [0, 42, 84];
      const CLAIM_SECTION_ENDS = [41, 83, CLAIM_DEPTH - 1];
      const MAIN_STREET_TOP = 142;
      const MAIN_STREET_BOTTOM = 146;
      const TOWN_SIDE_STREET_WIDTH = 2;
      const TOWN_SIDE_STREET_XS = [1, 14, 29, 44, 59, 74, 87];
      const TOWN_PERIMETER_STREET_YS = [TOWN_TOP, TOWN_BOTTOM - TOWN_SIDE_STREET_WIDTH];
      const TOWN_BLOCK_COLUMNS = [
        { x: 4, w: 9 }, { x: 17, w: 11 }, { x: 32, w: 11 },
        { x: 47, w: 11 }, { x: 62, w: 11 }, { x: 77, w: 9 }
      ];
      const TOWN_BLOCK_ROWS = [{ y: 128, h: 13 }, { y: 147, h: 17 }];
      const TOWN_BLOCKS = [];
      TOWN_BLOCK_ROWS.forEach(function (row) {
        TOWN_BLOCK_COLUMNS.forEach(function (column) {
          TOWN_BLOCKS.push({ x: column.x, y: row.y, w: column.w, h: row.h });
        });
      });

      const CONFIG = {
        truckCapacity: 6,
        maxTruckLevel: 8,
        truckCapacityByLevel: { 1: 6, 2: 7.5, 3: 9, 4: 11, 5: 13.5, 6: 16.5, 7: 20, 8: 24 },
        truckSizeUpgradeCosts: { 1: 220, 2: 340, 3: 500, 4: 720, 5: 980, 6: 1320, 7: 1750 },
        truckSpeedUpgradeCosts: { 1: 180, 2: 280, 3: 420, 4: 600, 5: 840, 6: 1140, 7: 1520 },
        truckSpeedMultipliers: { 1: 1, 2: .95, 3: .9, 4: .85, 5: .8, 6: .74, 7: .67, 8: .6 },
        truckScaleByLevel: { 1: 1, 2: 1.025, 3: 1.05, 4: 1.075, 5: 1.105, 6: 1.135, 7: 1.165, 8: 1.2 },
        prospectorCost: 60,
        prospectsPerDay: 2,
        maxWorkers: 4,
        workerCosts: { 0: 175, 1: 300, 2: 480, 3: 720 },
        workerOutputMultiplierByCount: { 0: 1, 1: 1.5, 2: 2, 3: 2.25, 4: 2.5 },
        mineBuildCost: 140,
        landLeasePerDay: 45,
        landPurchasePrice: 420,
        warehouseLandPrice: 220,
        warehouseBuildCost: 260,
        sawPurchaseCost: 90,
        sawRentalCost: 18,
        shakerCost: 350,
        maxMineLevel: 8,
        mineUpgradeCosts: { 1: 260, 2: 390, 3: 560, 4: 780, 5: 1060, 6: 1420, 7: 1880 },
        mineOutputByLevel: { 1: 1, 2: 1.18, 3: 1.38, 4: 1.6, 5: 1.82, 6: 2.02, 7: 2.22, 8: 2.4 },
        mineStorageByLevel: { 1: 6, 2: 7.5, 3: 9, 4: 11, 5: 13.5, 6: 16.5, 7: 20, 8: 24 },
        maxWarehouseLevel: 8,
        warehouseUpgradeCosts: { 1: 220, 2: 340, 3: 500, 4: 720, 5: 980, 6: 1320, 7: 1760 },
        warehouseCapacityByLevel: { 1: 8, 2: 11, 3: 14, 4: 18, 5: 23, 6: 29, 7: 36, 8: 45 },
        haulers: {
          xs: { label: "XS", capacity: 3, cost: 70, travelMinutes: 75, scale: .74 },
          s: { label: "S", capacity: 8, cost: 165, travelMinutes: 95, scale: .84 },
          m: { label: "M", capacity: 14, cost: 275, travelMinutes: 120, scale: .96 },
          l: { label: "L", capacity: 22, cost: 420, travelMinutes: 150, scale: 1.08 }
        },
        maxActiveHaulsPerMine: 1,
        maxMineSlots: 5,
        mineSlotUnlockDays: [1, 9, 18, 27, 35],
        mineTickMilliseconds: 2800,
        clockTickMilliseconds: 1000,
        gameMinutesPerClockTick: 5,
        roadTilesPerStoneTon: 3,
        roadLaborPerTile: 9,
        roadMinimumSurveyPoints: 2,
        exchangeTickMinutes: 30,
        exchangeListingFee: 4,
        maxExchangeOrders: 8,
        maxCompanyContracts: 4,
        pavedMoveMilliseconds: 260,
        townMoveMilliseconds: 310,
        trailMoveMilliseconds: 520,
        controllerPollMilliseconds: 50,
        controllerDeadzone: .48,
        controllerTriggerThreshold: .3,
        claimGateCosts: [0, 750, 3000]
      };

      const buildings = [
        { id: "townhall", label: "Town Hall", x: 33, y: 130, w: 9, h: 9, doorX: 37, doorY: 141 },
        { id: "market", label: "Market", x: 5, y: 132, w: 7, h: 7, doorX: 8, doorY: 141 },
        { id: "garage", label: "Garage", x: 64, y: 131, w: 7, h: 8, doorX: 67, doorY: 141 },
        { id: "newsstand", label: "News", x: 20, y: 150, w: 5, h: 5, doorX: 22, doorY: 146 },
        { id: "rental", label: "Rental Shop", x: 49, y: 150, w: 7, h: 7, doorX: 52, doorY: 146 }
      ];

      const businessLots = [
        { id: "foundry", label: "Pinebarrow Foundry", material: "coal", x: 5, y: 150, w: 7, h: 9, doorX: 8, doorY: 146, sign: "FOUNDRY" },
        { id: "railworks", label: "Rail Works", material: "iron", x: 19, y: 132, w: 7, h: 7, doorX: 22, doorY: 141, sign: "RAIL" },
        { id: "glassworks", label: "Glassworks", material: "quartz", x: 49, y: 132, w: 7, h: 7, doorX: 52, doorY: 141, sign: "GLASS" },
        { id: "cannery", label: "Main Street Cannery", material: "tin", x: 78, y: 150, w: 7, h: 9, doorX: 81, doorY: 146, sign: "CANNERY" }
      ];

      const basePrices = Object.freeze({
        logs: 18,
        stone: 52,
        clay: 22,
        coal: 35,
        iron: 48,
        copper: 72,
        tin: 64,
        quartz: 58,
        silver: 120,
        gold: 220,
        sapphire: 280
      });
      const prices = Object.assign({}, basePrices);
      const dailyNewsCycles = [
        { tag: "Road Desk", material: "stone", change: .12, headline: "Town road crews raise their stone order" },
        { tag: "Timber Wire", material: "logs", change: .09, headline: "Fresh storefront orders lift local timber bids" },
        { tag: "Foundry Bell", material: "coal", change: .11, headline: "Pinebarrow foundry relights its second furnace" },
        { tag: "County Wire", material: "copper", change: .14, headline: "New telegraph contract sends copper higher" },
        { tag: "Rail Report", material: "iron", change: .1, headline: "Rail repair crews compete for iron deliveries" },
        { tag: "Crowe Watch", material: "clay", change: -.09, headline: "Crowe Disposal expands its free dirt route" },
        { tag: "Cannery Bell", material: "tin", change: .1, headline: "Main Street cannery opens a new tin contract" },
        { tag: "Glassworks", material: "quartz", change: .12, headline: "Glassworks posts a rush order for clear quartz" },
        { tag: "Metal Desk", material: "silver", change: -.08, headline: "Silver buyers pause after a crowded market day" },
        { tag: "Town Ledger", material: "gold", change: .15, headline: "Riverbank rumors bring gold buyers to town" },
        { tag: "Gem Wire", material: "sapphire", change: .16, headline: "Golden City jeweler seeks Pinebarrow sapphires" },
        { tag: "Deed Watch", material: "stone", change: -.07, headline: "Old prospector quietly adds two town deeds" },
        { tag: "Main Street", material: "logs", change: .07, headline: "Shop owners unite behind a rebuilding drive" }
      ];
      const marketSymbols = {
        logs: "LOG", stone: "STN", clay: "CLY", coal: "COL", iron: "FE",
        copper: "CU", tin: "SN", quartz: "QTZ", silver: "AG", gold: "AU", sapphire: "SAP"
      };
      const businessNewsByMaterial = {
        logs: { name: "Pinebarrow Timber & Joinery", story: "A new storefront contract is taking clean logs for framing, counters, and signs." },
        stone: { name: "County Road & Masonry", story: "Road crews and masons have combined their orders for the next paving section." },
        clay: { name: "Crowe Fill & Disposal", story: "Free tailings pickup has flooded the clay supply and pushed legitimate buyers back." },
        coal: { name: "Pinebarrow Foundry", story: "The second furnace is lit, and the foundry needs steady coal deliveries." },
        iron: { name: "Pinebarrow Rail Works", story: "Repair crews opened a yard for rails, bridge bolts, and heavy machine parts." },
        copper: { name: "County Telegraph Company", story: "A new wire route is buying refined copper-bearing loads from local mines." },
        tin: { name: "Main Street Cannery", story: "The cannery is contracting tin for food containers and weatherproof shop roofs." },
        quartz: { name: "Pinebarrow Glassworks", story: "The glassworks posted a rush order for clear quartz from deeper claims." },
        silver: { name: "Silversmith Cooperative", story: "Merchants paused a crowded silver order while their new workshop is fitted out." },
        gold: { name: "Pinebarrow Gold Exchange", story: "Riverbank rumors brought outside buyers and a temporary gold premium to town." },
        sapphire: { name: "Golden City Jewel House", story: "A jeweler across the river is paying a premium for deep-forest sapphires." }
      };
      const materialNames = {
        logs: "Logs",
        stone: "Stone",
        clay: "Clay",
        coal: "Coal",
        iron: "Iron",
        copper: "Copper",
        tin: "Tin",
        quartz: "Quartz",
        silver: "Silver",
        gold: "Gold",
        sapphire: "Sapphire"
      };
      const mineDepthBands = [
        { min: 0, max: 24, materials: ["stone", "clay", "coal"] },
        { min: 25, max: 59, materials: ["coal", "iron", "copper", "tin"] },
        { min: 60, max: 94, materials: ["iron", "copper", "tin", "quartz", "silver"] },
        { min: 95, max: 124, materials: ["quartz", "silver", "gold", "sapphire"] }
      ];
      const cargoKeys = ["logs", "dirt", "stone", "clay", "coal", "iron", "copper", "tin", "quartz", "silver", "gold", "sapphire"];
      const directionByKeyCode = {
        ArrowUp: { x: 0, y: -1 },
        KeyW: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        KeyS: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        KeyA: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
        KeyD: { x: 1, y: 0 }
      };

      function createInitialState() {
        return {
          started: false,
          player: { x: 45, y: 145 },
          path: [],
          pendingArrival: null,
          location: null,
          menuOpen: false,
          selected: null,
          overview: false,
          zoomIndex: 0,
          cash: 160,
          capacity: CONFIG.truckCapacity,
          truckSizeLevel: 1,
          truckSpeedLevel: 1,
          soundEnabled: true,
          musicEnabled: true,
          engineSoundEnabled: true,
          effectsSoundEnabled: true,
          cargo: emptyMaterialStore(),
          prospectorHired: false,
          prospectorDay: 0,
          prospectsUsedToday: 0,
          workers: 0,
          sawAttached: false,
          sawOwnership: null,
          sawRentalDay: 0,
          shaker: false,
          pavedDepth: 3,
          roadTiles: new Set(),
          roadDraft: [],
          roadPlanning: false,
          roadApproval: null,
          roadMarketImpact: null,
          roadContractsCompleted: 0,
          unlockedClaimZones: 1,
          cleared: new Set(),
          surveyParcel: null,
          mineParcel: null,
          warehouseParcel: null,
          mine: null,
          warehouse: null,
          mineParcels: [],
          warehouseParcels: [],
          mines: [],
          warehouses: [],
          nextSiteId: 1,
          selectedMineId: null,
          selectedWarehouseId: null,
          selectedMineParcelId: null,
          selectedWarehouseParcelId: null,
          hauls: [],
          exchangeOrders: [],
          nextExchangeOrderId: 1,
          lastExchangeProcessAt: 0,
          companyContracts: [],
          nextCompanyContractId: 1,
          townBusinesses: {},
          wasteToCrowe: 0,
          day: 1,
          minutes: 8 * 60,
          contextTitle: "Pinebarrow guide",
          contextText: "Explore the open first section, clear clustered trees, and earn enough to unlock the deeper stone gates.",
          contextTone: "neutral",
          lastStepAt: 0,
          lastMineTickAt: 0,
          lastClockTickAt: 0
        };
      }

      const state = createInitialState();

      const el = {
        land: root.querySelector("#pb7-land"),
        cash: root.querySelector("#pb7-cash"),
        truck: root.querySelector("#pb7-truck"),
        truckModel: root.querySelector("#pb7-truck-model"),
        truckPanel: root.querySelector("#pb7-truck-stat"),
        truckStatus: root.querySelector("#pb7-truck-status"),
        company: root.querySelector("#pb7-company"),
        time: root.querySelector("#pb7-time"),
        destination: root.querySelector("#pb7-destination"),
        go: root.querySelector("#pb7-go"),
        zoomIn: root.querySelector("#pb7-zoom-in"),
        zoomOut: root.querySelector("#pb7-zoom-out"),
        overview: root.querySelector("#pb7-overview"),
        music: root.querySelector("#pb7-music"),
        engineSound: root.querySelector("#pb7-engine-sound"),
        effects: root.querySelector("#pb7-effects"),
        profiles: root.querySelector("#pb7-profiles"),
        landscape: root.querySelector("#pb7-landscape"),
        fullscreenLaunch: root.querySelector("#pb7-play-fullscreen"),
        mapTip: root.querySelector("#pb7-map-tip"),
        fastTravelToggle: root.querySelector("#pb7-fast-travel-toggle"),
        fastTravelMenu: root.querySelector("#pb7-fast-travel-menu"),
        dailyNews: root.querySelector("#pb7-daily-news"),
        newsDay: root.querySelector("#pb7-news-day"),
        newsHeadline: root.querySelector("#pb7-news-headline"),
        newsMarket: root.querySelector("#pb7-news-market"),
        newsReader: root.querySelector("#pb7-newspaper-reader"),
        newsReaderClose: root.querySelector("#pb7-newspaper-close"),
        newsReaderEdition: root.querySelector("#pb7-newspaper-edition"),
        newsReaderTag: root.querySelector("#pb7-newspaper-tag"),
        newsReaderHeadline: root.querySelector("#pb7-newspaper-headline"),
        newsReaderDeck: root.querySelector("#pb7-newspaper-deck"),
        newsReaderPrices: root.querySelector("#pb7-newspaper-prices"),
        newsBusinessName: root.querySelector("#pb7-business-name"),
        newsBusinessStory: root.querySelector("#pb7-business-story"),
        newsBusinessOrder: root.querySelector("#pb7-business-order"),
        newsCroweTitle: root.querySelector("#pb7-crowe-title"),
        newsCroweStory: root.querySelector("#pb7-crowe-story"),
        newsCroweWaste: root.querySelector("#pb7-crowe-waste"),
        resourceGuide: root.querySelector("#pb7-resource-guide"),
        unstuck: root.querySelector("#pb7-unstuck"),
        contextTitle: root.querySelector("#pb7-context-title"),
        context: root.querySelector("#pb7-context"),
        buildingPanel: root.querySelector("#pb7-building-panel"),
        buildingPanelTitle: root.querySelector("#pb7-building-panel-title"),
        noActions: root.querySelector("#pb7-no-actions"),
        actionHint: root.querySelector("#pb7-action-hint"),
        menuLayer: root.querySelector("#pb7-menu-layer"),
        menuScrim: root.querySelector("#pb7-menu-scrim"),
        menuClose: root.querySelector("#pb7-menu-close"),
        menuToggle: root.querySelector("#pb7-menu-toggle"),
        systemMenu: root.querySelector("#pb7-system-menu"),
        systemClose: root.querySelector("#pb7-system-close"),
        locationKicker: root.querySelector("#pb7-location-kicker"),
        locationDetails: root.querySelector("#pb7-location-details"),
        touchDirections: Array.from(root.querySelectorAll("[data-drive-direction]")),
        touchInteract: root.querySelector("#pb7-touch-interact"),
        saveStatus: root.querySelector("#pb7-save-status"),
        saveNow: root.querySelector("#pb7-save-now"),
        actions: root.querySelector("#pb7-actions"),
        hire: root.querySelector("#pb7-hire"),
        hireWorker: root.querySelector("#pb7-hire-worker"),
        buySaw: root.querySelector("#pb7-buy-saw"),
        rentSaw: root.querySelector("#pb7-rent-saw"),
        shaker: root.querySelector("#pb7-shaker"),
        upgradeTruckSize: root.querySelector("#pb7-upgrade-truck-size"),
        upgradeTruckSpeed: root.querySelector("#pb7-upgrade-truck-speed"),
        marketplace: root.querySelector("#pb7-marketplace"),
        contracts: root.querySelector("#pb7-contracts"),
        roadPlan: root.querySelector("#pb7-road-plan"),
        roadSubmit: root.querySelector("#pb7-road-submit"),
        roadAccept: root.querySelector("#pb7-road-accept"),
        roadCancel: root.querySelector("#pb7-road-cancel"),
        unlockGate: root.querySelector("#pb7-unlock-gate"),
        readNews: root.querySelector("#pb7-read-news"),
        clear: root.querySelector("#pb7-clear"),
        prospect: root.querySelector("#pb7-prospect"),
        lease: root.querySelector("#pb7-lease"),
        buyLand: root.querySelector("#pb7-buy-land"),
        buyWarehouseLand: root.querySelector("#pb7-buy-warehouse-land"),
        buildMine: root.querySelector("#pb7-build-mine"),
        loadMine: root.querySelector("#pb7-load-mine"),
        upgradeMine: root.querySelector("#pb7-upgrade-mine"),
        buildWarehouse: root.querySelector("#pb7-build-warehouse"),
        unloadWarehouse: root.querySelector("#pb7-unload-warehouse"),
        loadWarehouse: root.querySelector("#pb7-load-warehouse"),
        upgradeWarehouse: root.querySelector("#pb7-upgrade-warehouse"),
        haulers: Array.from(root.querySelectorAll("[data-hauler-size]")),
        startLayer: root.querySelector("#pb7-start-layer"),
        profileSync: root.querySelector("#pb7-profile-sync"),
        profileSlots: Array.from(root.querySelectorAll("[data-profile-slot]")),
        profileNameInput: root.querySelector("#pb7-profile-name-input"),
        profileMessage: root.querySelector("#pb7-profile-message"),
        profilePlay: root.querySelector("#pb7-profile-play"),
        profileRestart: root.querySelector("#pb7-profile-restart"),
        profileDelete: root.querySelector("#pb7-profile-delete"),
        startMusic: root.querySelector("#pb7-start-music"),
        startEngine: root.querySelector("#pb7-start-engine"),
        startEffects: root.querySelector("#pb7-start-effects"),
        marketScreen: root.querySelector("#pb7-market-screen"),
        marketClose: root.querySelector("#pb7-market-close"),
        marketTabExchange: root.querySelector("#pb7-market-tab-exchange"),
        marketTabContracts: root.querySelector("#pb7-market-tab-contracts"),
        exchangePanel: root.querySelector("#pb7-exchange-panel"),
        contractPanel: root.querySelector("#pb7-contract-panel"),
        exchangeBoard: root.querySelector("#pb7-exchange-board"),
        exchangeMaterial: root.querySelector("#pb7-exchange-material"),
        exchangeQuantity: root.querySelector("#pb7-exchange-quantity"),
        exchangePrice: root.querySelector("#pb7-exchange-price"),
        exchangeOffer: root.querySelector("#pb7-exchange-offer"),
        exchangeHint: root.querySelector("#pb7-exchange-hint"),
        exchangeOrders: root.querySelector("#pb7-exchange-orders"),
        contractBoard: root.querySelector("#pb7-contract-board")
      };

      let viewport = { width: 0, height: 0, dpr: 1 };
      let drawView = { scale: 14, originX: 0, originY: 0, offsetX: 0, offsetY: 0 };
      const visualPlayer = { x: state.player.x, y: state.player.y, heading: 0, targetHeading: 0 };
      let movementSegment = null;
      let lastAnimationAt = 0;
      const SAVE_KEY = "pinebarrow-land-company-save-v1";
      const DEVICE_KEY = "pinebarrow-land-company-device-v1";
      const PROFILE_CACHE_PREFIX = "pinebarrow-land-company-profile-v1-";
      const PROFILE_COUNT = 3;
      let lastSavedAt = 0;
      let saveUnavailable = false;
      let activeProfileSlot = null;
      let activeProfileName = "";
      let selectedProfileSlot = 1;
      let profileRestartArmed = false;
      let profileDeleteArmed = false;
      let profileSyncTimer = null;
      let deviceId = "";
      const profileRecords = new Map();
      let audioContext = null;
      let audioMaster = null;
      let engineOscillator = null;
      let engineGain = null;
      let engineHarmonic = null;
      let engineHarmonicGain = null;
      let musicTimer = null;
      let musicStep = 0;
      const heldDriveKeys = new Set();
      let lastGamepadPollAt = 0;
      let activeGamepadIndex = null;
      let gamepadButtonStates = [];
      let gamepadDriveDirection = null;
      let gamepadDriveKey = "";
      let gamepadNavigationKey = "";
      let inputMode = "pointer";
      let systemMenuOpen = false;
      let fastTravelOpen = false;
      let newsReaderOpen = false;
      let marketScreenOpen = false;
      let marketScreenTab = "exchange";
      let touchDriveDirection = null;
      let touchDrivePointerId = null;
      const truckSprite = new Image();
      let truckSpriteReady = false;
      truckSprite.decoding = "async";
      truckSprite.addEventListener("load", function () { truckSpriteReady = true; });
      truckSprite.src = "/pinebarrow-truck-topdown.png";

      function emptyMaterialStore() {
        return Object.fromEntries(cargoKeys.map(function (key) { return [key, 0]; }));
      }

      function syncVisualPlayer() {
        movementSegment = null;
        visualPlayer.x = state.player.x;
        visualPlayer.y = state.player.y;
      }

      function setTruckHeading(fromX, fromY, toX, toY) {
        const deltaX = toX - fromX;
        const deltaY = toY - fromY;
        if (deltaX || deltaY) visualPlayer.targetHeading = Math.atan2(deltaY, deltaX);
      }

      function shortestAngle(from, to) {
        let delta = (to - from + Math.PI) % (Math.PI * 2) - Math.PI;
        if (delta < -Math.PI) delta += Math.PI * 2;
        return delta;
      }

      function updateVisualPlayer(timestamp) {
        const elapsed = lastAnimationAt ? Math.min(64, Math.max(0, timestamp - lastAnimationAt)) : 16;
        lastAnimationAt = timestamp;
        if (!movementSegment) {
          const positionBlend = 1 - Math.exp(-elapsed / 118);
          visualPlayer.x += (state.player.x - visualPlayer.x) * positionBlend;
          visualPlayer.y += (state.player.y - visualPlayer.y) * positionBlend;
          if (Math.abs(state.player.x - visualPlayer.x) < .002) visualPlayer.x = state.player.x;
          if (Math.abs(state.player.y - visualPlayer.y) < .002) visualPlayer.y = state.player.y;
        }
        const angleDelta = shortestAngle(visualPlayer.heading, visualPlayer.targetHeading);
        const maxTurn = elapsed * .0064;
        visualPlayer.heading += Math.abs(angleDelta) <= maxTurn ? angleDelta : Math.sign(angleDelta) * maxTurn;
      }

      function isEditableTarget(target) {
        if (!target || typeof target !== "object") return false;
        const tagName = typeof target.tagName === "string" ? target.tagName.toLowerCase() : "";
        return tagName === "input" || tagName === "textarea" || tagName === "select" || Boolean(target.isContentEditable);
      }

      function setInputMode(mode) {
        if (inputMode === mode) return;
        inputMode = mode;
        root.dataset.inputMode = mode;
        if (!el.mapTip) return;
        if (mode === "controller") el.mapTip.textContent = "Controller connected · RT drive · X cut · Y menu";
        else if (mode === "keyboard") el.mapTip.textContent = "Keyboard drive · E menu · Space cut";
        else el.mapTip.textContent = "Tap map · Arrows / WASD · Controller ready";
      }

      function directionKey(direction) {
        return direction ? direction.x + "," + direction.y : "";
      }

      function oppositeDirection(direction) {
        return direction ? { x: -direction.x, y: -direction.y } : null;
      }

      function directionFromHeading(reverse) {
        const quarterTurn = Math.round(visualPlayer.targetHeading / (Math.PI / 2));
        const normalized = ((quarterTurn % 4) + 4) % 4;
        const directions = [
          { x: 1, y: 0 },
          { x: 0, y: 1 },
          { x: -1, y: 0 },
          { x: 0, y: -1 }
        ];
        return reverse ? oppositeDirection(directions[normalized]) : directions[normalized];
      }

      function pointBesideParcel(x, y, parcel) {
        if (!parcel || inRect(x, y, parcel)) return false;
        return parcelCells(parcel).some(function (cell) {
          return Math.abs(x - cell.x) + Math.abs(y - cell.y) === 1;
        });
      }

      function manualArrivalFor(x, y) {
        const activeBusinesses = businessLots.filter(function (business) {
          const record = state.townBusinesses[business.id];
          return record && (record.status === "announced" || record.status === "open");
        });
        const building = buildings.concat(activeBusinesses).find(function (item) { return item.doorX === x && item.doorY === y; });
        if (building) return { type: "building", buildingId: building.id };
        const mine = state.mines.find(function (item) {
          const door = structureDoor(item);
          return door.x === x && door.y === y;
        });
        if (mine) return { type: "mine", mineId: mine.id };
        const warehouse = state.warehouses.find(function (item) {
          const door = structureDoor(item);
          return door.x === x && door.y === y;
        });
        if (warehouse) return { type: "warehouse", warehouseId: warehouse.id };
        const mineSite = state.mineParcels.find(function (parcel) {
          return !parcel.mineId && pointBesideParcel(x, y, parcel);
        });
        if (mineSite) return { type: "mine-site", parcelId: mineSite.id };
        const warehouseSite = state.warehouseParcels.find(function (parcel) {
          return parcel.status === "owned" && !parcel.warehouseId && pointBesideParcel(x, y, parcel);
        });
        if (warehouseSite) return { type: "warehouse-site", parcelId: warehouseSite.id };
        return isSurveyableGround(x, y) ? { type: "cleared", x: x, y: y } : { type: "road", x: x, y: y };
      }

      function beginManualDrive() {
        if (!state.started || state.menuOpen || systemMenuOpen) return;
        if (state.path.length || movementSegment) settleMovementForReroute();
        state.path = [];
        state.pendingArrival = null;
        state.location = null;
        setFollowView();
      }

      function requestManualStep(direction) {
        if (!direction || !state.started || state.menuOpen || systemMenuOpen || state.path.length || movementSegment) return false;
        const targetX = state.player.x + direction.x;
        const targetY = state.player.y + direction.y;
        setTruckHeading(state.player.x, state.player.y, targetX, targetY);
        if (isPassable(targetX, targetY)) {
          state.path = [{ x: targetX, y: targetY }];
          state.pendingArrival = {
            type: "manual-step",
            x: targetX,
            y: targetY,
            destination: manualArrivalFor(targetX, targetY)
          };
          state.location = null;
          return true;
        }
        const targetGate = claimGateAt(targetX, targetY);
        if (targetGate && isActivePlayerGate(targetGate) && !isClaimGateOpen(targetGate)) {
          state.selected = { type: "gate", x: targetGate.x, y: targetGate.y, gateIndex: targetGate.sectionIndex };
          state.location = "gate";
          state.menuOpen = true;
          setContext("Section " + targetGate.sectionNumber + " gate", "This stone gate opens the next extraction field for $" + targetGate.cost + ". Choose Unlock to pay, or close the gate menu and keep exploring.");
          return false;
        }
        if (isTreeAt(targetX, targetY)) {
          const alreadyFacingTree = state.selected && state.selected.type === "tree" && state.selected.x === targetX && state.selected.y === targetY;
          state.selected = { type: "tree", x: targetX, y: targetY };
          state.location = "tree";
          if (!alreadyFacingTree) {
            setContext("Tree in front", state.sawAttached
              ? "Press Space on the keyboard or X on the controller to cut this tree."
              : "A saw is required. Buy one at the Garage or rent one at the Rental Shop.");
          }
          return false;
        }
        if (buildingAt(targetX, targetY) || isStructureCell(targetX, targetY)) {
          if (state.contextTitle !== "Entrance required") setContext("Entrance required", "Drive to the marked entrance beside the building.");
          return false;
        }
        if (state.contextTitle !== "Claim boundary") setContext("Claim boundary", "That direction leaves your accessible road and P4 claim.");
        return false;
      }

      function finishManualStep(arrival) {
        const destination = arrival && arrival.destination ? arrival.destination : { type: "road", x: state.player.x, y: state.player.y };
        if (["building", "mine", "warehouse", "mine-site", "warehouse-site"].includes(destination.type)) {
          state.pendingArrival = destination;
          finishArrival();
          return;
        }
        state.location = destination.type === "cleared" ? "cleared" : "road";
        state.selected = destination.type === "cleared"
          ? { type: "cleared", x: state.player.x, y: state.player.y }
          : { type: "road", x: state.player.x, y: state.player.y };
        state.contextTitle = destination.type === "cleared" ? "Cleared ground" : "Manual drive";
        state.contextText = destination.type === "cleared"
          ? clearedTileText(state.player.x, state.player.y)
          : "Use arrows or WASD to keep driving. On a controller, steer with the left stick and hold RT to move forward.";
        state.contextTone = "neutral";
        renderInterface();
      }

      function keyboardDriveDirection() {
        const held = Array.from(heldDriveKeys);
        return held.length ? directionByKeyCode[held[held.length - 1]] : null;
      }

      function processContinuousDrive() {
        if (!state.started || state.menuOpen || systemMenuOpen || state.path.length || movementSegment) return;
        requestManualStep(keyboardDriveDirection() || gamepadDriveDirection || touchDriveDirection);
      }

      function attemptCutFromInput() {
        if (!state.started || state.menuOpen || systemMenuOpen) return;
        let target = state.selected && state.selected.type === "tree" && isNextToSelected() ? state.selected : null;
        if (!target) {
          const direction = directionFromHeading(false);
          const x = state.player.x + direction.x;
          const y = state.player.y + direction.y;
          if (isTreeAt(x, y)) {
            target = { type: "tree", x: x, y: y };
            state.selected = target;
            state.location = "tree";
          }
        }
        if (!target) {
          setContext("No tree in reach", "Face an adjacent tree, then press Space or controller X.");
          return;
        }
        clearSelectedTree();
      }

      function visibleMenuActions() {
        if (marketScreenOpen) {
          const fixed = marketScreenTab === "exchange"
            ? [el.marketTabExchange, el.marketTabContracts, el.exchangeOffer, el.marketClose]
            : [el.marketTabExchange, el.marketTabContracts, el.marketClose];
          const dynamic = el.marketScreen && typeof el.marketScreen.querySelectorAll === "function"
            ? Array.from(el.marketScreen.querySelectorAll("button:not([disabled])"))
            : [];
          return Array.from(new Set(fixed.concat(dynamic))).filter(function (button) { return button && !button.hidden && !button.disabled; });
        }
        return Array.from(el.actions.querySelectorAll("button")).filter(function (button) {
          return !button.hidden && !button.disabled;
        });
      }

      function focusMenuAction(step) {
        if (newsReaderOpen) {
          if (el.newsReaderClose) el.newsReaderClose.focus({ preventScroll: true });
          return;
        }
        const buttons = visibleMenuActions();
        if (!buttons.length) {
          el.menuClose.focus({ preventScroll: true });
          return;
        }
        const activeElement = typeof document !== "undefined" ? document.activeElement : null;
        const currentIndex = buttons.indexOf(activeElement);
        const nextIndex = currentIndex < 0 ? 0 : (currentIndex + step + buttons.length) % buttons.length;
        buttons[nextIndex].focus({ preventScroll: true });
      }

      function activateMenuAction() {
        if (newsReaderOpen) {
          if (el.newsReaderClose) el.newsReaderClose.click();
          return;
        }
        const buttons = visibleMenuActions();
        const activeElement = typeof document !== "undefined" ? document.activeElement : null;
        if (buttons.includes(activeElement) && typeof activeElement.click === "function") activeElement.click();
        else focusMenuAction(1);
      }

      function visibleSystemActions() {
        return [el.saveNow, el.profiles, el.music, el.engineSound, el.effects, el.landscape].filter(function (button) {
          return button && !button.hidden && !button.disabled;
        });
      }

      function focusSystemAction(step) {
        const buttons = visibleSystemActions();
        if (!buttons.length) return;
        const activeElement = typeof document !== "undefined" ? document.activeElement : null;
        const currentIndex = buttons.indexOf(activeElement);
        const nextIndex = currentIndex < 0 ? 0 : (currentIndex + step + buttons.length) % buttons.length;
        buttons[nextIndex].focus({ preventScroll: true });
      }

      function activateSystemAction() {
        const buttons = visibleSystemActions();
        const activeElement = typeof document !== "undefined" ? document.activeElement : null;
        if (buttons.includes(activeElement) && typeof activeElement.click === "function") activeElement.click();
        else focusSystemAction(1);
      }

      function closeFastTravel() {
        fastTravelOpen = false;
        if (el.fastTravelMenu) el.fastTravelMenu.hidden = true;
        if (el.fastTravelToggle) el.fastTravelToggle.setAttribute("aria-expanded", "false");
      }

      function toggleFastTravel() {
        if (!state.started) return;
        fastTravelOpen = !fastTravelOpen;
        if (fastTravelOpen) {
          systemMenuOpen = false;
          state.menuOpen = false;
          newsReaderOpen = false;
          marketScreenOpen = false;
        }
        renderInterface();
        if (fastTravelOpen && el.destination) el.destination.focus({ preventScroll: true });
      }

      function closeSystemMenu() {
        if (!systemMenuOpen) return;
        systemMenuOpen = false;
        renderInterface();
        if (el.menuToggle) el.menuToggle.focus({ preventScroll: true });
      }

      function openSystemMenuFromInput() {
        if (!state.started || systemMenuOpen) return;
        settleMovementForReroute();
        state.path = [];
        state.pendingArrival = null;
        state.menuOpen = false;
        newsReaderOpen = false;
        marketScreenOpen = false;
        closeFastTravel();
        systemMenuOpen = true;
        renderInterface();
        requestAnimationFrame(function () { focusSystemAction(1); });
      }

      function openContextMenuFromInput() {
        if (!state.started || state.menuOpen) return;
        settleMovementForReroute();
        systemMenuOpen = false;
        closeFastTravel();
        newsReaderOpen = false;
        marketScreenOpen = false;
        state.menuOpen = true;
        state.path = [];
        state.pendingArrival = null;
        renderInterface();
        requestAnimationFrame(function () { focusMenuAction(1); });
      }

      function toggleMenuFromInput() {
        if (!state.started) return;
        if (systemMenuOpen) closeSystemMenu();
        else openSystemMenuFromInput();
      }

      function locationSupportsContextMenu() {
        return ["market", "townhall", "garage", "rental", "newsstand", "mine", "warehouse", "cleared", "gate", "mine-site", "warehouse-site"].includes(state.location);
      }

      function interactFromInput() {
        if (!state.started || systemMenuOpen) return;
        if (state.selected && state.selected.type === "tree" && isNextToSelected()) {
          attemptCutFromInput();
          return;
        }
        if (locationSupportsContextMenu()) {
          openContextMenuFromInput();
          return;
        }
        setContext("Nothing to interact with", "Drive to a building entrance, claim gate, mine, warehouse, construction edge, or open survey ground.");
      }

      function zoomInFromInput() {
        setFollowView();
        state.zoomIndex = Math.min(2, state.zoomIndex + 1);
        setContext("Close truck view", "The camera is centered closer to the truck. Individual trees and 2×2 building footprints are easier to select.");
      }

      function zoomOutFromInput() {
        setFollowView();
        state.zoomIndex = Math.max(0, state.zoomIndex - 1);
        setContext("Wider follow view", "The camera still follows the truck while showing more nearby land.");
      }

      function toggleOverviewFromInput() {
        state.overview = !state.overview;
        renderInterface();
      }

      function gamepadButtonValue(gamepad, index) {
        const button = gamepad && gamepad.buttons ? gamepad.buttons[index] : null;
        return button ? Math.max(Number(button.value) || 0, button.pressed ? 1 : 0) : 0;
      }

      function cardinalDirection(x, y) {
        if (Math.abs(x) < CONFIG.controllerDeadzone && Math.abs(y) < CONFIG.controllerDeadzone) return null;
        return Math.abs(x) >= Math.abs(y)
          ? { x: x < 0 ? -1 : 1, y: 0 }
          : { x: 0, y: y < 0 ? -1 : 1 };
      }

      function gamepadDirectionalInput(gamepad) {
        if (gamepadButtonValue(gamepad, 12) > .5) return { x: 0, y: -1 };
        if (gamepadButtonValue(gamepad, 13) > .5) return { x: 0, y: 1 };
        if (gamepadButtonValue(gamepad, 14) > .5) return { x: -1, y: 0 };
        if (gamepadButtonValue(gamepad, 15) > .5) return { x: 1, y: 0 };
        return cardinalDirection(Number(gamepad.axes && gamepad.axes[0]) || 0, Number(gamepad.axes && gamepad.axes[1]) || 0);
      }

      function cycleProfileFromInput(step) {
        const nextSlot = ((selectedProfileSlot - 1 + step + PROFILE_COUNT) % PROFILE_COUNT) + 1;
        selectProfile(nextSlot);
        const button = el.profileSlots.find(function (item) { return Number(item.dataset.profileSlot) === nextSlot; });
        if (button) button.focus({ preventScroll: true });
      }

      function handleGamepadNavigation(direction) {
        if (!direction) return;
        const step = direction.x < 0 || direction.y < 0 ? -1 : 1;
        if (!state.started) cycleProfileFromInput(step);
        else if (systemMenuOpen) focusSystemAction(step);
        else if (state.menuOpen) focusMenuAction(step);
      }

      function handleGamepadButton(index) {
        if (!state.started) {
          if ((index === 0 || index === 9) && !el.profilePlay.disabled) beginSelectedProfile(false);
          else if (index === 3 && el.startMusic) el.startMusic.click();
          return;
        }
        if (index === 1) {
          if (systemMenuOpen) closeSystemMenu();
          else if (state.menuOpen) closeMenu();
          else if (fastTravelOpen) closeFastTravel();
          return;
        }
        if (index === 2) {
          attemptCutFromInput();
          return;
        }
        if (index === 3 || index === 9) {
          toggleMenuFromInput();
          return;
        }
        if (index === 0) {
          if (systemMenuOpen) activateSystemAction();
          else if (state.menuOpen) activateMenuAction();
          else interactFromInput();
          return;
        }
        if (index === 4) zoomOutFromInput();
        else if (index === 5) zoomInFromInput();
        else if (index === 8) toggleOverviewFromInput();
      }

      function pollGamepad(timestamp) {
        if (timestamp - lastGamepadPollAt < CONFIG.controllerPollMilliseconds) return;
        lastGamepadPollAt = timestamp;
        if (typeof navigator === "undefined" || typeof navigator.getGamepads !== "function") return;
        let gamepads;
        try { gamepads = Array.from(navigator.getGamepads() || []); } catch { return; }
        let gamepad = activeGamepadIndex === null ? null : gamepads[activeGamepadIndex];
        if (!gamepad) gamepad = gamepads.find(Boolean) || null;
        if (!gamepad) {
          activeGamepadIndex = null;
          gamepadDriveDirection = null;
          gamepadDriveKey = "";
          gamepadNavigationKey = "";
          gamepadButtonStates = [];
          if (inputMode === "controller") setInputMode(heldDriveKeys.size ? "keyboard" : "pointer");
          return;
        }
        activeGamepadIndex = gamepad.index;
        setInputMode("controller");

        for (let index = 0; index < gamepad.buttons.length; index += 1) {
          const pressed = gamepadButtonValue(gamepad, index) > .5;
          if (pressed && !gamepadButtonStates[index] && index !== 6 && index !== 7 && (index < 12 || index > 15)) {
            handleGamepadButton(index);
          }
          gamepadButtonStates[index] = pressed;
        }

        const directionalInput = gamepadDirectionalInput(gamepad);
        if (!state.started || state.menuOpen || systemMenuOpen) {
          gamepadDriveDirection = null;
          gamepadDriveKey = "";
          const navigationKey = directionKey(directionalInput);
          if (navigationKey && navigationKey !== gamepadNavigationKey) handleGamepadNavigation(directionalInput);
          gamepadNavigationKey = navigationKey;
          return;
        }

        gamepadNavigationKey = "";
        const dpadDirection = gamepadButtonValue(gamepad, 12) > .5 ? { x: 0, y: -1 }
          : gamepadButtonValue(gamepad, 13) > .5 ? { x: 0, y: 1 }
            : gamepadButtonValue(gamepad, 14) > .5 ? { x: -1, y: 0 }
              : gamepadButtonValue(gamepad, 15) > .5 ? { x: 1, y: 0 }
                : null;
        const stickDirection = cardinalDirection(Number(gamepad.axes && gamepad.axes[0]) || 0, Number(gamepad.axes && gamepad.axes[1]) || 0);
        if (stickDirection) setTruckHeading(0, 0, stickDirection.x, stickDirection.y);
        const forward = gamepadButtonValue(gamepad, 7) >= CONFIG.controllerTriggerThreshold;
        const reverse = gamepadButtonValue(gamepad, 6) >= CONFIG.controllerTriggerThreshold;
        const nextDriveDirection = dpadDirection || (forward ? (stickDirection || directionFromHeading(false)) : reverse ? directionFromHeading(true) : null);
        const nextDriveKey = directionKey(nextDriveDirection);
        if (nextDriveKey && nextDriveKey !== gamepadDriveKey) beginManualDrive();
        gamepadDriveDirection = nextDriveDirection;
        gamepadDriveKey = nextDriveKey;
      }

      function handleKeyboardDown(event) {
        if (isEditableTarget(event.target)) return;
        const code = event.code || event.key;
        if (!state.started) {
          if (["ArrowLeft", "ArrowUp"].includes(code)) {
            event.preventDefault();
            cycleProfileFromInput(-1);
          } else if (["ArrowRight", "ArrowDown"].includes(code)) {
            event.preventDefault();
            cycleProfileFromInput(1);
          } else if ((code === "Enter" || code === "Space") && !el.profilePlay.disabled) {
            event.preventDefault();
            beginSelectedProfile(false);
          }
          return;
        }
        if (code === "Escape") {
          if (systemMenuOpen) {
            event.preventDefault();
            closeSystemMenu();
          } else if (state.menuOpen) {
            event.preventDefault();
            closeMenu();
          } else if (fastTravelOpen) {
            event.preventDefault();
            closeFastTravel();
          }
          return;
        }
        if (code === "KeyE") {
          event.preventDefault();
          if (!event.repeat) toggleMenuFromInput();
          return;
        }
        if (systemMenuOpen) {
          if (code === "ArrowUp" || code === "ArrowDown") {
            event.preventDefault();
            if (!event.repeat) focusSystemAction(code === "ArrowUp" ? -1 : 1);
          } else if (code === "Enter" || code === "Space") {
            event.preventDefault();
            if (!event.repeat) activateSystemAction();
          } else if (directionByKeyCode[code]) {
            event.preventDefault();
          }
          return;
        }
        if (state.menuOpen || systemMenuOpen) {
          if (code === "ArrowUp" || code === "ArrowDown") {
            event.preventDefault();
            if (!event.repeat) focusMenuAction(code === "ArrowUp" ? -1 : 1);
          } else if (code === "Enter" || code === "Space") {
            event.preventDefault();
            if (!event.repeat) activateMenuAction();
          } else if (directionByKeyCode[code]) {
            event.preventDefault();
          }
          return;
        }
        if (directionByKeyCode[code]) {
          event.preventDefault();
          setInputMode("keyboard");
          if (!heldDriveKeys.has(code)) {
            beginManualDrive();
            heldDriveKeys.add(code);
          }
          return;
        }
        if (code === "Space") {
          event.preventDefault();
          if (!event.repeat) attemptCutFromInput();
        }
      }

      function handleKeyboardUp(event) {
        const code = event.code || event.key;
        if (directionByKeyCode[code]) heldDriveKeys.delete(code);
      }

      function ensureAudio() {
        state.soundEnabled = state.musicEnabled || state.engineSoundEnabled || state.effectsSoundEnabled;
        if (!state.soundEnabled) return false;
        const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextConstructor) return false;
        if (!audioContext) {
          audioContext = new AudioContextConstructor();
          audioMaster = audioContext.createGain();
          audioMaster.gain.value = .28;
          audioMaster.connect(audioContext.destination);
          engineGain = audioContext.createGain();
          engineGain.gain.value = .0001;
          engineGain.connect(audioMaster);
          engineOscillator = audioContext.createOscillator();
          engineOscillator.type = "triangle";
          engineOscillator.frequency.value = 48;
          engineOscillator.connect(engineGain);
          engineOscillator.start();
          engineHarmonicGain = audioContext.createGain();
          engineHarmonicGain.gain.value = .0001;
          engineHarmonicGain.connect(audioMaster);
          engineHarmonic = audioContext.createOscillator();
          engineHarmonic.type = "sawtooth";
          engineHarmonic.frequency.value = 96;
          engineHarmonic.connect(engineHarmonicGain);
          engineHarmonic.start();
        }
        if (audioContext.state === "suspended") audioContext.resume().catch(function () {});
        if (audioMaster) audioMaster.gain.setTargetAtTime(.28, audioContext.currentTime, .03);
        if (state.started && state.musicEnabled) startMusic();
        return true;
      }

      function playMusicStep() {
        if (!audioContext || !audioMaster || !state.started || !state.musicEnabled) return;
        const melody = [220, 261.63, 329.63, 392, 329.63, 293.66, 246.94, 293.66, 369.99, 440, 369.99, 329.63, 220, 277.18, 329.63, 277.18];
        const bass = [110, 123.47, 98, 82.41];
        const now = audioContext.currentTime;
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = musicStep % 8 === 6 ? "sine" : "triangle";
        oscillator.frequency.setValueAtTime(melody[musicStep % melody.length], now);
        gain.gain.setValueAtTime(.0001, now);
        gain.gain.exponentialRampToValueAtTime(.021, now + .025);
        gain.gain.exponentialRampToValueAtTime(.0001, now + .34);
        oscillator.connect(gain);
        gain.connect(audioMaster);
        oscillator.start(now);
        oscillator.stop(now + .36);
        if (musicStep % 4 === 0) {
          const bassOscillator = audioContext.createOscillator();
          const bassGain = audioContext.createGain();
          bassOscillator.type = "sine";
          bassOscillator.frequency.setValueAtTime(bass[Math.floor(musicStep / 4) % bass.length], now);
          bassGain.gain.setValueAtTime(.0001, now);
          bassGain.gain.exponentialRampToValueAtTime(.016, now + .03);
          bassGain.gain.exponentialRampToValueAtTime(.0001, now + .68);
          bassOscillator.connect(bassGain);
          bassGain.connect(audioMaster);
          bassOscillator.start(now);
          bassOscillator.stop(now + .7);
        }
        musicStep += 1;
      }

      function startMusic() {
        if (musicTimer || !state.started || !state.musicEnabled || !audioContext) return;
        playMusicStep();
        musicTimer = window.setInterval(playMusicStep, 410);
      }

      function stopMusic() {
        if (!musicTimer) return;
        window.clearInterval(musicTimer);
        musicTimer = null;
      }

      function playTone(frequency, duration, type, delay, volume) {
        if (!ensureAudio()) return;
        const startAt = audioContext.currentTime + (delay || 0);
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = type || "sine";
        oscillator.frequency.setValueAtTime(frequency, startAt);
        gain.gain.setValueAtTime(.0001, startAt);
        gain.gain.exponentialRampToValueAtTime(volume || .12, startAt + .018);
        gain.gain.exponentialRampToValueAtTime(.0001, startAt + duration);
        oscillator.connect(gain);
        gain.connect(audioMaster);
        oscillator.start(startAt);
        oscillator.stop(startAt + duration + .03);
      }

      function playSoundCue(cue) {
        if (!state.effectsSoundEnabled) return;
        if (cue === "success") {
          playTone(440, .13, "triangle", 0, .08);
          playTone(659, .18, "sine", .07, .09);
          playTone(880, .24, "sine", .14, .07);
        } else if (cue === "error") {
          playTone(174, .12, "square", 0, .045);
          playTone(130, .2, "triangle", .08, .055);
        } else if (cue === "saw") {
          if (!ensureAudio()) return;
          const startAt = audioContext.currentTime;
          const oscillator = audioContext.createOscillator();
          const gain = audioContext.createGain();
          oscillator.type = "sawtooth";
          oscillator.frequency.setValueAtTime(340, startAt);
          oscillator.frequency.exponentialRampToValueAtTime(105, startAt + .46);
          gain.gain.setValueAtTime(.0001, startAt);
          gain.gain.exponentialRampToValueAtTime(.075, startAt + .02);
          gain.gain.exponentialRampToValueAtTime(.0001, startAt + .47);
          oscillator.connect(gain);
          gain.connect(audioMaster);
          oscillator.start(startAt);
          oscillator.stop(startAt + .5);
          playTone(82, .42, "triangle", .02, .04);
        }
      }

      function updateEngineSound() {
        if (!audioContext || !engineGain || !engineOscillator) return;
        const gameplayActive = state.started && state.engineSoundEnabled && !state.menuOpen && !systemMenuOpen;
        const moving = gameplayActive && state.path.length > 0;
        const idling = gameplayActive && state.path.length === 0;
        const now = audioContext.currentTime;
        const anyAudio = state.musicEnabled || state.engineSoundEnabled || state.effectsSoundEnabled;
        if (audioMaster) audioMaster.gain.setTargetAtTime(anyAudio ? .28 : .0001, now, .04);
        engineGain.gain.setTargetAtTime(moving ? .042 : idling ? .009 : .0001, now, moving ? .11 : .18);
        engineOscillator.frequency.setTargetAtTime((moving ? 50 : 34) + state.truckSpeedLevel * 5, now, .12);
        if (engineHarmonic && engineHarmonicGain) {
          engineHarmonicGain.gain.setTargetAtTime(moving ? .008 : idling ? .002 : .0001, now, .16);
          engineHarmonic.frequency.setTargetAtTime((moving ? 104 : 72) + state.truckSpeedLevel * 8, now, .14);
        }
      }

      function allocateSiteId(prefix) {
        const id = prefix + "-" + state.nextSiteId;
        state.nextSiteId += 1;
        return id;
      }

      function normalizeSiteId(record, prefix) {
        if (!record || typeof record !== "object") return null;
        if (typeof record.id !== "string" || !record.id) record.id = allocateSiteId(prefix);
        return record;
      }

      function loadSavedState(saved) {
        if (!saved || ![1, 2, 3, 4, 5, 6, 7, 8].includes(saved.version)) return false;
        try {
          ["cash", "sawRentalDay", "pavedDepth", "unlockedClaimZones", "wasteToCrowe", "day", "minutes", "zoomIndex", "prospectorDay", "prospectsUsedToday", "workers", "truckSizeLevel", "truckSpeedLevel", "nextExchangeOrderId", "lastExchangeProcessAt", "nextCompanyContractId", "roadContractsCompleted"].forEach(function (key) {
            if (Number.isFinite(saved[key])) state[key] = saved[key];
          });
          ["prospectorHired", "sawAttached", "shaker", "overview", "soundEnabled", "musicEnabled", "engineSoundEnabled", "effectsSoundEnabled", "roadPlanning"].forEach(function (key) {
            if (typeof saved[key] === "boolean") state[key] = saved[key];
          });
          if (saved.version <= 7) {
            const legacyAudio = typeof saved.soundEnabled === "boolean" ? saved.soundEnabled : true;
            state.musicEnabled = legacyAudio;
            state.engineSoundEnabled = legacyAudio;
            state.effectsSoundEnabled = legacyAudio;
          }
          state.soundEnabled = state.musicEnabled || state.engineSoundEnabled || state.effectsSoundEnabled;
          if (saved.sawOwnership === "owned" || saved.sawOwnership === "rented" || saved.sawOwnership === null) {
            state.sawOwnership = saved.sawOwnership;
          }
          if (saved.player && Number.isFinite(saved.player.x) && Number.isFinite(saved.player.y)) {
            state.player = {
              x: Math.max(0, Math.min(WORLD_WIDTH - 1, Math.round(saved.player.x))),
              y: Math.max(0, Math.min(WORLD_HEIGHT - 1, Math.round(saved.player.y)))
            };
          }
          state.cargo = Object.assign(emptyMaterialStore(), saved.cargo || {});
          state.cleared = new Set(Array.isArray(saved.cleared) ? saved.cleared.filter(function (key) { return typeof key === "string"; }) : []);
          state.roadTiles = new Set(Array.isArray(saved.roadTiles) ? saved.roadTiles.filter(function (key) { return typeof key === "string"; }) : []);
          clearRoadSurfaceDecoration();
          state.roadDraft = Array.isArray(saved.roadDraft) ? saved.roadDraft.filter(function (key) { return typeof key === "string"; }) : [];
          state.roadApproval = saved.roadApproval && typeof saved.roadApproval === "object" ? saved.roadApproval : null;
          state.roadMarketImpact = saved.roadMarketImpact && typeof saved.roadMarketImpact === "object" ? saved.roadMarketImpact : null;
          state.nextSiteId = Math.max(1, Math.round(saved.nextSiteId || 1));
          state.mineParcels = Array.isArray(saved.mineParcels) ? saved.mineParcels.filter(Boolean) : [];
          state.warehouseParcels = Array.isArray(saved.warehouseParcels) ? saved.warehouseParcels.filter(Boolean) : [];
          state.mines = Array.isArray(saved.mines) ? saved.mines.filter(Boolean) : [];
          state.warehouses = Array.isArray(saved.warehouses) ? saved.warehouses.filter(Boolean) : [];
          state.surveyParcel = saved.surveyParcel || null;

          if (!state.mineParcels.length && saved.mineParcel && saved.mineParcel.status !== "surveyed") state.mineParcels.push(saved.mineParcel);
          if (!state.surveyParcel && saved.mineParcel && saved.mineParcel.status === "surveyed" && !saved.mine) state.surveyParcel = saved.mineParcel;
          if (!state.warehouseParcels.length && saved.warehouseParcel) state.warehouseParcels.push(saved.warehouseParcel);
          if (!state.mines.length && saved.mine) state.mines.push(saved.mine);
          if (!state.warehouses.length && saved.warehouse) state.warehouses.push(saved.warehouse);

          state.mineParcels.forEach(function (parcel) { normalizeSiteId(parcel, "claim"); });
          state.warehouseParcels.forEach(function (parcel) { normalizeSiteId(parcel, "warehouse-land"); });
          if (state.surveyParcel) normalizeSiteId(state.surveyParcel, "survey");
          state.mines.forEach(function (mine, index) {
            normalizeSiteId(mine, "mine");
            if (!mine.parcelId && state.mineParcels[index]) mine.parcelId = state.mineParcels[index].id;
            if (!Number.isFinite(mine.depth)) mine.depth = Math.max(0, mine.y - SOUTH_TOP);
            if (!mine.baseMaterial) mine.baseMaterial = mine.material || "stone";
            mine.material = mine.material || mine.baseMaterial;
            mine.stockMaterial = Math.max(0, Number(mine.stockMaterial) || 0);
            mine.stockDirt = Math.max(0, Number(mine.stockDirt) || 0);
          });
          state.warehouses.forEach(function (warehouse, index) {
            normalizeSiteId(warehouse, "warehouse");
            if (!warehouse.parcelId && state.warehouseParcels[index]) warehouse.parcelId = state.warehouseParcels[index].id;
            warehouse.storage = Object.assign(emptyMaterialStore(), warehouse.storage || {});
          });

          state.mineParcels.forEach(function (parcel, index) {
            if (!parcel.mineId && state.mines[index]) parcel.mineId = state.mines[index].id;
          });
          state.warehouseParcels.forEach(function (parcel, index) {
            if (!parcel.warehouseId && state.warehouses[index]) parcel.warehouseId = state.warehouses[index].id;
            if (!parcel.mineParcelId && state.mineParcels[index]) parcel.mineParcelId = state.mineParcels[index].id;
          });

          if (saved.version <= 3) {
            const truckSizeMigration = { 1: 1, 2: 3, 3: 5, 4: 7 };
            const truckSpeedMigration = { 1: 1, 2: 4, 3: 7, 4: 8 };
            const mineLevelMigration = { 1: 1, 2: 4, 3: 8 };
            const warehouseLevelMigration = { 1: 1, 2: 4, 3: 7 };
            state.truckSizeLevel = truckSizeMigration[state.truckSizeLevel] || state.truckSizeLevel;
            state.truckSpeedLevel = truckSpeedMigration[state.truckSpeedLevel] || state.truckSpeedLevel;
            state.mines.forEach(function (mine) { mine.level = mineLevelMigration[mine.level] || mine.level; });
            state.warehouses.forEach(function (warehouse) { warehouse.level = warehouseLevelMigration[warehouse.level] || warehouse.level; });
          }
          state.mines.forEach(function (mine) {
            mine.level = Math.max(1, Math.min(CONFIG.maxMineLevel, Math.round(mine.level || 1)));
            mine.material = mineMaterialForLevel(mine);
          });
          state.warehouses.forEach(function (warehouse) {
            warehouse.level = Math.max(1, Math.min(CONFIG.maxWarehouseLevel, Math.round(warehouse.level || 1)));
          });
          state.workers = Math.max(0, Math.min(CONFIG.maxWorkers, Math.round(state.workers || 0)));
          state.truckSizeLevel = Math.max(1, Math.min(CONFIG.maxTruckLevel, Math.round(state.truckSizeLevel || 1)));
          state.truckSpeedLevel = Math.max(1, Math.min(CONFIG.maxTruckLevel, Math.round(state.truckSpeedLevel || 1)));
          state.unlockedClaimZones = saved.version <= 6
            ? legacyUnlockedClaimZones()
            : Math.max(1, Math.min(3, Math.round(state.unlockedClaimZones || 1)));
          if (isPlayerClaimTile(state.player.x, state.player.y) && isTreeAt(state.player.x, state.player.y)) {
            state.cleared.add(keyFor(state.player.x, state.player.y));
          }
          state.day = Math.max(1, Math.round(state.day || 1));
          state.prospectorDay = Math.max(0, Math.round(state.prospectorDay || 0));
          state.prospectsUsedToday = Math.max(0, Math.min(CONFIG.prospectsPerDay, Math.round(state.prospectsUsedToday || 0)));
          state.capacity = CONFIG.truckCapacityByLevel[state.truckSizeLevel];
          state.hauls = Array.isArray(saved.hauls) ? saved.hauls.filter(function (haul) {
            return haul && CONFIG.haulers[haul.size] && Number.isFinite(haul.dispatchedAt) && Number.isFinite(haul.completeAt) &&
              Number.isFinite(haul.materialTons) && Number.isFinite(haul.dirtTons) && typeof haul.material === "string";
          }).slice(0, CONFIG.maxMineSlots) : [];
          state.exchangeOrders = Array.isArray(saved.exchangeOrders) ? saved.exchangeOrders.filter(function (order) {
            return order && typeof order.id === "string" && materialNames[order.material] && Number.isFinite(order.askPrice) && Number.isFinite(order.remaining) && Number.isFinite(order.originalQuantity);
          }).slice(0, CONFIG.maxExchangeOrders) : [];
          state.companyContracts = Array.isArray(saved.companyContracts) ? saved.companyContracts.filter(function (contract) {
            return contract && typeof contract.id === "string" && materialNames[contract.material] && Number.isFinite(contract.quantity) && Number.isFinite(contract.delivered) && typeof contract.mineId === "string";
          }).slice(0, CONFIG.maxCompanyContracts) : [];
          state.townBusinesses = saved.townBusinesses && typeof saved.townBusinesses === "object" ? saved.townBusinesses : {};
          processTownBusinessOpenings();
          if (saved.version <= 4 && !state.prospectorHired && (state.prospectsUsedToday > 0 || state.surveyParcel || state.mineParcels.length)) {
            state.prospectorHired = true;
          }
          if (saved.version === 1 && state.surveyParcel && !state.mines.length) {
            state.prospectorDay = state.day;
            state.prospectsUsedToday = 1;
            state.prospectorHired = true;
          }
          state.selected = saved.selected || null;
          state.location = typeof saved.location === "string" ? saved.location : null;
          state.contextTitle = typeof saved.contextTitle === "string" ? saved.contextTitle : state.contextTitle;
          state.contextText = typeof saved.contextText === "string" ? saved.contextText : state.contextText;
          if (saved.version <= 4 && state.prospectorHired) {
            state.prospectorDay = state.day;
            state.prospectsUsedToday = 0;
          }
          if (saved.version <= 4 && (state.prospectorHired || state.workers > 0)) {
            state.contextTitle = "Company roster restored";
            state.contextText = "Your permanent crew is restored. The prospector has a fresh two-survey quota today" + (state.workers > 0 ? ", and " + state.workers + " mine worker" + (state.workers === 1 ? " remains" : "s remain") + " assigned." : ".");
          }
          const hasSavedMineSelection = Object.prototype.hasOwnProperty.call(saved, "selectedMineId");
          const hasSavedWarehouseSelection = Object.prototype.hasOwnProperty.call(saved, "selectedWarehouseId");
          state.selectedMineId = typeof saved.selectedMineId === "string" ? saved.selectedMineId : null;
          state.selectedWarehouseId = typeof saved.selectedWarehouseId === "string" ? saved.selectedWarehouseId : null;
          state.selectedMineParcelId = typeof saved.selectedMineParcelId === "string" ? saved.selectedMineParcelId : null;
          state.selectedWarehouseParcelId = typeof saved.selectedWarehouseParcelId === "string" ? saved.selectedWarehouseParcelId : null;
          state.mineParcel = state.surveyParcel || state.mineParcels.find(function (parcel) { return parcel.id === state.selectedMineParcelId; }) || null;
          state.warehouseParcel = state.warehouseParcels.find(function (parcel) { return parcel.id === state.selectedWarehouseParcelId; }) || null;
          state.mine = state.mines.find(function (mine) { return mine.id === state.selectedMineId; }) || (!hasSavedMineSelection ? state.mines[0] : null) || null;
          state.warehouse = state.warehouses.find(function (warehouse) { return warehouse.id === state.selectedWarehouseId; }) || (!hasSavedWarehouseSelection ? state.warehouses[0] : null) || null;
          if (state.mine) state.selectedMineId = state.mine.id;
          if (state.warehouse) state.selectedWarehouseId = state.warehouse.id;
          state.mineParcel = state.mineParcel || parcelForMine(state.mine) || state.mineParcels[0] || null;
          state.warehouseParcel = state.warehouseParcel || parcelForWarehouse(state.warehouse) || warehouseParcelForMineParcel(state.mineParcel) || state.warehouseParcels[0] || null;
          state.selectedMineParcelId = state.mineParcel ? state.mineParcel.id : null;
          state.selectedWarehouseParcelId = state.warehouseParcel ? state.warehouseParcel.id : null;
          state.hauls.forEach(function (haul) { if (!haul.mineId && state.mine) haul.mineId = state.mine.id; });
          const haulingMineIds = new Set();
          state.hauls = state.hauls.filter(function (haul) {
            if (!haul.mineId || haulingMineIds.has(haul.mineId)) return false;
            haulingMineIds.add(haul.mineId);
            return true;
          });
          relocatePlayerFromTownBuilding();
          state.path = [];
          state.pendingArrival = null;
          state.menuOpen = false;
          systemMenuOpen = false;
          fastTravelOpen = false;
          marketScreenOpen = false;
          return true;
        } catch {
          return false;
        }
      }

      function serializedState() {
        return {
          version: 8,
          cash: state.cash,
          capacity: state.capacity,
          truckSizeLevel: state.truckSizeLevel,
          truckSpeedLevel: state.truckSpeedLevel,
          soundEnabled: state.soundEnabled,
          musicEnabled: state.musicEnabled,
          engineSoundEnabled: state.engineSoundEnabled,
          effectsSoundEnabled: state.effectsSoundEnabled,
          cargo: state.cargo,
          prospectorHired: state.prospectorHired,
          prospectorDay: state.prospectorDay,
          prospectsUsedToday: state.prospectsUsedToday,
          workers: state.workers,
          sawAttached: state.sawAttached,
          sawOwnership: state.sawOwnership,
          sawRentalDay: state.sawRentalDay,
          shaker: state.shaker,
          pavedDepth: state.pavedDepth,
          roadTiles: Array.from(state.roadTiles),
          roadDraft: state.roadDraft,
          roadPlanning: state.roadPlanning,
          roadApproval: state.roadApproval,
          roadMarketImpact: state.roadMarketImpact,
          roadContractsCompleted: state.roadContractsCompleted,
          unlockedClaimZones: state.unlockedClaimZones,
          cleared: Array.from(state.cleared),
          surveyParcel: state.surveyParcel,
          mineParcels: state.mineParcels,
          warehouseParcels: state.warehouseParcels,
          mines: state.mines,
          warehouses: state.warehouses,
          nextSiteId: state.nextSiteId,
          selectedMineId: state.mine ? state.mine.id : state.selectedMineId,
          selectedWarehouseId: state.warehouse ? state.warehouse.id : state.selectedWarehouseId,
          selectedMineParcelId: state.mineParcel ? state.mineParcel.id : state.selectedMineParcelId,
          selectedWarehouseParcelId: state.warehouseParcel ? state.warehouseParcel.id : state.selectedWarehouseParcelId,
          hauls: state.hauls,
          exchangeOrders: state.exchangeOrders,
          nextExchangeOrderId: state.nextExchangeOrderId,
          lastExchangeProcessAt: state.lastExchangeProcessAt,
          companyContracts: state.companyContracts,
          nextCompanyContractId: state.nextCompanyContractId,
          townBusinesses: state.townBusinesses,
          wasteToCrowe: state.wasteToCrowe,
          day: state.day,
          minutes: state.minutes,
          player: state.player,
          selected: state.selected,
          location: state.location,
          overview: state.overview,
          zoomIndex: state.zoomIndex,
          contextTitle: state.contextTitle,
          contextText: state.contextText
        };
      }

      function localProfileKey(slot) {
        return PROFILE_CACHE_PREFIX + slot;
      }

      function writeProfileCache(record) {
        try {
          window.localStorage.setItem(localProfileKey(record.slot), JSON.stringify(record));
          return true;
        } catch {
          saveUnavailable = true;
          return false;
        }
      }

      function scheduleProfileSync(record, immediate) {
        if (!deviceId || typeof window.fetch !== "function") return;
        if (profileSyncTimer) window.clearTimeout(profileSyncTimer);
        const send = function () {
          profileSyncTimer = null;
          window.fetch("/api/profiles", {
            method: "PUT",
            headers: { "content-type": "application/json", "x-pinebarrow-device": deviceId },
            body: JSON.stringify({ slot: record.slot, name: record.name, save: record.save })
          }).then(function (response) {
            if (!response.ok) throw new Error("save failed");
            record.updatedAt = Date.now();
            profileRecords.set(record.slot, record);
            writeProfileCache(record);
            if (el.saveStatus && state.started) el.saveStatus.textContent = "Company file saved";
            if (el.profileSync) el.profileSync.textContent = "Cloud saves ready";
          }).catch(function () {
            if (el.saveStatus && state.started) el.saveStatus.textContent = saveUnavailable ? "Cloud save retry needed" : "Saved on this device · cloud retry later";
            if (el.profileSync) el.profileSync.textContent = "Device cache active";
          });
        };
        if (immediate) send();
        else profileSyncTimer = window.setTimeout(send, 900);
      }

      function saveState(force) {
        if (!state.started || !activeProfileSlot) return true;
        if (saveUnavailable && typeof window.fetch !== "function") {
          if (el.saveStatus) el.saveStatus.textContent = "Autosave unavailable";
          return false;
        }
        const now = Date.now();
        if (!force && now - lastSavedAt < 5000) return true;
        try {
          const record = { slot: activeProfileSlot, name: activeProfileName, save: serializedState(), updatedAt: now };
          profileRecords.set(activeProfileSlot, record);
          const cached = writeProfileCache(record);
          if (!cached && typeof window.fetch !== "function") return false;
          lastSavedAt = now;
          if (el.saveStatus) el.saveStatus.textContent = cached ? "Saving company file…" : "Saving company file to cloud…";
          scheduleProfileSync(record, force);
          return true;
        } catch {
          saveUnavailable = true;
          if (el.saveStatus) el.saveStatus.textContent = "Autosave unavailable";
          return false;
        }
      }

      function saveGameNow() {
        const saved = saveState(true);
        if (saved) setContext("Company file saved", activeProfileName + " now includes every mine, warehouse, worker, vehicle upgrade, and cleared tile.");
        else setContext("Save blocked", "This browser is blocking device storage. Allow site storage, then press Save now again.");
      }

      function getOrCreateDeviceId() {
        try {
          let value = window.localStorage.getItem(DEVICE_KEY);
          if (/^[A-Za-z0-9_-]{20,96}$/.test(value || "")) return value;
          value = window.crypto && typeof window.crypto.randomUUID === "function"
            ? window.crypto.randomUUID().replace(/-/g, "")
            : "pb" + Date.now().toString(36) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
          window.localStorage.setItem(DEVICE_KEY, value);
          return value;
        } catch {
          saveUnavailable = true;
          return "session" + Date.now().toString(36) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
        }
      }

      function profileSummary(record) {
        if (!record || !record.save) return "Empty company file";
        const save = record.save;
        const mineCount = Array.isArray(save.mines) ? save.mines.length : save.mine ? 1 : 0;
        const warehouseCount = Array.isArray(save.warehouses) ? save.warehouses.length : save.warehouse ? 1 : 0;
        return "Day " + Math.max(1, Math.round(save.day || 1)) + " · $" + Math.round(save.cash || 0) + " · " + mineCount + " mine" + (mineCount === 1 ? "" : "s") + " · " + warehouseCount + " warehouse" + (warehouseCount === 1 ? "" : "s");
      }

      function renderProfileMenu() {
        for (let slot = 1; slot <= PROFILE_COUNT; slot += 1) {
          const record = profileRecords.get(slot);
          const nameElement = root.querySelector("#pb7-profile-name-" + slot);
          const summaryElement = root.querySelector("#pb7-profile-summary-" + slot);
          if (nameElement) nameElement.textContent = record ? record.name : "Company File " + slot;
          if (summaryElement) summaryElement.textContent = profileSummary(record);
        }
        el.profileSlots.forEach(function (button) {
          button.setAttribute("aria-pressed", Number(button.dataset.profileSlot) === selectedProfileSlot ? "true" : "false");
        });
        const selectedRecord = profileRecords.get(selectedProfileSlot);
        if (el.profileNameInput) el.profileNameInput.value = selectedRecord ? selectedRecord.name : "Pinebarrow Company " + selectedProfileSlot;
        if (selectedRecord && selectedRecord.save) {
          const savedAudio = typeof selectedRecord.save.soundEnabled === "boolean" ? selectedRecord.save.soundEnabled : true;
          state.musicEnabled = typeof selectedRecord.save.musicEnabled === "boolean" ? selectedRecord.save.musicEnabled : savedAudio;
          state.engineSoundEnabled = typeof selectedRecord.save.engineSoundEnabled === "boolean" ? selectedRecord.save.engineSoundEnabled : savedAudio;
          state.effectsSoundEnabled = typeof selectedRecord.save.effectsSoundEnabled === "boolean" ? selectedRecord.save.effectsSoundEnabled : savedAudio;
          state.soundEnabled = state.musicEnabled || state.engineSoundEnabled || state.effectsSoundEnabled;
        }
        if (el.profilePlay) el.profilePlay.textContent = selectedRecord ? "Continue " + selectedRecord.name : "Start new company";
        if (el.profileRestart) el.profileRestart.hidden = !selectedRecord;
        if (el.profileDelete) el.profileDelete.hidden = !selectedRecord;
        syncAudioButtons();
        profileRestartArmed = false;
        profileDeleteArmed = false;
        if (el.profileRestart) el.profileRestart.textContent = "Start over";
        if (el.profileDelete) el.profileDelete.textContent = "Delete file";
      }

      function selectProfile(slot) {
        selectedProfileSlot = Math.max(1, Math.min(PROFILE_COUNT, Math.round(slot || 1)));
        renderProfileMenu();
        if (el.profileMessage) el.profileMessage.textContent = profileRecords.has(selectedProfileSlot)
          ? "Continue this company, or start it over with a fresh map."
          : "This company file is empty and ready for a new game.";
      }

      function resetGameState() {
        const audioPreferences = {
          musicEnabled: state.musicEnabled,
          engineSoundEnabled: state.engineSoundEnabled,
          effectsSoundEnabled: state.effectsSoundEnabled
        };
        Object.assign(state, createInitialState());
        Object.assign(state, audioPreferences);
        state.soundEnabled = state.musicEnabled || state.engineSoundEnabled || state.effectsSoundEnabled;
        movementSegment = null;
        lastAnimationAt = 0;
      }

      function beginSelectedProfile(startOver) {
        const record = profileRecords.get(selectedProfileSlot);
        const requestedName = el.profileNameInput && el.profileNameInput.value.trim()
          ? el.profileNameInput.value.trim().slice(0, 28)
          : "Pinebarrow Company " + selectedProfileSlot;
        const requestedAudio = {
          musicEnabled: state.musicEnabled,
          engineSoundEnabled: state.engineSoundEnabled,
          effectsSoundEnabled: state.effectsSoundEnabled
        };
        resetGameState();
        Object.assign(state, requestedAudio);
        if (record && !startOver) loadSavedState(record.save);
        Object.assign(state, requestedAudio);
        state.soundEnabled = state.musicEnabled || state.engineSoundEnabled || state.effectsSoundEnabled;
        state.started = true;
        activeProfileSlot = selectedProfileSlot;
        activeProfileName = requestedName;
        state.path = [];
        state.pendingArrival = null;
        state.menuOpen = false;
        systemMenuOpen = false;
        fastTravelOpen = false;
        state.lastClockTickAt = 0;
        state.lastMineTickAt = 0;
        if (el.startLayer) el.startLayer.hidden = true;
        syncVisualPlayer();
        renderInterface();
        ensureAudio();
        saveState(true);
      }

      function openProfileMenu() {
        if (state.started) saveState(true);
        state.started = false;
        state.path = [];
        state.pendingArrival = null;
        state.menuOpen = false;
        systemMenuOpen = false;
        fastTravelOpen = false;
        stopMusic();
        updateEngineSound();
        selectedProfileSlot = activeProfileSlot || selectedProfileSlot || 1;
        if (el.startLayer) el.startLayer.hidden = false;
        renderProfileMenu();
        if (el.profileMessage) el.profileMessage.textContent = "Choose a company file. Active gameplay is paused.";
      }

      function deleteSelectedProfile() {
        const slot = selectedProfileSlot;
        profileRecords.delete(slot);
        try { window.localStorage.removeItem(localProfileKey(slot)); } catch { saveUnavailable = true; }
        if (activeProfileSlot === slot) {
          activeProfileSlot = null;
          activeProfileName = "";
        }
        renderProfileMenu();
        if (el.profileMessage) el.profileMessage.textContent = "Company file " + slot + " deleted.";
        if (deviceId && typeof window.fetch === "function") {
          window.fetch("/api/profiles", {
            method: "DELETE",
            headers: { "content-type": "application/json", "x-pinebarrow-device": deviceId },
            body: JSON.stringify({ slot: slot })
          }).catch(function () {});
        }
      }

      function readLocalProfile(slot) {
        try {
          const raw = window.localStorage.getItem(localProfileKey(slot));
          if (!raw) return null;
          const record = JSON.parse(raw);
          return record && record.slot === slot && record.save ? record : null;
        } catch {
          return null;
        }
      }

      async function initializeProfiles() {
        if (el.profilePlay) el.profilePlay.disabled = true;
        deviceId = getOrCreateDeviceId();
        for (let slot = 1; slot <= PROFILE_COUNT; slot += 1) {
          const record = readLocalProfile(slot);
          if (record) profileRecords.set(slot, record);
        }
        if (!profileRecords.has(1)) {
          try {
            const legacyRaw = window.localStorage.getItem(SAVE_KEY);
            const legacySave = legacyRaw ? JSON.parse(legacyRaw) : null;
            if (legacySave && legacySave.version) {
              const legacyRecord = { slot: 1, name: "Original Company", save: legacySave, updatedAt: Date.now() };
              profileRecords.set(1, legacyRecord);
              writeProfileCache(legacyRecord);
            }
          } catch {}
        }
        renderProfileMenu();
        if (el.profileSync) el.profileSync.textContent = "Checking cloud saves…";

        if (!deviceId || typeof window.fetch !== "function") {
          if (el.profileSync) el.profileSync.textContent = "Device cache active";
          if (el.profilePlay) el.profilePlay.disabled = false;
          return;
        }
        try {
          const response = await window.fetch("/api/profiles", { headers: { "x-pinebarrow-device": deviceId }, cache: "no-store" });
          if (!response.ok) throw new Error("profiles unavailable");
          const payload = await response.json();
          const remoteSlots = new Set();
          (Array.isArray(payload.profiles) ? payload.profiles : []).forEach(function (record) {
            if (!record || !record.save || !Number.isInteger(record.slot)) return;
            remoteSlots.add(record.slot);
            const local = profileRecords.get(record.slot);
            if (!local || Number(record.updatedAt || 0) >= Number(local.updatedAt || 0)) {
              profileRecords.set(record.slot, record);
              writeProfileCache(record);
            } else {
              scheduleProfileSync(local, true);
            }
          });
          profileRecords.forEach(function (record, slot) {
            if (!remoteSlots.has(slot)) scheduleProfileSync(record, true);
          });
          if (el.profileSync) el.profileSync.textContent = "Cloud saves ready";
        } catch {
          if (el.profileSync) el.profileSync.textContent = "Device cache active";
        }
        if (el.profilePlay) el.profilePlay.disabled = false;
        renderProfileMenu();
      }

      function palette() {
        const style = getComputedStyle(root);
        function color(name, fallbackName) {
          const value = style.getPropertyValue(name).trim();
          if (value) return value;
          return style.getPropertyValue(fallbackName || "--foreground").trim() || style.color;
        }
        return {
          background: color("--background"),
          foreground: color("--foreground"),
          border: color("--border", "--muted-foreground"),
          grass: color("--pb7-grass", "--background"),
          tree: color("--pb7-tree", "--viz-series-2"),
          treeLight: color("--pb7-tree-light", "--viz-series-2"),
          road: color("--pb7-road", "--secondary"),
          roadLine: color("--pb7-road-line", "--primary"),
          mainRoad: color("--pb7-main-road", "--pb7-road"),
          sideRoad: color("--pb7-side-road", "--pb7-road"),
          sidewalk: color("--pb7-sidewalk", "--pb7-town"),
          curb: color("--pb7-curb", "--border"),
          roadWhite: color("--pb7-road-white", "--surface-light"),
          townLot: color("--pb7-town-lot", "--pb7-town"),
          town: color("--pb7-town", "--accent"),
          building: color("--pb7-building", "--viz-series-4"),
          roof: color("--pb7-roof", "--viz-series-4"),
          window: color("--pb7-window", "--viz-series-3"),
          soil: color("--pb7-soil", "--viz-series-5"),
          wall: color("--pb7-stone-wall", "--muted-foreground"),
          wallLight: color("--pb7-stone-light", "--border"),
          wallDark: color("--pb7-stone-dark", "--foreground"),
          shadow: color("--pb7-shadow", "--border"),
          owned: color("--viz-series-1", "--primary"),
          leased: color("--viz-series-6", "--accent"),
          ring: color("--ring", "--primary")
        };
      }

      function keyFor(x, y) {
        return x + "," + y;
      }

      function claimInfoAt(x, y) {
        if (x < 0 || x >= WORLD_WIDTH) return null;
        if (insideNorthClaim(x, y)) {
          return {
            side: "north",
            lane: Math.floor(x / 30),
            localX: x % 30,
            depth: TOWN_TOP - 1 - y
          };
        }
        if (insideSouthClaim(x, y)) {
          return {
            side: "south",
            lane: Math.floor(x / 30),
            localX: x % 30,
            depth: y - SOUTH_TOP
          };
        }
        return null;
      }

      function claimYAtDepth(side, depth) {
        return side === "north" ? TOWN_TOP - 1 - depth : SOUTH_TOP + depth;
      }

      function claimSectionIndexFromDepth(depth) {
        if (depth >= CLAIM_SECTION_DEPTHS[2]) return 2;
        if (depth >= CLAIM_SECTION_DEPTHS[1]) return 1;
        return 0;
      }

      function claimGateAt(x, y) {
        const info = claimInfoAt(x, y);
        if (!info || !CLAIM_SECTION_DEPTHS.includes(info.depth) || (info.localX !== 14 && info.localX !== 15)) return null;
        const sectionIndex = CLAIM_SECTION_DEPTHS.indexOf(info.depth);
        return {
          side: info.side,
          lane: info.lane,
          sectionIndex: sectionIndex,
          sectionNumber: sectionIndex + 1,
          depth: info.depth,
          x: info.lane * 30 + 14,
          y: claimYAtDepth(info.side, info.depth),
          cost: CONFIG.claimGateCosts[sectionIndex]
        };
      }

      function isClaimWallCell(x, y) {
        const info = claimInfoAt(x, y);
        if (!info) return false;
        return info.localX === 0 || info.localX === 29 || info.depth === CLAIM_DEPTH - 1 || CLAIM_SECTION_DEPTHS.includes(info.depth);
      }

      function isActivePlayerGate(gate) {
        return Boolean(gate && gate.side === "south" && gate.lane === PLAYER_LANE);
      }

      function isClaimGateOpen(gate) {
        return Boolean(isActivePlayerGate(gate) && gate.sectionIndex < state.unlockedClaimZones);
      }

      function claimZoneUnlockedAt(x, y) {
        const info = claimInfoAt(x, y);
        return Boolean(info && info.side === "south" && info.lane === PLAYER_LANE && claimSectionIndexFromDepth(info.depth) < state.unlockedClaimZones);
      }

      function seededUnit(a, b, c, d) {
        let value = Math.imul(a + 17, 73856093) ^ Math.imul(b + 29, 19349663) ^ Math.imul(c + 43, 83492791) ^ Math.imul(d + 71, 2654435761);
        value ^= value >>> 13;
        value = Math.imul(value, 1274126177);
        value ^= value >>> 16;
        return (value >>> 0) / 4294967295;
      }

      function surfaceMaterialFor(sectionIndex, seed) {
        const bands = [
          ["stone", "stone", "clay", "coal"],
          ["coal", "iron", "copper", "tin"],
          ["quartz", "silver", "gold", "sapphire"]
        ];
        const options = bands[sectionIndex];
        return options[Math.floor(seed * options.length) % options.length];
      }

      function buildClaimTerrain() {
        const terrain = {
          trees: new Set(),
          dirt: new Set(),
          resources: new Map()
        };

        function addEllipse(target, side, lane, sectionIndex, centerX, centerDepth, radiusX, radiusDepth, roughness) {
          const left = lane * 30 + 1;
          const right = lane * 30 + 28;
          const startDepth = CLAIM_SECTION_DEPTHS[sectionIndex] + 1;
          const endDepth = Math.min(CLAIM_SECTION_ENDS[sectionIndex], CLAIM_DEPTH - 2);
          for (let depth = Math.max(startDepth, centerDepth - radiusDepth); depth <= Math.min(endDepth, centerDepth + radiusDepth); depth += 1) {
            for (let x = Math.max(left, centerX - radiusX); x <= Math.min(right, centerX + radiusX); x += 1) {
              const normalizedX = (x - centerX) / Math.max(1, radiusX);
              const normalizedY = (depth - centerDepth) / Math.max(1, radiusDepth);
              const edgeNoise = (seededUnit(x, depth, lane + sectionIndex * 5, side === "north" ? 3 : 7) - .5) * roughness;
              if (normalizedX * normalizedX + normalizedY * normalizedY > 1 + edgeNoise) continue;
              const y = claimYAtDepth(side, depth);
              if (isResourceSpawnableTile(x, y)) target.add(keyFor(x, y));
            }
          }
        }

        ["north", "south"].forEach(function (side, sideIndex) {
          for (let lane = 0; lane < 3; lane += 1) {
            for (let sectionIndex = 0; sectionIndex < 3; sectionIndex += 1) {
              const startDepth = CLAIM_SECTION_DEPTHS[sectionIndex] + 2;
              const endDepth = Math.min(CLAIM_SECTION_ENDS[sectionIndex] - 1, CLAIM_DEPTH - 3);
              const depthSpan = Math.max(8, endDepth - startDepth);
              const laneLeft = lane * 30;

              for (let patch = 0; patch < 4; patch += 1) {
                const centerX = laneLeft + 4 + Math.floor(seededUnit(lane, sectionIndex, patch, sideIndex + 31) * 22);
                const centerDepth = startDepth + 2 + Math.floor(seededUnit(sectionIndex, patch, lane, sideIndex + 41) * Math.max(1, depthSpan - 4));
                addEllipse(terrain.dirt, side, lane, sectionIndex, centerX, centerDepth, 4 + (patch % 3), 4 + ((lane + patch) % 3), .24);
              }

              for (let cluster = 0; cluster < 6; cluster += 1) {
                let centerX = laneLeft + 4 + Math.floor(seededUnit(lane, sectionIndex, cluster, sideIndex + 73) * 22);
                if (centerX >= laneLeft + 12 && centerX <= laneLeft + 17) centerX += centerX < laneLeft + 15 ? -4 : 4;
                const centerDepth = startDepth + 2 + Math.floor(seededUnit(sectionIndex, cluster, lane, sideIndex + 89) * Math.max(1, depthSpan - 4));
                addEllipse(terrain.trees, side, lane, sectionIndex, centerX, centerDepth, 3 + ((lane + cluster) % 3), 3 + ((sectionIndex + cluster) % 3), .34);
              }

              for (let patch = 0; patch < 4; patch += 1) {
                const centerX = laneLeft + 5 + Math.floor(seededUnit(lane, sectionIndex, patch, sideIndex + 109) * 20);
                const centerDepth = startDepth + 3 + Math.floor(seededUnit(sectionIndex, patch, lane, sideIndex + 127) * Math.max(1, depthSpan - 6));
                const material = surfaceMaterialFor(sectionIndex, seededUnit(centerX, centerDepth, lane, sideIndex + 151));
                for (let dy = -2; dy <= 2; dy += 1) {
                  for (let dx = -2; dx <= 2; dx += 1) {
                    if (Math.abs(dx) + Math.abs(dy) > 3) continue;
                    const x = centerX + dx;
                    const depth = centerDepth + dy;
                    const y = claimYAtDepth(side, depth);
                    if (x <= laneLeft || x >= laneLeft + 29 || depth <= CLAIM_SECTION_DEPTHS[sectionIndex] || depth >= CLAIM_SECTION_ENDS[sectionIndex] || !isResourceSpawnableTile(x, y)) continue;
                    const key = keyFor(x, y);
                    terrain.resources.set(key, material);
                    terrain.trees.delete(key);
                    terrain.dirt.add(key);
                  }
                }
              }
            }
          }
        });

        [
          STARTER_TREE,
          { x: STARTER_TREE.x, y: STARTER_TREE.y + 1 },
          { x: STARTER_TREE.x + 1, y: STARTER_TREE.y },
          { x: STARTER_TREE.x + 1, y: STARTER_TREE.y + 1 },
          { x: STARTER_TREE.x + 2, y: STARTER_TREE.y + 1 }
        ].forEach(function (tree) {
          const key = keyFor(tree.x, tree.y);
          terrain.resources.delete(key);
          terrain.trees.add(key);
        });

        return terrain;
      }

      const claimTerrain = buildClaimTerrain();

      function isResourceRoadCell(x, y) {
        return isPlayerClaimPath(x, y) || isPavedClaimRoad(x, y);
      }

      function clearRoadSurfaceDecoration() {
        [claimTerrain.trees, claimTerrain.dirt, claimTerrain.resources].forEach(function (collection) {
          Array.from(collection.keys()).forEach(function (key) {
            const point = pointFromKey(key);
            if (point && isResourceRoadCell(point.x, point.y)) collection.delete(key);
          });
        });
      }

      function roadSurfaceResourceOverlapCount() {
        return Array.from(claimTerrain.resources.keys()).reduce(function (count, key) {
          const point = pointFromKey(key);
          return count + (point && isResourceRoadCell(point.x, point.y) ? 1 : 0);
        }, 0);
      }

      function isTreeAt(x, y) {
        const key = keyFor(x, y);
        return Boolean(claimTerrain.trees.has(key) && !state.cleared.has(key) && !isPavedClaimRoad(x, y) && !isStructureCell(x, y));
      }

      function isNaturalDirtAt(x, y) {
        return !isResourceRoadCell(x, y) && claimTerrain.dirt.has(keyFor(x, y));
      }

      function surfaceResourceAt(x, y) {
        return isResourceRoadCell(x, y) ? null : claimTerrain.resources.get(keyFor(x, y)) || null;
      }

      function isSurveyableGround(x, y) {
        if (!isPlayerClaimTile(x, y) || !claimZoneUnlockedAt(x, y) || isResourceRoadCell(x, y) || isTreeAt(x, y) || isStructureCell(x, y)) return false;
        const gate = claimGateAt(x, y);
        if (gate) return isClaimGateOpen(gate);
        return !isClaimWallCell(x, y);
      }

      function legacyUnlockedClaimZones() {
        let deepest = Math.max(0, (Number(state.pavedDepth) || 1) - 1);
        if (isPlayerClaimTile(state.player.x, state.player.y)) deepest = Math.max(deepest, state.player.y - SOUTH_TOP);
        state.cleared.forEach(function (key) {
          const parts = key.split(",").map(Number);
          if (parts.length === 2 && isPlayerClaimTile(parts[0], parts[1])) deepest = Math.max(deepest, parts[1] - SOUTH_TOP);
        });
        state.mineParcels.concat(state.warehouseParcels, state.mines, state.warehouses).forEach(function (record) {
          if (record && Number.isFinite(record.y) && isPlayerClaimTile(record.x, record.y)) deepest = Math.max(deepest, record.y + (record.h || 1) - 1 - SOUTH_TOP);
        });
        return deepest >= CLAIM_SECTION_DEPTHS[2] ? 3 : deepest >= CLAIM_SECTION_DEPTHS[1] ? 2 : 1;
      }

      function round1(value) {
        return Math.round((value + Number.EPSILON) * 10) / 10;
      }

      function usedStore(store) {
        return cargoKeys.reduce(function (sum, key) { return sum + store[key]; }, 0);
      }

      function usedCargo() {
        return usedStore(state.cargo);
      }

      function freeCargo() {
        return Math.max(0, state.capacity - usedCargo());
      }

      function cargoSummary(store) {
        const source = store || state.cargo;
        const parts = cargoKeys.filter(function (key) {
          return source[key] >= .05;
        }).map(function (key) {
          return round1(source[key]).toFixed(1) + " " + key;
        });
        return parts.length ? parts.join(" · ") : "empty";
      }

      function buildingAt(x, y) {
        const coreBuilding = buildings.find(function (building) {
          return x >= building.x && x < building.x + building.w && y >= building.y && y < building.y + building.h;
        }) || null;
        if (coreBuilding) return coreBuilding;
        return businessLots.find(function (business) {
          const record = state.townBusinesses[business.id];
          return record && (record.status === "announced" || record.status === "open") && x >= business.x && x < business.x + business.w && y >= business.y && y < business.y + business.h;
        }) || null;
      }

      function insideTown(x, y) {
        return x >= TOWN_LEFT && x < TOWN_RIGHT && y >= TOWN_TOP && y < TOWN_BOTTOM;
      }

      function insideNorthClaim(x, y) {
        return x >= 0 && x < WORLD_WIDTH && y >= 0 && y < CLAIM_DEPTH;
      }

      function insideSouthClaim(x, y) {
        return x >= 0 && x < WORLD_WIDTH && y >= SOUTH_TOP && y < WORLD_HEIGHT;
      }

      function insideAnyClaim(x, y) {
        return insideNorthClaim(x, y) || insideSouthClaim(x, y);
      }

      function isPlayerClaimTile(x, y) {
        return insideSouthClaim(x, y) && x >= PLAYER_LEFT && x < PLAYER_RIGHT;
      }

      function isPlayerClaimPath(x, y) {
        return isPlayerClaimTile(x, y) && (x === PLAYER_ROAD_X || x === PLAYER_ROAD_X + 1);
      }

      function isTownMainStreet(x, y) {
        return insideTown(x, y) && y >= MAIN_STREET_TOP && y < MAIN_STREET_BOTTOM;
      }

      function isTownPerimeterStreet(x, y) {
        return insideTown(x, y) && TOWN_PERIMETER_STREET_YS.some(function (streetY) {
          return y >= streetY && y < streetY + TOWN_SIDE_STREET_WIDTH;
        });
      }

      function isTownVerticalStreet(x, y) {
        return insideTown(x, y) && TOWN_SIDE_STREET_XS.some(function (streetX) {
          return x >= streetX && x < streetX + TOWN_SIDE_STREET_WIDTH;
        });
      }

      function isTownSideStreet(x, y) {
        return isTownPerimeterStreet(x, y) || isTownVerticalStreet(x, y);
      }

      function isTownRoad(x, y) {
        return isTownMainStreet(x, y) || isTownSideStreet(x, y);
      }

      function isTownSidewalk(x, y) {
        if (!insideTown(x, y) || isTownRoad(x, y)) return false;
        return [
          { x: x - 1, y: y }, { x: x + 1, y: y },
          { x: x, y: y - 1 }, { x: x, y: y + 1 }
        ].some(function (neighbor) {
          return insideTown(neighbor.x, neighbor.y) && isTownRoad(neighbor.x, neighbor.y);
        });
      }

      function townSurfaceColorAt(x, y, colors) {
        if (isTownMainStreet(x, y)) return colors.mainRoad;
        if (isTownSideStreet(x, y)) return colors.sideRoad;
        if (isTownSidewalk(x, y)) return colors.sidewalk;
        return colors.townLot;
      }

      function townLayoutConflictCount() {
        const townStructures = buildings.concat(businessLots);
        let conflicts = 0;
        townStructures.forEach(function (building, index) {
          const inside = building.x >= TOWN_LEFT && building.x + building.w <= TOWN_RIGHT && building.y >= TOWN_TOP && building.y + building.h <= TOWN_BOTTOM;
          const overlapsStreet = !inside || Array.from({ length: building.w * building.h }).some(function (_, cellIndex) {
            const x = building.x + cellIndex % building.w;
            const y = building.y + Math.floor(cellIndex / building.w);
            return isTownRoad(x, y) || isTownSidewalk(x, y);
          });
          const entranceConnected = isTownRoad(building.doorX, building.doorY) || isTownSidewalk(building.doorX, building.doorY);
          if (overlapsStreet || !entranceConnected) conflicts += 1;
          for (let otherIndex = index + 1; otherIndex < townStructures.length; otherIndex += 1) {
            if (rectanglesOverlap(building, townStructures[otherIndex])) conflicts += 1;
          }
        });
        return conflicts;
      }

      function townBlockEnclosureConflictCount() {
        let conflicts = 0;
        TOWN_BLOCKS.forEach(function (block) {
          for (let x = block.x; x < block.x + block.w; x += 1) {
            if (!isTownSidewalk(x, block.y - 1) || !isTownSidewalk(x, block.y + block.h)) conflicts += 1;
          }
          for (let y = block.y; y < block.y + block.h; y += 1) {
            if (!isTownSidewalk(block.x - 1, y) || !isTownSidewalk(block.x + block.w, y)) conflicts += 1;
          }
        });
        return conflicts;
      }

      function townStreetDeadEndCount() {
        let deadEnds = 0;
        TOWN_SIDE_STREET_XS.forEach(function (streetX) {
          if (!isTownPerimeterStreet(streetX, TOWN_TOP)) deadEnds += 1;
          if (!isTownPerimeterStreet(streetX, TOWN_BOTTOM - 1)) deadEnds += 1;
        });
        TOWN_PERIMETER_STREET_YS.forEach(function (streetY) {
          if (!isTownVerticalStreet(TOWN_LEFT + 1, streetY)) deadEnds += 1;
          if (!isTownVerticalStreet(TOWN_RIGHT - 2, streetY)) deadEnds += 1;
        });
        return deadEnds;
      }

      function townFrontageConflictCount() {
        return buildings.concat(businessLots).filter(function (building) {
          const facesMainStreet = building.doorY === MAIN_STREET_TOP - 1 || building.doorY === MAIN_STREET_BOTTOM;
          const doorCentered = building.doorX >= building.x && building.doorX < building.x + building.w;
          return !facesMainStreet || !doorCentered;
        }).length;
      }

      function townBuildingById(buildingId) {
        return buildings.concat(businessLots).find(function (building) { return building.id === buildingId; }) || null;
      }

      function relocatePlayerFromTownBuilding() {
        const savedLocationBuilding = townBuildingById(state.location);
        if (savedLocationBuilding) {
          state.player = { x: savedLocationBuilding.doorX, y: savedLocationBuilding.doorY };
          state.selected = { type: "building", x: savedLocationBuilding.x, y: savedLocationBuilding.y, buildingId: savedLocationBuilding.id };
          return true;
        }
        const occupied = buildingAt(state.player.x, state.player.y);
        if (!occupied) return false;
        state.player = { x: occupied.doorX, y: occupied.doorY };
        if (state.location === occupied.id) {
          state.selected = { type: "building", x: occupied.x, y: occupied.y, buildingId: occupied.id };
        } else {
          state.location = "road";
          state.selected = { type: "road", x: occupied.doorX, y: occupied.doorY };
        }
        return true;
      }

      function isPavedClaimRoad(x, y) {
        return (isPlayerClaimPath(x, y) && y - SOUTH_TOP < state.pavedDepth) || state.roadTiles.has(keyFor(x, y));
      }

      function isResourceSpawnableTile(x, y) {
        return insideAnyClaim(x, y) && !isClaimWallCell(x, y) && !isResourceRoadCell(x, y) && !isStructureCell(x, y);
      }

      function isCleared(x, y) {
        return state.cleared.has(keyFor(x, y));
      }

      function inRect(x, y, rect) {
        return Boolean(rect && x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h);
      }

      function parcelForMine(mine) {
        if (!mine) return null;
        return state.mineParcels.find(function (parcel) { return parcel.id === mine.parcelId || parcel.mineId === mine.id; }) || null;
      }

      function parcelForWarehouse(warehouse) {
        if (!warehouse) return null;
        return state.warehouseParcels.find(function (parcel) { return parcel.id === warehouse.parcelId || parcel.warehouseId === warehouse.id; }) || null;
      }

      function warehouseParcelForMineParcel(mineParcel) {
        if (!mineParcel) return null;
        return state.warehouseParcels.find(function (parcel) { return parcel.mineParcelId === mineParcel.id; }) || null;
      }

      function mineAt(x, y) {
        return state.mines.find(function (mine) { return inRect(x, y, mine); }) || null;
      }

      function warehouseAt(x, y) {
        return state.warehouses.find(function (warehouse) { return inRect(x, y, warehouse); }) || null;
      }

      function mineParcelAt(x, y) {
        if (state.surveyParcel && inRect(x, y, state.surveyParcel)) return state.surveyParcel;
        return state.mineParcels.find(function (parcel) { return inRect(x, y, parcel); }) || null;
      }

      function warehouseParcelAt(x, y) {
        return state.warehouseParcels.find(function (parcel) { return inRect(x, y, parcel); }) || null;
      }

      function selectActiveMine(mine) {
        state.mine = mine || null;
        state.selectedMineId = mine ? mine.id : null;
        if (mine) {
          state.mineParcel = parcelForMine(mine);
          state.selectedMineParcelId = state.mineParcel ? state.mineParcel.id : null;
          state.warehouseParcel = warehouseParcelForMineParcel(state.mineParcel) || state.warehouseParcel;
          if (state.warehouseParcel) state.selectedWarehouseParcelId = state.warehouseParcel.id;
        }
      }

      function selectActiveWarehouse(warehouse) {
        state.warehouse = warehouse || null;
        state.selectedWarehouseId = warehouse ? warehouse.id : null;
        if (warehouse) {
          state.warehouseParcel = parcelForWarehouse(warehouse);
          state.selectedWarehouseParcelId = state.warehouseParcel ? state.warehouseParcel.id : null;
        }
      }

      function mineSlotLimit() {
        let slots = 1;
        CONFIG.mineSlotUnlockDays.forEach(function (unlockDay, index) {
          if (state.day >= unlockDay) slots = index + 1;
        });
        return Math.min(CONFIG.maxMineSlots, slots);
      }

      function rectanglesOverlap(a, b) {
        return Boolean(a && b && a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y);
      }

      function parcelConflicts(parcel) {
        if (!parcel) return true;
        if (!isPlayerClaimTile(parcel.x, parcel.y) || !isPlayerClaimTile(parcel.x + parcel.w - 1, parcel.y + parcel.h - 1)) return true;
        if (parcelCells(parcel).some(function (cell) {
          return isPavedClaimRoad(cell.x, cell.y) || isPlayerClaimPath(cell.x, cell.y) || isClaimWallCell(cell.x, cell.y) || !claimZoneUnlockedAt(cell.x, cell.y);
        })) return true;
        return state.mineParcels.concat(state.warehouseParcels).some(function (existing) { return rectanglesOverlap(parcel, existing); });
      }

      function findWarehouseParcelFor(mineParcel) {
        if (!mineParcel) return null;
        const candidates = [
          { x: mineParcel.x, y: mineParcel.y + 2 },
          { x: mineParcel.x, y: mineParcel.y - 2 },
          { x: mineParcel.x + 2, y: mineParcel.y },
          { x: mineParcel.x - 2, y: mineParcel.y }
        ];
        const position = candidates.find(function (candidate) {
          const parcel = { x: candidate.x, y: candidate.y, w: 2, h: 2 };
          return !parcelConflicts(parcel) && !(state.surveyParcel && rectanglesOverlap(parcel, state.surveyParcel));
        });
        if (!position) return null;
        return {
          id: allocateSiteId("warehouse-land"),
          mineParcelId: mineParcel.id,
          x: position.x,
          y: position.y,
          w: 2,
          h: 2,
          status: "available"
        };
      }

      function isStructureCell(x, y) {
        return Boolean(mineAt(x, y) || warehouseAt(x, y));
      }

      function isPassable(x, y) {
        if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) return false;
        if (buildingAt(x, y) || isStructureCell(x, y)) return false;
        if (insideTown(x, y)) return true;
        if (!insideAnyClaim(x, y)) return false;
        const gate = claimGateAt(x, y);
        if (gate) return isClaimGateOpen(gate);
        if (isClaimWallCell(x, y) || !claimZoneUnlockedAt(x, y)) return false;
        if (isPavedClaimRoad(x, y)) return true;
        return isSurveyableGround(x, y);
      }

      function moveDelayFor(x, y) {
        let baseDelay = CONFIG.trailMoveMilliseconds;
        if (isPavedClaimRoad(x, y) || isTownRoad(x, y)) baseDelay = CONFIG.pavedMoveMilliseconds;
        else if (insideTown(x, y)) baseDelay = CONFIG.townMoveMilliseconds;
        return Math.round(baseDelay * CONFIG.truckSpeedMultipliers[state.truckSpeedLevel]);
      }

      function neighbors(x, y) {
        return [
          { x: x + 1, y: y },
          { x: x - 1, y: y },
          { x: x, y: y + 1 },
          { x: x, y: y - 1 }
        ].filter(function (point) { return isPassable(point.x, point.y); });
      }

      function pathToAny(targets) {
        const targetSet = new Set(targets.map(function (target) { return keyFor(target.x, target.y); }));
        const startIndex = state.player.y * WORLD_WIDTH + state.player.x;
        const parents = new Int32Array(WORLD_WIDTH * WORLD_HEIGHT);
        parents.fill(-2);
        parents[startIndex] = -1;
        const queue = new Int32Array(WORLD_WIDTH * WORLD_HEIGHT);
        let head = 0;
        let tail = 0;
        queue[tail] = startIndex;
        tail += 1;
        let found = -1;

        while (head < tail) {
          const index = queue[head];
          head += 1;
          const x = index % WORLD_WIDTH;
          const y = Math.floor(index / WORLD_WIDTH);
          if (targetSet.has(keyFor(x, y))) {
            found = index;
            break;
          }
          neighbors(x, y).forEach(function (point) {
            const nextIndex = point.y * WORLD_WIDTH + point.x;
            if (parents[nextIndex] !== -2) return;
            parents[nextIndex] = index;
            queue[tail] = nextIndex;
            tail += 1;
          });
        }

        if (found < 0) return [];
        const reversed = [];
        let cursor = found;
        while (cursor !== startIndex && cursor >= 0) {
          reversed.push({ x: cursor % WORLD_WIDTH, y: Math.floor(cursor / WORLD_WIDTH) });
          cursor = parents[cursor];
        }
        return reversed.reverse();
      }

      function setContext(title, text, cue) {
        state.contextTitle = title;
        state.contextText = text;
        if (/blocked|required|full|waiting|not ready|boundary|other player/i.test(title)) state.contextTone = "danger";
        else if (/hired|purchased|installed|sold|extended|complete|cleared|surveyed|prospected|leased|owned|built|loaded|unloaded|reloaded|recovered|saved|upgraded/i.test(title)) state.contextTone = "success";
        else state.contextTone = "neutral";
        renderInterface();
        saveState(true);
        if (cue) playSoundCue(cue);
        else if (state.contextTone === "success") playSoundCue("success");
        else if (state.contextTone === "danger") playSoundCue("error");
      }

      function closeMenu() {
        state.menuOpen = false;
        newsReaderOpen = false;
        marketScreenOpen = false;
        renderInterface();
        if (el.touchInteract) el.touchInteract.focus({ preventScroll: true });
      }

      function setFollowView() {
        state.overview = false;
        el.overview.setAttribute("aria-pressed", "false");
        el.overview.setAttribute("aria-label", "World map");
      }

      function settleMovementForReroute() {
        if (!movementSegment) return;
        if (movementSegment.progress >= .5) {
          state.player.x = movementSegment.toX;
          state.player.y = movementSegment.toY;
        }
        movementSegment = null;
        visualPlayer.x = state.player.x;
        visualPlayer.y = state.player.y;
      }

      function queueTravel(targets, arrival, label) {
        settleMovementForReroute();
        const path = pathToAny(targets);
        const alreadyThere = targets.some(function (target) {
          return target.x === state.player.x && target.y === state.player.y;
        });
        if (!path.length && !alreadyThere) {
          setContext("Route blocked", "No open route reaches that point. A stone wall, locked gate, tree cluster, or another structure is blocking the truck.");
          return;
        }
        state.path = path;
        state.pendingArrival = arrival;
        state.location = null;
        state.menuOpen = false;
        systemMenuOpen = false;
        closeFastTravel();
        setFollowView();
        setContext("Driving", "Traveling to " + label + ". The truck uses town streets, paved rows, and open extraction ground, but cannot cross stone walls or locked gates.");
        if (!path.length) finishArrival();
      }

      function buildingDoorTargets(building) {
        return [{ x: building.doorX, y: building.doorY }];
      }

      function travelToBuilding(building) {
        queueTravel(buildingDoorTargets(building), { type: "building", buildingId: building.id }, building.label);
      }

      function adjacentPassableTargets(x, y) {
        return [
          { x: x + 1, y: y },
          { x: x - 1, y: y },
          { x: x, y: y + 1 },
          { x: x, y: y - 1 }
        ].filter(function (point) { return isPassable(point.x, point.y); });
      }

      function selectTree(x, y) {
        if (!isPlayerClaimTile(x, y)) {
          setContext("Claim boundary", "That forest belongs to another player. Your highlighted P4 claim is thirty tiles wide.");
          return;
        }
        if (!claimZoneUnlockedAt(x, y)) {
          setContext("Section locked", "Open the stone gate before entering this deeper extraction field.");
          return;
        }
        if (!isTreeAt(x, y)) {
          selectClearedTile(x, y);
          return;
        }
        state.selected = { type: "tree", x: x, y: y };
        const targets = adjacentPassableTargets(x, y);
        if (!targets.length) {
          setContext("Tree patch blocked", "Approach this cluster from an open side before using the saw.");
          return;
        }
        queueTravel(targets, { type: "tree", x: x, y: y }, "the selected tree");
      }

      function selectClaimGate(gate) {
        if (!gate || !isActivePlayerGate(gate)) {
          setContext("Other player gate", "This stone gate belongs to another player claim and cannot be opened from your company file.");
          return;
        }
        if (isClaimGateOpen(gate)) {
          queueTravel([
            { x: gate.x, y: gate.y },
            { x: gate.x + 1, y: gate.y }
          ], { type: "road", x: gate.x, y: gate.y }, "the open Section " + gate.sectionNumber + " gate");
          return;
        }
        state.selected = { type: "gate", x: gate.x, y: gate.y, gateIndex: gate.sectionIndex };
        const targets = adjacentPassableTargets(gate.x, gate.y).concat(adjacentPassableTargets(gate.x + 1, gate.y));
        queueTravel(targets, { type: "gate", gateIndex: gate.sectionIndex }, "the Section " + gate.sectionNumber + " stone gate");
      }

      function selectClearedTile(x, y) {
        state.selected = { type: "cleared", x: x, y: y };
        queueTravel([{ x: x, y: y }], { type: "cleared", x: x, y: y }, "the cleared tile");
      }

      function structureDoor(structure) {
        return {
          x: Number.isFinite(structure.doorX) ? structure.doorX : structure.x - 1,
          y: Number.isFinite(structure.doorY) ? structure.doorY : structure.y + structure.h - 1
        };
      }

      function parcelPerimeterTargets(parcel) {
        if (!parcel) return [];
        const targets = [];
        const seen = new Set();
        parcelCells(parcel).forEach(function (cell) {
          [
            { x: cell.x + 1, y: cell.y },
            { x: cell.x - 1, y: cell.y },
            { x: cell.x, y: cell.y + 1 },
            { x: cell.x, y: cell.y - 1 }
          ].forEach(function (point) {
            const key = keyFor(point.x, point.y);
            if (!inRect(point.x, point.y, parcel) && !seen.has(key) && isPassable(point.x, point.y)) {
              seen.add(key);
              targets.push(point);
            }
          });
        });
        return targets;
      }

      function selectMine(targetMine) {
        if (targetMine) selectActiveMine(targetMine);
        else if (!state.mine && state.mines.length) selectActiveMine(state.mines[0]);
        if (!state.mine) {
          if (state.mineParcel && (state.mineParcel.status === "leased" || state.mineParcel.status === "owned")) {
            state.selected = { type: "mine-site", x: state.mineParcel.x, y: state.mineParcel.y };
            queueTravel(parcelPerimeterTargets(state.mineParcel), { type: "mine-site", parcelId: state.mineParcel.id }, "the outside edge of your mine parcel");
            return;
          }
          setContext("No mine yet", "Prospect open extraction ground, lease its 2×2 parcel at Town Hall, clear any trees inside it, then build from the outside edge.");
          return;
        }
        state.selected = { type: "mine", x: state.mine.x, y: state.mine.y };
        queueTravel([structureDoor(state.mine)], { type: "mine", mineId: state.mine.id }, "Mine " + (state.mines.indexOf(state.mine) + 1));
      }

      function selectWarehouse(targetWarehouse) {
        if (targetWarehouse) selectActiveWarehouse(targetWarehouse);
        else if (!state.warehouse && state.warehouses.length) selectActiveWarehouse(state.warehouses[0]);
        if (!state.warehouse) {
          if (state.warehouseParcel && state.warehouseParcel.status === "owned") {
            state.selected = { type: "warehouse-site", x: state.warehouseParcel.x, y: state.warehouseParcel.y };
            queueTravel(parcelPerimeterTargets(state.warehouseParcel), { type: "warehouse-site", parcelId: state.warehouseParcel.id }, "the outside edge of your warehouse parcel");
            return;
          }
          setContext("No warehouse yet", "Own the mine land, purchase the neighboring 2×2 parcel at Town Hall, clear it, and build from directly outside the boundary.");
          return;
        }
        state.selected = { type: "warehouse", x: state.warehouse.x, y: state.warehouse.y };
        queueTravel([structureDoor(state.warehouse)], { type: "warehouse", warehouseId: state.warehouse.id }, "Warehouse " + (state.warehouses.indexOf(state.warehouse) + 1));
      }

      function parcelLabel(parcel) {
        if (!parcel) return "No parcel";
        if (parcel.status === "surveyed") return "Surveyed land";
        if (parcel.status === "leased") return "Leased land";
        if (parcel.status === "owned") return "Owned land";
        if (parcel.status === "available") return "Land for sale";
        return "Land";
      }

      function finishArrival() {
        const arrival = state.pendingArrival;
        state.pendingArrival = null;
        if (!arrival) {
          setContext("Roadside", "Choose a building, structure, road tile, or reachable tree.");
          return;
        }
        if (arrival.type === "manual-step") {
          finishManualStep(arrival);
          return;
        }
        if (["building", "mine", "warehouse", "gate", "mine-site", "warehouse-site"].includes(arrival.type)) {
          state.menuOpen = true;
          systemMenuOpen = false;
          closeFastTravel();
        }
        if (arrival.type === "building") {
          state.location = arrival.buildingId;
          if (arrival.buildingId === "market") {
            if (!state.mine && state.mines.length) selectActiveMine(state.mines[0]);
            setContext("Market", "Choose Marketplace to post player-priced sell offers, or Company Contracts to assign a repeating truck to one matching mine. Permanent mine workers are still hired at this counter.");
          } else if (arrival.buildingId === "townhall") {
            setContext("Town Hall deeds", townHallText());
          } else if (arrival.buildingId === "garage") {
            setContext("Garage", "Truck cargo and speed now advance through eight smaller upgrade levels. The saw cuts trees; the Shaker removes 85% of dirt from future mine output.");
          } else if (arrival.buildingId === "rental") {
            setContext("Rental Shop", "Rent a saw for the rest of the current day. It detaches when the next day begins.");
          } else if (arrival.buildingId === "newsstand") {
            setContext("Newsstand", "News cycles change prices and reveal what Silas Crowe is doing with miners' waste.");
          } else {
            const townBusiness = businessLots.find(function (business) { return business.id === arrival.buildingId; });
            const record = townBusiness && state.townBusinesses[townBusiness.id];
            if (townBusiness && record && record.status === "announced") {
              setContext("Coming soon · " + townBusiness.label, "Your founding contract supplied this site. Construction finishes on Day " + record.opensDay + "; after opening, its " + materialNames[townBusiness.material].toLowerCase() + " demand affects market prices and recurring contracts.");
            } else if (townBusiness && record && record.status === "open") {
              setContext(townBusiness.label, "Now open on Main Street. Its permanent buying demand supports " + materialNames[townBusiness.material].toLowerCase() + " prices; recurring orders appear at the Market contract desk.");
            } else {
              setContext("Town street", "Choose Market, Town Hall, Garage, Rental Shop, or Newsstand for an available service.");
            }
          }
        } else if (arrival.type === "tree") {
          state.location = "tree";
          setContext("Forest tile", state.sawAttached
            ? "The saw is attached. Use the Cut selected tree button on the map."
            : "You need a saw attachment. Buy one at the Garage or rent one at the Rental Shop.");
        } else if (arrival.type === "cleared") {
          state.location = "cleared";
          setContext(surfaceResourceAt(arrival.x, arrival.y) ? "Visible ore patch" : "Extraction ground", clearedTileText(arrival.x, arrival.y));
        } else if (arrival.type === "gate") {
          const gateIndex = Math.max(1, Math.min(2, Math.round(arrival.gateIndex || 1)));
          const gate = {
            side: "south",
            lane: PLAYER_LANE,
            sectionIndex: gateIndex,
            sectionNumber: gateIndex + 1,
            depth: CLAIM_SECTION_DEPTHS[gateIndex],
            x: PLAYER_ROAD_X,
            y: claimYAtDepth("south", CLAIM_SECTION_DEPTHS[gateIndex]),
            cost: CONFIG.claimGateCosts[gateIndex]
          };
          state.selected = { type: "gate", x: gate.x, y: gate.y, gateIndex: gateIndex };
          state.location = "gate";
          setContext("Section " + gate.sectionNumber + " gate", "The stone walls are impenetrable. Pay $" + gate.cost + " here to open this gate and reach the next extraction field.");
        } else if (arrival.type === "mine") {
          selectActiveMine(state.mines.find(function (mine) { return mine.id === arrival.mineId; }) || state.mine);
          state.location = "mine";
          setContext(mineOwnershipName(), mineStatusText());
        } else if (arrival.type === "warehouse") {
          selectActiveWarehouse(state.warehouses.find(function (warehouse) { return warehouse.id === arrival.warehouseId; }) || state.warehouse);
          state.location = "warehouse";
          setContext("Owned Warehouse Lv" + state.warehouse.level, warehouseStatusText());
        } else if (arrival.type === "mine-site") {
          state.mineParcel = state.mineParcels.find(function (parcel) { return parcel.id === arrival.parcelId; }) || state.mineParcel;
          state.selectedMineParcelId = state.mineParcel ? state.mineParcel.id : null;
          state.location = "mine-site";
          setContext("Mine construction edge", parcelCleared(state.mineParcel)
            ? "You are standing outside the 2×2 boundary. The mine construction controls are ready."
            : "Clear all four highlighted mine tiles, then return to this outside edge to build.");
        } else if (arrival.type === "warehouse-site") {
          state.warehouseParcel = state.warehouseParcels.find(function (parcel) { return parcel.id === arrival.parcelId; }) || state.warehouseParcel;
          state.selectedWarehouseParcelId = state.warehouseParcel ? state.warehouseParcel.id : null;
          state.location = "warehouse-site";
          setContext("Warehouse construction edge", parcelCleared(state.warehouseParcel)
            ? "You are standing outside the 2×2 boundary. The warehouse construction controls are ready."
            : "Clear all four highlighted warehouse tiles, then return to this outside edge to build.");
        } else if (arrival.type === "road") {
          state.location = "road";
          setContext("Roadside", "Click a reachable tree beside the two-tile-wide path, or use Starter tree from the destination list.");
        }
      }

      function destinationAction(value) {
        if (typeof value === "string" && value.indexOf("mine:") === 0) {
          selectMine(state.mines.find(function (mine) { return mine.id === value.slice(5); }));
          return;
        }
        if (typeof value === "string" && value.indexOf("warehouse:") === 0) {
          selectWarehouse(state.warehouses.find(function (warehouse) { return warehouse.id === value.slice(10); }));
          return;
        }
        if (value === "starter") {
          if (isCleared(STARTER_TREE.x, STARTER_TREE.y)) selectClearedTile(STARTER_TREE.x, STARTER_TREE.y);
          else selectTree(STARTER_TREE.x, STARTER_TREE.y);
          return;
        }
        if (value === "mine") {
          selectMine();
          return;
        }
        if (value === "warehouse") {
          selectWarehouse();
          return;
        }
        if (value === "deepclaim") {
          if (state.unlockedClaimZones < 3) {
            const gateIndex = state.unlockedClaimZones;
            selectClaimGate(claimGateAt(PLAYER_ROAD_X, claimYAtDepth("south", CLAIM_SECTION_DEPTHS[gateIndex])));
          } else {
            const deepestY = claimYAtDepth("south", CLAIM_DEPTH - 2);
            queueTravel([{ x: PLAYER_ROAD_X + 1, y: deepestY }], { type: "cleared", x: PLAYER_ROAD_X + 1, y: deepestY }, "the deepest open extraction field");
          }
          return;
        }
        const building = buildings.find(function (item) { return item.id === value; });
        if (building) travelToBuilding(building);
      }

      function refreshCompanyDestinationOptions() {
        if (!el.destination || !el.destination.options || typeof document.createElement !== "function") return;
        Array.from(el.destination.options).forEach(function (option) {
          if (option.dataset && option.dataset.companySite === "true") option.remove();
        });
        state.mines.forEach(function (mine, index) {
          const option = document.createElement("option");
          option.value = "mine:" + mine.id;
          option.textContent = "Mine " + (index + 1) + " · " + materialNames[mine.material] + " Lv" + mine.level;
          option.dataset.companySite = "true";
          el.destination.appendChild(option);
        });
        state.warehouses.forEach(function (warehouse, index) {
          const option = document.createElement("option");
          option.value = "warehouse:" + warehouse.id;
          option.textContent = "Warehouse " + (index + 1) + " · Lv" + warehouse.level;
          option.dataset.companySite = "true";
          el.destination.appendChild(option);
        });
      }

      function handleWorldSelection(x, y) {
        if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) return;
        if (state.roadPlanning) {
          planRoadPoint(x, y);
          return;
        }
        const clickedGate = claimGateAt(x, y);
        if (clickedGate) {
          selectClaimGate(clickedGate);
          return;
        }
        const building = buildingAt(x, y);
        if (building) {
          travelToBuilding(building);
          return;
        }
        const clickedWarehouse = warehouseAt(x, y) || state.warehouses.find(function (warehouse) {
          const door = structureDoor(warehouse);
          return door.x === x && door.y === y;
        });
        if (clickedWarehouse) {
          selectWarehouse(clickedWarehouse);
          return;
        }
        const clickedMine = mineAt(x, y) || state.mines.find(function (mine) {
          const door = structureDoor(mine);
          return door.x === x && door.y === y;
        });
        if (clickedMine) {
          selectMine(clickedMine);
          return;
        }
        if (isTreeAt(x, y)) {
          selectTree(x, y);
          return;
        }
        const clickedMineParcel = mineParcelAt(x, y);
        if (clickedMineParcel && (clickedMineParcel.status === "leased" || clickedMineParcel.status === "owned")) {
          state.mineParcel = clickedMineParcel;
          state.selectedMineParcelId = clickedMineParcel.id;
          state.warehouseParcel = warehouseParcelForMineParcel(clickedMineParcel) || state.warehouseParcel;
          const parcelMine = state.mines.find(function (mine) { return mine.parcelId === clickedMineParcel.id; });
          if (parcelMine) selectMine(parcelMine);
          else {
            state.mine = null;
            state.selectedMineId = null;
            state.selected = { type: "mine-site", x: clickedMineParcel.x, y: clickedMineParcel.y };
            queueTravel(parcelPerimeterTargets(clickedMineParcel), { type: "mine-site", parcelId: clickedMineParcel.id }, "the outside edge of this mine parcel");
          }
          return;
        }
        const clickedWarehouseParcel = warehouseParcelAt(x, y);
        if (clickedWarehouseParcel && clickedWarehouseParcel.status === "owned") {
          state.warehouseParcel = clickedWarehouseParcel;
          state.selectedWarehouseParcelId = clickedWarehouseParcel.id;
          const parcelWarehouse = state.warehouses.find(function (warehouse) { return warehouse.parcelId === clickedWarehouseParcel.id; });
          if (parcelWarehouse) selectWarehouse(parcelWarehouse);
          else {
            state.warehouse = null;
            state.selectedWarehouseId = null;
            state.selected = { type: "warehouse-site", x: clickedWarehouseParcel.x, y: clickedWarehouseParcel.y };
            queueTravel(parcelPerimeterTargets(clickedWarehouseParcel), { type: "warehouse-site", parcelId: clickedWarehouseParcel.id }, "the outside edge of this warehouse parcel");
          }
          return;
        }
        if (isSurveyableGround(x, y)) {
          selectClearedTile(x, y);
          return;
        }
        if (isPassable(x, y)) {
          state.selected = { type: "road", x: x, y: y };
          queueTravel([{ x: x, y: y }], { type: "road" }, "the selected map tile");
          return;
        }
        if (isPlayerClaimTile(x, y) && !claimZoneUnlockedAt(x, y)) {
          setContext("Section locked", "Reach the gold gate in the stone divider and pay its access price before entering this field.");
          return;
        }
        if (isClaimWallCell(x, y)) {
          setContext("Impenetrable stone wall", "The truck cannot cross this boundary. Use the gold gate at the center of your claim section.");
          return;
        }
        if (insideAnyClaim(x, y)) {
          setContext("Other player claim", "This claim and its access path are locked. P4 is your thirty-tile-wide area south of town.");
          return;
        }
        setContext("Town edge", "Choose a town building or road tile.");
      }

      function resourceAt(x, y) {
        if (x === STARTER_TREE.x && y === STARTER_TREE.y) return { material: "stone", ratio: .45 };
        const depth = Math.max(0, Math.min(CLAIM_DEPTH - 1, y - SOUTH_TOP));
        const surfaceMaterial = surfaceResourceAt(x, y);
        let options;
        if (depth < 25) options = ["stone", "stone", "clay", "coal"];
        else if (depth < 60) options = ["coal", "iron", "copper", "tin"];
        else if (depth < 95) options = ["iron", "copper", "tin", "quartz", "silver"];
        else options = ["quartz", "silver", "gold", "sapphire"];
        const hash = Math.abs(x * 31 + y * 17 + depth * 13);
        return {
          material: surfaceMaterial || options[hash % options.length],
          ratio: Math.min(.9, (surfaceMaterial ? .3 : .38) + depth / 250 + (hash % 4) * .03)
        };
      }

      function mineBandForDepth(depth) {
        const safeDepth = Math.max(0, Math.min(CLAIM_DEPTH - 1, Number(depth) || 0));
        return mineDepthBands.find(function (band) { return safeDepth >= band.min && safeDepth <= band.max; }) || mineDepthBands[0];
      }

      function mineMaterialForLevel(mine, levelOverride) {
        if (!mine) return "stone";
        const level = Math.max(1, Math.min(CONFIG.maxMineLevel, Math.round(levelOverride || mine.level || 1)));
        const band = mineBandForDepth(mine.depth);
        const baseMaterial = band.materials.includes(mine.baseMaterial) ? mine.baseMaterial : band.materials[0];
        const baseRank = Math.max(0, band.materials.indexOf(baseMaterial));
        const drillAdvances = Math.floor((level - 1) / 2);
        return band.materials[Math.min(band.materials.length - 1, baseRank + drillAdvances)];
      }

      function nextMineMaterial(mine) {
        if (!mine || mine.level >= CONFIG.maxMineLevel) return mine ? mine.material : "stone";
        return mineMaterialForLevel(mine, mine.level + 1);
      }

      function nextMaterialUnlockLevel(mine) {
        if (!mine) return null;
        const current = mineMaterialForLevel(mine, mine.level);
        for (let level = mine.level + 1; level <= CONFIG.maxMineLevel; level += 1) {
          if (mineMaterialForLevel(mine, level) !== current) return level;
        }
        return null;
      }

      function isNextToSelected() {
        if (!state.selected) return false;
        return Math.abs(state.player.x - state.selected.x) + Math.abs(state.player.y - state.selected.y) === 1;
      }

      function clearSelectedTree() {
        if (!state.selected || state.selected.type !== "tree" || !isNextToSelected()) return;
        if (!state.sawAttached) {
          setContext("Saw required", "Buy a saw at the Garage or rent one at the Rental Shop before cutting trees.");
          return;
        }
        if (freeCargo() < .5) {
          setContext("Truck full", "Drive to the Market to sell, or unload at an owned warehouse.");
          return;
        }
        const x = state.selected.x;
        const y = state.selected.y;
        state.cleared.add(keyFor(x, y));
        state.cargo.logs += .5;
        setTruckHeading(state.player.x, state.player.y, x, y);
        state.player.x = x;
        state.player.y = y;
        state.path = [];
        state.menuOpen = false;
        state.selected = { type: "cleared", x: x, y: y };
        state.location = "cleared";
        setContext("Tile cleared", clearedTileText(x, y), "saw");
      }

      function clearedTileText(x, y) {
        if (isPlayerClaimPath(x, y)) {
          return "Open road ground. Start a two-wide Road Survey at Town Hall, mark the route, then pay the approved stone-and-labor contract. Closed stone gates still require separate access.";
        }
        const surfaceMaterial = surfaceResourceAt(x, y);
        const mineParcel = mineParcelAt(x, y);
        if (mineParcel) {
          return parcelLabel(mineParcel) + ". Clear all four highlighted cells. The mine can operate while leased and becomes an Owned Mine after buyout.";
        }
        if (warehouseParcelAt(x, y)) {
          return "Owned warehouse parcel. Clear all four cells, then build the 2×2 warehouse.";
        }
        if (surfaceMaterial) {
          return "Visible " + materialNames[surfaceMaterial].toLowerCase() + " outcrop. Prospect here to test the 2×2 deposit, then lease it and build a mine to collect full loads.";
        }
        return prospectsRemaining() > 0
          ? "Open extraction ground. Prospect this tile to survey a 2×2 mine parcel. You have " + prospectsRemaining() + " survey" + (prospectsRemaining() === 1 ? "" : "s") + " left today."
          : state.prospectorHired
            ? "Open extraction ground. Your permanent prospector has finished today's two surveys and returns tomorrow."
            : "Open extraction ground. Hire the permanent prospector at Town Hall.";
      }

      function todaysProspectsUsed() {
        return state.prospectorDay === state.day ? state.prospectsUsedToday : 0;
      }

      function prospectsRemaining() {
        if (!state.prospectorHired) return 0;
        return Math.max(0, CONFIG.prospectsPerDay - todaysProspectsUsed());
      }

      function prepareProspectorForToday() {
        if (state.prospectorDay === state.day) return;
        state.prospectorDay = state.day;
        state.prospectsUsedToday = 0;
      }

      function selectedSurveyTile() {
        if (!state.selected || state.selected.type !== "cleared") return null;
        if (!isSurveyableGround(state.selected.x, state.selected.y)) return null;
        return state.selected;
      }

      function selectedTileMatchesCurrentSurvey() {
        const tile = selectedSurveyTile();
        return Boolean(tile && state.surveyParcel &&
          state.surveyParcel.x === tile.x && state.surveyParcel.y === Math.max(0, tile.y - 1));
      }

      function prospectSelectedTile() {
        prepareProspectorForToday();
        if (!state.prospectorHired) {
          setContext("Prospector required", "Hire the permanent prospector at Town Hall before ordering a survey.");
          return;
        }
        if (prospectsRemaining() <= 0) {
          setContext("Daily surveys complete", "Both surveys are used for Day " + state.day + ". The permanent prospector automatically receives two more at midnight.");
          return;
        }
        const tile = selectedSurveyTile();
        if (!tile) {
          setContext("Select survey ground", "Close the menu, choose a cleared tile beside the road, then prospect there or return to Town Hall to send the prospector.");
          return;
        }
        if (isPavedClaimRoad(tile.x, tile.y) || isPlayerClaimPath(tile.x, tile.y)) {
          setContext("Road reserve", "This centerline is reserved for the two-tile-wide road. Prospect a cleared tile beside it instead.");
          return;
        }
        if (selectedTileMatchesCurrentSurvey()) {
          setContext("Choose a second tile", "That tile already has today's first survey. Select a different cleared side tile for survey two; the second result will replace the unleased first result.");
          return;
        }
        const standingOnTile = state.location === "cleared" && state.player.x === tile.x && state.player.y === tile.y;
        const orderingAtTownHall = state.location === "townhall";
        if (!standingOnTile && !orderingAtTownHall) {
          setContext("Prospector waiting", "Stand on the selected cleared tile or drive to Town Hall to send the prospector there.");
          return;
        }
        const candidate = {
          id: allocateSiteId("survey"),
          x: tile.x,
          y: Math.max(SOUTH_TOP, tile.y - 1),
          w: 2,
          h: 2
        };
        if (parcelConflicts(candidate)) {
          setContext("Survey area unavailable", "This 2×2 result would overlap a road, another mine, a warehouse parcel, or the edge of P4. Choose a different cleared side tile.");
          return;
        }
        const resource = resourceAt(tile.x, tile.y);
        const replacingSurvey = Boolean(state.surveyParcel);
        state.prospectsUsedToday = Math.min(CONFIG.prospectsPerDay, todaysProspectsUsed() + 1);
        state.surveyParcel = Object.assign(candidate, {
          status: "surveyed",
          material: resource.material,
          ratio: resource.ratio,
          depth: Math.max(0, candidate.y - SOUTH_TOP),
          leaseCredit: 0,
          lastLeaseDay: 0
        });
        state.mineParcel = state.surveyParcel;
        state.selectedMineParcelId = state.surveyParcel.id;
        const remaining = Math.max(0, CONFIG.prospectsPerDay - state.prospectsUsedToday);
        setContext(replacingSurvey ? "Parcel re-prospected" : "Surveyed 2×2 parcel", materialNames[resource.material] + " · " + Math.round(resource.ratio * 100) + "% dirt. " + (remaining > 0
          ? "Survey one of two is complete. Choose a different cleared side tile for the second survey before leasing this result."
          : "Your two surveys are used for today. Drive to Town Hall to lease this result."));
      }

      function parcelCells(parcel) {
        if (!parcel) return [];
        const cells = [];
        for (let y = parcel.y; y < parcel.y + parcel.h; y += 1) {
          for (let x = parcel.x; x < parcel.x + parcel.w; x += 1) cells.push({ x: x, y: y });
        }
        return cells;
      }

      function parcelCleared(parcel) {
        return Boolean(parcel) && parcelCells(parcel).every(function (cell) { return isSurveyableGround(cell.x, cell.y); });
      }

      function besideParcel(parcel) {
        if (!parcel || inRect(state.player.x, state.player.y, parcel)) return false;
        return parcelCells(parcel).some(function (cell) {
          return Math.abs(state.player.x - cell.x) + Math.abs(state.player.y - cell.y) === 1;
        });
      }

      function townHallText() {
        const surveyText = state.prospectorHired
          ? "Your prospector is permanently employed with " + prospectsRemaining() + " of " + CONFIG.prospectsPerDay + " surveys left today. "
          : "Hire the permanent prospector here for $" + CONFIG.prospectorCost + ". ";
        if (state.surveyParcel) return surveyText + "The surveyed 2×2 mine parcel is ready for a $" + CONFIG.landLeasePerDay + " daily lease. Leasing commits this result and opens the prospector for another claim.";
        if (!state.mineParcel) return surveyText + "Explore the open first extraction field, choose ground outside the road reserve, and survey a visible outcrop or soil patch.";
        if (state.mineParcel.status === "leased") return surveyText + "Lease payments count toward the $" + CONFIG.landPurchasePrice + " deed. Remaining buyout: $" + landBuyoutRemaining() + ".";
        if (state.mineParcel.status === "owned" && state.warehouseParcel && state.warehouseParcel.status === "available") return surveyText + "Your mine land is owned. The neighboring 2×2 warehouse parcel costs $" + CONFIG.warehouseLandPrice + ".";
        return surveyText + "Your company has " + state.mines.length + " of " + mineSlotLimit() + " active mine slots and " + state.warehouses.length + " warehouses. Road Surveys create turning, two-wide routes; Town Hall then quotes purchased stone and labor at the live market price.";
      }

      function leaseMineLand() {
        if (state.location !== "townhall" || !state.surveyParcel || state.cash < CONFIG.landLeasePerDay) return;
        state.cash -= CONFIG.landLeasePerDay;
        const parcel = state.surveyParcel;
        parcel.status = "leased";
        parcel.leaseCredit += CONFIG.landLeasePerDay;
        parcel.lastLeaseDay = state.day;
        state.mineParcels.push(parcel);
        state.surveyParcel = null;
        state.mineParcel = parcel;
        state.selectedMineParcelId = parcel.id;
        state.warehouseParcel = warehouseParcelForMineParcel(parcel);
        state.selectedWarehouseParcelId = state.warehouseParcel ? state.warehouseParcel.id : null;
        setContext("Mine land leased", "$" + CONFIG.landLeasePerDay + " paid and credited toward the $" + CONFIG.landPurchasePrice + " purchase. Claim " + state.mineParcels.length + " is committed, and the prospector can now survey another claim.");
      }

      function landBuyoutRemaining(parcel) {
        const target = parcel || state.mineParcel;
        if (!target) return CONFIG.landPurchasePrice;
        return Math.max(0, CONFIG.landPurchasePrice - target.leaseCredit);
      }

      function buyMineLand() {
        if (state.location !== "townhall" || !state.mineParcel || state.mineParcel.status !== "leased") return;
        const remaining = landBuyoutRemaining();
        if (state.cash < remaining) {
          setContext("Buyout not ready", "The deed needs $" + remaining + ". Mine and sell another load, or keep making credited lease payments.");
          return;
        }
        state.cash -= remaining;
        state.mineParcel.status = "owned";
        state.mineParcel.leaseCredit = CONFIG.landPurchasePrice;
        state.warehouseParcel = warehouseParcelForMineParcel(state.mineParcel) || findWarehouseParcelFor(state.mineParcel);
        if (state.warehouseParcel && !state.warehouseParcels.includes(state.warehouseParcel)) state.warehouseParcels.push(state.warehouseParcel);
        state.selectedWarehouseParcelId = state.warehouseParcel ? state.warehouseParcel.id : null;
        setContext("Mine land owned", state.warehouseParcel
          ? "The Leased Mine is now an Owned Mine. Its adjacent highlighted 2×2 parcel can be purchased for a warehouse."
          : "The Leased Mine is now an Owned Mine. Clear more neighboring land before adding its warehouse parcel.");
      }

      function buyWarehouseLand() {
        if (state.location !== "townhall" || !state.warehouseParcel || state.warehouseParcel.status !== "available" || state.cash < CONFIG.warehouseLandPrice) return;
        state.cash -= CONFIG.warehouseLandPrice;
        state.warehouseParcel.status = "owned";
        setContext("Warehouse land owned", "Clear any trees inside the highlighted four-cell parcel, then build the 2×2 warehouse for $" + CONFIG.warehouseBuildCost + ".");
      }

      function mineOwnershipName() {
        if (!state.mine) return "No mine";
        const parcel = parcelForMine(state.mine);
        const ownership = parcel && parcel.status === "owned" ? "Owned Mine" : "Leased Mine";
        return ownership + " " + (state.mines.indexOf(state.mine) + 1) + " · Lv" + state.mine.level;
      }

      function buildMine() {
        const permitted = state.mineParcel && (state.mineParcel.status === "leased" || state.mineParcel.status === "owned");
        const existingMine = state.mineParcel && state.mines.find(function (mine) { return mine.parcelId === state.mineParcel.id; });
        if (!permitted || existingMine || !parcelCleared(state.mineParcel) || !besideParcel(state.mineParcel) || state.cash < CONFIG.mineBuildCost) return;
        if (state.mines.length >= mineSlotLimit()) {
          const nextUnlock = CONFIG.mineSlotUnlockDays[state.mines.length] || CONFIG.mineSlotUnlockDays[CONFIG.mineSlotUnlockDays.length - 1];
          setContext("Mine slot locked", "Your company can operate " + mineSlotLimit() + " mine" + (mineSlotLimit() === 1 ? "" : "s") + " today. The next operating permit unlocks on Day " + nextUnlock + ".");
          return;
        }
        state.cash -= CONFIG.mineBuildCost;
        const newMine = {
          id: allocateSiteId("mine"),
          parcelId: state.mineParcel.id,
          x: state.mineParcel.x,
          y: state.mineParcel.y,
          w: 2,
          h: 2,
          level: 1,
          baseMaterial: state.mineParcel.material,
          material: state.mineParcel.material,
          depth: Number.isFinite(state.mineParcel.depth) ? state.mineParcel.depth : Math.max(0, state.mineParcel.y - SOUTH_TOP),
          ratio: state.mineParcel.ratio,
          stockMaterial: 0,
          stockDirt: 0,
          doorX: state.player.x,
          doorY: state.player.y
        };
        newMine.material = mineMaterialForLevel(newMine);
        state.mines.push(newMine);
        state.mineParcel.mineId = newMine.id;
        selectActiveMine(newMine);
        const door = structureDoor(newMine);
        state.player.x = door.x;
        state.player.y = door.y;
        state.path = [];
        state.selected = { type: "mine", x: newMine.x, y: newMine.y };
        state.location = "mine";
        setContext(mineOwnershipName(), materialNames[newMine.material] + " production has begun at depth " + newMine.depth + ". You now operate " + state.mines.length + " of " + mineSlotLimit() + " available mine slots.");
      }

      function mineCapacity() {
        return state.mine ? CONFIG.mineStorageByLevel[state.mine.level] : 0;
      }

      function mineStockUsed() {
        return state.mine ? state.mine.stockMaterial + state.mine.stockDirt : 0;
      }

      function mineStatusText() {
        if (!state.mine) return "No mine is active.";
        const nextMaterial = nextMineMaterial(state.mine);
        return materialNames[state.mine.material] + " at forest depth " + state.mine.depth + " · stockpile " + round1(mineStockUsed()).toFixed(1) + " / " + mineCapacity().toFixed(1) + " t · " + round1(state.mine.stockMaterial).toFixed(1) + " material and " + round1(state.mine.stockDirt).toFixed(1) + " dirt · " + state.workers + " hired worker" + (state.workers === 1 ? "" : "s") + (nextMaterial !== state.mine.material ? " · next drill tier: " + materialNames[nextMaterial] + "." : ".");
      }

      function produceMines() {
        if (!state.mines.length) return;
        const dirtKeptShare = state.shaker ? .15 : 1;
        state.mines.forEach(function (mine) {
          const capacity = CONFIG.mineStorageByLevel[mine.level];
          const used = mine.stockMaterial + mine.stockDirt;
          const free = capacity - used;
          if (free <= .01) return;
          mine.material = mineMaterialForLevel(mine);
          const cargoPerRaw = (1 - mine.ratio) + mine.ratio * dirtKeptShare;
          const staffedOutput = CONFIG.mineOutputByLevel[mine.level] * CONFIG.workerOutputMultiplierByCount[state.workers];
          const raw = Math.min(staffedOutput, free / cargoPerRaw);
          mine.stockMaterial += raw * (1 - mine.ratio);
          mine.stockDirt += raw * mine.ratio * dirtKeptShare;
        });
        if (state.location === "mine") {
          state.contextTitle = mineOwnershipName();
          state.contextText = mineStatusText();
        }
        renderInterface();
      }

      function advanceGameTime(minutes) {
        state.minutes += minutes;
        while (state.minutes >= 24 * 60) {
          state.minutes -= 24 * 60;
          state.day += 1;
          processTownBusinessOpenings();
          applyDailyMarket();
          processDailyLease();
        }
      }

      function processDailyLease() {
        if (state.prospectorDay !== state.day) {
          state.prospectorDay = state.day;
          state.prospectsUsedToday = 0;
        }
        if (state.sawOwnership === "rented" && state.day > state.sawRentalDay) {
          state.sawAttached = false;
          state.sawOwnership = null;
          state.sawRentalDay = 0;
        }
        state.mineParcels.filter(function (parcel) { return parcel.status === "leased"; }).forEach(function (parcel) {
          if (state.cash < CONFIG.landLeasePerDay) return;
          state.cash -= CONFIG.landLeasePerDay;
          parcel.leaseCredit = Math.min(CONFIG.landPurchasePrice, parcel.leaseCredit + CONFIG.landLeasePerDay);
          parcel.lastLeaseDay = state.day;
        });
      }

      function atStructureDoor(structure) {
        if (!structure) return false;
        const door = structureDoor(structure);
        return state.player.x === door.x && state.player.y === door.y;
      }

      function loadMine() {
        if (!state.mine || !atStructureDoor(state.mine) || mineStockUsed() <= .01 || freeCargo() <= .01) return;
        const amount = Math.min(freeCargo(), mineStockUsed());
        const materialShare = state.mine.stockMaterial / mineStockUsed();
        const materialMoved = amount * materialShare;
        const dirtMoved = amount - materialMoved;
        state.mine.stockMaterial -= materialMoved;
        state.mine.stockDirt -= dirtMoved;
        state.cargo[state.mine.material] += materialMoved;
        state.cargo.dirt += dirtMoved;
        setContext("Truck loaded", round1(materialMoved).toFixed(1) + " t " + state.mine.material + " and " + round1(dirtMoved).toFixed(1) + " t dirt. Post clean material on the Market Exchange, or store it in a warehouse while waiting for demand.");
      }

      function upgradeMine() {
        if (!state.mine || state.location !== "mine" || state.mine.level >= CONFIG.maxMineLevel) return;
        const activeContract = activeCompanyContractForMine(state.mine);
        if (activeContract && mineMaterialForLevel(state.mine, state.mine.level + 1) !== state.mine.material) {
          setContext("Contract seam locked", "Finish the " + activeContract.buyer + " order before drilling into a different material. Output-only levels remain available while a truck is assigned.");
          return;
        }
        const parcel = parcelForMine(state.mine);
        if (state.mine.level >= 3 && (!parcel || parcel.status !== "owned")) {
          setContext("Ownership required", "A Leased Mine can reach Level 3. Purchase the land before upgrading to Level 4 and beyond.");
          return;
        }
        const cost = CONFIG.mineUpgradeCosts[state.mine.level];
        if (state.cash < cost) return;
        state.cash -= cost;
        const oldMaterial = state.mine.material;
        state.mine.level += 1;
        state.mine.material = mineMaterialForLevel(state.mine);
        setContext(mineOwnershipName(), (oldMaterial !== state.mine.material ? "The deeper drill reached " + materialNames[state.mine.material] + ". " : "") + "Output is now " + CONFIG.mineOutputByLevel[state.mine.level].toFixed(2) + " raw tons per cycle and the stockpile holds " + mineCapacity() + " tons.");
      }

      function buildWarehouse() {
        const existingWarehouse = state.warehouseParcel && state.warehouses.find(function (warehouse) { return warehouse.parcelId === state.warehouseParcel.id; });
        if (!state.warehouseParcel || state.warehouseParcel.status !== "owned" || existingWarehouse || !parcelCleared(state.warehouseParcel) || !besideParcel(state.warehouseParcel) || state.cash < CONFIG.warehouseBuildCost) return;
        state.cash -= CONFIG.warehouseBuildCost;
        const newWarehouse = {
          id: allocateSiteId("warehouse"),
          parcelId: state.warehouseParcel.id,
          x: state.warehouseParcel.x,
          y: state.warehouseParcel.y,
          w: 2,
          h: 2,
          level: 1,
          storage: emptyMaterialStore(),
          doorX: state.player.x,
          doorY: state.player.y
        };
        state.warehouses.push(newWarehouse);
        state.warehouseParcel.warehouseId = newWarehouse.id;
        selectActiveWarehouse(newWarehouse);
        const door = structureDoor(newWarehouse);
        state.player.x = door.x;
        state.player.y = door.y;
        state.path = [];
        state.selected = { type: "warehouse", x: newWarehouse.x, y: newWarehouse.y };
        state.location = "warehouse";
        setContext("Owned Warehouse " + state.warehouses.length + " · Lv1", "Storage capacity is " + warehouseCapacity() + " tons. You can build one warehouse for every owned mine parcel.");
      }

      function warehouseCapacity() {
        return state.warehouse ? CONFIG.warehouseCapacityByLevel[state.warehouse.level] : 0;
      }

      function warehouseStatusText() {
        if (!state.warehouse) return "No warehouse is active.";
        return "Stored " + round1(usedStore(state.warehouse.storage)).toFixed(1) + " / " + warehouseCapacity().toFixed(1) + " t · " + cargoSummary(state.warehouse.storage) + ".";
      }

      function unloadWarehouse() {
        if (!state.warehouse || state.location !== "warehouse" || !atStructureDoor(state.warehouse)) return;
        let free = warehouseCapacity() - usedStore(state.warehouse.storage);
        cargoKeys.forEach(function (key) {
          if (free <= .01) return;
          const amount = Math.min(state.cargo[key], free);
          state.cargo[key] -= amount;
          state.warehouse.storage[key] += amount;
          free -= amount;
        });
        setContext("Warehouse unloaded", warehouseStatusText());
      }

      function loadWarehouse() {
        if (!state.warehouse || state.location !== "warehouse" || !atStructureDoor(state.warehouse)) return;
        let free = freeCargo();
        cargoKeys.forEach(function (key) {
          if (free <= .01) return;
          const amount = Math.min(state.warehouse.storage[key], free);
          state.warehouse.storage[key] -= amount;
          state.cargo[key] += amount;
          free -= amount;
        });
        setContext("Truck reloaded", warehouseStatusText());
      }

      function upgradeWarehouse() {
        if (!state.warehouse || state.location !== "warehouse" || state.warehouse.level >= CONFIG.maxWarehouseLevel) return;
        const cost = CONFIG.warehouseUpgradeCosts[state.warehouse.level];
        if (state.cash < cost) return;
        state.cash -= cost;
        state.warehouse.level += 1;
        setContext("Owned Warehouse Lv" + state.warehouse.level, "Upgrade complete. Capacity increased to " + warehouseCapacity() + " tons.");
      }

      function hireProspector() {
        if (state.location !== "townhall" || state.prospectorHired || state.cash < CONFIG.prospectorCost) return;
        state.cash -= CONFIG.prospectorCost;
        state.prospectorHired = true;
        prepareProspectorForToday();
        setContext("Permanent prospector hired", "The prospector stays on your company roster and provides two surveys every day. Today's remaining surveys: " + prospectsRemaining() + ".");
      }

      function nextWorkerCost() {
        return state.workers < CONFIG.maxWorkers ? CONFIG.workerCosts[state.workers] : 0;
      }

      function hireMineWorker() {
        const cost = nextWorkerCost();
        if (state.location !== "market" || !state.mine || state.workers >= CONFIG.maxWorkers || state.cash < cost) return;
        state.cash -= cost;
        state.workers += 1;
        const oldMultiplier = CONFIG.workerOutputMultiplierByCount[state.workers - 1];
        const newMultiplier = CONFIG.workerOutputMultiplierByCount[state.workers];
        const addedPercent = Math.round((newMultiplier - oldMultiplier) * 100);
        setContext("Permanent mine worker hired", state.workers + " worker" + (state.workers === 1 ? " now supports" : "s now support") + " your mine. This hire adds " + addedPercent + "% base production; the crew now produces at " + Math.round(newMultiplier * 100) + "% and appears beside the mine.");
      }

      function absoluteGameMinutes() {
        return (state.day - 1) * 24 * 60 + state.minutes;
      }

      function activeHaulForMine(mine) {
        if (!mine) return null;
        return state.hauls.find(function (haul) { return haul.mineId === mine.id; }) || null;
      }

      function activeCompanyContractForMine(mine) {
        if (!mine) return null;
        return state.companyContracts.find(function (contract) { return contract.mineId === mine.id && contract.status === "active"; }) || null;
      }

      function haulerMaterialShare() {
        if (!state.mine) return 0;
        const stock = mineStockUsed();
        if (stock > .01) return state.mine.stockMaterial / stock;
        const dirtKeptShare = state.shaker ? .15 : 1;
        const material = 1 - state.mine.ratio;
        return material / (material + state.mine.ratio * dirtKeptShare);
      }

      function projectedHaulNet(sizeKey) {
        const hauler = CONFIG.haulers[sizeKey];
        if (!hauler || !state.mine) return 0;
        const gross = hauler.capacity * haulerMaterialShare() * (prices[state.mine.material] || 0);
        return Math.round(gross - hauler.cost);
      }

      function haulMinutesRemaining(job) {
        return Math.max(0, Math.ceil(job.completeAt - absoluteGameMinutes()));
      }

      function dispatchHauler(sizeKey) {
        const hauler = CONFIG.haulers[sizeKey];
        const currentHaul = activeHaulForMine(state.mine);
        const activeMineHauls = state.mine ? state.hauls.filter(function (job) { return job.mineId === state.mine.id; }).length : 0;
        if (!hauler || state.location !== "mine" || !state.mine || currentHaul || activeMineHauls >= CONFIG.maxActiveHaulsPerMine || state.cash < hauler.cost) return;
        const stock = mineStockUsed();
        if (stock + .001 < hauler.capacity) {
          setContext("Hauler not full", hauler.label + " requires a full " + hauler.capacity + "-ton load. Your mine currently holds " + round1(stock).toFixed(1) + " tons.");
          return;
        }
        const materialShare = state.mine.stockMaterial / stock;
        const materialTons = hauler.capacity * materialShare;
        const dirtTons = hauler.capacity - materialTons;
        state.mine.stockMaterial = Math.max(0, state.mine.stockMaterial - materialTons);
        state.mine.stockDirt = Math.max(0, state.mine.stockDirt - dirtTons);
        state.cash -= hauler.cost;
        const dispatchedAt = absoluteGameMinutes();
        state.hauls.push({
          size: sizeKey,
          mineId: state.mine.id,
          material: state.mine.material,
          materialTons: materialTons,
          dirtTons: dirtTons,
          dispatchedAt: dispatchedAt,
          completeAt: dispatchedAt + hauler.travelMinutes
        });
        const expectedGross = Math.round(materialTons * (prices[state.mine.material] || 0));
        const expectedNet = expectedGross - hauler.cost;
        setContext(hauler.label + " truck hired for Mine " + (state.mines.indexOf(state.mine) + 1), "A full " + hauler.capacity + "-ton load left this mine. Fee: $" + hauler.cost + " per load. Estimated net: " + (expectedNet >= 0 ? "+$" : "-$") + Math.abs(expectedNet) + ". This mine can hire another truck after delivery in " + hauler.travelMinutes + " game minutes.");
      }

      function processHauls() {
        const now = absoluteGameMinutes();
        const completed = state.hauls.filter(function (job) { return now >= job.completeAt; });
        if (!completed.length) return;
        state.hauls = state.hauls.filter(function (job) { return now < job.completeAt; });
        let grossTotal = 0;
        let feeTotal = 0;
        let dirtTotal = 0;
        completed.forEach(function (job) {
          grossTotal += job.materialTons * (prices[job.material] || 0);
          feeTotal += CONFIG.haulers[job.size].cost;
          dirtTotal += job.dirtTons;
        });
        state.cash += grossTotal;
        state.wasteToCrowe += dirtTotal;
        const net = Math.round(grossTotal - feeTotal);
        setContext(completed.length === 1 ? CONFIG.haulers[completed[0].size].label + " haul delivered" : completed.length + " mine hauls delivered", "Market sales: $" + Math.round(grossTotal) + ". After $" + feeTotal + " in load fees, the completed trip" + (completed.length === 1 ? "" : "s") + " earned " + (net >= 0 ? "$" + net : "lost $" + Math.abs(net)) + ". Crowe collected " + round1(dirtTotal).toFixed(1) + " tons of dirt.");
      }

      function buySawAttachment() {
        if (state.location !== "garage" || state.sawOwnership === "owned" || state.cash < CONFIG.sawPurchaseCost) return;
        state.cash -= CONFIG.sawPurchaseCost;
        state.sawAttached = true;
        state.sawOwnership = "owned";
        state.sawRentalDay = 0;
        setContext("Saw purchased", "The saw is permanently attached to the front of your truck. Tree-cutting controls now appear when you reach a tree.");
      }

      function rentSawAttachment() {
        if (state.location !== "rental" || state.sawAttached || state.cash < CONFIG.sawRentalCost) return;
        state.cash -= CONFIG.sawRentalCost;
        state.sawAttached = true;
        state.sawOwnership = "rented";
        state.sawRentalDay = state.day;
        setContext("Saw rented", "The saw is attached through the end of Day " + state.day + ". Tree-cutting controls now appear when you reach a tree.");
      }

      function openMarketScreen(tab) {
        if (state.location !== "market") return;
        marketScreenOpen = true;
        marketScreenTab = tab === "contracts" ? "contracts" : "exchange";
        newsReaderOpen = false;
        state.menuOpen = true;
        renderInterface();
      }

      function closeMarketScreen() {
        marketScreenOpen = false;
        renderInterface();
        if (el.marketplace && !el.marketplace.hidden) el.marketplace.focus({ preventScroll: true });
      }

      function marketableCargoMaterials() {
        return cargoKeys.filter(function (material) { return material !== "dirt" && state.cargo[material] >= .05; });
      }

      function renderExchangeTerminal() {
        if (!el.exchangeBoard || !el.exchangeOrders || !el.exchangeMaterial) return;
        el.exchangeBoard.innerHTML = Object.keys(basePrices).map(function (material) {
          const current = prices[material];
          const change = Math.round((current / basePrices[material] - 1) * 100);
          const tone = change > 0 ? "rise" : change < 0 ? "fall" : "steady";
          return '<button type="button" class="exchange-quote" data-exchange-pick="' + material + '" data-tone="' + tone + '">' +
            '<span><b>' + detailText(marketSymbols[material]) + '</b><small>' + detailText(materialNames[material]) + '</small></span>' +
            '<strong>$' + current + '<small>/t</small></strong><em>' + (change > 0 ? "▲" : change < 0 ? "▼" : "•") + Math.abs(change) + '%</em>' +
          '</button>';
        }).join("");

        const previous = el.exchangeMaterial.value;
        const available = marketableCargoMaterials();
        el.exchangeMaterial.innerHTML = available.length ? available.map(function (material) {
          return '<option value="' + material + '">' + detailText(materialNames[material]) + ' · ' + round1(state.cargo[material]).toFixed(1) + ' t in truck</option>';
        }).join("") : '<option value="">Truck has no sellable cargo</option>';
        if (available.includes(previous)) el.exchangeMaterial.value = previous;
        const selectedMaterial = el.exchangeMaterial.value || available[0] || "";
        if (selectedMaterial && Number(el.exchangeQuantity.value) > state.cargo[selectedMaterial]) el.exchangeQuantity.value = round1(state.cargo[selectedMaterial]).toFixed(1);
        if (selectedMaterial && (!Number(el.exchangePrice.value) || el.exchangePrice.dataset.material !== selectedMaterial)) {
          el.exchangePrice.value = String(prices[selectedMaterial]);
          el.exchangePrice.dataset.material = selectedMaterial;
        }
        if (selectedMaterial) el.exchangeQuantity.max = round1(state.cargo[selectedMaterial]).toFixed(1);
        el.exchangeOffer.disabled = !selectedMaterial || state.exchangeOrders.filter(function (order) { return order.status === "open"; }).length >= CONFIG.maxExchangeOrders || state.cash < CONFIG.exchangeListingFee;
        el.exchangeHint.textContent = selectedMaterial
          ? materialNames[selectedMaterial] + " guide price is $" + prices[selectedMaterial] + "/t. Lower asks fill faster; higher asks can sit until demand rises. Listing fee: $" + CONFIG.exchangeListingFee + "."
          : "Load clean ore or logs into your truck before placing a sell offer.";

        const openOrders = state.exchangeOrders.slice().reverse();
        el.exchangeOrders.innerHTML = openOrders.length ? openOrders.map(function (order) {
          const completed = order.status === "complete" || order.remaining <= .01;
          const percent = Math.min(100, Math.round(order.sold / Math.max(.1, order.originalQuantity) * 100));
          return '<article class="exchange-order-card" data-status="' + (completed ? "complete" : "open") + '">' +
            '<div><span>' + detailText(marketSymbols[order.material]) + '</span><p><strong>' + detailText(materialNames[order.material]) + ' sell offer</strong><small>' + round1(order.sold).toFixed(1) + ' / ' + round1(order.originalQuantity).toFixed(1) + ' t sold at $' + order.askPrice + '/t</small></p></div>' +
            '<div class="order-meter"><i style="width:' + percent + '%"></i></div>' +
            '<b>' + (completed ? "FILLED · $" + Math.round(order.proceeds) : round1(order.remaining).toFixed(1) + " t waiting") + '</b>' +
            (completed ? '' : '<button type="button" data-cancel-order="' + detailText(order.id) + '">Cancel & return ore</button>') +
          '</article>';
        }).join("") : '<p class="empty-market-state">No sell offers yet. Orders stay listed across saves until buyers fill them or you cancel.</p>';
      }

      function placeExchangeOffer() {
        if (state.location !== "market") return;
        const material = el.exchangeMaterial.value;
        const quantity = round1(Number(el.exchangeQuantity.value));
        const askPrice = Math.max(1, Math.round(Number(el.exchangePrice.value)));
        if (!material || !materialNames[material] || !Number.isFinite(quantity) || quantity < .1 || quantity > state.cargo[material] + .001) {
          setContext("Sell offer not ready", "Choose a valid material and a quantity no larger than what is currently in your truck.");
          return;
        }
        if (state.cash < CONFIG.exchangeListingFee) {
          setContext("Listing fee required", "The Exchange charges $" + CONFIG.exchangeListingFee + " to post an order.");
          return;
        }
        if (state.exchangeOrders.filter(function (order) { return order.status === "open"; }).length >= CONFIG.maxExchangeOrders) {
          setContext("Exchange slots full", "Cancel or finish an existing offer before posting another.");
          return;
        }
        state.cash -= CONFIG.exchangeListingFee;
        state.cargo[material] = Math.max(0, state.cargo[material] - quantity);
        state.exchangeOrders.push({
          id: "exchange-" + state.nextExchangeOrderId++,
          material: material,
          askPrice: askPrice,
          originalQuantity: quantity,
          remaining: quantity,
          sold: 0,
          proceeds: 0,
          status: "open",
          listedAt: absoluteGameMinutes()
        });
        setContext("Sell offer posted", round1(quantity).toFixed(1) + " t " + materialNames[material].toLowerCase() + " is listed at $" + askPrice + "/t. Buyers evaluate it every " + CONFIG.exchangeTickMinutes + " game minutes; it may fill in pieces or all at once.", "success");
        marketScreenOpen = true;
        marketScreenTab = "exchange";
      }

      function cancelExchangeOrder(orderId) {
        const order = state.exchangeOrders.find(function (item) { return item.id === orderId && item.status === "open"; });
        if (!order) return;
        if (freeCargo() + .001 < order.remaining) {
          setContext("Truck space required", "The remaining " + round1(order.remaining).toFixed(1) + " t cannot be returned until your truck has enough free capacity.");
          return;
        }
        state.cargo[order.material] += order.remaining;
        order.remaining = 0;
        order.status = "cancelled";
        setContext("Sell offer cancelled", "Unsold " + materialNames[order.material].toLowerCase() + " was returned to your truck. Filled portions and proceeds were kept.");
        marketScreenOpen = true;
        marketScreenTab = "exchange";
      }

      function processExchangeOrders() {
        const now = absoluteGameMinutes();
        if (!state.lastExchangeProcessAt) state.lastExchangeProcessAt = now;
        const cycles = Math.floor((now - state.lastExchangeProcessAt) / CONFIG.exchangeTickMinutes);
        if (cycles <= 0) return;
        state.lastExchangeProcessAt += cycles * CONFIG.exchangeTickMinutes;
        let completedCount = 0;
        state.exchangeOrders.forEach(function (order) {
          if (order.status !== "open" || order.remaining <= .01) return;
          const ratio = order.askPrice / Math.max(1, prices[order.material]);
          let baseFill = ratio <= .9 ? .48 : ratio <= 1 ? .32 : ratio <= 1.1 ? .16 : ratio <= 1.2 ? .06 : 0;
          if (!baseFill) return;
          const numericId = Number(String(order.id).replace(/\D/g, "")) || 1;
          const chance = seededUnit(numericId, state.day, Math.floor(state.minutes / CONFIG.exchangeTickMinutes), marketSymbols[order.material].charCodeAt(0));
          if (ratio > 1.08 && chance < .34) return;
          const fill = Math.min(order.remaining, Math.max(.1, round1(order.originalQuantity * baseFill * Math.max(1, cycles) * (.55 + chance))));
          order.remaining = Math.max(0, round1(order.remaining - fill));
          order.sold = round1(order.sold + fill);
          const proceeds = fill * order.askPrice;
          order.proceeds += proceeds;
          state.cash += proceeds;
          if (order.remaining <= .01) {
            order.remaining = 0;
            order.status = "complete";
            completedCount += 1;
          }
        });
        if (completedCount) {
          state.contextTitle = completedCount === 1 ? "Exchange offer filled" : completedCount + " Exchange offers filled";
          state.contextText = "Buyer payments were added to company funds. Open the Market's Marketplace desk to review the completed orders.";
          state.contextTone = "success";
          playSoundCue("success");
        }
      }

      function contractOffersForDay() {
        const offers = [];
        const pendingBusiness = businessLots.find(function (business) {
          const record = state.townBusinesses[business.id];
          return !record || record.status === "locked";
        });
        if (pendingBusiness) {
          offers.push({
            id: "development-" + pendingBusiness.id,
            buyer: pendingBusiness.label,
            material: pendingBusiness.material,
            quantity: 18 + businessLots.indexOf(pendingBusiness) * 6,
            unitPrice: Math.round(prices[pendingBusiness.material] * 1.18),
            truckSize: businessLots.indexOf(pendingBusiness) < 2 ? "s" : "m",
            developmentBusinessId: pendingBusiness.id,
            description: "Founding order · completion starts construction on a permanent town business."
          });
        }
        const candidateMaterials = state.mines.length ? Array.from(new Set(state.mines.map(function (mine) { return mine.material; }))) : ["stone", "coal", "clay"];
        for (let index = 0; index < 3; index += 1) {
          const material = candidateMaterials[Math.floor(seededUnit(state.day, index, candidateMaterials.length, 313) * candidateMaterials.length) % candidateMaterials.length];
          const quantity = 16 + Math.floor(seededUnit(index, state.day, 17, 419) * 25);
          const premium = 1.05 + seededUnit(state.day, index, 29, 503) * .14;
          const truckSize = quantity >= 34 ? "l" : quantity >= 24 ? "m" : quantity >= 18 ? "s" : "xs";
          offers.push({
            id: "daily-" + state.day + "-" + index + "-" + material,
            buyer: (businessNewsByMaterial[material] || businessNewsByMaterial.stone).name,
            material: material,
            quantity: quantity,
            unitPrice: Math.round(prices[material] * premium),
            truckSize: truckSize,
            developmentBusinessId: null,
            description: "Fixed commercial order · the assigned truck keeps cycling until every contracted ton is delivered."
          });
        }
        return offers;
      }

      function companyContractByOfferId(offerId) {
        return state.companyContracts.find(function (contract) { return contract.sourceOfferId === offerId && contract.status !== "cancelled"; }) || null;
      }

      function acceptCompanyContract(offerId, mineId) {
        if (state.location !== "market" || state.companyContracts.filter(function (contract) { return contract.status === "active"; }).length >= CONFIG.maxCompanyContracts) return;
        const offer = contractOffersForDay().find(function (item) { return item.id === offerId; });
        const mine = state.mines.find(function (item) { return item.id === mineId; });
        if (!offer || !mine || mine.material !== offer.material) {
          setContext("Matching mine required", "Select a mine currently producing " + (offer ? materialNames[offer.material].toLowerCase() : "the requested material") + ". Drill upgrades can change a mine's seam, so verify its current output first.");
          return;
        }
        if (state.companyContracts.some(function (contract) { return contract.status === "active" && contract.mineId === mine.id; })) {
          setContext("Mine truck already assigned", "Finish this mine's current company contract before assigning another repeating route.");
          return;
        }
        if (companyContractByOfferId(offer.id)) return;
        const now = absoluteGameMinutes();
        state.companyContracts.push({
          id: "contract-" + state.nextCompanyContractId++,
          sourceOfferId: offer.id,
          buyer: offer.buyer,
          material: offer.material,
          quantity: offer.quantity,
          delivered: 0,
          unitPrice: offer.unitPrice,
          truckSize: offer.truckSize,
          mineId: mine.id,
          developmentBusinessId: offer.developmentBusinessId,
          status: "active",
          acceptedDay: state.day,
          nextTripAt: now,
          inTransit: null
        });
        setContext("Company contract accepted", offer.buyer + " ordered " + offer.quantity + " t of " + materialNames[offer.material].toLowerCase() + " at $" + offer.unitPrice + "/t. The " + offer.truckSize.toUpperCase() + " truck will keep returning to Mine " + (state.mines.indexOf(mine) + 1) + " until fulfillment.", "success");
        marketScreenOpen = true;
        marketScreenTab = "contracts";
      }

      function announceBusiness(businessId) {
        if (!businessId || state.townBusinesses[businessId]) return;
        state.townBusinesses[businessId] = { status: "announced", announcedDay: state.day, opensDay: state.day + 1 };
      }

      function processTownBusinessOpenings() {
        businessLots.forEach(function (business) {
          const record = state.townBusinesses[business.id];
          if (record && record.status === "announced" && state.day >= record.opensDay) {
            record.status = "open";
            record.openedDay = state.day;
          }
        });
      }

      function processCompanyContracts() {
        const now = absoluteGameMinutes();
        state.companyContracts.forEach(function (contract) {
          if (contract.status !== "active") return;
          const mine = state.mines.find(function (item) { return item.id === contract.mineId; });
          if (!mine) {
            contract.status = "cancelled";
            return;
          }
          if (contract.inTransit) {
            if (now < contract.inTransit.completeAt) return;
            const load = contract.inTransit.materialTons;
            state.cash += load * contract.unitPrice;
            state.wasteToCrowe += contract.inTransit.dirtTons;
            contract.delivered = round1(contract.delivered + load);
            contract.inTransit = null;
            if (contract.delivered + .01 >= contract.quantity) {
              contract.delivered = contract.quantity;
              contract.status = "complete";
              contract.completedDay = state.day;
              announceBusiness(contract.developmentBusinessId);
              state.contextTitle = contract.buyer + " contract fulfilled";
              state.contextText = contract.quantity + " t delivered at $" + contract.unitPrice + "/t." + (contract.developmentBusinessId ? " A Coming Soon sign is now on Main Street; the new business opens tomorrow and will add lasting demand." : " The mine truck is released for another company order.");
              state.contextTone = "success";
              playSoundCue("success");
              return;
            }
            contract.nextTripAt = now;
          }
          if (now < contract.nextTripAt || mine.material !== contract.material || mine.stockMaterial < .1) return;
          const hauler = CONFIG.haulers[contract.truckSize];
          const remaining = contract.quantity - contract.delivered;
          const materialTons = Math.min(hauler.capacity, remaining, mine.stockMaterial);
          if (materialTons < .1) return;
          const stockTotal = mine.stockMaterial + mine.stockDirt;
          const dirtShare = stockTotal > .01 ? mine.stockDirt / stockTotal : 0;
          const dirtTons = Math.min(mine.stockDirt, materialTons * dirtShare / Math.max(.05, 1 - dirtShare));
          mine.stockMaterial = Math.max(0, mine.stockMaterial - materialTons);
          mine.stockDirt = Math.max(0, mine.stockDirt - dirtTons);
          contract.inTransit = {
            materialTons: materialTons,
            dirtTons: dirtTons,
            dispatchedAt: now,
            completeAt: now + hauler.travelMinutes * 2
          };
          contract.nextTripAt = contract.inTransit.completeAt;
        });
      }

      function renderContractTerminal() {
        if (!el.contractBoard) return;
        const active = state.companyContracts.filter(function (contract) { return contract.status === "active" || contract.status === "complete"; }).slice().reverse();
        const activeMarkup = active.length ? '<section class="active-contracts"><h3>Company ledger</h3>' + active.map(function (contract) {
          const mine = state.mines.find(function (item) { return item.id === contract.mineId; });
          const percent = Math.min(100, Math.round(contract.delivered / contract.quantity * 100));
          const status = contract.status === "complete" ? "FULFILLED" : contract.inTransit ? "TRUCK EN ROUTE" : mine && mine.material !== contract.material ? "MINE SEAM CHANGED" : "WAITING AT MINE";
          return '<article class="active-contract-card"><div><span>' + detailText(marketSymbols[contract.material]) + '</span><p><strong>' + detailText(contract.buyer) + '</strong><small>Mine ' + (state.mines.indexOf(mine) + 1) + ' · ' + contract.truckSize.toUpperCase() + ' repeating truck · $' + contract.unitPrice + '/t</small></p><b>' + status + '</b></div><div class="order-meter"><i style="width:' + percent + '%"></i></div><small>' + round1(contract.delivered).toFixed(1) + ' / ' + contract.quantity + ' t delivered</small></article>';
        }).join("") + '</section>' : '';

        const offers = contractOffersForDay();
        const offerMarkup = '<section class="contract-offers"><h3>Open orders · Day ' + state.day + '</h3>' + offers.map(function (offer) {
          const matchingMines = state.mines.filter(function (mine) { return mine.material === offer.material; });
          const alreadyAccepted = companyContractByOfferId(offer.id);
          const options = matchingMines.length ? matchingMines.map(function (mine) {
            return '<option value="' + detailText(mine.id) + '">Mine ' + (state.mines.indexOf(mine) + 1) + ' · ' + detailText(materialNames[mine.material]) + ' · Lv' + mine.level + '</option>';
          }).join("") : '<option value="">No matching mine</option>';
          return '<article class="contract-offer-card" data-development="' + (offer.developmentBusinessId ? "true" : "false") + '"><header><span>' + detailText(offer.developmentBusinessId ? "FOUNDING ORDER" : "COMMERCIAL ORDER") + '</span><b>' + detailText(offer.buyer) + '</b></header><div class="contract-terms"><strong>' + offer.quantity + ' t ' + detailText(materialNames[offer.material]) + '</strong><em>$' + offer.unitPrice + '/t</em><small>' + offer.truckSize.toUpperCase() + ' truck</small></div><p>' + detailText(offer.description) + '</p><label>Assign mine<select data-contract-mine="' + detailText(offer.id) + '">' + options + '</select></label><button type="button" data-accept-contract="' + detailText(offer.id) + '" ' + (!matchingMines.length || alreadyAccepted ? 'disabled' : '') + '>' + (alreadyAccepted ? "Already accepted" : matchingMines.length ? "Accept & dispatch" : "Upgrade or build a matching mine") + '</button></article>';
        }).join("") + '</section>';
        el.contractBoard.innerHTML = activeMarkup + offerMarkup;
      }

      function buyShaker() {
        if (state.location !== "garage" || state.shaker || state.cash < CONFIG.shakerCost) return;
        state.cash -= CONFIG.shakerCost;
        state.shaker = true;
        setContext("Shaker installed", "Future mine output keeps only 15% of its dirt, improving every truck load.");
      }

      function nextTruckSizeCost() {
        return state.truckSizeLevel < CONFIG.maxTruckLevel ? CONFIG.truckSizeUpgradeCosts[state.truckSizeLevel] : 0;
      }

      function nextTruckSpeedCost() {
        return state.truckSpeedLevel < CONFIG.maxTruckLevel ? CONFIG.truckSpeedUpgradeCosts[state.truckSpeedLevel] : 0;
      }

      function upgradeTruckSize() {
        const cost = nextTruckSizeCost();
        if (state.location !== "garage" || state.truckSizeLevel >= CONFIG.maxTruckLevel || state.cash < cost) return;
        state.cash -= cost;
        state.truckSizeLevel += 1;
        state.capacity = CONFIG.truckCapacityByLevel[state.truckSizeLevel];
        setContext("Truck size upgraded", "Cargo capacity is now " + state.capacity + " tons. The larger top-down truck is visible on the map.");
      }

      function upgradeTruckSpeed() {
        const cost = nextTruckSpeedCost();
        if (state.location !== "garage" || state.truckSpeedLevel >= CONFIG.maxTruckLevel || state.cash < cost) return;
        state.cash -= cost;
        state.truckSpeedLevel += 1;
        setContext("Truck speed upgraded", "Road and trail travel are now faster at Speed Level " + state.truckSpeedLevel + ". Turning remains visible as the truck changes direction.");
      }

      function syncAudioButtons() {
        const settings = [
          [el.music, el.startMusic, state.musicEnabled, "♫", "Music"],
          [el.engineSound, el.startEngine, state.engineSoundEnabled, "⚙", "Truck"],
          [el.effects, el.startEffects, state.effectsSoundEnabled, "✦", "Effects"]
        ];
        settings.forEach(function (setting) {
          [setting[0], setting[1]].forEach(function (button) {
            if (!button) return;
            button.setAttribute("aria-pressed", setting[2] ? "true" : "false");
            button.textContent = setting[3] + " " + setting[4] + (setting[2] ? " on" : " off");
          });
        });
      }

      function toggleAudioChannel(channel) {
        if (!Object.prototype.hasOwnProperty.call(state, channel)) return;
        state[channel] = !state[channel];
        state.soundEnabled = state.musicEnabled || state.engineSoundEnabled || state.effectsSoundEnabled;
        if (state.soundEnabled) ensureAudio();
        if (state.musicEnabled) startMusic();
        else stopMusic();
        updateEngineSound();
        syncAudioButtons();
        if (state.started) {
          const labels = { musicEnabled: "Music", engineSoundEnabled: "Truck audio", effectsSoundEnabled: "Sound effects" };
          setContext(labels[channel] + (state[channel] ? " enabled" : " muted"), labels[channel] + " can be changed independently at any time from the PL menu.", state[channel] && channel === "effectsSoundEnabled" ? "success" : null);
        }
      }

      function activeFullscreenElement() {
        return document.fullscreenElement || document.webkitFullscreenElement || null;
      }

      function gameFullscreenTarget() {
        const documentRoot = document.documentElement;
        if (documentRoot && (typeof documentRoot.requestFullscreen === "function" || typeof documentRoot.webkitRequestFullscreen === "function")) return documentRoot;
        return root;
      }

      async function enterGameFullscreen() {
        const target = gameFullscreenTarget();
        const standardRequest = target && target.requestFullscreen;
        const webkitRequest = target && target.webkitRequestFullscreen;
        if (typeof standardRequest === "function") {
          try {
            await standardRequest.call(target, { navigationUI: "hide" });
          } catch {
            await standardRequest.call(target);
          }
          return true;
        }
        if (typeof webkitRequest === "function") {
          await webkitRequest.call(target);
          return true;
        }
        return false;
      }

      async function exitGameFullscreen() {
        if (typeof document.exitFullscreen === "function") {
          await document.exitFullscreen();
          return true;
        }
        if (typeof document.webkitExitFullscreen === "function") {
          await document.webkitExitFullscreen();
          return true;
        }
        return false;
      }

      async function toggleLandscape() {
        if (activeFullscreenElement()) {
          try {
            if (screen.orientation && typeof screen.orientation.unlock === "function") screen.orientation.unlock();
          } catch {}
          try { await exitGameFullscreen(); } catch {}
          stabilizeViewport();
          setContext("Landscape closed", "The game returned to the normal responsive layout.");
          return;
        }
        let expanded = false;
        try {
          expanded = await enterGameFullscreen();
        } catch {}
        let locked = false;
        try {
          if (screen.orientation && typeof screen.orientation.lock === "function") {
            const orientationLock = screen.orientation.lock("landscape");
            await Promise.race([
              orientationLock,
              new Promise(function (resolve) { setTimeout(resolve, 700); })
            ]);
            locked = true;
          }
        } catch {}
        stabilizeViewport();
        if (locked) setContext("Full screen ready", "The game now fills the screen and is locked to landscape. Tap Exit full screen to return.", "success");
        else if (expanded) setContext("Full screen ready", "The game now fills the screen. Rotate your device sideways if it did not rotate automatically.", "success");
        else setContext("Rotate your device", "Turn your phone sideways for the landscape map. Your browser did not allow full-screen orientation control.");
      }

      function pointFromKey(key) {
        const parts = String(key).split(",").map(Number);
        return parts.length === 2 && parts.every(Number.isFinite) ? { x: parts[0], y: parts[1] } : null;
      }

      function roadDraftPoints() {
        return state.roadDraft.map(pointFromKey).filter(Boolean);
      }

      function expandedRoadCells(points) {
        const cells = new Set();
        for (let index = 0; index < points.length - 1; index += 1) {
          const start = points[index];
          const end = points[index + 1];
          const horizontal = start.y === end.y;
          [start, end].forEach(function (point) {
            cells.add(keyFor(point.x, point.y));
            cells.add(horizontal ? keyFor(point.x, point.y + 1) : keyFor(point.x + 1, point.y));
          });
        }
        return cells;
      }

      function isRoadSurveyCellLegal(x, y) {
        if (!isPlayerClaimTile(x, y) || !claimZoneUnlockedAt(x, y)) return false;
        const gate = claimGateAt(x, y);
        if (gate) return isClaimGateOpen(gate);
        return !isClaimWallCell(x, y) && !isTreeAt(x, y) && !isStructureCell(x, y) && !mineParcelAt(x, y) && !warehouseParcelAt(x, y);
      }

      function draftConnectsToRoad(points) {
        if (!points.length) return false;
        const first = points[0];
        return [
          { x: first.x + 1, y: first.y }, { x: first.x - 1, y: first.y },
          { x: first.x, y: first.y + 1 }, { x: first.x, y: first.y - 1 }
        ].some(function (point) { return isPavedClaimRoad(point.x, point.y); });
      }

      function roadDraftNewTiles(points) {
        return Array.from(expandedRoadCells(points)).filter(function (key) {
          const point = pointFromKey(key);
          return point && !isPavedClaimRoad(point.x, point.y);
        });
      }

      function startRoadSurvey() {
        if (state.location !== "townhall") return;
        state.roadPlanning = true;
        state.roadDraft = [];
        state.roadApproval = null;
        state.menuOpen = false;
        marketScreenOpen = false;
        state.overview = true;
        setContext("Road survey active", "Tap a continuous route on open claim ground. Pinebarrow roads are automatically drawn two tiles wide and may turn. The first point must touch an existing paved road; tap a selected point again to undo.");
      }

      function planRoadPoint(x, y) {
        if (!state.roadPlanning) return false;
        const key = keyFor(x, y);
        const existingIndex = state.roadDraft.indexOf(key);
        if (existingIndex >= 0) {
          state.roadDraft = state.roadDraft.slice(0, existingIndex);
          setContext("Road survey revised", state.roadDraft.length ? state.roadDraft.length + " center points remain. Continue drawing, or return to Town Hall." : "The route is empty. Tap beside an existing paved road to begin again.");
          return true;
        }
        const points = roadDraftPoints();
        if (points.length) {
          const last = points[points.length - 1];
          if (Math.abs(last.x - x) + Math.abs(last.y - y) !== 1) {
            setContext("Continuous route required", "Choose one tile directly north, south, east, or west of the last survey point. Roads cannot jump across land.");
            return true;
          }
        }
        const candidate = points.concat({ x: x, y: y });
        if (!points.length && !draftConnectsToRoad(candidate)) {
          setContext("Road connection required", "Begin on an open tile touching the existing paved road.");
          return true;
        }
        const expanded = candidate.length > 1 ? expandedRoadCells(candidate) : new Set([key]);
        const blocked = Array.from(expanded).map(pointFromKey).find(function (point) {
          return point && !isPavedClaimRoad(point.x, point.y) && !isRoadSurveyCellLegal(point.x, point.y);
        });
        if (blocked) {
          setContext("Road survey blocked", "The two-wide route crosses a tree, parcel, wall, locked field, or structure at " + blocked.x + "," + blocked.y + ". Clear it or turn around it.");
          return true;
        }
        state.roadDraft.push(key);
        state.roadApproval = null;
        const newTiles = roadDraftNewTiles(candidate).length;
        setContext("Road route marked", candidate.length + " linked points create " + newTiles + " new two-wide road tiles. Continue tapping, then return to Town Hall for approval.");
        return true;
      }

      function submitRoadSurvey() {
        if (state.location !== "townhall") return;
        const points = roadDraftPoints();
        if (points.length < CONFIG.roadMinimumSurveyPoints || !draftConnectsToRoad(points)) {
          setContext("Road survey incomplete", "Mark at least two connected route points beginning beside an existing paved road, then submit again.");
          return;
        }
        const routeTiles = roadDraftNewTiles(points);
        if (!routeTiles.length) {
          setContext("No new road proposed", "This survey only overlaps road that is already paved. Extend it onto open land.");
          return;
        }
        const blocked = routeTiles.map(pointFromKey).find(function (point) { return point && !isRoadSurveyCellLegal(point.x, point.y); });
        if (blocked) {
          setContext("Town Hall rejected route", "The proposed two-wide corridor is no longer clear at " + blocked.x + "," + blocked.y + ". Revise the survey and resubmit.");
          return;
        }
        const stoneTons = Math.ceil(routeTiles.length / CONFIG.roadTilesPerStoneTon * 10) / 10;
        const stonePrice = prices.stone;
        const stoneCost = Math.ceil(stoneTons * stonePrice);
        const laborCost = routeTiles.length * CONFIG.roadLaborPerTile;
        state.roadApproval = {
          day: state.day,
          routeTiles: routeTiles,
          routePoints: state.roadDraft.slice(),
          stoneTons: stoneTons,
          stonePrice: stonePrice,
          stoneCost: stoneCost,
          laborCost: laborCost,
          totalCost: stoneCost + laborCost
        };
        state.roadPlanning = false;
        setContext("Town Hall approved the route", routeTiles.length + " road tiles require " + stoneTons.toFixed(1) + " t purchased stone at $" + stonePrice + "/t, plus $" + laborCost + " labor. Total contract: $" + (stoneCost + laborCost) + ".");
      }

      function acceptRoadContract() {
        const approval = state.roadApproval;
        if (state.location !== "townhall" || !approval) return;
        if (state.cash < approval.totalCost) {
          setContext("Road contract funds required", "Town Hall approved the plan, but the company needs $" + approval.totalCost + ". Stone is purchased at the quoted $" + approval.stonePrice + " per ton; no rock is free or taken from truck cargo.");
          return;
        }
        state.cash -= approval.totalCost;
        approval.routeTiles.forEach(function (key) {
          state.roadTiles.add(key);
          claimTerrain.resources.delete(key);
          claimTerrain.dirt.delete(key);
          claimTerrain.trees.delete(key);
        });
        state.roadContractsCompleted += 1;
        state.roadMarketImpact = {
          day: state.day,
          tons: approval.stoneTons,
          strength: Math.min(.32, .07 + approval.stoneTons * .012)
        };
        while (state.pavedDepth < CLAIM_DEPTH && state.roadTiles.has(keyFor(PLAYER_ROAD_X, SOUTH_TOP + state.pavedDepth)) && state.roadTiles.has(keyFor(PLAYER_ROAD_X + 1, SOUTH_TOP + state.pavedDepth))) {
          state.pavedDepth += 1;
        }
        const built = approval.routeTiles.length;
        const stoneTons = approval.stoneTons;
        state.roadApproval = null;
        state.roadDraft = [];
        applyDailyMarket();
        setContext("Road contract completed", "Town Hall purchased " + stoneTons.toFixed(1) + " t of stone and paved " + built + " two-wide road tiles. That new demand has raised today's stone market; the price may correct after crews finish buying.", "success");
      }

      function cancelRoadSurvey() {
        if (state.location !== "townhall" && !state.roadPlanning) return;
        state.roadPlanning = false;
        state.roadDraft = [];
        state.roadApproval = null;
        setContext("Road survey cancelled", "No stone was purchased and no cash was spent. Start a new two-wide route from Town Hall whenever you are ready.");
      }

      function selectedClaimGate() {
        if (!state.selected || state.selected.type !== "gate") return null;
        const gateIndex = Math.max(0, Math.min(2, Math.round(state.selected.gateIndex || 0)));
        return claimGateAt(PLAYER_ROAD_X, claimYAtDepth("south", CLAIM_SECTION_DEPTHS[gateIndex]));
      }

      function unlockSelectedClaimGate() {
        const gate = selectedClaimGate();
        if (!gate || !isActivePlayerGate(gate) || isClaimGateOpen(gate)) return;
        if (gate.sectionIndex !== state.unlockedClaimZones) {
          setContext("Earlier gate required", "Open Section " + (state.unlockedClaimZones + 1) + " before purchasing access to this deeper field.");
          return;
        }
        if (state.cash < gate.cost) {
          setContext("Gate payment required", "Section " + gate.sectionNumber + " costs $" + gate.cost + ". You currently have $" + Math.round(state.cash) + ".");
          return;
        }
        state.cash -= gate.cost;
        state.unlockedClaimZones = Math.min(3, gate.sectionIndex + 1);
        state.menuOpen = false;
        state.location = "road";
        state.selected = { type: "road", x: state.player.x, y: state.player.y };
        setContext("Section " + gate.sectionNumber + " unlocked", "$" + gate.cost + " paid. The gold gate is open, and the next extraction field is now accessible.", "success");
      }

      function readNews() {
        if (state.location !== "newsstand") return;
        openDailyPaper();
      }

      function landStatusText() {
        if (state.surveyParcel) return "Land: survey ready to lease";
        if (!state.mineParcel) return "Land: no claim";
        if (state.mineParcel.status === "leased") return "Land: leased · $" + landBuyoutRemaining() + " buyout";
        return "Land: " + state.mineParcels.length + " claim" + (state.mineParcels.length === 1 ? "" : "s") + " · deed paid";
      }

      function companyStatusText() {
        const mineText = state.mines.length + "/" + mineSlotLimit() + " mines operating";
        const warehouseText = state.warehouses.length + " warehouse" + (state.warehouses.length === 1 ? "" : "s");
        const workerText = state.workers + " worker" + (state.workers === 1 ? "" : "s");
        const surveyText = state.prospectorHired ? "Prospector " + prospectsRemaining() + "/" + CONFIG.prospectsPerDay + " left" : "No prospector";
        const truckText = "Truck Size " + state.truckSizeLevel + " / Speed " + state.truckSpeedLevel;
        const activeTruckCount = state.hauls.length + state.companyContracts.filter(function (contract) { return contract.status === "active"; }).length;
        const haulText = activeTruckCount ? activeTruckCount + " mine truck" + (activeTruckCount === 1 ? "" : "s") + " assigned" : "No contract truck active";
        return truckText + " · " + mineText + " · " + warehouseText + " · " + workerText + " · " + surveyText + " · " + haulText;
      }

      function formatTime() {
        const hours24 = Math.floor(state.minutes / 60);
        const minutes = state.minutes % 60;
        const suffix = hours24 >= 12 ? "PM" : "AM";
        const hours12 = hours24 % 12 || 12;
        return hours12 + ":" + String(minutes).padStart(2, "0") + " " + suffix;
      }

      function dailyMarketForDay(day) {
        const cycle = dailyNewsCycles[(Math.max(1, day) - 1) % dailyNewsCycles.length];
        const todayPrices = Object.assign({}, basePrices);
        const modifiers = Object.fromEntries(Object.keys(basePrices).map(function (material) { return [material, 0]; }));
        modifiers[cycle.material] += cycle.change;
        businessLots.forEach(function (business) {
          const record = state.townBusinesses[business.id];
          if (record && record.status === "open") modifiers[business.material] += .08;
        });
        let feature = cycle;
        const openingBusiness = businessLots.find(function (business) {
          const record = state.townBusinesses[business.id];
          return record && record.status === "open" && record.openedDay === day;
        });
        if (openingBusiness) {
          modifiers[openingBusiness.material] += .1;
          feature = { tag: "Main Street Opening", material: openingBusiness.material, headline: openingBusiness.label + " opens after miners fulfill its building order" };
        }
        const roadAge = state.roadMarketImpact ? day - state.roadMarketImpact.day : 99;
        if (roadAge === 0) {
          modifiers.stone += state.roadMarketImpact.strength;
          feature = { tag: "Road Contract", material: "stone", headline: "Approved road route sends crews into the stone market" };
        } else if (roadAge === 1) {
          modifiers.stone -= Math.min(.14, state.roadMarketImpact.strength * .55);
          feature = { tag: "Road Contract", material: "stone", headline: "Stone bids cool after Town Hall fills its paving order" };
        }
        Object.keys(todayPrices).forEach(function (material) {
          todayPrices[material] = Math.max(1, Math.round(basePrices[material] * (1 + modifiers[material])));
        });
        const actualChange = todayPrices[feature.material] / basePrices[feature.material] - 1;
        return {
          tag: feature.tag,
          material: feature.material,
          headline: feature.headline,
          prices: todayPrices,
          modifiers: modifiers,
          price: todayPrices[feature.material],
          changePercent: Math.round(actualChange * 100),
          direction: actualChange < 0 ? "fall" : actualChange > 0 ? "rise" : "steady",
          directionWord: actualChange < 0 ? "down" : actualChange > 0 ? "up" : "steady"
        };
      }

      function applyDailyMarket() {
        const bulletin = dailyMarketForDay(state.day);
        Object.keys(basePrices).forEach(function (material) {
          prices[material] = bulletin.prices[material];
        });
        return bulletin;
      }

      function renderDailyBulletin(bulletin) {
        if (!el.dailyNews || !el.newsDay || !el.newsHeadline || !el.newsMarket) return;
        const arrow = bulletin.direction === "fall" ? "▼" : bulletin.direction === "rise" ? "▲" : "•";
        el.dailyNews.dataset.tone = bulletin.direction;
        el.newsDay.textContent = "Day " + state.day + " · Daily Edition";
        el.newsHeadline.textContent = bulletin.headline;
        el.newsMarket.textContent = materialNames[bulletin.material] + " · $" + bulletin.price + "/t · " + arrow + Math.abs(bulletin.changePercent) + "%";
        const flash = el.dailyNews.querySelector ? el.dailyNews.querySelector(".news-flash") : null;
        if (flash) flash.textContent = bulletin.tag;
      }

      function croweArticleFor(bulletin) {
        const waste = round1(state.wasteToCrowe);
        let title = "The old prospector keeps buying";
        let story = "Silas Crowe has been quietly approaching shop owners about their deeds while offering to haul mine dirt for free.";
        if (waste >= .5 && waste < 4) {
          title = "Crowe wagons collect miners' tailings";
          story = "Witnesses counted " + waste.toFixed(1) + " tons of your discarded dirt on Crowe wagons. He is testing something he has not disclosed to town officials.";
        } else if (waste >= 4 && waste < 10) {
          title = "Private assay linked to Crowe dirt piles";
          story = "Crowe has profited from " + waste.toFixed(1) + " tons of your waste. Merchants suspect the dirt contains traces your operation is leaving behind.";
        } else if (waste >= 10) {
          title = "Crowe deed campaign threatens Pinebarrow";
          story = "After collecting " + waste.toFixed(1) + " tons of your tailings, Crowe is using the proceeds to buy more town deeds. Efficient mining now directly protects Main Street.";
        }
        if (bulletin.material === "gold" || bulletin.material === "sapphire") {
          story += " Today's " + materialNames[bulletin.material].toLowerCase() + " rush makes his secret land purchases even more suspicious.";
        }
        return { title: title, story: story };
      }

      function renderExpandedNewspaper(bulletin) {
        if (!el.newsReader || !el.newsReaderPrices || !el.resourceGuide) return;
        let business = businessNewsByMaterial[bulletin.material] || businessNewsByMaterial.stone;
        const featuredTownBusiness = businessLots.find(function (item) {
          const record = state.townBusinesses[item.id];
          return record && ((record.status === "announced" && record.announcedDay === state.day) || (record.status === "open" && record.openedDay === state.day));
        });
        if (featuredTownBusiness) {
          const record = state.townBusinesses[featuredTownBusiness.id];
          business = record.status === "announced"
            ? { name: "COMING SOON · " + featuredTownBusiness.label, story: "Miners completed the founding order. Construction starts today, the storefront opens on Day " + record.opensDay + ", and its permanent demand will lift " + materialNames[featuredTownBusiness.material].toLowerCase() + " prices." }
            : { name: featuredTownBusiness.label + " · NOW OPEN", story: "The finished business joined Main Street today. Its regular buying desk adds lasting demand and future company contracts for " + materialNames[featuredTownBusiness.material].toLowerCase() + "." };
        }
        const crowe = croweArticleFor(bulletin);
        const marketArrow = bulletin.direction === "fall" ? "▼" : bulletin.direction === "rise" ? "▲" : "•";

        el.newsReaderEdition.textContent = "Day " + state.day + " · " + formatTime() + " Edition";
        el.newsReaderTag.textContent = bulletin.tag;
        el.newsReaderHeadline.textContent = bulletin.headline;
        el.newsReaderDeck.textContent = business.story + " The Market is paying $" + bulletin.price + " per clean ton of " + materialNames[bulletin.material].toLowerCase() + " today.";

        el.newsReaderPrices.innerHTML = Object.keys(basePrices).map(function (material) {
          const currentPrice = bulletin.prices[material];
          const change = Math.round((currentPrice / basePrices[material] - 1) * 100);
          const tone = change < 0 ? "fall" : change > 0 ? "rise" : "steady";
          const arrow = change < 0 ? "▼" : change > 0 ? "▲" : "•";
          return '<article class="stock-ad" data-tone="' + tone + '">' +
            '<div><b>' + detailText(marketSymbols[material]) + '</b><small>' + detailText(materialNames[material]) + '</small></div>' +
            '<strong>$' + currentPrice + '<small>/t</small></strong>' +
            '<em>' + arrow + Math.abs(change) + '%</em>' +
          '</article>';
        }).join("") +
          '<article class="stock-ad dirt-ad" data-tone="fall"><div><b>DRT</b><small>Dirt</small></div><strong>$0<small>/t</small></strong><em>WASTE</em></article>';

        el.newsBusinessName.textContent = business.name;
        el.newsBusinessStory.textContent = business.story;
        el.newsBusinessOrder.textContent = "NOW BUYING · " + materialNames[bulletin.material].toUpperCase() + " · $" + bulletin.price + "/T · " + marketArrow + Math.abs(bulletin.changePercent) + "%";
        el.newsCroweTitle.textContent = crowe.title;
        el.newsCroweStory.textContent = crowe.story;
        el.newsCroweWaste.textContent = "Your discarded dirt: " + round1(state.wasteToCrowe).toFixed(1) + " t";

        el.resourceGuide.innerHTML = [
          ["0–24 tiles", "Stone · Clay · Coal"],
          ["25–59 tiles", "Coal · Iron · Copper · Tin"],
          ["60–94 tiles", "Iron · Copper · Tin · Quartz · Silver"],
          ["95–124 tiles", "Quartz · Silver · Gold · Sapphire"]
        ].map(function (band) {
          return '<article><small>' + detailText(band[0]) + '</small><strong>' + detailText(band[1]) + '</strong><em>Lv1 survey seam · Lv3/Lv5/Lv7 deeper seams</em></article>';
        }).join("");
      }

      function openDailyPaper() {
        if (!state.started) return;
        settleMovementForReroute();
        state.path = [];
        state.pendingArrival = null;
        systemMenuOpen = false;
        closeFastTravel();
        newsReaderOpen = true;
        marketScreenOpen = false;
        state.menuOpen = true;
        renderInterface();
        requestAnimationFrame(function () {
          if (el.newsReaderClose) el.newsReaderClose.focus({ preventScroll: true });
        });
      }

      function unavailableActionReason(button) {
        if (!button) return "Travel to a building or work tile to unlock its services.";
        if (button === el.hire) {
          if (state.prospectorHired) return prospectsRemaining() > 0
            ? "Your permanent prospector is ready for open extraction ground."
            : "Today's two surveys are finished. The prospector returns automatically tomorrow.";
          return "You need $" + CONFIG.prospectorCost + " to permanently hire the prospector.";
        }
        if (button === el.hireWorker) {
          if (!state.mine) return "Build a mine before hiring its first worker.";
          if (state.workers >= CONFIG.maxWorkers) return "This mine already has its full " + CONFIG.maxWorkers + "-worker crew.";
          return "You need $" + nextWorkerCost() + " to hire the next mine worker.";
        }
        if (button === el.marketplace) return "The Marketplace is ready at the Market building.";
        if (button === el.contracts) return "The commercial contract desk is ready at the Market building.";
        if (button.dataset && button.dataset.haulerSize) {
          const hauler = CONFIG.haulers[button.dataset.haulerSize];
          if (!state.mine) return "Build a mine before dispatching a contract hauler.";
          const currentHaul = activeHaulForMine(state.mine);
          if (currentHaul) return "This mine's " + CONFIG.haulers[currentHaul.size].label + " truck is already en route with " + haulMinutesRemaining(currentHaul) + " game minutes remaining.";
          if (mineStockUsed() + .001 < hauler.capacity) return hauler.label + " requires a full " + hauler.capacity + "-ton load; the mine has " + round1(mineStockUsed()).toFixed(1) + " tons.";
          return "You need the $" + hauler.cost + " per-load fee to dispatch this hauler.";
        }
        if (button === el.buySaw) return state.sawOwnership === "owned" ? "The saw is already yours." : "You need $" + CONFIG.sawPurchaseCost + " to buy the saw.";
        if (button === el.rentSaw) return state.sawAttached ? "A saw is already attached to the truck." : "You need $" + CONFIG.sawRentalCost + " to rent the saw today.";
        if (button === el.shaker) return state.shaker ? "The Shaker is already installed." : "You need $" + CONFIG.shakerCost + " to buy the Shaker.";
        if (button === el.upgradeTruckSize) return state.truckSizeLevel >= CONFIG.maxTruckLevel ? "Truck cargo size is already at maximum level." : "You need $" + nextTruckSizeCost() + " for the next cargo-size upgrade.";
        if (button === el.upgradeTruckSpeed) return state.truckSpeedLevel >= CONFIG.maxTruckLevel ? "Truck speed is already at maximum level." : "You need $" + nextTruckSpeedCost() + " for the next speed upgrade.";
        if (button === el.roadPlan) return "Start from Town Hall, then tap a connected route on the map.";
        if (button === el.roadSubmit) return "Draw at least two connected center points and return to Town Hall.";
        if (button === el.roadAccept) return state.roadApproval ? "You need $" + state.roadApproval.totalCost + " for purchased stone and road labor." : "Submit a surveyed route for Town Hall approval first.";
        if (button === el.roadCancel) return "There is no active road survey or approved quote to cancel.";
        if (button === el.unlockGate) {
          const gate = selectedClaimGate();
          if (!gate) return "Select a locked gold gate in your P4 stone wall.";
          if (gate.sectionIndex !== state.unlockedClaimZones) return "Open the earlier section gate first.";
          return "You need $" + gate.cost + " to unlock extraction field " + gate.sectionNumber + ".";
        }
        if (button === el.prospect) {
          if (!state.prospectorHired) return "Hire the permanent prospector at Town Hall.";
          if (prospectsRemaining() <= 0) return "Today's two surveys are complete; the quota resets automatically tomorrow.";
          if (!selectedSurveyTile() || isPlayerClaimPath(state.selected.x, state.selected.y)) return "Select open ground outside the two-tile road reserve.";
          if (selectedTileMatchesCurrentSurvey()) return "Select different open ground for today's second survey.";
          return state.location === "townhall" ? "The prospector is ready to survey the selected ground from Town Hall." : "Stand on the selected ground to prospect it.";
        }
        if (button === el.lease) return "You need $" + CONFIG.landLeasePerDay + " for the first lease payment.";
        if (button === el.buyLand) return "You need $" + landBuyoutRemaining() + " to finish buying this land.";
        if (button === el.buyWarehouseLand) return "You need $" + CONFIG.warehouseLandPrice + " to buy the warehouse parcel.";
        if (button === el.buildMine) {
          if (state.mines.length >= mineSlotLimit()) return "Your current operating permits allow " + mineSlotLimit() + " mine" + (mineSlotLimit() === 1 ? "" : "s") + ". More slots unlock as campaign days advance.";
          return parcelCleared(state.mineParcel) ? (besideParcel(state.mineParcel) ? "You need $" + CONFIG.mineBuildCost + " to build the mine." : "Stand directly outside the highlighted 2×2 boundary, not inside it.") : "Clear all four tiles in the 2×2 mine parcel first.";
        }
        if (button === el.loadMine) return freeCargo() <= .01 ? "Your truck is full." : "The mine is still filling its stockpile.";
        if (button === el.upgradeMine) {
          if (state.mine && state.mine.level >= CONFIG.maxMineLevel) return "This mine is already at maximum level.";
          if (state.mine && activeCompanyContractForMine(state.mine) && mineMaterialForLevel(state.mine, state.mine.level + 1) !== state.mine.material) return "Finish this mine's company contract before drilling into a different ore seam.";
          return "You need the required cash and ownership level for this upgrade.";
        }
        if (button === el.buildWarehouse) return parcelCleared(state.warehouseParcel) ? (besideParcel(state.warehouseParcel) ? "You need $" + CONFIG.warehouseBuildCost + " to build the warehouse." : "Stand directly outside the highlighted 2×2 boundary, not inside it. Use Quick travel: Warehouse site.") : "Clear all four tiles in the 2×2 warehouse parcel first.";
        if (button === el.unloadWarehouse) return usedCargo() <= .01 ? "Your truck is empty." : "The warehouse is full.";
        if (button === el.loadWarehouse) return freeCargo() <= .01 ? "Your truck is full." : "The warehouse is empty.";
        if (button === el.upgradeWarehouse) return state.warehouse && state.warehouse.level >= CONFIG.maxWarehouseLevel ? "This warehouse is already at maximum level." : "You need the required cash for the next warehouse level.";
        return state.contextText;
      }

      function detailText(value) {
        return String(value).replace(/[&<>"']/g, function (character) {
          return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[character];
        });
      }

      function detailCards(facts) {
        return '<div class="location-detail-grid">' + facts.map(function (fact) {
          return '<span><small>' + detailText(fact[0]) + '</small><strong>' + detailText(fact[1]) + '</strong></span>';
        }).join("") + "</div>";
      }

      function renderLocationDetails() {
        if (!el.locationDetails || !el.locationKicker) return;
        el.locationDetails.hidden = true;
        el.locationDetails.innerHTML = "";
        const defaultKickers = {
          market: "Market services",
          townhall: "Town Hall services",
          garage: "Garage services",
          rental: "Rental services",
          newsstand: "Newsstand",
          cleared: "Field crew",
          gate: "Claim access",
          "mine-site": "Construction site",
          "warehouse-site": "Construction site"
        };
        el.locationKicker.textContent = defaultKickers[state.location] || "Available here";

        if (state.location === "market") {
          const openOrders = state.exchangeOrders.filter(function (order) { return order.status === "open"; });
          const activeContracts = state.companyContracts.filter(function (contract) { return contract.status === "active"; });
          el.locationDetails.hidden = false;
          el.locationDetails.innerHTML = detailCards([
            ["Truck inventory", cargoSummary()],
            ["Sell offers", openOrders.length + " / " + CONFIG.maxExchangeOrders + " open"],
            ["Company contracts", activeContracts.length + " / " + CONFIG.maxCompanyContracts + " active"],
            ["Stone guide", "$" + prices.stone + "/t"],
            ["Exchange rule", "You choose price & tons"],
            ["Contract rule", "Truck repeats to fulfillment"]
          ]);
          return;
        }

        if (state.location === "townhall") {
          const approval = state.roadApproval;
          const draftTiles = roadDraftNewTiles(roadDraftPoints()).length;
          el.locationDetails.hidden = false;
          el.locationDetails.innerHTML = detailCards([
            ["Road contracts", String(state.roadContractsCompleted)],
            ["Survey", approval ? "Approved" : state.roadPlanning ? "Active" : state.roadDraft.length ? "Ready to submit" : "No route"],
            ["Proposed paving", approval ? approval.routeTiles.length + " tiles" : draftTiles + " tiles"],
            ["Stone market", "$" + prices.stone + "/t"],
            ["Approved stone", approval ? approval.stoneTons.toFixed(1) + " t · $" + approval.stoneCost : "None"],
            ["Contract total", approval ? "$" + approval.totalCost : "Not quoted"]
          ]);
          return;
        }

        if (state.location === "gate") {
          const gate = selectedClaimGate();
          if (!gate) return;
          el.locationDetails.hidden = false;
          el.locationDetails.innerHTML = detailCards([
            ["Extraction field", gate.sectionNumber + " / 3"],
            ["Access", isClaimGateOpen(gate) ? "Unlocked" : "Locked"],
            ["Gate price", gate.cost ? "$" + gate.cost : "Starter access"],
            ["Terrain", gate.sectionNumber === 2 ? "Coal · iron · copper · tin" : gate.sectionNumber === 3 ? "Quartz · silver · gold · sapphire" : "Stone · clay · coal"],
            ["Boundary", "Impenetrable stone"]
          ]);
          return;
        }

        if (state.location === "mine" && state.mine) {
          const mineIndex = state.mines.indexOf(state.mine) + 1;
          const parcel = parcelForMine(state.mine);
          const warehouseParcel = warehouseParcelForMineParcel(parcel);
          const linkedWarehouse = warehouseParcel && state.warehouses.find(function (warehouse) { return warehouse.parcelId === warehouseParcel.id; });
          const currentHaul = activeHaulForMine(state.mine);
          const companyContract = activeCompanyContractForMine(state.mine);
          const staffedOutput = CONFIG.mineOutputByLevel[state.mine.level] * CONFIG.workerOutputMultiplierByCount[state.workers];
          const nextUnlockLevel = nextMaterialUnlockLevel(state.mine);
          el.locationKicker.textContent = "Mine " + mineIndex + " operations";
          el.locationDetails.hidden = false;
          el.locationDetails.innerHTML = detailCards([
            ["Land", parcel && parcel.status === "owned" ? "Owned" : "Leased"],
            ["Material", materialNames[state.mine.material]],
            ["Drill level", state.mine.level + " / " + CONFIG.maxMineLevel],
            ["Forest depth", state.mine.depth + " tiles"],
            ["Stockpile", round1(mineStockUsed()).toFixed(1) + " / " + mineCapacity().toFixed(1) + " t"],
            ["Material / dirt", round1(state.mine.stockMaterial).toFixed(1) + " / " + round1(state.mine.stockDirt).toFixed(1) + " t"],
            ["Dirt ratio", Math.round(state.mine.ratio * 100) + "%"],
            ["Production", round1(staffedOutput).toFixed(1) + " raw t/cycle"],
            ["Workers", String(state.workers)],
            ["Contract truck", companyContract ? companyContract.truckSize.toUpperCase() + " · " + round1(companyContract.delivered).toFixed(1) + "/" + companyContract.quantity + " t" : currentHaul ? CONFIG.haulers[currentHaul.size].label + " · " + haulMinutesRemaining(currentHaul) + " min" : "Hire through Market contracts"],
            ["Warehouse", linkedWarehouse ? "Warehouse " + (state.warehouses.indexOf(linkedWarehouse) + 1) + " · Lv" + linkedWarehouse.level : warehouseParcel ? "Land prepared" : "Not connected"],
            ["Depth ore band", mineBandForDepth(state.mine.depth).materials.map(function (material) { return materialNames[material]; }).join(" · ")],
            ["Next seam", nextUnlockLevel ? materialNames[mineMaterialForLevel(state.mine, nextUnlockLevel)] + " at Lv" + nextUnlockLevel : "Depth limit reached"]
          ]);
          return;
        }

        if (state.location === "warehouse" && state.warehouse) {
          const warehouseIndex = state.warehouses.indexOf(state.warehouse) + 1;
          const parcel = parcelForWarehouse(state.warehouse);
          const linkedMine = parcel && state.mines.find(function (mine) { return mine.parcelId === parcel.mineParcelId; });
          const stored = usedStore(state.warehouse.storage);
          el.locationKicker.textContent = "Warehouse " + warehouseIndex + " operations";
          el.locationDetails.hidden = false;
          el.locationDetails.innerHTML = detailCards([
            ["Building level", state.warehouse.level + " / " + CONFIG.maxWarehouseLevel],
            ["Stored", round1(stored).toFixed(1) + " / " + warehouseCapacity().toFixed(1) + " t"],
            ["Free space", round1(Math.max(0, warehouseCapacity() - stored)).toFixed(1) + " t"],
            ["Inventory", cargoSummary(state.warehouse.storage)],
            ["Connected mine", linkedMine ? "Mine " + (state.mines.indexOf(linkedMine) + 1) + " · " + materialNames[linkedMine.material] : "No mine link"],
            ["Next capacity", state.warehouse.level >= CONFIG.maxWarehouseLevel ? "Maximum" : CONFIG.warehouseCapacityByLevel[state.warehouse.level + 1] + " t"]
          ]);
          return;
        }

        if (state.location === "mine-site" && state.mineParcel) {
          const clearedCells = parcelCells(state.mineParcel).filter(function (cell) { return isSurveyableGround(cell.x, cell.y); }).length;
          el.locationDetails.hidden = false;
          el.locationDetails.innerHTML = detailCards([
            ["Permit", parcelLabel(state.mineParcel)],
            ["Survey", materialNames[state.mineParcel.material] + " · " + Math.round(state.mineParcel.ratio * 100) + "% dirt"],
            ["Claim depth", (state.mineParcel.depth || 0) + " tiles"],
            ["Prepared", clearedCells + " / 4 tiles"]
          ]);
          return;
        }

        if (state.location === "warehouse-site" && state.warehouseParcel) {
          const clearedCells = parcelCells(state.warehouseParcel).filter(function (cell) { return isSurveyableGround(cell.x, cell.y); }).length;
          const linkedMine = state.mines.find(function (mine) {
            const parcel = parcelForMine(mine);
            return parcel && parcel.id === state.warehouseParcel.mineParcelId;
          });
          el.locationDetails.hidden = false;
          el.locationDetails.innerHTML = detailCards([
            ["Deed", state.warehouseParcel.status === "owned" ? "Owned" : "Not owned"],
            ["Prepared", clearedCells + " / 4 tiles"],
            ["Connected mine", linkedMine ? "Mine " + (state.mines.indexOf(linkedMine) + 1) : "No mine link"],
            ["Build cost", "$" + CONFIG.warehouseBuildCost]
          ]);
        }
      }

      function currentTruckStatus() {
        const moving = Boolean(state.path.length || movementSegment);
        const cargoUsed = usedCargo();
        const blocked = state.contextTone === "danger" && /blocked|no open route|cannot reach|no route/i.test(state.contextTitle + " " + state.contextText);
        if (blocked) return { key: "blocked", label: "Blocked" };
        if (cargoUsed >= state.capacity - .01) return { key: "full", label: "Full" };
        if (moving) return { key: "hauling", label: "Hauling" };
        if (cargoUsed > .01) return { key: "waiting", label: "Waiting" };
        if (!state.selected && !state.location) return { key: "no-destination", label: "No destination" };
        return { key: "idle", label: "Idle" };
      }

      function renderInterface() {
        if (!state.menuOpen) {
          newsReaderOpen = false;
          marketScreenOpen = false;
        }
        const dailyBulletin = applyDailyMarket();
        refreshCompanyDestinationOptions();
        el.land.textContent = landStatusText();
        el.cash.textContent = "$" + Math.round(state.cash);
        el.truck.textContent = round1(usedCargo()).toFixed(1) + " / " + state.capacity.toFixed(1) + " t";
        if (el.truckModel) el.truckModel.textContent = "V" + state.truckSpeedLevel + "S" + state.truckSizeLevel + "W" + state.workers;
        const truckStatus = currentTruckStatus();
        if (el.truckStatus) el.truckStatus.textContent = truckStatus.label;
        if (el.truckPanel) el.truckPanel.dataset.status = truckStatus.key;
        el.truck.setAttribute("data-tooltip", truckStatus.label + " · " + cargoSummary() + " · cargo size level " + state.truckSizeLevel + " · speed level " + state.truckSpeedLevel + " · " + state.workers + " permanent workers · prospector " + (state.prospectorHired ? "employed" : "not hired") + " · saw " + (state.sawOwnership || "not attached"));
        el.company.textContent = companyStatusText();
        root.dataset.resourceRoadOverlaps = String(roadSurfaceResourceOverlapCount());
        root.dataset.townMainStreetLanes = String(MAIN_STREET_BOTTOM - MAIN_STREET_TOP);
        root.dataset.townSideStreetLanes = String(TOWN_SIDE_STREET_WIDTH);
        root.dataset.townBlockCount = String(TOWN_BLOCKS.length);
        root.dataset.townLayoutConflicts = String(townLayoutConflictCount());
        root.dataset.townBlockEnclosureConflicts = String(townBlockEnclosureConflictCount());
        root.dataset.townStreetDeadEnds = String(townStreetDeadEndCount());
        root.dataset.townFrontageConflicts = String(townFrontageConflictCount());
        root.dataset.townPerimeterStreets = String(TOWN_PERIMETER_STREET_YS.length);
        root.dataset.townFutureLots = String(businessLots.filter(function (business) { return !state.townBusinesses[business.id]; }).length);
        el.time.textContent = "Day " + state.day + " · " + formatTime();
        el.contextTitle.textContent = state.contextTitle;
        el.context.textContent = state.contextText;
        root.dataset.roadPlanning = state.roadPlanning ? "true" : "false";
        if (el.mapTip) {
          if (state.roadPlanning) el.mapTip.textContent = "ROAD SURVEY · tap a continuous route · two tiles wide";
          else if (inputMode === "controller") el.mapTip.textContent = "Controller connected · RT drive · X cut · Y menu";
          else if (inputMode === "keyboard") el.mapTip.textContent = "Keyboard drive · E menu · Space cut";
          else el.mapTip.textContent = "Tap map · Arrows / WASD · Controller ready";
        }
        renderDailyBulletin(dailyBulletin);
        renderExpandedNewspaper(dailyBulletin);
        renderExchangeTerminal();
        renderContractTerminal();

        const selectedCleared = state.selected && state.selected.type === "cleared";
        const atSelected = selectedCleared && state.player.x === state.selected.x && state.player.y === state.selected.y;
        const onPlannedRoad = selectedCleared && (isPavedClaimRoad(state.selected.x, state.selected.y) || isPlayerClaimPath(state.selected.x, state.selected.y));
        const atProspectorDesk = state.location === "townhall";
        const atSurveyField = state.location === "cleared" && selectedCleared && !onPlannedRoad;
        const repeatsCurrentSurvey = selectedTileMatchesCurrentSurvey();
        const atConstructionEdge = state.location === "cleared" || state.location === "road" || state.location === "mine-site" || state.location === "warehouse-site";
        const minePermitted = state.mineParcel && (state.mineParcel.status === "leased" || state.mineParcel.status === "owned");
        const parcelMine = state.mineParcel && state.mines.find(function (mine) { return mine.parcelId === state.mineParcel.id; });
        const parcelWarehouse = state.warehouseParcel && state.warehouses.find(function (warehouse) { return warehouse.parcelId === state.warehouseParcel.id; });
        const mineUpgradeCost = state.mine && state.mine.level < CONFIG.maxMineLevel ? CONFIG.mineUpgradeCosts[state.mine.level] : 0;
        const warehouseUpgradeCost = state.warehouse && state.warehouse.level < CONFIG.maxWarehouseLevel ? CONFIG.warehouseUpgradeCosts[state.warehouse.level] : 0;

        el.hire.hidden = state.location !== "townhall";
        el.hire.disabled = state.prospectorHired || state.cash < CONFIG.prospectorCost;
        el.hire.textContent = state.prospectorHired
          ? "Prospector employed · " + prospectsRemaining() + "/" + CONFIG.prospectsPerDay + " left today"
          : "Hire permanent prospector · $" + CONFIG.prospectorCost;
        const workerCost = nextWorkerCost();
        el.hireWorker.hidden = state.location !== "market";
        el.hireWorker.disabled = !state.mine || state.workers >= CONFIG.maxWorkers || state.cash < workerCost;
        el.hireWorker.textContent = !state.mine
          ? "Build a mine before hiring a worker"
          : state.workers >= CONFIG.maxWorkers
            ? "Mine crew full · " + CONFIG.maxWorkers + " workers"
            : "Hire permanent worker " + (state.workers + 1) + "/" + CONFIG.maxWorkers + " · $" + workerCost;
        el.marketplace.hidden = state.location !== "market";
        el.marketplace.disabled = false;
        el.contracts.hidden = state.location !== "market";
        el.contracts.disabled = false;
        el.haulers.forEach(function (button) {
          const sizeKey = button.dataset.haulerSize;
          const hauler = CONFIG.haulers[sizeKey];
          const currentHaul = activeHaulForMine(state.mine);
          const projectedNet = projectedHaulNet(sizeKey);
          button.hidden = true;
          button.disabled = !state.mine || Boolean(currentHaul) || mineStockUsed() + .001 < hauler.capacity || state.cash < hauler.cost;
          button.dataset.profit = projectedNet < 0 ? "loss" : "gain";
          if (currentHaul && currentHaul.size === sizeKey) {
            button.textContent = hauler.label + " truck hired · " + haulMinutesRemaining(currentHaul) + " min remaining";
          } else if (currentHaul) {
            button.textContent = hauler.label + " truck unavailable · " + CONFIG.haulers[currentHaul.size].label + " serving this mine";
          } else {
            button.textContent = "Hire " + hauler.label + " truck · " + hauler.capacity + " t · $" + hauler.cost + "/load · est " + (projectedNet >= 0 ? "+$" : "-$") + Math.abs(projectedNet);
          }
        });
        el.buySaw.hidden = state.location !== "garage";
        el.buySaw.disabled = state.sawOwnership === "owned" || state.cash < CONFIG.sawPurchaseCost;
        el.buySaw.textContent = state.sawOwnership === "owned" ? "Saw owned" : "Buy saw attachment $" + CONFIG.sawPurchaseCost;
        el.rentSaw.hidden = state.location !== "rental";
        el.rentSaw.disabled = state.sawAttached || state.cash < CONFIG.sawRentalCost;
        el.rentSaw.textContent = state.sawOwnership === "owned" ? "Saw already owned" : state.sawOwnership === "rented" ? "Saw rented today" : "Rent saw for today $" + CONFIG.sawRentalCost;
        el.shaker.hidden = state.location !== "garage";
        el.shaker.disabled = state.shaker || state.cash < CONFIG.shakerCost;
        el.shaker.textContent = state.shaker ? "Shaker installed" : "Buy Shaker $" + CONFIG.shakerCost;
        const sizeUpgradeCost = nextTruckSizeCost();
        el.upgradeTruckSize.hidden = state.location !== "garage";
        el.upgradeTruckSize.disabled = state.truckSizeLevel >= CONFIG.maxTruckLevel || state.cash < sizeUpgradeCost;
        el.upgradeTruckSize.textContent = state.truckSizeLevel >= CONFIG.maxTruckLevel
          ? "Cargo size max · " + CONFIG.truckCapacityByLevel[CONFIG.maxTruckLevel] + " tons"
          : "Cargo size Lv" + (state.truckSizeLevel + 1) + " · " + CONFIG.truckCapacityByLevel[state.truckSizeLevel + 1] + " t · $" + sizeUpgradeCost;
        const speedUpgradeCost = nextTruckSpeedCost();
        el.upgradeTruckSpeed.hidden = state.location !== "garage";
        el.upgradeTruckSpeed.disabled = state.truckSpeedLevel >= CONFIG.maxTruckLevel || state.cash < speedUpgradeCost;
        el.upgradeTruckSpeed.textContent = state.truckSpeedLevel >= CONFIG.maxTruckLevel
          ? "Truck speed max · Lv" + CONFIG.maxTruckLevel
          : "Truck speed Lv" + (state.truckSpeedLevel + 1) + " · $" + speedUpgradeCost;
        el.roadPlan.hidden = state.location !== "townhall" || state.roadPlanning || state.roadDraft.length > 0 || Boolean(state.roadApproval);
        el.roadPlan.disabled = false;
        el.roadSubmit.hidden = state.location !== "townhall" || Boolean(state.roadApproval) || state.roadDraft.length === 0;
        el.roadSubmit.disabled = state.roadDraft.length < CONFIG.roadMinimumSurveyPoints;
        el.roadSubmit.textContent = "Submit " + roadDraftNewTiles(roadDraftPoints()).length + "-tile route for approval";
        el.roadAccept.hidden = state.location !== "townhall" || !state.roadApproval;
        el.roadAccept.disabled = !state.roadApproval || state.cash < state.roadApproval.totalCost;
        el.roadAccept.textContent = state.roadApproval ? "Buy " + state.roadApproval.stoneTons.toFixed(1) + " t stone & build · $" + state.roadApproval.totalCost : "Accept approved road contract";
        el.roadCancel.hidden = state.location !== "townhall" || (!state.roadPlanning && !state.roadDraft.length && !state.roadApproval);
        el.roadCancel.disabled = false;
        const gate = selectedClaimGate();
        el.unlockGate.hidden = state.location !== "gate" || !gate || isClaimGateOpen(gate);
        el.unlockGate.disabled = !gate || gate.sectionIndex !== state.unlockedClaimZones || state.cash < gate.cost;
        el.unlockGate.textContent = gate
          ? (isClaimGateOpen(gate) ? "Section " + gate.sectionNumber + " already unlocked" : "Unlock extraction field " + gate.sectionNumber + " · $" + gate.cost)
          : "Unlock claim section";
        el.readNews.hidden = state.location !== "newsstand";
        el.readNews.textContent = "Open full newspaper & price board";
        el.clear.hidden = !(state.sawAttached && state.selected && state.selected.type === "tree" && state.location === "tree" && isNextToSelected());
        el.clear.disabled = freeCargo() < .5;
        el.prospect.hidden = !atProspectorDesk && !atSurveyField;
        el.prospect.disabled = !state.prospectorHired || prospectsRemaining() <= 0 || !selectedCleared || onPlannedRoad || repeatsCurrentSurvey || (!atProspectorDesk && !atSelected);
        if (!state.prospectorHired) {
          el.prospect.textContent = "Hire prospector before surveying";
        } else if (prospectsRemaining() <= 0) {
          el.prospect.textContent = "Prospector finished · 0/" + CONFIG.prospectsPerDay + " today";
        } else if (!selectedCleared || onPlannedRoad) {
          el.prospect.textContent = "Select a cleared side tile · " + prospectsRemaining() + " left";
        } else if (repeatsCurrentSurvey) {
          el.prospect.textContent = "Choose another cleared tile · " + prospectsRemaining() + " left";
        } else if (atProspectorDesk) {
          el.prospect.textContent = "Send prospector to selected tile · " + prospectsRemaining() + " left";
        } else {
          el.prospect.textContent = (state.surveyParcel ? "Re-prospect this tile" : "Prospect this tile") + " · " + prospectsRemaining() + " left";
        }

        el.lease.hidden = !(state.location === "townhall" && state.surveyParcel);
        el.lease.disabled = state.cash < CONFIG.landLeasePerDay;
        el.lease.textContent = "Lease mine land · $" + CONFIG.landLeasePerDay + "/day";
        el.buyLand.hidden = !(state.location === "townhall" && state.mineParcel && state.mineParcel.status === "leased");
        el.buyLand.textContent = "Buy mine land $" + landBuyoutRemaining();
        el.buyLand.disabled = state.cash < landBuyoutRemaining();
        el.buyWarehouseLand.hidden = !(state.location === "townhall" && state.warehouseParcel && state.warehouseParcel.status === "available");
        el.buyWarehouseLand.disabled = state.cash < CONFIG.warehouseLandPrice;
        el.buyWarehouseLand.textContent = "Buy warehouse land · $" + CONFIG.warehouseLandPrice;

        el.buildMine.hidden = !atConstructionEdge || !minePermitted || Boolean(parcelMine);
        el.buildMine.disabled = !parcelCleared(state.mineParcel) || !besideParcel(state.mineParcel) || state.cash < CONFIG.mineBuildCost || state.mines.length >= mineSlotLimit();
        el.buildMine.textContent = "Build mine " + (state.mines.length + 1) + "/" + mineSlotLimit() + " · $" + CONFIG.mineBuildCost;
        el.loadMine.hidden = state.location !== "mine";
        el.loadMine.disabled = !state.mine || !atStructureDoor(state.mine) || mineStockUsed() <= .01 || freeCargo() <= .01;
        el.upgradeMine.hidden = state.location !== "mine" || !state.mine;
        const nextSeamLevel = state.mine ? nextMaterialUnlockLevel(state.mine) : null;
        el.upgradeMine.textContent = state.mine && state.mine.level < CONFIG.maxMineLevel
          ? "Drill Lv" + (state.mine.level + 1) + " · " + (nextSeamLevel === state.mine.level + 1 ? "unlocks " + materialNames[mineMaterialForLevel(state.mine, nextSeamLevel)] : "output " + CONFIG.mineOutputByLevel[state.mine.level + 1].toFixed(2) + " t/cycle") + " · $" + mineUpgradeCost
          : "Mine at max level · Lv" + CONFIG.maxMineLevel;
        const activeMineParcel = parcelForMine(state.mine);
        const upgradeChangesContractSeam = state.mine && activeCompanyContractForMine(state.mine) && mineMaterialForLevel(state.mine, state.mine.level + 1) !== state.mine.material;
        el.upgradeMine.disabled = !state.mine || state.mine.level >= CONFIG.maxMineLevel || state.cash < mineUpgradeCost || Boolean(upgradeChangesContractSeam) || (state.mine.level >= 3 && (!activeMineParcel || activeMineParcel.status !== "owned"));

        el.buildWarehouse.hidden = !atConstructionEdge || !(state.warehouseParcel && state.warehouseParcel.status === "owned") || Boolean(parcelWarehouse);
        el.buildWarehouse.disabled = !parcelCleared(state.warehouseParcel) || !besideParcel(state.warehouseParcel) || state.cash < CONFIG.warehouseBuildCost;
        el.buildWarehouse.textContent = "Build starter warehouse · $" + CONFIG.warehouseBuildCost;
        el.unloadWarehouse.hidden = state.location !== "warehouse" || !state.warehouse;
        el.unloadWarehouse.disabled = !state.warehouse || usedCargo() <= .01 || usedStore(state.warehouse.storage) >= warehouseCapacity() - .01;
        el.loadWarehouse.hidden = state.location !== "warehouse" || !state.warehouse;
        el.loadWarehouse.disabled = !state.warehouse || usedStore(state.warehouse.storage) <= .01 || freeCargo() <= .01;
        el.upgradeWarehouse.hidden = state.location !== "warehouse" || !state.warehouse;
        el.upgradeWarehouse.textContent = state.warehouse && state.warehouse.level < CONFIG.maxWarehouseLevel ? "Warehouse Lv" + (state.warehouse.level + 1) + " · " + CONFIG.warehouseCapacityByLevel[state.warehouse.level + 1] + " t · $" + warehouseUpgradeCost : "Warehouse at max level · Lv" + CONFIG.maxWarehouseLevel;
        el.upgradeWarehouse.disabled = !state.warehouse || state.warehouse.level >= CONFIG.maxWarehouseLevel || state.cash < warehouseUpgradeCost;

        el.zoomIn.disabled = !state.overview && state.zoomIndex >= 2;
        el.zoomOut.disabled = state.overview;
        el.overview.setAttribute("aria-pressed", state.overview ? "true" : "false");
        el.overview.setAttribute("aria-label", state.overview ? "Follow truck" : "World map");
        el.overview.title = state.overview ? "Follow truck" : "World map";
        syncAudioButtons();
        const fullscreenElement = activeFullscreenElement();
        root.dataset.fullscreen = fullscreenElement ? "true" : "false";
        root.dataset.fullscreenTarget = fullscreenElement === root ? "game" : fullscreenElement ? "document" : "none";
        el.landscape.textContent = fullscreenElement ? "⛶ Exit full screen" : "⛶ Full screen";

        const panelTitles = {
          market: "Market sales & hiring",
          townhall: "Town Hall permits",
          garage: "Garage upgrades",
          rental: "Rental Shop",
          newsstand: "Newsstand",
          mine: "Mine controls",
          warehouse: "Warehouse controls",
          cleared: "Field crew",
          gate: "Claim gate",
          "mine-site": "Mine construction",
          "warehouse-site": "Warehouse construction"
        };
        const serviceButtons = Array.from(el.actions.querySelectorAll("button"));
        serviceButtons.forEach(function (button) {
          if (button.disabled && !button.hidden) button.title = unavailableActionReason(button);
          else button.removeAttribute("title");
        });
        const hasVisibleService = serviceButtons.some(function (button) { return !button.hidden; });
        const firstEnabledService = serviceButtons.find(function (button) { return !button.hidden && !button.disabled; });
        const firstDisabledService = serviceButtons.find(function (button) { return !button.hidden && button.disabled; });
        const panelTitle = panelTitles[state.location] || "Company controls";
        renderLocationDetails();
        el.menuLayer.hidden = !state.menuOpen;
        el.buildingPanel.hidden = newsReaderOpen || marketScreenOpen;
        el.newsReader.hidden = !newsReaderOpen;
        el.marketScreen.hidden = !marketScreenOpen;
        el.exchangePanel.hidden = marketScreenTab !== "exchange";
        el.contractPanel.hidden = marketScreenTab !== "contracts";
        el.marketTabExchange.setAttribute("aria-pressed", marketScreenTab === "exchange" ? "true" : "false");
        el.marketTabContracts.setAttribute("aria-pressed", marketScreenTab === "contracts" ? "true" : "false");
        el.buildingPanelTitle.textContent = panelTitle;
        el.noActions.hidden = hasVisibleService;
        el.actionHint.textContent = firstEnabledService
          ? "Ready: " + firstEnabledService.textContent + "."
          : unavailableActionReason(firstDisabledService);
        el.actionHint.dataset.tone = firstEnabledService ? state.contextTone : (firstDisabledService ? "danger" : "neutral");
        el.systemMenu.hidden = !systemMenuOpen;
        el.menuToggle.hidden = false;
        el.menuToggle.setAttribute("aria-expanded", systemMenuOpen ? "true" : "false");
        el.menuToggle.title = systemMenuOpen ? "Close menu" : "Menu";
        el.fastTravelMenu.hidden = !fastTravelOpen;
        el.fastTravelToggle.setAttribute("aria-expanded", fastTravelOpen ? "true" : "false");
        const treeReady = state.selected && state.selected.type === "tree" && isNextToSelected();
        const interactionLabel = treeReady
          ? "Cut selected tree"
          : locationSupportsContextMenu()
            ? "Open " + panelTitle
            : "Interact with this location";
        el.touchInteract.setAttribute("aria-label", interactionLabel);
        el.touchInteract.title = interactionLabel;
        saveState(false);
      }

      function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
        const width = Math.round(rect.width);
        const height = Math.round(rect.height);
        if (width < 2 || height < 2) return false;
        if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
          canvas.width = Math.round(width * dpr);
          canvas.height = Math.round(height * dpr);
        }
        viewport = { width: width, height: height, dpr: dpr };
        return true;
      }

      function stabilizeViewport() {
        const refresh = function () {
          if (!resizeCanvas()) return;
          drawMap();
        };
        refresh();
        requestAnimationFrame(refresh);
        setTimeout(refresh, 90);
        setTimeout(refresh, 260);
      }

      function calculateView() {
        if (state.overview) {
          const scale = Math.min((viewport.width - 8) / WORLD_WIDTH, (viewport.height - 8) / WORLD_HEIGHT);
          drawView = {
            scale: scale,
            originX: 0,
            originY: 0,
            offsetX: (viewport.width - WORLD_WIDTH * scale) / 2,
            offsetY: (viewport.height - WORLD_HEIGHT * scale) / 2
          };
          return;
        }
        const desktopScales = [12, 18, 28];
        const mobileScales = [9, 14, 22];
        const scales = viewport.width < 420 ? mobileScales : desktopScales;
        const scale = scales[state.zoomIndex];
        const tilesWide = viewport.width / scale;
        const tilesHigh = viewport.height / scale;
        const originX = Math.max(0, Math.min(WORLD_WIDTH - tilesWide, visualPlayer.x + .5 - tilesWide / 2));
        const originY = Math.max(0, Math.min(WORLD_HEIGHT - tilesHigh, visualPlayer.y + .5 - tilesHigh / 2));
        drawView = { scale: scale, originX: originX, originY: originY, offsetX: 0, offsetY: 0 };
      }

      function screenPoint(x, y) {
        return {
          x: drawView.offsetX + (x - drawView.originX) * drawView.scale,
          y: drawView.offsetY + (y - drawView.originY) * drawView.scale
        };
      }

      function worldPoint(screenX, screenY) {
        return {
          x: Math.floor((screenX - drawView.offsetX) / drawView.scale + drawView.originX),
          y: Math.floor((screenY - drawView.offsetY) / drawView.scale + drawView.originY)
        };
      }

      function fillTile(x, y, color, alpha) {
        const point = screenPoint(x, y);
        ctx.globalAlpha = alpha == null ? 1 : alpha;
        ctx.fillStyle = color;
        ctx.fillRect(Math.floor(point.x), Math.floor(point.y), Math.ceil(drawView.scale), Math.ceil(drawView.scale));
        ctx.globalAlpha = 1;
      }

      function roundedPath(x, y, width, height, radius) {
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(x, y, width, height, radius);
        } else {
          ctx.rect(x, y, width, height);
        }
      }

      function drawTree(x, y, colors) {
        const point = screenPoint(x, y);
        const size = drawView.scale;
        if (size >= 14) {
          ctx.save();
          ctx.shadowColor = colors.shadow;
          ctx.shadowBlur = size * .28;
          ctx.shadowOffsetY = size * .16;
          ctx.globalAlpha = .58;
          ctx.fillStyle = colors.shadow;
          ctx.beginPath();
          ctx.ellipse(point.x + size * .54, point.y + size * .78, size * .3, size * .14, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        ctx.strokeStyle = colors.roof;
        ctx.lineWidth = Math.max(1, size * .12);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(point.x + size * .5, point.y + size * .55);
        ctx.lineTo(point.x + size * .5, point.y + size * .9);
        ctx.stroke();

        ctx.globalAlpha = .98;
        ctx.fillStyle = colors.tree;
        ctx.beginPath();
        ctx.arc(point.x + size * .38, point.y + size * .43, Math.max(1, size * .27), 0, Math.PI * 2);
        ctx.arc(point.x + size * .62, point.y + size * .43, Math.max(1, size * .27), 0, Math.PI * 2);
        ctx.arc(point.x + size * .5, point.y + size * .3, Math.max(1, size * .3), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = .7;
        ctx.fillStyle = colors.treeLight;
        ctx.beginPath();
        ctx.arc(point.x + size * .39, point.y + size * .26, Math.max(1, size * .12), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      function drawClaimGroundTexture(x, y, colors) {
        if (drawView.scale < 8) return;
        const point = screenPoint(x, y);
        const size = drawView.scale;
        const seed = seededUnit(x, y, 211, 17);
        ctx.save();
        ctx.globalAlpha = isNaturalDirtAt(x, y) || isCleared(x, y) ? .2 : .13;
        ctx.fillStyle = isNaturalDirtAt(x, y) || isCleared(x, y) ? colors.wallDark : colors.tree;
        for (let dot = 0; dot < 2; dot += 1) {
          const dotX = point.x + size * (.2 + ((seed * 7 + dot * .37) % .62));
          const dotY = point.y + size * (.18 + ((seed * 11 + dot * .29) % .64));
          ctx.beginPath();
          ctx.arc(dotX, dotY, Math.max(.7, size * .035), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      function surfaceResourceColor(material) {
        return {
          stone: "#8d9ba6",
          clay: "#b96f47",
          coal: "#242b33",
          iron: "#9c5a43",
          copper: "#d47f42",
          tin: "#a7bac5",
          quartz: "#dad8ff",
          silver: "#d7e1eb",
          gold: "#ffd75e",
          sapphire: "#4f70e8"
        }[material] || "#8795a1";
      }

      function drawSurfaceResource(x, y, material, colors) {
        const point = screenPoint(x, y);
        const size = drawView.scale;
        const oreColor = surfaceResourceColor(material);
        if (size < 4) {
          ctx.fillStyle = oreColor;
          ctx.globalAlpha = .85;
          ctx.fillRect(point.x + size * .2, point.y + size * .2, size * .6, size * .6);
          ctx.globalAlpha = 1;
          return;
        }
        ctx.save();
        ctx.shadowColor = colors.shadow;
        ctx.shadowBlur = Math.max(1, size * .13);
        const stones = [[.2, .58, .13], [.37, .35, .16], [.57, .6, .14], [.76, .39, .12], [.72, .73, .1]];
        stones.forEach(function (stone, index) {
          ctx.fillStyle = index % 2 ? oreColor : colors.wallDark;
          ctx.beginPath();
          ctx.moveTo(point.x + size * stone[0], point.y + size * (stone[1] - stone[2]));
          ctx.lineTo(point.x + size * (stone[0] + stone[2]), point.y + size * stone[1]);
          ctx.lineTo(point.x + size * stone[0], point.y + size * (stone[1] + stone[2]));
          ctx.lineTo(point.x + size * (stone[0] - stone[2]), point.y + size * stone[1]);
          ctx.closePath();
          ctx.fill();
          if (index % 2) {
            ctx.strokeStyle = "rgba(255,255,255,.58)";
            ctx.lineWidth = Math.max(.6, size * .035);
            ctx.stroke();
          }
        });
        ctx.restore();
      }

      function drawStoneWallCell(x, y, colors) {
        const point = screenPoint(x, y);
        const size = drawView.scale;
        if (size < 5) {
          ctx.fillStyle = colors.wallDark;
          ctx.fillRect(point.x, point.y, Math.ceil(size), Math.ceil(size));
          ctx.fillStyle = colors.wallLight;
          ctx.globalAlpha = .72;
          ctx.fillRect(point.x, point.y, Math.ceil(size), Math.max(1, size * .34));
          ctx.globalAlpha = 1;
          return;
        }
        ctx.save();
        ctx.shadowColor = colors.shadow;
        ctx.shadowBlur = Math.max(1, size * .2);
        ctx.shadowOffsetY = Math.max(1, size * .08);
        ctx.fillStyle = colors.wallDark;
        roundedPath(point.x, point.y, Math.ceil(size), Math.ceil(size), Math.max(1, size * .12));
        ctx.fill();
        ctx.shadowColor = "transparent";
        ctx.fillStyle = colors.wall;
        roundedPath(point.x + size * .08, point.y + size * .08, size * .84, size * .8, Math.max(1, size * .11));
        ctx.fill();
        ctx.fillStyle = colors.wallLight;
        ctx.globalAlpha = .78;
        ctx.beginPath();
        ctx.moveTo(point.x + size * .12, point.y + size * .14);
        ctx.lineTo(point.x + size * .78, point.y + size * .14);
        ctx.lineTo(point.x + size * .62, point.y + size * .32);
        ctx.lineTo(point.x + size * .2, point.y + size * .36);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = colors.wallDark;
        ctx.lineWidth = Math.max(.7, size * .055);
        ctx.beginPath();
        ctx.moveTo(point.x + size * .58, point.y + size * .35);
        ctx.lineTo(point.x + size * .48, point.y + size * .58);
        ctx.lineTo(point.x + size * .68, point.y + size * .74);
        ctx.stroke();
        ctx.restore();
      }

      function drawClaimGateCell(x, y, gate, colors) {
        const point = screenPoint(x, y);
        const size = drawView.scale;
        const open = isClaimGateOpen(gate);
        ctx.save();
        ctx.fillStyle = open ? colors.road : colors.wallDark;
        ctx.fillRect(point.x, point.y, Math.ceil(size), Math.ceil(size));
        ctx.fillStyle = colors.wall;
        ctx.fillRect(point.x, point.y, size * .18, size);
        ctx.fillRect(point.x + size * .82, point.y, size * .18, size);
        ctx.fillStyle = open ? colors.roadLine : "#d8a62a";
        if (open) {
          ctx.fillRect(point.x + size * .14, point.y + size * .08, size * .16, size * .84);
          ctx.fillRect(point.x + size * .7, point.y + size * .08, size * .16, size * .84);
        } else {
          roundedPath(point.x + size * .18, point.y + size * .08, size * .64, size * .84, Math.max(1, size * .08));
          ctx.fill();
          ctx.strokeStyle = colors.wallDark;
          ctx.lineWidth = Math.max(.8, size * .055);
          for (let bar = 1; bar < 4; bar += 1) {
            const barX = point.x + size * (.18 + .64 * bar / 4);
            ctx.beginPath();
            ctx.moveTo(barX, point.y + size * .12);
            ctx.lineTo(barX, point.y + size * .88);
            ctx.stroke();
          }
          if (drawView.scale >= 10) {
            ctx.fillStyle = colors.wallDark;
            ctx.beginPath();
            ctx.arc(point.x + size * .5, point.y + size * .48, Math.max(2, size * .13), 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(point.x + size * .43, point.y + size * .48, size * .14, size * .2);
          }
        }
        ctx.restore();
      }

      function drawActiveGateLabels(colors) {
        if (drawView.scale < 5) return;
        CLAIM_SECTION_DEPTHS.forEach(function (depth, sectionIndex) {
          const gate = claimGateAt(PLAYER_ROAD_X, claimYAtDepth("south", depth));
          if (!gate) return;
          const point = screenPoint(PLAYER_ROAD_X + 1, gate.y);
          const label = isClaimGateOpen(gate) ? (sectionIndex === 0 ? "P4 CLAIM" : "OPEN") : "$" + gate.cost;
          const width = Math.max(30, Math.min(66, label.length * 7 + 14));
          const height = Math.max(13, Math.min(19, drawView.scale * .78));
          ctx.save();
          ctx.fillStyle = isClaimGateOpen(gate) ? "rgba(36,116,95,.94)" : "rgba(32,38,48,.95)";
          roundedPath(point.x - width / 2, point.y - height - 3, width, height, height * .35);
          ctx.fill();
          ctx.strokeStyle = isClaimGateOpen(gate) ? colors.treeLight : "#ffd75e";
          ctx.lineWidth = 1.5;
          roundedPath(point.x - width / 2, point.y - height - 3, width, height, height * .35);
          ctx.stroke();
          ctx.fillStyle = "#ffffff";
          ctx.font = "900 " + Math.max(7, Math.min(10, drawView.scale * .45)) + "px system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(label, point.x, point.y - height / 2 - 3);
          ctx.restore();
        });
      }

      function drawBuilding(building, colors) {
        const point = screenPoint(building.x, building.y);
        const width = building.w * drawView.scale;
        const height = building.h * drawView.scale;
        const radius = Math.max(2, Math.min(12, drawView.scale * .45));
        const styles = {
          townhall: { wall: "#ead7ad", roof: "#334b78", roofLight: "#56709c", trim: "#ffd75e", accent: "#f8f3df", dark: "#1f3154", sign: "TOWN HALL" },
          market: { wall: "#eaa25e", roof: "#b94753", roofLight: "#db6871", trim: "#ffe7a0", accent: "#fff8df", dark: "#71303b", sign: "MARKET" },
          garage: { wall: "#879bab", roof: "#31465c", roofLight: "#536b80", trim: "#e99042", accent: "#dce8ef", dark: "#213242", sign: "GARAGE" },
          rental: { wall: "#72b7a9", roof: "#286f69", roofLight: "#419188", trim: "#ffd75e", accent: "#e7faf4", dark: "#184b47", sign: "RENTAL" },
          newsstand: { wall: "#f1d8ae", roof: "#8f2f3b", roofLight: "#bd4b58", trim: "#ffd75e", accent: "#fffdf1", dark: "#582029", sign: "DAILY" },
          foundry: { wall: "#98654e", roof: "#3e4650", roofLight: "#66727d", trim: "#e99042", accent: "#ffd0a0", dark: "#2b3036", sign: "FOUNDRY" },
          railworks: { wall: "#788b99", roof: "#33414e", roofLight: "#5c7080", trim: "#ffd75e", accent: "#dce8ef", dark: "#202e39", sign: "RAIL WORKS" },
          glassworks: { wall: "#86c9ca", roof: "#3e4ed0", roofLight: "#6d7af0", trim: "#d8c9f4", accent: "#e9fbff", dark: "#26337e", sign: "GLASSWORKS" },
          cannery: { wall: "#d88b58", roof: "#356d67", roofLight: "#568f88", trim: "#ffd75e", accent: "#e8faf4", dark: "#244c48", sign: "CANNERY" }
        };
        const style = styles[building.id] || { wall: colors.building, roof: colors.roof, roofLight: colors.building, trim: colors.roadLine, accent: colors.window, dark: colors.foreground, sign: building.sign || building.label.toUpperCase() };

        ctx.save();
        ctx.shadowColor = colors.shadow;
        ctx.shadowBlur = Math.max(3, drawView.scale * .7);
        ctx.shadowOffsetY = Math.max(2, drawView.scale * .26);
        ctx.fillStyle = style.wall;
        roundedPath(point.x, point.y, width, height, radius);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = style.roof;
        roundedPath(point.x + width * .045, point.y + height * .045, width * .91, height * .72, radius * .72);
        ctx.fill();

        ctx.strokeStyle = style.roofLight;
        ctx.globalAlpha = .72;
        ctx.lineWidth = Math.max(1, drawView.scale * .065);
        const ridgeCount = Math.max(2, Math.min(8, Math.round(building.w / 2)));
        for (let ridge = 1; ridge < ridgeCount; ridge += 1) {
          const ridgeX = point.x + width * (.045 + .91 * ridge / ridgeCount);
          ctx.beginPath();
          ctx.moveTo(ridgeX, point.y + height * .08);
          ctx.lineTo(ridgeX, point.y + height * .72);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;

        if (building.id === "townhall") {
          const porticoY = point.y + height * .68;
          ctx.fillStyle = style.accent;
          roundedPath(point.x + width * .31, porticoY, width * .38, height * .24, radius * .35);
          ctx.fill();
          ctx.fillStyle = style.trim;
          for (let column = 0; column < 4; column += 1) {
            ctx.fillRect(point.x + width * (.35 + column * .095), porticoY + height * .03, Math.max(1.5, width * .025), height * .16);
          }
          ctx.fillStyle = style.dark;
          ctx.beginPath();
          ctx.arc(point.x + width * .5, point.y + height * .34, Math.max(3, Math.min(width, height) * .105), 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = style.trim;
          ctx.lineWidth = Math.max(1, drawView.scale * .11);
          ctx.stroke();
          ctx.fillStyle = style.trim;
          ctx.fillRect(point.x + width * .485, point.y + height * .17, width * .03, height * .17);
        } else if (building.id === "market") {
          const awningY = point.y + height * .66;
          const stripes = 7;
          for (let stripe = 0; stripe < stripes; stripe += 1) {
            ctx.fillStyle = stripe % 2 ? style.accent : style.trim;
            ctx.fillRect(point.x + width * (.07 + .86 * stripe / stripes), awningY, width * .86 / stripes + 1, height * .12);
          }
          ctx.fillStyle = style.dark;
          ctx.fillRect(point.x + width * .1, point.y + height * .82, width * .18, height * .09);
          ctx.fillRect(point.x + width * .72, point.y + height * .82, width * .18, height * .09);
          ctx.fillStyle = style.trim;
          ctx.fillRect(point.x + width * .14, point.y + height * .84, width * .1, height * .04);
          ctx.fillRect(point.x + width * .76, point.y + height * .84, width * .1, height * .04);
        } else if (building.id === "garage") {
          const bayY = point.y + height * .6;
          for (let bay = 0; bay < 3; bay += 1) {
            const bayX = point.x + width * (.08 + bay * .305);
            ctx.fillStyle = style.accent;
            ctx.fillRect(bayX, bayY, width * .24, height * .27);
            ctx.strokeStyle = style.dark;
            ctx.lineWidth = Math.max(1, drawView.scale * .05);
            for (let line = 1; line < 4; line += 1) {
              ctx.beginPath();
              ctx.moveTo(bayX, bayY + height * .27 * line / 4);
              ctx.lineTo(bayX + width * .24, bayY + height * .27 * line / 4);
              ctx.stroke();
            }
          }
          ctx.fillStyle = style.trim;
          ctx.fillRect(point.x + width * .08, point.y + height * .49, width * .84, Math.max(2, height * .045));
        } else if (building.id === "rental") {
          ctx.fillStyle = style.accent;
          for (let slot = 0; slot < 3; slot += 1) {
            const slotX = point.x + width * (.12 + slot * .3);
            roundedPath(slotX, point.y + height * .63, width * .18, height * .22, radius * .2);
            ctx.fill();
            ctx.fillStyle = style.trim;
            ctx.fillRect(slotX + width * .035, point.y + height * .69, width * .11, height * .04);
            ctx.fillStyle = style.accent;
          }
        } else if (building.id === "newsstand") {
          ctx.fillStyle = style.accent;
          roundedPath(point.x + width * .12, point.y + height * .5, width * .76, height * .38, radius * .3);
          ctx.fill();
          ctx.strokeStyle = style.dark;
          ctx.lineWidth = Math.max(1, drawView.scale * .055);
          for (let line = 1; line < 4; line += 1) {
            ctx.beginPath();
            ctx.moveTo(point.x + width * .2, point.y + height * (.54 + line * .07));
            ctx.lineTo(point.x + width * .8, point.y + height * (.54 + line * .07));
            ctx.stroke();
          }
        }

        ctx.strokeStyle = style.dark;
        ctx.lineWidth = Math.max(1, drawView.scale * .07);
        roundedPath(point.x, point.y, width, height, radius);
        ctx.stroke();

        if (width >= 30 && height >= 18) {
          const signWidth = Math.min(width * .7, Math.max(34, style.sign.length * 7));
          const signHeight = Math.max(12, Math.min(22, drawView.scale * 1.05));
          const signX = point.x + (width - signWidth) / 2;
          const signY = point.y + height * .39;
          ctx.fillStyle = "rgba(20,31,58,.88)";
          roundedPath(signX, signY, signWidth, signHeight, Math.max(3, signHeight * .28));
          ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,.48)";
          ctx.lineWidth = 1;
          roundedPath(signX, signY, signWidth, signHeight, Math.max(3, signHeight * .28));
          ctx.stroke();
          ctx.fillStyle = building.id === "townhall" ? style.trim : "#ffffff";
          ctx.font = "900 " + Math.max(7, Math.min(11, drawView.scale * .62)) + "px system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(style.sign, point.x + width / 2, signY + signHeight / 2 + .5, signWidth - 5);
        }

        const doorPoint = screenPoint(building.doorX, building.doorY);
        const doorX = doorPoint.x + drawView.scale / 2;
        const doorY = doorPoint.y + drawView.scale / 2;
        ctx.save();
        ctx.shadowColor = colors.shadow;
        ctx.shadowBlur = Math.max(2, drawView.scale * .22);
        ctx.fillStyle = style.trim;
        ctx.strokeStyle = "rgba(255,255,255,.94)";
        ctx.lineWidth = Math.max(1, drawView.scale * .09);
        ctx.beginPath();
        ctx.arc(doorX, doorY, Math.max(2.5, drawView.scale * .25), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      function drawComingSoonBusiness(business, colors) {
        const point = screenPoint(business.x, business.y);
        const width = business.w * drawView.scale;
        const height = business.h * drawView.scale;
        ctx.save();
        ctx.fillStyle = "rgba(241,207,141,.72)";
        ctx.strokeStyle = "#9a6a32";
        ctx.lineWidth = Math.max(1, drawView.scale * .08);
        ctx.setLineDash([Math.max(3, drawView.scale * .35), Math.max(2, drawView.scale * .22)]);
        roundedPath(point.x, point.y, width, height, Math.max(3, drawView.scale * .3));
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#667482";
        [[.18, .65, .24, .18], [.58, .52, .28, .24], [.3, .22, .34, .16]].forEach(function (pile) {
          roundedPath(point.x + width * pile[0], point.y + height * pile[1], width * pile[2], height * pile[3], 3);
          ctx.fill();
        });
        const signWidth = Math.min(width * .86, 112);
        const signHeight = Math.max(18, Math.min(28, drawView.scale * 1.4));
        ctx.fillStyle = "#16213e";
        roundedPath(point.x + (width - signWidth) / 2, point.y + height * .34, signWidth, signHeight, 5);
        ctx.fill();
        ctx.fillStyle = "#ffd75e";
        ctx.font = "950 " + Math.max(8, Math.min(12, drawView.scale * .62)) + "px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("COMING SOON", point.x + width / 2, point.y + height * .34 + signHeight / 2, signWidth - 8);
        ctx.restore();
        const door = screenPoint(business.doorX, business.doorY);
        ctx.fillStyle = colors.roadLine;
        ctx.beginPath();
        ctx.arc(door.x + drawView.scale / 2, door.y + drawView.scale / 2, Math.max(2.5, drawView.scale * .24), 0, Math.PI * 2);
        ctx.fill();
      }

      function parcelStroke(parcel, colors) {
        if (!parcel) return colors.ring;
        return parcel.status === "owned" ? colors.owned : parcel.status === "leased" ? colors.leased : colors.ring;
      }

      function drawParcel(parcel, colors, label) {
        if (!parcel) return;
        const point = screenPoint(parcel.x, parcel.y);
        ctx.strokeStyle = parcelStroke(parcel, colors);
        ctx.lineWidth = Math.max(1, drawView.scale * .14);
        if (parcel.status === "surveyed" || parcel.status === "available") {
          ctx.setLineDash([Math.max(2, drawView.scale * .34), Math.max(2, drawView.scale * .22)]);
        }
        ctx.strokeRect(point.x, point.y, parcel.w * drawView.scale, parcel.h * drawView.scale);
        ctx.setLineDash([]);
        if (drawView.scale >= 18) {
          ctx.fillStyle = colors.foreground;
          ctx.font = "400 11px system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText(label, point.x + parcel.w * drawView.scale / 2, point.y - 2);
        }
      }

      function structureResourceColor(material) {
        const resourceColors = {
          stone: "#a8b0bb",
          clay: "#c8734e",
          coal: "#343a45",
          iron: "#788b99",
          copper: "#cf774e",
          tin: "#c4d2d8",
          quartz: "#d8c9f4",
          silver: "#dce8ef",
          gold: "#ffd75e",
          sapphire: "#5b82f8"
        };
        return resourceColors[material] || "#a8b0bb";
      }

      function drawCompanyStructure(structure, colors, label, kind) {
        if (!structure) return;
        const point = screenPoint(structure.x, structure.y);
        const width = structure.w * drawView.scale;
        const height = structure.h * drawView.scale;
        const radius = Math.max(2, drawView.scale * .28);
        const outline = kind === "mine" && parcelForMine(structure) && parcelForMine(structure).status === "leased" ? colors.leased : colors.owned;

        ctx.save();
        ctx.shadowColor = colors.shadow;
        ctx.shadowBlur = Math.max(3, drawView.scale * .58);
        ctx.shadowOffsetY = Math.max(1, drawView.scale * .2);
        ctx.fillStyle = kind === "warehouse" ? "#31485e" : "#28323f";
        roundedPath(point.x, point.y, width, height, radius);
        ctx.fill();
        ctx.restore();

        if (kind === "warehouse") {
          ctx.fillStyle = "#d9e3e9";
          roundedPath(point.x + width * .08, point.y + height * .08, width * .84, height * .7, radius * .72);
          ctx.fill();
          ctx.strokeStyle = "#91a7b5";
          ctx.lineWidth = Math.max(1, drawView.scale * .045);
          for (let ridge = 1; ridge < 4; ridge += 1) {
            const ridgeX = point.x + width * (.08 + .84 * ridge / 4);
            ctx.beginPath();
            ctx.moveTo(ridgeX, point.y + height * .11);
            ctx.lineTo(ridgeX, point.y + height * .75);
            ctx.stroke();
          }
          ctx.fillStyle = "#203344";
          for (let bay = 0; bay < 2; bay += 1) {
            const bayX = point.x + width * (.14 + bay * .43);
            ctx.fillRect(bayX, point.y + height * .69, width * .29, height * .2);
            ctx.strokeStyle = "#8ea4b2";
            ctx.lineWidth = Math.max(1, drawView.scale * .035);
            for (let line = 1; line < 3; line += 1) {
              ctx.beginPath();
              ctx.moveTo(bayX, point.y + height * (.69 + line * .06));
              ctx.lineTo(bayX + width * .29, point.y + height * (.69 + line * .06));
              ctx.stroke();
            }
          }
          ctx.fillStyle = "#d89a4d";
          ctx.fillRect(point.x + width * .12, point.y + height * .48, width * .18, height * .15);
          ctx.fillRect(point.x + width * .68, point.y + height * .45, width * .2, height * .18);
          ctx.strokeStyle = "#8a5725";
          ctx.lineWidth = Math.max(1, drawView.scale * .035);
          ctx.strokeRect(point.x + width * .12, point.y + height * .48, width * .18, height * .15);
          ctx.strokeRect(point.x + width * .68, point.y + height * .45, width * .2, height * .18);
          if (structure.level >= 4) {
            ctx.fillStyle = "#70e1c1";
            ctx.beginPath();
            ctx.arc(point.x + width * .5, point.y + height * .25, Math.max(2, width * .08), 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "rgba(255,255,255,.85)";
            ctx.stroke();
          }
        } else {
          const oreColor = structureResourceColor(structure.material);
          ctx.fillStyle = "#171d25";
          ctx.beginPath();
          ctx.arc(point.x + width * .37, point.y + height * .42, Math.max(3, width * .23), 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#65717d";
          ctx.lineWidth = Math.max(1, drawView.scale * .11);
          ctx.stroke();

          ctx.strokeStyle = "#f0bb42";
          ctx.lineWidth = Math.max(1.5, drawView.scale * .12);
          ctx.beginPath();
          ctx.moveTo(point.x + width * .16, point.y + height * .2);
          ctx.lineTo(point.x + width * .37, point.y + height * .04);
          ctx.lineTo(point.x + width * .58, point.y + height * .2);
          ctx.moveTo(point.x + width * .23, point.y + height * .22);
          ctx.lineTo(point.x + width * .51, point.y + height * .22);
          ctx.stroke();

          ctx.fillStyle = "#596775";
          roundedPath(point.x + width * .45, point.y + height * .46, width * .48, height * .2, radius * .35);
          ctx.fill();
          ctx.strokeStyle = "#222c36";
          ctx.lineWidth = Math.max(1, drawView.scale * .04);
          for (let slat = 1; slat < 5; slat += 1) {
            const slatX = point.x + width * (.45 + .48 * slat / 5);
            ctx.beginPath();
            ctx.moveTo(slatX, point.y + height * .47);
            ctx.lineTo(slatX, point.y + height * .64);
            ctx.stroke();
          }
          ctx.fillStyle = "#435363";
          roundedPath(point.x + width * .08, point.y + height * .68, width * .32, height * .22, radius * .32);
          ctx.fill();
          ctx.fillStyle = "#70e1c1";
          ctx.beginPath();
          ctx.arc(point.x + width * .18, point.y + height * .79, Math.max(1.5, width * .035), 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = oreColor;
          const oreRadius = Math.max(1.5, width * .07);
          [[.72, .77], [.82, .72], [.88, .82], [.76, .87]].forEach(function (ore) {
            ctx.beginPath();
            ctx.arc(point.x + width * ore[0], point.y + height * ore[1], oreRadius, 0, Math.PI * 2);
            ctx.fill();
          });
        }

        ctx.strokeStyle = outline;
        ctx.lineWidth = Math.max(1.5, drawView.scale * .11);
        roundedPath(point.x, point.y, width, height, radius);
        ctx.stroke();

        if (drawView.scale >= 12 && width >= 22) {
          const badgeWidth = Math.min(width * .72, Math.max(22, label.length * 4.7));
          const badgeHeight = Math.max(9, Math.min(15, drawView.scale * .7));
          const badgeX = point.x + (width - badgeWidth) / 2;
          const badgeY = point.y + Math.max(2, height * .045);
          ctx.fillStyle = kind === "warehouse" ? "rgba(25,49,69,.94)" : "rgba(21,26,34,.94)";
          roundedPath(badgeX, badgeY, badgeWidth, badgeHeight, Math.max(3, badgeHeight * .35));
          ctx.fill();
          ctx.strokeStyle = outline;
          ctx.lineWidth = 1;
          roundedPath(badgeX, badgeY, badgeWidth, badgeHeight, Math.max(3, badgeHeight * .35));
          ctx.stroke();
          ctx.fillStyle = "#ffffff";
          ctx.font = "900 " + Math.max(6, Math.min(9, drawView.scale * .43)) + "px system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(label, point.x + width / 2, badgeY + badgeHeight / 2 + .3, badgeWidth - 4);
        }

        if (drawView.scale >= 12) {
          const lights = Math.min(4, Math.max(1, Math.ceil(structure.level / 2)));
          for (let light = 0; light < lights; light += 1) {
            ctx.fillStyle = light < Math.ceil(structure.level / 2) ? colors.roadLine : "rgba(255,255,255,.24)";
            ctx.beginPath();
            ctx.arc(point.x + width * (.3 + light * .14), point.y + height * .94, Math.max(1.4, drawView.scale * .075), 0, Math.PI * 2);
            ctx.fill();
          }
        }

        const door = structureDoor(structure);
        const doorPoint = screenPoint(door.x, door.y);
        ctx.save();
        ctx.fillStyle = colors.roadLine;
        ctx.strokeStyle = "rgba(255,255,255,.92)";
        ctx.lineWidth = Math.max(1, drawView.scale * .1);
        ctx.beginPath();
        ctx.arc(doorPoint.x + drawView.scale / 2, doorPoint.y + drawView.scale / 2, Math.max(2.5, drawView.scale * .24), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      function drawRosterToken(worldX, worldY, label, fill, colors) {
        const point = screenPoint(worldX, worldY);
        const radius = Math.max(2.5, drawView.scale * .24);
        ctx.save();
        ctx.shadowColor = colors.shadow;
        ctx.shadowBlur = Math.max(2, radius * .8);
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowColor = "transparent";
        ctx.strokeStyle = "rgba(255,255,255,.9)";
        ctx.lineWidth = Math.max(1, radius * .22);
        ctx.stroke();
        if (drawView.scale >= 10) {
          ctx.fillStyle = colors.foreground;
          ctx.font = "900 " + Math.max(7, radius * 1.05) + "px system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(label, point.x, point.y + .2);
        }
        ctx.restore();
      }

      function drawWorkforce(colors) {
        if (state.prospectorHired) {
          const prospectingHere = state.location === "cleared" && state.selected && state.selected.type === "cleared" && prospectsRemaining() > 0;
          const prospectorX = prospectingHere ? state.selected.x + .18 : buildings[0].doorX + .18;
          const prospectorY = prospectingHere ? state.selected.y + .18 : buildings[0].doorY + .18;
          drawRosterToken(prospectorX, prospectorY, "P", "#ffd75e", colors);
        }
        if (!state.mine || state.workers <= 0) return;
        const positions = [
          { x: state.mine.x - .08, y: state.mine.y + .45 },
          { x: state.mine.x + state.mine.w + .08, y: state.mine.y + .7 },
          { x: state.mine.x + .45, y: state.mine.y - .08 },
          { x: state.mine.x + 1.55, y: state.mine.y + state.mine.h + .08 }
        ];
        for (let index = 0; index < state.workers; index += 1) {
          drawRosterToken(positions[index].x, positions[index].y, "W", "#70e1c1", colors);
        }
      }

      function pointAlongRoute(points, progress) {
        const lengths = [];
        let total = 0;
        for (let index = 0; index < points.length - 1; index += 1) {
          const dx = points[index + 1].x - points[index].x;
          const dy = points[index + 1].y - points[index].y;
          const length = Math.hypot(dx, dy);
          lengths.push(length);
          total += length;
        }
        let remaining = Math.max(0, Math.min(1, progress)) * total;
        for (let index = 0; index < lengths.length; index += 1) {
          const start = points[index];
          const end = points[index + 1];
          const length = lengths[index];
          if (remaining <= length || index === lengths.length - 1) {
            const share = length > 0 ? Math.min(1, remaining / length) : 1;
            return {
              x: start.x + (end.x - start.x) * share,
              y: start.y + (end.y - start.y) * share,
              heading: Math.atan2(end.y - start.y, end.x - start.x)
            };
          }
          remaining -= length;
        }
        return { x: points[0].x, y: points[0].y, heading: 0 };
      }

      function visualGameMinutes() {
        if (!state.lastClockTickAt || state.menuOpen || systemMenuOpen) return absoluteGameMinutes();
        const fractionalTick = Math.max(0, Math.min(1, (performance.now() - state.lastClockTickAt) / CONFIG.clockTickMilliseconds));
        return absoluteGameMinutes() + fractionalTick * CONFIG.gameMinutesPerClockTick;
      }

      function drawActiveHauler(colors) {
        const contractTrips = state.companyContracts.filter(function (contract) {
          return contract.status === "active" && contract.inTransit;
        }).map(function (contract) {
          return {
            size: contract.truckSize,
            mineId: contract.mineId,
            dispatchedAt: contract.inTransit.dispatchedAt,
            completeAt: contract.inTransit.completeAt,
            contractLabel: marketSymbols[contract.material]
          };
        });
        state.hauls.concat(contractTrips).forEach(function (job) {
          const haulMine = state.mines.find(function (mine) { return mine.id === job.mineId; }) || state.mine;
          if (!haulMine) return;
          const hauler = CONFIG.haulers[job.size];
          const totalMinutes = Math.max(1, job.completeAt - job.dispatchedAt);
          const progress = Math.max(0, Math.min(1, (visualGameMinutes() - job.dispatchedAt) / totalMinutes));
          const mineDoor = structureDoor(haulMine);
          const outbound = [
            { x: buildings[1].doorX + .5, y: buildings[1].doorY + .5 },
            { x: buildings[1].doorX + .5, y: 144.5 },
            { x: PLAYER_ROAD_X + 1.5, y: 144.5 },
            { x: PLAYER_ROAD_X + 1.5, y: mineDoor.y + .5 },
            { x: mineDoor.x + .5, y: mineDoor.y + .5 }
          ];
          const returning = progress > .5;
          const route = returning ? outbound.slice().reverse() : outbound;
          const routeProgress = returning ? (progress - .5) * 2 : progress * 2;
          const routePoint = pointAlongRoute(route, routeProgress);
          const point = screenPoint(routePoint.x, routePoint.y);
          const width = drawView.scale * 1.5 * hauler.scale;
          const height = drawView.scale * .78 * hauler.scale;
          ctx.save();
          ctx.translate(point.x, point.y);
          ctx.rotate(routePoint.heading);
          ctx.globalAlpha = .9;
          ctx.shadowColor = colors.shadow;
          ctx.shadowBlur = Math.max(2, drawView.scale * .3);
          if (truckSpriteReady && truckSprite.naturalWidth > 0) {
            ctx.drawImage(truckSprite, -width / 2, -height / 2, width, height);
          } else {
            ctx.fillStyle = "#ffd75e";
            roundedPath(-width / 2, -height / 2, width, height, Math.max(2, height * .2));
            ctx.fill();
          }
          ctx.restore();
          if (drawView.scale >= 9) {
            ctx.save();
            ctx.fillStyle = "rgba(255,255,255,.82)";
            roundedPath(point.x - 12, point.y - height - 10, 24, 12, 6);
            ctx.fill();
            ctx.fillStyle = colors.foreground;
            ctx.font = "900 8px system-ui, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(job.contractLabel || hauler.label, point.x, point.y - height - 4);
            ctx.restore();
          }
        });
      }

      function drawPlayer(colors) {
        const point = screenPoint(visualPlayer.x, visualPlayer.y);
        const size = drawView.scale;
        if (size < 6) {
          ctx.fillStyle = colors.owned;
          ctx.beginPath();
          ctx.arc(point.x + size / 2, point.y + size / 2, Math.max(2, size * .7), 0, Math.PI * 2);
          ctx.fill();
          return;
        }
        const centerX = point.x + size * .5;
        const centerY = point.y + size * .5;
        const truckScale = CONFIG.truckScaleByLevel[state.truckSizeLevel];
        const truckWidth = size * 2.2 * truckScale;
        const truckHeight = size * 1.1 * truckScale;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(visualPlayer.heading);
        if (truckSpriteReady && truckSprite.naturalWidth > 0) {
          ctx.shadowColor = colors.shadow;
          ctx.shadowBlur = Math.max(3, size * .42);
          ctx.shadowOffsetY = size * .18;
          ctx.drawImage(truckSprite, -truckWidth / 2, -truckHeight / 2, truckWidth, truckHeight);
          ctx.shadowColor = "transparent";
          if (state.sawAttached) {
            const mountX = truckWidth * .56;
            const mountY = 0;
            const bladeRadius = Math.max(3, size * .24);
            ctx.strokeStyle = colors.foreground;
            ctx.lineWidth = Math.max(1.2, size * .07);
            ctx.beginPath();
            ctx.moveTo(truckWidth * .43, mountY);
            ctx.lineTo(mountX, mountY);
            ctx.stroke();
            ctx.fillStyle = "#d9e0ea";
            ctx.beginPath();
            for (let tooth = 0; tooth < 24; tooth += 1) {
              const angle = tooth / 24 * Math.PI * 2;
              const radius = tooth % 2 === 0 ? bladeRadius * 1.16 : bladeRadius;
              const px = mountX + Math.cos(angle) * radius;
              const py = mountY + Math.sin(angle) * radius;
              if (tooth === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = colors.foreground;
            ctx.stroke();
            ctx.fillStyle = colors.roadLine;
            ctx.beginPath();
            ctx.arc(mountX, mountY, bladeRadius * .28, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
          return;
        }
        ctx.shadowColor = colors.shadow;
        ctx.shadowBlur = Math.max(2, size * .38);
        ctx.shadowOffsetY = size * .16;
        ctx.fillStyle = colors.owned;
        roundedPath(-truckWidth * .46, -truckHeight * .34, truckWidth * .82, truckHeight * .68, size * .14);
        ctx.fill();
        ctx.shadowColor = "transparent";
        ctx.fillStyle = colors.roadLine;
        ctx.beginPath();
        ctx.moveTo(truckWidth * .48, 0);
        ctx.lineTo(truckWidth * .31, -truckHeight * .2);
        ctx.lineTo(truckWidth * .31, truckHeight * .2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      function drawSelection(colors) {
        if (!state.selected || state.selected.type === "road") return;
        const point = screenPoint(state.selected.x, state.selected.y);
        ctx.strokeStyle = colors.ring;
        ctx.lineWidth = Math.max(1, drawView.scale * .15);
        roundedPath(point.x + 1, point.y + 1, Math.max(1, drawView.scale - 2), Math.max(1, drawView.scale - 2), Math.max(1, drawView.scale * .18));
        ctx.stroke();
      }

      function drawStarterMarker(colors) {
        if (isCleared(STARTER_TREE.x, STARTER_TREE.y)) return;
        const point = screenPoint(STARTER_TREE.x, STARTER_TREE.y);
        ctx.strokeStyle = colors.owned;
        ctx.lineWidth = Math.max(1, drawView.scale * .18);
        ctx.beginPath();
        ctx.arc(point.x + drawView.scale / 2, point.y + drawView.scale / 2, drawView.scale * .48, 0, Math.PI * 2);
        ctx.stroke();
      }

      function drawLaneLabels(colors) {
        if (drawView.scale < 1.5) return;
        ctx.fillStyle = colors.foreground;
        ctx.font = "400 11px system-ui, sans-serif";
        ctx.textAlign = "center";
        for (let lane = 0; lane < 3; lane += 1) {
          const northPoint = screenPoint(lane * 30 + 15, TOWN_TOP + 1);
          const southPoint = screenPoint(lane * 30 + 15, TOWN_BOTTOM - 1);
          ctx.textBaseline = "top";
          ctx.fillText("↑ P" + (lane + 1) + " · LOCKED", northPoint.x, northPoint.y);
          ctx.textBaseline = "bottom";
          const southPlayer = lane === PLAYER_LANE;
          ctx.fillText(southPlayer ? "↓ P4 · YOU" : "↓ P" + (6 - lane) + " · LOCKED", southPoint.x, southPoint.y);
        }
      }

      function townBlockForStructure(structure) {
        const centerX = structure.x + structure.w / 2;
        const centerY = structure.y + structure.h / 2;
        return TOWN_BLOCKS.find(function (block) {
          return centerX >= block.x && centerX < block.x + block.w && centerY >= block.y && centerY < block.y + block.h;
        }) || null;
      }

      function drawTownBlocksAndLots(colors) {
        ctx.save();
        TOWN_BLOCKS.forEach(function (block, index) {
          const point = screenPoint(block.x, block.y);
          ctx.fillStyle = index % 2 ? "rgba(255,255,255,.055)" : "rgba(45,114,78,.035)";
          ctx.strokeStyle = "rgba(65,89,82,.28)";
          ctx.lineWidth = Math.max(1, drawView.scale * .055);
          roundedPath(point.x, point.y, block.w * drawView.scale, block.h * drawView.scale, Math.max(2, drawView.scale * .24));
          ctx.fill();
          ctx.stroke();
        });

        buildings.concat(businessLots).forEach(function (building) {
          const block = townBlockForStructure(building);
          if (!block) return;
          const facesNorth = building.doorY < building.y;
          const buildingFaceY = facesNorth ? building.y : building.y + building.h;
          const apronTop = Math.min(buildingFaceY, building.doorY + (facesNorth ? .45 : 0));
          const apronBottom = Math.max(buildingFaceY, building.doorY + (facesNorth ? .45 : 0));
          const apron = screenPoint(building.x - .35, apronTop);
          const apronWidth = (building.w + .7) * drawView.scale;
          const apronHeight = Math.max(drawView.scale * .7, (apronBottom - apronTop) * drawView.scale);
          ctx.fillStyle = building.id === "townhall" ? "rgba(247,239,213,.78)" : "rgba(205,207,198,.78)";
          ctx.strokeStyle = building.id === "townhall" ? "rgba(119,104,67,.45)" : "rgba(91,101,104,.34)";
          ctx.lineWidth = Math.max(1, drawView.scale * .045);
          roundedPath(apron.x, apron.y, apronWidth, apronHeight, Math.max(2, drawView.scale * .18));
          ctx.fill();
          ctx.stroke();

          const point = screenPoint(building.x - .48, building.y - .48);
          const width = (building.w + .96) * drawView.scale;
          const height = (building.h + .96) * drawView.scale;
          ctx.fillStyle = building.id === "townhall" ? "rgba(247,239,213,.72)" : "rgba(213,211,196,.68)";
          ctx.strokeStyle = building.id === "townhall" ? "rgba(119,104,67,.5)" : "rgba(91,101,104,.42)";
          roundedPath(point.x, point.y, width, height, Math.max(2, drawView.scale * .22));
          ctx.fill();
          ctx.stroke();

          if (drawView.scale >= 4) {
            ctx.strokeStyle = building.id === "townhall" ? "rgba(119,104,67,.52)" : "rgba(255,255,255,.78)";
            ctx.lineWidth = Math.max(.7, drawView.scale * .045);
            const spaces = Math.max(2, Math.min(5, Math.floor(building.w / 1.6)));
            for (let space = 1; space < spaces; space += 1) {
              const parkingX = apron.x + apronWidth * space / spaces;
              ctx.beginPath();
              ctx.moveTo(parkingX, apron.y + drawView.scale * .18);
              ctx.lineTo(parkingX, apron.y + apronHeight - drawView.scale * .18);
              ctx.stroke();
            }

            const walkway = screenPoint(building.doorX + .16, Math.min(building.doorY + .18, buildingFaceY));
            ctx.fillStyle = colors.curb;
            ctx.globalAlpha = .92;
            ctx.fillRect(walkway.x, walkway.y, Math.max(1.5, drawView.scale * .68), Math.max(1.5, Math.abs(buildingFaceY - building.doorY) * drawView.scale));
            ctx.globalAlpha = 1;
          }
        });
        ctx.restore();
      }

      function drawVacantBusinessLot(business, colors) {
        const point = screenPoint(business.x, business.y);
        const width = business.w * drawView.scale;
        const height = business.h * drawView.scale;
        ctx.save();
        ctx.fillStyle = "rgba(169,122,80,.2)";
        ctx.strokeStyle = "rgba(96,78,59,.72)";
        ctx.lineWidth = Math.max(1, drawView.scale * .065);
        ctx.setLineDash([Math.max(2, drawView.scale * .24), Math.max(2, drawView.scale * .18)]);
        roundedPath(point.x, point.y, width, height, Math.max(2, drawView.scale * .25));
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);
        if (drawView.scale >= 5) {
          const signWidth = Math.min(width * .78, 92);
          const signHeight = Math.max(13, Math.min(21, drawView.scale * .92));
          ctx.fillStyle = "rgba(35,49,66,.9)";
          roundedPath(point.x + (width - signWidth) / 2, point.y + height * .42, signWidth, signHeight, 4);
          ctx.fill();
          ctx.fillStyle = colors.roadWhite;
          ctx.font = "900 " + Math.max(7, Math.min(10, drawView.scale * .5)) + "px system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("FUTURE INDUSTRY", point.x + width / 2, point.y + height * .42 + signHeight / 2, signWidth - 6);
        }
        ctx.restore();
      }

      function drawTownStreetDetails(colors) {
        const scale = drawView.scale;
        const roadIntervals = TOWN_SIDE_STREET_XS.map(function (streetX) {
          return { start: streetX, end: streetX + TOWN_SIDE_STREET_WIDTH };
        });
        const horizontalSegments = [];
        let segmentStart = TOWN_LEFT;
        roadIntervals.forEach(function (interval) {
          if (interval.start > segmentStart) horizontalSegments.push({ start: segmentStart, end: interval.start });
          segmentStart = Math.max(segmentStart, interval.end);
        });
        if (segmentStart < TOWN_RIGHT) horizontalSegments.push({ start: segmentStart, end: TOWN_RIGHT });

        function strokeHorizontalSegments(y, style, width, dashed, alpha) {
          ctx.strokeStyle = style;
          ctx.lineWidth = width;
          ctx.globalAlpha = alpha;
          ctx.setLineDash(dashed || []);
          horizontalSegments.forEach(function (segment) {
            const left = screenPoint(segment.start, y);
            const right = screenPoint(segment.end, y);
            ctx.beginPath();
            ctx.moveTo(left.x, left.y);
            ctx.lineTo(right.x, right.y);
            ctx.stroke();
          });
        }

        function strokeVerticalSegment(x, startY, endY, style, width, dashed, alpha) {
          const top = screenPoint(x, startY);
          const bottom = screenPoint(x, endY);
          ctx.strokeStyle = style;
          ctx.lineWidth = width;
          ctx.globalAlpha = alpha;
          ctx.setLineDash(dashed || []);
          ctx.beginPath();
          ctx.moveTo(top.x, top.y);
          ctx.lineTo(bottom.x, bottom.y);
          ctx.stroke();
        }

        const dash = [Math.max(3, scale * .48), Math.max(3, scale * .44)];
        ctx.save();
        ctx.lineCap = "butt";

        [MAIN_STREET_TOP, MAIN_STREET_BOTTOM].forEach(function (roadY) {
          strokeHorizontalSegments(roadY, colors.curb, Math.max(1, scale * .11), [], .94);
        });
        [-.09, .09].forEach(function (offset) {
          strokeHorizontalSegments(MAIN_STREET_TOP + 2 + offset, colors.roadLine, Math.max(1.2, scale * .09), [], 1);
        });
        [MAIN_STREET_TOP + 1, MAIN_STREET_TOP + 3].forEach(function (laneY) {
          strokeHorizontalSegments(laneY, colors.roadWhite, Math.max(1, scale * .065), dash, .76);
        });

        TOWN_PERIMETER_STREET_YS.forEach(function (streetY) {
          strokeHorizontalSegments(streetY, colors.curb, Math.max(1, scale * .09), [], .9);
          strokeHorizontalSegments(streetY + TOWN_SIDE_STREET_WIDTH, colors.curb, Math.max(1, scale * .09), [], .9);
          strokeHorizontalSegments(streetY + TOWN_SIDE_STREET_WIDTH / 2, colors.roadLine, Math.max(1, scale * .055), dash, .7);
        });

        TOWN_SIDE_STREET_XS.forEach(function (streetX) {
          [streetX, streetX + TOWN_SIDE_STREET_WIDTH].forEach(function (edgeX) {
            strokeVerticalSegment(edgeX, TOWN_TOP + TOWN_SIDE_STREET_WIDTH, MAIN_STREET_TOP, colors.curb, Math.max(1, scale * .08), [], .88);
            strokeVerticalSegment(edgeX, MAIN_STREET_BOTTOM, TOWN_BOTTOM - TOWN_SIDE_STREET_WIDTH, colors.curb, Math.max(1, scale * .08), [], .88);
          });
          strokeVerticalSegment(streetX + TOWN_SIDE_STREET_WIDTH / 2, TOWN_TOP + TOWN_SIDE_STREET_WIDTH, MAIN_STREET_TOP, colors.roadLine, Math.max(1, scale * .055), dash, .68);
          strokeVerticalSegment(streetX + TOWN_SIDE_STREET_WIDTH / 2, MAIN_STREET_BOTTOM, TOWN_BOTTOM - TOWN_SIDE_STREET_WIDTH, colors.roadLine, Math.max(1, scale * .055), dash, .68);

          ctx.fillStyle = colors.roadWhite;
          ctx.globalAlpha = .78;
          for (let stripe = 0; stripe < 4; stripe += 1) {
            const stripePoint = screenPoint(streetX + .14 + stripe * .47, MAIN_STREET_TOP);
            const stripeWidth = Math.max(1, scale * .2);
            ctx.fillRect(stripePoint.x, stripePoint.y + scale * .06, stripeWidth, Math.max(1, scale * .3));
            const southStripe = screenPoint(streetX + .14 + stripe * .47, MAIN_STREET_BOTTOM);
            ctx.fillRect(southStripe.x, southStripe.y - scale * .36, stripeWidth, Math.max(1, scale * .3));
          }

          const northStop = screenPoint(streetX + .08, MAIN_STREET_TOP - .28);
          const southStop = screenPoint(streetX + .08, MAIN_STREET_BOTTOM + .18);
          ctx.fillRect(northStop.x, northStop.y, Math.max(1, scale * 1.84), Math.max(1, scale * .1));
          ctx.fillRect(southStop.x, southStop.y, Math.max(1, scale * 1.84), Math.max(1, scale * .1));
        });

        if (scale >= 6) {
          ctx.globalAlpha = .62;
          ctx.fillStyle = colors.roadWhite;
          ctx.font = "900 " + Math.max(7, Math.min(11, scale * .58)) + "px system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          [7, 84].forEach(function (roadX) {
            const label = screenPoint(roadX, MAIN_STREET_TOP + 2);
            ctx.fillText("MAIN ST", label.x, label.y);
          });
          const northLabel = screenPoint(37.5, TOWN_TOP + 1);
          const southLabel = screenPoint(67.5, TOWN_BOTTOM - 1);
          ctx.fillText("PINE AVE", northLabel.x, northLabel.y);
          ctx.fillText("MILL AVE", southLabel.x, southLabel.y);
        }
        ctx.restore();
      }

      function drawRoadAccents(colors) {
        ctx.save();
        ctx.strokeStyle = colors.roadLine;
        ctx.globalAlpha = .7;
        ctx.lineWidth = Math.max(1, drawView.scale * .08);
        ctx.lineCap = "round";
        ctx.setLineDash([Math.max(3, drawView.scale * .62), Math.max(3, drawView.scale * .58)]);
        const roadTop = screenPoint(PLAYER_ROAD_X + 1, SOUTH_TOP);
        const roadBottom = screenPoint(PLAYER_ROAD_X + 1, SOUTH_TOP + state.pavedDepth);
        ctx.beginPath();
        ctx.moveTo(roadTop.x, roadTop.y);
        ctx.lineTo(roadBottom.x, roadBottom.y);
        ctx.stroke();
        ctx.restore();
        drawTownStreetDetails(colors);
      }

      function drawRoadSurvey(colors) {
        const points = roadDraftPoints();
        if (!points.length) return;
        const previewCells = points.length > 1 ? expandedRoadCells(points) : new Set([keyFor(points[0].x, points[0].y)]);
        ctx.save();
        ctx.globalAlpha = state.roadApproval ? .5 : .42;
        ctx.fillStyle = state.roadApproval ? colors.leased : colors.owned;
        Array.from(previewCells).forEach(function (key) {
          const point = pointFromKey(key);
          if (!point) return;
          const screen = screenPoint(point.x, point.y);
          ctx.fillRect(screen.x + 1, screen.y + 1, Math.max(1, drawView.scale - 2), Math.max(1, drawView.scale - 2));
        });
        ctx.globalAlpha = .95;
        ctx.strokeStyle = state.roadApproval ? "#ffd75e" : "#5b6cf8";
        ctx.lineWidth = Math.max(2, drawView.scale * .16);
        ctx.setLineDash([Math.max(4, drawView.scale * .48), Math.max(3, drawView.scale * .34)]);
        ctx.beginPath();
        points.forEach(function (point, index) {
          const screen = screenPoint(point.x + .5, point.y + .5);
          if (!index) ctx.moveTo(screen.x, screen.y);
          else ctx.lineTo(screen.x, screen.y);
        });
        ctx.stroke();
        ctx.restore();
      }

      function drawMap() {
        resizeCanvas();
        calculateView();
        const colors = palette();
        ctx.setTransform(viewport.dpr, 0, 0, viewport.dpr, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.clearRect(0, 0, viewport.width, viewport.height);
        ctx.fillStyle = colors.grass;
        ctx.fillRect(0, 0, viewport.width, viewport.height);

        const minX = Math.max(0, Math.floor(drawView.originX - drawView.offsetX / drawView.scale));
        const maxX = Math.min(WORLD_WIDTH - 1, Math.ceil(drawView.originX + (viewport.width - drawView.offsetX) / drawView.scale));
        const minY = Math.max(0, Math.floor(drawView.originY - drawView.offsetY / drawView.scale));
        const maxY = Math.min(WORLD_HEIGHT - 1, Math.ceil(drawView.originY + (viewport.height - drawView.offsetY) / drawView.scale));

        for (let y = minY; y <= maxY; y += 1) {
          for (let x = minX; x <= maxX; x += 1) {
            if (buildingAt(x, y)) {
              fillTile(x, y, colors.townLot, 1);
              continue;
            }
            if (insideTown(x, y)) {
              fillTile(x, y, townSurfaceColorAt(x, y, colors), 1);
            } else {
              const gate = claimGateAt(x, y);
              const wall = isClaimWallCell(x, y);
              const paved = isPavedClaimRoad(x, y) && (!wall || (gate && isClaimGateOpen(gate)));
              const dirt = isCleared(x, y) || isNaturalDirtAt(x, y);
              fillTile(x, y, paved ? colors.road : dirt ? colors.soil : colors.grass, 1);
              if (!wall) {
                drawClaimGroundTexture(x, y, colors);
                const material = surfaceResourceAt(x, y);
                if (material) drawSurfaceResource(x, y, material, colors);
                if (drawView.scale >= 5 && isTreeAt(x, y)) drawTree(x, y, colors);
              }
              if (wall) {
                if (gate) drawClaimGateCell(x, y, gate, colors);
                else drawStoneWallCell(x, y, colors);
              }
            }
          }
        }

        ctx.globalAlpha = .045;
        ctx.fillStyle = colors.owned;
        const claimPoint = screenPoint(PLAYER_LEFT, SOUTH_TOP);
        ctx.fillRect(claimPoint.x, claimPoint.y, 30 * drawView.scale, CLAIM_DEPTH * drawView.scale);
        ctx.globalAlpha = 1;

        ctx.strokeStyle = colors.border;
        ctx.globalAlpha = .3;
        ctx.lineWidth = 1;
        for (let laneX = 0; laneX <= WORLD_WIDTH; laneX += 30) {
          const northTop = screenPoint(laneX, 0);
          const northBottom = screenPoint(laneX, CLAIM_DEPTH);
          ctx.beginPath();
          ctx.moveTo(northTop.x, northTop.y);
          ctx.lineTo(northBottom.x, northBottom.y);
          ctx.stroke();
          const southTop = screenPoint(laneX, SOUTH_TOP);
          const southBottom = screenPoint(laneX, WORLD_HEIGHT);
          ctx.beginPath();
          ctx.moveTo(southTop.x, southTop.y);
          ctx.lineTo(southBottom.x, southBottom.y);
          ctx.stroke();
        }
        const townPoint = screenPoint(TOWN_LEFT, TOWN_TOP);
        ctx.strokeRect(townPoint.x, townPoint.y, (TOWN_RIGHT - TOWN_LEFT) * drawView.scale, TOWN_HEIGHT * drawView.scale);
        ctx.globalAlpha = 1;

        drawTownBlocksAndLots(colors);
        drawRoadAccents(colors);
        drawRoadSurvey(colors);
        drawActiveGateLabels(colors);
        buildings.forEach(function (building) { drawBuilding(building, colors); });
        businessLots.forEach(function (business) {
          const record = state.townBusinesses[business.id];
          if (!record) drawVacantBusinessLot(business, colors);
          else if (record.status === "open") drawBuilding(business, colors);
          else if (record.status === "announced") drawComingSoonBusiness(business, colors);
        });
        state.mineParcels.forEach(function (parcel, index) {
          const occupied = state.mines.some(function (mine) { return mine.parcelId === parcel.id; });
          if (!occupied) drawParcel(parcel, colors, "Mine land " + (index + 1));
        });
        if (state.surveyParcel) drawParcel(state.surveyParcel, colors, "Survey result");
        state.warehouseParcels.forEach(function (parcel, index) {
          const occupied = state.warehouses.some(function (warehouse) { return warehouse.parcelId === parcel.id; });
          if (!occupied) drawParcel(parcel, colors, "Warehouse land " + (index + 1));
        });
        state.mines.forEach(function (mine, index) { drawCompanyStructure(mine, colors, "M" + (index + 1) + " · L" + mine.level, "mine"); });
        state.warehouses.forEach(function (warehouse, index) { drawCompanyStructure(warehouse, colors, "W" + (index + 1) + " · L" + warehouse.level, "warehouse"); });
        drawWorkforce(colors);
        drawActiveHauler(colors);
        drawSelection(colors);
        drawStarterMarker(colors);
        drawLaneLabels(colors);
        drawPlayer(colors);
      }

      function stepMovement(timestamp) {
        if (!state.path.length) {
          movementSegment = null;
          return;
        }
        if (!movementSegment) {
          const next = state.path[0];
          setTruckHeading(state.player.x, state.player.y, next.x, next.y);
          movementSegment = {
            fromX: state.player.x,
            fromY: state.player.y,
            toX: next.x,
            toY: next.y,
            startAt: timestamp,
            duration: moveDelayFor(next.x, next.y),
            progress: 0
          };
        }
        const segment = movementSegment;
        const progress = Math.max(0, Math.min(1, (timestamp - segment.startAt) / segment.duration));
        segment.progress = progress;
        visualPlayer.x = segment.fromX + (segment.toX - segment.fromX) * progress;
        visualPlayer.y = segment.fromY + (segment.toY - segment.fromY) * progress;
        if (progress < 1) return;
        state.player.x = segment.toX;
        state.player.y = segment.toY;
        state.path.shift();
        movementSegment = null;
        visualPlayer.x = state.player.x;
        visualPlayer.y = state.player.y;
        if (!state.path.length) finishArrival();
      }

      function animationLoop(timestamp) {
        pollGamepad(timestamp);
        if (!state.started) {
          state.lastStepAt = timestamp;
          state.lastClockTickAt = timestamp;
          state.lastMineTickAt = timestamp;
          updateVisualPlayer(timestamp);
          updateEngineSound();
          drawMap();
          requestAnimationFrame(animationLoop);
          return;
        }
        if (state.menuOpen || systemMenuOpen) {
          if (movementSegment) movementSegment.startAt = timestamp - movementSegment.progress * movementSegment.duration;
          updateVisualPlayer(timestamp);
          state.lastStepAt = timestamp;
          state.lastClockTickAt = timestamp;
          state.lastMineTickAt = timestamp;
          updateEngineSound();
          drawMap();
          requestAnimationFrame(animationLoop);
          return;
        }
        processContinuousDrive();
        stepMovement(timestamp);
        updateVisualPlayer(timestamp);
        updateEngineSound();
        if (!state.lastClockTickAt) state.lastClockTickAt = timestamp;
        const elapsedClockTicks = Math.floor((timestamp - state.lastClockTickAt) / CONFIG.clockTickMilliseconds);
        if (elapsedClockTicks > 0) {
          state.lastClockTickAt += elapsedClockTicks * CONFIG.clockTickMilliseconds;
          advanceGameTime(elapsedClockTicks * CONFIG.gameMinutesPerClockTick);
          processHauls();
          processExchangeOrders();
          processCompanyContracts();
          renderInterface();
        }
        if (state.mines.length && timestamp - state.lastMineTickAt >= CONFIG.mineTickMilliseconds) {
          state.lastMineTickAt = timestamp;
          produceMines();
        }
        drawMap();
        requestAnimationFrame(animationLoop);
      }

      function unstuckToRoad() {
        state.path = [];
        state.pendingArrival = null;
        state.menuOpen = false;
        systemMenuOpen = false;
        closeFastTravel();
        if (isPlayerClaimTile(state.player.x, state.player.y)) {
          const roadCandidates = [];
          for (let depth = 0; depth < state.pavedDepth; depth += 1) {
            roadCandidates.push({ x: PLAYER_ROAD_X, y: SOUTH_TOP + depth }, { x: PLAYER_ROAD_X + 1, y: SOUTH_TOP + depth });
          }
          state.roadTiles.forEach(function (key) {
            const point = pointFromKey(key);
            if (point) roadCandidates.push(point);
          });
          const nearest = roadCandidates.sort(function (a, b) {
            return (Math.abs(a.x - state.player.x) + Math.abs(a.y - state.player.y)) - (Math.abs(b.x - state.player.x) + Math.abs(b.y - state.player.y));
          })[0] || { x: PLAYER_ROAD_X + 1, y: SOUTH_TOP };
          state.player.x = nearest.x;
          state.player.y = nearest.y;
          state.location = "road";
        } else {
          state.player.x = 45;
          state.player.y = 145;
          state.location = "road";
        }
        syncVisualPlayer();
        setFollowView();
        setContext("Truck recovered", "Your truck was safely returned to the nearest company road. No cargo or progress was lost.");
      }

      canvas.addEventListener("click", function (event) {
        if (systemMenuOpen) closeSystemMenu();
        closeFastTravel();
        const rect = canvas.getBoundingClientRect();
        const point = worldPoint(event.clientX - rect.left, event.clientY - rect.top);
        handleWorldSelection(point.x, point.y);
      });

      el.dailyNews.addEventListener("click", openDailyPaper);
      el.dailyNews.addEventListener("keydown", function (event) {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        openDailyPaper();
      });
      el.newsReaderClose.addEventListener("click", closeMenu);

      el.go.addEventListener("click", function () {
        destinationAction(el.destination.value);
        closeFastTravel();
      });
      el.fastTravelToggle.addEventListener("click", toggleFastTravel);
      el.zoomIn.addEventListener("click", zoomInFromInput);
      el.zoomOut.addEventListener("click", zoomOutFromInput);
      el.overview.addEventListener("click", toggleOverviewFromInput);
      el.music.addEventListener("click", function () { toggleAudioChannel("musicEnabled"); });
      el.engineSound.addEventListener("click", function () { toggleAudioChannel("engineSoundEnabled"); });
      el.effects.addEventListener("click", function () { toggleAudioChannel("effectsSoundEnabled"); });
      el.profiles.addEventListener("click", openProfileMenu);
      el.landscape.addEventListener("click", async function () {
        await toggleLandscape();
        closeSystemMenu();
      });
      el.fullscreenLaunch.addEventListener("click", async function () {
        await toggleLandscape();
        el.fullscreenLaunch.hidden = true;
      });
      el.menuToggle.addEventListener("click", toggleMenuFromInput);
      el.systemClose.addEventListener("click", closeSystemMenu);
      el.menuScrim.addEventListener("click", closeMenu);
      el.menuClose.addEventListener("click", closeMenu);
      el.touchInteract.addEventListener("click", interactFromInput);
      const touchDirections = {
        up: { x: 0, y: -1 },
        down: { x: 0, y: 1 },
        left: { x: -1, y: 0 },
        right: { x: 1, y: 0 }
      };
      el.touchDirections.forEach(function (button) {
        button.addEventListener("pointerdown", function (event) {
          event.preventDefault();
          if (!state.started || state.menuOpen || systemMenuOpen) return;
          touchDrivePointerId = event.pointerId;
          touchDriveDirection = touchDirections[button.dataset.driveDirection] || null;
          beginManualDrive();
          if (typeof button.setPointerCapture === "function") button.setPointerCapture(event.pointerId);
        });
        ["pointerup", "pointercancel", "lostpointercapture"].forEach(function (eventName) {
          button.addEventListener(eventName, function (event) {
            if (touchDrivePointerId !== null && event.pointerId !== touchDrivePointerId) return;
            touchDrivePointerId = null;
            touchDriveDirection = null;
          });
        });
      });
      document.addEventListener("keydown", handleKeyboardDown);
      document.addEventListener("keyup", handleKeyboardUp);
      el.unstuck.addEventListener("click", unstuckToRoad);
      el.hire.addEventListener("click", hireProspector);
      el.hireWorker.addEventListener("click", hireMineWorker);
      el.haulers.forEach(function (button) {
        button.addEventListener("click", function () { dispatchHauler(button.dataset.haulerSize); });
      });
      el.buySaw.addEventListener("click", buySawAttachment);
      el.rentSaw.addEventListener("click", rentSawAttachment);
      el.shaker.addEventListener("click", buyShaker);
      el.upgradeTruckSize.addEventListener("click", upgradeTruckSize);
      el.upgradeTruckSpeed.addEventListener("click", upgradeTruckSpeed);
      el.marketplace.addEventListener("click", function () { openMarketScreen("exchange"); });
      el.contracts.addEventListener("click", function () { openMarketScreen("contracts"); });
      el.roadPlan.addEventListener("click", startRoadSurvey);
      el.roadSubmit.addEventListener("click", submitRoadSurvey);
      el.roadAccept.addEventListener("click", acceptRoadContract);
      el.roadCancel.addEventListener("click", cancelRoadSurvey);
      el.unlockGate.addEventListener("click", unlockSelectedClaimGate);
      el.readNews.addEventListener("click", readNews);
      el.clear.addEventListener("click", clearSelectedTree);
      el.prospect.addEventListener("click", prospectSelectedTile);
      el.lease.addEventListener("click", leaseMineLand);
      el.buyLand.addEventListener("click", buyMineLand);
      el.buyWarehouseLand.addEventListener("click", buyWarehouseLand);
      el.buildMine.addEventListener("click", buildMine);
      el.loadMine.addEventListener("click", loadMine);
      el.upgradeMine.addEventListener("click", upgradeMine);
      el.buildWarehouse.addEventListener("click", buildWarehouse);
      el.unloadWarehouse.addEventListener("click", unloadWarehouse);
      el.loadWarehouse.addEventListener("click", loadWarehouse);
      el.upgradeWarehouse.addEventListener("click", upgradeWarehouse);
      el.saveNow.addEventListener("click", saveGameNow);
      el.profileSlots.forEach(function (button) {
        button.addEventListener("click", function () { selectProfile(Number(button.dataset.profileSlot)); });
      });
      el.profilePlay.addEventListener("click", function () { beginSelectedProfile(false); });
      el.profileRestart.addEventListener("click", function () {
        if (!profileRestartArmed) {
          profileRestartArmed = true;
          profileDeleteArmed = false;
          el.profileRestart.textContent = "Confirm start over";
          el.profileDelete.textContent = "Delete file";
          if (el.profileMessage) el.profileMessage.textContent = "This resets only the selected company file. Press again to confirm.";
          return;
        }
        beginSelectedProfile(true);
      });
      el.profileDelete.addEventListener("click", function () {
        if (!profileDeleteArmed) {
          profileDeleteArmed = true;
          profileRestartArmed = false;
          el.profileDelete.textContent = "Confirm delete";
          el.profileRestart.textContent = "Start over";
          if (el.profileMessage) el.profileMessage.textContent = "Delete this company file from this device and its cloud save? Press again to confirm.";
          return;
        }
        deleteSelectedProfile();
      });
      el.startMusic.addEventListener("click", function () { toggleAudioChannel("musicEnabled"); });
      el.startEngine.addEventListener("click", function () { toggleAudioChannel("engineSoundEnabled"); });
      el.startEffects.addEventListener("click", function () { toggleAudioChannel("effectsSoundEnabled"); });
      el.marketClose.addEventListener("click", closeMarketScreen);
      el.marketTabExchange.addEventListener("click", function () { marketScreenTab = "exchange"; renderInterface(); });
      el.marketTabContracts.addEventListener("click", function () { marketScreenTab = "contracts"; renderInterface(); });
      el.exchangeMaterial.addEventListener("change", function () {
        const material = el.exchangeMaterial.value;
        if (material) {
          el.exchangePrice.value = String(prices[material]);
          el.exchangePrice.dataset.material = material;
          el.exchangeQuantity.value = Math.min(1, state.cargo[material]).toFixed(1);
        }
        renderInterface();
      });
      el.exchangeOffer.addEventListener("click", placeExchangeOffer);
      el.exchangeBoard.addEventListener("click", function (event) {
        const button = event.target && typeof event.target.closest === "function" ? event.target.closest("[data-exchange-pick]") : null;
        if (!button) return;
        const material = button.dataset.exchangePick;
        if (state.cargo[material] < .05) {
          el.exchangeHint.textContent = "Load " + materialNames[material].toLowerCase() + " into your truck before listing it.";
          return;
        }
        el.exchangeMaterial.value = material;
        el.exchangePrice.value = String(prices[material]);
        el.exchangePrice.dataset.material = material;
        el.exchangeQuantity.value = Math.min(1, state.cargo[material]).toFixed(1);
        renderInterface();
      });
      el.exchangeOrders.addEventListener("click", function (event) {
        const button = event.target && typeof event.target.closest === "function" ? event.target.closest("[data-cancel-order]") : null;
        if (button) cancelExchangeOrder(button.dataset.cancelOrder);
      });
      el.contractBoard.addEventListener("click", function (event) {
        const button = event.target && typeof event.target.closest === "function" ? event.target.closest("[data-accept-contract]") : null;
        if (!button) return;
        const offerId = button.dataset.acceptContract;
        const select = el.contractBoard.querySelector('[data-contract-mine="' + offerId + '"]');
        acceptCompanyContract(offerId, select ? select.value : "");
      });
      root.addEventListener("pointerdown", ensureAudio, { passive: true });
      document.addEventListener("fullscreenchange", function () {
        renderInterface();
        stabilizeViewport();
      });

      document.addEventListener("webkitfullscreenchange", function () {
        renderInterface();
        stabilizeViewport();
      });

      const resizeObserver = new ResizeObserver(function () { resizeCanvas(); });
      resizeObserver.observe(canvas);
      window.addEventListener("resize", stabilizeViewport);
      window.addEventListener("orientationchange", stabilizeViewport);
      syncVisualPlayer();
      renderInterface();
      initializeProfiles();
      window.addEventListener("beforeunload", function () { saveState(true); });
      window.addEventListener("pagehide", function () { saveState(true); });
      window.addEventListener("blur", function () {
        heldDriveKeys.clear();
        gamepadDriveDirection = null;
        gamepadDriveKey = "";
        touchDrivePointerId = null;
        touchDriveDirection = null;
      });
      window.addEventListener("gamepadconnected", function (event) {
        activeGamepadIndex = event.gamepad.index;
        setInputMode("controller");
      });
      window.addEventListener("gamepaddisconnected", function (event) {
        if (activeGamepadIndex !== event.gamepad.index) return;
        activeGamepadIndex = null;
        gamepadButtonStates = [];
        gamepadDriveDirection = null;
        gamepadDriveKey = "";
        setInputMode(heldDriveKeys.size ? "keyboard" : "pointer");
      });
      document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "hidden") {
          heldDriveKeys.clear();
          gamepadDriveDirection = null;
          gamepadDriveKey = "";
          touchDrivePointerId = null;
          touchDriveDirection = null;
          saveState(true);
        }
      });
      requestAnimationFrame(animationLoop);
    })();

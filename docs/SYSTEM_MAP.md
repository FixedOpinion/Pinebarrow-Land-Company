# Pinebarrow Land Company — System Map

**Status:** DRAFT / PARTIAL — architecture archaeology in progress  
**Trust state:** DRAFT  
**Code baseline:** `e24cdbb0b324e236b2a4ba92f63906fb7d7ed6c0` (`main`, 2026-09-04)  
**Working branch:** `arch-sa-1-system-map`  
**Permanent System Address IDs:** Not assigned. Candidate neighborhood names below are factual discovery labels only.

## Authority and use

The code is authoritative. This file is a navigation cache, not a substitute for symbol search, callers, state-key search, tests, or design review.

- `CURRENT REALITY` records behavior observed in the baseline code.
- `TARGET OWNERSHIP` records only an already-approved architectural direction.
- `DRAFT` entries may be incomplete. Absence from this map is never evidence that a dependency does not exist.
- `REQUIRED READ` and `SAFETY READ` are inspection policy, not dependency-edge types.
- Line anchors are baseline navigation aids. Function and record names are the more durable evidence.

## Archaeology progress

| Milestone | Coverage | State |
|---|---|---|
| SA-1A | Runtime/bootstrap, persistence/profiles, material-store primitives, prospect records, Town Hall prospect and residential-proposal views | Surveyed in this draft |
| SA-1B | Mine production/storage/upgrades, warehouse storage/transfers, manual hauls, material-conservation paths | Not yet surveyed |
| SA-1C | Marketplace orders, company contracts, town-business fulfillment, price/news economy | Not yet surveyed |
| SA-1D | World/claims/geology, roads, pathfinding, input, audio, rendering, responsive UI | Not yet surveyed |
| SA-1E | Cross-check direct graph, persistence hazards, related tests, gaps, and target/current conflicts | Not yet surveyed |

## Coverage ledger

| Candidate neighborhood | Primary current location | Trust | Coverage | Notes |
|---|---|---:|---:|---|
| Runtime host and shared state | `app/game-engine-loader.tsx`; `public/pinebarrow-engine.js` | DRAFT | PARTIAL | Startup, state container, DOM registry, and outer scheduling observed; full simulation/render loop awaits SA-1D. |
| Persistence and save profiles | Engine `loadSavedState()` through `initializeProfiles()`; `app/api/profiles/route.ts`; `db/` | DRAFT | MAPPED | Client cache, cloud reconciliation, D1 route/schema, migrations, and persistent state surface surveyed. |
| Material-store and truck-capacity primitives | Engine `emptyMaterialStore()` and `usedStore()` through `cargoSummary()` | DRAFT | PARTIAL | Common store shape and capacity queries observed; every producer/transfer/consumer awaits SA-1B/SA-1C. |
| Mining prospect records and selection | Engine `todaysProspectsUsed()` through `leaseMineLand()` | DRAFT | MAPPED | Two stable active slots, daily quota, survey creation, selection, and lease transition surveyed. |
| Generic development-proposal records | Engine `allocateProposalId()` / `normalizeProposalRecord()`; save/load | DRAFT | MAPPED | Data normalization and persistence observed. No proposal-generation service exists. |
| Town Hall prospect/proposal presentation | Engine `townHallProspectBoardMarkup()`, `townHallResidentialBoardMarkup()`, `renderLocationDetails()` | DRAFT | MAPPED | Read-only residential view and selected mining-prospect view observed. |
| Input and controller navigation | Engine `requestManualStep()` through `handleKeyboardUp()` and event wiring | DRAFT | UNMAPPED | Function inventory only. |
| Audio | Engine `ensureAudio()` through `updateEngineSound()` | DRAFT | UNMAPPED | Function inventory only. |
| Claims, terrain, surface resources, and geology | Engine `claimInfoAt()` through `legacyUnlockedClaimZones()`; `resourceAt()` / depth bands | DRAFT | UNMAPPED | Only prospect-facing calls observed. |
| Town streets, buildings, lots, and world collision | Engine `buildingAt()` through `isPassable()`; town render helpers | DRAFT | UNMAPPED | Function inventory only. |
| Pathfinding and travel | Engine `moveDelayFor()` through `handleWorldSelection()` | DRAFT | UNMAPPED | Function inventory only. |
| Mining operations | Engine `buildMine()` through `upgradeMine()` | DRAFT | UNMAPPED | Prospect-to-mine handoff observed; production/accounting not yet surveyed. |
| Warehousing | Engine `buildWarehouse()` through `upgradeWarehouse()` | DRAFT | UNMAPPED | Save record normalization observed; transfer/accounting not yet surveyed. |
| Manual contract hauls | Engine `activeHaulForMine()` through `processHauls()` | DRAFT | UNMAPPED | Function inventory only. |
| Marketplace/order book | Engine `renderExchangeTerminal()` through `processExchangeOrders()` | DRAFT | UNMAPPED | Persistent collection surface observed; reservation/settlement not yet surveyed. |
| Company contracts and town-business openings | Engine `contractOffersForDay()` through `processCompanyContracts()` | DRAFT | UNMAPPED | Persistent collection surface observed; fulfillment and construction side effects await SA-1C. |
| Company Operations UI | Engine `linkedWarehouseForMine()` through `renderCompanyManagement()` | DRAFT | UNMAPPED | Function inventory only. |
| Road planning/contracts | Engine `roadDraftPoints()` through `cancelRoadSurvey()` | DRAFT | UNMAPPED | Persistent fields observed; stone/cash accounting awaits SA-1D. |
| Market prices and newspaper | Engine `dailyMarketForDay()` through `openDailyPaper()` | DRAFT | UNMAPPED | Function inventory only. |
| Camera, canvas rendering, and animation | Engine `resizeCanvas()` through `animationLoop()` | DRAFT | UNMAPPED | Bootstrap edge observed; draw order and simulation ticks await SA-1D. |
| React page structure and CSS presentation | `app/page.tsx`; `app/globals.css` | DRAFT | PARTIAL | Engine-to-DOM contract observed for mapped UI; full element/style ownership not surveyed. |

---

## Candidate neighborhood — Runtime host and shared state

**SYSTEM / CANDIDATE ADDRESS:** Runtime host and shared state; permanent address not assigned  
**NAME:** Browser engine bootstrap and shared runtime container  
**TRUST STATE:** DRAFT  
**COVERAGE:** PARTIAL

### CURRENT REALITY

- `GameEngineLoader()` injects `/pinebarrow-engine.js` after the React page mounts.
- The engine is one browser IIFE. It locates `#pinebarrow-visible-menu-demo`, guards against duplicate loading with `root.dataset.engineLoaded`, captures the canvas/context, creates one mutable closure-scoped `state`, and caches UI nodes in `el`.
- `createInitialState()` creates gameplay, selection, UI, audio, road, prospect, proposal, mine, warehouse, market, contract, town-business, clock, and scheduler fields in one object.
- The bottom-level bootstrap wires browser/UI events, calls `syncVisualPlayer()`, `renderInterface()`, and `initializeProfiles()`, then starts `requestAnimationFrame(animationLoop)`.

Evidence:

- `app/game-engine-loader.tsx`: `GameEngineLoader()`.
- `public/pinebarrow-engine.js`: IIFE start; `createInitialState()` at baseline line 193; `state` and `el` construction; event/bootstrap block after `unstuckToRoad()`; `requestAnimationFrame(animationLoop)`.

### TARGET OWNERSHIP

Approved target direction separates a runtime host, game state, configuration, systems, UI, and persistence modules. Candidate paths in the modular handoff include `engine/game-engine.js`, `engine/game-state.js`, and `engine/config.js`. This is `TARGET`, not current code and not an approved permanent address assignment.

### OWNS

- Current bootstrap/lifecycle of the browser engine.
- Creation of the shared mutable state object.
- Current engine-to-DOM element registry.
- Top-level browser event wiring and animation-frame scheduling.

### ENTRY POINTS

- `GameEngineLoader()`.
- Engine IIFE.
- `createInitialState()`.
- Bottom-level DOM/window event registrations.
- `animationLoop()` (body not yet surveyed).

### STATE READ

- Potentially every state field because all systems share the same closure object.
- Confirmed at bootstrap: `started`, player/camera state, menu state, audio preferences, profile state, and scheduler timestamps.

### STATE WRITTEN

- Initial values for every field returned by `createInitialState()`.
- Browser event handlers later delegate writes to system functions.

### CALLS

- `createInitialState()`, `syncVisualPlayer()`, `renderInterface()`, `initializeProfiles()`, `resizeCanvas()`/`stabilizeViewport()` through browser events, `saveState(true)` during lifecycle events, and `animationLoop()` through animation frames.

### CALLED BY

- Browser/React page load through `GameEngineLoader()`.
- Browser input, resize, fullscreen, visibility, pagehide, blur, and gamepad events.

### UI CONSUMERS

- `app/page.tsx` supplies the complete persistent DOM contract.
- `app/globals.css` styles that DOM.
- The engine writes to cached `pb7-*` elements and draws to `#pb7-map`.

### PERSISTENCE

- `resetGameState()` replaces shared state from `createInitialState()`.
- `loadSavedState()` hydrates the shared object.
- `serializedState()` reads the persistent subset.

### RELATED TESTS

- Every test in `tests/prospector-regression.test.mjs` loads the IIFE into a VM harness.
- `tests/rendered-html.test.mjs` verifies the built route can render, but does not exercise engine bootstrap behavior in a browser.

### DIRECT EDGES

- **Persistence and save profiles**
  - type: `CALLS` / `PERSISTENCE`
  - criticality: `CRITICAL`
  - status: `CONFIRMED`
  - evidence: bootstrap calls `initializeProfiles()`; lifecycle listeners call `saveState(true)`; profile start calls `loadSavedState()`.
- **React page / UI contract**
  - type: `UI-CONSUMER`
  - criticality: `HIGH`
  - status: `CONFIRMED`
  - evidence: engine startup requires the root, canvas, and cached `pb7-*` elements rendered by `app/page.tsx`.
- **Camera/render/simulation loop**
  - type: `CALLS`
  - criticality: `HIGH`
  - status: `POSSIBLE` pending SA-1D edge decomposition
  - evidence: bootstrap starts `animationLoop()` and resize/fullscreen handlers invoke viewport/render work.

### REQUIRED READ

- `app/game-engine-loader.tsx`.
- Engine IIFE preamble, `createInitialState()`, `state`/`el` declarations, and bottom-level event/bootstrap block.

### SAFETY READ

- Persistence entry below for any state-shape or startup change.
- `app/page.tsx` for any DOM-ID contract change.
- Animation/camera entry once mapped for lifecycle or timing changes.

### KNOWN COUPLING / HAZARDS

- Nearly all systems close over `state`, `CONFIG`, `el`, prices, terrain, and UI flags; there is no explicit public module boundary.
- The engine depends on DOM IDs rather than typed interfaces.
- The loader is asynchronous, while the page markup must exist before the script runs.
- A state-field rename can affect simulation, persistence, UI, and tests even when only one visual feature appears involved.

### CONFLICTS

- Current monolithic ownership conflicts with the approved modular target, but refactoring is prohibited during ARCH-SA-1.

### UNRESOLVED QUESTIONS

- Exact first extraction boundary and compatibility facade must be chosen after the full graph is mapped.

---

## Candidate neighborhood — Persistence and save profiles

**SYSTEM / CANDIDATE ADDRESS:** Persistence and profiles; permanent address not assigned  
**NAME:** Save normalization, local cache, cloud profile synchronization, and D1 storage  
**TRUST STATE:** DRAFT  
**COVERAGE:** MAPPED

### CURRENT REALITY

- The client supports three device-keyed profile slots.
- `serializedState()` converts `Set` values to arrays and returns save version 11 plus the gameplay collections/selections needed to resume a company.
- `loadSavedState()` validates versions 1–11, normalizes legacy/current records, repairs stable IDs and selections, maps older upgrade levels, resets transient UI/movement state, and invokes several gameplay helpers during hydration.
- `saveState()` writes a localStorage profile cache immediately and schedules a `PUT /api/profiles` cloud sync. `initializeProfiles()` merges device cache, a legacy single-save key, and cloud records by `updatedAt`.
- The server route accepts a 20–96 character device ID, limits profiles to slots 1–3 and saves to 750,000 encoded bytes, then stores JSON in D1 table `game_profiles`. `DELETE` removes a device/slot record.

Evidence:

- Engine `SAVE_VERSION`, `SAVE_KEY`, `DEVICE_KEY`, `PROFILE_CACHE_PREFIX`, `PROFILE_COUNT`.
- Engine `loadSavedState()` (baseline line 1209), `serializedState()` (1436), `writeProfileCache()` (1503), `scheduleProfileSync()` (1513), `saveState()` (1538), `beginSelectedProfile()` (1642), `deleteSelectedProfile()` (1690), and `initializeProfiles()` (1720).
- `app/api/profiles/route.ts`: `GET`, `PUT`, `DELETE`, validation, and `MAX_SAVE_BYTES`.
- `db/schema.ts`, `db/index.ts`, and `drizzle/0000_brave_famine.sql`.

### TARGET OWNERSHIP

Approved modular direction names a dedicated persistence/save system. Exact module interfaces remain unapproved. Save migration and compatibility must remain explicit and conservative.

### OWNS

- Save-version validation and legacy migration.
- Persistent-state serialization.
- Profile-slot selection/cache records and local/cloud reconciliation.
- Device-key creation and server request identity.
- D1 profile storage API and table schema.

### ENTRY POINTS

- Client: `loadSavedState()`, `serializedState()`, `saveState()`, `beginSelectedProfile()`, `openProfileMenu()`, `deleteSelectedProfile()`, `initializeProfiles()`.
- Server: `GET`, `PUT`, `DELETE` in `app/api/profiles/route.ts`.
- Database: `getD1()` and `gameProfiles`/migration definitions.

### STATE READ

`serializedState()` directly reads these persistent groups:

- company/resources: `cash`, `capacity`, `cargo`, `workers`, `wasteToCrowe`;
- truck/tools/audio: truck size/speed, saw state/rental day, Shaker, audio channel flags;
- world/time/navigation: paved depth, road cells/draft/planning/approval/market impact/completed contracts, unlocked zones, cleared cells, day/minutes, player, selection/location, overview/zoom, context text;
- prospects/proposals: prospector employment/quota, survey collection and compatibility mirror, selected survey ID, proposal collection/counter;
- industrial sites: mine/warehouse parcels, mines, warehouses, stable-ID counter and selected IDs;
- economy/logistics: hauls, exchange orders/counter/timestamp, company contracts/counter, town businesses.

### STATE WRITTEN

- `loadSavedState()` writes or normalizes every persistent group above, plus clears transient movement/menu state.
- `beginSelectedProfile()` and `resetGameState()` replace/reset shared runtime state while preserving selected audio preferences.

### CALLS

- Record helpers: `emptyMaterialStore()`, `normalizeSiteId()`, `normalizeProposalRecord()`, `allocateProposalId()`.
- Gameplay-derived migration helpers: `clearRoadSurfaceDecoration()`, `legacyUnlockedClaimZones()`, `mineMaterialForLevel()`, `processTownBusinessOpenings()`, `relocatePlayerFromTownBuilding()`, site/parcel lookup helpers.
- Browser storage/network: localStorage, `/api/profiles`, JSON encode/decode, timers.
- Server storage: `getD1()`, D1 prepared statements and batch.

### CALLED BY

- Start/profile UI.
- Manual Save button.
- `renderInterface()` autosave throttle.
- `beforeunload`, `pagehide`, and hidden-document lifecycle handlers.
- Local/cloud initialization on engine startup.

### UI CONSUMERS

- Start/profile layer, profile summaries/name controls, save status, profile sync status, and system-menu Save/Load actions in `app/page.tsx`.

### PERSISTENCE

- This is the current persistence boundary.
- D1 key uniqueness is `(device_id, slot)`; record ID is `${deviceId}:${slot}`.
- The compatibility fields `soundEnabled` and singular `surveyParcel` are still serialized alongside newer fields.

### RELATED TESTS

- Prospect and proposal migration tests in `tests/prospector-regression.test.mjs`.
- Older-save relocation tests for town/building changes.
- Audio preference and multi-site reload tests.
- `UNKNOWN`: no focused API-route/D1 behavior test was found in the current test files.

### DIRECT EDGES

- **Runtime host and shared state**
  - type: `READS` / `WRITES` / `PERSISTENCE`
  - criticality: `CRITICAL`
  - status: `CONFIRMED`
  - evidence: `serializedState()`, `loadSavedState()`, `resetGameState()`, and `beginSelectedProfile()` directly access shared state.
- **Prospect records and selection**
  - type: `PERSISTENCE`
  - criticality: `CRITICAL`
  - status: `CONFIRMED`
  - evidence: loader migrates `surveyParcels`, `surveyParcel`, `selectedSurveyId`, slots, IDs, and active selection; serializer writes them back.
- **Generic proposal records**
  - type: `PERSISTENCE`
  - criticality: `CRITICAL`
  - status: `CONFIRMED`
  - evidence: loader bounds/normalizes `proposals` and `nextProposalId`; serializer preserves both.
- **Mine, warehouse, haul, order, contract, town, world, road, and audio neighborhoods**
  - type: `PERSISTENCE`
  - criticality: `CRITICAL`
  - status: `CONFIRMED` for stored fields; behavioral migration implications remain `POSSIBLE` until those entries are mapped
  - evidence: direct collection/field handling in `loadSavedState()` and `serializedState()`.
- **Profile API / D1**
  - type: `CALLS`
  - criticality: `CRITICAL`
  - status: `CONFIRMED`
  - evidence: client `GET`/`PUT`/`DELETE` requests correspond to route handlers that query `game_profiles` through `getD1()`.

### REQUIRED READ

- `loadSavedState()`, `serializedState()`, and the profile function family.
- `app/api/profiles/route.ts`, `db/index.ts`, `db/schema.ts`, and current migration when storage behavior changes.

### SAFETY READ

- Every mapped system whose persistent state or stable IDs are changed.
- Tests containing legacy/current save fixtures.

### KNOWN COUPLING / HAZARDS

- Hydration is not pure: it calls market/town opening, geology/material, road-decoration, relocation, and parcel helpers.
- Stable-ID counters and selection mirrors must remain consistent with collections.
- `surveyParcel` is a compatibility mirror; treating it as the sole source of truth would reintroduce the lost-prospect bug.
- Client/cloud conflict handling is timestamp-based. Concurrent-device semantics have not been verified.
- The device key is possession-based rather than an authenticated user identity.
- Failure falls back to local cache; local cache failure can leave only cloud attempts or a session device key.

### CONFLICTS

- Current persistence logic lives inside the monolithic engine and invokes gameplay helpers; approved target ownership calls for a dedicated save system with explicit dependencies.

### UNRESOLVED QUESTIONS

- Whether long-term profiles remain device-keyed or move to authenticated identity.
- Desired conflict policy for concurrent device/cloud writes.
- Whether compatibility fields can be removed, and at which future save-version boundary.

---

## Candidate neighborhood — Material-store and truck-capacity primitives

**SYSTEM / CANDIDATE ADDRESS:** Material inventory primitives; permanent address not assigned  
**NAME:** Common material keys, store totals, truck capacity, and inventory summaries  
**TRUST STATE:** DRAFT  
**COVERAGE:** PARTIAL

### CURRENT REALITY

- `cargoKeys` defines the common material-store shape: logs, dirt, stone, clay, coal, iron, copper, tin, quartz, silver, gold, and sapphire.
- `emptyMaterialStore()` creates a zeroed object for every key.
- `usedStore()` totals all keys. `usedCargo()` applies it to truck cargo, while `freeCargo()` subtracts that total from `state.capacity` with a zero floor.
- `cargoSummary()` formats any compatible store, defaulting to the truck.
- The truck cargo, warehouse stores, mine material/dirt stock, exchange reservations, contracts, and haul jobs participate in broader conservation paths that are not yet fully mapped.

### TARGET OWNERSHIP

Approved design requires atomic/conservative transfers and explicit reserves. Exact inventory-service/module ownership remains `UNRESOLVED` and must not be invented here.

### OWNS

- Current common material key list and empty-store construction.
- Current aggregate store/capacity queries and display summary.

### ENTRY POINTS

- `emptyMaterialStore()` (baseline line 448).
- `usedStore()`, `usedCargo()`, `freeCargo()`, `cargoSummary()` (2039–2059).

### STATE READ

- `state.cargo` and `state.capacity`.
- A caller-supplied warehouse/material store in `usedStore()` and `cargoSummary()`.

### STATE WRITTEN

- None by the mapped primitive functions.

### CALLS

- `cargoKeys`, `round1()`, standard array/object helpers.

### CALLED BY

- Confirmed mapped callers include prospect/tree capacity messaging, persistence normalization, market/Town Hall/location details, and truck HUD.
- Complete producer/consumer caller set is `NOT YET VERIFIED`; SA-1B and SA-1C must widen symbol search.

### UI CONSUMERS

- Truck gauge/tooltips, location details, management screens, and Marketplace inventory summaries.

### PERSISTENCE

- Truck cargo is stored as `state.cargo`.
- Warehouse stores are normalized with `emptyMaterialStore()` during load.
- Mine stock uses separate scalar `stockMaterial` and `stockDirt` fields rather than the common store shape.

### RELATED TESTS

- Truck full/waiting gauge regression.
- Warehouse load/reload tests.
- Marketplace sell-offer and road-contract tests touch material accounting, but their conservation coverage must be inspected in SA-1B/SA-1C.

### DIRECT EDGES

- **Persistence and save profiles**
  - type: `PERSISTENCE`
  - criticality: `CRITICAL`
  - status: `CONFIRMED`
  - evidence: cargo and warehouse stores are serialized and normalized on load.
- **Truck/UI**
  - type: `UI-CONSUMER`
  - criticality: `NORMAL`
  - status: `CONFIRMED`
  - evidence: `renderInterface()` calls `usedCargo()`, `cargoSummary()`, and reads capacity for the ZEUS gauge.
- **Mining, warehousing, hauling, Marketplace, and contracts**
  - type: `PRODUCES` / `CONSUMES` / `RESERVES` / `RELEASES`
  - criticality: `CRITICAL`
  - status: `POSSIBLE` until transfer and settlement bodies are surveyed
  - evidence: state and function inventory show stock/storage/order/haul records sharing these materials; exact direct edges remain deliberately unconfirmed.

### REQUIRED READ

- Material key/config declarations and the four primitive functions.
- The exact producer/transfer/consumer functions touched by a proposed inventory change.

### SAFETY READ

- Persistence.
- Mine, warehouse, haul, Marketplace, contract, and road-accounting entries after they are mapped.

### KNOWN COUPLING / HAZARDS

- `usedStore()` assumes every key exists and is numeric; malformed or partial stores can yield `NaN` unless normalized first.
- Mine stock uses a different representation from truck/warehouse inventory.
- Dirt is a capacity-consuming cargo key but is not a priced commodity in `basePrices`/`materialNames`.
- No central transaction primitive has yet been confirmed; individual functions may mutate both sides directly.

### CONFLICTS

- The approved atomic transfer/reserve architecture is broader than the current mapped primitives.

### UNRESOLVED QUESTIONS

- Exact target owner for inventory transactions and reservations.
- Whether dirt/tailings should remain in the shared cargo-key store once the Dirt Processor exists.

---

## Candidate neighborhood — Mining prospect records and Town Hall lease transition

**SYSTEM / CANDIDATE ADDRESS:** Prospecting and prospect selection; permanent address not assigned  
**NAME:** Daily surveys, two persistent prospect slots, selection, and conversion to leased mine land  
**TRUST STATE:** DRAFT  
**COVERAGE:** MAPPED

### CURRENT REALITY

- A permanently hired prospector receives two surveys per game day, limited again by two unresolved active slots.
- Active prospects are independent records in `state.surveyParcels`. Each receives a stable site ID and `prospectSlot`.
- `state.surveyParcel` remains a compatibility/active-selection mirror; `selectedSurveyId` is the stable selection key.
- Surveying currently creates a 2×2 record directly from one selected cleared tile and copies the sampled material/dirt ratio/depth into that parcel.
- Town Hall selection addresses the prospect by stable ID. Leasing deducts cash, moves only the selected record from `surveyParcels` to `mineParcels`, preserves the other prospect, and updates active selection.

### TARGET OWNERSHIP

- Approved target: a coherent prospecting system/module with explicit UI and persistence interfaces.
- Approved future conflict resolution: a 1×1 `SurveyResult` must eventually be separated from a mine-site `DevelopmentProposal`/footprint. That future S-series work is not implemented and was not authorized here.

### OWNS

- Daily survey quota and open-slot calculation.
- Active prospect collection/slot selection.
- Prospect creation and stable selection.
- Current Town Hall lease transition from surveyed record to mine parcel.

### ENTRY POINTS

- `todaysProspectsUsed()`, `prospectsRemaining()`, `prepareProspectorForToday()`.
- `selectedSurveyTile()`, `selectedSurveyParcel()`, `prospectAtSlot()`, `nextProspectSlot()`.
- `selectSurveyParcelById()`, `selectedTileMatchesCurrentSurvey()`, `prospectSelectedTile()`.
- `townHallText()`, `leaseMineLand()`.
- UI event bindings for `pb7-prospect`, `pb7-select-prospect-1`, `pb7-select-prospect-2`, and `pb7-lease`.

### STATE READ

- `prospectorHired`, `prospectorDay`, `prospectsUsedToday`, `day`.
- `selected`, `location`, `player`, road/terrain/parcel validity through helper calls.
- `surveyParcels`, `surveyParcel`, `selectedSurveyId`.
- `cash`, `mineParcel`, `mineParcels`, selected mine/warehouse parcel IDs.

### STATE WRITTEN

- Daily quota day/count.
- Prospect collection, compatibility mirror, selected survey ID, active mine-parcel mirror and selected parcel ID.
- On lease: cash, prospect/mine parcel collections/status/lease credit/date, active/remaining prospect selection, and warehouse-parcel selection mirror.

### CALLS

- Terrain/geology/site validation: `isSurveyableGround()`, `isPavedClaimRoad()`, `isPlayerClaimPath()`, `parcelConflicts()`, `resourceAt()`.
- Stable IDs: `allocateSiteId()`.
- Town/mining handoff: `warehouseParcelForMineParcel()` after lease; later mine ownership/build functions consume the selected parcel.
- UI feedback: `setContext()`.

### CALLED BY

- Prospect/Town Hall action buttons.
- `renderInterface()` for button state/text.
- `townHallProspectBoardMarkup()` and `renderLocationDetails()` for review display.
- Persistence migration/selection restoration.

### UI CONSUMERS

- Town Hall location detail board.
- Prospect 1/2 review buttons and lease button.
- Map parcel labels and contextual action text.

### PERSISTENCE

- `surveyParcels`, singular `surveyParcel`, `selectedSurveyId`, quota fields, stable IDs, and selected parcel mirrors are saved.
- Load deduplicates IDs/locations, restores slots, bounds active prospects, and repairs legacy singular records.

### RELATED TESTS

- `two independent prospects survive save/reload and neither replaces the other`.
- `legacy singular prospect migrates once without losing the selected mine`.
- `Town Hall displays both prospects and leases the selected stable ID`.
- `leasing a survey immediately frees the prospector for another mine claim`.
- `surface ore cannot occupy or be prospected from reserved and custom road cells`.

### DIRECT EDGES

- **Persistence and save profiles**
  - type: `PERSISTENCE`
  - criticality: `CRITICAL`
  - status: `CONFIRMED`
  - evidence: explicit prospect migration/serialization fields and regression fixtures.
- **Terrain/geology/site validation**
  - type: `CALLS` / `READS`
  - criticality: `HIGH`
  - status: `CONFIRMED`
  - evidence: `prospectSelectedTile()` calls road/ground/parcel validation and `resourceAt()`.
- **Town Hall UI**
  - type: `UI-CONSUMER`
  - criticality: `HIGH`
  - status: `CONFIRMED`
  - evidence: review button handlers select by ID; Town Hall markup reads both slots and current selection.
- **Mine land / site records**
  - type: `WRITES`
  - criticality: `CRITICAL`
  - status: `CONFIRMED`
  - evidence: `leaseMineLand()` moves the selected record into `mineParcels` and updates mine-parcel selection.
- **Warehouse-site scaffolding**
  - type: `CALLS`
  - criticality: `HIGH`
  - status: `CONFIRMED`
  - evidence: lease calls `warehouseParcelForMineParcel()` and mine purchase later calls `findWarehouseParcelFor()`.

### REQUIRED READ

- Prospect function family and action/button state in `renderInterface()`.
- Town Hall prospect board and selected-prospect UI.

### SAFETY READ

- Persistence/migration.
- Terrain/geology/site validity.
- Mine/warehouse parcel handoff.
- Prospect regression tests.

### KNOWN COUPLING / HAZARDS

- A prospect is simultaneously a geological observation, a 2×2 land parcel, and the seed for mine development.
- `surveyParcel`, `mineParcel`, and selected-ID mirrors can point at related or different records depending on lifecycle stage.
- Daily quota and unresolved-slot capacity are separate limits; a day reset does not free occupied slots.
- Lease mutates the selected object before moving it between arrays, so references/mirrors must be updated together.
- Current warehouse placement is implicitly attached to mine land rather than an independent approved proposal.

### CONFLICTS

- Current 2×2 survey-parcel behavior conflicts with the approved future 1×1 survey-result / separate footprint model.
- Current lease flow also reaches warehouse-site scaffolding, which exceeds the desired long-term responsibility of prospecting/Town Hall permission.

### UNRESOLVED QUESTIONS

- S-series survey/site-planning formulas and selection rules remain explicitly unapproved.

---

## Candidate neighborhood — Generic development proposals and Town Hall residential display

**SYSTEM / CANDIDATE ADDRESS:** Development proposal records and Town Hall presentation; permanent address not assigned  
**NAME:** Reusable proposal data foundation with read-only residential slots  
**TRUST STATE:** DRAFT  
**COVERAGE:** MAPPED

### CURRENT REALITY

- `state.proposals` is a bounded collection of normalized independent records; `nextProposalId` provides generated stable IDs.
- Each normalized record can retain `type`, `use`, lot coordinates/block ID, footprint, optional cost, status, owner, and development stage.
- Save loading preserves at most `CONFIG.maxProposals`, repairs duplicate/missing IDs, and persists the counter.
- Town Hall filters residential records and displays up to `CONFIG.maxResidentialProposals` (currently four) without deleting overflow records.
- No runtime function creates residential proposals, approves/purchases them, builds houses, or creates population/happiness/workers from them.

### TARGET OWNERSHIP

- Approved target: one reusable proposal-record/service pattern with type-specific rules for mining, residential, and industrial proposals.
- Town Hall approval must remain permission rather than construction capability.
- Future construction definitions, projects, bids, and procurement are separate systems and are not present here.

### OWNS

- Current generic proposal record normalization and ID allocation.
- Current bounded persistence of proposal records.
- Read-only Town Hall residential-slot markup.

### ENTRY POINTS

- `allocateProposalId()`, `normalizeProposalRecord()`.
- Proposal section of `loadSavedState()` and `serializedState()`.
- `proposalDisplayText()`, `townHallResidentialBoardMarkup()`.
- Town Hall branch of `renderLocationDetails()`.

### STATE READ

- `proposals`, `nextProposalId`.
- Residential UI also reads `CONFIG.maxResidentialProposals`.

### STATE WRITTEN

- `nextProposalId` during allocation.
- `proposals` and counter during save hydration/normalization.
- The Town Hall display performs no proposal-state writes.

### CALLS

- `normalizeProposalRecord()` calls `allocateProposalId()` when needed.
- Town Hall markup calls escaping/display formatting helpers.
- Persistence calls proposal normalization and duplicate-ID repair.

### CALLED BY

- Persistence load/serialize.
- `renderLocationDetails()` while the player is at Town Hall.

### UI CONSUMERS

- Town Hall residential proposal board in the building menu.
- Styling in `app/globals.css` under `townhall-residential-*` and shared prospect-card classes.

### PERSISTENCE

- `proposals` and `nextProposalId` are first-class save-version-11 fields.
- Unknown additional proposal properties survive normalization because records are shallow-copied before standard fields are normalized.

### RELATED TESTS

- `generic proposal records persist across save and reload without activating development`.
- `Town Hall displays independent residential proposals up to the configured UI limit`.

### DIRECT EDGES

- **Persistence and save profiles**
  - type: `PERSISTENCE`
  - criticality: `CRITICAL`
  - status: `CONFIRMED`
  - evidence: proposal collection/counter normalization, duplicate recovery, serialization, and reload tests.
- **Town Hall UI**
  - type: `UI-CONSUMER`
  - criticality: `NORMAL`
  - status: `CONFIRMED`
  - evidence: `renderLocationDetails()` appends `townHallResidentialBoardMarkup()`.
- **Construction, population, housing, workforce, and industrial-development systems**
  - type: none in current runtime
  - criticality: `HIGH` for future design safety
  - status: `TARGET`, not a current direct edge
  - evidence: handoffs explicitly separate these future responsibilities; no current proposal behavior calls them.

### REQUIRED READ

- Proposal normalization/persistence functions.
- Town Hall residential markup and proposal tests.

### SAFETY READ

- Persistence/stable-ID handling.
- Future proposal-generation/approval system once authorized and mapped.

### KNOWN COUPLING / HAZARDS

- Proposal normalization lives inside the engine persistence region rather than a proposal service.
- The collection is currently data-only; treating displayed records as actionable would invent missing approval, cost, and construction rules.
- `type` and `use` are free-form strings with minimal validation.
- Town Hall uses array order for display slot numbering; there is no persistent residential slot field.

### CONFLICTS

- Current Town Hall display has no approval/purchase action; long-term lifecycle requires one, but exact rules remain unresolved.
- Current mining prospects do not yet use the generic proposal collection.

### UNRESOLVED QUESTIONS

- Proposal generation rules, costs, approval/purchase transitions, and long-term configured limits.
- Whether proposal slot/order should become an explicit persistent field.
- How mining `SurveyResult` records will reference later mine-development proposals.

---

## Confirmed first-hop graph for SA-1A

This graph intentionally contains only confirmed direct relationships from the mapped entries. Unmapped systems are not assumed absent.

| Source | Target | Type | Criticality | Status | Evidence |
|---|---|---|---|---|---|
| Runtime host | Persistence/profiles | `CALLS`, `PERSISTENCE` | CRITICAL | CONFIRMED | startup/lifecycle/profile handlers call initialization, load, and save functions |
| Runtime host | React page/UI contract | `UI-CONSUMER` | HIGH | CONFIRMED | required root/canvas/`pb7-*` DOM IDs |
| Persistence/profiles | Shared runtime state | `READS`, `WRITES` | CRITICAL | CONFIRMED | `serializedState()` and `loadSavedState()` |
| Persistence/profiles | Profile API/D1 | `CALLS` | CRITICAL | CONFIRMED | `/api/profiles` fetches and D1 route handlers |
| Persistence/profiles | Prospect records | `PERSISTENCE` | CRITICAL | CONFIRMED | collection/slot/selection migration and serialization |
| Persistence/profiles | Proposal records | `PERSISTENCE` | CRITICAL | CONFIRMED | collection/counter normalization and serialization |
| Prospecting | Terrain/geology/site validity | `CALLS`, `READS` | HIGH | CONFIRMED | `prospectSelectedTile()` helper calls |
| Prospecting | Town Hall UI | `UI-CONSUMER` | HIGH | CONFIRMED | stable-ID review controls and prospect board |
| Prospecting | Mine land records | `WRITES` | CRITICAL | CONFIRMED | `leaseMineLand()` selected-record transition |
| Prospecting | Warehouse-site scaffolding | `CALLS` | HIGH | CONFIRMED | lease/purchase parcel lookup/generation |
| Proposal records | Town Hall UI | `UI-CONSUMER` | NORMAL | CONFIRMED | residential board reads filtered collection |
| Material-store primitives | Persistence | `PERSISTENCE` | CRITICAL | CONFIRMED | cargo/store normalization and serialization |
| Material-store primitives | Truck HUD/UI | `UI-CONSUMER` | NORMAL | CONFIRMED | capacity/summary calls in `renderInterface()` |

## Recovery point and exact remaining work

This draft intentionally stops after SA-1A. Runtime gameplay files were not changed.

Next archaeology work should begin with SA-1B and inspect the exact producer/transfer/consumer bodies for mine stock, warehouse storage, dirt, truck cargo, and hauls. It must replace the `POSSIBLE` inventory edges above with confirmed direct edges where evidence supports them, record conservation-sensitive mutations, and expand related tests. Subsequent milestones then cover economy/contracts/town growth and world/input/rendering before the final cross-check.

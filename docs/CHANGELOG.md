# Changelog

## Unreleased

### Checkpoint E — single-player world layout

- Reoriented the campaign so the player's development frontier occupies the full area north of Pinebarrow, while the southern frontier is reserved for Crowe's later expansion.
- Retired the obsolete six-player lane walls, section dividers, paid gates, and their on-map labels without granting southern construction, prospecting, or harvesting rights.
- Added five modest irregular lakes outside town; water blocks trucks, roads, surveying, resources, trees, and structures while preserving the town and its connected street grid.
- Regenerated forests, dirt, and ore as open natural patches across each frontier instead of repeating thirty-tile player lanes, while keeping all road cells free of surface ore.
- Moved the starter truck, tree, road reserve, fast-travel frontier, road planning, and mine-depth calculations to the north-side orientation.
- Added a versioned, idempotent world-layout migration that mirrors legacy P4 truck positions, cleared land, roads, prospects, mines, warehouses, doors, and construction parcels into the northern frontier without changing their stable IDs, stock, cargo, or upgrades.
- Preserved the existing four-lane Main Street, two-lane side streets, twelve enclosed blocks, and geography capacity for sixteen planned town lots.
- Added regressions for barrier-free travel, distinct traversal/build rights, lake exclusions, north/south campaign roles, legacy asset migration, both independent prospects, management screens, road purchasing, and existing save systems.

### Checkpoint D — Town Hall residential proposal display

- Added a Town Hall residential-proposal board with four configured display slots rather than hard-coding proposal records into the interface.
- Each filed proposal remains an independent stable-ID record and shows its plan, block, lot, footprint, cost, status, owner, and development stage.
- Empty proposal slots remain visible, while any over-limit saved records are preserved and reported instead of being deleted.
- Kept this checkpoint display-only: no proposal generation, approval/purchase action, construction, household, population, happiness, labor, or productivity behavior was added.

### Checkpoint C — generic proposal data foundation

- Added a persistent, versioned proposal collection that can represent mining, residential, and industrial records without creating any of those development systems yet.
- Normalized each proposal around a stable ID, type/use, lot coordinates and block ID, footprint, optional cost, status, owner, and development stage.
- Added bounded save loading, duplicate-ID recovery, deterministic ID allocation, and idempotent migration for older profiles.
- Kept proposals data-only: no proposal generation, Town Hall proposal UI, housing, population, construction, builders, bidding, procurement, mine/geology, warehouse, or industry behavior was added.

### Checkpoint B — Town Hall prospect review

- Added a Town Hall prospect board that keeps Prospect 1 and Prospect 2 visible as separate records with stable IDs, material, depth, and dirt ratio.
- Added Town Hall review buttons that select an individual prospect without replacing the other active survey.
- Updated lease approval to target the selected prospect ID, then preserve and select the remaining prospect after a lease.
- Added persistent prospect selection/slot migration and save version 10 while retaining the legacy `surveyParcel` compatibility mirror.

### Checkpoint A — independent mining prospects

- Added a capped collection of two persistent survey parcels so Prospect 1 and Prospect 2 retain separate IDs, locations, seams, dirt ratios, and lease state.
- Migrated legacy singular `surveyParcel` saves into the collection without duplicating records or discarding an existing mine selection.
- Kept the legacy active-prospect field as a compatibility mirror until Town Hall prospect management replaces it in Checkpoint B.
- Added save version 9 and regressions for independent creation, save/reload persistence, leasing one prospect, and retaining the other.

### Source protection

- Established `FixedOpinion/Pinebarrow-Land-Company` as the permanent source repository.
- Preserved the untouched production build on `baseline-live-v17`.
- Recorded the product blueprint, economy rules, town design, and phased implementation plan.

### Phase 1 — focused cleanup

- Prevented ore deposits, dirt, and trees from occupying the reserved company road or a completed custom road.
- Prevented prospecting on reserved and completed road cells.
- Added cleanup for older saves whose road tiles overlapped generated extraction decoration.
- Rebuilt the truck-stat panel as a fully opaque gauge with `IDLE`, `HAULING`, `FULL`, `WAITING`, `BLOCKED`, and `NO DESTINATION` states.
- Removed the low-value road-tile counter and progress strip without changing Town Hall surveys, paid stone quotes, road construction, travel, or price effects.
- Added deterministic regressions for road-safe resources, truck states, and the removed counter.

### Phase 2 — town streets and proportions

- Preserved the full 90-by-42 town footprint for long-term city growth.
- Rebuilt Main Street as a four-lane artery with lane markings, curbs, crosswalks, and five intersections.
- Added five two-lane side streets, sidewalks, and twelve recognizable city blocks.
- Rescaled and relocated civic, retail, service, and future-industry lots to believable proportions without changing their services.
- Made undeveloped industry sites visible as future lots while preserving their contract-driven Coming Soon and opening states.
- Added safe migration for older saves whose truck position falls inside a newly proportioned town building.
- Added deterministic layout regressions for street hierarchy, block count, entrance access, future lots, and save migration.

### Phase 2 hotfix — mobile fullscreen

- Restored the map renderer's claim-label color context, preventing the redraw exception that left only the green base layer after a fullscreen resize.
- Fullscreen now expands the complete document instead of detaching the nested game surface on affected Android browsers.
- Added an explicit fullscreen layout state so the HUD, controls, newspaper, and canvas remain mounted together.
- Re-measures and redraws the map after fullscreen, resize, and orientation transitions instead of trusting a transient zero-size viewport.
- Added a regression covering document-level fullscreen, HUD continuity, and a non-empty canvas viewport.

### Phase 2 correction — complete town grid

- Added north and south two-lane perimeter streets so the town's blocks are fully enclosed instead of open-ended lawns.
- Connected seven north-south streets to the perimeter streets and Main Street, eliminating streets that visually terminate at the claim wall.
- Preserved twelve complete development blocks within the original 90-by-42 town footprint.
- Snapped every civic, commercial, service, and future-industry building to a defined block with a consistent Main Street frontage.
- Reoriented parking aprons, walkways, and entrances toward Main Street instead of leaving buildings floating inside oversized grass lots.
- Extended old-save migration so a player saved at a relocated town service follows that service to its new entrance.
- Added deterministic regressions for block enclosure, street connectivity, frontage alignment, and service-location migration.

### Phase 3 — company management

- Added one live Company Operations screen with dedicated Mine, Warehouse, and Contract Management sections.
- Kept management access inside the buildings that own those services: Town Hall provides the company overview, mines open Mine Management, warehouses open Warehouse Management, and the Market opens Contract Management.
- Mine Management now lists every mine's material, level, clean production, output stock and capacity, dirt, shared crew status, assigned warehouse, hauling state, depth progression, and next upgrade.
- Added prominent `MINE STORAGE FULL`, `WAREHOUSE FULL`, `CONTRACT BLOCKED`, `HAULING`, `WAITING FOR TRUCK`, and `PRODUCING` states.
- Warehouse Management now lists capacity, free space, inventory, connected mine, hauling state, crew state, and next storage upgrade for every warehouse.
- Contract Management now separates commercial obligations from Marketplace sell offers and shows customer, material, delivered and remaining tonnage, total reward, earned value, assigned mine and warehouse, truck cycle, and a current-output capacity estimate.
- Added direct Track & Drive actions for managed mines and warehouses without changing save data or production rules.
- Rejected the earlier detached read-only overlays because they could select the newest profile instead of the active profile and lag behind live game state; management now reads directly from the running profile.
- Added regression coverage for building-owned management access, multiple-mine bottlenecks, linked warehouses, contract assignment, and management details.

## Production baseline — Sites version 17

- Marketplace sell offers with player-set prices and partial demand-based fills.
- Persistent company contract hauling.
- Turning, two-tile-wide Town Hall road surveys with paid stone and labor.
- Daily price/news effects and Coming Soon business development.
- Separate music, engine, and effects settings.
- Multi-mine and multi-warehouse saves, controls, and prior progression systems.

This section documents the recovered state; it does not claim that every planned handoff feature is already implemented.

# Pinebarrow Land Company — Placement, Footprint, and Builder Complexity

**Status:** Design contract for checkpoint C2; runtime implementation not started
**Baseline:** v24 branch `e34553cded3ecf3944fa1ba6c588fb6f8bf14149`
**Related scope:** `docs/FULL_GAME_CONTENT_CONTRACT.md`

## Why this checkpoint exists

The current placement behavior is too specialized and does not match the intended game:

- Worker houses, mines, warehouses, shops, and Crowe buildings are currently defined as fixed 2×2 records.
- A prospect currently becomes a fixed 2×2 mine parcel; it is not a separate geology permit plus a player-selected mine footprint.
- A warehouse parcel is automatically generated beside the mine instead of being selected by the player and connected through logistics.
- Roads are planned by tapping individual center points. The engine expands them into a fixed two-tile corridor, but it does not provide a drag preview or a shared rectangle-selection primitive.
- Construction providers currently expose only levels 1–3, so large layouts have no meaningful qualification gate.

Checkpoint C2 must replace these behaviors with one grid-based selection contract used by roads, residential lots, mines, warehouses, shops, and future research facilities.

## Selection contract

### Basic gesture

Placement happens only after the player enters a specific placement mode from Town Hall, a purchased agreement, a leased/owned resource site, or an upgrade action.

1. Pointer/touch down records an integer grid anchor.
2. Pointer movement captures the pointer and updates a live preview.
3. The current tile and anchor are normalized into an axis-aligned rectangle for an area design.
4. A diagonal drag creates the rectangle between the two corner tiles; it does not select an arbitrary pixel shape.
5. Pointer/touch release creates or updates a draft proposal only. It does not spend cash and does not start construction.
6. A short tap selects one tile or enters the smallest valid footprint for the active design.
7. Cancel, pointer-cancel, leaving the permitted area, or pressing Escape clears the transient selection safely.

Mouse, touch, keyboard, and controller input must use the same validator and produce the same saved proposal. On touch, a small movement threshold prevents an accidental tap from becoming a large selection. Pointer capture must be released on `pointerup`, `pointercancel`, `lostpointercapture`, window blur, and menu close.

### Area versus corridor selection

There are two selection modes, both displayed as tile highlights:

- **Area mode:** Buildings and lots use the normalized rectangle from anchor to current tile. The player may rotate the design before confirming it. Width, height, area, frontage, cost, and required qualification are shown in the preview.
- **Corridor mode:** Roads follow the captured finger path, snap to grid-connected segments, and expand each segment to the road profile width. A diagonal finger movement becomes a connected staircase/turning route rather than a one-cell jump. The route may be any length; the engine packages it into bounded construction segments.

The player sees three preview states:

- **Green:** valid cells and valid access;
- **Amber:** valid shape but a missing approval, builder level, research unlock, or purchase agreement;
- **Red:** blocked by water, trees, an existing structure, another project, a road conflict, ownership, geology, or an invalid frontage.

The preview must display at minimum:

`width × height · area · frontage · material estimate · labor estimate · project cost · required builder/role · blocking reason`

## Shared grid parameters

All placement values are integer world tiles. A saved footprint is `{ x, y, w, h, orientation }`, where `w` and `h` include both endpoint tiles. The validator also stores the selected cell keys and frontage cells in the project snapshot so later balance or map changes cannot silently change an awarded job.

Every selection must pass these checks before it can become a proposal:

- inside the world and the permitted claim, town block, parcel, or purchase area;
- owned, leased, or approved for the active route;
- not on a lake, reserved barrier, existing road, existing structure, completed property, or conflicting project unless the active design explicitly permits it;
- all trees and natural obstacles cleared when the design requires a clear site;
- at least one valid road or pedestrian frontage cell when the building requires access;
- no overlap with another active proposal or property;
- mine footprints contained by, or explicitly covered by, surveyed geology;
- warehouse footprints on company-controlled land and reachable by a road route;
- house lots aligned to a valid town block/lot orientation rather than arbitrary manual coordinates.

The selection itself is temporary. The durable sequence remains:

`selection -> proposal or purchase agreement -> Town Hall approval or ownership check -> design snapshot -> builder bids -> supply/logistics/hauling contracts -> construction`

## Builder and planner capability tiers

These are starting capability bands, not hard-coded balance values. They belong in configuration and can be tuned without changing the selection engine.

| Qualification | Maximum short side | Maximum long side for one building design | Intended use |
|---|---:|---:|---|
| Builder I, level 1 | 2 | 2 | Starter house, mine, warehouse, shop, small road package |
| Builder II, level 3 | 2 | 4 | House expansion, small warehouse/mine expansion, short access works |
| Builder III, level 5 | 2 | 6 | Larger housing, warehouse/mine yards, longer service works |
| Master Builder, level 7 | 2 | 8 | Industrial rows, larger mine/warehouse designs, substantial road packages |
| City Builder, level 8 | 2 | 10 | 2×10 corridors, long residential/commercial outlays, major access works |
| City Planner, level 10 | 4 | 10, subject to area rules | 4-wide civic layouts, research facilities, main-street and block plans |

The dimensions are normalized so a 2×10 design may be rotated to 10×2. The short-side limit prevents a low-level builder from claiming an oversized block, while the long-side limit lets early construction grow in a controlled direction.

A 2×10 layout therefore requires a City Builder or a City Planner. A 4×6 research facility is specifically a City Planner design: it is not unlocked merely because the player has enough cash or has dragged a large rectangle.

Two qualifications must remain separate:

- **Builder/provider level:** the construction company or builder bid can physically execute the design.
- **City Planner role:** a qualified person or planning office can approve/unlock complex layouts and civic designs.

The player may eventually employ a level-10 City Planner through the school/research progression, but that person does not replace the builder, material supplier, logistics provider, or hauler.

## Cost, labor, and time scaling

The base building definition remains the source of the smallest valid design. A selected larger design scales the project snapshot; it does not mutate the definition after work begins.

Let:

- `A` = selected area in tiles;
- `A0` = base design area;
- `P` = selected perimeter;
- `P0` = base design perimeter;
- `F` = required frontage/access cells;
- `T` = total material tonnage after terrain and design modifiers.

The initial balancing rules are:

- material quantities scale with `A / A0` and round up;
- labor scales with `A / A0`, with an additional perimeter/access allowance;
- builder price and construction time scale with area and the builder's duration multiplier;
- logistics and hauling scale with `T`, route distance, and the number of delivery packages;
- frontage, difficult terrain, or a blocked/temporary route adds a configured surcharge or prevents the proposal;
- a larger design can never reduce the requirements of its smaller base design.

Roads use route-cell count instead of building area. The current starting baseline is retained as configuration: purchased stone is calculated from road tiles and the existing road labor-per-tile rule. A long road may be selected in one gesture, but the system creates bounded construction packages, normally ten new route tiles per package, under one visible route record. This keeps saves and contracts bounded while preserving the player's ability to plan a long road at once.

The preview must show estimates before the proposal is submitted. Once a builder bid or procurement contract is awarded, the project stores the exact material, labor, time, frontage, and cost snapshot.

## Type-specific rules

### Houses and residential lots

The player selects an approved residential lot or a valid block lot; the player does not draw an arbitrary house shape with no building definition.

| Design | Footprint | Builder gate | Role |
|---|---:|---:|---|
| Workforce House | 2×2 | Builder I | Starter household capacity and workforce housing |
| Expanded House | 2×3 | Builder II | First in-place/adjacent house upgrade |
| Family House | 2×4 | Builder III | Better quality and larger household capacity |
| Row/Boarding House | 2×6 | Master Builder | Multiple household units under one managed property |
| Civic residential block | 4×6 or configured equivalent | City Planner | Later town-density content |

House upgrades are projects. An upgrade may expand into adjacent approved cells or improve the existing footprint internally. It preserves the house/property ID, household records, residents, contracts, and ownership history. If no valid adjacent cells exist, the interface must explain why the expansion is unavailable rather than silently moving the house.

A long residential selection represents a defined row/boarding design or a sequence of individual lots—not one unbounded household. Each household/property unit remains separately addressable for population, rent, sale, and workforce safety.

### Roads

- **Company access road:** 2×N corridor, connected to an existing paved route, road-accessible buildings, and permitted company land.
- **Town side street:** 2×N corridor, owned/approved by the town and developed through the town infrastructure route.
- **Main Street:** 4×N corridor, existing town design and later expansion route; requires City Planner-level planning for new major sections.

Road selection cannot jump over lakes, structures, uncleared trees, or another project's footprint. A road turn must preserve a connected two-tile or four-tile corridor at the corner. The route may be long, but it is split into bounded construction packages and still uses stone purchase, builder, labor, logistics, and hauling contracts.

### Mines

Prospecting and mine placement become separate concepts:

1. Prospecting records a surveyed geology field and its material/dirt/depth data.
2. Leasing or buying the field grants the development right; it does not automatically choose the building coordinates.
3. The player selects a mine footprint inside the permitted surveyed field and adjacent to a valid road/access route.
4. The mine project stores which surveyed cells support its material. A larger mine cannot silently claim unsurveyed geology.
5. Mine expansions are projects. Excavation, active seam, shaker, stockpile capacity, loading, and logistics remain separate upgrade tracks from physical footprint.

The starter mine is 2×2. A later mine yard or shaft design may become 2×4 or 2×6 through the builder tiers and additional survey/research requirements. A larger footprint must not be used as a shortcut to unlock deeper ore; geological depth and mine technology remain their own systems.

### Warehouses

Warehouses become independent player-selected buildings:

- starter warehouse: 2×2, Builder I, road-accessible;
- expanded warehouse: 2×4 or 2×6 through a project-backed footprint upgrade;
- capacity and logistics upgrades remain separate, so storage size does not automatically increase hauling speed;
- a warehouse may serve multiple mines and a mine may route to any eligible warehouse;
- assignment happens in the logistics/warehouse management screen;
- the old automatically adjacent warehouse relationship remains only as a compatibility reference for old saves.

The new flow is:

`select warehouse lot -> purchase/approve -> build warehouse -> assign mine routes -> run hauling`

No new warehouse is silently placed below, beside, or inside the mine parcel.

### Research facility

The first research facility is a defined 4×6 building, rotatable to 6×4, and requires:

- the School to exist and be operational;
- a qualified scholar/researcher path;
- the research technology/unlock event;
- a City Planner-level design/approval capability;
- a valid road/frontage and project site;
- builder, material, logistics, hauling, labor, and time contracts.

The facility is not available in the early menu. The School is early visible content; the research facility is later unlockable physical content. After completion it has staffing, inputs, research queues, knowledge output, ownership, management, and upgrade projects.

## Data to preserve in the final project records

Transient selection state should not be treated as completed construction. A draft proposal/project snapshot should preserve:

- selection mode and source route;
- anchor/current tile and normalized `x`, `y`, `w`, `h`, orientation;
- selected cell keys and frontage/access cells;
- area, perimeter, road profile, route package IDs, and lot/block ID;
- geology/survey cell IDs for mines;
- base design ID and upgrade ID;
- required builder level, required role, research prerequisites, and approval route;
- estimated values before award and exact material/labor/cost/time values after award.

Legacy compatibility rules:

- old 2×2 mine parcels remain loadable as fixed legacy mine fields until the player creates a new expansion or replacement project;
- old adjacent warehouse links remain readable but become optional `assignedMineIds`/route records;
- old tapped road point arrays migrate into route-cell packages without losing paved tiles;
- no existing completed mine, warehouse, road, house, contract, or ownership record is deleted by the placement migration.

## C2 implementation split

To protect the work from usage limits, C2 is split into these independently committed checkpoints:

| Checkpoint | Responsibility | Verification |
|---|---|---|
| C2.1 | Add shared transient grid-selection state, pointer capture, rectangle/corridor preview, rotate/cancel, and common validator | Horizontal, vertical, diagonal, touch-cancel, blocked-cell, and controller/keyboard selection tests |
| C2.2 | Add footprint/complexity configuration, builder capability filtering, cost/labor/time estimates, and proposal snapshots | 2×2, 2×4, 2×10, and 4×6 qualification/cost tests |
| C2.3 | Replace fixed mine/warehouse placement with player-selected footprints; preserve legacy saves and remove new auto-adjacent warehouse creation | Mine geology, road frontage, independent warehouse assignment, and migration tests |
| C2.4 | Connect residential lots, house designs/upgrades, and road corridor selection to the shared project mechanism | House placement/upgrade, two-wide road, four-wide main-street, long-route packaging, and project-ledger tests |
| C2.5 | Browser/mobile smoke and integration gate | Touch drag, diagonal drag, preview readability, save/reload, full tests/build/lint, then update the PR handoff |

No C2 checkpoint should add School or research behavior yet. It must only create the placement and project foundation those later buildings will use.


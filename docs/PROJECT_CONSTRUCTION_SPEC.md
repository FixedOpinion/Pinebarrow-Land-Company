# Pinebarrow Land Company — Project, Construction, Property, and Workforce Specification

**Status:** Approved design direction for the next implementation milestone
**Starting main:** `2c65ba7431b18d5514321cdd2d14cddb08f9128f`
**Branch:** `phase-5-project-construction`
**Scope:** Consolidated design plus the first shared project/construction implementation boundary

## Why this replaces the old Phase 5 split

The old roadmap treated worker houses, shops, Crowe development, and town growth as mostly separate future features. The approved direction is a shared in-game project mechanism. Houses, mines, warehouses, player shops, town shops, and Crowe buildings must use the same construction and economic spine.

PR #4 is historical evidence only. Its one-house-equals-an-automatic-worker model and runtime patching are not the implementation target. Housing supplies capacity; residents become candidates, candidates are hired, and hired workers are assigned to jobs.

## Core promise

Pinebarrow development must create real work for the player's company and for rival builders:

`proposal or purchase agreement -> site permission -> building design -> builder bids -> construction contract -> material procurement -> logistics and hauling -> construction progress -> ownership -> management -> sale or further development`

Construction must create demand for mines, warehouses, trucks, logistics providers, builders, and workers. It must not be an instant cash-only button hidden inside Town Hall.

## Two legal entry routes

### Development route

Used for player development and Crowe development:

1. A development proposal identifies a lot, use, footprint, owner/controller, and stage.
2. Town Hall approves the site and permitted use.
3. The owner selects an allowed building design and level.
4. A Construction Project snapshots the design requirements.
5. Eligible builders submit bids.
6. One construction bid is awarded.
7. Material, mine-supply, logistics, and hauling obligations are created as separate procurement contracts.
8. Delivered resources and labor advance the project.
9. The completed building receives ownership and management state.

Town Hall grants permission. It does not perform construction, select the builder, or silently create materials.

### Town infrastructure and shop route

Town infrastructure uses purchase agreements instead of player site approval:

`purchase agreement -> project created -> builder/material/logistics/hauling contracts -> construction -> ownership -> management -> optional sale`

Purchase agreements skip the Town Hall site-approval step, but they do not bypass construction, procurement, delivery, labor, ownership, or management rules.

Rentable town shops are property records attached to completed buildings. Renting, operating, upgrading, and selling are management/ownership actions, not separate instant-building mechanics.

## Canonical records

### DevelopmentProposal

Stable saved record for permission or purchase context:

- `id`
- `type`: `residential`, `industrial`, `commercial`, `infrastructure`, or `mining`
- `use` and `buildingFamily`
- `lot`: coordinates, footprint, block, and frontage
- `cost` and purchase-agreement terms
- `status`: `draft`, `approved`, `purchased`, `under-construction`, `completed`, or `cancelled`
- `owner`: `player`, `crowe`, `town`, or null
- `stage`: `unstarted`, `coming-soon`, `fenced`, `foundation`, `partial`, or `completed`
- `projectId` when construction begins

### BuildingDefinition

Configuration/data source for building designs. Definitions own footprint, permitted uses, required builder level, material requirements, labor, build time, ownership rules, management capabilities, and capacity effects. Active projects copy these requirements into a snapshot so later balance edits cannot change an awarded job.

### ConstructionProject

Stable saved record for one physical development job:

- `id`, `proposalId`, `buildingId`, `level`, and `ownerId`
- immutable requirement snapshot
- `status`: `awaiting-builder`, `builder-awarded`, `procurement`, `building`, `completed`, `blocked`, or `cancelled`
- awarded builder/bid IDs
- procurement contract IDs
- delivered material totals
- labor/progress totals
- created, deadline, completion, and cancellation dates
- ownership and management references

### ConstructionBid

Separate builder offer containing builder identity, qualification level, price, duration, workload, reputation, and status. A rival builder may win the build while the player wins material or logistics contracts.

### ProcurementContract

Separate obligation for a resource or service. It identifies project, category, material/service, quantity, supplier/provider, price, deadline, delivered amount, status, and failure/penalty state.

Construction contracts and procurement contracts must not be collapsed into one record type.

## Contract categories

Each project may create distinct obligations for:

- builder/construction labor;
- mine or material supply;
- warehouse/storage staging;
- logistics/dispatch;
- hauling/transport;
- emergency procurement if an awarded supplier misses a deadline.

These contracts use stable IDs and visible statuses. The player may participate economically even when Crowe owns the project or wins the construction bid.

## Workforce relationship

Worker Houses are workforce housing, not free-worker generators.

- A completed house contributes configured housing capacity.
- Residents occupy that capacity.
- Jobs create vacancies.
- Candidates are selected and hired through the employment/workforce interface.
- Hired workers are assigned to mines, warehouses, markets, shops, builders, or Crowe operations.
- Removing housing, cancelling a project, or selling a property must not silently orphan an assignment.
- Unstaffed productive buildings stop safely and expose a reason.

Worker-house construction itself uses the same Project mechanism. A shop can be completed but remain unstaffed; a Crowe building can be completed but remain operationally blocked until its workforce is available.

## Crowe relationship

Crowe is an owner/controller and economic rival, not a bypass around the rules.

- Crowe projects use the same proposal/project/bid/procurement records.
- Crowe may develop from the southern reserve toward town.
- Crowe may win construction contracts.
- Crowe may compete for lots and purchase agreements.
- Crowe's buildings consume real materials, logistics, hauling, labor, and time.
- Crowe wealth, estate growth, and visible buildings derive from recorded transactions and completed projects.
- Crowe cannot create an instant building or invisible workforce.

## Ownership and management

After completion, a property receives an ownership record and management state.

Management may include:

- owner/controller;
- tenant or operator;
- rent and lease terms;
- workforce requirement and assigned workers;
- operating status;
- upgrade path;
- income and expenses;
- sale eligibility and current sale value.

An owned property can be listed for sale at any time after the defined ownership state exists. Sale must settle or explicitly transfer active management and contract obligations; it must never delete the property or its ledger history.

## Existing-runtime reconciliation

The current main branch already provides:

- stable proposal, mine, warehouse, prospect, haul, and company-contract IDs;
- save normalization and migration through schema version 12;
- Town Hall proposal display;
- Town Hall prospect approval/lease flow;
- primitive Coming Soon business progression;
- existing material prices, mines, warehouses, trucks, company contracts, and Crowe news state.

The current main branch does not yet provide:

- construction project records;
- builder profiles or bids;
- procurement contracts for project materials;
- logistics/hauling obligations tied to construction;
- ownership/management/sale records for developed lots;
- resident/candidate/hiring records;
- dedicated worker-house capacity;
- Crowe construction execution.

Do not replace the current engine or merge PR #4. Add the new spine through the canonical current runtime and preserve existing saves.

## Implementation order

1. Add normalized project, bid, procurement, ownership, and management collections with idempotent save migration.
2. Add one shared project state transition path and Town Hall permission/purchase-agreement entry points.
3. Add one complete worker-house project path, including builder bidding and visible blocked procurement status.
4. Connect actual mine, warehouse, logistics, and hauling contracts.
5. Add shop ownership, rent, management, sale, and operating workforce requirements.
6. Run Crowe through the same path with a separate owner/controller.
7. Add physical map rendering and richer construction stages after the state/economy path is stable.

Do not combine mine architecture redesign, Shaker balance, full population simulation, and visual redesign into the first project-system implementation.

## Save and safety requirements

- Increase save schema monotonically from 12.
- Normalize every collection with stable IDs and bounded lengths.
- Migrate old proposals without changing their IDs or deleting overflow records.
- Preserve old `workers` and existing mine/warehouse fields as compatibility mirrors until a later workforce migration replaces them.
- Load incomplete project records into a safe `blocked` or `awaiting-builder` state with a visible reason.
- Never silently create cash, material, ownership, workers, or completed buildings during migration.
- Loading the same profile twice must produce the same normalized project state.

## Acceptance target for the first coherent slice

A test profile should be able to:

1. view a development proposal at Town Hall;
2. enter the correct permission or purchase route;
3. create a saved Construction Project;
4. see a builder bid state and separate procurement obligations;
5. see the project remain blocked when requirements are missing;
6. preserve all records through save/reload;
7. leave existing mining, hauling, marketplace, contracts, controls, and world-layout behavior unchanged.

This first slice is the foundation for the later full construction economy; it is not permission to claim that population, rent, full Crowe AI, or completed construction are already implemented.

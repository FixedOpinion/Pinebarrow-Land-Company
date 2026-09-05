# Pinebarrow Land Company — Project, Construction, Property, and Workforce Specification

**Status:** Implemented v24 checkpoint; merge candidate pending production build/lint verification
**Starting main:** `2c65ba7431b18d5514321cdd2d14cddb08f9128f`
**Branch:** `phase-5-project-construction`
**Scope:** Shared project, construction, procurement, workforce, property, and Crowe implementation

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

- `id`, `proposalId`, `buildingId`, `siteKind`, `siteParcelId`, and `ownerId`
- immutable requirement snapshot plus delivered totals
- `status`: `awaiting-builder`, `procurement`, `ready-to-build`, `building`, `delayed`, `completed`, or `cancelled`
- awarded builder/bid IDs and settled builder cost
- procurement contract IDs and material/service settlement totals
- labor/progress totals
- created, deadline, delay, and completion dates
- completed building, mine, or warehouse record reference

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

## v24 implementation reconciliation

The current main branch supplied the canonical engine, stable proposal/mine/warehouse/haul/company-contract IDs, schema v12 save loading, Town Hall proposal display, prospect leasing, Coming Soon businesses, material prices, and the existing management screens.

The v24 branch adds and persists schema v14 records for:

- construction projects, builder bids, procurement contracts, deadlines, delivery, cash settlement, labor progress, completion, and delayed status;
- completed worker houses, resident candidates, workforce records, one-worker-per-house capacity, explicit mine/warehouse assignment, and no-worker production stoppage;
- project-backed mine and warehouse construction while preserving existing completed legacy assets;
- completed town shops with tenants, daily rent, sale, and recoverable town buy-back;
- Crowe's own project, builder, procurement, construction, and completed-building path;
- map rendering and Town Hall ledgers for active sites and completed property.

The remaining merge gate is operational rather than architectural: run the repository's production build and lint commands on the exact branch head, then perform a focused browser smoke test.

## Implementation order

The v24 branch completed the shared vertical slice in this order:

1. Add normalized project, bid, procurement, completed-building, resident, and workforce collections with bounded schema migration.
2. Route residential proposals, purchased town development, mines, warehouses, and Crowe through the same project factory.
3. Settle awarded builder, material, logistics, and hauling obligations against cash and company inventory.
4. Advance delivery, labor, deadlines, completion, ownership, rent, sale, and buy-back through game time.
5. Expose Town Hall project, workforce, property, and contract management while preserving the existing mine, warehouse, market, road, controls, and save flows.

Follow-up phases can deepen provider competition, site-placement validation, demolition, richer warehouse logistics, and production balancing without bypassing this spine.

## Save and safety requirements

- Increase save schema monotonically from 12.
- Normalize every collection with stable IDs and bounded lengths.
- Migrate old proposals without changing their IDs or deleting overflow records.
- Preserve old `workers` and existing mine/warehouse fields as compatibility mirrors; migrate old anonymous crews into available workforce records while routing every new build through the project spine.
- Load incomplete project records into a safe `blocked` or `awaiting-builder` state with a visible reason.
- Never silently create cash, material, ownership, workers, or completed buildings during migration.
- Loading the same profile twice must produce the same normalized project state.

## Acceptance target for the v24 integrated slice

A test profile can now:

1. view a development proposal at Town Hall;
2. enter the correct approval or purchase-agreement route;
3. create a saved Construction Project for a house, shop, mine, warehouse, or Crowe building;
4. award a builder and bid separate material, logistics, and hauling obligations;
5. see missing inventory or cash leave delivery blocked instead of creating resources;
6. watch delivery, service settlement, labor, deadlines, and completion advance with game time;
7. receive completed building, mine, warehouse, resident, tenant, and ownership records;
8. hire housed residents, assign one worker per mine or warehouse, stop unstaffed production safely, and reassign without duplicate staffing;
9. collect shop rent, sell property, recover a sold property, and preserve all records through save/reload.

The branch has 39 focused Node regressions passing. Production build, lint, and browser smoke verification remain the final merge gate.


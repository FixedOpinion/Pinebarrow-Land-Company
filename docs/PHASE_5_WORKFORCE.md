# Phase 5 Workforce

## Goal
Replace the legacy global mine-worker multiplier with explicit workforce supply and assignment while preserving existing saves and economy systems.

## Phase 5A — Workforce foundation

Implemented on `phase-5-workforce`:

- Save schema version 9.
- Existing saves with legacy `workers` migrate into worker-house records so old workers are not discarded.
- One Worker House supplies exactly one worker.
- Worker House footprint is defined as 2×2 (four tiles).
- Each worker can be assigned to one mine or one warehouse.
- A mine with no assigned worker produces zero output and reports `NO WORKER` in Workforce Management.
- Reassigning or unassigning a worker safely stops the mine they leave.
- Workforce Management shows houses, available workers, mine/warehouse staffing, and assignments.
- Existing worker purchase costs are preserved as the staged Worker House costs for this migration phase.
- Existing mine, warehouse, hauling, contract, market, and town systems are otherwise left intact.

## Phase 5B — Physical house placement

Next chunk:

- Place each planned Worker House as a real 2×2 structure inside the player's claim area.
- Validate clear four-tile footprints and prevent overlap with roads, mines, warehouses, trees, or other structures.
- Draw placed houses on the map.
- Add travel/selection details for houses.
- Convert migrated/planned houses to placed houses without deleting the worker they already represent.

## Phase 5C — Staffing polish

After placement:

- Surface `NO WORKER` consistently in Mine Management and Warehouse Management.
- Make warehouse productive/logistics actions honor staffing once Phase 6 automated logistics begins.
- Add assignment guidance and insufficient-housing bottleneck messaging.

## Safety notes

The workforce integration is applied as a guarded source patch at startup. Every required engine marker is checked; if a marker no longer matches, startup fails with an explicit error instead of silently applying a partial patch.

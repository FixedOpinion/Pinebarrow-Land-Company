# Development Checkpoint Schedule

## Purpose

Pinebarrow development must survive interrupted chats and usage limits. GitHub is the source of truth. Work is not considered saved until its commit is visible on GitHub and the branch head has been fetched back and verified.

## Repository state at this update

- Current `main`: `2c65ba7431b18d5514321cdd2d14cddb08f9128f` (verified 2026-09-05)
- Current live-engine baseline before new mechanics: `f36a8aa5611998066bf19bf02ba735d3dad08044`
- Reference-only Workforce branch: `phase-5-workforce` / PR #4 (closed as superseded 2026-09-05)
- Deferred mine-planning branch: `phase-4b-mine-foundation`
- Next code branch: create `phase-5r-workforce-reconciliation` from the then-current `main`

The old Workforce branch and deferred mine branch are recovery evidence. Neither should be merged wholesale.

## Required checkpoint cycle

Every micro-phase uses this order:

1. Fetch and record the current branch SHA.
2. Define one migration, behavior, UI surface, or test-hardening task.
3. Inspect only the relevant canonical source and existing regression hooks.
4. Make the smallest coherent change.
5. Run focused checks for that change.
6. Commit immediately.
7. Fetch the branch again and verify its SHA and changed paths.
8. Update the GitHub phase tracker.
9. Report the commit, checks, known limits, and exact next checkpoint.
10. Do not begin the next checkpoint until the current one is verified.

A phase is merged or published only after:

1. all phase checkpoints are committed;
2. legacy and current save fixtures pass;
3. the full regression suite, lint, and production build pass;
4. the tested phase branch is merged into `main`;
5. the new `main` SHA is verified;
6. that exact SHA is published;
7. the live game receives a focused smoke test; and
8. `docs/CHANGELOG.md` records the release.

## Usage-efficient rules

- Default to one micro-phase per development turn.
- Never hold more than one self-contained behavior uncommitted.
- Target no more than three production files plus focused tests and documentation per checkpoint.
- Use targeted file/line retrieval for inspection; fetch an entire large engine only when it must be edited.
- Run focused regression tests during implementation. Reserve the complete build/test/lint pass for the integration checkpoint.
- Do not combine save migration, economic balancing, visual redesign, and a new mechanic in one commit.
- Do not deploy intermediate mechanics commits.
- Do not regenerate artwork during mechanics phases unless the phase explicitly requires art.
- Do not claim a test, build, merge, or deployment succeeded without direct evidence.
- If interrupted, resume from the last verified GitHub commit rather than reconstructing unfinished work from chat.

## Reconciled phase sequence

### Phase 5R — Workforce reconciliation

Purpose: safely port the useful Workforce 5A foundation onto the current integrated Company Operations engine.

| Checkpoint | Single responsibility | Verification |
|---|---|---|
| 5R.0 | Inventory differences between current `main` and PR #4; identify code to port versus reject | Conflict map recorded in the phase tracker |
| 5R.1 | Add workforce save schema and idempotent legacy migration only | Current/legacy profile fixtures preserve mines, warehouses, and old workers |
| 5R.2 | Add worker assignment APIs and mine `NO WORKER` production gate | Assignment, reassignment, unassignment, and stopped-production regressions |
| 5R.3 | Integrate Workforce state into the current Company Operations screen | UI opens from existing building-owned menus and reads the active profile |
| 5R.4 | Reconciliation compatibility pass | Full tests/build/lint; verified PR checkpoint; stop before physical placement |

Implementation rule: manually port the small workforce behaviors into the canonical current engine and Operations UI. Do not replace current files with the older branch versions, and do not preserve runtime monkey-patching merely because the reference branch used it.

### Phase 5B — Physical Worker Houses

| Checkpoint | Single responsibility | Verification |
|---|---|---|
| 5B.1 | Add 2×2 house records, placement validation, configured cost, and save persistence | Road, wall, tree, ore, building, ownership, and overlap tests |
| 5B.2 | Add build mode, top-down rendering, selection, and entrance/access behavior | Touch, mouse, keyboard, controller, and reload tests |
| 5B.3 | Derive worker capacity strictly from completed physical houses | One completed house equals one worker; demolition/removal cannot orphan assignments |
| 5B.4 | Physical-house integration gate | Full suite and migration pass |

### Phase 5C — Workforce completion

| Checkpoint | Single responsibility | Verification |
|---|---|---|
| 5C.1 | Complete assignment/reassignment UI and explicit worker status | Multi-building assignment tests |
| 5C.2 | Apply worker requirement to warehouses without adding automatic collection yet | Unstaffed warehouse stops operational actions safely |
| 5C.3 | Workforce phase integration, changelog, merge, and release candidate | Full build/lint/tests and existing-profile smoke test |

### Phase 6 — Mine Architecture and Efficiency

| Checkpoint | Single responsibility | Verification |
|---|---|---|
| 6A.1 | Migrate generic mine level into separate Excavation, Active Seam, Shaker, Stockpile, and Loading fields | Idempotent versioned migration; no lost output, material, contracts, or upgrades |
| 6A.2 | Preserve the old `level` as a temporary compatibility mirror where required | Old UI/test hooks continue safely until replaced |
| 6B.1 | Make Excavation control production capability and unlocked seams | Depth-band and unlock regressions |
| 6B.2 | Stop automatic ore switching when Excavation improves | Stone mines remain on Stone unless the player changes seam |
| 6B.3 | Add Active Seam selection after setup-time and mixed-stock rules are resolved | Contract and stockpile integrity tests |
| 6C.1 | Apply the locked Shaker efficiency table | Useful ore remains constant; retained dirt follows efficiency |
| 6C.2 | Separate Stockpile Capacity upgrades from Excavation/Shaker | Independent capacity/cost tests |
| 6C.3 | Expose all mine tracks and bottlenecks in Mine Management | UI and controller/keyboard interaction tests |
| 6C.4 | Mine phase integration gate | Full suite, balance sanity check, migration, merge, release candidate |

Data strategy: keep per-mine IDs stable. Store unlocked seams explicitly. Track dirt generated, removed, hauled, processed, and discarded as separate ledger totals so later Crowe/story systems use real company behavior rather than invented wealth.

### Phase 7 — Warehouse Logistics

| Checkpoint | Single responsibility | Verification |
|---|---|---|
| 7A | Assign mines to warehouses and transfer on a deterministic timed logistics tick | No per-frame hauling loop; capacity-safe transfers |
| 7B | Separate warehouse Capacity and Collection/Logistics upgrades | Each upgrade changes only its documented statistic |
| 7C | Add per-material reserves and available-stock calculation | `available = max(0, inventory - reserve)` |
| 7D | Add hauling states, bottleneck messages, and visual development | Full/empty/backlog/unstaffed tests |
| 7E | Logistics integration gate | Full suite, migration, merge, release candidate |

### Phase 8 — Dirt Processing and Crowe foundation

| Checkpoint | Single responsibility | Verification |
|---|---|---|
| 8A | Lock a balance specification using simulation before coding recovery odds | Expected value, progression cost, and abuse cases reviewed |
| 8B | Add Dirt Processor building/state and batch jobs | Capacity, cost, save, and interruption tests |
| 8C | Add configurable recovery tables without casino presentation | Deterministic seeded tests |
| 8D | Connect real dirt/tailings totals to Crowe's acquisition fund and newspaper story state | Poor efficiency increases tailings; bad Shakers never improve player recovery odds |
| 8E | Dirt/Crowe integration gate | Economy simulation plus full suite |

Unresolved before 8A: processor batch sizes, operating costs, recovery odds, rare-material table, and exactly how Crowe legally acquires/profits from tailings.

### Phase 9 — Player Market

| Checkpoint | Single responsibility | Verification |
|---|---|---|
| 9A | Place and staff the 2×6 Player Market | Footprint, access, save, and worker tests |
| 9B | Pull only reserve-eligible warehouse stock at configured throughput | Reserve and bottleneck tests |
| 9C | Route automated sales through the existing town price/demand algorithm | No duplicate economy or instant guaranteed sale |
| 9D | Separate throughput, capacity, handled-material, and appearance upgrades | Independent upgrade tests |
| 9E | Market integration gate | Full suite, migration, merge, release candidate |

### Phase 10 — Town Growth, property, and visible Crowe wealth

| Checkpoint | Single responsibility | Verification |
|---|---|---|
| 10A | Expand the registry of Future Industry lots and staged construction states | Lots stay inside complete city blocks with road frontage |
| 10B | Tie new industries to discoveries, supplied materials, contracts, and milestones | Demand/news/price effects remain consistent |
| 10C | Add competing lot ownership for player and Crowe | Transactions use actual funds and cannot double-own a lot |
| 10D | Add configurable passive rent for player-owned lots | Rent cadence and values come from configuration |
| 10E | Build Crowe's estate and gold-storage visuals from his recorded wealth | Visual wealth cannot exceed the economic ledger |
| 10F | Town-growth integration gate | Progression, save, rendering, economy, and full-suite tests |

Unresolved before 10C/10D: purchase priority when both parties can buy, whether Future Industry lots remain developable after player purchase, and the exact in-game rent period.

## Save-migration strategy

- One canonical normalizer owns save migration.
- Save versions increase monotonically.
- Every migration is idempotent: loading the same upgraded profile twice produces the same state.
- Old fields remain as temporary read-only compatibility mirrors only when an existing system still depends on them.
- A migration commit does not also rebalance prices or change visuals.
- Every schema phase includes fixtures from the production baseline and the immediately preceding phase.
- Failed or incomplete records degrade to a safe stopped state with a visible reason; they do not silently delete player assets.

## Checkpoint report format

Each report must include:

- branch and verified commit link;
- exact behavior completed;
- files changed;
- focused checks and results;
- whether full tests were or were not run;
- known limitations or unresolved decisions;
- exact next checkpoint.

No checkpoint report may use “tested,” “merged,” “published,” or “live” unless that exact operation was directly confirmed.

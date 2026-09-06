# Development Checkpoint Schedule

## Purpose

Pinebarrow development must survive interrupted chats and usage limits. GitHub is the source of truth. Work is not considered saved until its commit is visible on GitHub and the branch head has been fetched back and verified.

## Repository state at this update

- Current `main`: `2c65ba7431b18d5514321cdd2d14cddb08f9128f`
- Current release marker: v22 smoke-test merge (PR #13); v24 is the active integrated draft
- Reference-only Workforce branch: `phase-5-workforce` / closed superseded PR #4
- Stale visual branch: `town-road-building-fix` / draft PR #2; do not merge unchanged
- Active v24 branch: `phase-5-project-construction` / draft PR #14

PR #4 and the stale visual branch are recovery evidence, not merge bases. The active branch is based on current `main`.

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

- Default to one coherent vertical slice per development turn; it may touch the engine, UI, tests, and documentation when those pieces are inseparable.
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

### Phase 5P — Shared Project/Construction Foundation

| Checkpoint | Single responsibility | Verification |
|---|---|---|
| 5P.1 | Persist BuildingDefinitions, ConstructionProjects, BuilderBids, ProcurementContracts, property, resident, and workforce records under save schema v14 | 40 focused regressions pass; bounded/idempotent loaders verified |
| 5P.2 | Route Town Hall residential proposals and resource sites through approval, design snapshot, builder bids, and supply/logistics/hauling contracts | Residential, mine, and warehouse project tests pass |
| 5P.3 | Connect awarded procurement to inventory, cash settlement, delivery, labor, deadlines, ownership, and completion | Settlement and completed-building tests pass |
| 5P.4 | Apply the same spine to purchased town shops, rent/sale/buy-back, workforce staffing, and Crowe-owned buildings | Property, workforce, production-stop, and Crowe tests pass |

The v23 foundation is superseded by the v24 integrated slice. The remaining merge gate is production build, lint, and browser smoke verification on the exact branch head.

### Phase 5B / 5C — Folded into v24

Physical worker-house records, resident candidates, hiring, one-worker-per-house capacity, mine/warehouse assignment, no-worker stoppage, property management, and reassignment safety were folded into the shared v24 implementation so the game does not carry a second workforce or construction path.

Remaining follow-up work belongs to later economy phases: richer placement validation, demolition/orphan handling, provider competition, warehouse routing, and balance tuning.

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


## Full-content-first scope authority

The complete game scope is locked in `docs/FULL_GAME_CONTENT_CONTRACT.md`. The contract is the design authority for houses and house upgrades, population and workforce, School, scholar/researcher progression, research facilities, mine and warehouse architecture, shops and market, Crowe, town growth, and the endgame.

Implementation phases are checkpoints, not separate product designs. A checkpoint may be incomplete while it is being implemented, but it must not introduce a temporary architecture that contradicts the contract or create a second bypass path. Numeric balance remains configuration; the required systems and dependencies do not.

The full-content sequence is:

- **C0:** commit and reference the full content contract.
- **C1:** canonical record families, save migration, and compatibility fixtures.
- **C2:** physical lots, residential placement, and completed houses.
- **C3:** households, population, housing quality, and upgrade projects.
- **C4:** workforce, careers, wages, and operating requirements.
- **C5:** School, students, education, and scholar qualification.
- **C6–C7:** research registry, researcher roles, and project-backed research facilities.
- **C8–C10:** mine tracks, warehouse/hauling flow, shops, market, and industry.
- **C11–C12:** Crowe/waste, town growth, bridges, narrative, and endgame.
- **C13:** full integration, exact-SHA merge/deployment, and live smoke verification.

If a usage limit interrupts work, resume from the last verified GitHub SHA and the next recorded checkpoint. Do not reconstruct unfinished code from chat. The next runtime checkpoint after the v24 merge gate is **C2 — Physical lots and residential playability**.


C2 placement work is governed by `docs/PLACEMENT_AND_FOOTPRINT_SPEC.md`. The first runtime slice is **C2.1**, shared transient grid selection and validation. Do not modify mine, warehouse, road, or house placement independently before C2.1 exists.

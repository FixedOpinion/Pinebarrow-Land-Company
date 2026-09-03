# Pinebarrow Land Company — Chat Handoff

**Original date:** 2026-09-02  
**Reconciled:** 2026-09-03  
**Purpose:** Pass the current design decisions and implementation priorities to the main development chat without losing the decisions made while that chat was unavailable.

## 1. Current project direction

Pinebarrow Land Company remains a **mining company, logistics, and town-development game**. The defining promise remains:

> I did not just make my mining company bigger. My company helped turn this place into a city.

Do not redesign or replace working systems unnecessarily. Extend the current game and preserve saves, claims, prospecting, mines, warehouses, trucks, market/economy, contracts, newspaper/news effects, Coming Soon progression, controls, audio, Developer Mode, and regression hooks.

## 2. Immediate repository/workflow concern

The existing Workforce Phase 5A work was developed from an older `main` state. Current `main` subsequently integrated Phase 3 management directly into the live engine. Before adding physical Worker Houses, reconcile the Workforce foundation with current `main` so newer Company Operations behavior is not overwritten.

Recommended immediate checkpoint:

### Phase 5R — Workforce reconciliation

- Start from current `main`.
- Port/reconcile the existing Workforce 5A foundation into the current integrated architecture.
- Preserve save schema/migration behavior, worker-house data, worker assignments, `NO WORKER`, and legacy worker migration.
- Preserve the newer Company Operations integration.
- Do **not** add Phase 5B physical placement in the same checkpoint.
- Commit the reconciliation before extended work/testing.

The older Workforce PR/branch should remain recovery/reference evidence until reconciliation is safely verified.

## 3. Workforce decisions — LOCKED

- Worker House is buildable inside the player's area.
- Worker House footprint is **2×2 (4 tiles)**.
- **One Worker House provides exactly one worker.**
- A Mine requires **1 worker**.
- A Warehouse requires **1 worker**.
- The future Player Market requires **1 worker**.
- A building may physically exist while unstaffed, but productive operation must stop safely.
- Workers must be assignable/reassignable without corrupting or losing data.
- `NO WORKER` is an explicit production bottleneck/status.
- Old saves/global worker data must migrate safely.
- Physical Worker House placement belongs to Phase 5B, not the reconciliation checkpoint.

### Phase 5B — Physical Worker Houses

- Place an actual 2×2 Worker House on owned player land.
- Obey placement/overlap/road/blocked-tile rules.
- Save its coordinates.
- Give it a visible map representation.
- One physical house creates exactly one worker of capacity.

### Phase 5C — Workforce completion

- Staffed Mine operates.
- Unstaffed Mine reports `NO WORKER` and stops safely.
- Integrate warehouse worker state without prematurely implementing automated warehouse logistics.
- Safe assignment/reassignment/unassignment.
- Surface workforce state through Company Operations.
- Add migration/regression coverage and verify before merging the phase.

## 4. Mine architecture — LOCKED FUTURE DIRECTION

The current generic concept of one automatic `Mine Level` should eventually be separated into meaningful systems:

| Mine system | Responsibility |
|---|---|
| Excavation | Production capability/depth and which seams can be reached/discovered |
| Active Seam | Which discovered/unlocked material the mine currently produces |
| Shaker Efficiency | Percentage of dirt removed before mine stockpile/storage |
| Stockpile Capacity | Amount the mine can hold locally |
| Loading Logistics | Mine-to-warehouse transfer/loading speed |

Important rule: **Excavation unlocking deeper seams never automatically changes the mine's production material.** A Stone mine may remain on Stone permanently even after deeper materials are discovered.

Mine Management should eventually include an **Active Seam selector** containing materials discovered at that mine/location. Changing seams may require several in-game hours of setup; the exact duration is not yet locked.

### Shaker Efficiency

| Level | Dirt removed |
|---:|---:|
| 0 | 0% |
| 1 | 15% |
| 2 | 30% |
| 3 | 42% |
| 4 | 55% |
| 5 | 67% |
| 6 | 77% |
| 7 | 85% |
| 8 | 92% |

The useful ore extracted does not magically decrease because the Shaker is inefficient. Lower Shaker efficiency instead sends more dirt/tailings into the stockpile. That dirt consumes mine capacity, truck capacity, and later warehouse/logistics capacity. Shaker Efficiency is therefore a real operational bottleneck.

## 5. Dirt Processor — APPROVED DESIGN DIRECTION

Add a future industrial facility that processes dirt/tailings recovered from mining.

Flow:

`Mine -> Shaker -> Useful Material + Dirt/Tailings -> Dirt Processor -> Recovery Results`

Design intent:

- Separate facility rather than a normal mine upgrade.
- Costly to build and especially costly to upgrade.
- Consumes accumulated dirt/tailings.
- Usually returns ordinary ores/materials and can feel financially disappointing.
- Rarely produces a major recovery, including late/endgame material with a very large payoff.
- Upgrade costs are a major progression barrier: large upfront spending may appear to produce meaningless gains until a rare major recovery occurs.
- Higher Processor efficiency improves recovery potential/access rather than guaranteeing profit.
- Shaker Efficiency and Dirt Processor Efficiency **positively correlate**.
- Do not create a design where deliberately using a bad Shaker gives better gambling/recovery odds.
- High Shaker + high Processor should represent the strongest recovery potential/table.
- Exact probability formula, odds, batches, operating costs, and balance are **not yet locked** and should be tuned only after the surrounding economy can be simulated.
- Possible batch sizes such as 25/50/100 tons were discussed but are not locked.
- Avoid literal casino presentation; the mechanic should feel like expensive industrial tailings recovery with rare discoveries.

Desired player feeling: investing heavily in an apparently disappointing dirt-processing operation for small ordinary recoveries, followed occasionally by a genuinely consequential rare find.

## 6. Warehouse Logistics — NEXT MAJOR INDUSTRIAL SYSTEM

After Workforce and the mine architecture are established:

- Staffed warehouses automatically collect output from assigned mines.
- Logistics/collection throughput is independent from warehouse storage capacity.
- Both can be upgraded separately.
- Warehouse appearance should evolve with upgrades.
- Warehouse requires a worker.
- Warehouse reserves protect a chosen minimum quantity from automatic downstream movement.
- Example: inventory 175, reserve 100 -> only 75 is available for eligible downstream movement.
- Mine-side Loading Logistics remains a distinct bottleneck from warehouse-side collection throughput.
- Whether contracts are allowed to consume protected reserve stock remains unresolved.

## 7. Player Market — LOCKED DIRECTION

Future Player Market:

- Buildable inside player area.
- Footprint **2×6**.
- Requires **1 worker**.
- Automatically pulls eligible materials from warehouse inventory at a fixed throughput.
- Throughput can be upgraded independently.
- Respects warehouse reserve settings.
- Uses the existing town/main marketplace prices and selling economy rather than replacing them.
- Capacity and logistics/throughput should remain separate upgrade concepts.
- Appearance can evolve with upgrades.

Intended production chain:

`Mine -> Warehouse -> Contracts / Player Market`

## 8. Town structure and growth — LOCKED

Do **not** shrink Pinebarrow's overall town area. The issue was building proportions, street layout, and empty-space use, not total town footprint.

Town direction:

- Large town footprint remains.
- Four-lane Main Street.
- Two-lane side streets.
- Believable intersections and city blocks.
- Buildings sit within blocks instead of looking like objects scattered on a game grid.
- Main Street should visually read as the major road.
- Town Hall is important but should not be absurdly oversized.
- Small businesses remain appropriately small; industrial buildings can be larger.
- Avoid nonsensical dead-end roads at map boundaries.

### Coming Soon / industry growth

Coming Soon is important to the game's identity and must remain.

Desired visible progression:

`Empty Lot -> Coming Soon -> Fenced Construction -> Foundation -> Partial Building -> Completed Industry`

Industries should appear because of progression and economic development. Resource discoveries, contracts, supplied construction materials, and milestones can influence town growth.

The strategic loop is:

`Company Growth -> Town Growth -> New Demand -> Company Growth`

## 9. Recommended revised phase order

The previously documented blueprint had Workforce -> Warehouse Logistics -> Player Market -> Town Growth. Based on the decisions in this chat, use this more detailed planning sequence:

1. **Phase 5R — Workforce reconciliation**
2. **Phase 5B — Physical Worker Houses**
3. **Phase 5C — Staffing integration, UI, migration/regression testing**
4. **Phase 6 — Mine Architecture & Efficiency**
   - 6A data model
   - 6B Excavation + Active Seam
   - 6C Shaker + dirt/capacity behavior
5. **Phase 7 — Warehouse Logistics**
6. **Phase 8 — Dirt Processing / Tailings Recovery**
7. **Phase 9 — Player Market**
8. **Phase 10 — Town Growth, Property, and Visible Crowe Wealth**

Reason for putting Mine Architecture before automated warehouse logistics: establish the intended mine output/storage/loading model first so logistics is not built around a generic Mine Level that will immediately need replacement.

Reason for putting Dirt Processing after warehouse logistics: dirt/tailings becomes more meaningful once storage and routing are real systems.

## 10. Development workflow — IMPORTANT

The user has experienced long implementation turns exhausting ChatGPT usage before useful work is safely preserved. Development should therefore use small recoverable checkpoints:

`narrow implementation chunk -> GitHub commit -> verify -> next chunk`

Rules:

- Review current code before changing it.
- Preserve working systems.
- Avoid broad rewrites.
- Use focused branches/commits.
- Commit a useful checkpoint before extended testing/reasoning whenever possible.
- Verify rather than claim tests passed without evidence.
- Do not mix multiple planned phases into one uncontrolled change.

The recommended next implementation action is **Phase 5R only**: reconcile Workforce with current `main`, commit it safely, verify it, and then stop before Phase 5B.

## 11. Java learning discussion (not a runtime game requirement)

This chat also began using Pinebarrow systems to teach the user Java from zero. This does **not** mean Pinebarrow is being rewritten in Java.

Concepts covered so far:

- `int` variables
- `boolean`
- classes/objects at a basic conceptual level
- methods (`void produce()`, `buildHouse()`, etc.)
- method calls
- `if` conditions
- `&&` meaning logical AND
- distinction between `=` assignment and `==` equality comparison
- `<`, `<=`, `>=`
- parameters such as `void buyBuilding(int woodCost, int cashCost)`
- tracing changing program state mentally

A simple teaching example modeled Worker Houses as resource-consuming construction that increases house/worker capacity. This was educational pseudogame code only and must not be mistaken for the actual Pinebarrow implementation.

## 12. Open design questions

Do not silently decide these during implementation:

- Exact Active Seam change/setup time.
- Exact Dirt Processor probability/recovery formula.
- Dirt Processor batch sizes.
- Dirt Processor operating costs and exact upgrade costs.
- Exact rare/endgame recovery tables.
- Whether company contracts may consume warehouse reserve stock.
- Final interaction between mine-side Loading Logistics and warehouse-side Collection Throughput.

## 13. Repository reconciliation — 2026-09-03

The repository was rechecked before this update.

- Current `main` is `6e62e45e64ca3fe3f91a9f05ef3d0377def29772`; this handoff is the only change after the integrated Phase 3 management build `f36a8aa5611998066bf19bf02ba735d3dad08044`.
- Draft PR #4 / `phase-5-workforce` remains valuable reference evidence, but it was built from an older engine/page state and must not be merged wholesale.
- `phase-4b-mine-foundation` contains a checkpoint-planning document created before this handoff was discovered. Its mine design is retained, renumbered into Phase 6, and deferred until Workforce is reconciled.
- The next code branch must be created from the then-current `main` and named `phase-5r-workforce-reconciliation`.
- The detailed, usage-efficient implementation schedule is maintained in [DEVELOPMENT_CADENCE.md](DEVELOPMENT_CADENCE.md).

This resolves the apparent conflict between “mine separation next” and “Workforce reconciliation next”: Workforce reconciliation remains next; the mine-separation design follows as Phase 6.

## 14. Implementation strategy by phase

### Canonical integration strategy

The current integrated project, not an older feature branch, controls architecture:

- `public/pinebarrow-engine.js` remains the canonical runtime/save/simulation engine until a separately approved refactor.
- `app/page.tsx` owns persistent page and modal markup.
- `app/globals.css` owns presentation and responsive layout.
- Company Operations must continue reading the active running profile directly.
- Port specific Workforce behavior from PR #4; do not replace current engine, page, CSS, or management integration with the older branch copies.
- Avoid long-term runtime monkey-patching. Integrate stable behavior through named engine functions and existing state-normalization/render/update paths.
- Balance values belong in configuration tables, not scattered event handlers.
- New systems communicate through stable IDs and explicit assignments; they do not mutate unrelated systems indirectly.

### Phase 5R — Workforce reconciliation

1. Record a file/function conflict map between current `main` and PR #4.
2. Port only workforce schema normalization and legacy worker migration.
3. Add worker assignment APIs with validated building IDs.
4. Gate mine production with the explicit `NO WORKER` state.
5. Integrate the workforce panel into current Company Operations.
6. Run the complete compatibility gate and stop before physical Worker House placement.

Save strategy: Workforce uses the next monotonic save version. Migration must be idempotent and preserve every existing mine, warehouse, worker count, contract, and profile.

### Phase 5B — Physical Worker Houses

1. Add the 2×2 building record and placement validator.
2. Reuse existing owned-land, blocked-cell, wall, road, tree, ore, and building-overlap rules.
3. Add the build interaction and top-down map rendering.
4. Derive worker capacity from completed houses: one completed house equals exactly one worker.
5. Persist stable house IDs and coordinates.
6. Verify touch, mouse, keyboard, controller, save, and reload behavior.

Cost and appearance tiers must be configuration-driven. Placement work must not also add warehouse automation.

### Phase 5C — Workforce completion

1. Complete assignment, reassignment, and unassignment controls.
2. Prevent orphan assignments when a building/house becomes invalid.
3. Apply staffing requirements to warehouses while leaving automated collection for Phase 7.
4. Surface capacity, assigned, available, and blocked worker counts in Company Operations.
5. Complete full migration/regression/build/lint checks before merging Workforce.

### Phase 6 — Mine Architecture and Efficiency

Implement in this dependency order:

1. **Data model:** separate Excavation, Active Seam, Shaker Efficiency, Stockpile Capacity, and Loading Logistics.
2. **Migration:** translate the generic legacy mine level without losing the current material, output, or upgrade value.
3. **Excavation:** control raw production capability and the list of seams reachable within the mine's depth band.
4. **Active Seam:** retain the current material until the player explicitly selects another unlocked seam.
5. **Shaker:** apply the locked dirt-removal table while leaving useful ore output unchanged.
6. **Stockpile:** give local capacity its own upgrade/cost path.
7. **Management:** show each track, next effect, price, and bottleneck separately.

Track per-mine totals for dirt generated, removed, hauled, processed, and discarded. Those totals become the factual input to later Crowe and efficiency systems.

Do not implement Active Seam switching until setup duration and mixed-stock/active-contract behavior are resolved. Excavation must never silently relabel existing stock or contracts.

### Phase 7 — Warehouse Logistics

Use a deterministic timed transfer service rather than a per-frame loop:

1. Assign mines to warehouses by stable IDs.
2. Compute a bounded transfer from mine output using mine Loading Logistics, warehouse Collection Throughput, vehicle capacity where applicable, and warehouse free capacity.
3. Commit the transfer atomically so material cannot be duplicated or lost.
4. Separate warehouse Capacity and Logistics upgrades.
5. Add per-material reserves using `available = max(0, inventory - reserve)`.
6. Expose `NO WORKER`, `MINE STORAGE FULL`, `WAREHOUSE FULL`, `WAREHOUSE LOGISTICS BACKLOG`, and `RESERVE PROTECTED`.

Contracts consuming reserves remains unresolved and must not be silently decided.

### Phase 8 — Dirt Processing and Crowe foundation

Begin with a balance specification/simulation, not runtime odds:

1. Lock batch sizes, operating costs, recovery tables, and expected value.
2. Add the Dirt Processor as a separate costly industrial facility.
3. Run processing as explicit saved jobs so closing/reloading cannot reroll results.
4. Use seeded/configurable recovery tables for deterministic tests.
5. Connect real tailings/disposal activity to Crowe's acquisition fund and news progression.

A weak Shaker creates more tailings and operational cost. It must never improve the player's recovery odds. Strong Shaker plus strong Processor remains the best recovery combination.

### Phase 9 — Player Market

1. Add the 2×6 owned-land building and one-worker requirement.
2. Pull only reserve-eligible warehouse material.
3. Use a configured throughput and local capacity.
4. Route sales through the existing town price/demand/offer algorithm.
5. Keep throughput, capacity, handled-material count, and appearance as independent upgrades.

The Player Market automates distribution; it does not create a second guaranteed-price economy.

### Phase 10 — Town Growth, property, and visible Crowe wealth

Approved direction:

- Add substantially more Future Industry lots inside complete road-fronted city blocks.
- Crowe gradually purchases eligible lots using a recorded acquisition fund.
- The player can also purchase eligible lots and earn configurable passive rent.
- One town block can become Crowe's house/estate.
- Gold storage beside the estate grows visually from his actual recorded wealth.
- Industries continue to progress through Empty Lot, Coming Soon, Construction, and Completed states.
- New industries continue affecting contracts, demand, prices, and newspaper stories.

Implementation order:

1. Create one canonical lot registry with stable lot IDs, block/frontage data, state, owner, purchase price, rent rule, and industry eligibility.
2. Make town development and ownership state coexist instead of overwriting one another.
3. Add player and Crowe purchase transactions through one validated ownership service.
4. Derive passive rent and Crowe wealth from real ledger events.
5. Render Crowe's estate/gold growth from wealth thresholds stored in configuration.
6. Connect acquisitions and openings to the newspaper and market-demand systems.

Unresolved before property implementation:

- purchase priority when both player and Crowe qualify;
- whether a player-owned Future Industry lot can still develop an industry;
- exact rent cadence and values;
- the exact legal/economic route by which Crowe profits from player tailings;
- whether Crowe can buy a lot the player has actively reserved but not purchased.

## 15. Verification strategy

Each micro-phase must prove the layer it changes:

| Layer | Required evidence |
|---|---|
| Save/data | Legacy fixture, current fixture, idempotent reload |
| Simulation | Deterministic state-transition assertions |
| Economy | Conservation checks: no material/cash duplication or silent loss |
| UI | Active-profile data, reachable controls, explicit blocked reason |
| Input | Touch/mouse plus existing keyboard/controller paths |
| Integration | Full regression suite, lint, production build |
| Release | Exact merged `main` SHA deployed and live smoke-tested |

Focused checks run at every micro-commit. The expensive full suite runs at the phase integration gate. If the required runner is unavailable, commit only clearly identified recovery/reference work and report the missing verification; never label it tested.

## Handoff instruction

The next development chat should treat this file as a design/planning handoff, then verify the live repository state before making code changes. Where this handoff conflicts with newer committed implementation or a later explicit user decision, preserve the conflict and ask/resolve it rather than silently overwriting either side.

# Pinebarrow Land Company — Chat Handoff

**Date:** 2026-09-02  
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
8. **Phase 10 — Town Growth Expansion**

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

## Handoff instruction

The next development chat should treat this file as a design/planning handoff, then verify the live repository state before making code changes. Where this handoff conflicts with newer committed implementation or a later explicit user decision, preserve the conflict and ask/resolve it rather than silently overwriting either side.

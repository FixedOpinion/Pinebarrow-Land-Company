# Pinebarrow Land Company — Ju Implementation Handoff

**Date:** 2026-09-03  
**Status:** CURRENT HANDOFF — later explicit decisions here supersede conflicting assumptions in `CHAT_HANDOFF_2026-09-02.md`.

## Purpose

This document gives Ju the current approved design state before the next implementation work. Review current `main` before changing runtime code. Do not silently invent unresolved rules.

> **CRITICAL USAGE / RECOVERY RULE FOR JU:** Never implement the entire roadmap in one run. Implement only the explicitly assigned checkpoint. Make a recoverable GitHub commit as soon as that checkpoint is coherent, verify only what is needed for that checkpoint, report the commit SHA, and **STOP**. Do not begin the next checkpoint until the user explicitly authorizes it.

> **GARDEN RULE:** Ju must never consume the whole garden in one work session. One explicitly authorized slice only: inspect narrowly -> change narrowly -> commit early -> focused verify -> report SHA -> STOP. A roadmap item is context, not permission.

## 1. Core development philosophy — APPROVED

Pinebarrow is both a game and a systems testbed for the larger Roblox project.

- **Simulate deeply. Render simply.**
- Deep economy, workforce, logistics, market, town, reputation, and progression systems matter more than physically animating every actor.
- Persistent workers may exist primarily as data entities rather than walking sprites.
- Prefer state-based building/farm/neighborhood visuals.
- Prefer multi-rate simulation ticks over unnecessary per-frame simulation.
- Randomness may influence outcomes, but player decisions, skills, infrastructure, and economic conditions should dominate.
- Build reusable systems once and drive variants through data/configuration.

## 2. Workforce, population, housing — IMPORTANT REVISION

The previous assumption that `1 Worker House = exactly 1 worker` is **SUPERSEDED** and must not be treated as the final workforce model.

Current approved direction:

- Workers begin as **town residents/population**.
- Jobs/buildings create vacancies.
- A candidate/hiring interface lets the player hire residents into company jobs.
- Workers earn wages and can gain skill/experience and career qualifications.
- Housing provides residential capacity and living quality; it is **not a magic worker generator**.
- Better/more expensive houses can support larger households/families and better living conditions.
- Exact household capacities and housing costs remain configuration/balance decisions and are not locked.
- Residents participate in the town economy and may buy/rent housing.
- Happiness/living conditions should be capable of modifying worker productivity later.
- School develops people/qualifications.
- Research develops technology/company knowledge.
- Farming supports population food demand.
- Crowe competes through economic/development pressure rather than combat.

Conceptual chains:

`Housing -> Households -> Residents -> Labor Pool`

`Resident -> Candidate -> Hire -> Assignment -> Activity -> Skill/XP -> Career/Qualification -> Wages -> Housing/Consumption -> Town Economy`

Future productivity model direction:

`Base Productivity × Skill Modifier × Happiness Modifier × Workplace Modifier = Actual Productivity`

Possible future happiness inputs include housing quality, overcrowding, wages, food, employment stability, schools, services, commute/access, amenities, and town conditions. **Do not implement all of these now.** The architectural requirement is only that happiness/productivity can be extended later without replacing the worker model.

**Implementation warning:** do not continue the old physical Worker House Phase 5B assumption until workforce reconciliation is redesigned around this newer population model.

Exact population, household, wage, housing, happiness, hiring, and qualification formulas remain **UNRESOLVED**.

## 3. Marketplace — MAJOR HUB DIRECTION

The Marketplace is expected to become one of the game's major hubs and may eventually expose commodities, employment, contracts, property/development, newspaper information, and related economic systems.

### Visual master

The approved Marketplace master uses the generated dark wood/gold Pinebarrow interior with Company stats, Commodity Prices, Market Summary, Employment Board, Active Contracts, Town Bulletin/Pinebarrow Daily, Property & Development, and Contracts & Orders.

Do **not** redesign this into a generic feed/card-stack UI.

Approved implementation technique:

1. Preserve the generated artwork as the visual master.
2. Preserve its typography, borders, sprites, spacing, and proportions as closely as practical.
3. Place transparent/invisible interactive hotspots over visible controls.
4. Open functional HTML/application UI layers from those hotspots.

The Stone commodity hotspot prototype proved this technique and was explicitly approved.

## 4. Commodity Market detail screen — APPROVED

The Stone Commodity Market screen is the master for commodity detail screens.

Preserve Stone sprite/header, Current Price, 7-day **line graph**, Supply, Demand, Market condition, Buy Orders, market-accessible inventory, Your Orders, and footer actions `Create Sell Offer` / `Create Buy Order`.

The action buttons belong in a deliberate footer below the information columns and must not float over chart/order content.

The user strongly prefers line graphs. Eventually use stored simulation price history rather than decorative fake values. Initial view is 7 game-days; future 7D/30D/90D views and event markers are possible but not required initially.

Architecture direction:

`CommodityConfig -> MarketService -> OrderBook -> CommodityMarketUI`

One reusable commodity detail component should be data-driven for Stone, Iron, Coal, Logs, Copper, etc.

## 5. Sell/Buy order menu — APPROVED

Sell and Buy use the same reusable order-menu shell parameterized by side.

### Sell Offer

Show commodity/sprite, market-accessible inventory, quantity, asking price per ton, current market price, best buyer, market condition, recent trend, likely-fill indicator, estimated gross proceeds, `Match Best Buyer`, and `Post Sell Offer`.

Approved prototype:

`prototypes/marketplace/pinebarrow_sell_offer_preview.html`

Prototype commit:

`5af2056104756797a6d69b8785fe0af4bbf49536`

### Buy Order

Mirror Sell: cash available, quantity, maximum price per ton, current price, best seller, likely fill, estimated/reserved cost, `Match Best Seller`, and `Post Buy Order`.

Build Sell first and reuse the architecture for Buy.

## 6. Post Sell Offer behavior — APPROVED DIRECTION

Posting a sell offer has a real inventory consequence.

- Show a confirmation/receipt state such as `SELL OFFER POSTED`.
- Show commodity, quantity, price, estimated value, market price, and status `OPEN`.
- Offer `View My Orders` and `Done`.
- Material committed to an open sell order becomes **reserved**.
- If filled, reserved material leaves inventory and cash is credited.
- If cancelled before fill, reserved material returns to available inventory.
- Never duplicate or silently destroy material/cash.

Example: 82 t total, 40 t posted -> 42 t available + 40 t reserved = 82 t owned.

## 7. Market inventory / warehouse linkage — APPROVED CORE RULE

The Marketplace must **not magically access all material the player owns**. Truck capacity and logistics continue to matter.

### Early game — Town Market Storage

`Mine -> Truck -> Town Market Warehouse/Storage -> Marketplace`

A storage facility near the Marketplace may be purchased or leased. Material physically hauled there becomes market-accessible.

### Later game — Linked player warehouse

`Mine -> Player Warehouse with Market Link -> Marketplace`

A leveled/upgraded player warehouse can unlock **Market Link**. Eligible inventory there becomes market-accessible without first hauling it to town storage.

Market Link exact unlock level/cost is **UNRESOLVED**.

Sell UI should show **AVAILABLE TO MARKET**, with source breakdown when useful, rather than treating total company inventory as sellable.

Warehouse reserves still protect stock from downstream movement. Market-accessible quantity must respect reserves.

**Unresolved:** whether truck-held material can be sold directly while physically at the Marketplace or must first be deposited into Town Market Storage.

## 8. Mining prospects — CHECKPOINT A COMPLETE + ARCHITECTURE

Checkpoint A was implemented on current `main` by commit:

`3fa021c5ff223f8f9fddeb4ece943ff5a25ac6e1` — `fix: preserve two independent mining prospects`

Current behavior now preserves up to two independent active mining prospects. Creating Prospect 2 does not erase Prospect 1. The daily allowance and the open-slot limit both remain two, so unresolved prospects occupy the available slots across day changes until one is acted upon.

Each prospect should continue to have its own stable ID and preserve its own location, survey/prospect result, cost/state as applicable, and approval/purchase status.

Conceptually:

`Mining Prospects -> Prospect 1 + Prospect 2 -> Town Hall Review -> Approve/Purchase -> Mine Development`

### Important current-code finding — survey vs mine footprint

The existing runtime still conflates the geological survey and the proposed mine footprint:

- the player selects/surveys one tile;
- the code immediately creates a 2×2 survey parcel;
- the selected tile anchors that 2×2 footprint rather than remaining purely a one-tile geological observation;
- the resulting mine copies `material`, `ratio`, and depth from the survey parcel into the entire mine record;
- the other cells covered by the 2×2 footprint are not independently contributing geology to the mine model.

**Future approved direction:** separate `SurveyResult` from `DevelopmentProposal`/mine footprint. A 1×1 geological survey describes the ground sampled. A later mine-site proposal chooses the actual building footprint and may use one or more survey results. Do not retrofit this separation during Checkpoint B.

### Important current-code finding — warehouse placement

The current runtime automatically searches adjacent 2×2 positions for a warehouse parcel associated with a mine, starting with locations around that mine. This is useful prototype scaffolding but does not match the long-term planning model.

**Future approved direction:** a warehouse should become its own planned/approved development with a player-selected valid site/access and explicit Mine -> Warehouse assignment. A warehouse may eventually serve multiple mines. Do not change warehouse placement as part of Checkpoint B.

## 9. Town Hall development proposals — APPROVED DIRECTION

Pinebarrow should develop residential and industrial areas through road/block/lot planning rather than arbitrary instant building placement.

Town roads define believable streets/blocks/frontage. Developable areas can become individual proposals reviewed through Town Hall.

Town Hall may eventually present sections such as:

- **Mining:** Prospect 1, Prospect 2
- **Residential Development:** House Proposal 1, House Proposal 2, House Proposal 3, House Proposal 4
- **Industrial Development:** individual Industry Proposals

Do not hard-code the architecture around exactly four residential proposals forever. Four is an acceptable current configured limit; the proposal collection should remain data/config-driven.

Each development proposal should eventually be capable of preserving a stable proposal ID, lot/block coordinates, proposed use/type, footprint, cost, status, owner, and development stage.

General lifecycle direction:

`Undeveloped/Unsurveyed Area -> Proposal -> Town Hall Approval/Purchase -> Construction -> Developed`

This should connect to the already-approved visible town progression:

`Empty Lot -> Coming Soon -> Fenced Construction -> Foundation -> Partial Building -> Completed Development`

Mining, residential, and industrial proposals may share a reusable proposal-record/service pattern while retaining type-specific rules.

### Separation of responsibilities — APPROVED

Town Hall approval is **permission**, not construction capability.

- Town Hall approves land/use/development rights.
- Building definitions describe what structures exist and their requirements.
- Builder level/qualifications determine who is capable of building a chosen design.
- Construction contracts determine who agrees to execute the work.
- Procurement contracts determine who supplies the required materials.
- Construction state tracks delivery/progress/completion.

Do not put all of these rules inside Town Hall code.

## 10. Residential development — APPROVED DIRECTION

Residential development is not simply placement of worker generators.

- Better houses cost more.
- Better housing can support larger families/households.
- Better housing can improve living quality/happiness.
- Population creates the labor pool from which workers are hired.
- Happiness/living quality can influence productivity.
- Exact costs, household sizes, happiness values, and productivity modifiers are not locked and must not be invented during infrastructure work.

Long-term economic loop:

`Residential Development -> Families/Population -> Labor Supply -> Jobs/Wages -> Household Spending -> Town Businesses/Marketplace -> Business Growth -> More Jobs -> Housing Demand`

Related loops include `Population -> Food Demand -> Farming`, `Population -> Education Demand -> Schools`, and `Industry -> Material Demand -> Commodity Market`.

## 11. Construction, builders, bidding, procurement — APPROVED ARCHITECTURE

Buildings should cost **real resources plus labor/time**, not only cash. Construction should become an economic system that creates demand for other systems.

### Building selection occurs before builder selection

Approved sequence:

`Town Hall approves lot/use -> player selects building design/level -> ConstructionProject snapshots requirements -> eligible builders bid -> construction contract awarded -> procurement contracts created/fulfilled -> construction progresses -> completed building`

A player may select a building that the player's own builder is not qualified to construct. That is valid. Crowe or another qualified builder may win the construction contract while the player still participates economically by supplying materials.

### BuildingDefinitions — source of truth

Building requirements belong in a central configuration/data definition, not duplicated inside Town Hall, individual builders, or UI code.

Conceptual data:

```js
BuildingDefinitions = {
  warehouse: {
    levels: {
      1: {
        requiredBuilderLevel: 1,
        footprint: [2, 2],
        resources: { lumber: 20, stone: 15 },
        labor: 2,
        buildTime: 2
      }
    }
  }
};
```

Exact numbers above are examples only and **not balance-locked** unless separately approved.

### ConstructionProject snapshots requirements

Once a building design/level is selected and the project is created, copy/snapshot that project's resource/labor/time requirements into the project record. Do not make active projects continuously read mutable global balance values; later balance changes must not silently alter an already-awarded construction job.

Conceptual responsibilities:

- `BuildingDefinitions` = template/rules.
- `BuilderProfiles` = builder level, skill, reputation, workload, qualifications.
- `DevelopmentProposals` = lot/use/Town Hall permission.
- `ConstructionProjects` = chosen building plus locked requirement snapshot and progress.
- `ConstructionBids` = builder, price, duration/terms.
- `ProcurementContracts` = material, quantity, deadline, price/reward, delivery progress.

### Construction contract and procurement contracts are distinct

Do not collapse these into one record type merely because both are called contracts.

- **Construction Contract:** “Build Warehouse #77.”
- **Procurement Contract:** “Supply 35 t Stone by Day X.”

They may share common contract infrastructure such as ID, bidder/party, deadline, status, reputation impact, and settlement rules while retaining type-specific fields/behavior.

### Material bidding — APPROVED

Even if Crowe wins the construction contract, the player can bid on material/procurement contracts created for that project. Losing the construction contract must not remove the player's ability to profit as a supplier/logistics operator.

Possible economic roles in one development project:

- property developer/owner;
- builder/construction contractor;
- material supplier;
- transporter/logistics provider;
- warehouse/storage provider.

This is intentional: a rival's successful development may create profitable demand for the player.

### Procurement default / emergency delivery — APPROVED DIRECTION

A procurement contract becomes a real obligation once awarded. If the awarded supplier fails to deliver the required amount by the deadline:

1. construction should not remain frozen forever;
2. the game may automatically source the missing material through emergency procurement;
3. emergency procurement occurs at a premium;
4. the responsible supplier/player bears the defined extra cost/penalty;
5. supplier/company reputation/reliability takes a hit.

Exact premium formula, reputation loss, partial-delivery settlement, and whether a performance bond is mandatory are **UNRESOLVED**. Do not invent them during foundational implementation.

Performance bonds/deposits are an approved future possibility but not yet a locked formula.

### Feedback loops — intentional design goal

`Town Development -> Construction Projects -> Material Demand -> Procurement Contracts -> Commodity Demand/Prices -> Mining/Logging/Industry -> Jobs/Wages -> Population/Housing -> More Development`

Also:

`More Construction -> Builder Demand -> Builder Revenue/Experience -> Higher Builder Capability -> More Advanced Buildings -> More Development`

These loops are desired, not accidental side effects.

## 12. Current runtime review — WHAT WORKS VS WHAT MUST EVOLVE

The current `public/pinebarrow-engine.js` already contains useful foundations that should be preserved where practical:

### Works / reusable foundations

- A centralized `CONFIG` object already holds many tunable costs, capacities, limits, upgrade curves, timing values, and market limits. This supports the future principle of data-driven definitions.
- Persistent game-state save/load already preserves mines, warehouses, exchange orders, company contracts, town businesses, and now multiple survey parcels.
- Stable IDs are already used for many records and are the right direction for proposals/projects/contracts.
- `companyContracts` already exist as persistent records with buyer/material/quantity/delivered/mine/status concepts.
- A Contract Management UI/ledger already reads active/completed company contracts and mine/warehouse status.
- Town business “founding” orders already create a primitive feedback loop where completing a material order starts town-business construction/development.
- Mine/warehouse management already exposes bottlenecks, stock/capacity and operational status.
- Commodity prices and day-based business/news demand already exist and can later respond to real construction demand rather than only scripted events.

### Prototype scaffolding that must eventually evolve

- `workers` is currently one global integer. The same worker count multiplier affects mine production broadly rather than individual worker/person/job assignments. This conflicts with the approved population/career architecture and must be reconciled later, not patched piecemeal now.
- Mine and warehouse construction currently spend fixed cash (`mineBuildCost`, `warehouseBuildCost`) rather than consuming resource requirements through ConstructionProjects.
- Mine construction is currently immediate once cash/site/clearing conditions pass; it does not use builders, bids, procurement, delivery, or staged construction.
- Warehouse construction is likewise an immediate cash purchase once its automatically generated parcel is owned and cleared.
- Existing `companyContracts` are primarily repeating mine-to-buyer material delivery contracts tied directly to a mine. Preserve them as a working contract pattern, but do not assume their exact schema is sufficient for future construction/procurement bidding.
- Existing town-business founding orders are useful proof of concept, but they are not yet the general ConstructionProject/ProcurementContract architecture.
- Prospect records currently represent 2×2 survey parcels even though the desired future geology model is 1×1 survey information separated from development footprint.

**Migration rule:** preserve working behavior until an explicitly authorized checkpoint replaces it. Do not perform a giant rewrite merely because a future architecture is now documented.

## 13. Reusable-system philosophy — ARCHITECTURAL DIRECTION

Prefer common systems with type/config data rather than one-off implementations:

- Proposal system -> mining / residential / industrial proposal types
- Commodity system -> Stone / Iron / Coal / Logs / Copper / etc.
- Order system -> Buy / Sell
- Population/person system -> residents who can become different jobs/careers
- Building definition system -> warehouse / mine / house / school / factory / market / etc.
- Construction project system -> shared project lifecycle with type/config-driven building requirements
- Contract infrastructure -> shared IDs/status/deadlines/parties while keeping construction and procurement contracts type-specific

Do not over-generalize prematurely if doing so expands a checkpoint. Preserve the ability to generalize while keeping each implementation slice small.

## 14. Existing warehouse/logistics principles still apply

- Warehouse storage capacity and logistics/throughput remain separate upgrade concepts.
- Warehouse reserves protect a configured minimum from downstream movement.
- Mine-side Loading Logistics remains distinct from warehouse-side Collection Throughput.
- Material transfers and market reservations must be atomic/conservative: no duplication or silent loss.
- Market Link extends warehouse progression; it does not bypass logistics rules.
- Future procurement delivery must use real material movement/access rules; a contract must not magically consume inaccessible company inventory.

## 15. Prototype/source-of-truth organization

Use GitHub `main` as the source of truth for approved design artifacts.

- `prototypes/marketplace/` — approved interactive/visual prototypes
- `app/` — actual Pinebarrow application/runtime code
- `docs/` — specifications, handoffs, planning

Approved Sell prototype:

`prototypes/marketplace/pinebarrow_sell_offer_preview.html`

Standalone experimental route:

`app/marketplace-prototype/page.tsx`

Route commit:

`ceda647ef67b0edbc2c93cc38ecb4cef1ffb654d`

The hosted `fixedopinion.chatgpt.site` deployment was not verified to have deployed that route. Do not assume a GitHub commit automatically publishes the hosted site.

## 16. STRICT IMPLEMENTATION CHECKPOINTS FOR JU

The roadmap is context, **not permission to implement everything**.

When the user assigns a checkpoint, Ju must:

1. inspect current `main` and only the directly relevant code;
2. implement **only** the assigned checkpoint;
3. avoid unrelated refactors/features and do not opportunistically begin a future system;
4. create a recoverable GitHub commit as soon as the checkpoint is coherent;
5. run focused tests for the changed behavior plus only the minimum safety/build verification practical;
6. do **not** spend the remaining work window exploring or implementing the next checkpoint after the current one passes;
7. report exactly what changed, what was verified, and the commit SHA;
8. **STOP** — await explicit authorization.

If the work proves larger than expected, reduce scope and commit the smallest coherent safe slice rather than continuing until usage is exhausted.

### Town/prospect checkpoint sequence

**Checkpoint A — Prospect persistence bug ONLY — COMPLETE**

Completed on `main` at:

`3fa021c5ff223f8f9fddeb4ece943ff5a25ac6e1`

Do not redo or broaden Checkpoint A unless a regression is found.

**Checkpoint B — Town Hall prospect display ONLY — NEXT ELIGIBLE CHECKPOINT**

- Town Hall reads/displays Prospect 1 and Prospect 2 independently.
- Existing approval/purchase behavior addresses the selected prospect by stable ID.
- Preserve existing 2×2 survey/mine behavior for this checkpoint even though the future survey/site split is documented.
- Do not redesign mine footprints.
- Do not redesign warehouse placement.
- Do not add residential proposals.
- Do not add construction bidding.
- Commit, focused verify, report SHA, STOP.

**Checkpoint C — Generic proposal data foundation ONLY**

- Introduce the smallest reusable proposal structure capable of later representing mining/residential/industrial proposals.
- Preserve existing gameplay while adding only the data foundation.
- Do not build houses, population, construction bidding, or industries.
- Commit, report SHA, STOP.

**Checkpoint D — Residential proposal UI ONLY**

- Town Hall can display multiple independent residential proposals using configured limits.
- No population/happiness simulation yet.
- No construction bidding yet.
- Commit, report SHA, STOP.

Do not proceed from B to C, C to D, or any later checkpoint without a new explicit user instruction.

### Future survey/site-planning checkpoint sequence — NOT YET AUTHORIZED

These are intentionally separate from B-D so Ju cannot swallow multiple architectural changes in one run.

- **S1:** Introduce a pure 1×1 geological `SurveyResult` representation without changing mine construction behavior.
- **S2:** Introduce a separate mine-site proposal/footprint record that can reference survey result(s); no new geology averaging yet.
- **S3:** Add player choice of valid mine footprint/site from approved/surveyed information.
- **S4:** Define how multiple footprint cells/surveys contribute geology/output; only after formula is explicitly approved.
- **S5:** Replace automatic warehouse parcel generation with a separate warehouse-site planning/proposal step.
- **S6:** Add explicit Mine -> Warehouse assignment and only then consider multi-mine warehouse service.

Do not implement any S checkpoint without explicit authorization.

### Future construction/bidding checkpoint sequence — NOT YET AUTHORIZED

- **CB1:** Add data-only `BuildingDefinitions` foundation with no runtime construction behavior change.
- **CB2:** Add data-only BuilderProfile/capability foundation; do not replace workforce yet.
- **CB3:** Add data-only ConstructionProject records that snapshot a chosen building definition; no bidding/consumption yet.
- **CB4:** Add construction bid records/eligibility evaluation only.
- **CB5:** Add awarding one construction contract only; no procurement automation yet.
- **CB6:** Add procurement-contract records generated from one awarded construction project; no default penalties yet.
- **CB7:** Add real material reservation/delivery accounting with conservation tests.
- **CB8:** Add procurement deadline/default state only.
- **CB9:** Add emergency procurement settlement only after premium/cost/reputation formulas are explicitly approved.
- **CB10:** Integrate staged visual construction/progress only after the economic state machine is stable.

Every CB checkpoint requires its own explicit authorization, recoverable commit, focused verification, SHA report, and STOP.

### Marketplace checkpoint sequence

- **M1:** Reusable commodity/order data structures and read-only Stone detail UI.
- **M2:** Sell Offer UI using the approved prototype layout.
- **M3:** Sell order creation + reserved inventory + cancellation using only already-defined accessible inventory sources.
- **M4:** Order fill/cash settlement + conservation tests.
- **M5:** Reuse Sell architecture for Buy Order.
- **M6:** Town Market Storage / Market Link integration only after remaining access rules and upgrade balance are resolved.

Do not bundle Marketplace checkpoints together unless the user explicitly changes this rule.

## 17. Important unresolved decisions — DO NOT INVENT

- Exact population/household/housing/wage formulas.
- Exact house tiers, costs, family capacities, happiness values, and productivity multipliers.
- Exact worker candidate generation and hiring rules.
- Exact career/qualification progression rates.
- Exact residential/industrial proposal generation rules and costs.
- Whether four residential proposals remains the long-term limit; architecture must keep this configurable.
- Exact building resource/labor/time requirements and building-level balance.
- Exact builder levels/skills/qualification thresholds and progression.
- Construction bid generation, scoring/selection rules, builder workload effects, reliability modifiers, and bid pricing formulas.
- Procurement bid generation/selection rules.
- Procurement deadlines and partial-fill settlement behavior.
- Emergency procurement premium formula and who pays which portion.
- Exact reputation/reliability penalties and rewards.
- Whether performance bonds/deposits are mandatory, and their formulas.
- How many survey cells/results determine a mine's resource/grade/dirt ratio.
- How a multi-cell mine footprint combines different geology.
- Exact rules for selecting/approving warehouse sites and multi-mine warehouse assignments.
- Market Link warehouse unlock level and cost.
- Town Market Warehouse purchase vs lease terms and capacity/upgrades.
- Whether truck-held material can be sold directly at the Marketplace.
- Market fees/taxes and exact economic sinks.
- Exact order matching priority for equal-price orders.
- Detailed partial-fill behavior beyond conservation/reservation requirements.
- Exact Active Seam change/setup time.
- Dirt Processor probability/recovery formula, costs, batches, and tables.
- Whether company contracts may consume warehouse reserve stock.

## 18. Current implementation priority

Unless the user explicitly assigns another checkpoint, **do not implement anything automatically**.

The next eligible narrow code checkpoint in the existing Town/prospect sequence is:

**Checkpoint B — Town Hall prospect display ONLY.**

Checkpoint A is already complete at `3fa021c5ff223f8f9fddeb4ece943ff5a25ac6e1`.

The survey/site-planning architecture and the construction/bidding architecture are now approved design direction, but their implementation checkpoints are **NOT AUTHORIZED** merely because they appear in this handoff.

## Instruction to Ju

Treat this file as the current implementation handoff. When it conflicts with `docs/CHAT_HANDOFF_2026-09-02.md`, this file controls only where it records a later explicit user decision, especially population/housing, Marketplace/warehouse linkage, independent prospect records, Town Hall development proposals, survey-vs-site separation, construction requirements, builder capability, contract bidding, procurement, and default/reputation direction. Preserve all non-conflicting older requirements.

**Most important execution rule:** one explicitly authorized checkpoint -> commit early -> focused verify -> report SHA -> **STOP**.
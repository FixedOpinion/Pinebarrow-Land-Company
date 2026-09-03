# Pinebarrow Land Company — Ju Implementation Handoff

**Date:** 2026-09-03  
**Status:** CURRENT HANDOFF — later explicit decisions here supersede conflicting assumptions in `CHAT_HANDOFF_2026-09-02.md`.

## Purpose

This document gives Ju the current approved design state before the next implementation work. Review current `main` before changing runtime code. Do not silently invent unresolved rules.

> **CRITICAL USAGE / RECOVERY RULE FOR JU:** Never implement the entire roadmap in one run. Implement only the explicitly assigned checkpoint. Make a recoverable GitHub commit as soon as that checkpoint is coherent, verify only what is needed for that checkpoint, report the commit SHA, and **STOP**. Do not begin the next checkpoint until the user explicitly authorizes it.

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

## 8. Mining prospects — HIGH-PRIORITY BUG + ARCHITECTURE

Current observed bug: using the second prospect eliminates/replaces the first prospect.

**Required behavior:** there are at most two active mining prospects, but they are independent persistent records. Creating/using Prospect 2 must never erase Prospect 1.

Each prospect should have its own stable ID and preserve its own location, survey/prospect result, cost/state as applicable, and approval/purchase status.

Conceptually:

`Mining Prospects -> Prospect 1 + Prospect 2 -> Town Hall Review -> Approve/Purchase -> Mine Development`

The architecture should not rely on one replaceable `currentProspect` value. Use a small collection/list of independent records with a configured maximum of 2.

This is both a current bug fix and a foundation for the reusable proposal system below.

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

## 11. Reusable-system philosophy — ARCHITECTURAL DIRECTION

Prefer common systems with type/config data rather than one-off implementations:

- Proposal system -> mining / residential / industrial proposal types
- Commodity system -> Stone / Iron / Coal / Logs / Copper / etc.
- Order system -> Buy / Sell
- Population/person system -> residents who can become different jobs/careers

Do not over-generalize prematurely if doing so expands a checkpoint. Preserve the ability to generalize while keeping each implementation slice small.

## 12. Existing warehouse/logistics principles still apply

- Warehouse storage capacity and logistics/throughput remain separate upgrade concepts.
- Warehouse reserves protect a configured minimum from downstream movement.
- Mine-side Loading Logistics remains distinct from warehouse-side Collection Throughput.
- Material transfers and market reservations must be atomic/conservative: no duplication or silent loss.
- Market Link extends warehouse progression; it does not bypass logistics rules.

## 13. Prototype/source-of-truth organization

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

## 14. STRICT IMPLEMENTATION CHECKPOINTS FOR JU

The roadmap is context, **not permission to implement everything**.

When the user assigns a checkpoint, Ju must:

1. inspect current `main` and relevant existing code;
2. implement **only** the assigned checkpoint;
3. avoid unrelated refactors/features;
4. create a recoverable GitHub commit as soon as the checkpoint is coherent;
5. run only the focused verification needed, plus required safety/build checks where practical;
6. report exactly what changed, verification performed, and the commit SHA;
7. **STOP** — do not start the next checkpoint.

### Town/prospect checkpoint sequence

**Checkpoint A — Prospect persistence bug ONLY**

- Convert current mining prospect state as needed so Prospect 1 and Prospect 2 coexist independently.
- Maximum active prospects remains 2.
- Preserve/save both records.
- Verify creating Prospect 2 does not erase Prospect 1.
- Do not implement residential/industrial development.
- Commit, report SHA, STOP.

**Checkpoint B — Town Hall prospect display ONLY**

- Town Hall reads/displays Prospect 1 and Prospect 2 independently.
- Existing approval/purchase behavior addresses the selected prospect by stable ID.
- No residential system yet.
- Commit, report SHA, STOP.

**Checkpoint C — Generic proposal data foundation ONLY**

- Introduce the smallest reusable proposal structure capable of later representing mining/residential/industrial proposals.
- Do not build houses, population, or industries.
- Commit, report SHA, STOP.

**Checkpoint D — Residential proposal UI ONLY**

- Town Hall can display multiple independent residential proposals using configured limits.
- No population/happiness simulation yet.
- Commit, report SHA, STOP.

Do not proceed from A to B, B to C, or C to D without a new explicit user instruction.

### Marketplace checkpoint sequence

- **M1:** Reusable commodity/order data structures and read-only Stone detail UI.
- **M2:** Sell Offer UI using the approved prototype layout.
- **M3:** Sell order creation + reserved inventory + cancellation using only already-defined accessible inventory sources.
- **M4:** Order fill/cash settlement + conservation tests.
- **M5:** Reuse Sell architecture for Buy Order.
- **M6:** Town Market Storage / Market Link integration only after remaining access rules and upgrade balance are resolved.

Do not bundle Marketplace checkpoints together unless the user explicitly changes this rule.

## 15. Important unresolved decisions — DO NOT INVENT

- Exact population/household/housing/wage formulas.
- Exact house tiers, costs, family capacities, happiness values, and productivity multipliers.
- Exact worker candidate generation and hiring rules.
- Exact career/qualification progression rates.
- Exact residential/industrial proposal generation rules and costs.
- Whether four residential proposals remains the long-term limit; architecture must keep this configurable.
- Market Link warehouse unlock level and cost.
- Town Market Warehouse purchase vs lease terms and capacity/upgrades.
- Whether truck-held material can be sold directly at the Marketplace.
- Market fees/taxes and exact economic sinks.
- Exact order matching priority for equal-price orders.
- Detailed partial-fill behavior beyond conservation/reservation requirements.
- Exact Active Seam change/setup time.
- Dirt Processor probability/recovery formula, costs, batches, and tables.
- Whether company contracts may consume warehouse reserve stock.

## 16. Current implementation priority

Unless the user explicitly assigns another checkpoint, the highest-priority narrow code correction identified in this design session is:

**Checkpoint A — Prospect persistence bug ONLY.**

Do not infer from this document that all population, Marketplace, residential, industrial, or proposal systems should now be implemented.

## Instruction to Ju

Treat this file as the current implementation handoff. When it conflicts with `docs/CHAT_HANDOFF_2026-09-02.md`, this file controls only where it records a later explicit user decision, especially population/housing, Marketplace/warehouse linkage, independent prospect records, and Town Hall development proposals. Preserve all non-conflicting older requirements.

**Most important execution rule:** one authorized checkpoint -> commit -> verify -> report SHA -> **STOP**.
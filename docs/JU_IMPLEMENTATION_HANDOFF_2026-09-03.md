# Pinebarrow Land Company — Ju Implementation Handoff

**Date:** 2026-09-03  
**Status:** CURRENT HANDOFF — later explicit decisions here supersede conflicting assumptions in `CHAT_HANDOFF_2026-09-02.md`.

## Purpose

This document gives Ju the current approved design state before the next implementation work. Work in small recoverable checkpoints. Review current `main` before changing runtime code. Do not silently invent unresolved rules.

## 1. Core development philosophy — APPROVED

Pinebarrow is both a game and a systems testbed for the larger Roblox project.

- **Simulate deeply. Render simply.**
- Deep economy, workforce, logistics, market, town, reputation, and progression systems matter more than physically animating every actor.
- Persistent workers may exist primarily as data entities rather than walking sprites.
- Prefer state-based building/farm/neighborhood visuals.
- Prefer multi-rate simulation ticks over unnecessary per-frame simulation.
- Randomness may influence outcomes, but player decisions, skills, infrastructure, and economic conditions should dominate.
- Build reusable systems once and drive variants through data/configuration.

## 2. Workforce/population direction — IMPORTANT REVISION

The previous assumption that `1 Worker House = exactly 1 worker` is **SUPERSEDED** and must not be treated as the final workforce model.

Current approved direction:

- Workers begin as **town residents/population**.
- Jobs/buildings create vacancies.
- A candidate/hiring interface lets the player hire residents into company jobs.
- Workers earn wages and can gain skill/experience and career qualifications.
- Workers participate in the town economy and may buy/rent housing.
- Housing provides residential capacity and participates in the economy; it is **not a magic worker generator**.
- School develops people/qualifications.
- Research develops technology/company knowledge.
- Farming supports population food demand.
- Crowe competes through economic/development pressure rather than combat.

Conceptual chain:

`Resident -> Candidate -> Hire -> Assignment -> Activity -> Skill/XP -> Career/Qualification -> Wages -> Housing/Consumption -> Town Economy`

**Implementation warning:** do not implement the old physical Worker House Phase 5B assumption until workforce reconciliation is redesigned around this newer population model. Existing workforce code may remain useful as historical/reference infrastructure, but the one-house/one-worker rule is no longer locked.

Exact population, wage, housing, hiring, and qualification formulas remain **UNRESOLVED**.

## 3. Marketplace — MAJOR HUB DIRECTION

The Marketplace is expected to become one of the game's major hubs and may eventually expose commodities, employment, contracts, property/development, newspaper information, and related economic systems.

### Visual master

The approved Marketplace master uses the generated dark wood/gold Pinebarrow interior with:

- Company stats bar
- Commodity Prices board
- Market Summary
- Employment Board
- Active Contracts
- Town Bulletin / Pinebarrow Daily
- Property & Development
- Contracts & Orders

Do **not** redesign this into a generic feed/card-stack UI.

Approved implementation technique for the main Marketplace artwork:

1. Preserve the generated artwork as the visual master.
2. Preserve its typography, borders, sprites, spacing, and proportions as closely as practical.
3. Place transparent/invisible interactive hotspots over the visible controls.
4. Open functional HTML/application UI layers from those hotspots.

The Stone commodity hotspot prototype proved this technique and was explicitly approved by the user.

## 4. Commodity Market detail screen — APPROVED STRUCTURE

The Stone Commodity Market screen is the master for commodity detail screens.

Preserve:

- Stone sprite + `STONE` + `Commodity Market` header
- Current Price
- 7-day **line graph**
- Supply
- Demand
- Market condition
- Buy Orders table
- Your Inventory / accessible market inventory
- Your Orders
- footer actions: `Create Sell Offer` and `Create Buy Order`

The action buttons belong in a deliberate footer below the two information columns; they must not float over chart/order content.

The user strongly prefers line graphs. The market graph should eventually use stored simulation price history rather than decorative fake values. Initial view is 7 game-days; future 7D/30D/90D views and event markers are possible but are not required in the first implementation.

Architecture direction:

`CommodityConfig -> MarketService -> OrderBook -> CommodityMarketUI`

One reusable commodity detail component should be driven by commodity data rather than duplicated for Stone, Iron, Coal, Logs, Copper, etc.

## 5. Sell/Buy order menu — APPROVED DESIGN

Sell and Buy should use the same reusable order-menu shell, parameterized by order side.

### Sell Offer

Show:

- commodity/sprite
- market-accessible inventory
- quantity
- asking price per ton
- current market price
- best current buyer
- market condition
- recent trend
- likely-fill indicator (Fast / Normal / Slow or equivalent)
- estimated gross proceeds
- `Match Best Buyer`
- `Post Sell Offer`

Approved prototype is stored at:

`prototypes/marketplace/pinebarrow_sell_offer_preview.html`

Prototype checkpoint commit:

`5af2056104756797a6d69b8785fe0af4bbf49536`

### Buy Order

Mirror the Sell layout. Show cash available, quantity, maximum price per ton, current market price, best seller, likely-fill indicator, estimated/reserved purchase cost, `Match Best Seller`, and `Post Buy Order`.

Build Sell first and reuse the architecture for Buy.

## 6. Post Sell Offer behavior — APPROVED DIRECTION

Posting a sell offer should have a real inventory consequence, not only display a message.

After `Post Sell Offer`:

- Show a clear confirmation/receipt state such as `SELL OFFER POSTED`.
- Show commodity, quantity, price, estimated value, market price, and order status (`OPEN`).
- Offer `View My Orders` and `Done` actions.
- Material committed to an open sell order becomes **reserved**, not available for another sale/use.
- If filled, reserved material leaves inventory and cash is credited.
- If cancelled before fill, reserved material returns to available inventory.
- Never duplicate or silently destroy material/cash.

However, the market may reserve only inventory that is actually accessible to the Marketplace under the logistics rule below.

## 7. Market inventory / warehouse linkage — NEW APPROVED CORE RULE

The Marketplace must **not magically access all material the player owns**. Truck capacity and physical logistics must continue to matter.

Approved progression direction supports **both** of these access paths:

### Early game — Town Market Storage

`Mine -> Truck -> Town Market Warehouse/Storage -> Marketplace`

- A warehouse/storage facility near the Marketplace may be purchased or leased by the player.
- Material physically hauled there becomes market-accessible.
- This gives early players market access before advanced company warehouses have remote market linkage.

### Later game — Linked player warehouse

`Mine -> Player Warehouse with Market Link -> Marketplace`

- A leveled/upgraded player warehouse can unlock **Market Link** capability.
- Inventory in a Market-Linked warehouse becomes eligible for Marketplace sell orders without first being hauled to town market storage.
- Market Link is a warehouse progression capability; exact unlock level/cost is **UNRESOLVED**.

### Sell-menu inventory language

Do not simply show total company inventory as sellable inventory.

Prefer a breakdown such as:

`AVAILABLE TO MARKET — 12 t`

with sources such as:

- Town Market Storage: 8 t
- Market-linked Warehouse #2: 4 t
- Other Storage: 70 t — **not market linked**

This prevents posting sell orders against inaccessible stock and ties Marketplace behavior directly into logistics and warehouse progression.

**Open design question:** whether material currently carried by the player's truck may be sold directly while physically at the Marketplace, or must first be deposited into Town Market Storage. Do not decide silently.

## 8. Existing warehouse/logistics principles still apply

- Warehouse storage capacity and logistics/throughput remain separate upgrade concepts.
- Warehouse reserves protect a configured minimum from downstream movement.
- Market-accessible quantity must respect reserved stock.
- Mine-side Loading Logistics remains distinct from warehouse-side Collection Throughput.
- Material transfers and market reservations must be atomic/conservative: no duplication or silent loss.

The new Market Link capability should extend warehouse progression rather than bypass these rules.

## 9. Marketplace prototype storage / source of truth

Use GitHub `main` as the source of truth for approved design artifacts.

Organization:

- `prototypes/marketplace/` — approved interactive/visual prototypes
- `app/` — actual Pinebarrow application/runtime code
- `docs/` — specifications, handoffs, planning

Current approved Sell prototype:

`prototypes/marketplace/pinebarrow_sell_offer_preview.html`

A standalone experimental route was also added at:

`app/marketplace-prototype/page.tsx`

Commit that introduced the route:

`ceda647ef67b0edbc2c93cc38ecb4cef1ffb654d`

Important: the hosted `fixedopinion.chatgpt.site` deployment was **not verified to have deployed that route**. GitHub contained the route, but the live URL returned Not Found. Do not assume a GitHub commit automatically publishes the OpenAI-hosted site.

## 10. Implementation priorities for Ju

Before coding, inspect current `main` and this handoff. Then use small checkpoints.

Recommended immediate safe work:

1. Preserve existing working game behavior.
2. Do **not** continue implementing one-house/one-worker as a locked model; workforce/population design has changed.
3. Marketplace work may use the approved prototypes as visual/interaction specifications.
4. If implementing Sell Orders, first introduce the minimum reusable order data/reservation behavior without inventing unresolved Market Link costs/levels.
5. Keep market inventory source-aware so inaccessible company stock cannot be sold.
6. Commit each narrow functional checkpoint before moving to the next system.
7. Verify save/load and material/cash conservation for any market-order implementation.

Suggested implementation slices if Ju is working on Marketplace now:

- **M1:** Reusable commodity/order data structures and read-only Stone detail UI.
- **M2:** Sell Offer UI using the approved prototype layout.
- **M3:** Sell order creation + reserved inventory + cancellation, using only already-defined accessible inventory sources.
- **M4:** Order fill/cash settlement + conservation tests.
- **M5:** Reuse Sell architecture for Buy Order.
- **M6:** Town Market Storage / Market Link integration only after remaining access rules and upgrade balance are resolved.

Do not bundle all six slices into one implementation turn.

## 11. Important unresolved decisions — DO NOT INVENT

- Exact population/housing/wage formulas.
- Exact worker candidate generation and hiring rules.
- Exact career/qualification progression rates.
- Market Link warehouse unlock level and cost.
- Town Market Warehouse purchase vs lease terms and capacity/upgrades.
- Whether truck-held material can be sold directly while at the Marketplace.
- Market fees/taxes and exact economic sinks.
- Exact order matching priority if multiple orders share a price.
- Partial-fill behavior details beyond conserving/reserving inventory.
- Exact Active Seam change/setup time.
- Dirt Processor probability/recovery formula, costs, batches, and tables.
- Whether company contracts may consume warehouse reserve stock.

## 12. Workflow rule

Use:

`narrow implementation chunk -> GitHub commit -> verify -> next chunk`

Do not perform broad rewrites. Do not replace current integrated engine/page/CSS with an older feature branch. Verify tests/builds rather than claiming success without evidence.

## Instruction to Ju

Treat this file as the current implementation handoff. When it conflicts with `docs/CHAT_HANDOFF_2026-09-02.md`, this file controls **only where it records a later explicit user decision**, especially the revised population/workforce model and Marketplace/warehouse-link design. Preserve all non-conflicting older requirements. If current committed runtime behavior conflicts with this handoff, identify the conflict before destructive changes.
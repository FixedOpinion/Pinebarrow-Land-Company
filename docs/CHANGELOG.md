# Changelog

## Unreleased

### Source protection

- Established `FixedOpinion/Pinebarrow-Land-Company` as the permanent source repository.
- Preserved the untouched production build on `baseline-live-v17`.
- Recorded the product blueprint, economy rules, town design, and phased implementation plan.

### Phase 1 — focused cleanup

- Prevented ore deposits, dirt, and trees from occupying the reserved company road or a completed custom road.
- Prevented prospecting on reserved and completed road cells.
- Added cleanup for older saves whose road tiles overlapped generated extraction decoration.
- Rebuilt the truck-stat panel as a fully opaque gauge with `IDLE`, `HAULING`, `FULL`, `WAITING`, `BLOCKED`, and `NO DESTINATION` states.
- Removed the low-value road-tile counter and progress strip without changing Town Hall surveys, paid stone quotes, road construction, travel, or price effects.
- Added deterministic regressions for road-safe resources, truck states, and the removed counter.

### Phase 2 — town streets and proportions

- Preserved the full 90-by-42 town footprint for long-term city growth.
- Rebuilt Main Street as a four-lane artery with lane markings, curbs, crosswalks, and five intersections.
- Added five two-lane side streets, sidewalks, and twelve recognizable city blocks.
- Rescaled and relocated civic, retail, service, and future-industry lots to believable proportions without changing their services.
- Made undeveloped industry sites visible as future lots while preserving their contract-driven Coming Soon and opening states.
- Added safe migration for older saves whose truck position falls inside a newly proportioned town building.
- Added deterministic layout regressions for street hierarchy, block count, entrance access, future lots, and save migration.

### Phase 2 hotfix — mobile fullscreen

- Restored the map renderer's claim-label color context, preventing the redraw exception that left only the green base layer after a fullscreen resize.
- Fullscreen now expands the complete document instead of detaching the nested game surface on affected Android browsers.
- Added an explicit fullscreen layout state so the HUD, controls, newspaper, and canvas remain mounted together.
- Re-measures and redraws the map after fullscreen, resize, and orientation transitions instead of trusting a transient zero-size viewport.
- Added a regression covering document-level fullscreen, HUD continuity, and a non-empty canvas viewport.

## Production baseline — Sites version 17

- Marketplace sell offers with player-set prices and partial demand-based fills.
- Persistent company contract hauling.
- Turning, two-tile-wide Town Hall road surveys with paid stone and labor.
- Daily price/news effects and Coming Soon business development.
- Separate music, engine, and effects settings.
- Multi-mine and multi-warehouse saves, controls, and prior progression systems.

This section documents the recovered state; it does not claim that every planned handoff feature is already implemented.

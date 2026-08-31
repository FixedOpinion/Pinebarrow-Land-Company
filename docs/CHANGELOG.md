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

### Confirmed next work

- Correct town building/road proportions while preserving the large future-development footprint.

## Production baseline — Sites version 17

- Marketplace sell offers with player-set prices and partial demand-based fills.
- Persistent company contract hauling.
- Turning, two-tile-wide Town Hall road surveys with paid stone and labor.
- Daily price/news effects and Coming Soon business development.
- Separate music, engine, and effects settings.
- Multi-mine and multi-warehouse saves, controls, and prior progression systems.

This section documents the recovered state; it does not claim that every planned handoff feature is already implemented.

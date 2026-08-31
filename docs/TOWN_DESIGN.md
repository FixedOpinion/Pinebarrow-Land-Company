# Town and World Design

## Keep Pinebarrow large

Do not shrink the overall town footprint. Empty blocks and open lots are future-development space, not wasted space. The correction is believable proportions and organization: streets form blocks, buildings sit on lots, and development gradually fills the existing city area.

## Street hierarchy

### Main Street

Main Street is a four-lane primary artery with clear lane markings and major intersections. Its visual language can include a center divider or center markings, sidewalks, curbs, crosswalks, signs, and streetlights.

### Side streets

Side streets are two lanes and visibly narrower. They branch from Main Street to create recognizable blocks and give buildings frontages, driveways, loading access, parking, and alleys.

Town streets are structural city infrastructure. Player-built industrial roads remain a gameplay system for access, truck speed, hauling, and expansion. The redundant road-tile counter/display can be removed without removing road mechanics.

## City blocks and proportions

- Place civic, commercial, and industrial buildings on defined lots inside street blocks.
- Face entrances toward usable streets and provide enough clear interaction space.
- Give Town Hall visual importance without making it consume an implausible share of town.
- Keep small businesses small; allow industrial structures and loading yards to be larger.
- Scale roads, trucks, buildings, sidewalks, and lots relative to one another rather than uniformly shrinking everything.

## Coming Soon and town growth

Coming Soon locations are a core progression feature. Vacant lots can progress through:

1. open lot or Coming Soon sign
2. fenced construction site
3. foundation or partial building
4. opened business

New industries should respond to company progression, discovered materials, supply quantities, completed contracts, town milestones, and story events. A newly opened industry adds visible activity, recurring contracts, price demand, and newspaper coverage.

## Player industrial buildings

Upgrades should be visible in the world:

- warehouses gain storage wings, loading docks, and better truck facilities
- worker housing becomes more developed while preserving its gameplay footprint
- the player market gains improved loading and sales infrastructure

Visual tiers must not hide which functional upgrade was purchased.

## Terrain and resource placement rules

Surface ore, dirt patches, trees, and other extraction decoration may only appear on valid extraction terrain.

They must never overlap:

- four-lane Main Street
- two-lane town streets or intersections
- sidewalks, curbs, and reserved town lots
- approved or player-built road footprints
- claim access paths and paid gates
- occupied building footprints or required entrances

The current defect where ore appears on road tiles is a Phase 1 blocker. Generation should use one shared `isResourceSpawnableTile`-style rule rather than independent visual and collision checks, and a deterministic regression test must verify that every generated deposit is disjoint from every road/reserved-road tile.

The extraction fields should remain open but richer: larger clustered forests, larger dirt areas, and more/larger ore patches, while preserving navigable routes and the three gated claim sections.

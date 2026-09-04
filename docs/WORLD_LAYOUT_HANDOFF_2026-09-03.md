# Pinebarrow Land Company — Checkpoint D World Layout Handoff

**Date:** 2026-09-03  
**Status:** APPROVED FOR IMPLEMENTATION  
**Checkpoint:** D — Single-Player World Layout Revision  
**Starting point:** `checkpoint-c-proposal-foundation`  
**Working branch:** `checkpoint-d-world-layout`  
**Deployment authorized:** No

## 1. Purpose

Pinebarrow is now being treated as a **single-player-first campaign**. The older six-player territorial layout is no longer the primary world structure.

This checkpoint revises the world geography now, before the System Address archaeology pass, so SA maps the intended current world rather than a layout that is already being retired.

The immediate goal is to establish:

- the player primarily developing from the **north**;
- Crowe primarily developing from the **south**;
- the town positioned between those development fronts;
- unrestricted player traversal across the accessible world;
- removal of obsolete multiplayer barriers and territorial blocks;
- several modest irregular lakes outside town to break up the rectangular map shape;
- a town footprint and street-ready geography capable of supporting later town expansion.

## 2. Core approved world direction

Conceptually:

```text
NORTH
┌─────────────────────────────────────┐
│                                     │
│       PLAYER DEVELOPMENT AREA       │
│                                     │
│   lake       forests       lake     │
│                                     │
├────────────── TOWN ─────────────────┤
│  future expanded street grid        │
│  commercial / civic / residential   │
│  player + Crowe aggregate yards     │
├─────────────────────────────────────┤
│                                     │
│       CROWE DEVELOPMENT AREA        │
│                                     │
│   Crowe expands from the south      │
│                                     │
└─────────────────────────────────────┘
SOUTH
```

This diagram is directional, not an exact tile blueprint.

## 3. Single-player-first rule

The current campaign map should no longer be constrained by the former six-player layout.

Remove or retire the artificial walls, barriers, and territorial block divisions that existed to separate multiple player areas.

The player should be able to traverse the accessible world without those arbitrary multiplayer barriers.

### Important distinction

> **Traversal, development rights, and property ownership are separate systems.**

Removing barriers does **not** mean the player automatically owns all land.

Do not convert free movement into universal ownership, free building permission, or bypass of land/claim systems.

## 4. Player and Crowe geographic orientation

### Player

The player should begin/develop from the **north side** of the world.

Existing player-oriented geography, starting assumptions, or road access should be adjusted only as needed to support the northern development direction.

### Crowe

Crowe's long-term development front is the **south side**.

This checkpoint does not require full Crowe AI development, construction simulation, population, or business logic.

It should, however, reserve or establish the southern geography so later Crowe systems can physically expand northward toward town.

The intended campaign pressure is:

```text
PLAYER expands southward
          ↓
         TOWN
          ↑
CROWE expands northward
```

## 5. Multiplayer status

A possible **four-player mode** remains a future idea.

Do **not** design or implement that mode in this checkpoint.

Do not preserve obsolete six-player geometry merely to make future multiplayer easier.

If multiplayer returns later, it should be treated as a separate map/mode adaptation unless later design says otherwise.

## 6. Lakes / terrain shape

Add several lakes outside town so the world no longer feels like a simple rectangle of usable land.

Requirements:

- lakes must be **outside the town**;
- use irregular, natural-looking shapes rather than perfect rectangles;
- keep them modest in size so they do not consume excessive usable map area;
- they should create interesting land boundaries and route variation;
- they should not make the map dramatically larger;
- do not place lakes where they break critical existing town structures or required roads unless the road layout is intentionally adjusted;
- existing terrain/resource generation should not place normal mineable surface ore, trees, buildings, roads, or player structures inside lake cells unless explicitly intended by an existing water mechanic.

If the current engine has no true water-terrain system, implement the smallest safe lake representation consistent with current map rendering/collision conventions. Do not invent a large water simulation system during this checkpoint.

## 7. Town geography preparation

The town must remain free of lakes.

This checkpoint should prepare enough town geography for the later approved expansion, including more streets and real blocks, but it does **not** need to implement the full town economy yet.

The approved future town requires room for:

- **12+ commercial/business lots**, with a target of roughly 16 lots if practical;
- simple named businesses such as Andy's Hardware, Jude's Clothing, and similar town shops;
- those commercial properties later producing `$X/hour` and being upgradeable;
- Town Hall;
- Market;
- News;
- Rental;
- Garage;
- School for low-level worker training/leveling;
- Research for new/improved attachments and technologies;
- Crowe's house;
- housing for normal townspeople;
- housing for some of Crowe's crew;
- player sand/aggregate depot or lot;
- Crowe sand/dirt/aggregate yard;
- additional two-lane streets around the existing main road;
- recognizable town blocks rather than buildings floating beside one oversized road.

### Scope boundary

This checkpoint is primarily **world-layout and geography work**.

Do not implement the full mechanics for the business properties, worker school, research technology tree, Crowe population, business income, or town housing economy unless an existing mechanic must be minimally adjusted for compatibility with the new layout.

## 8. Roads and town blocks

Preserve the existing major/main road concept, but prepare the town to use a genuine street network.

Desired future pattern:

- main road remains the major artery;
- secondary two-lane streets create blocks;
- civic, commercial, residential, and service/industrial uses have logical spaces;
- aggregate/sand/dirt yards should be toward a rougher service/industrial edge rather than occupying the central commercial core.

This checkpoint may reposition or generate town roads as needed to make the revised geography coherent, but avoid implementing unnecessary road-management UI or unrelated road-economy redesign.

## 9. Systems that must be checked

This layout change is deceptively cross-system. Ju must inspect actual dependencies before editing.

At minimum check:

- world/map dimensions and coordinate assumptions;
- north/south town/player-area constants;
- player spawn/start position;
- town position and town bounds;
- road generation and road collision;
- old multiplayer barriers/walls/gates;
- claim/lease/purchase logic;
- build-placement validity;
- prospecting/survey validity;
- ore/resource placement;
- tree/forest placement;
- mine/warehouse placement assumptions;
- fast travel or location shortcuts;
- camera/world bounds if any;
- save/load fields that encode map/position/claims;
- existing tests that assume old player-area geometry;
- Checkpoints A, B, and C behavior, especially prospect persistence, Town Hall prospect selection, proposal foundations, and road-cell protection.

Do not assume a visual barrier is isolated from ownership or placement code until verified.

## 10. Checkpoint A–C preservation

Checkpoint D starts from the cumulative `checkpoint-c-proposal-foundation` line and must preserve the completed work from A–C:

### Checkpoint A
- two independent mining prospects;
- separate stable IDs/geology/lease state;
- persistence across save/load.

### Checkpoint B
- Town Hall displays both prospects;
- stable-ID selection;
- leasing/approval acts on the selected prospect without deleting the other.

### Checkpoint C
- proposal/save foundations remain intact;
- residential/development proposal scaffolding remains display/foundation behavior unless separately authorized;
- road cells remain protected from inappropriate surface-ore/prospecting placement.

Do not regress these behaviors while changing world geometry.

## 11. Explicit non-goals

Do not implement during Checkpoint D:

- four-player mode;
- six-player replacement logic;
- full Crowe AI/economy;
- Crowe construction simulation;
- 12+ business income mechanics;
- business upgrades;
- School training mechanics;
- Research technology tree;
- population simulation;
- housing economy;
- construction bidding/procurement;
- farming;
- full town redesign beyond what is needed to establish viable geography/streets;
- System Address archaeology;
- broad modular extraction;
- deployment.

## 12. Implementation philosophy

This is a meaningful world revision, but it should still be implemented conservatively.

Preferred sequence:

```text
inspect current geometry + dependencies
  -> identify obsolete multiplayer constraints
  -> preserve ownership/claim semantics
  -> move player development orientation north
  -> establish Crowe southern development reserve
  -> remove obsolete barriers/blocks
  -> add modest irregular lakes outside town
  -> reconcile roads/resources/placement with new terrain
  -> prepare town footprint/street network
  -> focused regressions
  -> full checkpoint verification
  -> recovery commit + push
```

Do not combine this with unrelated cleanup merely because nearby map code is being edited.

## 13. Acceptance criteria

Checkpoint D is successful when:

1. the active campaign world is single-player-first;
2. the player development area/orientation is north of town;
3. Crowe's future development area is south of town;
4. obsolete multiplayer barriers/territorial block divisions no longer prevent world traversal;
5. removing those barriers has **not** granted universal ownership/build rights;
6. several modest irregular lakes exist outside town;
7. lakes do not occupy town cells;
8. lakes do not incorrectly contain normal roads/buildings/resources unless intentionally supported;
9. town geography can accommodate the approved larger street/block layout;
10. Checkpoint A, B, and C behaviors remain intact;
11. save/load and placement logic do not regress because of changed geography;
12. no unrelated future systems were implemented;
13. work is committed and pushed on `checkpoint-d-world-layout`;
14. Ju reports changed files, tests/builds run, branch, and final SHA;
15. no deployment occurs.

## 14. Ju implementation packet

```text
Checkpoint:
D — Single-Player World Layout Revision

Goal / user-visible behavior:
Replace the obsolete six-player territorial world structure with a single-player-first campaign map. Player develops from the north, Crowe from the south, town remains between them, old multiplayer barriers/blocks are removed, player can traverse the accessible world, modest irregular lakes break up the terrain outside town, and town geography is prepared for a larger street/block layout.

Allowed systems or files:
- Current world/map generation and rendering
- Territory/barrier/wall/gate logic
- Player start/spawn/location logic
- Town bounds and road layout
- Terrain/resource/tree placement where necessary
- Claim/ownership/build/prospect validity where necessary to preserve semantics
- Save/load only where geometry compatibility requires it
- Related tests/docs

Dependencies that must be checked:
- Map coordinate constants
- Town bounds
- Road generation
- Claims/leases/purchases
- Prospecting and resource placement
- Build placement
- Save/load
- Fast travel/location assumptions
- A–C regressions

Explicit non-goals:
- No full Crowe system
- No four-player mode
- No business-income system
- No School/Research mechanics
- No population/housing implementation
- No construction/procurement expansion
- No SA archaeology yet
- No modularization project
- No deployment

Acceptance tests:
- Player starts/develops from north
- Crowe south geography reserved/represented
- Obsolete multiplayer barriers removed
- Full traversal does not imply universal ownership
- Lakes outside town only, modest and irregular
- Roads/resources/placement valid around lakes
- A/B/C behavior preserved
- Save/load still works
- Production build/regression suite passes at checkpoint boundary

Starting commit / branch:
Use `checkpoint-c-proposal-foundation` as the gameplay baseline.

Working branch:
`checkpoint-d-world-layout`

Deployment authorized:
No

Stop condition:
Stop after the revised world layout is implemented, verified, committed, and pushed. Report branch/SHA and any unresolved geometry issues for Ru review before merge or SA archaeology.
```

## 15. Future town-development direction preserved by this checkpoint

After the world revision is stable, future town-development work should build on this geography rather than redesigning the map again.

The intended town should feel like a functioning small town rather than a cluster of decorative buildings:

- real blocks;
- more streets;
- commercial properties;
- civic/progression buildings;
- residences;
- Crowe's visible presence;
- separate player/Crowe aggregate yards;
- room for "Coming Soon" and future development.

The world should be spacious enough to breathe, but not enlarged merely for scale. Lakes and the north/town/south competition axis should make the map feel more organic without consuming unnecessary map area or simulation cost.

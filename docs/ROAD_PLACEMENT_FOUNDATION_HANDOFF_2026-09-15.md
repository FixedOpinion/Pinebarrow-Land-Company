# Pinebarrow Land Company — Road Placement Foundation Stabilization Handoff

**Date:** 2026-09-15  
**Status:** APPROVED IMPLEMENTATION HANDOFF — design/foundation direction approved; implementation not performed by this documentation branch  
**Repository:** `FixedOpinion/Pinebarrow-Land-Company`  
**Required starting branch:** `phase-5-project-construction`  
**Required starting commit:** `5a078c4a9d17b2103626d32de28449f5e13094da`  
**Starting commit message:** `fix(c2.4.8): stabilize locked road surveys`  
**Work classification:** FOUNDATION CORRECTION, with bounded road-project integration  
**Deployment authorized by this handoff:** NO  
**Merge authorized by this handoff:** NO

---

## 1. Why this checkpoint exists

The recurring road failures are no longer treated as isolated UI bugs. Road placement is the first consumer of a placement foundation that later buildings, mines, warehouses, lots, infrastructure, movement, access, and economic calculations will depend on.

The current player-reported failures are:

1. Drag-to-select is too sensitive. Small finger deviation can create an unwanted turn and the route can become difficult or impossible to repair.
2. A recurring first-touch defect can instantly create a long horizontal road survey.
3. `Start Tiles` and `Lock Tiles` improved control, but the player still lacks a complete reversible lifecycle after locking/approval.
4. Town Hall approval gives sound/color feedback but does not create a sufficiently visible, durable road-project/contract experience. The selected route appears to disappear.
5. Approved road work must create visible construction, material, and logistics work tied to one road project and one physical construction-site/drop-off point.

The purpose of this checkpoint is to make the road workflow deterministic and reusable without turning the task into a rewrite of the entire game engine.

---

## 2. Architectural classification and boundary

This is a **foundation correction**, not a simple road patch and not a full engine rewrite.

### In scope

- shared road/corridor tile-selection interaction;
- touch/pointer gesture interpretation;
- anchor, preview, segment lock, route lock, undo, unlock, clear, cancel;
- road planning camera/zoom needed for reliable touch selection;
- route validation through the existing placement foundation;
- durable road-project transition at Town Hall;
- one authoritative post-approval project record;
- explicit road material drop-off tile and temporary construction-site marker;
- road construction/material/logistics contract visibility and project linkage;
- cancellation/withdrawal behavior;
- save/load compatibility for all intermediate durable states;
- automated regression tests and browser/mobile smoke verification.

### Explicitly out of scope

- rewriting the entire construction engine;
- rewriting mining, warehouses, markets, workforce, trucks, world generation, or economy;
- changing road width/profile as part of this checkpoint;
- migrating every building-placement flow to the corrected interaction immediately;
- redesigning Crowe AI or implementing Crowe difficulty settings;
- redesigning pricing, land value, pathfinding, or movement economics;
- theme/UI art overhaul unrelated to the road project;
- deleting legacy save compatibility merely because a cleaner representation now exists;
- deployment or merge without separate authorization.

The foundation must be reusable, but roads are the only required runtime consumer in this checkpoint.

---

## 3. Authoritative-source rule

The user has explicitly rejected multiple independent states that can disagree about the same project.

### Required ownership rule

Before Town Hall approval, the route may exist as a road-selection/road-draft record.

At Town Hall approval, a stable `ConstructionProject` becomes the authoritative record for that road job.

After approval:

- route geometry;
- drop-off tile;
- project status;
- requirement snapshot;
- contract IDs;
- delivered totals;
- construction progress;
- cancellation/completion state

must be read from, or trace directly back to, that one project.

Do **not** create parallel booleans or records that can independently claim incompatible truths such as:

- `roadApproved = true`;
- `contractCancelled = true`;
- `constructionActive = true`;
- `routeDeleted = true`.

If the existing `roadApproval`, `roadContract`, or compatibility fields must remain for old saves/UI, they must become compatibility references/mirrors tied to the authoritative `ConstructionProject`, not competing owners of state.

`builtRoads` is not authoritative project state. It is the completed-world result and may be updated only when construction actually completes.

---

## 4. Reconciliation with existing placement specification

Read first:

- `docs/PLACEMENT_AND_FOOTPRINT_SPEC.md`
- `docs/PROJECT_CONSTRUCTION_SPEC.md`
- `public/pinebarrow-placement.js`
- the road-selection, Town Hall road, save/load, project, contract, and rendering paths in `public/pinebarrow-engine.js`
- all existing placement/project/road regression tests.

The existing placement specification remains authoritative for area-selection systems unless this handoff explicitly overrides road behavior.

### ROAD-SPECIFIC OVERRIDES

The existing generic corridor language that allows diagonal finger movement to become a staircase/turning route is **superseded for road editing by this handoff**.

The existing generic short-tap rule that may create the smallest selectable footprint is **superseded for roads by this handoff**.

For roads:

> A first touch establishes an anchor only. A first touch by itself can never create a road segment.

> A turn is explicit. A turn may not be inferred from finger wobble or diagonal drift.

These road-specific decisions are intentional because the current inferred-turn behavior is the recurring usability failure.

Do not change the generic area-selection behavior for houses/mines/warehouses unless a focused test proves a shared low-level fix is required.

---

## 5. Required road-selection model

Road editing must behave as a deterministic orthogonal segment editor, not as freehand painting.

### 5.1 Entering road planning

`Start Road Survey` may navigate/center the player on the planning area, but precision editing must not require selecting tiny tiles on a whole-world overview.

Use a dedicated road-planning camera/zoom or equivalent bounded interaction scale where individual editable tiles are large enough for reliable touch input.

Do not hard-code a specific CSS-pixel tile size unless needed by the existing camera system, but the implementation must prove that a phone-size touch target can distinguish adjacent tiles reliably.

### 5.2 Start Tiles

`Start Tiles` explicitly enables route editing.

Before it is enabled:

- map touches do not change the road route;
- driving/navigation input must not silently become placement input.

### 5.3 First touch invariant

**R-01 — First Touch Safety**

- `pointerdown` records an anchor.
- releasing without exceeding the drag threshold leaves an anchor only or safely cancels the transient gesture according to the chosen UI behavior;
- it must not produce a road segment;
- it must never produce a long horizontal route.

Use a screen/CSS-pixel movement threshold before a gesture becomes a road segment. World-tile displacement alone is insufficient when the map is zoomed.

### 5.4 Axis selection

Once movement exceeds the gesture threshold, choose one cardinal axis for the current segment.

Requirements:

- do not force an axis on `pointerup` if the threshold was never crossed;
- horizontal may not be the unconditional default for a tie;
- once an axis is locked for the current segment, finger wobble cannot switch the segment to the other axis;
- endpoint snapping happens on that locked axis;
- visual preview and eventual committed segment must use the same geometry function.

### 5.5 Explicit turns

A turn requires a second segment.

Expected interaction:

1. establish anchor;
2. drag one straight segment;
3. release -> straight segment remains as preview/segment candidate;
4. confirm/continue that segment;
5. next segment begins from the prior endpoint;
6. only the second segment can create the turn.

A diagonal or wandering finger path during one segment must not manufacture a turn.

### 5.6 Segment/route controls

The road planning UI must provide or preserve clear actions for:

- `Start Tiles` / begin editing;
- commit/continue the current segment;
- `Undo Last Segment`;
- `Clear Route`;
- `Lock Tiles` / lock route;
- `Unlock/Edit Route` before Town Hall approval;
- `Cancel Survey`.

If the existing UI can express some of these through fewer controls without ambiguity, that is acceptable, but all listed capabilities must exist.

### 5.7 Locked route invariant

After route lock:

- incidental map taps do not alter geometry;
- driving does not alter geometry;
- opening/closing unrelated menus does not alter geometry;
- route remains visible;
- only an explicit `Unlock/Edit`, `Clear`, `Cancel`, or Town Hall transition may change its state.

### 5.8 Pointer cleanup

Shared input cleanup must safely handle:

- `pointerup`;
- `pointercancel`;
- `lostpointercapture`;
- window blur;
- menu close;
- mode exit.

A cancelled pointer sequence must not commit an unintended road.

---

## 6. Use the shared placement foundation

The project already contains `public/pinebarrow-placement.js` and a shared placement specification.

Do not solve this checkpoint by adding another independent road-only geometry engine if the existing shared foundation can own the required behavior.

The desired dependency direction is:

`input -> shared placement/segment state -> validator -> locked route -> ConstructionProject`

not:

`raw input -> road-only geometry -> separate road state -> separate approval state -> separate project state`.

A small reusable road-segment editor may be added to the shared placement module if the current generic corridor controller cannot meet the approved road rules. That is acceptable foundation work.

Do not generalize unrelated systems merely to make the abstraction look elegant.

---

## 7. Road width and footprint

Preserve the currently configured company-road profile and the existing footprint-expansion rules.

This checkpoint is about **selection reliability and project ownership**, not changing the road's width or material balance.

The exact committed road footprint must be generated from the locked centerline/segment route by one shared footprint function.

**R-02 — Preview Equals Commit**

For the same locked route and road profile:

`preview footprint == approved project footprint == completed built-road footprint`

except for cells intentionally rejected by validation before approval. Do not silently reshape a locked route during approval.

---

## 8. Town Hall approval lifecycle

Town Hall approval must stop feeling like a destructive button that plays a sound and erases the player's work.

### Required approval transaction

When the user approves a valid locked route at Town Hall, the game must atomically:

1. validate the locked route one final time;
2. allocate a stable `ConstructionProject` ID;
3. copy/freeze the exact route/footprint snapshot into the project;
4. copy/freeze the requirement estimate/snapshot required by the current project system;
5. preserve the explicit material drop-off tile;
6. create/link the road contract records described below;
7. save the project;
8. replace the editable survey overlay with a persistent approved-project overlay/construction-site marker;
9. show durable acknowledgment containing at minimum the new project ID/status and next action.

If any part fails, do not clear the locked route. Approval must fail safely with a visible reason.

The editable route may be cleared only after the authoritative project and its linked records are safely created.

---

## 9. Material drop-off tile and temporary construction site

Every approved road project must store an explicit `dropoffTile`.

Do not infer this later from `project.x`, a truck location, a menu location, or whichever route cell is convenient.

### Minimal approved interaction

Before Town Hall submission, provide a bounded `Set Drop-Off` action while the route is locked.

- The player selects one legal tile belonging to the locked road route.
- The tile is stored with the locked route/project snapshot.
- Town Hall approval is disabled until a legal drop-off tile exists, unless the existing UI provides an equally explicit pre-approval choice.
- The drop-off is a project interaction point, not an extra permanent building footprint.

After approval:

- render a temporary road-construction-site sprite/marker at the drop-off tile;
- clicking/tapping that marker opens the same road project record used by Town Hall/Contracts;
- it must expose project status, material totals, and contract actions;
- the temporary marker disappears or converts appropriately only when the project is completed/cancelled/abandoned according to state.

Three interfaces may exist, but there is one project:

`Town Hall -> ConstructionProject <- Contracts Menu`

`World Drop-Off Site -> same ConstructionProject`

---

## 10. Road contracts

The user requires three visible road-project contract families:

1. **Road Construction Contract**
2. **Materials Contract(s)**
3. **Logistics Contract**

These must reuse the existing project/bid/procurement infrastructure rather than create an unrelated road-contract engine.

### Required linkage

Every road-related contract record must carry the same stable `projectId`.

The Contracts menu and world construction site must show the same records, not copies.

### Posting rule for roads

Upon Town Hall project approval, create/post the three contract families immediately as durable visible records.

- construction may use the existing builder/bid contract mechanism;
- material requirements may produce one or more material/supply obligations using the existing procurement contract type;
- logistics uses the existing logistics/freight/service mechanism as appropriate to the current code.

The player must be able to claim eligible road contracts from the Contracts menu or from the project/drop-off interface.

Existing qualification, inventory, provider, sequencing, and settlement rules may gate whether a claimed contract can advance, but the road project must not become invisible while waiting for a later internal stage.

Do not collapse construction and procurement into one record type; preserve the separation required by `PROJECT_CONSTRUCTION_SPEC.md`.

If the current project system also requires hauling as a separate underlying obligation, preserve it. The user-facing road project may group hauling beneath Logistics while the underlying records remain distinct.

---

## 11. Road project state machine

Use one explicit status progression. Exact enum names may match existing project enums, but the semantic progression must remain recognizable:

`DRAFT -> LOCKED -> APPROVED/PROJECT CREATED -> CONTRACTING -> STAGING -> BUILDING -> COMPLETE`

Reversible outcomes:

- `DRAFT -> CANCELLED/CLEARED`
- `LOCKED -> DRAFT` through explicit unlock/edit
- `LOCKED -> CANCELLED/CLEARED`
- `APPROVED -> WITHDRAWN/CANCELLED`
- `CONTRACTING -> CANCELLED` with awarded obligations resolved/released
- `STAGING -> CANCELLED` with reservations/materials/contracts settled by existing economic rules
- `BUILDING -> ABANDONED/CANCELLED` without deleting history

Use existing canonical `ConstructionProject.status` values where possible instead of proliferating road-only enums.

### Cancellation rule

Cancellation/withdrawal must remain available throughout the process, with consequences appropriate to the current stage.

Never delete the historical project record to simulate cancellation.

Open or still-required timed work may return to the existing contract/provider market after the player releases it. Crowe or another provider may accept only if the existing eligibility/qualification rules permit it.

**Do not implement a new Crowe difficulty/growth system in this checkpoint.** That is a separate approved design direction for later work.

---

## 12. Save/load and migration

This foundation is not complete if it works only until reload.

Preserve old completed roads and legacy road records.

Save/reload must preserve, where applicable:

- locked route geometry;
- route segments/centerline;
- committed road footprint snapshot;
- drop-off tile;
- project ID;
- project status;
- contract IDs/statuses;
- delivered materials;
- construction progress;
- cancellation/withdrawal state.

Loading the same profile twice must produce the same normalized road-project state.

Do not silently convert an incomplete old record into a completed road.

Do not delete legacy paved tiles during migration.

---

## 13. Mandatory regression tests

Do not declare this checkpoint fixed because existing tests remain green. Add tests for the actual interaction path that has been failing.

### `ROAD-REGRESSION-001 — first touch horizontal explosion`

Reproduce the pre-fix failure or create a characterization proving the vulnerable path, then lock in the corrected behavior:

- enter road placement;
- first pointer down/up without meaningful drag;
- expected: anchor/no segment;
- forbidden: horizontal route of any length.

This named regression must remain permanently.

### Interaction tests

1. **Tap once** -> anchor only; zero road segment.
2. **Move below CSS-pixel threshold** -> zero road segment.
3. **Small diagonal jitter** -> no turn and no forced horizontal route.
4. **Straight horizontal drag** -> exactly one horizontal segment.
5. **Horizontal drag with vertical finger wobble** -> remains one horizontal segment.
6. **Straight vertical drag** -> exactly one vertical segment.
7. **Vertical drag with horizontal wobble** -> remains one vertical segment.
8. **Release after segment, accidental unrelated touch** -> committed/locked geometry unchanged.
9. **Explicit second segment from endpoint** -> exactly one deliberate turn.
10. **Undo Last Segment** -> restores prior route exactly.
11. **Unlock route** -> returns to editable state without changing geometry until edited.
12. **Pointer cancel/lost capture/window blur** -> does not commit unintended geometry.

### Project/lifecycle tests

13. **Lock -> save -> reload** -> identical route/drop-off.
14. **Town Hall approval** -> stable ConstructionProject immediately exists.
15. **Approval failure** -> locked route remains intact and visible.
16. **Approval success** -> project overlay/site remains visible; editable draft does not merely vanish.
17. **Contracts** -> construction/material/logistics records share the same `projectId`.
18. **World site vs Contracts menu** -> both open/read the same project and contract IDs.
19. **Withdraw approved project** -> project remains in history, active obligations close/release correctly, no built road appears.
20. **Complete project** -> only then do completed cells become `builtRoads`/equivalent completed road state.
21. **Save/reload during contracting/staging/building** -> no duplicate projects/contracts/materials and no lost geometry.

### Shared placement safety tests

Existing area-placement tests for houses/mines/warehouses must remain green. The road correction must not silently change their drag/rectangle semantics.

---

## 14. Required browser/mobile smoke test

Automated tests are necessary but not sufficient because this failure is touch/gesture-sensitive.

Before reporting success, test the exact running branch in a browser with touch/mobile emulation and, if available, a real touch device.

Minimum manual script:

1. enter Town Hall road survey;
2. start tile selection;
3. tap once several times in different locations — no long road appears;
4. draw horizontal segment with intentional finger wobble;
5. draw vertical segment with intentional finger wobble;
6. make one deliberate 90-degree turn using a second segment;
7. undo the turn;
8. lock the route;
9. tap elsewhere and move/drive — locked route remains;
10. unlock/edit and relock;
11. set a drop-off tile;
12. submit at Town Hall;
13. verify project remains visible and receives a stable ID;
14. open it from Contracts;
15. open it from the world drop-off site;
16. verify same project/contract IDs;
17. withdraw one test project and verify it does not become a built road;
18. complete one test project through the normal contract path and verify the final road appears only on completion.

Capture a short written result for each failed/passed smoke step in the final handoff report.

---

## 15. Implementation checkpoints / stop-loss structure

Do not attempt the entire foundation in one uncommitted Work session.

### RF-1 — Interaction characterization and selector correction

- reproduce/characterize first-touch horizontal defect;
- move/fix road gesture interpretation at the shared placement boundary;
- implement first-touch threshold, axis lock, explicit segments, undo/cancel cleanup;
- add interaction regressions;
- commit and push recovery point.

### RF-2 — Locked route and persistence

- explicit locked/editable route state;
- save/load locked route and drop-off choice;
- ensure incidental input cannot mutate locked geometry;
- commit and push recovery point.

### RF-3 — Authoritative approved project and contracts

- Town Hall approval transaction;
- ConstructionProject ownership;
- drop-off marker;
- construction/material/logistics contract linkage/visibility;
- withdrawal/cancellation;
- project/lifecycle tests;
- commit and push recovery point.

### RF-4 — Integration gate

- full regression suite;
- production build;
- lint;
- mobile/browser smoke script;
- document exact remaining limitations;
- stop for review.

If usage/tool limits become tight, stop after a pushed recovery checkpoint. Do not continue into an uncommitted partial rewrite.

---

## 16. Work-chat operating rules

The implementing Work chat must follow these rules:

1. Start from **exactly** `phase-5-project-construction` at `5a078c4a9d17b2103626d32de28449f5e13094da`, or explicitly report if that branch has advanced and reconcile before editing.
2. Read this handoff and the two specifications named above before implementation.
3. Inspect current callers/readers/writers before changing road state.
4. Prefer the existing shared placement module over new bespoke road geometry.
5. Do not treat green legacy tests as proof that touch behavior is fixed.
6. Do not change road width/balance to solve gesture bugs.
7. Do not rewrite unrelated construction/economy systems.
8. Do not create a new competing project truth.
9. Do not silently delete compatibility fields without migration evidence.
10. Do not make a state-changing button communicate success only through sound/color; show durable state/project information.
11. Do not merge automatically.
12. Do not deploy automatically.
13. Push recovery commits after RF-1, RF-2, and RF-3 if completed.
14. Stop and report rather than inventing architecture when a genuine conflict with the current engine/specification is discovered.

---

## 17. Required verification commands

Use the repository's current scripts rather than inventing replacements:

- focused Node test(s) while iterating;
- `npm test` for the full test/build gate;
- `npm run lint`;
- browser/mobile smoke test from Section 14.

`package.json` currently defines `npm test` as production build plus `node --test tests/*.test.mjs`.

If an existing known lint warning remains unchanged, report it precisely; do not hide a new warning behind an old one.

---

## 18. Definition of done

This checkpoint is done only when all of the following are true:

- the first-touch long-horizontal-road defect is covered by a named regression and no longer reproducible;
- minor finger drift cannot create an unintended turn;
- turns require an explicit second segment;
- selection remains practical on touch/mobile at the actual planning zoom;
- the player can undo, clear, lock, unlock/edit, cancel, and withdraw at the appropriate stages;
- a locked route cannot be changed by unrelated taps/driving/menu actions;
- Town Hall approval creates one stable authoritative road ConstructionProject;
- successful approval does not make the project visually disappear;
- an explicit drop-off tile and temporary construction-site marker exist;
- the road Construction, Materials, and Logistics contract families are visible and linked by project ID;
- the same road project opens from Town Hall/Contracts/world site;
- save/reload preserves every tested intermediate state;
- a cancelled project does not become a completed road;
- a completed road is written to final world state only after actual project completion;
- existing non-road placement regressions remain green;
- full test/build/lint gate passes or every pre-existing exception is documented;
- browser/mobile smoke script passes;
- no unrelated engine rewrite occurred;
- branch/commit/test/smoke results are reported for review before merge/deploy.

---

## 19. Final report required from the Work chat

Return a compact implementation report containing:

- working branch;
- starting SHA;
- final SHA(s);
- files changed;
- which RF checkpoints were completed;
- the diagnosed root cause of the horizontal-first-touch bug;
- how gesture threshold/axis lock/explicit turns are implemented;
- authoritative road-project ownership after approval;
- drop-off/site implementation;
- contract linkage behavior;
- cancellation/withdrawal behavior;
- save migration/compatibility notes;
- focused test counts;
- full `npm test` result;
- lint result;
- browser/mobile smoke results;
- unresolved issues or design conflicts;
- explicit statement that no merge/deployment occurred unless separately authorized.

---

## 20. Guiding doctrine

> Fix the placement foundation deeply enough that the road bug cannot keep returning, but do not use the road bug as permission to rewrite Pinebarrow.

> One project owns one truth. Input creates geometry; approval creates a project; contracts serve that project; completion creates the road.

> A touch establishes intent. It must never invent intent.

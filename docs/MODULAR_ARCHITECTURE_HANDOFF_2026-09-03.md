# Pinebarrow Land Company — Modular Architecture Handoff Addendum

**Date:** 2026-09-03  
**Status:** APPROVED CURRENT DIRECTION  
**Applies with:** `JU_IMPLEMENTATION_HANDOFF_2026-09-03.md` and `CHAT_HANDOFF_2026-09-02.md`  
**Priority:** This addendum supersedes older workflow language where it conflicts, but does not authorize unrelated gameplay features.

## 1. Why this change is being made

The current browser game concentrates many systems inside `public/pinebarrow-engine.js`. This worked well for rapid prototyping and allowed Pinebarrow to become playable quickly, but it now creates a recurring development cost: even a narrow change may require an implementation agent to inspect and reason across a large engine containing unrelated systems.

The approved strategy is to invest development effort now in a modular JavaScript architecture so later work can be narrower, easier to understand, safer to test, and more efficient.

Roblox/Luau analogy: Pinebarrow should move toward the same conceptual separation provided by Scripts and ModuleScripts. JavaScript modules should group coherent systems behind explicit interfaces rather than keeping most game behavior in one monolithic engine file.

## 2. Core modularity rule — APPROVED

Use **high-cohesion, low-coupling system modules**.

Do not create one file per function merely to make files small. A module should own one coherent responsibility/system and expose a deliberate interface.

Conceptual future organization:

```text
pinebarrow/
  engine/
    game-engine.js
    game-state.js
    config.js
  systems/
    prospecting.js
    mining.js
    warehouses.js
    contracts.js
    marketplace.js
    town-development.js
    construction.js          # future; do not create until authorized
  ui/
    town-hall.js
    mine-management.js
    contract-management.js
    marketplace.js
  persistence/
    save-system.js
```

This tree is architectural direction, not permission to create every listed file immediately. Exact paths may be adjusted after the existing engine dependency map is completed.

## 3. Required system-module header contract — APPROVED

Every major extracted/new system module should begin with a concise dependency/ownership header so a future implementation session can identify the relevant code without rediscovering the entire repository.

Recommended format:

```js
/**
 * PINEBARROW SYSTEM: <SYSTEM NAME>
 *
 * RESPONSIBILITY / OWNS:
 * - ...
 *
 * READS:
 * - ...
 *
 * WRITES:
 * - ...
 *
 * CALLED BY / USED BY:
 * - ...
 *
 * CALLS / DEPENDS ON:
 * - ...
 *
 * DOES NOT OWN:
 * - ...
 *
 * RELATED TESTS:
 * - ...
 */
```

`DOES NOT OWN` is important. It establishes the system boundary and discourages unrelated scope expansion.

Headers must describe actual dependencies. Do not invent dependencies merely to make the header appear complete.

## 4. Central system map — APPROVED

Create and maintain `docs/SYSTEM_MAP.md` as Pinebarrow's architectural table of contents.

For each existing system, record at minimum:

- responsibility/ownership;
- current file/location;
- major functions/entry points;
- state read;
- state written;
- systems called/dependencies;
- systems that call/use it;
- related UI;
- related persistence/save behavior;
- related tests;
- known coupling or migration hazards.

The map should tell an implementation session where to begin and what dependency chain is relevant.

Implementation work should prefer:

`SYSTEM_MAP -> target module -> declared dependencies -> related tests`

rather than a repository-wide reread by default. Repository-wide search remains allowed when the map/header is incomplete, contradictory, or the observed behavior requires it.

## 5. Migration rule — NO BIG-BANG REWRITE

Do **not** modularize the entire engine in one implementation task.

Existing working behavior must be preserved while modules are extracted incrementally. Initial extraction of a system should primarily change **where the existing behavior lives**, not redesign that behavior at the same time.

Reason: if relocation and redesign happen together, regressions become harder to diagnose.

Each extraction must leave the game in a recoverable working state.

Conceptual migration:

```text
monolithic engine
  -> map dependencies
  -> establish module infrastructure
  -> extract one coherent system
  -> focused verification + recovery commit
  -> extract next authorized system
  -> integration verification
```

## 6. Revised implementation-resource philosophy

Usage/compute allowance is a scarce resource, **not a target to exhaust**.

Ju = **Just Utility**. Ju should minimize unnecessary repository reads, repeated reasoning, tool calls, and redundant verification. Remaining capacity is never permission to invent or broaden scope.

A Git commit is a **recovery/save point**, not necessarily the end of a work session.

Therefore:

- commit early when a coherent recovery point exists;
- push recoverable branch work before beginning a risky next slice;
- use focused verification after narrow changes;
- do broader regression/integration verification at appropriate architectural boundaries;
- do not repeat expensive repository discovery when `SYSTEM_MAP.md` and module headers already provide trustworthy dependency information;
- if a next slice has been explicitly authorized in advance and capacity remains, Ju may continue after a recovery commit;
- if the next slice has **not** been explicitly authorized, stop regardless of remaining capacity;
- if capacity appears near exhaustion, prioritize preserving work: commit -> push -> report branch/SHA.

The previous safety principle remains: never gamble unrecoverable work on the remaining allowance.

## 7. Git workflow for implementation slices — APPROVED

For an authorized feature/refactor package:

```text
main
  -> create temporary feature/checkpoint branch
  -> implement authorized slice
  -> focused test
  -> recovery commit
  -> push branch
  -> continue only if another slice was explicitly authorized
  -> final branch report + SHA
  -> review
  -> merge to main when accepted
  -> delete temporary branch after successful merge
```

Ju must not automatically merge its own branch into `main` unless explicitly authorized.

## 8. Immediate roadmap revision

### Checkpoint B — STILL NEXT / BEHAVIORAL WORK

Checkpoint B remains the next gameplay checkpoint and is not expanded into a full refactor:

- Town Hall displays Prospect 1 and Prospect 2 independently;
- each prospect remains independently selectable by stable ID;
- approval/lease/purchase acts on the selected prospect;
- preserve current 2x2 survey/mine behavior during B;
- do not redesign geology, mine footprints, warehouse placement, residential development, population, construction bidding, or procurement.

Recommended branch name:

`checkpoint-b-townhall-prospects`

Checkpoint B should end with a pushed recoverable branch and reported SHA for review before merge.

### ARCH-1 — Engine system/dependency map

After B, before major feature expansion, map the existing engine into coherent systems and dependencies. This is primarily analysis/documentation and should avoid runtime behavior changes.

Deliverable: `docs/SYSTEM_MAP.md`.

### ARCH-2 — Module infrastructure

Establish the smallest safe JavaScript module structure/interfaces required for incremental extraction. Preserve runtime behavior.

### ARCH-3 — Prospecting extraction

Extract the existing prospecting system into its coherent module using the approved header contract. Preserve behavior. Do not simultaneously implement the future 1x1 SurveyResult redesign.

### ARCH-4+ — Further system extractions

Candidate systems include Mining, Warehousing, Contracts, Marketplace, Town Development, UI boundaries, and Persistence. **Exact order must be chosen from ARCH-1 dependency evidence rather than assumed now.**

Do not blindly follow a predetermined extraction order if the dependency map shows a safer sequence.

### Integration verification

After a meaningful group of extractions, perform broader integration/regression verification before resuming major feature expansion.

## 9. New-system rule after modularization begins

New major Pinebarrow systems should be designed as modules from the beginning rather than added back into the monolithic engine.

This applies to future systems such as population/housing, construction, builders, procurement, farming, schooling, research, and other future gameplay systems **only when each is separately designed and authorized**.

These systems are future design directions; several do not exist in the current runtime. Do not create empty placeholder systems merely because they are named here.

## 10. Relationship to existing proposal/construction roadmap

The existing approved future architecture for DevelopmentProposals, SurveyResult separation, residential development, ConstructionProjects, builder bidding, ProcurementContracts, and related economic loops remains valid.

However, after Checkpoint B the modularization investment takes priority over automatically proceeding to the old tiny Checkpoint C/D sequence.

Before authorizing new feature expansion, use the system map and extracted module boundaries to decide the next meaningful vertical slice. C and D may later be re-scoped/combined if that produces a coherent playable feature without crossing unresolved design boundaries.

No population, farming, schooling, research, construction bidding, procurement, or other future system is authorized by this addendum.

## 11. Success criteria

The modularization investment succeeds when:

1. a developer/implementation session can identify the target system from `SYSTEM_MAP.md`;
2. the target module declares what it owns, reads, writes, calls, and does not own;
3. unrelated systems usually do not need to be read for a narrow change;
4. system-specific tests can be run without defaulting to the entire regression suite after every tiny edit;
5. working game behavior is preserved through incremental extraction;
6. future systems can be added without expanding a single monolithic engine indefinitely.

## 12. Non-negotiable preservation rule

Modularity is an investment in future development efficiency, **not permission for a broad rewrite**.

When uncertain: map first, extract second, redesign later under its own authorized checkpoint.

## 13. Ju usage-protection protocol — APPROVED

This protocol controls how Ru plans implementation work and how Ju spends the available implementation allowance. It supplements the architectural rules above.

### 13.1 Usage transparency

- Ju cannot directly see the user's exact remaining plan allowance or an exact per-task charge. Ju must not invent percentages, message counts, or claims that a task is “almost out” unless the product exposes that information.
- Usage varies with the selected model, retained context, reasoning, tool calls, retrieved material, caching, and response size. Prompt length alone is not a reliable estimate.
- The current source for the user's remaining allowance and reset time is the ChatGPT usage dashboard. Product-specific estimates change and must not be copied into this repository as fixed limits.
- At the beginning of implementation, Ju should classify the checkpoint as **Small**, **Medium**, or **Too broad** and name the main cost drivers. A “Too broad” task must be split before runtime editing begins.
- At completion, report concrete work performed—files inspected, files changed, tests/builds run, branch, and SHA—instead of pretending to know an exact credit cost.

Official reference: https://learn.chatgpt.com/docs/pricing

### 13.2 Required Ru -> Ju checkpoint packet

Ru should hand Ju a short implementation packet with these fields:

```text
Checkpoint:
Goal / user-visible behavior:
Allowed systems or files:
Dependencies that must be checked:
Explicit non-goals:
Acceptance tests:
Starting commit:
Working branch:
Deployment authorized: yes/no
Stop condition:
```

Do not paste the entire planning conversation when the approved decision already exists in GitHub. Link the exact handoff section and commit instead.

### 13.3 Targeted source-inspection order

Ju should inspect source in this order:

1. Confirm the starting branch/commit and clean working state.
2. Read the assigned handoff section and the target row in `docs/SYSTEM_MAP.md`.
3. Use symbol search to locate entry points, callers, state keys, persistence fields, and related tests.
4. Read narrow code windows around those symbols.
5. Read only the dependency modules declared by the system map/header.
6. Expand to a full file or repository-wide review only when the map is missing, contradictory, or a failing test proves the dependency boundary is incomplete.

If step 6 is necessary, Ju should explain why and correct `SYSTEM_MAP.md` during the appropriate architecture checkpoint so the same discovery cost is not paid again.

### 13.4 Cross-system safety without rereading the whole engine

A full manual reread of `pinebarrow-engine.js` is not the default safety mechanism. Use explicit contracts and automated evidence:

- record the state fields and public functions the target system reads and writes before editing;
- search every renamed or moved symbol to identify callers;
- preserve a compatibility facade while extracting a subsystem so existing callers do not all change at once;
- add characterization tests before moving behavior whose current result is not already protected;
- run save/load migration fixtures whenever persistent state changes;
- test module boundaries where one system calls another;
- run syntax checks and lint against changed code;
- run focused behavior tests during iteration;
- run the complete regression suite and production build once at the checkpoint boundary, rather than after every tiny edit;
- repeat broad checks only when a failure or subsequent change makes the previous result stale.

Tests do not eliminate the need to understand dependencies, and reading code does not eliminate the need for tests. The system map, module headers, searches, and layered tests work together.

### 13.5 Safe modular extraction pattern

Each extraction checkpoint moves one coherent subsystem and preserves behavior:

```text
characterize current behavior
  -> define actual ownership/dependencies
  -> add module with required header
  -> keep a stable engine-facing facade
  -> move one function family
  -> focused tests
  -> full checkpoint verification
  -> commit and push branch
```

Do not combine a subsystem extraction with a gameplay redesign. Do not create empty modules for future systems. Configuration, state ownership, persistence, UI, and simulation responsibilities must remain explicit.

### 13.6 Context and tool-output controls

- Cap search, diff, test, and build output to the portion needed for a decision.
- On success, retain a concise pass/fail summary instead of loading full logs into the conversation.
- On failure, inspect the first actionable error and its dependency chain before requesting more output.
- Do not reread unchanged large files in the same checkpoint.
- Do not load generated assets, lockfiles, or build artifacts unless they are directly relevant.
- Do not invoke browser QA, image generation, deployment, or unrelated connectors unless the checkpoint requires them.
- Prefer one deliberate install/build/test sequence over repeated clean installs and duplicate full-suite runs.

### 13.7 Stop-loss and recovery rules

- If the discovered change crosses the handoff's allowed boundary, stop and return a proposed split instead of continuing.
- If allowance pressure or interruption risk appears, stop opening new scope and preserve the current state immediately.
- A coherent checkpoint receives a normal commit and pushed branch.
- Incomplete but valuable work may receive a clearly labeled `WIP` commit only on a non-main branch, with failed/unrun checks documented. A WIP commit must never be merged as though it passed.
- Report branch, SHA, changed files, checks passed/failed, and the exact remaining work.
- Never leave the only copy of meaningful work in transient scratch storage.

### 13.8 Merge and deployment boundaries

Implementation, merge, and deployment are separate authorizations. Documentation and architecture checkpoints do not run Sites builds or replace the live game unless deployment is explicitly part of the checkpoint.

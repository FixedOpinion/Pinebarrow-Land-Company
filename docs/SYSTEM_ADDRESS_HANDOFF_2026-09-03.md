# Pinebarrow Land Company — System Address (SA) Architecture Handoff

**Date:** 2026-09-03  
**Status:** APPROVED DESIGN / IMPLEMENTATION HANDOFF  
**Scope:** Architecture discovery and documentation only  
**Applies with:** `MODULAR_ARCHITECTURE_HANDOFF_2026-09-03.md`, `JU_IMPLEMENTATION_HANDOFF_2026-09-03.md`, and `CHAT_HANDOFF_2026-09-02.md`

## 1. Purpose

Pinebarrow's current browser engine has grown into a substantial monolithic runtime. Before major feature expansion and before relying on narrow module-level inspection, establish a **System Address (SA)** layer: a durable architectural index that tells future implementation sessions where a system lives, what it owns, what state and interfaces it touches, and what other systems it directly depends on.

SA is intended to reduce repeated rediscovery while improving safety. It is not a substitute for the code, symbol search, tests, or architectural judgment.

> **The code is authoritative. The System Address map is a navigation cache.**

The initial SA pass is intentionally conservative. It must earn precision through later implementation and testing.

## 2. Governing safety principle

> **A false-positive dependency costs additional reading. A false-negative dependency can cause an unsafe edit. During initial System Address mapping, optimize for avoiding false negatives.**

Therefore:

- when evidence suggests a plausible first-hop dependency but certainty is incomplete, preserve it as `POSSIBLE` rather than silently omitting it;
- do not prune a relationship merely to make the map smaller;
- do not, however, flatten every downstream economic consequence into a direct dependency;
- uncertainty must be explicit rather than disguised as certainty.

The initial map is a starting point for safe navigation, not permission to skip code merely because a relationship has not yet been recorded.

## 3. What SA addresses

Permanent System Address codes identify **conceptual system neighborhoods**, not every variable, function, DOM element, or state property.

Candidate system families may include concepts such as:

```text
PRO     Prospecting
GEO     Geology
MIN     Mining
WH      Warehousing
LOG     Logistics
MKT     Marketplace
CON     Construction
DEV     Development
TH      Town Hall
INV     Inventory
WRK     Workforce
SAVE    Persistence
UI      User Interface
```

Sub-addresses may be introduced where they represent durable coherent responsibilities, for example:

```text
PRO.01    Prospect records
PRO.02    Prospect-slot rules
PRO.03    Prospect selection

MIN.01    Mine records
MIN.02    Mine production
MIN.03    Mine stockpile
```

These examples are architectural vocabulary, **not authorization for Ju to assign these exact permanent IDs without review**.

Ju may identify factual neighborhoods and propose candidate addresses during discovery. Permanent IDs and target ownership are curated by Ru/user after the factual survey.

If Ju discovers a responsibility that does not fit an approved address, mark it `UNMAPPED` rather than inventing an increasingly cryptic identifier.

## 4. Current reality versus target ownership

The existing monolith contains historical coupling and prototype-era responsibilities. SA must not fossilize those accidents into the permanent architecture.

Every meaningful entry should distinguish where necessary:

### CURRENT REALITY
What the engine actually does today, supported by code evidence.

### TARGET OWNERSHIP
Where an already approved architecture says the responsibility should eventually live.

If current implementation and approved target architecture disagree, record the conflict. Do not silently rewrite either one.

Useful evidence/status labels:

```text
CONFIRMED    Direct code evidence exists.
INFERRED     Strongly implied by evidence but not directly proven.
POSSIBLE     Conservatively retained relationship requiring validation.
TARGET       Approved future architecture, not current behavior.
CONFLICT     Current implementation contradicts approved architecture.
UNRESOLVED   Ru/user decision is required.
UNMAPPED     Responsibility discovered but not yet assigned an approved address.
```

## 5. Relationship graph — record direct edges

SA should model the engine as a graph of direct relationships. Prefer concrete edge types over a vague `RELATED` list.

Useful direct edge types include:

```text
OWNS
READS
WRITES
CALLS
CALLED-BY
PERSISTENCE
UI-CONSUMER
PRODUCES
CONSUMES
ASSIGNS
RESERVES
RELEASES
```

Use only edge types supported by actual behavior. Do not invent categories merely to make entries look complete.

Each important edge should include evidence when practical, such as:

```text
TH -> PRO
Type: READS
Evidence: renderTownHall() reads state.surveyParcels
Status: CONFIRMED
```

or:

```text
WH -> INV
Type: CALLS
Evidence: transferWarehouseOutput() calls reserveInventory()
Status: CONFIRMED
```

Function names above are illustrative unless verified during the archaeology pass.

### Do not manually flatten indirect relationships

Indirect consequences should normally be represented as paths through direct edges.

For example:

```text
HOUSE
  -> POPULATION
  -> LABOR POOL
  -> WORKERS
  -> MINE PRODUCTION
  -> ORE SUPPLY
  -> MARKET
```

Do not therefore declare `HOUSE -> MARKET` as a direct dependency unless the actual code contains a direct relationship.

Likewise:

```text
CONTRACT
  -> MATERIAL REQUIREMENTS
  -> INVENTORY
  -> MARKET
```

allows SA to reveal that Market is three hops from Contract without pretending Contract directly owns or calls Market.

This prevents the map from degrading into "everything is related to everything."

## 6. Criticality metadata

Some direct edges are disproportionately dangerous to miss. Mark criticality separately from relationship type.

Candidates for elevated criticality include:

- save/load and persistence compatibility;
- inventory/resource conservation;
- ownership transfer;
- reservation/release of resources;
- stable IDs and cross-record references;
- state migration;
- contract fulfillment/accounting.

Example:

```text
MIN -> SAVE
Type: PERSISTENCE
Criticality: CRITICAL
Evidence: <verified save/load fields>
```

`CRITICAL` means a future narrow implementation session must not skip that relationship merely because the visible feature appears unrelated to persistence.

## 7. Navigation policy is separate from graph topology

`REQUIRED READ` and `SAFETY READ` are **inspection policy**, not game-system relationship types.

Conceptual entry:

```text
[SYS:PRO.03]

OWNS:
- active prospect selection

REQUIRED READ:
- PRO.01
- TH.02

SAFETY READ:
- SAVE.01
- MIN.01
- UI.TH.01
```

Navigation interpretation:

```text
REQUIRED READ
    -> always inspect

SAFETY READ
    -> inspect unless reliable evidence shows the task cannot affect it

UNMAPPED / UNKNOWN / STALE
    -> widen search
```

During the initial SA archaeology pass, these categories must remain conservative. They cannot yet be used as hard skip rules.

## 8. Confidence / trust state

Every mapped address should carry a trust state so future sessions know how heavily they may rely on it.

Recommended states:

```text
DRAFT
Mapped during initial archaeology. Assume omissions are possible.

OBSERVED
Validated during a real implementation/change and reconciled with code evidence.

TRUSTED
Validated across multiple relevant changes/tests with no material contradictions.

STALE
Relevant interfaces, state, callers, persistence, or ownership changed; broaden inspection again.
```

The initial archaeology deliverable is expected to be predominantly `DRAFT`.

**Absence from SA is never proof that a dependency does not exist.** This is especially important for `DRAFT`, `PARTIAL`, `UNMAPPED`, and `STALE` areas.

## 9. Reading radius / graph distance

Once SA has earned sufficient trust, graph distance may guide how much code Ju initially reads:

```text
0 hops = target system
1 hop  = direct dependencies/callers
2 hops = verify interfaces, symbols, persistence, tests as relevant
3+ hops = normally do not read unless evidence expands the boundary
```

This is a future efficiency heuristic, **not a hard restriction during initial mapping**. DRAFT or contradictory maps require broader symbol/call/state searches.

## 10. Initial SA archaeology checkpoint

This is a dedicated architecture-discovery checkpoint. It may survey the entire current engine because its purpose is to pay the discovery cost deliberately once and preserve the result.

### Ju's assignment

1. Confirm repository, starting branch/commit, and clean state.
2. Read this handoff and the applicable modular/implementation handoffs.
3. Survey the current `public/pinebarrow-engine.js` and relevant supporting files/tests.
4. Identify factual coherent system neighborhoods in the current runtime.
5. For each neighborhood, locate major entry points, state keys, readers, writers, callers, callees, UI consumers, persistence behavior, and related tests.
6. Record concrete direct graph edges with evidence.
7. Mark uncertain plausible first-hop edges as `POSSIBLE` rather than omitting them.
8. Mark critical persistence/conservation/ownership edges.
9. Preserve indirect effects as graph paths rather than flattening transitive closure into direct dependency lists.
10. Distinguish CURRENT REALITY from approved TARGET OWNERSHIP.
11. Mark responsibilities that do not fit approved architecture as `UNMAPPED` / `UNRESOLVED` rather than inventing permanent architecture.
12. Produce a DRAFT `docs/SYSTEM_MAP.md` suitable for Ru/user architectural review.
13. Preserve recoverable progress with pushed commits. If interrupted before completion, use a clearly labeled WIP commit on the non-main branch and document exactly what remains.

### Explicitly prohibited during this checkpoint

Ju must **not**:

- redesign gameplay;
- change runtime behavior;
- extract or relocate systems into modules;
- rename broad families of functions/state merely for cleanliness;
- implement future SurveyResult/geology/footprint architecture;
- implement construction, procurement, population, farming, schooling, research, or other future gameplay;
- invent permanent System Address IDs without review;
- delete apparently obsolete code merely because it looks redundant;
- optimize the map by guessing that a relationship is irrelevant;
- merge to `main` without explicit authorization;
- deploy the live game.

This checkpoint is archaeology and documentation, not refactoring.

## 11. Required SYSTEM_MAP entry shape

The initial map should be useful to both a human developer and future Ju sessions. Each system/neighborhood should record, where evidence exists:

```text
SYSTEM / CANDIDATE ADDRESS:
NAME:
TRUST STATE: DRAFT
COVERAGE: MAPPED / PARTIAL / UNMAPPED

CURRENT REALITY:
TARGET OWNERSHIP:

OWNS:
ENTRY POINTS:
STATE READ:
STATE WRITTEN:
CALLS:
CALLED BY:
UI CONSUMERS:
PERSISTENCE:
RELATED TESTS:

DIRECT EDGES:
- target
  type:
  criticality:
  status:
  evidence:

REQUIRED READ:
SAFETY READ:

KNOWN COUPLING / HAZARDS:
CONFLICTS:
UNRESOLVED QUESTIONS:
```

Do not fill fields with speculative prose merely to avoid blanks. Use `UNKNOWN`, `UNRESOLVED`, or `NOT YET VERIFIED` where appropriate.

## 12. Symbol search remains mandatory evidence

SA does not replace ordinary code search.

The division of labor is:

```text
SYSTEM ADDRESS
    "What neighborhood?"

SYMBOL / CALL / STATE SEARCH
    "What exact code participates?"

DEPENDENCY GRAPH
    "What other neighborhoods connect directly, and how?"

TESTS
    "Did the observed behavior remain valid?"
```

During archaeology, Ju should use symbol search to discover callers, readers/writers, persistence fields, and tests. During later implementation, symbol search verifies that SA remains accurate.

If code evidence contradicts SA, **update SA**. Never force code reality to match an outdated map merely because the map was previously approved.

## 13. Module-header evolution

The existing modular handoff's header remains valid. After SA review, extracted/new modules should additionally carry the approved permanent `SYSTEM-ID` and enough dependency metadata to connect the source file back to `SYSTEM_MAP.md`.

Conceptual future form:

```js
/**
 * SYSTEM-ID: MIN.02
 * PINEBARROW SYSTEM: Mine Production
 * TRUST: <map-controlled state>
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
 * CALLS / DEPENDS ON:
 * - ...
 *
 * CALLED BY / USED BY:
 * - ...
 *
 * UI CONSUMERS:
 * - ...
 *
 * PERSISTENCE:
 * - ...
 *
 * DOES NOT OWN:
 * - ...
 *
 * RELATED TESTS:
 * - ...
 */
```

Do not spray these markers throughout the monolith during archaeology unless a separate checkpoint authorizes source annotations.

## 14. Relationship to the existing targeted-inspection protocol

The existing usage-protection protocol says future implementation should prefer:

`SYSTEM_MAP -> target module -> declared dependencies -> related tests`

That remains the desired mature workflow, but **the initial SA map is not yet trustworthy enough to justify narrow reading solely from declared dependencies**.

Therefore:

- DRAFT/PARTIAL/UNMAPPED/STALE entries require broader symbol/caller/state-key searches;
- broad inspection is acceptable during the dedicated archaeology checkpoint;
- as entries become OBSERVED and TRUSTED, Ju may increasingly rely on the map to reduce unnecessary reading;
- a failing test, contradictory code evidence, or newly discovered caller immediately expands the reading boundary and may make the affected entry STALE.

The map earns the right to save usage; it does not receive that authority merely by existing.

## 15. Architecture authority

> **Architecture is curated, not generated.**

Ju performs the factual discovery work. Ru and the user decide durable architectural ownership and permanent address structure.

Ju may report:

- current functions/state that cluster together;
- actual callers/callees;
- persistence relationships;
- UI relationships;
- possible coupling;
- migration hazards;
- candidate boundaries.

Ju may not decide that a responsibility permanently belongs to a system merely because prototype code currently happens to place it there.

## 16. Recovery and usage protection

This checkpoint is intentionally larger than a normal feature slice, so recoverability is mandatory.

- Work only on a non-main architecture branch.
- Commit/push coherent mapping milestones rather than holding the entire survey in transient context.
- If interrupted, preserve incomplete valuable work as a clearly labeled WIP commit.
- WIP work is evidence/recovery state, not merge-ready approval.
- Record which engine regions/systems have been surveyed and which remain.
- Avoid repeatedly rereading already documented unchanged regions within the same checkpoint.
- Keep search/test output concise and preserve evidence in the map rather than in ephemeral conversation alone.

## 17. Completion criteria for initial archaeology

The checkpoint is complete when:

1. `docs/SYSTEM_MAP.md` contains a conservative factual map of the current engine's major coherent systems;
2. major direct dependencies have concrete edge types and evidence where practical;
3. persistence and conservation-sensitive relationships are identified as critical where supported;
4. uncertainty is visible rather than silently omitted;
5. current implementation and target architecture are distinguished;
6. indirect consequences are represented through graph paths rather than a giant flat `RELATED` list;
7. coverage gaps are explicitly marked;
8. the map remains DRAFT pending Ru/user review;
9. no runtime behavior was intentionally changed;
10. the architecture branch is pushed and its final SHA reported.

After this review, Ru/user may approve permanent System Address IDs and ownership boundaries. Subsequent implementation checkpoints then validate the map in practice, progressively moving entries from `DRAFT` to `OBSERVED` and eventually `TRUSTED`.

## 18. Handoff packet for Ju

```text
Checkpoint: ARCH-SA-1 — Initial System Address Archaeology

Goal / user-visible behavior:
Create a conservative factual System Address/dependency map of the current Pinebarrow engine. No user-visible gameplay change.

Allowed systems or files:
- Entire current engine may be inspected because this is the dedicated mapping pass.
- Relevant supporting source, persistence code, UI code, and tests may be inspected as needed for dependency evidence.
- Documentation may be created/updated for the SA deliverable.

Dependencies that must be checked:
- Callers/callees
- State reads/writes
- Persistence/save/load
- UI consumers
- Stable IDs/cross-record references
- Inventory/resource ownership and conservation paths
- Related tests

Explicit non-goals:
- No gameplay redesign
- No runtime refactor/module extraction
- No future-feature implementation
- No deployment
- No merge to main
- No permanent SA ownership decisions invented by Ju

Acceptance tests / evidence:
- `docs/SYSTEM_MAP.md` exists and follows this handoff
- Major systems have direct-edge evidence where practical
- Unknowns/POSSIBLE relationships are preserved explicitly
- Current reality is distinguished from target architecture
- Runtime files show no intentional behavioral changes
- Branch is pushed and final SHA is reported

Working branch:
Use a dedicated non-main architecture branch derived from the reviewed documentation baseline.

Deployment authorized: no

Stop condition:
Stop after the DRAFT map is complete and pushed for Ru/user architectural review. If interrupted, push a WIP recovery commit with exact remaining coverage documented.
```

## 19. Final preservation rule

The purpose of SA is not to create a perfect diagram before development can continue. Its purpose is to convert repeated architectural rediscovery into durable, testable knowledge.

Start conservative. Preserve evidence. Expose uncertainty. Let real implementation work refine the graph.

> **Map what exists. Curate what it should become. Trust only what has earned trust.**

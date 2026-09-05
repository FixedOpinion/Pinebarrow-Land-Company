# Phase 5R.0 — Workforce Reconciliation Conflict Map

**Date:** 2026-09-05  
**Status:** COMPLETE — analysis/documentation checkpoint only  
**Branch:** `phase-5r-workforce-reconciliation`  
**Starting `main`:** `2c65ba7431b18d5514321cdd2d14cddb08f9128f`  
**Reference PR:** [#4](https://github.com/FixedOpinion/Pinebarrow-Land-Company/pull/4), now closed as superseded

## Purpose

Record what can be preserved from the old Workforce branch and what must be rejected before any runtime workforce work begins. This prevents PR #4 from being merged wholesale or repeatedly reread during later checkpoints.

## Conflict map

| Area | PR #4 | Current main / approved direction | Phase 5R disposition |
|---|---|---|---|
| Branch base | Based on `5f400ec`; diverged from current main | Current main is `2c65ba7` | Start fresh from current main |
| Save schema | Hard-coded schema v9 patch | Current canonical save schema is v12 | Preserve v12; design the next migration separately |
| Runtime integration | Startup source monkey-patch with old string markers | Canonical live engine and integrated Company Operations | Reject runtime monkey-patching; manually port only approved behavior |
| Management UI | Loads older Mine/Operations overlays | Current main owns management inside the live engine | Preserve current building-owned Operations UI |
| Workforce model | One 2×2 Worker House creates exactly one worker | Approved handoff: housing provides capacity; residents become candidates, then hired workers are assigned to jobs | Reject the old worker-generator model |
| Production gate | Mine stops when no house is assigned | Current runtime still uses a global worker prototype | Do not change production until the replacement worker model is authorized |
| Physical placement | Planned houses are a future Phase 5B | Physical houses are not currently authorized | Do not implement placement |
| Verification | No workforce tests or CI results in PR #4 | Existing regression suite covers the current engine | Add focused fixtures with the future migration/assignment checkpoint |

## Preserved evidence

PR #4 remains useful for reviewing:

- the desired need for stable worker/site IDs;
- assignment, reassignment, and unassignment edge cases;
- visible staffing bottleneck messaging;
- legacy-save preservation concerns.

Its code and branch are historical evidence, not merge candidates.

## Checkpoint boundary

This 5R.0 push changes documentation only:

- PR #4 was commented and closed as superseded.
- The replacement branch was created from current main.
- The cadence tracker now records the verified current main SHA and PR status.
- No runtime, save, economy, UI, deployment, or production behavior was changed.
- No tests or build were run because this checkpoint contains no runtime changes.

## Next checkpoint

Do not begin save migration or production staffing automatically. The next workforce slice requires an explicit model decision and must define the resident/candidate/hire/assignment records before changing the current global `workers` behavior.

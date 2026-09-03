# Development Checkpoint Schedule

## Why this exists

Pinebarrow development must survive interrupted chats and usage limits. GitHub is the source of truth. A feature is not considered saved until its commit is visible on GitHub and the branch head has been verified.

## Non-negotiable workflow

For every work packet:

1. Read the current branch head from GitHub.
2. Define one narrow behavior, migration, or UI change.
3. Change only the files required for that packet.
4. Add or update focused regression coverage.
5. Run the smallest relevant checks first.
6. Commit the packet immediately after those checks pass.
7. Fetch the branch again and verify the new commit SHA and changed paths.
8. Report the commit link, checks run, and the exact next packet.
9. Do not begin the next packet until the current commit is verified.

Before a phase is merged or published:

1. Run the complete test suite and production build.
2. Review save migration and existing-profile compatibility.
3. Merge the tested phase into `main`.
4. verify the `main` commit SHA.
5. Publish that exact `main` commit to the Pinebarrow Site.
6. Record the release in `docs/CHANGELOG.md`.

The public `.chatgpt.site` is a deployment target, never the editable source or only surviving copy.

## Usage-efficient working rules

- Default to one micro-phase per work session.
- Never hold more than one self-contained behavior uncommitted.
- Prefer a packet that changes at most three production files plus its tests and changelog entry.
- Use targeted source inspection and focused tests while implementing.
- Run the expensive complete build/test suite once at the phase integration gate, unless a packet changes build infrastructure.
- Do not deploy intermediate mechanics commits. Deployment is a separate release checkpoint.
- Do not mix visual redesign, economy rebalance, save migration, and new mechanics in one packet.
- If interrupted, discard assumptions from the chat and resume from the last verified GitHub commit.

## Current branch and baseline

- Protected source baseline: `main` at `f36a8aa5611998066bf19bf02ba735d3dad08044`
- Active phase branch: `phase-4b-mine-foundation`
- Live game remains unchanged until the phase integration gate.

## Current phase — 4B Mine upgrade separation

This phase separates the mine's production depth, chosen material, and local storage. It does not yet implement Crowe property purchases, dirt disposal, worker housing, or automated warehouse collection.

| Checkpoint | Scope | GitHub save point | Verification gate |
|---|---|---|---|
| 4B.0 | Branch and checkpoint schedule | This document committed on the phase branch | Branch commit fetched back from GitHub |
| 4B.1 | Save schema and old-profile migration for excavation level, capacity level, and active seam | One migration commit | Legacy and current profile fixtures normalize without lost mine progress |
| 4B.2 | Excavation upgrades unlock seams without automatically changing the active material | One behavior commit | Production and seam-selection regressions |
| 4B.3 | Independent mine stockpile-capacity upgrades and prices | One behavior commit | Capacity/cost regressions |
| 4B.4 | Mine and Company Operations UI exposes Excavation, Active Seam, Capacity, and blockers | One UI commit | Interaction, keyboard/controller, and management regressions |
| 4B.5 | Full compatibility pass, changelog, merge, and release candidate | One integration commit on `main` | Full build, lint, tests, save migration, then explicit publish checkpoint |

## Following phases

Each row becomes its own phase branch and is further split into micro-commits before implementation begins.

| Phase | Scope |
|---|---|
| 4C | Mine-specific Shaker efficiency and dirt-output rate |
| 4D | Efficiency history, bottleneck reporting, and management explanations |
| 5 | Worker House, worker pool, assignments, and production staffing requirements |
| 6 | Warehouse mine collection, separate capacity/logistics upgrades, and reserves |
| 7 | Buildable Player Market, throughput upgrades, and existing-price integration |
| 8A | Legal dirt disposal and Crowe acquisition fund |
| 8B | Future Industry lots, player property/rent, Crowe purchases, estate, and wealth visuals |

## Checkpoint report format

Every completed packet is reported with:

- branch and commit link
- behavior completed
- files changed
- tests/checks run and their result
- known limits
- exact next checkpoint

No claim of “tested,” “published,” or “live” is made unless that exact action has completed successfully.

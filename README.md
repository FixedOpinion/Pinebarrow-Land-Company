# Pinebarrow Land Company

Pinebarrow Land Company is a browser-based mining, logistics, and town-development game. The player prospects land, develops mines, manages trucks and warehouses, trades materials, fulfills contracts, and helps Pinebarrow grow into a city.

## Play the live game

**[▶ Open Pinebarrow Land Company](https://pinebarrow-land-company.fixedopinion.chatgpt.site)**

Live production address: `https://pinebarrow-land-company.fixedopinion.chatgpt.site`

The hosted Site is a deployment target. This repository is the editable source of truth.

## Source layout

The current game is a Vinext/React project, not an Excel file and not a standalone `index.html`.

- `app/page.tsx` — page structure and persistent HUD markup
- `app/globals.css` — interface and responsive presentation
- `public/pinebarrow-engine.js` — main game simulation, rendering, controls, audio, saves, economy, and map logic
- `app/api/profiles/route.ts` — three-slot cloud/device profile API
- `public/` — truck art, share art, icons, and other browser assets
- `tests/` — gameplay, save-migration, and rendering regressions
- `docs/` — product rules, economy design, town design, recovery record, and changelog

The recovered working build is intentionally preserved in its existing structure. Refactoring the engine into smaller modules is a later, separate task and must not be mixed with feature work.

## Development workflow

Use this order for every change:

1. Start from the latest GitHub `main` commit.
2. Create a focused branch or checkpoint.
3. Make one coherent change without removing unrelated working systems.
4. Run the relevant tests, then the complete test suite before release.
5. Commit the tested source to GitHub.
6. Publish that exact commit to the Pinebarrow Site.
7. Record the release in `docs/CHANGELOG.md`.

Never use the published `.chatgpt.site` as the only surviving copy of the game.

## Local commands

Requires Node.js 22.13 or newer.

```bash
npm run install:ci
npm run dev
npm run lint
npm test
```

`npm test` builds the game and runs all automated regressions.

## Protected baseline

The untouched recovered production source is preserved on branch `baseline-live-v17`. Recovery hashes and provenance are recorded in [`docs/SOURCE_RECOVERY.md`](docs/SOURCE_RECOVERY.md).

## Design documents

- [`docs/DEPLOYMENT_HANDOFF.md`](docs/DEPLOYMENT_HANDOFF.md) — cross-chat release access, safety rules, and the reusable deployment request
- [`docs/GAME_BLUEPRINT.md`](docs/GAME_BLUEPRINT.md) — identity, gameplay loop, preservation rules, and phased roadmap
- [`docs/ECONOMY.md`](docs/ECONOMY.md) — materials, workers, logistics, markets, contracts, and bottlenecks
- [`docs/TOWN_DESIGN.md`](docs/TOWN_DESIGN.md) — large-town layout, streets, blocks, industry growth, and terrain exclusions
- [`docs/CHANGELOG.md`](docs/CHANGELOG.md) — version history and pending work

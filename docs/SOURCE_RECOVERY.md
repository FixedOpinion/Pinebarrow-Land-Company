# Source Recovery Record

## Baseline identity

The latest editable Pinebarrow source was recovered from the Sites project checkout before any handoff changes were made.

| Item | Value |
|---|---|
| Production URL | `https://pinebarrow-land-company.fixedopinion.chatgpt.site` |
| Sites project version | `17` |
| Recovered Sites commit | `ecbc492419aeeafc6d1d344cc889fda5256849f6` |
| Recovered root tree | `442f2ab886009dfed26ae06b8cedc929ebe9e0db` |
| GitHub baseline commit | `7e7e64b89a28db91d4e63a0ff16c60dca2392773` |
| Protected baseline branch | `baseline-live-v17` |
| Tracked files recovered | `40` |

Every GitHub blob was compared with the corresponding local Git blob. The assembled GitHub root tree SHA exactly matched the recovered Sites root tree SHA. This proves that the protected baseline is byte-for-byte identical to the source used for the current production build.

## Recovered project type

Pinebarrow is a Vinext/React browser project with a large JavaScript game engine. It is not an `.xlsx` spreadsheet and is not currently a single `index.html` game.

The working structure was preserved rather than being reorganized during recovery.

## Recovery rule

Do not force-push, rewrite, or delete `baseline-live-v17`. New work begins from GitHub `main`, uses focused commits, and is tested before publication.

If a future release breaks the game, compare it with or restore from the protected baseline instead of reconstructing source from a conversation or the published website.

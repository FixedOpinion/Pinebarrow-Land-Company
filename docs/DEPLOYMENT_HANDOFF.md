# Pinebarrow Deployment Handoff

## Purpose

This handoff lets any authorized ChatGPT Work/Codex conversation publish the approved GitHub `main` branch to the existing Pinebarrow Land Company Site. Deployment is not owned by one conversation or assistant identity.

## Permanent identities

| Item | Value |
|---|---|
| Source of truth | `FixedOpinion/Pinebarrow-Land-Company` on GitHub |
| Approved release branch | `main` |
| Live game | `https://pinebarrow-land-company.fixedopinion.chatgpt.site` |
| Sites project | Read `project_id` from `.openai/hosting.json` |

The `project_id` is the durable link between this repository and the existing hosted game. Reuse it exactly. Never create a replacement Site when this file contains a project ID.

## What another conversation needs

The conversation performing the release must have:

- the Sites tools/plugin available in ChatGPT Work/Codex;
- access to the same Site workspace as the Pinebarrow owner;
- GitHub access to `FixedOpinion/Pinebarrow-Land-Company`;
- a write-capable permission profile for the requested GitHub and Sites actions; and
- an explicit user request to deploy the approved release.

A conversation that can only browse GitHub, or one where Sites tools are unavailable, cannot publish the game. That is a tool/access limitation in that conversation, not exclusive ownership by an earlier conversation.

## Required release contract

1. Fetch GitHub and verify the exact current `origin/main` SHA.
2. Confirm the working tree matches that approved SHA. Do not include open pull requests, draft branches, or local-only work.
3. Read `.openai/hosting.json` and call Sites for that exact existing `project_id`.
4. Run `npm test`. It performs the production build and automated gameplay regressions. Run `npm run lint` as a separate release check.
5. Obtain a new short-lived Sites source write credential for the existing project. Never print it, commit it, save it in a remote URL, or place it in Git configuration.
6. Push the exact approved GitHub source state to the Sites source repository.
7. Package the build from that same pushed state and save a new Site version whose `commit_sha` identifies it.
8. Deploy only that saved version to the existing Site. Preserve the current public access policy unless the user explicitly asks to change it.
9. Wait for a terminal successful deployment status before saying the release is live.
10. Report the GitHub `main` SHA, Site version number, test result, and live URL. Record gameplay releases in `docs/CHANGELOG.md`.

## Separate-history safeguard

GitHub and the Sites source repository can contain different commit ancestry even when their files are identical. If the Sites source rejects a normal fast-forward push:

- do not force-push;
- do not rewrite or discard the Sites source history;
- use the current Sites source head as the parent of a new synchronization commit;
- make that commit's complete tree exactly match the approved GitHub `main` tree; and
- verify the resulting tree equality before saving the Site version.

This preserves both histories while ensuring the hosted version contains exactly the approved GitHub files.

## Prohibited release shortcuts

- Do not call `create_site` while `.openai/hosting.json` has a valid `project_id`.
- Do not deploy directly from an unmerged feature branch.
- Do not merge unrelated or unapproved pull requests merely to prepare a release.
- Do not use `--force` or rewrite either remote's history.
- Do not store Sites credentials, tokens, or credential-bearing URLs in GitHub.
- Do not change the Site slug, audience, domains, database bindings, or environment values unless the user separately requests that change.
- Do not claim GitHub automatically deployed the Site. GitHub is the source of truth; Sites publication remains an explicit release action.

## Reusable request for another chat

Use this prompt in a new ChatGPT Work/Codex conversation:

> Open `FixedOpinion/Pinebarrow-Land-Company`. Read `docs/DEPLOYMENT_HANDOFF.md` and `.openai/hosting.json`. Deploy only the approved GitHub `main` to the existing Pinebarrow Site. Do not create a new Site, change access, include unmerged branches, or force-push. Run the release checks, preserve Sites source history, save a Site version, deploy it, and return the live URL, GitHub SHA, Site version, and test result.

If that conversation says no Sites deployment tool is available, open a ChatGPT Work/Codex conversation with the Sites plugin enabled and use the same request there.

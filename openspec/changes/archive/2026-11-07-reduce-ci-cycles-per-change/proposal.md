# Proposal

- `openspec-archive-head` decides whether a PR head may skip test jobs.
- Skip only when the push since a green head touches only `openspec/` and `todo/`.
- Spec checks always run; `verify-green` accepts `skipped` only under that rule.

## Why

Each change pays three full CI runs. The archive head reruns tests on code
already green; only spec checks judge it. No archive head has gone red in
steward or in a consumer repository.

## What Changes

- The bin, failing closed.
- Steward CI: `archive head` gates test jobs; a `specs` job runs always.
- Skip rule in `verify-green`, the flow skill, `docs/change-flow.md`.
- Consumer recipe in `docs/archive-head.md`.

## Non-goals

- The push-to-base run.
- Editing consumer repositories.
- A release.

## Capabilities

### New Capabilities
- `archive-head-ci`: when a head may skip tests, and how its green is verified.

### Modified Capabilities

## Impact

`scripts/archive-head/`, `package.json`, `.github/workflows/ci.yml`,
`commands/verify-green.md`, `skills/openspec-change-flow/SKILL.md`,
`docs/`, `README.md`.

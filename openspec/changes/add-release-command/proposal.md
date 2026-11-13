# Proposal

- `/release X.Y.Z` runs `docs/releasing.md` in order and stops for the merge.
- It is repo-local, in `.claude/commands/`, so consumers never receive it.
- A unit test fails when the three release versions disagree.

## Why

A release ships about weekly, run from memory or from the doc. The steps
easiest to skip are the ones that matter: the tree check after a rebase merge,
`--cleanup=verbatim` and `--verify-tag`. This package already turns such
procedures into commands. A half-done bump is caught by nothing.

## What Changes

- `.claude/commands/release.md`: refusals, bump, PR, green, merge stop, tag,
  publish. It links the doc for the reasons.
- A version test in `scripts/release/`.
- `AGENTS.md`, `docs/releasing.md` and `docs/README.md` point at both.

## Non-goals

- A skill that watches for a hand-run release.
- Publishing to npm.
- Releasing now: the first `/release` runs after this merges.

## Capabilities

### New Capabilities
- `release-versions`: the release version agrees across its three files.

### Modified Capabilities

## Impact

`.claude/commands/release.md`, `scripts/release/`, `AGENTS.md`, `docs/`.

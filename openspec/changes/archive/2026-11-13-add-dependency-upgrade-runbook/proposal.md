# Proposal

- `docs/maintaining.md` says how to move each pinned tool and how to tell the
  bump is good.
- OpenSpec gets two pins: a floor (1.13.2) and one current version (1.17.0).
- A unit test fails when the current pins disagree or the floor passes them.

## Why

Four OpenSpec versions are pinned today: 1.13.2, 1.15.0, 1.16.0 and 1.16.1.
Each was the newest release when it was written; none says why it differs.
A hand upgrade already shipped mislabelled output (#21).

## What Changes

- `docs/maintaining.md`: OpenSpec, Claude Code and GitHub Actions sections.
- CI `strict` pin, `generatedBy` and the `tdd.mjs` copy move to 1.17.0.
- A pin test in `scripts/pins/`.
- Links from `AGENTS.md` and `docs/README.md`.

## Non-goals

- The OpenSpec 2.x line.
- Changing `engines`, though OpenSpec needs Node 20.19 or later.
- Testing `tdd.mjs` against an installed CLI.

## Capabilities

### New Capabilities
- `tool-pins`: the OpenSpec pins move together.

### Modified Capabilities

## Impact

`docs/`, `AGENTS.md`, `.github/workflows/ci.yml`, `.claude/`,
`scripts/check-specs/lib/tdd.mjs`, `scripts/pins/`.

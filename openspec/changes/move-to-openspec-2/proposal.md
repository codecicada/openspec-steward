# Proposal

- The current OpenSpec pins move from 1.17.0 to 2.2.0.
- `generatedBy` stops being a pin: 2.x no longer writes it.
- CI compares the generated skills with what the pinned CLI would write.

## Why

2.2.0 writes skills to `.agents/skills/`, links them from `.claude/skills/` and
stamps no version. The pin test reads no skill and fails.

## What Changes

- The pin test reads the CI pin and the `tdd.mjs` comment, and names both when
  they disagree.
- A generated-files check runs `openspec update --dry-run --json` in CI.
- `AGENTS.md`, `docs/` and the shipped flow skill drop the `opsx` names.

## Non-goals

- Moving the floor, 1.13.2.
- Changing `engines`.
- Running the check for consumers.

## Capabilities

### New Capabilities

### Modified Capabilities
- `tool-pins`: two current pins, and generated files checked by the CLI.

## Impact

`scripts/pins/`, `ci.yml`, `tdd.mjs`, `AGENTS.md`, `docs/`, `skills/`.

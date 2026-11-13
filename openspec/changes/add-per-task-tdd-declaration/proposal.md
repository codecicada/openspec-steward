# Proposal

- Each task declares `tdd: yes` or `tdd: no`, with a reason.
- A done `tdd: yes` task records its failing run as a `red:` line.
- A fifth check, `tdd`, fails when either is missing.

## Why

Test-first is decided per task today, silently. Green cannot show which tasks
were proven red first. Effort tiers chosen at start know the least; a
per-task line is chosen at propose and read in the PR.

## What Changes

- A steward `tasks` rule, written by init.
- The `tdd` check.
- The flow skill: declare at propose, record red at apply.

## Non-goals

- Rerunning the red line.
- Effort tiers.
- A new gate.
- A release.

## Capabilities

### New Capabilities
- `task-tdd-declaration`: the per-task declaration, its red evidence, and the check.

### Modified Capabilities

## Impact

`openspec/config.yaml`, `scripts/init/lib/rules.mjs`, `scripts/check-specs/`,
`skills/openspec-change-flow/SKILL.md`, `docs/`, `README.md`.

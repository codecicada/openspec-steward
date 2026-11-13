# Design

## Context

OpenSpec is pinned in four places, each at the release that was newest the
day it was written: the smoke test at 1.13.2, CI `strict` at 1.15.0, the
generated `.claude/` files at 1.16.0 and the `tdd.mjs` pattern copy at 1.16.1.
No document says how to move a pin or whether a difference is deliberate.
Claude Code is pinned once, in `scripts/plugin/validate.sh`; the GitHub Actions
in `ci.yml` already agree with each other. OpenSpec 1.16.0 and later need
Node 22.12; 1.15.x and earlier need 20.19.

## Decision

1. **Two OpenSpec pins.** A *floor*, the oldest supported CLI, exercised by the
   smoke test and held at 1.13.2. A *current* version, named by CI `strict`,
   every `generatedBy` and the `tdd.mjs` comment, moved together to 1.17.0.
   The smoke test is the only place the floor is exercised.
2. **A pin test.** A pure `readPins` in `scripts/pins/lib/pins.mjs` takes the
   text of the four files and returns the versions or a finding per file it
   cannot read; `checkPins` compares them. Its test runs fixtures and then this
   repository's own files, the way the init test does. A pin the reader cannot
   find fails: a reader that silently finds nothing would pass every time.
3. **The runbook is `docs/maintaining.md`**, one section per tool, each step
   with the check that proves it. Every pin's comment points at it.
4. **1.17.0 now.** The bump is the runbook's first use: `openspec update`, a
   second run with no diff, `strict` on the new CLI, the task-line pattern
   compared by hand. 1.16.1 and 1.17.0 share that pattern byte for byte.

## Consequences

- A half-done current bump turns `npm test` red.
- Moving the floor past 1.15.x raises the Node a consumer needs to 22.12; the
  runbook says so next to the floor.
- The `tdd.mjs` pattern stays compared by hand: unit tests install nothing.

## Alternatives

- **One version everywhere.** Simpler, but nothing would test the oldest
  supported CLI.
- **Runbook only.** The drift it fixes happened with nobody reading a doc.
- **A test against the installed CLI's `TASK_LINE_PATTERN`.** Needs the CLI
  installed for the unit tests, which have no dependencies.

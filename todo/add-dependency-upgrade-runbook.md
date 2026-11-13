---
slug: add-dependency-upgrade-runbook
title: Runbook for upgrading pinned tools
created: 2026-11-12
source: session after the v0.8.0 release, while writing docs/releasing.md (#38)
---

## Why

The repository pins its external tools exactly, so that an upstream release
cannot redden a build that changed nothing here. Nothing says how to move a pin,
and the OpenSpec pins have already drifted apart. Four different versions are in
force today:

| where | version | used for |
|---|---|---|
| `scripts/check-specs/smoke-bin.sh` `OPENSPEC_VERSION` | 1.13.2 | the bin smoke test |
| `.github/workflows/ci.yml` `specification checks` job | 1.15.0 | `strict` in CI |
| `.claude/` instruction files, `generatedBy` | 1.16.0 | `openspec update` output |
| `scripts/check-specs/lib/tdd.mjs` `TASK_LINE` comment | 1.16.1 | copy of `TASK_LINE_PATTERN` |

None of these says whether the difference is deliberate, for example a smoke
test held to the oldest supported CLI.

An upgrade done by hand has already gone wrong once. #21 committed output from
CLI 1.13.2 labelled as v1.14.1, rolling the instruction files back, and #22 had
to restore them.

`scripts/plugin/validate.sh` pins `@anthropic-ai/claude-code`. Its comment says
to bump it in its own commit, but not how to tell that the bump is good.

## What

- A `docs/maintaining.md` runbook, one section per pinned tool:
  - **OpenSpec CLI**: install the exact version, run `openspec update`, check
    `generatedBy` equals that version, and rerun to confirm no diff (the check
    #21 skipped). Move every pin that is meant to follow it. Diff
    `TASK_LINE_PATTERN` in the new `dist/utils/task-progress.js` against the
    copy in `tdd.mjs`. Run `strict` on the new version before CI does.
  - **Claude Code** (plugin validation): bump in its own commit, then read
    observations B and C of `test:plugin`.
  - **GitHub Actions** versions in `ci.yml`.
- A decision, recorded in the runbook, on which OpenSpec pins move together and
  which are held back on purpose, with the reason next to each pin.
- Either align the four OpenSpec versions now, or record why they differ.
- A link from `docs/README.md` and from the maintainer guide
  (`add-maintainer-guide`).

## Open questions

- Should a test fail when the `tdd.mjs` pattern no longer matches the installed
  CLI's `TASK_LINE_PATTERN`? That would turn a silent miscount into a red build.
- Should a test hold the pins to each other, for example the CI pin equal to
  `generatedBy`?
- Does the 2.x CLI line change anything the checker relies on? It needs its own
  look before any pin moves to it.

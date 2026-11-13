---
slug: add-maintainer-guide
title: Add a maintainer guide
created: 2026-11-12
source: session after the v0.8.0 release, while writing docs/releasing.md (#38)
---

## Why

Nothing in the repository tells a contributor, human or agent, how to work on
it. Every page in `docs/` explains the plugin to the people who use it. There is
no `AGENTS.md`, `CONTRIBUTING.md` or `CLAUDE.md` at the root. The rules this
repository actually follows exist only in past pull requests and in session
memory:

- every change goes through the steward flow on this repository itself;
- explicit paths only, never `git add <dir>`;
- rebase-merge, and merge only on a human's explicit request;
- the repository is public, so no file, commit, PR or release names a consumer
  repository or any fact about one;
- `npm test`, `test:bin`, `test:gates` and `test:plugin` are the local gates,
  and `npm test` is the only correct way to run the unit tests.

The package also tells every consumer to keep an `AGENTS.md` with a flow
summary, written by `openspec-steward-init`. Its own repository has none, so it
does not run its own init.

## What

- A root `AGENTS.md` holding the rules above, a map of `scripts/`, `skills/`,
  `commands/` and `docs/`, and links to `docs/releasing.md` and the
  dependency-upgrade runbook (see `add-dependency-upgrade-runbook`).
- The steward section that init writes, added by running init on this
  repository, so the repository follows its own instructions.
- A one-line `CLAUDE.md` pointing at `AGENTS.md`, if Claude Code does not read
  `AGENTS.md` on its own.

## Open questions

- `AGENTS.md` only, or also a `CONTRIBUTING.md` for human contributors on
  GitHub? One file avoids two copies that drift apart.
- Does init's section sit well next to hand-written rules, or should the
  repository rules live under their own heading outside init's markers?
- Should a test hold `AGENTS.md` to the repository, for example by asserting
  that each npm script it names exists?

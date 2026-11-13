# Proposal

- A root `AGENTS.md` tells contributors and agents how to work on this
  repository.
- This repository runs its own init, so `AGENTS.md` carries the steward section.
- A test fails when init would still change this repository.

## Why

Steward tells every consumer to run init and keep an `AGENTS.md`. Its own
repository has neither the file nor the section. The rules it is worked by
live only in past pull requests and session memory.

## What Changes

- `AGENTS.md`: hand-written rules, map, gates and maintenance links, then
  init's section.
- `CLAUDE.md`: imports `AGENTS.md`.
- A `project-init` test: init plans no writes on this repository.

## Non-goals

- A `CONTRIBUTING.md`.
- Testing the hand-written prose.
- Changing what init writes.

## Capabilities

### New Capabilities

### Modified Capabilities
- `project-init`: this repository passes its own init.

## Impact

`AGENTS.md`, `CLAUDE.md`, `scripts/init/lib/init.test.mjs`, `docs/README.md`,
`README.md`.

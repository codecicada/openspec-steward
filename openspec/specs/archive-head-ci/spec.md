# archive-head-ci Specification

## Purpose
Decides when a pull request head may skip its test jobs because the push since
a green head changed only OpenSpec files, and how that head's green is verified.

## Requirements

### Requirement: A head skips tests only after a green head and a spec-only push
`openspec-archive-head` SHALL print `skip=true` only when all of these hold,
and `skip=false` with the first failing condition otherwise:
the event is a pull request `synchronize`; `before` is an ancestor of `head`;
`git diff --name-only before head` is non-empty and every path is under
`openspec/` or `todo/`; the base ref is an ancestor of `before`; and every
check run on `before` is completed with conclusion `success`.

#### Scenario: Archive pushed onto a green head
- **GIVEN** `before` has six check runs, all `success`, and contains the base
- **WHEN** `head` adds only an archive commit under `openspec/` and `todo/`
- **THEN** it prints `skip=true`

#### Scenario: Code in the push
- **WHEN** the diff from `before` to `head` includes `scripts/a.mjs`
- **THEN** it prints `skip=false` naming that path

#### Scenario: Previous head not green
- **WHEN** one check run on `before` reads `failure`, `cancelled`, `skipped` or `in_progress`
- **THEN** it prints `skip=false`

#### Scenario: Base moved since the green head
- **WHEN** the base ref is not an ancestor of `before`
- **THEN** it prints `skip=false`

#### Scenario: History rewritten
- **WHEN** `before` is not an ancestor of `head`
- **THEN** it prints `skip=false`

#### Scenario: Not a synchronize
- **WHEN** the event is `opened`, `reopened` or a push
- **THEN** it prints `skip=false`

### Requirement: The decision fails closed
A condition the bin cannot evaluate SHALL read as failing, so it prints
`skip=false`: a missing or unresolvable SHA, no token, an API error, or more
check runs than one page returns. The bin SHALL exit 0 after printing a
decision, and non-zero only on a usage error.

#### Scenario: No token
- **WHEN** neither `GH_TOKEN` nor `GITHUB_TOKEN` is set
- **THEN** it prints `skip=false` and exits 0

#### Scenario: Unknown SHA
- **WHEN** `before` is not in the clone
- **THEN** it prints `skip=false` and exits 0

#### Scenario: Missing argument
- **WHEN** `--head` is not given
- **THEN** it exits non-zero with a usage message

### Requirement: Spec checks run on every head
The steward CI SHALL run its spec checks on every head, whatever the decision
says. Only jobs that read none of `openspec/` and `todo/` SHALL depend on the decision.

#### Scenario: Skip decided
- **WHEN** `archive head` outputs `skip=true`
- **THEN** `specification checks` still runs, and the test jobs read `skipped`

### Requirement: A skipped check is green only when the rule is re-derived
`verify-green` SHALL count a check reading `skipped` as passing only when
`archive head` reads `success` on the head, every check on the previous verified
head reads `success` by name, and `git diff --name-only <previous> HEAD` lists
only `openspec/` and `todo/` paths. Otherwise it SHALL report not green.

#### Scenario: Re-derived
- **GIVEN** the previous head was verified green and the archive touched only `openspec/` and `todo/`
- **WHEN** the archive head shows the test jobs `skipped` and `archive head` `success`
- **THEN** it reports green

#### Scenario: Skipped without the decision
- **WHEN** a check reads `skipped` and `archive head` is absent or not `success`
- **THEN** it reports not green, naming that check

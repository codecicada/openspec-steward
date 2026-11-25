## MODIFIED Requirements

### Requirement: OpenSpec pins move together
The pin test SHALL read the floor from `scripts/check-specs/smoke-bin.sh` and
the current version from two places: the `strict` install in
`.github/workflows/ci.yml` and the version in the `TASK_LINE` comment of
`scripts/check-specs/lib/tdd.mjs`. It SHALL fail unless the current pins name
one version and the floor is at or below it.

#### Scenario: Pins agree
- **GIVEN** a floor of 1.13.2 and both current pins at 2.2.0
- **WHEN** the unit tests run
- **THEN** the pin test passes

#### Scenario: One current pin moved alone
- **GIVEN** the CI pin at 2.3.0 and the `tdd.mjs` pin at 2.2.0
- **WHEN** the unit tests run
- **THEN** the pin test fails naming both pins and both versions

#### Scenario: Floor above current
- **GIVEN** a floor of 2.3.0 and both current pins at 2.2.0
- **WHEN** the unit tests run
- **THEN** the pin test fails naming the floor

#### Scenario: A pin cannot be found
- **GIVEN** a file whose pin no longer matches the shape the test reads
- **WHEN** the unit tests run
- **THEN** the pin test fails naming that file

## ADDED Requirements

### Requirement: Generated files match the pinned CLI
The CI job that installs the current OpenSpec version SHALL run
`openspec update --dry-run --json` with it and SHALL fail when the run plans a
change inside the repository, or when it cannot tell. Planned changes to paths
under `~` SHALL be ignored.

#### Scenario: Generated files are current
- **GIVEN** skills under `.agents/skills/` written by the pinned CLI
- **WHEN** the check runs
- **THEN** it passes

#### Scenario: A generated file is stale
- **GIVEN** a skill whose text differs from what the pinned CLI writes
- **WHEN** the check runs
- **THEN** it fails naming the file and the planned action

#### Scenario: Only the machine's own config would change
- **GIVEN** a dry run whose only planned change is `~/.config/openspec/config.json`
- **WHEN** the check runs
- **THEN** it passes

#### Scenario: No generated skill is found
- **GIVEN** a repository with no `.agents/skills/openspec*/SKILL.md`
- **WHEN** the check runs
- **THEN** it fails saying no skill was found

#### Scenario: The dry run cannot be read
- **GIVEN** a dry run that exits non-zero, reports a failure, or prints
  something other than the expected JSON
- **WHEN** the check runs
- **THEN** it fails saying what it could not read

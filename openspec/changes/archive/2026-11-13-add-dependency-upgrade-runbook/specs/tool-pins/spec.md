## Purpose
Holds this repository's OpenSpec version pins to each other: one floor, the
oldest supported CLI, and one current version that every other pin names.

## ADDED Requirements

### Requirement: OpenSpec pins move together
The pin test SHALL read the floor from `scripts/check-specs/smoke-bin.sh` and
the current version from three places: the `strict` install in
`.github/workflows/ci.yml`, every `generatedBy` under `.claude/skills/`, and the
version in the `TASK_LINE` comment of `scripts/check-specs/lib/tdd.mjs`. It SHALL
fail unless the current pins name one version and the floor is at or below it.

#### Scenario: Pins agree
- **GIVEN** a floor of 1.13.2 and every current pin at 1.17.0
- **WHEN** the unit tests run
- **THEN** the pin test passes

#### Scenario: One current pin moved alone
- **GIVEN** the CI pin at 1.18.0 and the other current pins at 1.17.0
- **WHEN** the unit tests run
- **THEN** the pin test fails naming the CI pin and both versions

#### Scenario: Floor above current
- **GIVEN** a floor of 1.18.0 and every current pin at 1.17.0
- **WHEN** the unit tests run
- **THEN** the pin test fails naming the floor

#### Scenario: A pin cannot be found
- **GIVEN** a file whose pin no longer matches the shape the test reads
- **WHEN** the unit tests run
- **THEN** the pin test fails naming that file

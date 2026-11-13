## ADDED Requirements

### Requirement: This repository passes its own init

Init run on this repository SHALL refuse nothing and plan no write, so the
repository carries the same rules and the same `AGENTS.md` section it asks a
consumer to carry.

#### Scenario: Init plans nothing here

- **GIVEN** this repository's `openspec/config.yaml` and root `AGENTS.md`
- **WHEN** init plans its writes against them
- **THEN** it plans no refusal and no write

#### Scenario: The section changes and this repository does not

- **GIVEN** a change to the section init writes
- **WHEN** this repository's `AGENTS.md` still holds the previous section
- **THEN** init plans a write to `AGENTS.md`, and the test fails

#### Scenario: Hand-written text outside the markers

- **GIVEN** an `AGENTS.md` with the repository's own text above the steward section
- **WHEN** init plans its writes
- **THEN** the text outside the markers does not cause a write

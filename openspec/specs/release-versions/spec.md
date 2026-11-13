# release-versions Specification

## Purpose
Holds this repository's release version equal across the three files that
carry it, so a half-done bump fails CI.

## Requirements

### Requirement: The release version agrees across its files
The version test SHALL read the version from `package.json` `version`,
`.claude-plugin/plugin.json` `version` and the marketplace example's `"ref":
"vX.Y.Z"` in `README.md`. It SHALL fail unless all three name one version.

#### Scenario: Versions agree
- **GIVEN** all three files at 0.8.0
- **WHEN** the unit tests run
- **THEN** the version test passes

#### Scenario: One file bumped alone
- **GIVEN** `package.json` at 0.9.0 and the other two at 0.8.0
- **WHEN** the unit tests run
- **THEN** the version test fails naming `package.json` and both versions

#### Scenario: A version cannot be found
- **GIVEN** a `README.md` with no `"ref": "vX.Y.Z"` line
- **WHEN** the unit tests run
- **THEN** the version test fails naming `README.md`

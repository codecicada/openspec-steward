# task-tdd-declaration Specification

## Purpose
Requires every task of an unarchived OpenSpec change to declare whether it is
test-first, requires a done test-first task to record its failing run, and
defines the `tdd` check that holds both.

## Requirements

### Requirement: Every task declares TDD
The `tdd` check SHALL report a finding for each task in an unarchived change's
`tasks.md` that does not carry exactly one un-boxed sub-bullet
`tdd: yes` or `tdd: no` followed by a separator (`—`, `–`, `-` or `:`) and a
non-empty reason. A task is a line OpenSpec counts as one. A task's sub-lines
run to the next task line or heading.

#### Scenario: Declared task
- **GIVEN** a task followed by `  - tdd: no — docs only`
- **WHEN** check-specs runs
- **THEN** `tdd` reports no finding for it

#### Scenario: Undeclared task
- **GIVEN** a task with no `tdd:` sub-bullet
- **WHEN** check-specs runs
- **THEN** `tdd` reports a finding naming the file, the line and the task text

#### Scenario: Value other than yes or no
- **WHEN** a task's sub-bullet reads `tdd: maybe — later`
- **THEN** `tdd` reports a finding for that task

#### Scenario: No reason
- **WHEN** a task's sub-bullet reads `tdd: yes`
- **THEN** `tdd` reports a finding for that task

#### Scenario: Declared twice
- **WHEN** a task carries two `tdd:` sub-bullets
- **THEN** `tdd` reports one finding for that task

#### Scenario: Archived change
- **GIVEN** an undeclared task under `openspec/changes/archive/`
- **WHEN** check-specs runs
- **THEN** `tdd` reports no finding for it

#### Scenario: Change without tasks
- **GIVEN** an unarchived change with no `tasks.md`
- **WHEN** check-specs runs
- **THEN** `tdd` reports no finding for it

### Requirement: A done test-first task records its red run
The `tdd` check SHALL report a finding for each done task declared `tdd: yes`
that carries no un-boxed sub-bullet `red:` with non-empty text.

#### Scenario: Done without red
- **GIVEN** a `- [x]` task declared `tdd: yes — parser edge cases` with no `red:` sub-bullet
- **WHEN** check-specs runs
- **THEN** `tdd` reports a finding for that task

#### Scenario: Done with red
- **GIVEN** the same task with `  - red: npm test → ✖ undeclared task is a finding`
- **WHEN** check-specs runs
- **THEN** `tdd` reports no finding for it

#### Scenario: Not done yet
- **WHEN** a `- [ ]` task declared `tdd: yes` has no `red:` sub-bullet
- **THEN** `tdd` reports no finding for it

#### Scenario: Not test-first
- **WHEN** a `- [x]` task declared `tdd: no` has no `red:` sub-bullet
- **THEN** `tdd` reports no finding for it

### Requirement: Declaration does not change task counts
The `tdd:` and `red:` sub-bullets SHALL NOT be boxed, so OpenSpec's task
progress counts only the tasks.

#### Scenario: Progress unchanged
- **GIVEN** a `tasks.md` with three tasks, each carrying a `tdd:` sub-bullet
- **WHEN** `openspec list` reads it
- **THEN** it reports three tasks

### Requirement: The steward tasks rules require the declaration
The `tasks` rules init writes SHALL include an item requiring each task to
declare `tdd: yes|no` with a reason at propose, and a done `tdd: yes` task to
record its `red:` run.

#### Scenario: Rule present
- **GIVEN** the `rules:` block init writes
- **WHEN** its `tasks` items are read
- **THEN** one names `tdd: yes|no` and `red:`

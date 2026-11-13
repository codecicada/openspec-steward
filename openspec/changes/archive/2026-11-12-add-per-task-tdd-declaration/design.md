# Design

## Context

Steward holds "watch a check fail before trusting it" for checks, but says
nothing about tests written for a task. The last archived change had a
"watch the tests fail" task, run after the code and recorded in a test file
comment. Whether a task was test-first cannot be read from a change.

A work variant of this flow asks for an effort tier (low, normal, high) before
anything else. That picks before explore, when the risk is least known, and its
middle tier lets the agent decide silently, which breaks "declare intent, never
infer it".

## Decision

1. **Declaration form.** Under each task, an un-boxed sub-bullet:
   `- tdd: yes — <reason>` or `- tdd: no — <reason>`. The separator may be
   `—`, `–`, `-` or `:`. OpenSpec counts only boxed bullets
   (`dist/utils/task-progress.js`, `TASK_LINE_PATTERN`), so the sub-bullet is
   not a task and does not change progress counts.
2. **Evidence form.** A done `tdd: yes` task carries a `- red: <command> →
   <failing line>` sub-bullet, written when the test first ran red, before the
   fix. The check asks only that it is there and non-empty.
3. **When.** Declared at propose, after explore. Recorded red at apply. No new
   gate: the declarations are read in the PR, at merge.
4. **Check.** `lib/tdd.mjs`, pure over one `tasks.md` text. Task lines use
   OpenSpec's own pattern, so both agree on what a task is. A task's
   sub-lines run to the next task line or heading. Findings: no declaration,
   a value other than `yes`/`no`, no reason, two declarations, and a done
   `tdd: yes` with no `red:`. A change with no `tasks.md` is skipped.
   Archived changes are skipped, as for `scenarios`.
5. **Rule.** One item added to `rules.tasks` in `openspec/config.yaml` and
   `STEWARD_RULES`; `rules.test.mjs` already holds the two equal.

## Consequences

- A consumer upgrading with an active change fails `tdd` until its tasks are
  declared. Archived history is untouched.
- A consumer whose rules block predates the item gets init's existing
  "missing steward rules" refusal, which prints the item to add.
- `specification checks passed (5)`: the smoke test and docs that name four
  checks change.
- The red line is a claim. It is cheaper to fake than to skip silently, and a
  reviewer can rerun it.

## Alternatives

- **Effort tiers at start.** Rejected: chosen with the least information, and
  the middle tier is undeclared.
- **Test-first commit.** Visible in history, but CI is red on it by design and
  the check would need git history.
- **Rule only, no check.** Nothing fails when a task omits it.
- **Opt-in check.** No upgrade break, but an optional check is one nobody turns
  on.

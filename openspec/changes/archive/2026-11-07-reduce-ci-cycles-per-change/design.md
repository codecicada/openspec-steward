# Design

## Context

A flow change pushes at least two PR heads: the implementation, then the
archive. CI runs every job on both, then again on the push to the base. The
archive commit touches only `openspec/` and `todo/`, and no test job in steward
or in a consumer repository reads either. Only spec checks judge it, and steward's CI has no
spec check job at all: its "second cycle" checks nothing the archive changed.

`pull_request` runs test the merge ref, so a head is only as green as the base
it was merged with. `paths-ignore` cannot help: on `pull_request` it filters by
the whole PR diff, not by the last push. Steward is public, so the minutes
saved here are free; the saving lands in private consumers.

## Decision

1. **`openspec-archive-head` bin** (`scripts/archive-head/`). Zero dependencies.
   It takes `--event`, `--before`, `--head` and `--base`. It prints `skip=` and
   `reason=`, and appends both to `$GITHUB_OUTPUT` when that is set. `decide()`
   in `lib/decide.mjs` is pure: git and the API are injected, so the five
   conditions are unit-tested with fakes. One test also runs it against a
   temporary git repository.
2. **Base condition without the old base SHA.** CI cannot recover which base
   `before` was merged with. If the current base is an ancestor of `before`,
   `before`'s merge ref was `before`'s own tree for any earlier base too. So the
   tree tested at `before` and the one `head` would test differ only by the
   push.
3. **Previous green from the API.** `GET commits/{before}/check-runs`
   (`filter=latest`, `per_page=100`) with `checks: read`. Every run must read
   `completed`/`success`, and there must be at least one. A `skipped` run means
   `before` was itself a skip head, so the decision is a full run, not a chain.
4. **Fail closed.** Anything the bin cannot evaluate gives `skip=false`. A crash
   makes the `archive head` job red, and its dependents then read `skipped`, so
   the head is not green. It never passes silently.
5. **Steward CI.** A new `archive head` job runs on every event, because a
   skipped needed job would skip its dependents. `unit`, `bin`, `gates` and
   `plugin` take `needs: archive-head` and
   `if: needs.archive-head.outputs.skip != 'true'`. A new `specs` job runs
   `openspec-check-specs` with `@fission-ai/openspec@1.15.0` and no `needs`.
6. **Verification.** `verify-green` re-derives the rule itself, against the
   head pinned before archiving, rather than trusting the job's output. This is
   the same reason a watch command's exit code is not evidence.

## Consequences

- An archive head runs `archive head` and `specs`, not the full suite. In
  a consumer it saves the test jobs, most of that head's billed minutes.
- Test jobs start a few seconds later on every run, because they now wait on
  `archive head`.
- A skipped matrix job shows one check with its name unexpanded. Name-by-name
  comparison on a skip head therefore uses the previous head's names.
- A force-pushed base, where the old base is not an ancestor of the new one,
  could pass condition 2 wrongly. This is accepted and documented.
- Consumers get the saving only by wiring the recipe in `docs/archive-head.md`.

## Alternatives

- **`[skip ci]` on the archive commit.** It runs nothing, so spec checks never
  run on the archive. Rejected.
- **Archive before the first push.** One run in total, but CI never sees the
  active delta, so `scenarios` cannot compare it. Rejected.
- **Step-level `if`.** Check names stay stable, but every job still bills a
  rounded minute and starts its service containers. Rejected.
- **Record the base SHA in the check name.** Names would vary per run and break
  by-name verification. Rejected.

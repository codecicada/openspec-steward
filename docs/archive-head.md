# CI on an archive head

A change in the flow pushes at least two pull request heads: the implementation,
then the archive. Without this gate both heads run every job. The archive commit
moves a folder under `openspec/changes/`, applies a delta to `openspec/specs/`,
and may delete `todo/<name>.md`. The code under it is the code the previous head
already tested. Only spec checks can judge what changed, so rerunning the tests
buys nothing.

`openspec-archive-head` decides when a head may skip its test jobs. Spec checks
never depend on it.

## The five conditions

It prints `skip=true` only when all of these hold, checked in this order. On the
first that fails, it prints `skip=false` and names it.

1. The event is a pull request `synchronize`. `opened`, `reopened` and pushes
   always run in full.
2. `before` is an ancestor of `head`. A force-push rewrote history, so the green
   head may not be under this one.
3. `git diff --name-only before head` is non-empty, and every path is under
   `openspec/` or `todo/`.
4. The base ref is an ancestor of `before`. Then `before`'s merge ref was
   `before`'s own tree, whatever base CI merged it with. If the base moved since,
   the merge result is new and has to be tested.
5. Every check run on `before` (latest attempt, one API page) is `completed`
   with conclusion `success`, and there is at least one. A `skipped` run means
   `before` was itself a skip head, so this head runs in full rather than
   chaining skips.

Anything it cannot evaluate reads as failing: an unknown SHA, no token, an API
error, or more check runs than one page. It exits 0 after any decision, and 2 on
a usage error. A crash makes its job red, and the jobs behind it then read
`skipped` on a red build, so it never passes silently.

## Wiring it

`paths-ignore` does not do this. On `pull_request` it filters by the whole pull
request's diff, not by the last push, so the archive head of a change with code
in it always matches.

```yaml
jobs:
  archive-head:
    name: archive head
    runs-on: ubuntu-latest
    # Never behind an `if:`: a skipped `needs` skips every job behind it.
    permissions:
      contents: read
      checks: read
    outputs:
      skip: ${{ steps.decide.outputs.skip }}
    steps:
      - uses: actions/checkout@v5
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v5
        with:
          node-version: '22'
          cache: npm
      - run: npm ci --no-audit --no-fund
      - id: decide
        env:
          GH_TOKEN: ${{ github.token }}
        run: >-
          npx openspec-archive-head
          --event "${{ github.event.action || github.event_name }}"
          --before "${{ github.event.before }}"
          --head "${{ github.event.pull_request.head.sha }}"
          --base "origin/${{ github.base_ref }}"

  test:
    needs: archive-head
    if: needs.archive-head.outputs.skip != 'true'
    # ...unchanged

  specs:
    # No `needs` on archive-head: spec checks run on every head.
    # ...unchanged
```

`npm ci` is there only so `npx` finds the installed bin. A repository that does
not install `openspec-steward` can run
`node node_modules/openspec-steward/scripts/archive-head/index.mjs` the same way,
or vendor `index.mjs`, `lib/decide.mjs` and `lib/git.mjs` from
`scripts/archive-head/`.

## Which jobs may depend on it

Only jobs that read neither `openspec/` nor `todo/`. In practice:

- **May skip:** unit and integration tests, builds, lint over application code.
- **Must not skip:** spec checks (`openspec-check-specs`), and anything else
  that reads `openspec/`, such as a docs build that renders the specs.

If a test reads `openspec/`, for example a fixture that parses a spec, its job
must not depend on the gate. The gate skips whatever depends on it. It does not
check what the job reads.

## Verifying the head it skipped

`/verify-green` counts a `skipped` check as passing only when you re-derive the
rule yourself:

- `archive head` reads `success`.
- The previous verified head reads `success` on every check, by name.
- `git diff --name-only <previous> HEAD` lists only `openspec/` and `todo/`.

A skipped matrix job shows as one check with its name unexpanded. Compare
against the previous head's names.

## What it does not cover

- **The push to the base.** That run still happens. When the base has not moved,
  it retests the tree the pull request's merge ref already tested. Dropping it is
  a separate decision: it also guards direct pushes, which a repository without
  branch protection cannot prevent.
- **A force-pushed base.** If the base was rewritten so that the base CI merged
  `before` with is not an ancestor of the current one, condition 4 can pass
  wrongly. This is rare enough to accept and too costly to detect without the
  old base SHA, which no API exposes reliably.
- **Pull requests from forks.** The head's branch is not in the clone, so
  condition 2 cannot be evaluated, and they always run in full.

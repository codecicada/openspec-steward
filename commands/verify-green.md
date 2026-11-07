---
name: verify-green
description: Confirm every required CI check passed against the pull request's current head SHA, by name, without trusting a watch command's exit code.
---

Report whether the named pull request is genuinely green.

```bash
SHA=$(gh pr view <n> --json headRefOid -q .headRefOid)
echo "PR head:    $SHA"
echo "local HEAD: $(git rev-parse HEAD)"
gh api "repos/<owner>/<repo>/commits/$SHA/check-runs" \
  -q '.check_runs[] | "\(.conclusion // .status)\t\(.name)"' | sort
gh pr view <n> --json mergeable,mergeStateStatus
```

Green means: **every** required check reads `success`, against that exact SHA,
and the SHA still matches local `HEAD`.

One exception, for an archive head in a repository wired with
`openspec-archive-head` (see `docs/archive-head.md`). There, a check reading
`skipped` counts as passing only if you re-derive the rule yourself rather than
trusting the job that decided it. All three of these must hold:

- `archive head` reads `success` on this SHA, and the spec checks job reads
  `success` too.
- The previous head reads `success` on **every** check, by name. That is the
  head you verified before archiving. List its checks with the same `gh api`
  call, against that SHA.
- Every path the push changed is under `openspec/` or `todo/`:

  ```bash
  git diff --name-only <previous head> HEAD
  ```

If any of the three fails, a `skipped` check is not green: name it. Compare by
name against the previous head's names. A name the previous head had and this
head lacks is outstanding, not skipped. That is what a gated matrix job leaves:
one check with its name unexpanded, such as `unit tests (node ${{ matrix.node }})`.
Also confirm `mergeStateStatus` reads `CLEAN`. A ruleset still requires the
missing names, and `BLOCKED` is how it says so.

Report anything else as not green, naming which checks are outstanding. In
particular:

- `gh pr checks --watch` exits 0 when its head is replaced mid-watch. Its exit
  code is not evidence.
- `mergeStateStatus: UNSTABLE` means checks are pending. `CLEAN` is the one to
  wait for.
- If every check reports at once on a first poll after a push, suspect that the
  API had not yet registered runs for the new head and is answering about the
  old one. Re-read the SHA.

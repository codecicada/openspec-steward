# Releasing

A release is a tag. Consumers reach the plugin through its own marketplace,
pinned in `.claude/settings.json` to a `ref`, and nothing is published to npm.
So a release needs three things: a commit carrying the new version, a signed tag
on that commit, and a GitHub release that says what changed.

## Choosing the version

Until 1.0:

- **minor** (`0.7.0` → `0.8.0`): a new command, check or bin, or anything a
  consumer has to act on when upgrading. A new check that fails an existing
  repository is a minor, even though it is a single new rule.
- **patch** (`0.6.0` → `0.6.1`): a fix that asks nothing of a consumer.

## 1. Open a release pull request

Branch from a current `master`. The bump touches exactly three files:

| file | field |
|---|---|
| `package.json` | `version` |
| `.claude-plugin/plugin.json` | `version` |
| `README.md` | the marketplace example's `ref`, so it pins the new tag |

```bash
git fetch -q origin
git switch -c release-X.Y.Z origin/master
sed -i 's/"version": "OLD"/"version": "X.Y.Z"/' package.json .claude-plugin/plugin.json
sed -i 's/"ref": "vOLD"/"ref": "vX.Y.Z"/' README.md
git diff --stat           # three files, one line each
npm test
node scripts/check-specs/index.mjs
git commit -m 'chore: release X.Y.Z' -- package.json .claude-plugin/plugin.json README.md
git push -u origin release-X.Y.Z
```

Title the pull request `chore: release X.Y.Z`. In the body, list the three
bumped files and name the pull requests the release ships, so a consumer can see
why it exists.

A release is not an OpenSpec change. It changes no behaviour, so it has no
proposal and no delta, and nothing to archive. Any change it ships must already
be archived on `master`. A release cut while a change is unarchived publishes a
tag whose specification still calls shipped code "proposed".

## 2. Verify green, then merge

Read every required check by name against the head SHA, the same way
`/verify-green` does. Do not trust a watch command's exit code:

```bash
gh pr view <n> --json headRefOid,mergeStateStatus -q '"\(.headRefOid) \(.mergeStateStatus)"'
gh api "repos/codecicada/openspec-steward/commits/<SHA>/check-runs" \
  -q '.check_runs[] | "\(.conclusion // .status)\t\(.name)"' | sort
```

The bump touches code paths, so the test jobs run in full. All of them must read
`success`, and `mergeStateStatus` must read `CLEAN`.

Merge is the human gate here too. Rebase-merge, pinned to the head you verified:

```bash
gh pr merge <n> --rebase --match-head-commit <SHA>
```

A rebase merge rewrites the commit, so the SHA on `master` is not the one CI
tested. Confirm that the tree is unchanged before you tag:

```bash
git fetch -q origin
test "$(git rev-parse origin/master^{tree})" = "$(git rev-parse <SHA>^{tree})" && echo same tree
```

## 3. Tag

Write the release notes to a file first (see below). The first line is the
title, and the rest is the body. Then tag the merged commit:

```bash
git tag -s --cleanup=verbatim -F notes.md vX.Y.Z origin/master
git tag -v vX.Y.Z                      # must report a good signature
git push origin vX.Y.Z
git ls-remote --tags origin 'refs/tags/vX.Y.Z*'
```

- `-s` makes the tag annotated and signed. Every release tag since the first has
  been signed. A consumer pinning a `ref` trusts that tag, so its origin should
  be checkable.
- `--cleanup=verbatim` keeps the notes as written. The default strips every line
  that starts with `#`, which would delete a Markdown heading without a word.
- `ls-remote` must print the tag and, on its `^{}` line, the merged commit. A tag
  that exists only locally is not a release.

## 4. Publish the GitHub release

```bash
tail -n +3 notes.md > body.md
gh release create vX.Y.Z --verify-tag --latest \
  --title "$(head -1 notes.md)" --notes-file body.md
```

`--verify-tag` refuses to create a tag of its own if the pushed one is missing.
Without it, a failed push in step 3 would still produce an unsigned release.

GitHub deletes the merged release branch. Nothing else needs cleaning up.

## Writing the notes

The tag message and the release body are the same text, so the history in git
and on GitHub cannot disagree.

- **Title:** `vX.Y.Z — <what changed, as a phrase>`, for example
  `v0.8.0 — each task declares whether its test comes first`.
- **Why first.** Open with the problem the release removes, then what now
  exists, with the pull request number.
- **Exact behaviour.** Give exact conditions, check names and refusal messages.
  "Improved the checker" tells a consumer nothing they can act on.
- **Upgrading.** Write this paragraph whenever an existing consumer's checks,
  init run or flow changes, and say what to do about it. Leave it out when
  nothing changes for them.
- **Since the last tag.** Name anything else that shipped, such as regenerated
  instruction files, and say what stayed the same (bins, exports, the config
  file contract).
- **Evidence.** End with the checks that were green, named, on the commit the
  tag points at.

The repository is public. The notes, like every file here, name no consumer
repository and no fact about one.

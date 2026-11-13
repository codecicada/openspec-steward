---
name: release
description: Release openspec-steward as vX.Y.Z — refuse a bad start, open the bump pull request, verify it green by name, draft the notes and stop for the merge; on a merge request, merge, tag with a signature and publish the GitHub release.
---

Release this repository as `vX.Y.Z`. Take `X.Y.Z` from the argument. If there is
none, ask for it and stop; choosing it is the human's call
([Choosing the version](../../docs/releasing.md#choosing-the-version)).

This command runs the steps of [`docs/releasing.md`](../../docs/releasing.md) in
order. The reasons live there; each step below links its section. It is
repo-local: it lives in `.claude/commands/`, not the plugin's `commands/`, so no
consumer receives it.

A release is not an OpenSpec change. It opens no flow and archives nothing.

There is **one stop**, at the merge. A merge request is the go-ahead for the
merge, the tag and the GitHub release, with the notes shown at that stop. Nothing
before it is published; everything after it is.

**1. Refuse a bad start.** Run every check before writing anything, and report
each one that fails.

```bash
echo 'X.Y.Z' | grep -Eqx '[0-9]+\.[0-9]+\.[0-9]+' || echo 'not X.Y.Z'
git status --porcelain                               # anything printed: refuse
git fetch -q origin --tags
git ls-tree -d --name-only origin/master -- openspec/changes/ \
  | grep -vx 'openspec/changes/archive'              # anything printed: refuse
CURRENT=$(git show origin/master:package.json | node -e \
  'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).version))')
node -e 'const [a,b]=process.argv.slice(1).map(v=>v.split(".").map(Number));
  const d=a[0]-b[0]||a[1]-b[1]||a[2]-b[2]; console.log(d>0?"forward":"not forward")' X.Y.Z "$CURRENT"
git ls-remote --tags origin 'refs/tags/vX.Y.Z'       # anything printed: refuse
```

- An unarchived change on `master` would ship code its specification still calls
  proposed ([Open a release pull request](../../docs/releasing.md#1-open-a-release-pull-request)).
- `not forward` refuses a version at or below `$CURRENT`, which `master` already
  carries.
- A tag already on the remote is a release that already happened.

**2. Open the bump pull request.**
([Open a release pull request](../../docs/releasing.md#1-open-a-release-pull-request))

```bash
git switch -c release-X.Y.Z origin/master
node --test scripts/release/lib/versions.test.mjs    # fails: master already disagrees; refuse
sed -i "s/\"version\": \"$CURRENT\"/\"version\": \"X.Y.Z\"/" package.json .claude-plugin/plugin.json
sed -i "s/\"ref\": \"v$CURRENT\"/\"ref\": \"vX.Y.Z\"/" README.md
git diff --stat                                      # three files, one line each
npm test                                             # includes the version test
node scripts/check-specs/index.mjs --root .
git commit -m 'chore: release X.Y.Z' -- package.json .claude-plugin/plugin.json README.md
git push -u origin release-X.Y.Z
```

Title the pull request `chore: release X.Y.Z`. In the body, list the three files
and name the pull requests the release ships:

```bash
git log --oneline "v$CURRENT"..origin/master
```

**3. Verify green by name** against the pull request's head, as `/verify-green`
does. ([Verify green, then merge](../../docs/releasing.md#2-verify-green-then-merge))

```bash
gh pr view <n> --json headRefOid,mergeStateStatus -q '"\(.headRefOid) \(.mergeStateStatus)"'
gh api "repos/codecicada/openspec-steward/commits/<SHA>/check-runs" \
  -q '.check_runs[] | "\(.conclusion // .status)\t\(.name)"' | sort
```

Every check must read `success`; the bump touches code paths, so none is
skipped. `mergeStateStatus` must read `CLEAN`. Anything `in_progress` means wait,
not proceed.

**4. Draft the notes, then stop.**
([Writing the notes](../../docs/releasing.md#writing-the-notes))

Write them outside the work tree, so the tree stays clean:

```bash
NOTES="$(git rev-parse --git-common-dir)/release-notes-X.Y.Z.md"
```

First line the title, `vX.Y.Z — <what changed>`; a blank line; then the body.
Then stop, and show: the pull request, the verified head SHA, each check by name,
and the notes in full. Merge only when a human asks. A request to change the
notes is answered by editing `$NOTES` and showing it again.

**5. On a merge request: merge, then check the tree.**

```bash
gh pr merge <n> --rebase --match-head-commit <SHA>
git fetch -q origin
test "$(git rev-parse origin/master^{tree})" = "$(git rev-parse <SHA>^{tree})" && echo same tree
```

No `same tree`: stop before tagging, and report both trees. The commit on
`master` is not what CI tested.

**6. Tag.** ([Tag](../../docs/releasing.md#3-tag))

```bash
git tag -s --cleanup=verbatim -F "$NOTES" vX.Y.Z origin/master
git tag -v vX.Y.Z                                    # must report a good signature
git push origin vX.Y.Z
git ls-remote --tags origin 'refs/tags/vX.Y.Z*'      # the tag, and ^{} on the merged commit
```

If `ls-remote` prints nothing, stop: the tag exists only here, and step 7 must
not run.

**7. Publish the GitHub release.**
([Publish the GitHub release](../../docs/releasing.md#4-publish-the-github-release))

```bash
tail -n +3 "$NOTES" > "$NOTES.body"
gh release create vX.Y.Z --verify-tag --latest \
  --title "$(head -1 "$NOTES")" --notes-file "$NOTES.body"
rm -f -- "$NOTES" "$NOTES.body"
```

**8. Report:** the release URL, the tag and the commit it points at, the merged
pull request, and the checks that were green on it.

## Never

Tag before the tree check prints `same tree`. Create a release without
`--verify-tag`. Tag without `--cleanup=verbatim`, which strips every `#` line
from the notes. Merge without a human's request. Name a consumer repository, or
state a fact about one, in the notes: this repository is public.

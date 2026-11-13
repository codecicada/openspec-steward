---
slug: add-release-command
title: Repo-local release command
created: 2026-11-12
source: session after the v0.8.0 release, while writing docs/releasing.md (#38)
---

## Why

The only things under `.claude/` are the OpenSpec commands and skills that
`openspec update` generates. Maintaining this repository has no command of its
own, so every release is run from memory or from prose. `docs/releasing.md`
(#38) writes the steps down. A doc can still be skimmed, though, and the steps
that matter most can be skipped without anyone noticing: checking the tree
after a rebase merge, the `--cleanup=verbatim` tag, and `--verify-tag`.

This package already turns its gated procedures into commands, such as
`/archive-on-green` and `/stop-change`, because prose alone could be skipped.
Its own release deserves the same treatment.

## What

- A repo-local `.claude/commands/release.md` (or a skill) taking `X.Y.Z`, which
  runs the steps of `docs/releasing.md` in order:
  1. refuse an unarchived change on `master`, and a version that does not move
     forward;
  2. make the three-file bump and open the pull request;
  3. verify green by name;
  4. stop for the merge request;
  5. after the merge, compare the trees, tag with signing, verify the tag on
     the remote, and publish with `--verify-tag`.
- The command links to the doc and does not repeat it, so there is one source
  for the reasons.
- It is kept out of the plugin's `commands/`, so consumers never receive it.

## Open questions

- Is a command worth its upkeep for a release cut every week or two? Or is the
  doc, plus `add-maintainer-guide` pointing at it, enough?
- Command or skill? A command runs once on request, which suits a release. A
  skill could also stop an agent that starts a release by hand.
- Should the version check (`package.json` equals `plugin.json` equals the
  README pin) also be a unit test, so a half-bumped release fails CI on its own?
- Does this depend on #38 merging first? The command should cite the merged
  doc.

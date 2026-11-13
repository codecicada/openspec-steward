# Design

## Context

`docs/releasing.md` has four steps: a three-file bump in its own pull request,
green by name and a rebase merge, a signed tag, a GitHub release. Releases are
cut about weekly. Nothing runs them, and nothing checks that the three version
fields agree. `.claude/` holds only generated OpenSpec files and
`.claude/CLAUDE.md`.

## Decision

1. **A command, not a skill.** `.claude/commands/release.md`, taking `X.Y.Z`.
   A release happens on request; a skill would trigger on every mention of a
   release and carry the steps a second time. Repo-local, so the plugin never
   ships it.
2. **It links the doc and does not repeat it.** Each step gives its commands
   and a link to the section that says why, so the reasons have one source.
3. **Refusals before anything is written:** a dirty tree; a change unarchived on
   `origin/master`; a version that does not move forward from `master`'s; a
   `vX.Y.Z` tag already on the remote; versions that already disagree on
   `master`.
4. **One stop.** The command drafts the release notes before it stops for the
   merge, and shows them with the verified head. A merge request is then the
   go-ahead for the merge, the tag and the release with those notes. A second
   stop before tagging would be a second gate for the same decision.
5. **The version test.** A pure `checkVersions` in
   `scripts/release/lib/versions.mjs` takes the three texts and returns one
   finding per file that disagrees with the others or has no version. Its test
   runs fixtures and then this repository's files, as the pin test does.

## Consequences

- A hand bump that misses a file turns `npm test` red.
- `AGENTS.md`'s `.claude/` rule names two hand-written files instead of one.
- The refusals are prose an agent runs, not a tested script: they guard a
  repo-local command run by maintainers, not a shipped one.

## Alternatives

- **A skill.** Rejected in 1.
- **Refusals as a script under `scripts/gates/`.** That harness watches the
  shipped commands refuse; this command is not shipped.
- **Doc only.** The skippable steps stay skippable.

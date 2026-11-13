# Working on openspec-steward

This file is for contributors, human or agent, working on this repository. How
to use the plugin in another repository is in the [README](README.md) and
[`docs/`](docs/README.md).

## Rules

- **Every change goes through the steward flow, here too.** Open it with
  `/start-change`, close it with `/stop-change`. The section at the end of this
  file gives the order. Archive comes before merge.
- **Merge only when a human asks**, and only after the head is verified green by
  name. Merge with a rebase, pinned to the verified head:
  `gh pr merge <n> --rebase --match-head-commit <SHA>`.
- **Stage explicit paths.** Never `git add <dir>` or `git add -A`: a directory
  add sweeps in unrelated files.
- **The repository is public.** No file, commit message, pull request or release
  note names a consumer repository or states a fact about one. Say "a consumer
  repository".
- **Never hand-edit the OpenSpec files in `.claude/`** (`commands/opsx/` and
  `skills/openspec-*`). `openspec update` generates them. Regenerate them with
  the CLI version their `generatedBy` names. `.claude/CLAUDE.md` is the one
  hand-written file there; it imports this one.
- **The package has no dependencies.** Tools that only the tests need are
  installed with `--no-save`, at an exact version.

## Map

| path | what it holds |
|---|---|
| `commands/` | the plugin's slash commands, shipped to consumers |
| `skills/` | the plugin's skills, shipped to consumers |
| `scripts/check-specs/` | `openspec-check-specs`: an I/O shell in `index.mjs` around pure checks in `lib/` |
| `scripts/init/` | `openspec-steward-init`, which writes the rules and the section below |
| `scripts/archive-head/` | `openspec-archive-head`, which decides when an archive head may skip its tests |
| `scripts/gates/` | the harness that watches each `/start-change` and `/stop-change` refusal refuse |
| `scripts/plugin/` | Claude Code's own validator over the manifests |
| `docs/` | how the plugin works and why, for its users |
| `openspec/` | this repository's own specifications and changes |
| `todo/` | deferred plans, each picked up with `/start-change <slug>` |

## Gates

Run all of these before pushing. CI runs the same jobs on every pull request.

```bash
npm test                              # unit tests; not `node --test <dir>`
npm run test:bin                      # packs and installs the bins as a consumer gets them
npm run test:gates                    # the start and stop refusals
npm run test:plugin                   # the plugin validator
node scripts/check-specs/index.mjs --root .
```

## Maintaining

- Releasing: [`docs/releasing.md`](docs/releasing.md).
- Planned maintenance work: the plans in [`todo/`](todo/).

<!-- openspec-steward:begin -->
## [OpenSpec change flow](https://github.com/codecicada/openspec-steward/blob/master/docs/change-flow.md)

From `/start-change` to `/stop-change`: explore -> propose -> apply -> open PR
-> verified green -> archive -> verify the apply -> merge when a human asks.
Artifacts follow `openspec/config.yaml`; this repository's own approval rules also bind.
<!-- openspec-steward:end -->

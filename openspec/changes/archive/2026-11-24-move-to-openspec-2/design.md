# Design

## Context

OpenSpec 2.0 moved its skills to `.agents/skills/`, linked them from
`.claude/skills/` and dropped the `opsx` commands. None of the 2.2.0 files
carries `generatedBy`. The pin test keeps only real directories, so it reads no
skill; reading through the links would then find no stamp.

Compared before the move, 1.17.0 against 2.2.0: `TASK_LINE_PATTERN` is
identical, `strict` passes this repository with the same JSON structure, and a
spec broken on purpose gives the same errors, warnings and exit code. 2.2.0
needs Node 22.20.0; 1.17.0 needed 22.12.

`openspec update --dry-run --json` (2.2.0) prints `changes`, `notes` and
`failures`. Probed on a copy of this repository, it plans:

| state | changes in the repository |
|---|---|
| current | none |
| a skill edited, its file removed, or all but the router removed | at least one |
| a link removed or replaced, the `.openspec-target` file removed | at least one |
| every skill removed | **none** |

It exits 0 whether or not it plans a change, and lists
`~/.config/openspec/config.json` on a machine that has none.

## Decision

1. **Two current pins**: the `strict` install in `ci.yml` and the `tdd.mjs`
   comment. `GENERATED_BY`, the `skills` input and its reader go.
2. **A disagreement names every current pin.** With two pins there is no
   majority, and the old rule would name only the older of the two.
3. **A generated-files check** replaces the stamp. A pure
   `scripts/pins/lib/generated.mjs` takes the command's exit code and output
   and the list of skills found, and returns findings. `scripts/pins/index.mjs`
   owns the process and the disk. It runs in the `specification checks` job,
   the one place the pinned CLI is installed.
4. **It fails closed**: a non-zero exit, output that is not the expected JSON,
   a reported failure, or no `.agents/skills/openspec*/SKILL.md` is a finding.
   The last covers the one state the dry run passes.
5. **Paths under `~` are ignored.** They are the machine's, not the
   repository's.
6. **The floor stays at 1.13.2.** Nothing here relies on a newer CLI in a
   consumer.

## Consequences

- CI proves the skills match the pinned CLI. The stamp only claimed it, and #21
  shipped a wrong one.
- `npm test` still installs nothing. A stale skill is red in
  `specification checks`, not in the unit tests.
- A CLI that changes the dry-run JSON turns the check red.
- A maintainer runs the check with the pinned CLI installed `--no-save`; a
  global CLI of another version gives another answer.

## Alternatives

- **Drop the stamp, replace it with nothing.** Smaller, but skills could drift
  from the pinned CLI unnoticed.
- **Follow the links and keep `generatedBy`.** 2.x does not write it.
- **Pin the `references` hash of the router skill.** It is in one skill only
  and names no version.
- **Run `openspec update` and read `git status`.** Writes to the tree being
  checked.

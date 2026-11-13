# Maintaining the pinned tools

This repository pins every external tool to an exact version, so that an
upstream release cannot redden a build that changed nothing here. This page says
how to move each pin and how to tell that the move is good. A bump is a change
like any other: it goes through `/start-change`, and it lands in its own commit.

## OpenSpec CLI

OpenSpec is pinned twice, on purpose:

| pin | where | version | what it is for |
|---|---|---|---|
| **floor** | `scripts/check-specs/smoke-bin.sh` `OPENSPEC_VERSION` | 1.13.2 | the oldest CLI steward supports; the smoke test installs it into a consumer |
| **current** | `.github/workflows/ci.yml`, the `specification checks` install | 1.17.0 | `strict` in CI |
| **current** | `generatedBy` in each `.claude/skills/openspec-*/SKILL.md` | 1.17.0 | the CLI that wrote the files `openspec update` generates |
| **current** | the `TASK_LINE` comment in `scripts/check-specs/lib/tdd.mjs` | 1.17.0 | the CLI `TASK_LINE_PATTERN` was compared against |

`scripts/pins/lib/pins.test.mjs` holds them together: `npm test` fails when the
current pins name different versions, when the floor is above the current
version, or when it cannot find a pin. The floor and the current version are
meant to differ.

Always install the scoped package, `@fission-ai/openspec`. The bare `openspec` on
npm is an unrelated package.

### Moving the current version

All of it in one change, and one commit for the move. `X.Y.Z` is the new version.

1. **Install it without saving.** The package keeps zero dependencies.

   ```bash
   npm install --no-save --no-audit --no-fund @fission-ai/openspec@X.Y.Z
   npx --no-install openspec --version     # must print X.Y.Z, not a global CLI
   ```

2. **Regenerate, then regenerate again.** Never hand-edit the generated files.

   ```bash
   npx --no-install openspec update
   grep -rh generatedBy .claude | sort | uniq -c    # every line reads X.Y.Z
   npx --no-install openspec update --force
   git status --porcelain                            # nothing new since the first run
   ```

   The second run is the check #21 skipped: it committed output from 1.13.2
   labelled as 1.14.1, and #22 had to restore the files. Nothing outside
   `.claude/` should change.

3. **Compare the task-line pattern.** `tdd.mjs` copies OpenSpec's own pattern so
   the `tdd` check counts the same tasks OpenSpec does.

   ```bash
   grep -o 'TASK_LINE_PATTERN = .*;' node_modules/@fission-ai/openspec/dist/utils/task-progress.js
   grep -A1 '^const TASK_LINE =' scripts/check-specs/lib/tdd.mjs
   ```

   Identical: move only the version in the comment above `TASK_LINE`. Different:
   copy the new pattern and add a `tdd.test.mjs` case for the line it now
   counts differently, red first.

4. **Move the CI pin** in `.github/workflows/ci.yml`, then run `strict` on the
   new CLI before CI does:

   ```bash
   node scripts/check-specs/index.mjs --root .
   npm test                                          # the pin test passes
   ```

5. **Clean up.** `rm -rf node_modules`. This repository has no `.gitignore`, so
   stage explicit paths as always.

### Moving the floor

The floor moves only when steward starts to rely on something the old CLI does
not have. Raise it to the oldest version that has it, not to the newest.

- Change `OPENSPEC_VERSION` in `smoke-bin.sh` and run `npm run test:bin`.
- Check the Node it needs: `npm view @fission-ai/openspec@X.Y.Z engines.node`.
  1.15.x and earlier need Node 20.19; 1.16.0 and later need 22.12. A floor past
  1.15.x raises the Node a consumer needs for the `strict` check.
- `scripts/check-specs/lib/validate.test.mjs` reads the output shape 1.13.2 and
  1.14.0 print. Rerun it against what the new floor prints.
- Update the README if what a consumer has to install changes.

### A new major version

Look before any pin moves to it, in a change of its own. Read the release notes
for anything `strict`, the task-line pattern or `generatedBy` rely on. OpenSpec
has announced that 2.0 drops the command files under `.claude/commands/opsx/`.

## Claude Code

Pinned once, as `CLAUDE_CODE_VERSION` in `scripts/plugin/validate.sh`, for
`claude plugin validate --strict`.

1. Bump it in its own commit.
2. Run `npm run test:plugin`. Observation A says this tree validates. B, C and
   D are the test of the bump: each breaks a copy of the plugin and must exit 1
   naming what it broke. C fails only under `--strict`, so it proves the flag
   still reaches the validator.
3. Read the observations, not only the exit code. A new validator that stopped
   checking something would leave A green.

## GitHub Actions

`actions/checkout` and `actions/setup-node` are pinned by major version in
`.github/workflows/ci.yml`. Move every use of one action together, and read the
next pull request's checks by name: a job that no longer runs shows as missing,
not as failed.

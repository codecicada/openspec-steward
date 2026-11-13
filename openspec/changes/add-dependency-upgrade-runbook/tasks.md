# Tasks

## 1. Pin test

- [ ] 1.1 Write `scripts/pins/lib/pins.test.mjs` with fixture cases for the four scenarios of `tool-pins`, and one case that reads this repository's `smoke-bin.sh`, `ci.yml`, `.claude/skills/*/SKILL.md` and `tdd.mjs` and expects no finding. Run it red with no `pins.mjs`. Verify: `node --test scripts/pins/lib/pins.test.mjs` fails. Accept: the failure is the missing module.
  - tdd: yes — the test is the requirement
- [ ] 1.2 Write `scripts/pins/lib/pins.mjs`: `readPins(texts)` returns `{floor, current: {ci, generatedBy, tdd}}` or a finding per file whose pin it cannot read; `checkPins(pins)` returns findings for disagreeing current pins and a floor above current. Verify: the fixture cases pass and the repository case fails, naming CI at 1.15.0. Accept: no disk I/O in `pins.mjs`.
  - tdd: no — made green by 1.1

## 2. Bump the current version to 1.17.0

- [ ] 2.1 Install `@fission-ai/openspec@1.17.0` with `--no-save`, run `npx --no-install openspec update`, then run it again. Verify: every `generatedBy` reads `1.17.0` and the second run leaves `git status` unchanged. Accept: no file outside `.claude/` changed.
  - tdd: no — generated output, held by 1.1
- [ ] 2.2 Move the CI `strict` pin in `.github/workflows/ci.yml` and the version in the `tdd.mjs` `TASK_LINE` comment to 1.17.0, after comparing `TASK_LINE_PATTERN` in the 1.17.0 `dist/utils/task-progress.js` with `TASK_LINE`. Verify: `node scripts/check-specs/index.mjs --root .` passes on 1.17.0 and 1.1 passes. Accept: `TASK_LINE` itself is unchanged.
  - tdd: no — 1.1 goes green on it

## 3. Runbook

- [ ] 3.1 Write `docs/maintaining.md`: OpenSpec (floor and current, the steps of 2.1 and 2.2, the Node floor each line needs), Claude Code (bump alone, read observations B and C of `test:plugin`), GitHub Actions. Verify: each section names the command that proves the bump. Accept: no consumer repository is named.
  - tdd: no — prose
- [ ] 3.2 Point each pin's comment in `smoke-bin.sh`, `ci.yml` and `validate.sh` at `docs/maintaining.md`, and say which pin is the floor. Link the runbook from `docs/README.md` and `AGENTS.md`, and add `scripts/pins/` to the `AGENTS.md` map. Verify: `grep -n maintaining.md scripts/check-specs/smoke-bin.sh .github/workflows/ci.yml scripts/plugin/validate.sh docs/README.md AGENTS.md` hits all five.
  - tdd: no — comments and links

## 4. Integration

- [ ] 4.1 Run `npm test`, `npm run test:bin`, `npm run test:gates`, `npm run test:plugin` and `node scripts/check-specs/index.mjs --root .`. Accept: all five exit 0.
  - tdd: no — runs existing suites

# Tasks

## 1. Pin test

- [ ] 1.1 In `scripts/pins/lib/pins.test.mjs`, drop `generatedBy` and `skills` from the fixture and the repository case, remove "one generated file moved alone", and make "one current pin moved alone" expect both files and both versions. Verify: `node --test scripts/pins/lib/pins.test.mjs` fails on that case. Accept: no case reads `.claude/skills/`.
  - tdd: yes — with two pins the current code names only the older one
- [ ] 1.2 In `scripts/pins/lib/pins.mjs`, remove `GENERATED_BY`, `SKILLS_DIR` and the `skills` input, and report every current pin when they disagree. Update the header comment. Verify: `node --test scripts/pins/lib/pins.test.mjs` passes. Accept: `grep -c generatedBy scripts/pins/lib/pins.mjs` prints 0.
  - tdd: no — made green by 1.1

## 2. Generated-files check

- [ ] 2.1 Write `scripts/pins/lib/generated.test.mjs` with one case per scenario of "Generated files match the pinned CLI", and each unreadable form as its own case. Verify: `node --test scripts/pins/lib/generated.test.mjs` fails on the missing module. Accept: the fixture JSON is copied from a real 2.2.0 run.
  - tdd: yes — the test is the requirement
- [ ] 2.2 Write `scripts/pins/lib/generated.mjs`: `checkGenerated({ status, stdout, skills })` returns findings. Verify: 2.1 passes. Accept: no disk or process use in it.
  - tdd: no — made green by 2.1
- [ ] 2.3 Write `scripts/pins/index.mjs`, which lists `.agents/skills/openspec*/SKILL.md`, runs `npx --no-install openspec update --dry-run --json` and exits 1 on any finding. Verify: with `@fission-ai/openspec@2.2.0` installed `--no-save`, it exits 0 here, and 1 after editing a skill and after removing `.agents/`, in a scratch copy. Accept: it writes nothing to the repository.
  - tdd: no — I/O shell, observed against the real CLI

## 3. Move the current version to 2.2.0

- [ ] 3.1 Move the install in `.github/workflows/ci.yml` to 2.2.0, add `node scripts/pins/index.mjs` to the `specification checks` job and rewrite the comment that names `generatedBy`. Verify: `node scripts/check-specs/index.mjs --root .` passes on 2.2.0. Accept: the job resolves a Node of 22.20.0 or newer.
  - tdd: no — configuration, held by 1.1
- [ ] 3.2 Compare `TASK_LINE_PATTERN` in the 2.2.0 `dist/utils/task-progress.js` with `TASK_LINE`, then move the version in the `scripts/check-specs/lib/tdd.mjs` comment. Verify: `npm test` passes. Accept: `TASK_LINE` itself is unchanged.
  - tdd: no — 1.1 goes green on it

## 4. Docs

- [ ] 4.1 Update `docs/maintaining.md`: the pin table, the regenerate step, the Node line for 2.x and the "new major version" section. Verify: `grep -c generatedBy docs/maintaining.md` prints 0. Accept: each step names the command that proves it.
  - tdd: no — prose
- [ ] 4.2 In `AGENTS.md`, rewrite the never-hand-edit rule for `.agents/skills/` and its links, and the map line for `scripts/pins/`. Verify: `grep -n 'opsx\|generatedBy' AGENTS.md` prints nothing. Accept: the two hand-written `.claude/` files stay named.
  - tdd: no — prose
- [ ] 4.3 Replace `opsx explore` in `docs/change-flow.md` and `skills/openspec-change-flow/SKILL.md`. Verify: `grep -rn opsx docs skills` prints nothing. Accept: the mermaid diagram still parses.
  - tdd: no — prose

## 5. Integration

- [ ] 5.1 Run `npm test`, `npm run test:bin`, `npm run test:gates`, `npm run test:plugin`, `node scripts/check-specs/index.mjs --root .` and `node scripts/pins/index.mjs` with 2.2.0 installed `--no-save`, then `rm -rf node_modules`. Accept: all six exit 0.
  - tdd: no — runs existing suites

# Tasks

## 1. Check

- [x] 1.1 Write `scripts/check-specs/lib/tdd.test.mjs` with one case per scenario of "Every task declares TDD" and "A done test-first task records its red run", against a stub `checkTddDeclarations` in `scripts/check-specs/lib/tdd.mjs` that returns `[]`. Run it red, then implement: task lines use OpenSpec's `TASK_LINE_PATTERN`, sub-lines run to the next task or heading. Verify: `node --test scripts/check-specs/lib/tdd.test.mjs` passes. Accept: the file is pure, with no `node:fs` import.
  - tdd: yes — the parser is where a silent pass would hide
  - red: `node --test scripts/check-specs/lib/tdd.test.mjs` → `ℹ fail 11` against the stub, first `✖ an undeclared task fails, naming file, line and task text`
- [x] 1.2 Watch the tests fail before trusting them: accept `maybe` as a value, then drop the done check. Each mutation must redden only its own scenarios. Revert both. Accept: the result is noted in the test file's header comment.
  - tdd: no — a mutation probe of 1.1's tests, not new behaviour

## 2. Wiring

- [x] 2.1 In `scripts/check-specs/smoke-bin.sh`, change `passed (4)` to `passed (5)` and add a case: a fixture change whose `tasks.md` has an undeclared task exits 1 with a `tdd:` line. Run it red, then in `scripts/check-specs/index.mjs` read each active change's `tasks.md` and add `createResult('tdd', ...)`; update the header comment and `USAGE`. Verify: `npm run test:bin` passes.
  - tdd: yes — the wiring is only proven by the bin failing on a real fixture
  - red: `npm run test:bin` → `FAIL undeclared task should fail naming tdd (got 0: specification checks passed (4): …)`, 3 observations failed

## 3. Rule

- [x] 3.1 In `scripts/init/lib/rules.test.mjs`, assert one `tasks` item of `STEWARD_RULES` names `tdd: yes|no` and `red:`. Run it red, then add the quoted item to `rules.tasks` in `openspec/config.yaml` and to `STEWARD_RULES` in `scripts/init/lib/rules.mjs`. Verify: `npm test` passes, including the existing equality test.
  - tdd: yes — the equality test alone passes with the item missing from both
  - red: `node --test scripts/init/lib/rules.test.mjs` → `✖ a steward tasks item requires the tdd declaration and its red line`

## 4. Flow docs

- [x] 4.1 In `skills/openspec-change-flow/SKILL.md`, add "Declaring TDD per task": declared at propose after explore, red recorded at apply before the fix, read in the PR at merge, no new gate. Verify: `npm run test:gates` and `npm run test:plugin` pass.
  - tdd: no — prose; the gates harness covers its fences
- [x] 4.2 In `docs/checker.md`, add a `tdd` section under "The checks", and update the run diagram and the check count. Verify: `grep -n '### \`tdd\`' docs/checker.md` hits.
  - tdd: no — prose
- [x] 4.3 Update the check count and list in `README.md`, `scripts/check-specs/lib/README.md`, `docs/design.md` and `docs/change-flow.md`. Verify: `grep -rn -i 'four checks' README.md docs scripts` prints only `docs/change-flow.md`'s two lines about `/start-change`'s own checks.
  - tdd: no — prose

## 5. Integration

- [x] 5.1 Run `npm test`, `npm run test:bin`, `npm run test:gates`, `npm run test:plugin` and `node scripts/check-specs/index.mjs --root .`. Accept: all five exit 0, and the last prints `passed (5)` with this change's own tasks checked.
  - tdd: no — runs existing suites
- [x] 5.2 Run `openspec list` and confirm this change reports as many tasks as `tasks.md` has boxed lines. Accept: the `tdd:` and `red:` sub-bullets are not counted.
  - tdd: no — an observation of OpenSpec, not code

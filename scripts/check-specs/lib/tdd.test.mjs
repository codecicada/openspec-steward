/**
 * Watched failing: written against a stub returning `[]`, 11 of 17 went red.
 * Then two mutations of `tdd.mjs`, each reverted:
 * - accepting `maybe` as a value reddened only "a value other than yes or no";
 * - dropping the done check reddened only the two red-line cases.
 *
 * Archived changes and changes with no `tasks.md` are skipped by `index.mjs`,
 * not here; `smoke-bin.sh` covers that wiring.
 */
import { deepStrictEqual, match, strictEqual } from 'node:assert/strict';
import { test } from 'node:test';
import { checkTddDeclarations } from './tdd.mjs';

const PATH = 'openspec/changes/demo/tasks.md';

function check(text) {
  return checkTddDeclarations({ path: PATH, text });
}

test('a task declared tdd: no with a reason passes', () => {
  deepStrictEqual(
    check(`## 1. Docs

- [ ] 1.1 Update the README
  - tdd: no — docs only
`),
    [],
  );
});

test('every separator the rule names is accepted', () => {
  deepStrictEqual(
    check(`- [ ] 1.1 A
  - tdd: no — em dash
- [ ] 1.2 B
  - tdd: no – en dash
- [ ] 1.3 C
  - tdd: no - hyphen
- [ ] 1.4 D
  - tdd: no: colon
`),
    [],
  );
});

test('an undeclared task fails, naming file, line and task text', () => {
  const failures = check(`# Tasks

- [ ] 1.1 Write the parser
`);

  strictEqual(failures.length, 1);
  match(failures[0].what, /openspec\/changes\/demo\/tasks\.md:3/);
  match(failures[0].what, /1\.1 Write the parser/);
  match(failures[0].what, /no tdd declaration/);
});

test('a value other than yes or no fails', () => {
  const failures = check(`- [ ] 1.1 Write the parser
  - tdd: maybe — later
`);

  strictEqual(failures.length, 1);
  match(failures[0].what, /yes or no/);
});

test('a declaration with no reason fails', () => {
  const failures = check(`- [ ] 1.1 Write the parser
  - tdd: yes
`);

  strictEqual(failures.length, 1);
  match(failures[0].what, /no reason/);
});

test('a separator with nothing after it is no reason', () => {
  const failures = check(`- [ ] 1.1 Write the parser
  - tdd: yes —
`);

  strictEqual(failures.length, 1);
  match(failures[0].what, /no reason/);
});

test('two declarations on one task yield one finding', () => {
  const failures = check(`- [ ] 1.1 Write the parser
  - tdd: yes — parser
  - tdd: no — changed my mind
`);

  strictEqual(failures.length, 1);
  match(failures[0].what, /2 tdd declarations/);
});

test('a done tdd: yes task with no red line fails', () => {
  const failures = check(`- [x] 1.1 Write the parser
  - tdd: yes — parser edge cases
`);

  strictEqual(failures.length, 1);
  match(failures[0].what, /no red/);
});

test('a done tdd: yes task with a red line passes', () => {
  deepStrictEqual(
    check(`- [x] 1.1 Write the parser
  - tdd: yes — parser edge cases
  - red: npm test → ✖ undeclared task is a finding
`),
    [],
  );
});

test('an empty red line is no red line', () => {
  const failures = check(`- [x] 1.1 Write the parser
  - tdd: yes — parser edge cases
  - red:
`);

  strictEqual(failures.length, 1);
  match(failures[0].what, /no red/);
});

test('a tdd: yes task not done yet needs no red line', () => {
  deepStrictEqual(
    check(`- [ ] 1.1 Write the parser
  - tdd: yes — parser edge cases
`),
    [],
  );
});

test('a done tdd: no task needs no red line', () => {
  deepStrictEqual(
    check(`- [x] 1.1 Update the README
  - tdd: no — docs only
`),
    [],
  );
});

test("a declaration under the next task does not count for this one", () => {
  const failures = check(`- [ ] 1.1 First
- [ ] 1.2 Second
  - tdd: no — docs only
`);

  strictEqual(failures.length, 1);
  match(failures[0].what, /1\.1 First/);
});

test('a heading ends a task, so a declaration under it is not the task\'s', () => {
  const failures = check(`- [ ] 1.1 First

## 2. Next
  - tdd: no — stray
`);

  strictEqual(failures.length, 1);
  match(failures[0].what, /1\.1 First/);
});

test('task lines are found the way OpenSpec finds them', () => {
  const failures = check(`* [ ] star bullet
+ [X] plus bullet, capital X
1. [ ] numbered
    - [ ] 1.1.1 nested
- [x](./not-a-task) a link
`);

  strictEqual(failures.length, 4);
});

test('a boxed tdd line is a task, not a declaration', () => {
  const failures = check(`- [ ] 1.1 First
  - [ ] tdd: no — boxed by mistake
`);

  strictEqual(failures.length, 2);
});

test('a file with no tasks passes', () => {
  deepStrictEqual(check('# Tasks\n\nNothing yet.\n'), []);
});

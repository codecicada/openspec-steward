/**
 * The per-task TDD check: every task of an unarchived change declares whether
 * it is test-first, and a done test-first task records the run that was red.
 *
 * Under each task, as un-boxed sub-bullets:
 *
 *     - [x] 1.1 Write the parser
 *       - tdd: yes — parser edge cases
 *       - red: npm test → ✖ undeclared task is a finding
 *
 * The declaration is intent, stated rather than inferred: without it, a green
 * run cannot say which tasks were proven red before their fix. The `red:` line
 * is a claim, not a rerun. The check asks only that it is there.
 *
 * A task is what OpenSpec counts as one, so both agree on the count. The
 * sub-bullets stay un-boxed for the same reason: a boxed one is a task, and
 * would change OpenSpec's progress.
 *
 * Pure: the caller supplies the file text; `index.mjs` owns the reads.
 */

import { createFailure } from './report.mjs';

/**
 * OpenSpec's own task line, copied from `TASK_LINE_PATTERN` in
 * `@fission-ai/openspec` `dist/utils/task-progress.js` (1.16.1). Any bullet
 * (`-`, `*`, `+`, `1.`, `1)`) at any indent, then a box. A box marked `x` or
 * `X` is done. `- [x](...)` is a link, not a task; a whitespace-only box such
 * as `- [ ](...)` still counts, as it does for OpenSpec.
 */
const TASK_LINE =
  /^\s*(?:[-*+]|\d{1,9}[.)])\s*\[(?:\s*([^\]\s]?)\s*\](?![([])|\s+\])\s*(.*)/;

/** A Markdown heading ends the task above it. */
const HEADING = /^\s*#{1,6}(?:\s|$)/;

const DECLARATION = /^\s*[-*+]\s+tdd:(.*)$/i;
const RED = /^\s*[-*+]\s+red:(.*)$/i;

/** `yes`/`no` and what follows them, from the text after `tdd:`. */
const VALUE = /^\s*([^\s—–:-]+)\s*(.*)$/;

/** A reason is the text after a separator, and must not be empty. */
const REASON = /^[—–:-]+\s*(\S.*)$/;

const FORM = '"  - tdd: yes — <reason>" or "  - tdd: no — <reason>"';

/** Each task with its line number, done flag, text and following sub-lines. */
function collectTasks(text) {
  const tasks = [];
  let current;

  for (const [index, line] of text.split('\n').entries()) {
    const match = line.match(TASK_LINE);
    if (match) {
      current = {
        line: index + 1,
        done: (match[1] ?? '').toLowerCase() === 'x',
        description: match[2].trim(),
        sublines: [],
      };
      tasks.push(current);
    } else if (HEADING.test(line)) {
      current = undefined;
    } else if (current) {
      current.sublines.push(line);
    }
  }

  return tasks;
}

function shorten(text, max = 60) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/** The one finding for a task, or `null` when it holds. */
function checkTask(task) {
  const declarations = task.sublines
    .map((line) => line.match(DECLARATION))
    .filter(Boolean)
    .map((match) => match[1]);

  if (declarations.length === 0) {
    return [
      'no tdd declaration',
      `add ${FORM} under the task, decided at propose`,
    ];
  }
  if (declarations.length > 1) {
    return [
      `${declarations.length} tdd declarations`,
      'keep the one that states the decision and delete the others',
    ];
  }

  const [, value = '', tail = ''] = declarations[0].match(VALUE) ?? [];
  const decision = value.toLowerCase();
  if (decision !== 'yes' && decision !== 'no') {
    return [
      `tdd value "${value}" is not yes or no`,
      `write ${FORM}`,
    ];
  }
  if (!REASON.test(tail.trim())) {
    return [
      `tdd: ${decision} gives no reason`,
      `add the reason after a separator: ${FORM}`,
    ];
  }

  if (task.done && decision === 'yes') {
    const red = task.sublines
      .map((line) => line.match(RED))
      .filter((match) => match && match[1].trim() !== '');
    if (red.length === 0) {
      return [
        'done with tdd: yes but no red line',
        'record the failing run from before the fix as "  - red: <command> → <failing line>"',
      ];
    }
  }

  return null;
}

/**
 * Report every task in one `tasks.md` that breaks the declaration rule.
 *
 * `path` names the file in each finding; `text` is its contents. One finding
 * per task at most: the first rule it breaks.
 */
export function checkTddDeclarations({ path, text = '' }) {
  const failures = [];

  for (const task of collectTasks(text)) {
    const finding = checkTask(task);
    if (finding) {
      const [what, fix] = finding;
      failures.push(
        createFailure(
          `${path}:${task.line} "${shorten(task.description)}": ${what}`,
          fix,
        ),
      );
    }
  }

  return failures;
}

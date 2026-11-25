import { readFileSync } from 'node:fs';
import { deepStrictEqual, match, strictEqual } from 'node:assert/strict';
import { test } from 'node:test';
import { checkPins } from './pins.mjs';

// The three files, cut down to the lines that carry a pin.
const texts = ({ floor = '1.13.2', ci = '2.2.0', tdd = '2.2.0' } = {}) => ({
  smoke: `OPENSPEC_VERSION='@fission-ai/openspec@${floor}'\n`,
  ci: `      - run: npm install --no-save --no-audit --no-fund @fission-ai/openspec@${ci}\n`,
  tdd: ` * \`@fission-ai/openspec\` \`dist/utils/task-progress.js\` (${tdd}). Any bullet\n`,
});

test('pins agree', () => {
  deepStrictEqual(checkPins(texts()), []);
});

test('one current pin moved alone', () => {
  // Either pin may be the one left behind, and two pins have no majority.
  for (const moved of [{ ci: '2.3.0' }, { tdd: '2.3.0' }]) {
    const findings = checkPins(texts(moved)).join('\n');
    match(findings, /ci\.yml/);
    match(findings, /tdd\.mjs/);
    match(findings, /2\.3\.0/);
    match(findings, /2\.2\.0/);
  }
});

test('floor above current', () => {
  const findings = checkPins(texts({ floor: '2.3.0' }));
  strictEqual(findings.length, 1);
  match(findings[0], /floor/);
  match(findings[0], /smoke-bin\.sh/);
});

test('floor compared as numbers, not text', () => {
  deepStrictEqual(checkPins(texts({ floor: '1.9.0', ci: '1.17.0', tdd: '1.17.0' })), []);
});

test('a pin that cannot be found', () => {
  for (const [file, name] of [
    ['smoke', /smoke-bin\.sh/],
    ['ci', /ci\.yml/],
    ['tdd', /tdd\.mjs/],
  ]) {
    const t = texts();
    t[file] = 'nothing pinned here\n';
    const findings = checkPins(t);
    strictEqual(findings.length, 1, file);
    match(findings[0], name);
  }
});

// This repository's own pins, read from disk: the test the scenarios exist for.
test('this repository keeps its pins together', () => {
  const read = (path) => readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8');

  deepStrictEqual(
    checkPins({
      smoke: read('scripts/check-specs/smoke-bin.sh'),
      ci: read('.github/workflows/ci.yml'),
      tdd: read('scripts/check-specs/lib/tdd.mjs'),
    }),
    [],
  );
});

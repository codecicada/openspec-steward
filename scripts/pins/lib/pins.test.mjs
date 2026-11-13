import { readdirSync, readFileSync } from 'node:fs';
import { deepStrictEqual, match, strictEqual } from 'node:assert/strict';
import { test } from 'node:test';
import { checkPins } from './pins.mjs';

// The four files, cut down to the lines that carry a pin.
const texts = ({ floor = '1.13.2', ci = '1.17.0', generatedBy = '1.17.0', tdd = '1.17.0' } = {}) => ({
  smoke: `OPENSPEC_VERSION='@fission-ai/openspec@${floor}'\n`,
  ci: `      - run: npm install --no-save --no-audit --no-fund @fission-ai/openspec@${ci}\n`,
  tdd: ` * \`@fission-ai/openspec\` \`dist/utils/task-progress.js\` (${tdd}). Any bullet\n`,
  skills: {
    'openspec-explore/SKILL.md': `metadata:\n  generatedBy: "${generatedBy}"\n`,
    'openspec-propose/SKILL.md': `metadata:\n  generatedBy: "${generatedBy}"\n`,
  },
});

test('pins agree', () => {
  deepStrictEqual(checkPins(texts()), []);
});

test('one current pin moved alone', () => {
  const findings = checkPins(texts({ ci: '1.18.0' }));
  strictEqual(findings.length, 1);
  match(findings[0], /ci\.yml/);
  match(findings[0], /1\.18\.0/);
  match(findings[0], /1\.17\.0/);
});

test('one generated file moved alone', () => {
  const t = texts();
  t.skills['openspec-propose/SKILL.md'] = 'metadata:\n  generatedBy: "1.16.0"\n';
  const findings = checkPins(t);
  strictEqual(findings.length, 1);
  match(findings[0], /openspec-propose\/SKILL\.md/);
  match(findings[0], /1\.16\.0/);
});

test('floor above current', () => {
  const findings = checkPins(texts({ floor: '1.18.0' }));
  strictEqual(findings.length, 1);
  match(findings[0], /floor/);
  match(findings[0], /smoke-bin\.sh/);
});

test('floor compared as numbers, not text', () => {
  deepStrictEqual(checkPins(texts({ floor: '1.9.0', ci: '1.17.0' })), []);
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

  const t = texts();
  t.skills['openspec-explore/SKILL.md'] = 'no metadata\n';
  match(checkPins(t)[0], /openspec-explore\/SKILL\.md/);

  match(checkPins({ ...texts(), skills: {} })[0], /generatedBy/);
});

// This repository's own pins, read from disk: the test the scenarios exist for.
test('this repository keeps its pins together', () => {
  const read = (path) => readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8');
  const skillsDir = new URL('../../../.claude/skills/', import.meta.url);
  const skills = Object.fromEntries(
    readdirSync(skillsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && entry.name.startsWith('openspec-'))
      .map((entry) => [`${entry.name}/SKILL.md`, read(`.claude/skills/${entry.name}/SKILL.md`)]),
  );

  deepStrictEqual(
    checkPins({
      smoke: read('scripts/check-specs/smoke-bin.sh'),
      ci: read('.github/workflows/ci.yml'),
      tdd: read('scripts/check-specs/lib/tdd.mjs'),
      skills,
    }),
    [],
  );
});

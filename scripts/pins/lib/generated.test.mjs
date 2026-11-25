import { deepStrictEqual, match, strictEqual } from 'node:assert/strict';
import { test } from 'node:test';
import { checkGenerated } from './generated.mjs';

// Copied from `openspec update --dry-run --json` (2.2.0), on a machine with no
// OpenSpec config and, for the first entry, a hand-edited skill.
const EDITED = { path: '.agents/skills/openspec-propose/SKILL.md', action: 'update', tool: 'openspec' };
const MACHINE = { path: '~/.config/openspec/config.json', action: 'add', tool: 'openspec' };

const plan = (changes = [], failures = []) => JSON.stringify({ changes, notes: [], failures });
const skills = ['openspec-explore/SKILL.md', 'openspec-propose/SKILL.md'];
const run = (over = {}) => checkGenerated({ status: 0, stdout: plan(), skills, ...over });

test('generated files are current', () => {
  deepStrictEqual(run(), []);
});

test('a generated file is stale', () => {
  const findings = run({ stdout: plan([EDITED]) });
  strictEqual(findings.length, 1);
  match(findings[0], /\.agents\/skills\/openspec-propose\/SKILL\.md/);
  match(findings[0], /update/);
});

test("only the machine's own config would change", () => {
  deepStrictEqual(run({ stdout: plan([MACHINE]) }), []);
});

test("the machine's config does not hide a stale file", () => {
  strictEqual(run({ stdout: plan([MACHINE, EDITED]) }).length, 1);
});

test('a path outside the repository that is not under ~ is a finding', () => {
  strictEqual(run({ stdout: plan([{ ...MACHINE, path: '/opt/openspec/config.json' }]) }).length, 1);
});

test('no generated skill is found', () => {
  // The dry run plans nothing once every skill is gone, so this is the only guard.
  const findings = run({ skills: [] });
  strictEqual(findings.length, 1);
  match(findings[0], /no .*skill.* found/i);
});

test('the dry run cannot be read', () => {
  for (const [name, over, expected] of [
    ['a non-zero exit', { status: 1, stdout: '' }, /exited 1/],
    ['a run that never started', { status: null, stdout: '' }, /exited null/],
    ['a non-zero exit with a clean plan', { status: 1 }, /exited 1/],
    ['not JSON', { stdout: 'No changes: skills are up to date.\n' }, /JSON/],
    ['nothing', { stdout: '' }, /JSON/],
    ['JSON that is not an object', { stdout: 'null' }, /changes/],
    ['no changes list', { stdout: '{"failures":[]}' }, /changes/],
    ['no failures list', { stdout: '{"changes":[]}' }, /failures/],
    ['a change with no path', { stdout: plan([{ action: 'update' }]) }, /path/],
    ['a reported failure', { stdout: plan([], [{ path: 'x', error: 'denied' }]) }, /denied/],
  ]) {
    const findings = run(over);
    strictEqual(findings.length, 1, name);
    match(findings[0], expected, name);
  }
});

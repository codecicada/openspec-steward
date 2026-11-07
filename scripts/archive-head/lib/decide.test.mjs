/**
 * One case per scenario in `archive-head-ci`, plus one real repository.
 *
 * Watched failing before being trusted. Two mutations, each reddening only the
 * scenario that reads it:
 * - dropping the `base` ancestor check reddens "base moved";
 * - accepting `skipped` as green reddens "previous head not green".
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

import { decide } from './decide.mjs';
import { gitAdapter } from './git.mjs';

const BEFORE = 'a'.repeat(40);
const HEAD = 'b'.repeat(40);
const GREEN = Array.from({ length: 6 }, (_, i) => ({
  name: `job ${i}`,
  status: 'completed',
  conclusion: 'success',
}));

function input(over = {}) {
  return {
    event: 'synchronize',
    before: BEFORE,
    head: HEAD,
    base: 'origin/master',
    git: {
      isAncestor: () => true,
      diffNames: () => ['openspec/specs/x/spec.md', 'openspec/changes/archive/2026-11-07-x/proposal.md', 'todo/x.md'],
    },
    checkRuns: () => GREEN,
    ...over,
  };
}

test('archive pushed onto a green head skips', async () => {
  const d = await decide(input());
  assert.equal(d.skip, true, d.reason);
});

test('code in the push does not skip, and names the path', async () => {
  const d = await decide(input({ git: { isAncestor: () => true, diffNames: () => ['openspec/specs/x/spec.md', 'scripts/a.mjs'] } }));
  assert.equal(d.skip, false);
  assert.match(d.reason, /scripts\/a\.mjs/);
});

test('a path that only starts like a skippable prefix does not skip', async () => {
  const d = await decide(input({ git: { isAncestor: () => true, diffNames: () => ['openspec-steward.json'] } }));
  assert.equal(d.skip, false);
});

for (const bad of [
  { status: 'completed', conclusion: 'failure' },
  { status: 'completed', conclusion: 'cancelled' },
  { status: 'completed', conclusion: 'skipped' },
  { status: 'in_progress', conclusion: null },
]) {
  test(`previous head not green: ${bad.conclusion ?? bad.status}`, async () => {
    const d = await decide(input({ checkRuns: () => [...GREEN, { name: 'unit', ...bad }] }));
    assert.equal(d.skip, false);
    assert.match(d.reason, /unit/);
  });
}

test('no check runs on the previous head does not skip', async () => {
  const d = await decide(input({ checkRuns: () => [] }));
  assert.equal(d.skip, false);
});

test('base moved since the green head does not skip', async () => {
  const d = await decide(input({ git: { isAncestor: (a) => a !== 'origin/master', diffNames: () => ['openspec/a.md'] } }));
  assert.equal(d.skip, false);
  assert.match(d.reason, /base moved/);
});

test('history rewritten does not skip', async () => {
  const d = await decide(input({ git: { isAncestor: (a, b) => !(a === BEFORE && b === HEAD), diffNames: () => ['openspec/a.md'] } }));
  assert.equal(d.skip, false);
  assert.match(d.reason, /rewritten/);
});

for (const event of ['opened', 'reopened', 'push', '']) {
  test(`not a synchronize (${event || 'empty'}) does not skip`, async () => {
    const d = await decide(input({ event }));
    assert.equal(d.skip, false);
  });
}

test('an empty push does not skip', async () => {
  const d = await decide(input({ git: { isAncestor: () => true, diffNames: () => [] } }));
  assert.equal(d.skip, false);
});

test('a zero or missing before does not skip', async () => {
  for (const before of ['0'.repeat(40), '', undefined]) {
    const d = await decide(input({ before }));
    assert.equal(d.skip, false, `before=${before}`);
  }
});

test('a throwing check-run lookup fails closed', async () => {
  const d = await decide(input({ checkRuns: () => { throw new Error('no token'); } }));
  assert.equal(d.skip, false);
  assert.match(d.reason, /no token/);
});

test('a throwing git fails closed', async () => {
  const d = await decide(input({ git: { isAncestor: () => { throw new Error('bad object'); }, diffNames: () => [] } }));
  assert.equal(d.skip, false);
  assert.match(d.reason, /bad object/);
});

test('real repository: archive-only push skips, code push does not, unknown SHA fails closed', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'archive-head-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const git = (...args) => {
    const r = spawnSync('git', args, { cwd: dir, encoding: 'utf8' });
    assert.equal(r.status, 0, `git ${args.join(' ')}: ${r.stderr}`);
    return r.stdout.trim();
  };
  const write = (path, text) => {
    mkdirSync(join(dir, path, '..'), { recursive: true });
    writeFileSync(join(dir, path), text);
  };
  const commit = (msg) => {
    git('add', '-A');
    git('-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'commit.gpgsign=false', 'commit', '-q', '-m', msg);
    return git('rev-parse', 'HEAD');
  };

  git('init', '-q', '-b', 'master');
  write('src/a.mjs', 'export {};\n');
  const base = commit('base');
  git('switch', '-q', '-c', 'feature');
  write('src/a.mjs', 'export const a = 1;\n');
  write('openspec/changes/x/proposal.md', '# x\n');
  const before = commit('implement');
  rmSync(join(dir, 'openspec/changes/x'), { recursive: true });
  write('openspec/changes/archive/2026-11-07-x/proposal.md', '# x\n');
  write('openspec/specs/x/spec.md', '# x\n');
  const archive = commit('archive');
  write('src/a.mjs', 'export const a = 2;\n');
  const code = commit('code after archive');

  const real = gitAdapter(dir);
  const run = (b, h) => decide({ event: 'synchronize', before: b, head: h, base, git: real, checkRuns: () => GREEN });

  assert.equal((await run(before, archive)).skip, true);
  assert.equal((await run(archive, code)).skip, false);
  const unknown = await run('c'.repeat(40), archive);
  assert.equal(unknown.skip, false);
  assert.match(unknown.reason, /could not evaluate/);
});

/**
 * The git half of `decide()`'s injected dependencies, over a real clone.
 *
 * Separate from `index.mjs` so the temporary-repository test exercises the same
 * adapter CI does, rather than a copy of it.
 */
import { spawnSync } from 'node:child_process';

/** @param {string} cwd */
export function gitAdapter(cwd) {
  const run = (args) => spawnSync('git', args, { cwd, encoding: 'utf8' });

  return {
    isAncestor(a, b) {
      const r = run(['merge-base', '--is-ancestor', a, b]);
      if (r.status === 0) return true;
      if (r.status === 1) return false;
      // 128 and the rest: an unknown object or not a repository. Unknown is
      // not "no" — decide() turns the throw into skip=false with the reason.
      throw new Error(`git merge-base --is-ancestor ${a} ${b}: ${(r.stderr || r.error?.message || '').trim()}`);
    },

    diffNames(a, b) {
      const r = run(['diff', '--name-only', '--no-renames', a, b]);
      if (r.status !== 0) {
        throw new Error(`git diff --name-only ${a} ${b}: ${(r.stderr || r.error?.message || '').trim()}`);
      }
      return r.stdout.split('\n').filter(Boolean);
    },
  };
}

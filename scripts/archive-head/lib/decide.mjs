/**
 * May this pull request head skip its test jobs?
 *
 * Only when the push since a green head changed nothing a test job reads. The
 * archive commit of an OpenSpec change is the case this exists for: it moves a
 * folder under `openspec/changes/`, applies a delta to `openspec/specs/`, and
 * may delete `todo/<name>.md`. The code it ships with was already tested on the
 * previous head, and only spec checks can judge what the archive changed.
 *
 * Every condition must hold, checked in this order, and anything that cannot be
 * evaluated reads as failing. A wrong `skip=false` costs one CI run. A wrong
 * `skip=true` is an empty green: a head that reads green with nothing run
 * against the code CI would merge.
 *
 * Pure: `git` and `checkRuns` are injected, so every condition is testable
 * without a repository or the network. `index.mjs` owns the subprocess and the
 * API call.
 */

/** Paths a skip may touch. Nothing a test job reads lives under either. */
export const SKIPPABLE_PREFIXES = ['openspec/', 'todo/'];

const SHA = /^[0-9a-f]{7,64}$/i;
const ZERO = /^0+$/;

/**
 * @param {object} input
 * @param {string} input.event   pull_request action (`synchronize`, `opened`, ...) or the event name
 * @param {string} input.before  head before this push
 * @param {string} input.head    head after this push
 * @param {string} input.base    base ref as the clone names it, e.g. `origin/master`
 * @param {{isAncestor(a: string, b: string): boolean, diffNames(a: string, b: string): string[]}} input.git
 * @param {() => Promise<Array<{status: string, conclusion: string | null, name: string}>> | Array<object>} input.checkRuns
 *   check runs on `before`; may throw, which reads as not green
 * @returns {Promise<{skip: boolean, reason: string}>}
 */
export async function decide({ event, before, head, base, git, checkRuns }) {
  const no = (reason) => ({ skip: false, reason });

  try {
    if (event !== 'synchronize') {
      return no(`event is ${event || 'missing'}, not a pull request synchronize`);
    }
    if (!isSha(before) || !isSha(head)) {
      return no('before or head is not a commit SHA');
    }
    if (!base) {
      return no('no base ref given');
    }

    if (!git.isAncestor(before, head)) {
      return no(`${short(before)} is not an ancestor of ${short(head)}: history was rewritten`);
    }

    const paths = git.diffNames(before, head);
    if (paths.length === 0) {
      return no(`no path changed between ${short(before)} and ${short(head)}`);
    }
    const outside = paths.find((p) => !SKIPPABLE_PREFIXES.some((pre) => p.startsWith(pre)));
    if (outside !== undefined) {
      return no(`${outside} is outside ${SKIPPABLE_PREFIXES.join(' and ')}`);
    }

    if (!git.isAncestor(base, before)) {
      return no(`${base} is not an ancestor of ${short(before)}: the base moved since that head ran`);
    }

    const runs = await checkRuns();
    if (!Array.isArray(runs) || runs.length === 0) {
      return no(`no check runs on ${short(before)}`);
    }
    const bad = runs.find((r) => r.status !== 'completed' || r.conclusion !== 'success');
    if (bad !== undefined) {
      return no(`${bad.name} on ${short(before)} reads ${bad.conclusion ?? bad.status}`);
    }

    return {
      skip: true,
      reason: `${paths.length} path(s) under ${SKIPPABLE_PREFIXES.join(' and ')} since ${short(before)}, whose ${runs.length} check run(s) all read success`,
    };
  } catch (err) {
    return no(`could not evaluate: ${err?.message ?? err}`);
  }
}

function isSha(value) {
  return typeof value === 'string' && SHA.test(value) && !ZERO.test(value);
}

function short(sha) {
  return String(sha).slice(0, 7);
}

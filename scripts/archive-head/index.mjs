#!/usr/bin/env node
/**
 * openspec-archive-head: may this pull request head skip its test jobs?
 *
 * Prints `skip=true|false` and `reason=...`, and appends both to
 * `$GITHUB_OUTPUT` when that is set, so a workflow can gate its test jobs on
 * `needs.<job>.outputs.skip`. The five conditions live in `lib/decide.mjs`;
 * docs/archive-head.md says how to wire it and which jobs must never depend on
 * it.
 *
 * Exit 0 after any decision, skip or not: a decision is not a failure. Exit 2 on
 * a usage error. Anything else, a crash included, is non-zero and makes the job
 * red. The jobs gated on it then read `skipped` behind a red job, which is not
 * green.
 *
 * This file owns the subprocess and the one API call; `lib/` is pure.
 */
import { appendFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { decide } from './lib/decide.mjs';
import { gitAdapter } from './lib/git.mjs';

const USAGE = `usage: openspec-archive-head --event <action> --before <sha> --head <sha> --base <ref> [--repo <owner/name>]

  --event   pull_request action (github.event.action), or the event name
  --before  head before this push (github.event.before)
  --head    head after this push (github.event.pull_request.head.sha)
  --base    base ref in this clone, e.g. origin/master
  --repo    owner/name for the check-run lookup (default: $GITHUB_REPOSITORY)

Reads GH_TOKEN or GITHUB_TOKEN. Without one, the previous head cannot be
confirmed green, so the decision is skip=false.`;

const FLAGS = ['--event', '--before', '--head', '--base', '--repo'];

/** @returns {Record<string,string> | string} the parsed flags, or a usage error */
export function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i];
    if (!FLAGS.includes(flag)) return `unknown argument: ${flag}`;
    const value = argv[i + 1];
    if (value === undefined) return `${flag} needs a value`;
    out[flag.slice(2)] = value;
  }
  // Required as flags, though an empty value is allowed: on a push event a
  // workflow expression such as github.event.pull_request.head.sha is empty,
  // and that must give skip=false, not a usage error that reddens the build.
  for (const flag of ['event', 'before', 'head', 'base']) {
    if (!(flag in out)) return `--${flag} is required`;
  }
  return out;
}

/** Check runs on `sha`, latest attempt per name. Throws on anything it cannot vouch for. */
async function fetchCheckRuns(repo, sha) {
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) throw new Error('no GH_TOKEN or GITHUB_TOKEN to read check runs with');
  if (!repo) throw new Error('no --repo and no GITHUB_REPOSITORY');
  const api = process.env.GITHUB_API_URL || 'https://api.github.com';
  const res = await fetch(`${api}/repos/${repo}/commits/${sha}/check-runs?filter=latest&per_page=100`, {
    headers: {
      authorization: `Bearer ${token}`,
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
    },
  });
  if (!res.ok) throw new Error(`check runs for ${sha}: HTTP ${res.status}`);
  const body = await res.json();
  const runs = body.check_runs ?? [];
  // A second page could hold the one red run. One page is the whole answer or
  // no answer.
  if (typeof body.total_count !== 'number' || body.total_count > runs.length) {
    throw new Error(`check runs for ${sha}: ${body.total_count} reported, ${runs.length} read`);
  }
  return runs;
}

export async function main(argv) {
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log(USAGE);
    return 0;
  }
  const args = parseArgs(argv);
  if (typeof args === 'string') {
    console.error(`openspec-archive-head: ${args}\n\n${USAGE}`);
    return 2;
  }

  const repo = args.repo || process.env.GITHUB_REPOSITORY;
  const { skip, reason } = await decide({
    event: args.event,
    before: args.before,
    head: args.head,
    base: args.base,
    git: gitAdapter(process.cwd()),
    checkRuns: () => fetchCheckRuns(repo, args.before),
  });

  const oneLine = reason.replace(/\s+/g, ' ');
  console.log(`skip=${skip}`);
  console.log(`reason=${oneLine}`);
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `skip=${skip}\nreason=${oneLine}\n`);
  }
  return 0;
}

/** Same guard as scripts/check-specs/index.mjs: npm installs a bin as a symlink. */
function invokedDirectly() {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (invokedDirectly()) {
  process.exit(await main(process.argv.slice(2)));
}

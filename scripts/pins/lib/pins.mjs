/**
 * This repository's OpenSpec version pins, held to each other.
 *
 * One *floor*, the oldest CLI steward supports, which the smoke test installs.
 * One *current* version, which every other pin names: the CI `strict` install,
 * each `generatedBy` that `openspec update` wrote under `.claude/skills/`, and
 * the version `tdd.mjs` copied `TASK_LINE_PATTERN` from. How to move them is in
 * `docs/maintaining.md`.
 *
 * Pure: the caller supplies the file text. A pin the reader cannot find is a
 * finding, never a skip: a reader that silently finds nothing passes forever.
 */

const VERSION = String.raw`(\d+\.\d+\.\d+)`;

const SMOKE = new RegExp(String.raw`^OPENSPEC_VERSION='@fission-ai/openspec@${VERSION}'`, 'm');
const CI = new RegExp(String.raw`@fission-ai/openspec@${VERSION}`, 'g');
const GENERATED_BY = new RegExp(String.raw`^\s*generatedBy:\s*"${VERSION}"`, 'm');
const TDD = new RegExp(String.raw`\`dist/utils/task-progress\.js\` \(${VERSION}\)`);

const SMOKE_FILE = 'scripts/check-specs/smoke-bin.sh';
const CI_FILE = '.github/workflows/ci.yml';
const TDD_FILE = 'scripts/check-specs/lib/tdd.mjs';
const SKILLS_DIR = '.claude/skills';

/**
 * @param {{smoke: string, ci: string, tdd: string, skills: Record<string, string>}} texts
 *   `skills` maps `<skill>/SKILL.md` to its text.
 * @returns {{floor: string | null, current: {where: string, version: string}[], findings: string[]}}
 */
export function readPins({ smoke, ci, tdd, skills }) {
  const findings = [];
  const current = [];

  const floor = SMOKE.exec(smoke)?.[1] ?? null;
  if (floor === null) findings.push(`${SMOKE_FILE}: no OPENSPEC_VERSION pin found`);

  const ciPins = [...ci.matchAll(CI)].map((m) => m[1]);
  if (ciPins.length === 0) findings.push(`${CI_FILE}: no @fission-ai/openspec pin found`);
  for (const version of ciPins) current.push({ where: CI_FILE, version });

  const skillPaths = Object.keys(skills).sort();
  if (skillPaths.length === 0) findings.push(`${SKILLS_DIR}: no generatedBy found, no OpenSpec skills read`);
  for (const path of skillPaths) {
    const version = GENERATED_BY.exec(skills[path])?.[1];
    if (version === undefined) findings.push(`${SKILLS_DIR}/${path}: no generatedBy found`);
    else current.push({ where: `${SKILLS_DIR}/${path}`, version });
  }

  const tddPin = TDD.exec(tdd)?.[1];
  if (tddPin === undefined) findings.push(`${TDD_FILE}: no task-progress.js version found in the TASK_LINE comment`);
  else current.push({ where: TDD_FILE, version: tddPin });

  return { floor, current, findings };
}

/** @returns {string[]} one finding per problem; empty when the pins agree */
export function checkPins(texts) {
  const { floor, current, findings } = readPins(texts);
  if (findings.length > 0) return findings;

  const counts = new Map();
  for (const { version } of current) counts.set(version, (counts.get(version) ?? 0) + 1);

  if (counts.size > 1) {
    // The version most pins name is the one the rest failed to move with.
    const [majority] = [...counts].sort((a, b) => b[1] - a[1] || compare(b[0], a[0]))[0];
    for (const { where, version } of current) {
      if (version !== majority) {
        findings.push(`${where}: OpenSpec ${version}, but the other current pins name ${majority}`);
      }
    }
    return findings;
  }

  const [currentVersion] = counts.keys();
  if (compare(floor, currentVersion) > 0) {
    findings.push(`${SMOKE_FILE}: the floor ${floor} is above the current version ${currentVersion}`);
  }
  return findings;
}

/** Compare two `x.y.z` versions as numbers: 1.9.0 is below 1.17.0. */
function compare(a, b) {
  const x = a.split('.').map(Number);
  const y = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
}

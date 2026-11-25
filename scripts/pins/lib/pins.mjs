/**
 * This repository's OpenSpec version pins, held to each other.
 *
 * One *floor*, the oldest CLI steward supports, which the smoke test installs.
 * One *current* version, which both other pins name: the CI `strict` install
 * and the version `tdd.mjs` copied `TASK_LINE_PATTERN` from. How to move them is
 * in `docs/maintaining.md`. The files `openspec update` writes carry no version;
 * `generated.mjs` compares them with what the pinned CLI would write.
 *
 * Pure: the caller supplies the file text. A pin the reader cannot find is a
 * finding, never a skip: a reader that silently finds nothing passes forever.
 */

const VERSION = String.raw`(\d+\.\d+\.\d+)`;

const SMOKE = new RegExp(String.raw`^OPENSPEC_VERSION='@fission-ai/openspec@${VERSION}'`, 'm');
const CI = new RegExp(String.raw`@fission-ai/openspec@${VERSION}`, 'g');
const TDD = new RegExp(String.raw`\`dist/utils/task-progress\.js\` \(${VERSION}\)`);

const SMOKE_FILE = 'scripts/check-specs/smoke-bin.sh';
const CI_FILE = '.github/workflows/ci.yml';
const TDD_FILE = 'scripts/check-specs/lib/tdd.mjs';

/**
 * @param {{smoke: string, ci: string, tdd: string}} texts
 * @returns {{floor: string | null, current: {where: string, version: string}[], findings: string[]}}
 */
export function readPins({ smoke, ci, tdd }) {
  const findings = [];
  const current = [];

  const floor = SMOKE.exec(smoke)?.[1] ?? null;
  if (floor === null) findings.push(`${SMOKE_FILE}: no OPENSPEC_VERSION pin found`);

  const ciPins = [...ci.matchAll(CI)].map((m) => m[1]);
  if (ciPins.length === 0) findings.push(`${CI_FILE}: no @fission-ai/openspec pin found`);
  for (const version of ciPins) current.push({ where: CI_FILE, version });

  const tddPin = TDD.exec(tdd)?.[1];
  if (tddPin === undefined) findings.push(`${TDD_FILE}: no task-progress.js version found in the TASK_LINE comment`);
  else current.push({ where: TDD_FILE, version: tddPin });

  return { floor, current, findings };
}

/** @returns {string[]} one finding per problem; empty when the pins agree */
export function checkPins(texts) {
  const { floor, current, findings } = readPins(texts);
  if (findings.length > 0) return findings;

  const versions = [...new Set(current.map(({ version }) => version))];
  if (versions.length > 1) {
    // Two pins have no majority to call right, so name every one of them.
    const pins = current.map(({ where, version }) => `${where} at ${version}`).join(', ');
    return [`the current OpenSpec pins disagree: ${pins}`];
  }

  const [currentVersion] = versions;
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

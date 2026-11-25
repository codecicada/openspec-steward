/**
 * The generated OpenSpec skills, held to the CLI that should have written them.
 *
 * OpenSpec 2.x writes no version into its skills, so the pin test cannot read
 * one. `openspec update --dry-run --json` says more: what the installed CLI
 * would change. Any planned change inside the repository means the committed
 * files are not what that CLI writes.
 *
 * Pure: `../index.mjs` runs the command and lists the skills. It fails closed.
 * The command exits 0 whether or not it plans a change, and plans nothing once
 * every skill is gone, so neither an exit code nor an empty plan is enough.
 */

const COMMAND = 'openspec update --dry-run --json';

/**
 * @param {{status: number | null, stdout: string, skills: string[]}} run
 *   `skills` lists the generated `SKILL.md` files found on disk.
 * @returns {string[]} one finding per problem; empty when the files are current
 */
export function checkGenerated({ status, stdout, skills }) {
  if (skills.length === 0) return ['no generated skill found: .agents/skills/openspec*/SKILL.md matches nothing'];
  if (status !== 0) return [`\`${COMMAND}\` exited ${status}`];

  let plan;
  try {
    plan = JSON.parse(stdout);
  } catch {
    return [`\`${COMMAND}\` did not print JSON`];
  }
  for (const key of ['changes', 'failures']) {
    if (!Array.isArray(plan?.[key])) return [`\`${COMMAND}\` printed no \`${key}\` list`];
  }

  const findings = plan.failures.map((failure) => `\`${COMMAND}\` reported a failure: ${JSON.stringify(failure)}`);
  for (const change of plan.changes) {
    if (typeof change?.path !== 'string') {
      findings.push(`\`${COMMAND}\` planned a change with no path: ${JSON.stringify(change)}`);
    } else if (!change.path.startsWith('~/')) {
      findings.push(`${change.path}: the pinned CLI would ${change.action} it`);
    }
  }
  return findings;
}

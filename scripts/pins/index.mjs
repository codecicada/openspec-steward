#!/usr/bin/env node
/**
 * Fails when the generated OpenSpec skills are not what the installed CLI
 * writes. Run with the current pin installed, as CI does: another version gives
 * another answer. How to move the pin is in `docs/maintaining.md`.
 *
 * Reads only: `--dry-run` writes nothing.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkGenerated } from './lib/generated.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const dir = join(root, '.agents/skills');

const skills = existsSync(dir)
  ? readdirSync(dir)
      .filter((name) => name.startsWith('openspec') && existsSync(join(dir, name, 'SKILL.md')))
      .map((name) => `${name}/SKILL.md`)
  : [];

const { status, stdout, stderr } = spawnSync('npx', ['--no-install', 'openspec', 'update', '--dry-run', '--json'], {
  cwd: root,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
});

const findings = checkGenerated({ status, stdout: stdout ?? '', skills });
if (findings.length > 0) {
  for (const finding of findings) console.error(`✗ ${finding}`);
  if (status !== 0 && stderr) console.error(stderr.trim());
  console.error('regenerate with the pinned CLI: docs/maintaining.md, "Moving the current version"');
  process.exit(1);
}
console.log(`generated files match the installed OpenSpec CLI (${skills.length} skills)`);

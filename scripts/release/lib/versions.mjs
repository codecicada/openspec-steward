/**
 * The release version, held equal across the three files that carry it:
 * `package.json`, `.claude-plugin/plugin.json`, and the marketplace example's
 * `ref` in `README.md`, which pins consumers to the tag. A release bumps all
 * three in one commit (`docs/releasing.md`); this turns a missed one red.
 *
 * Pure: the caller supplies the file text. A version the reader cannot find is
 * a finding, never a skip: a reader that silently finds nothing passes forever.
 */

const VERSION = /^\d+\.\d+\.\d+$/;
const README_REF = /"ref":\s*"v(\d+\.\d+\.\d+)"/g;

/**
 * @param {{pkg: string, plugin: string, readme: string}} texts
 * @returns {string[]} one finding per problem; empty when the versions agree
 */
export function checkVersions({ pkg, plugin, readme }) {
  const findings = [];
  const versions = [];

  for (const [file, text] of [
    ['package.json', pkg],
    ['.claude-plugin/plugin.json', plugin],
  ]) {
    const version = topLevelVersion(text);
    if (version === null) findings.push(`${file}: no top-level "version" found`);
    else versions.push({ file, version });
  }

  const refs = [...readme.matchAll(README_REF)].map((m) => m[1]);
  if (refs.length === 0) findings.push('README.md: no marketplace "ref": "vX.Y.Z" found');
  for (const version of refs) versions.push({ file: 'README.md', version });

  if (findings.length > 0) return findings;

  const counts = new Map();
  for (const { version } of versions) counts.set(version, (counts.get(version) ?? 0) + 1);
  if (counts.size === 1) return [];

  // The version most files name is the one the rest failed to move with.
  const [majority] = [...counts].sort((a, b) => b[1] - a[1])[0];
  return versions
    .filter(({ version }) => version !== majority)
    .map(({ file, version }) => `${file}: version ${version}, but the other files name ${majority}`);
}

/** The top-level `version` of a JSON document, or `null`. */
function topLevelVersion(text) {
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    return null;
  }
  const version = json?.version;
  return typeof version === 'string' && VERSION.test(version) ? version : null;
}

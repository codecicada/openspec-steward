import { readFileSync } from 'node:fs';
import { deepStrictEqual, match, strictEqual } from 'node:assert/strict';
import { test } from 'node:test';
import { checkVersions } from './versions.mjs';

// The three files, cut down to the lines that carry the version.
const texts = ({ pkg = '0.8.0', plugin = '0.8.0', readme = '0.8.0' } = {}) => ({
  pkg: `{\n  "name": "openspec-steward",\n  "version": "${pkg}",\n  "type": "module"\n}\n`,
  plugin: `{\n  "name": "openspec-steward",\n  "version": "${plugin}"\n}\n`,
  readme: `      "source": {\n        "source": "github",\n        "ref": "v${readme}"\n      }\n`,
});

test('versions agree', () => {
  deepStrictEqual(checkVersions(texts()), []);
});

test('one file bumped alone', () => {
  const findings = checkVersions(texts({ pkg: '0.9.0' }));
  strictEqual(findings.length, 1);
  match(findings[0], /package\.json/);
  match(findings[0], /0\.9\.0/);
  match(findings[0], /0\.8\.0/);
});

test('the README ref bumped alone', () => {
  const findings = checkVersions(texts({ readme: '0.9.0' }));
  strictEqual(findings.length, 1);
  match(findings[0], /README\.md/);
});

test('a version that cannot be found', () => {
  for (const [file, name] of [
    ['pkg', /package\.json/],
    ['plugin', /plugin\.json/],
    ['readme', /README\.md/],
  ]) {
    const t = texts();
    t[file] = 'no version here\n';
    const findings = checkVersions(t);
    strictEqual(findings.length, 1, file);
    match(findings[0], name);
  }
});

test('a nested "version" is not the package version', () => {
  const t = texts();
  t.pkg = '{\n  "name": "x",\n  "engines": { "version": "0.8.0" }\n}\n';
  match(checkVersions(t)[0], /package\.json/);
});

// This repository's own files, read from disk: the test the scenarios exist for.
test('this repository keeps its release version in step', () => {
  const read = (path) => readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8');

  deepStrictEqual(
    checkVersions({
      pkg: read('package.json'),
      plugin: read('.claude-plugin/plugin.json'),
      readme: read('README.md'),
    }),
    [],
  );
});

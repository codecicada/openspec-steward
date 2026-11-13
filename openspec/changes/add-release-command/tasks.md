# Tasks

## 1. Version test

- [ ] 1.1 Write `scripts/release/lib/versions.test.mjs` with fixture cases for the three scenarios of `release-versions`, and one case that reads this repository's `package.json`, `.claude-plugin/plugin.json` and `README.md` and expects no finding. Run it red with no `versions.mjs`. Verify: `node --test scripts/release/lib/versions.test.mjs` fails. Accept: the failure is the missing module.
  - tdd: yes — the test is the requirement
- [ ] 1.2 Write `scripts/release/lib/versions.mjs` exporting `checkVersions({pkg, plugin, readme})`, which returns one finding per file that has no version or disagrees with the others. Verify: 1.1 passes. Accept: no disk I/O in `versions.mjs`.
  - tdd: no — made green by 1.1

## 2. Command

- [ ] 2.1 Write `.claude/commands/release.md` with `name` and `description` frontmatter, taking `X.Y.Z`: the refusals of design decision 3, the bump branch and pull request, green by name, the drafted notes and the one stop, then the tree check, signed tag, `ls-remote` and `gh release create --verify-tag --latest`. Each step links its section of `docs/releasing.md`. Verify: every command in it appears in `docs/releasing.md` or in the refusals. Accept: no step's reason is repeated from the doc.
  - tdd: no — prose an agent runs

## 3. Docs

- [ ] 3.1 In `AGENTS.md`, name `.claude/commands/release.md` as hand-written beside `.claude/CLAUDE.md`, add `scripts/release/` to the map, and point the releasing line at `/release`. In `docs/releasing.md`, say that `/release X.Y.Z` runs these steps. Add `scripts/release/lib/versions.mjs` to `docs/README.md`'s file list. Verify: `node --test scripts/init/lib/init.test.mjs` passes and `grep -n '/release' AGENTS.md docs/releasing.md` hits both.
  - tdd: no — prose and links

## 4. Integration

- [ ] 4.1 Run `npm test`, `npm run test:bin`, `npm run test:gates`, `npm run test:plugin` and `node scripts/check-specs/index.mjs --root .`. Accept: all five exit 0.
  - tdd: no — runs existing suites

# Tasks

## 1. Decision logic

- [ ] 1.1 Write `decide()` in `scripts/archive-head/lib/decide.mjs`. It takes `{event, before, head, base, git, checkRuns}`, checks the five conditions in spec order, and returns `{skip, reason}`. Any thrown or unevaluable input gives `skip:false`. Accept: there is no import of `child_process` or of the network in this file.
- [ ] 1.2 Write `scripts/archive-head/lib/decide.test.mjs`. Use fakes for every scenario in `specs/archive-head-ci/spec.md`, and add one temporary git repository case: an archive-only push gives skip, a code push does not. Verify: `npm test` passes, and so does `decide.test.mjs` on its own.
- [ ] 1.3 Watch the tests fail before trusting them. Drop the ancestor check on `base`, then make `checkRuns` accept `skipped`. Each mutation must redden only its own scenario. Revert both. Accept: the result is noted in the test file's header comment.

## 2. Bin

- [ ] 2.1 Write `scripts/archive-head/index.mjs`. It parses arguments and wires `git` through `spawnSync`. It fetches check runs with the token from `GH_TOKEN` or `GITHUB_TOKEN`, and writes `$GITHUB_OUTPUT`. It exits 2 on a usage error and 0 after a decision. Use the same entry guard as `scripts/check-specs/index.mjs`. Verify: `node scripts/archive-head/index.mjs` with no args exits 2, and with args but no token prints `skip=false`.
- [ ] 2.2 Add `"openspec-archive-head": "scripts/archive-head/index.mjs"` to `bin` in `package.json`. Verify: `npm pack --dry-run` lists the file.
- [ ] 2.3 Add an `openspec-archive-head` case to `scripts/check-specs/smoke-bin.sh`: through the installed npm symlink, with no args, it exits 2. Verify: `npm run test:bin` passes.

## 3. Steward CI

- [ ] 3.1 In `.github/workflows/ci.yml`, add an `archive-head` job named `archive head`. Give it `checks: read`, `fetch-depth: 0` and Node 22. It passes the event action, `github.event.before`, the PR head SHA and `origin/<base_ref>`, and exposes the `skip` output. Accept: a comment states why it runs on every event.
- [ ] 3.2 Give `unit`, `bin`, `gates` and `plugin` `needs: archive-head` and `if: needs.archive-head.outputs.skip != 'true'`. Accept: no other job changes.
- [ ] 3.3 Add a `specs` job named `specification checks`. It installs `@fission-ai/openspec@1.15.0` without saving it and runs `node scripts/check-specs/index.mjs --root .`, with no `needs`. Verify: the same command passes locally with that CLI version.

## 4. Flow docs

- [ ] 4.1 In `commands/verify-green.md`, add the skipped-check rule from the spec. Verify: it names `archive head`, the previous verified head, and the `git diff --name-only` command.
- [ ] 4.2 In `skills/openspec-change-flow/SKILL.md`, rewrite the "After archiving" closing paragraph and the "Merging" paragraph so the second cycle runs spec checks and may skip tests. Verify: `npm run test:gates` and `npm run test:plugin` pass.
- [ ] 4.3 Update `docs/change-flow.md` near "let CI run again", and its diagram label, to match 4.2. Verify: `grep -n 'archive head' docs/change-flow.md` hits.
- [ ] 4.4 Write `docs/archive-head.md`: the five conditions, the consumer workflow snippet, the jobs that must stay unconditional, and the force-pushed-base caveat. Link it from `README.md`. Verify: `npm run test:gates` passes, since it scans `docs/` for slash commands in shell fences.

## 5. Integration

- [ ] 5.1 Run `npm test`, `npm run test:bin`, `npm run test:gates`, `npm run test:plugin` and `node scripts/check-specs/index.mjs --root .`. Accept: all five exit 0.
- [ ] 5.2 Run `openspec validate reduce-ci-cycles-per-change --strict`. Accept: it passes.

## Workflow follow-up

- Open the PR, then verify green by name: the first head runs every job.
- Archive, push, and verify the archive head by the new rule. The test jobs should read `skipped`, `archive head` and `specification checks` `success`.
- Merge on explicit request.

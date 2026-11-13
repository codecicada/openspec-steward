# Tasks

## 1. Test

- [x] 1.1 In `scripts/init/lib/init.test.mjs`, add a test that reads this repository's `openspec/config.yaml` and `AGENTS.md` (`null` when absent), runs `planInit` over them, and expects `{ writes: {} }`. Run it red with no `AGENTS.md`. Verify: `node --test scripts/init/lib/init.test.mjs` fails on that test only. Accept: the failure shows a planned `agents` write.
  - tdd: yes — the guide's one testable claim is that init has nothing left to do here
  - red: `node --test scripts/init/lib/init.test.mjs` → `✖ init plans nothing on this repository`, actual `{ writes: { agents: "<!-- openspec-steward:begin -->…" } }`, 12 of 13 passing

## 2. Guide

- [x] 2.1 Write the root `AGENTS.md`: rules (steward flow on this repository, explicit paths, rebase-merge on request, public repository so no consumer names, `npm test` only), map (`scripts/`, `skills/`, `commands/`, `docs/`, `openspec/`, `todo/`), gates (the four npm scripts and the checker), maintaining (`docs/releasing.md`, the plans in `todo/`). Then run `node scripts/init/index.mjs --root .`. Verify: it prints `updated AGENTS.md` and `openspec/config.yaml already set up`, and 1.1 passes. Accept: a second run prints `already set up` for both files.
  - tdd: no — prose, made green by 1.1
- [x] 2.2 Write `.claude/CLAUDE.md` importing `AGENTS.md` with `@../AGENTS.md`. Not at the root: `npm run test:plugin` fails on a root `CLAUDE.md` under `--strict`. Verify: `grep -n '^@../AGENTS.md$' .claude/CLAUDE.md` hits and `npm run test:plugin` passes. Accept: no rule is repeated in it.
  - tdd: no — one import line; `test:plugin` already guards the placement

## 3. Docs

- [x] 3.1 Link `AGENTS.md` from `README.md`'s "Developing this package" section and from `docs/README.md`'s reading order. Verify: `grep -n 'AGENTS.md' README.md docs/README.md` hits both.
  - tdd: no — prose

## 4. Integration

- [x] 4.1 Run `npm test`, `npm run test:bin`, `npm run test:gates`, `npm run test:plugin` and `node scripts/check-specs/index.mjs --root .`. Accept: all five exit 0.
  - tdd: no — runs existing suites

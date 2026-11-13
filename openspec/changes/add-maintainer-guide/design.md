# Design

## Context

Init writes two things into a consumer: the steward `rules:` block in
`openspec/config.yaml` and a marked section in the root `AGENTS.md`.
`project-init` already holds the rules block equal to this repository's own,
by a test. Nothing holds the `AGENTS.md` section, because this repository has
no `AGENTS.md`. Run here, init would create one.

Claude Code reads `CLAUDE.md`, not `AGENTS.md`. Other agents read `AGENTS.md`.

## Decision

1. **One guide.** A root `AGENTS.md`, with four hand-written sections above
   init's markers: rules, map, gates, maintaining. Init owns only the text
   between its markers, so a later init run replaces the section and leaves
   the rest alone.
2. **`CLAUDE.md` imports it.** One line, `@AGENTS.md`, plus a sentence saying
   why. No second copy of any rule.
3. **The test.** In `scripts/init/lib/init.test.mjs`, read this repository's
   `openspec/config.yaml` and `AGENTS.md`, plan init over them, and expect
   `{ writes: {} }`. One assertion covers both files: a changed
   `STEWARD_RULES` or `AGENTS_SECTION` without the repository moving with it
   goes red.
4. **No prose test.** Whether the hand-written rules are true needs a reader.
   The docs tasks cover them, as for every other page.

## Consequences

- Changing `AGENTS_SECTION` now requires running init on this repository in
  the same change. The red test says so.
- The existing rules equality test becomes partly redundant. It stays: its
  failure names the rules, not the whole plan.
- `AGENTS.md` is not in the published `files`, so consumers do not receive it.

## Alternatives

- **`CONTRIBUTING.md` as well.** Two copies of the rules, which drift apart.
- **Rules inside init's section.** A later init run would overwrite them.
- **Test that each named npm script exists.** Four scripts. The cost of
  maintaining the test exceeds the risk.

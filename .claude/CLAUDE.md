# CLAUDE.md

The instructions for this repository live in [AGENTS.md](../AGENTS.md), so
that every agent reads one file rather than two copies that drift apart.

This file sits in `.claude/` rather than at the root because the root is also
the plugin's root, where `claude plugin validate --strict` rejects a
`CLAUDE.md`: it would not be loaded as context for a plugin's users.

@../AGENTS.md

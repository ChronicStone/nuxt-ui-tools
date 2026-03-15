---
name: Use bun and dedicated typecheck command
description: Package manager is bun. Use `bun run typecheck` in the relevant package directory instead of running tsc directly.
type: feedback
---

Use `bun` as the package manager, not npm/npx.

For type-checking, use `bun run typecheck` in the relevant package directory (e.g., `packages/table/`), not raw `npx tsc` commands.

**Why:** The user prefers the project's configured scripts.
**How to apply:** Always use `bun run <script>` for build/test/typecheck commands. Check `package.json` scripts first.

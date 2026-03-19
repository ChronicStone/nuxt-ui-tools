# TypeScript Rules

This repository is inference-first.

## Hard Rules

- `any` is forbidden unless explicitly approved by the developer
- `as` casting is forbidden unless explicitly approved by the developer, except `as const`
- `as unknown as ...` is forbidden
- `Record<string, any>` is forbidden on reusable or public surfaces
- these rules apply everywhere: runtime, playground, tests, support code

## Default Style

- fully type everything
- prefer deriving types from values and builders over writing parallel types manually
- keep one canonical source of truth for a concept whenever possible
- use `unknown` when data is genuinely unknown, then narrow it

## Inference Rule

Inference is the default.

Prefer:

- inferred locals
- inferred helper return types
- inferred composable return types
- types derived from schema values and builder outputs

Use explicit annotations only when they add real value:

- recursive functions
- public contracts that need a deliberate boundary
- constraints for `computed(...)`
- places where the inferred type is noisy or leaks internals

## What Good Looks Like

Good:

- a builder return type derived from the builder contract
- a public composable whose type is mostly inferred from the schema argument
- a normalized utility type reused across the domain

Bad:

- repeating the same shape as a value type and as a hand-written interface
- using casts to force a design that the type model should express directly
- solving weak inference by making consumers annotate more

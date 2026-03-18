# Project rules

## TypeScript

- **Never use `as` type casting.** Types must be correctly inferred and resolved through proper generics, overloads, or type narrowing. If the types don't align, fix the types or the code — not the compiler output.

## Tooling

- Use `bun` as package manager (not pnpm/npm)
- Use `bun run typecheck` for type checking (not raw tsc)

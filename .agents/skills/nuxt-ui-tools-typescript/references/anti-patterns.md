# TypeScript Anti-Patterns

Avoid these in this repository:

- `any`
- `as unknown as`
- broad casts used to silence broken inference
- duplicated shape declarations
- public types that leak temporary internal normalization details
- adding more generic parameters when the type can be derived from an existing one

When you encounter one of these, prefer:

- improving the core type model
- introducing a reusable normalized utility type
- simplifying the implementation shape

---
name: No type casting
description: Never use TypeScript "as" type casting — types must be correctly inferred and resolved
type: feedback
---

Never use `as` type casting. It is never the right solution. Types should be correctly inferred and resolved through proper generics, overloads, or type narrowing.

**Why:** Type casting hides type errors and creates a false sense of safety. If the types don't align, the code is wrong — fix the types or the code, not the compiler output.

**How to apply:** When a type doesn't match, fix the generic constraints, add proper overloads, or restructure the code so inference works. If a third-party type is wrong, use declaration merging or a thin wrapper — never `as`.

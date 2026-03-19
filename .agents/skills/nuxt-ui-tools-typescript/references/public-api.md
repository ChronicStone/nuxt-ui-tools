# Public API Typing

Public APIs must be easy to use without workaround typing.

## Main Rule

Consumers should not need `as const` just to use schemas or builders correctly.

If they do, improve the API or its inference.

## Return Types

Prefer inferred return types, including on exported functions and composables.

Add an explicit return type only when it:

- stabilizes an important public contract
- prevents leaking implementation details
- materially improves readability
- is required because inference is insufficient

## JSDoc

Add JSDoc on important exported APIs when it improves:

- safe usage
- discoverability
- context around options or contracts

Do not add noisy JSDoc to trivial internals.

## Consumer Burden Test

Before keeping a typing design, ask:

- does this preserve literal inference?
- does this force awkward generics or casts on users?
- can this be explained simply in consumer docs?

If the answer is bad, improve the package surface.

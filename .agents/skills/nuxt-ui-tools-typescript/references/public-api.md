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

JSDoc is for public API surface only.

That means the things real users manipulate directly:

- exported functions and composables
- exported builders
- exported config and schema types
- exported options objects
- exported return-shaping types when they materially help users understand results

Do not spend JSDoc budget on trivial internals.

For public APIs, the bar is high:

- every meaningful public entrypoint should have JSDoc
- every user-manipulated object-shaped API should have JSDoc
- meaningful individual properties on those objects should also have JSDoc
- important abstraction functions should include a small usage example

Write JSDoc to explain behavior, contracts, and edge cases, not to paraphrase types.

Especially document:

- what happens when a value is omitted
- how defaults affect the returned type
- what shape is written to the URL or other external boundary
- when `null` or `undefined` has special meaning
- individual schema/config properties callers actually set
- any property whose behavior is easy to misuse

Examples should:

- show the intended public call shape
- use realistic values
- avoid workaround patterns the public API is supposed to eliminate

Examples should not:

- require `as const` when the public API should infer without it
- expose internal-only setup unless it is part of public usage

When two related public APIs solve adjacent use cases, add a short
cross-reference so users can discover the better fit.

Good examples:

- `useQueryState(...)` should point users to `useQueryStates(...)` for multiple coordinated values
- a static shape API should point users to the dynamic variant when runtime-defined keys are the real use case

## Consumer Burden Test

Before keeping a typing design, ask:

- does this preserve literal inference?
- does this force awkward generics or casts on users?
- can this be explained simply in consumer docs?

If the answer is bad, improve the package surface.

## Translation-Friendly Text Surfaces

Schema-driven public APIs should treat user-facing text as translation-aware by default.

Preferred default:

- `string | (() => string | number)`

Use this for:

- labels
- placeholders
- empty states
- action text
- preview text
- other consumer-provided copy in schema/config objects

Only use richer renderable function types when the surface genuinely needs rendered content instead of translated text.

Do not force consumers to choose between:

- hard-coded strings, or
- full render functions

for normal translatable schema text.

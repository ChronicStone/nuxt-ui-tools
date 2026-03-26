# JSDoc Policy

JSDoc in this repository is for public API surface only.

Public API surface means the parts real users manipulate directly, such as:

- exported composables
- exported functions
- exported builders
- exported config or schema types
- exported option objects
- exported return-shaping types when they help users understand what they get back

Do not add JSDoc just to decorate internals.

Avoid JSDoc on:

- private helpers
- internal-only transformation utilities
- local implementation details
- obvious internal glue where the code is already clearer than the comment

## Main Rule

Every meaningful public API surface should be fully commented.

That means:

- the exported function/composable/builder itself should have JSDoc
- every user-manipulated option object type should have JSDoc
- individual properties on those object types should also have JSDoc

The expectation is not "some comments somewhere".
The expectation is that a user hovering the public API in an editor can understand how to use it safely.

## Property-Level Requirement

When a public API accepts an object, document the individual properties.

This applies especially to:

- config objects
- schema entries
- builder definitions
- nested option objects
- callback properties with non-obvious contracts

Property comments may be short when the meaning is obvious.
They should be more detailed when the property controls important behavior.

Add more detail for properties that define:

- defaults
- omission/removal behavior
- inference narrowing
- serialization or parsing behavior
- URL/result/output shape
- `null` or `undefined` semantics
- dynamic key or registry behavior
- translation-facing text expectations

## Usage Examples

Important exported abstraction functions should include a small usage example in their JSDoc.

Examples should:

- show the intended public call shape
- use realistic values
- be short enough to scan quickly
- reinforce the intended ergonomics of the API

Examples must not:

- normalize workaround patterns
- require `as const` when the public API is supposed to infer without it
- expose internal-only setup unless that setup is genuinely part of public usage

## Cross-References

Add a short cross-reference when a nearby public API is the better fit for a
common adjacent use case.

Use cross-references to help users choose correctly between related entrypoints,
for example:

- single-item API vs grouped API
- static API vs dynamic API
- low-level primitive vs higher-level convenience API

Good cross-references are:

- short
- specific
- action-oriented
- placed where a user would naturally ask "should I be using something else?"

Example shape:

- use `useQueryStates(...)` when the feature owns multiple coordinated query values
- use `dynamicQueryState(...)` when the URL key set depends on runtime definitions

Do not add cross-references just to link everything to everything else.
Only add them when they materially help API choice or discoverability.

## Writing Standard

Write JSDoc for users of the API, not for maintainers admiring the types.

Prefer comments that answer:

- what do I pass here?
- what happens if I omit this?
- what comes back?
- what gets written to the URL/output/boundary?
- what are the important edge cases?

Good JSDoc should be:

- behavior-first
- concrete
- brief when possible
- detailed where misuse is expensive

Avoid:

- repeating the exact type annotation in sentence form
- vague filler like "sets the value"
- long paragraphs that do not change user decisions
- documenting internals to feel complete

## Definition Of Done For Public APIs

When you touch or introduce public API surface, check all of these:

- exported entrypoint has JSDoc
- object-shaped params and schema/config types have JSDoc
- meaningful individual properties have JSDoc
- important abstraction functions have a usage example
- related public APIs are cross-referenced when that helps users pick the right entrypoint
- examples reflect the intended ergonomic public API
- comments explain behavior and edge cases, not just types

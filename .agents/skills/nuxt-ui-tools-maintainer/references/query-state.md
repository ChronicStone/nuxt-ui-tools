# Query State Runtime

The query-state runtime is a reusable primitive layer.

## Current Main Files

- `src/runtime/query-state/index.ts`
- `src/runtime/query-state/codecs.ts`
- `src/runtime/query-state/client.ts`
- `src/runtime/query-state/composables.ts`

## Current Public Surface

Today this domain exports:

- `useQueryState(...)`
- `useQueryStates(...)`
- `dynamicQueryState(...)`
- built-in codecs
- the client and client registration helpers

## What Belongs Here

- URL/query-param primitives
- codecs
- generic grouped state logic
- dynamic state logic
- router/client integration

## What Does Not Belong Here

- table-specific domain behavior unless it is just a thin adapter layer

## Internal Rules

- keep abstractions lean
- prefer one direct abstraction over multiple wrappers
- use `shallowRef` when deep reactivity does not add value
- do not over-model with unnecessary computed bridges

## Current Design Intention

The purpose of this domain is to let larger features model URL state directly and cleanly.

That means:

- single values should not require custom parse/stringify glue everywhere
- grouped values should avoid manual synchronization
- dynamic key sets should be modeled as first-class abstractions when the keys come from runtime definitions

## Current Known Cleanup Direction

The abstraction is useful, but some downstream usage still shows too much bridging.

When touching this area, prefer:

- strengthening grouped or dynamic abstractions
- reducing domain-level re-shaping computed wrappers
- keeping URL ownership clear
- making table/query-state integration more direct

## Important Consumer-Simplicity Rule

This layer exists so larger package surfaces and app code can get typed URL state without manual parsing.

If a use case feels too awkward here:

- improve the abstraction
- do not normalize workaround-heavy usage

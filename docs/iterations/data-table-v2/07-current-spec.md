# Current Spec

This is the canonical V2 spec after the architecture reset.

## Priorities

- preserve inference across the full schema surface
- keep the base package free of TanStack Query
- mirror the proven V1 runtime organization when runtime work resumes
- build runtime foundations incrementally instead of shipping a broad partial engine

## Package model

### `@nuxt-ui-tools/table-core`

Owns:

- shared utility types
- shared column and state types
- shared builder internals
- normalized contracts for future shared runtime logic

### `@nuxt-ui-tools/table`

Owns:

- `defineTable(...)`
- promise-based source/context/pageContext/filter-option async contracts
- base schema typing and extraction helpers

### `@nuxt-ui-tools/table-query`

Owns:

- `defineQueryTable(...)`
- query-options-based source/context/pageContext/filter-option async contracts
- query schema typing and extraction helpers

## Builder contract

Two builders now exist:

```ts
defineTable(...)
defineQueryTable(...)
```

Rules:

- inference-first
- no manual userland generics for normal usage
- same non-async schema ergonomics across both packages
- async contract differs by package only

## Async contracts

### Base package

Every async resolver returns a plain value or promise:

- `source.loader(...)`
- `context.loader(...)`
- `pageContext.loader(...)`
- `filters.ui.option(...).options.loader(...)`

### Query package

Every async resolver returns query options:

- `source.query(...)`
- `context.query(...)`
- `pageContext.query(...)`
- `filters.ui.option(...).options.query(...)`

## Runtime direction

The previous runtime implementation is intentionally discarded.

Future runtime work should keep the V1-style code organization:

- `types/`
- `utils/`
- `composables/`
- `components/`
- `adapters/`
- `config/`

Expected runtime pattern:

- same public composable contracts
- separate base/query implementations for async-sensitive areas
- shared normalization and helpers in `table-core`

## First runtime milestone

Only these areas are in scope for the first runtime implementation phase:

- query state
- table context
- table data

These are the critical contracts to get right before anything else.

Each one should be implemented and reviewed iteratively before moving on to:

- filters runtime
- actions
- selection
- layout
- rendering and polished UI

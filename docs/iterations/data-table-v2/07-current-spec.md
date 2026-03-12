# Current Spec

This is the canonical V2 spec after the architecture reset.

## Priorities

- preserve inference across the full schema surface
- keep the package TanStack Query-only
- mirror the proven V1 runtime organization when runtime work resumes
- build runtime foundations incrementally instead of shipping a broad partial engine

## Package model

### `@nuxt-ui-tools/table`

Owns:

- `defineTableSchema(...)`
- query-options-based source/context/pageContext/filter-option async contracts
- schema typing and extraction helpers
- query-state utilities and composables

## Builder contract

One builder now exists:

```ts
defineTableSchema(...)
```

Rules:

- inference-first
- no manual userland generics for normal usage
- lean composables with pure helpers extracted into `utils/`

## Async contracts

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

- single runtime path
- shared normalization and helpers inside `packages/table/src/utils`
- public composables built in the V1 style with minimal nesting and early returns

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

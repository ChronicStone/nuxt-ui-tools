# V2 Architecture

This file summarizes the current architectural direction only.

For full detail, see [`07-current-spec.md`](./07-current-spec.md).

## Core Direction

- one schema builder:
  - `defineTableSchema(...)`
- one runtime primitive:
  - `useTable(schema)`
- one main UI abstraction:
  - `DataList`

The system is a **data list**, not just a table:

- table layout
- grid layout
- shared toolbar
- shared footer

## Source Strategy

There is one source model across the system:

- `mode: 'client' | 'remote'`
- `loader` xor `query`
- optional `serializer` only for remote sources

`client` mode:

- plain array
- no serializer

`remote` mode:

- normalized `{ rows, rowCount }` contract
- serializer available when source contract does not match

## Async Resolution Model

The same async resolution pattern should be reusable across:

- table source
- async filter options
- `context`
- `pageContext`

Two execution styles:

- `loader`
- `query`

## Runtime Ownership

The table engine owns:

- pagination
- filters
- search
- sorting
- selection
- loading
- error state
- persistence

Pages should not manually orchestrate these pieces.

## UI Strategy

Implementation order:

1. core runtime and orchestration
2. debug-first inspection UI
3. functional table/grid rendering
4. refined UI system

## Package Strategy

For now:

- keep one `table` package
- organize internally instead of splitting `table-core` / `table-ui`

Shared generic utilities can still live in `packages/shared`.

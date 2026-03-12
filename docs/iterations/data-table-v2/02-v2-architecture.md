# V2 Architecture

The V2 reset is now based on three packages:

- `@nuxt-ui-tools/table-core`
- `@nuxt-ui-tools/table`
- `@nuxt-ui-tools/table-query`

## Package roles

### `table-core`

Shared foundation only:

- generic schema/types
- column builder internals
- shared utilities
- normalized contracts for future shared runtime work

It is public, but not the main end-user schema entrypoint.

### `table`

Base schema package:

- exports `defineTable(...)`
- every async resolver is promise-based
- no TanStack Query dependency

### `table-query`

Query-backed schema package:

- exports `defineQueryTable(...)`
- every async resolver returns query options
- owns the TanStack Query-facing types

## Runtime direction

The previous runtime implementation is discarded.

Future runtime work should preserve the V1 structural style:

- `types/`
- `utils/`
- `composables/`
- `components/`
- `adapters/`
- `config/`

The critical first runtime milestone is intentionally narrow:

- query state
- table context
- table data

These will be built iteratively and reviewed before expanding into filters, actions, selection, layout, or polished UI.

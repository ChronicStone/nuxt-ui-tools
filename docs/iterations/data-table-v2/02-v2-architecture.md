# V2 Architecture

The V2 reset is now based on a single package:

- `@nuxt-ui-tools/table`

## Package role

`@nuxt-ui-tools/table` owns:

- `defineTableSchema(...)`
- TanStack Query-backed source/context/pageContext/filter-option contracts
- schema typing and extraction helpers
- query-state utilities and composables
- future runtime work in V1-style folders (`types`, `utils`, `composables`, `components`, `adapters`, `config`)

## Runtime direction

The previous runtime implementation is discarded.

The critical first runtime milestone is intentionally narrow:

- query state
- table context
- table data

These will be built iteratively and reviewed before expanding into filters, actions, selection, layout, or polished UI.

# Decisions Log

## 2026-03-12

### Active decisions

- supersede the single-builder direction
- supersede the single `table` package direction
- use three packages:
  - `@nuxt-ui-tools/table-core`
  - `@nuxt-ui-tools/table`
  - `@nuxt-ui-tools/table-query`
- `defineTable(...)` is the base builder
- `defineQueryTable(...)` is the query builder
- base package async resolvers use promises only
- query package async resolvers return query options only
- `table-core` holds shared schema primitives, builder internals, utils, and future runtime contracts
- V1 runtime folder/composable organization is the reference shape to preserve
- current runtime implementation path is obsolete
- first runtime milestone is limited to:
  - query state
  - table context
  - table data
- runtime work after those three foundations must be iterative and reviewed before broadening scope

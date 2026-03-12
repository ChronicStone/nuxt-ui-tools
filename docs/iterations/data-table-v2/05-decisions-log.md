# Decisions Log

## 2026-03-12

### Active decisions

- supersede the split-package direction
- keep a single `@nuxt-ui-tools/table` package
- keep a single `defineTableSchema(...)` builder
- all async schema resolvers are TanStack Query-based
- V1 runtime folder/composable organization is the reference shape to preserve
- current runtime implementation path is obsolete
- first runtime milestone is limited to:
  - query state
  - table context
  - table data
- runtime work after those three foundations must be iterative and reviewed before broadening scope

# Decisions Log

This file is a timestamped summary of the decisions currently in force.

Rules:

- add dated entries when a decision is made or changed
- if a prior decision is superseded, explicitly mark it as superseded
- the current spec remains the canonical merged view:
  - [`07-current-spec.md`](./07-current-spec.md)

## 2026-03-12

### Active decisions

- use a single builder:
  - `defineTableSchema(...)`
- type-safety is the absolute top priority
- performance is the other top priority
- `useTable(schema)` is the runtime primitive
- `DataList` accepts either `schema` or `table`
- schemas are inference-first and reactive
- source model uses:
  - `mode: 'client' | 'remote'`
  - `loader` xor `query`
- `client` mode expects a plain array and no serializer
- `remote` mode expects `{ rows, rowCount }` by default
- serializer supports:
  - `toRequest`
  - `fromResponse`
  - global registry keys
- keep `views`
- keep `condition`
- keep `table`, `grid`, `defaultLayout`
- keep current `controls` concept and responsive DSL
- filters are top-level and split into:
  - `search`
  - `static`
  - `dynamic`
- filter state is a normalized rule array
- effective filters expose:
  - `source: 'static' | 'dynamic'`
- keep `context` and `pageContext`
- keep lifecycle:
  1. context
  2. table data
  3. pageContext
- columns use builder callback API
- first-iteration columns:
  - `field`
  - `composite`
  - `display`
- first-iteration filters:
  - `text`
  - `option`
  - `boolean`
  - `number`
  - `date`
- table sorting is column-driven
- grid sorting is separate and property-based
- keep `defineEntityActions`
- keep table-only `<RowActions>`
- add `toolbarActions`
- keep unified `TableApi`
- expose:
  - `table.api`
  - `table.state`
  - `table.meta`
- persistence supports:
  - `true`
  - `{ state, preferences }`
- keep one `table` package for now
- first iterations prioritize debug-first runtime inspection before polished UI
- subtle motion and high-quality micro-interactions are a high-priority UI concern

### Future scope notes

- column summaries
- row-update hooks / cache invalidation hooks
- schema macros
- cursor pagination
- tree mode

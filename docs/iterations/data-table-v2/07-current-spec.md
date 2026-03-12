# Current Spec

This document consolidates the decisions already validated during the exploration. It is the current working spec snapshot.

It is intentionally opinionated and only reflects decisions already agreed in discussion. Open questions are left out unless they materially affect an already locked choice.

## Non-Negotiable Priorities

The two highest-level implementation priorities are:

- type-safety
- performance
- high-quality interaction polish in the UI layer

Rules:

- type inference must be preserved across the whole API surface
- userland should not need manual generics for normal usage
- all major schema-driven surfaces must be strongly typed:
  - source
  - filters
  - columns
  - actions
  - context
  - pageContext
  - table API
  - query builder utilities
- performance should be achieved by design, not by patching problems later
- runtime orchestration should avoid unnecessary recomputation, refetching, and re-rendering
- debugability must not come at the expense of core runtime discipline
- once UI work begins, subtle motion quality is a first-class concern

## Core Product Shape

The abstraction remains a **data list**, not just a table.

It must support:

- table layout
- grid layout
- shared toolbar
- shared footer
- schema-first business logic
- reusable row and entity actions

The table engine owns state and lifecycle. Consumers should not manually wire pagination, sorting, filtering, loading, or remote fetch state in pages.

## Main Public API

### Builder

Use a single schema builder:

```ts
defineTableSchema(...)
```

Rules:

- inference-first
- no manual userland generics
- schema is self-sufficient
- schema can be reactive

### Runtime usage

Two entry paths are supported:

```ts
const table = useTable(schema)
```

and:

```vue
<DataList :schema="schema" />
```

Also supported:

```vue
<DataList :table="table" />
```

`useTable(schema)` is the underlying primitive.

## Reactive Schema

Schemas must be reactive.

`useTable` should accept a reactive schema source such as a ref/computed/getter-like input.

Behavior:

- schema changes reactively update table behavior
- preserve existing state where possible
- do not fully reinitialize unless necessary

## Source Model

There is a single source model across the whole table system.

Both local and remote behavior must be supported in the same schema builder.

### Source shape

```ts
source: {
  mode: 'client' | 'remote',
  loader?: ...,
  query?: ...,
  serializer?: ...
}
```

Rules:

- `mode` is always `'client' | 'remote'`
- `source` directly contains either `loader` or `query`
- never both
- TypeScript should enforce XOR between `loader` and `query`

### Loader vs query

`loader`:

- uncached async resolver
- used in projects that do not use TanStack Query

`query`:

- query-backed async resolver
- supports generated `queryOptions(...)` flows
- for remote mode, the resolved query result must normalize to:

```ts
{
  rows: Row[]
  rowCount: number
}
```

### Client mode

Client mode rules:

- no serializer
- source is expected to resolve to a plain array
- no request/response adaptation is involved

### Remote mode

Remote mode rules:

- serializer may be used when request/response shape does not match the table’s expected shape
- without serializer, the default expected response shape is:
- in query-backed mode, the query result contract should resolve to:

```ts
{
  rows: Row[]
  rowCount: number
}
```

`pageCount` is not required and should be inferred from:

- `rowCount`
- `pageSize`

### Query-backed versus uncached remote tables

A project may want:

- client mode without TanStack Query
- remote mode without TanStack Query
- client mode with TanStack Query
- remote mode with TanStack Query

This is why the cache/fetch strategy is not modeled as a separate schema builder anymore.

## Serializer

Serializer is only relevant to remote mode.

Shape:

```ts
serializer: {
  toRequest?: (ctx) => ...,
  fromResponse?: (result) => ({
    rows,
    rowCount
  })
}
```

Or:

```ts
serializer: 'elasticsearch'
```

Rules:

- serializer is supported on remote sources
- serializer naming is:
  - `toRequest`
  - `fromResponse`
- serializers should be globally registerable

### Global serializer registry

The system should support reusable globally-defined serializers, similar in spirit to module augmentation patterns.

This enables concise schemas like:

```ts
source: {
  mode: 'remote',
  query: ...,
  serializer: 'elasticsearch'
}
```

instead of repeating mapping logic in every schema.

## URL Query State

URL state serialization is a separate concern from remote request/response serialization.

### URL serialization rules

- URL serialization is internal to the table engine
- it is **not** user-configurable
- it should be compact and token-efficient
- do not serialize full JSON filter arrays in the URL

The desired direction is closer to the V1 style:

```txt
layout=table&key=updatedAt&dir=desc&filters.statuses=["DRAFT"]&pageSize=200
```

instead of giant raw JSON payloads.

### Query builder utility

A public typed utility should exist to build valid table URL query state from a schema:

```ts
buildTableQuery(schema, partialState)
```

Purpose:

- typed navigation
- deep linking into pre-filtered tables
- schema-aware query construction

Rules:

- every property is optional
- specified filters should only allow schema-configured UI filters

## State Model

The table runtime should expose:

- `table.api`
- `table.state`
- `table.meta`

### `state`

`state` contains user-controlled or persisted state:

- `search`
- `filters`
- `sorting`
- `pagination`
- `selection`
- `activeView`
- `activeLayout`

### `meta`

`meta` contains derived/runtime state:

- `rows`
- `rowCount`
- `pageCount`
- `selectedRows`
- `selectedCount`
- `isLoading`
- `error`
- `loading.context`
- `loading.data`
- `loading.pageContext`
- `errors.context`
- `errors.data`
- `errors.pageContext`
- resolved `context`
- resolved `pageContext`
- layout availability flags

## Search

Public naming:

- use `search`
- not `searchQuery`

Search lives inside the filter config:

```ts
filters: {
  search: {
    fields: ['name', 'email'],
    placeholder: 'Search users...'
  }
}
```

Rules:

- search is a dedicated config
- placeholder is overridable
- it remains separate from UI filter definitions

## Filters

Filters are decoupled from columns.

Top-level structure:

```ts
filters: {
  search: { ... },
  static: [...],
  ui: filter => [...]
}
```

### Static filters

Static filters remain first-class.

They are useful for cases like:

- pre-scoping by organisation
- watchlist/item id filtering
- any schema-defined hidden filter logic

Static filters support:

- `key`
- `operator`
- `value`
- `views`
- `condition`

Rules:

- `key` targets the row property path directly
- filters are not modeled as column-bound config
- property-backed filter keys should infer from the row shape

Rules:

- static filters are reactive
- if their `value` or `condition` changes, the table refreshes
- they compile into the same effective filter pipeline as UI filters

### UI filters

UI filters use builder-callback API only:

```ts
ui: filter => [...]
```

First iteration filter types:

- `text`
- `option`
- `boolean`
- `number`
- `date`

Each filter type needs flexible operator configuration and UI configuration.

Labels across filters should consistently support:

- plain string
- render function returning VNode-like content

### Filter rule shape

Canonical runtime filter state is a normalized array of rules.

Rules:

- use `value`, not `values`
- option values are not limited to strings
- they may be string / number / boolean based depending on the option domain

### Effective filter provenance

Effective filters must expose provenance publicly so APIs/serializers can treat static and UI filters differently.

Effective rule shape should include:

```ts
{
  source: 'static' | 'ui',
  key: 'status',
  type: 'option',
  operator: 'isAnyOf',
  value: [...]
}
```

### Operator vocabulary

Locked operator vocabulary:

- `contains`
- `notContains`
- `is`
- `isNot`
- `startsWith`
- `endsWith`
- `isEmpty`
- `isNotEmpty`
- `gt`
- `gte`
- `lt`
- `lte`
- `between`
- `before`
- `after`
- `isAnyOf`
- `isNoneOf`

### Filter UI

Filter builder UI is first-class.

The UX direction should strongly take inspiration from Bazza UI:

- rule builder UI
- active filter chips
- operator selection
- async options

## Columns

Columns use builder-callback API only:

```ts
table: {
  columns: column => [...]
}
```

First iteration column types:

- `field`
- `composite`
- `display`

### Field column

`field` is a property-backed column.

Rules:

- the field path is the source of truth
- it does not expose `sortableKey`
- if sortable behavior is enabled, it sorts on that same property
- custom rendering is still allowed
- field callbacks receive the full `row`
- field callbacks receive a typed `value` resolved from the field path
- this applies to `render(...)` and other row-aware field callbacks such as:
  - `cellProps(...)`
  - `colSpan(...)`
  - `rowSpan(...)`
  - `labelRowSpan(...)`

### Composite column

Used for derived/custom-id columns.

Can still define:

- `sortableKey`

for sorting against a real underlying property.

### Display column

Used for pure presentation:

- actions
- thumbnails
- arbitrary UI content

## Row Key

`rowKey` remains:

- required
- static
- string property path
- must resolve to string/number

Example:

```ts
rowKey: 'itemShortId'
```

Labels across columns and table UI should consistently support:

- plain string
- render function returning VNode-like content

## Views

Keep the existing `views` model.

Do not introduce a generalized variant abstraction for first iteration.

Scoped config should continue to support:

- `views`
- `condition`

This applies consistently across relevant schema blocks.

## Context and Page Context

Both are retained because they are highly valuable.

### Context

Resolved before table data.

Available:

- to the table query/loader
- to static filters
- to rendering
- to actions

### Page context

Resolved after table rows load.

Available for current page rows only.

Useful when some row-dependent secondary data cannot be loaded in the primary source call.

### Lifecycle

Loading lifecycle:

1. load `context`
2. load table data
3. load `pageContext`

### Context/pageContext config shape

Keep array-based API.

Do not switch to object-based entries.

Context/pageContext items support:

- `key`
- `loader` xor `query`
- `views`
- `condition`

Rules:

- same XOR rule as main source: `loader` or `query`, never both
- no serializer for context/pageContext
- pageContext receives full current page rows

### Public exposure

Resolved context values live in `table.meta`.

Mutation APIs remain:

- `updateContext`
- `updatePageContext`

with updater-function style.

## Sorting

Public naming:

- state: `sorting`
- setter: `setSorting`
- config: `defaultSorting`

### Table mode sorting

Table sorting remains column-driven.

First iteration should only support simple sorting.

Multi-sorting is deferred for later.

### Grid mode sorting

Grid sorting remains a separate config.

Improvement over V1:

- property-based options
- each property can expose both directions
- avoid separate asc/desc option authoring

## Layout

Keep the V1 mental model:

```ts
defaultLayout: 'table',
table: { ... },
grid: { ... }
```

Layout switching remains first-class.

## Controls

Keep the V1 controls concept and value model.

Current shape stays broadly the same:

```ts
controls: {
  refresh: false,
  layout: { table: true, grid: 'false lg:true' },
  actions: { table: true, grid: false }
}
```

Rules:

- keep current keys
- keep boolean
- keep responsive string DSL
- keep per-layout object values
- improve typings and consistency only

### Responsive DSL

Keep the responsive string DSL from V1.

Reuse the shared implementation where possible.

Important implementation note:

- current SSR viewport dependency on `nuxt-viewport` must be abstracted/replaced

## Actions

Keep:

- `actions`
- `rowActions`

### `actions`

Remains the bulk/selection action array.

Keep it flat.

### `toolbarActions`

Add a distinct top-level concept:

- `toolbarActions`

Purpose:

- page/table-level actions not tied to selection
- e.g. create, export, custom toolbar actions

Rules:

- `toolbarActions` should mostly reuse the same action model as bulk actions
- action-like schema items should support either:
  - `action`
  - `link`

This applies conceptually across:

- `actions`
- `rowActions`
- `toolbarActions`

### Row actions

Keep `rowActions` conceptually close to V1.

### Entity actions

Retain `defineEntityActions`.

Reason:

- same action system can be reused in table row context and outside of table context in standalone components
- typed events are valuable
- target-based behavior is valuable

### `<RowActions>`

Keep `<RowActions>` as a table-only component.

Rules:

- wraps `UDropdownMenu`
- action items are provided/injected automatically
- expose normal dropdown config such as placement
- outside table context, use `defineEntityActions`, not `<RowActions>`

## Selection

Selection remains key-based.

Derived selected rows/count live in `meta`.

### Selection state

- `state.selection` is canonical
- `meta.selectedRows` is derived
- `meta.selectedCount` is derived

### Selection API

Expose a small selection API on `table.api`:

- `clearSelection()`
- `setSelection(keys)`
- `toggleSelection(key)`

### Selection column

When enabled, selection column is first.

Selection configuration should support mode-like strategies such as:

- `always`
- `hidden`
- `auto`

### Grid selection

No selection in grid mode for first iteration.

Bulk actions are therefore hidden/unavailable in grid mode by default, but overridable later.

## Table API

Keep one unified public `TableApi`.

Keep at least:

- `refresh()`
- `setSearch(...)`
- `setPage(...)`
- `setPageSize(...)`
- `setSorting(...)`
- `setFilters(...)`
- `resetFilters()`
- `updateRow(...)`
- `updateRows(...)`
- `clearSelection()`
- `setSelection(...)`
- `toggleSelection(...)`
- `updateContext(...)`
- `updatePageContext(...)`

### Refresh

One public `refresh()` only for first iteration.

No phase-specific public refresh methods yet.

### Row updates

First iteration rule:

- `updateRow` / `updateRows` patch only the current visible table state

Future scope:

- table hooks around row updates
- possible query cache invalidation integration later

## Persistence

Persistence supports:

```ts
persistence: true
```

and:

```ts
persistence: {
  state: true,
  preferences: true
}
```

Preferences include things like:

- column visibility
- column order
- column pinning
- layout
- page size

### Persistence storage

Persistence backend must be abstracted.

Do not tie the design to Nuxt `useCookie`.

Must work with:

- Nuxt
- non-Nuxt Vue apps
- SSR

Like serializers, persistence adapters should be configurable globally.

## Column Config Panel

Keep this feature and treat it as first-class.

First iteration should support:

- visibility
- order
- pinning
- resizing

### Entry point

Single compact overlay entry point.

Not separate controls for each concern.

### Reorder

- panel-based ordering first
- header drag-and-drop later

### Resizing

- first iteration
- standard header-edge resize handles

## Footer

Default footer remains built-in and layout-shared.

It should expose:

- selected count
- total row count
- pagination controls

Same footer model for both table and grid layouts.

### Column summaries

Column summary rows are future scope.

Not required for first iteration, but should remain possible later.

## Empty / Loading / Error States

Main handling remains built into `DataList`, with customization points.

### Empty state

Keep layout-specific empty slots.

### Grid loader

Keep dedicated custom grid skeleton / loader support.

### Errors and loading

Expose both:

- aggregated loading/error state
- phase-specific loading/error state

## UI Composition

Keep `<DataList>` as the main convenience component.

Also provide public composable UI pieces for advanced layouts.

First iteration public pieces should stay focused on larger blocks.

Naming remains:

- `DataList`
- `DataListToolbar`
- `DataListFilters`
- `DataListContent`
- `DataListPagination`

Keep `DataList` naming because the abstraction supports both table and grid layouts.

## Toolbar Layout Direction

Default direction:

### Top row

- filter trigger
- search
- right-side toolbar actions / layout switch / column config

### Second row

- active filter chips / previews
- wraps naturally
- clear/reset filters action lives here by default

This is preferred over trying to force active filters inline in the main top row.

## Header Interaction Direction

Column header itself should open the dropdown.

Default header menu items:

- sort asc
- sort desc
- hide
- pin left
- pin right

Visual affordance should appear on hover.

## UI Direction

V2 should move away from the current V1 look.

Target direction:

- more compact
- less cramped
- calmer button sizing
- stronger toolbar hierarchy
- more discoverable header interactions
- cleaner shell overall
- subtler and more polished motion/interactions

Bazza-style compact filter chips and richer header dropdowns are key inspiration points.

Animation and micro-interactions are a high-priority UI concern once core runtime work is stable.

## Async Sources Beyond Table Data

The same dual async strategy should be reused across the system:

- uncached resolver via `loader`
- query-backed resolver via `query`

This is relevant not only for table data but also for:

- async filter options
- `context`
- `pageContext`
- any field that may need remote suggestions

For query-backed schemas, async option sources should be able to leverage query-backed caching as well.

## Testing

Testing selectors remain a first-class concern.

Do not keep the V1 implementation blindly.

Rewrite from scratch if needed.

Recommended split:

- generic selector primitives in `shared`
- table-specific selector helpers in the table package

## Package Architecture

For now:

- keep one `table` package
- do not split into separate `table-core` / `table-ui` packages yet

Organize internally instead.

Likely internal structure:

- `core/`
- `components/`
- `composables/`
- `types/`

Additional packages still make sense for:

- `shared`
- `nuxt`

## Deferred / Future Scope

Explicitly deferred:

- tree mode / nested rows / row expansion
- inline editable/input columns
- header drag-and-drop reordering
- cursor pagination

Potential future scope:

- table macros / schema extensions such as access-control macros
- query cache invalidation hooks on row updates
- column summaries / summary rows

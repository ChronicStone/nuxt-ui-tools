# Facet Architecture Spec

## Overview

Three remote paths + one client path. All opt-in at every layer.

```
Path A — Global batched facets    separate query, filter-context only (no pagination/sort)
Path B — Embedded in main query   facets travel with rows in one HTTP call
Path C — Per-filter override      per-filter query with search, cursor, high-cardinality support
Path D — Count from option query  filter's source.query entries carry count (already works, stays)
Client — Computed from rows       unchanged client-mode behavior
```

**Resolution priority per filter:**

```
Path C  →  Path A  →  Path B  →  Client
```

**Path A vs Path B selection (automatic):**

- `source.facets` defined → **Path A** (dedicated query, filter-context only, preferred)
- `source.facets` absent → **Path B** (table injects `facets` into query ctx, reads from response)

---

## Layer 1 — Source-level types (`types/source.ts`)

### `TableGlobalFacetDescriptor`

Simplified shape for global paths. No `search` or `cursor` — those belong to Path C only.

```ts
interface TableGlobalFacetDescriptor<TKey extends string = string> {
  key: TKey
  mode?: 'exclude-self' | 'include-self'
  limit?: number
}
```

### `TableSourceRequestContext`

Gets an optional `facets` slot injected by the table engine when Path B is active.

```ts
interface TableSourceRequestContext<TRow, TContext, TSortKey> {
  pagination: TablePaginationState
  sorting: TableSortingRule<TSortKey>[]
  filters: TableResolvedFilterGroup
  search: TableSourceSearchRequest<TRow>
  context: TContext
  facets?: TableGlobalFacetDescriptor[]  // injected for Path B only
}
```

### `TableSourceExecutionResult`

Can optionally return embedded facets for Path B.

```ts
interface TableSourceExecutionResult<TRow> {
  rows: TRow[]
  rowCount: number
  facets?: TableFacetResult[]  // returned by server when ctx.facets was present
}
```

### `TableFacetsContext`

Replaces the current `{ table, facets }` shape on `source.facets`.

Strips `pagination` and `sorting` — global facets only depend on filter/search state.

```ts
interface TableFacetsContext<TRow, TContext> {
  filters: TableResolvedFilterGroup
  search: TableSourceSearchRequest<TRow>
  context: TContext
  facets: TableFacetRequestDescriptor[]
}
```

> **Breaking change from current shape.** The current `source.facets` receives `{ table: TableSourceRequestContext, facets }`.
> The new shape drops `table` and flattens to `{ filters, search, context, facets }` directly.
> Playground usage will need updating.

### `TableRemoteSource`

`facets` signature updates to the new context shape.

```ts
interface TableRemoteSource<TRow, TContext, TResult> {
  mode: 'remote'
  query: (ctx: TableSourceRequestContext<TRow, TContext>) => TableQueryDefinition<TResult>

  // Path A — batched global facets, separate query, filter-context only
  facets?: (ctx: TableFacetsContext<TRow, TContext>) => TableQueryDefinition<TableFacetExecutionResult>

  // Path B — no extra field needed:
  //   when source.facets is absent, the table injects ctx.facets into query()
  //   and reads facets back from the response
}
```

---

## Layer 2 — Filter-level facet config (`types/filters.ts`)

### Current shape

```ts
type TableFilterFacetMode = boolean | 'exclude-self' | 'include-self'
// used as: source.facet?: TableFilterFacetMode
```

### Proposed shape

```ts
// Shorthand stays unchanged — backward compatible
type TableFilterFacetMode = boolean | 'exclude-self' | 'include-self'

// New full object form
interface TableFilterFacetConfig {
  mode?: 'exclude-self' | 'include-self'
  limit?: number
  // Path C: per-filter override — bypasses global path entirely
  query?: (ctx: TableFilterFacetQueryContext) => TableQueryDefinition<TableFacetExecutionResult>
}

// Unified union — source.facet accepts either
type TableFilterFacetSpec = TableFilterFacetMode | TableFilterFacetConfig

// Context for a per-filter override query
interface TableFilterFacetQueryContext<TRow, TContext> {
  table: TableFacetsContext<TRow, TContext>  // filter/search/context only, no pagination/sort
  facets: TableFacetRequestDescriptor[]       // this filter's descriptor (includes search, limit, cursor)
}
```

**Shorthand → object mapping:**

```
true                → { mode: 'exclude-self' }
'exclude-self'      → { mode: 'exclude-self' }
'include-self'      → { mode: 'include-self' }
{ mode, limit }     → global path with explicit limit
{ mode, query }     → Path C, per-filter override
```

### Filter definition `source` fields

Option filter `source.facet` type changes from `TableFilterFacetMode` to `TableFilterFacetSpec`.
Boolean filter `source.facet` same change.

```ts
interface TableOptionFilterSource<TValue, TPresentation> {
  options?: ReadonlyArray<TableOptionEntryForPresentation<TValue, TPresentation>>
  query?: (ctx: TableFilterOptionQueryContext) => TableQueryDefinition<...>
  facet?: TableFilterFacetSpec   // was: TableFilterFacetMode
  sort?: 'alpha' | 'count'
}

interface TableBooleanFilterSource {
  facet?: TableFilterFacetSpec   // was: TableFilterFacetMode
}
```

### Path D — count from option query (no new config)

When a filter's `source.query` returns entries with `count: number`, the resolver uses them directly
before falling back to facet counts or client derivation. No new config needed — stays as-is.

```ts
// Entry with count from server
{ label: 'Engineering', value: 'Engineering', count: 42 }

// Resolver priority per entry:
//   entry.count  →  sum of children counts  →  facet count  →  client-derived
```

---

## Layer 3 — Internal data composable (`use-table-data.ts`)

### New: facets-relevant context

A computed that only tracks `filters + search + context` — excludes `pagination` and `sorting`.
This is the cache key for Path A so that pagination/sort changes do NOT invalidate global facets.

```ts
const facetsRequestContext = computed(() => ({
  filters: requestFilters.value,
  search: requestSearch.value,
  context: contextData.value,
}))
```

### New: global facets descriptors

Collected from all filters that have `source.facet` set and do NOT have a per-filter override query.
These go to Path A or Path B.

```ts
const globalFacetsDescriptors = computed<TableGlobalFacetDescriptor[]>(() =>
  (schema.value.filters?.ui ?? []).flatMap((definition) => {
    if (definition.kind !== 'option' && definition.kind !== 'boolean') return []
    const spec = definition.source?.facet
    if (!spec) return []
    // skip filters with per-filter override query (Path C)
    if (typeof spec === 'object' && typeof spec.query === 'function') return []

    const mode = resolveGlobalFacetMode(spec)
    const limit = typeof spec === 'object' ? spec.limit : undefined
    return [{ key: definition.key, mode, limit }]
  }),
)
```

### Path A — global facets query

Separate `useQuery` driven by `facetsRequestContext` (filter-context only).
Does not re-fetch when pagination or sort changes.

```ts
const globalFacetsQuery = useQuery(computed(() => {
  if (!remoteSource.value?.facets || !globalFacetsDescriptors.value.length)
    return { queryKey: ['global-facets', 'disabled'], enabled: false }

  return withEnabled(
    remoteSource.value.facets({
      ...facetsRequestContext.value,
      facets: globalFacetsDescriptors.value,
    }),
    isContextReady.value,
    { staleTime: QUERY_DEFAULTS.staleTime.filterOptions },
  )
}))
```

### Path B — embedded facets from main query

When `source.facets` is absent, inject `facets` into the main request context **only when
the facets-relevant context has changed** (filters or search). On pagination/sort-only changes,
`ctx.facets` is omitted so the server skips computing them, and the client keeps its cached result.

```ts
// Track last facets context fingerprint to detect real changes
const lastFacetsContextKey = shallowRef<string | null>(null)

const facetsContextKey = computed(() =>
  JSON.stringify(facetsRequestContext.value),
)

// Inject facets only when filter/search context changed — not on pagination/sort
const requestContextWithFacets = computed<TableSourceRequestContext>(() => {
  const isPathB = !remoteSource.value?.facets
  const facetsChanged = facetsContextKey.value !== lastFacetsContextKey.value

  return {
    ...requestContext.value,
    facets: isPathB && facetsChanged ? globalFacetsDescriptors.value : undefined,
  }
})

// Extract from response — only store when facets were actually requested
const embeddedFacets = shallowRef<TableFacetResult[]>([])

watch(() => query.data.value, (nextData) => {
  // ...existing row sync...

  const embedded = extractFacetsFromResponse(nextData)
  if (embedded) {
    embeddedFacets.value = embedded
    lastFacetsContextKey.value = facetsContextKey.value  // mark as resolved
  }
})
```

### Merged `facets` output

```ts
const facets = computed<TableFacetExecutionResult<string>>(() => {
  if (schema.value.source.mode === 'client')
    return executeClientFacets({ ... })

  // Path A wins when source.facets is defined
  if (remoteSource.value?.facets)
    return globalFacetsQuery.data.value ?? { facets: [] }

  // Path B fallback: embedded in main query response
  return { facets: embeddedFacets.value }
})
```

---

## Layer 4 — Filter options composable (`use-table-filter-options.ts`)

### Path C — per-filter override query

```ts
const filterFacetConfig = computed<TableFilterFacetConfig | null>(() => {
  const spec = definition.source?.facet
  if (!spec || typeof spec !== 'object') return null
  return spec
})

const hasPerFilterOverrideQuery = computed(
  () => typeof filterFacetConfig.value?.query === 'function',
)

const perFilterFacetQuery = useQuery(computed(() => {
  if (!hasPerFilterOverrideQuery.value || !isRemoteTable.value)
    return { queryKey: ['per-filter-facet', definition.key, 'disabled'], enabled: false }

  return withEnabled(
    filterFacetConfig.value!.query!({
      table: queryContent.facetsBaseContext.value,
      facets: [{
        key: definition.key,
        mode: filterFacetConfig.value!.mode,
        search: facetSearch.value,
        limit: filterFacetConfig.value!.limit,
        cursor: undefined,
      }],
    }),
    shouldResolveCounts.value,
    { staleTime: QUERY_DEFAULTS.staleTime.filterOptions },
  )
}))
```

### Unified facet counts resolution

```ts
const facetCounts = computed<TableFacetOptionResult[]>(() => {
  if (!usesFacetCounts.value) return []

  if (isRemoteTable.value) {
    // Path C: per-filter override
    if (hasPerFilterOverrideQuery.value)
      return perFilterFacetQuery.data.value?.facets.find(f => f.key === definition.key)?.options ?? []

    // Path A or B: global facets from use-table-data
    return queryContent.facets.value.facets.find(f => f.key === definition.key)?.options ?? []
  }

  // Client: from use-table-data computed
  return queryContent.facets.value.facets.find(f => f.key === definition.key)?.options ?? []
})
```

**Removed:** the current per-filter `facetQuery` that called `remoteSource.facets()` directly.
That responsibility moves to `use-table-data.ts` as a single batched query (Path A).

---

## Consumer API examples

### Minimal — Path B (embedded in main query)

Zero extra HTTP calls. Facets travel with rows. Server computes them when `ctx.facets` is present.

```ts
source: {
  mode: 'remote',
  query: ({ facets, ...request }) => ({
    queryKey: ['employees', request, facets],
    queryFn: async () => api.queryTable({ request, facets }),
    // response shape: { rows, rowCount, facets?: TableFacetResult[] }
  }),
}

// Filter opts in — shorthand unchanged
filter.option('department.name', {
  source: { facet: 'exclude-self' },
})
filter.boolean('isActive', {
  source: { facet: true },
})
```

### Standard — Path A (dedicated batched facets query)

Clean separation. Facets re-fetch only when filters/search change, not on pagination/sort.

```ts
source: {
  mode: 'remote',
  query: (request) => ({
    queryKey: ['employees', request],
    queryFn: async () => api.queryTable({ request }),
  }),
  facets: ({ filters, search, context, facets }) => ({
    queryKey: ['employee-facets', filters, search, context, facets],
    queryFn: async () => api.queryFacets({ filters, search, context, facets }),
  }),
}
```

### Per-filter override — Path C

For high-cardinality fields that need search or cursor support.

```ts
filter.option('assigneeId', {
  label: 'Assignee',
  source: {
    facet: {
      mode: 'exclude-self',
      limit: 20,
      query: ({ table, facets }) => ({
        queryKey: ['assignee-facets', table, facets],
        queryFn: async () => api.queryAssigneeFacets({ table, facets }),
      }),
    },
  },
  editor: { searchable: true },
})
```

### Count from option query — Path D

No `facet` config needed. Counts come from the option entries themselves.

```ts
filter.option('departmentId', {
  label: 'Department',
  source: {
    query: ({ search }) => ({
      queryKey: ['dept-options', search],
      queryFn: async () => api.deptOptions({ search }),
      // api returns: [{ label, value, count }, ...]
    }),
    // facet not set — counts come from entry.count directly
  },
})
```

### Full mix

All four paths on one table.

```ts
source: {
  mode: 'remote',
  query: ({ facets, ...request }) => ({
    queryKey: ['employees', request, facets],
    queryFn: async () => api.queryTable({ request, facets }),
  }),
  facets: ({ filters, search, context, facets }) => ({
    queryKey: ['employee-facets', filters, search, context, facets],
    queryFn: async () => api.queryFacets({ filters, search, context, facets }),
  }),
},
filters: {
  ui: (filter) => [
    // Path A — uses source.facets (global batched)
    filter.option('department.name', {
      source: { facet: 'exclude-self' },
    }),

    // Path A with explicit limit
    filter.option('department.company.country', {
      source: { facet: { mode: 'exclude-self', limit: 10 } },
    }),

    // Path C — per-filter override with search
    filter.option('assigneeId', {
      source: {
        facet: {
          mode: 'exclude-self',
          limit: 20,
          query: ({ table, facets }) => ({
            queryKey: ['assignee-facets', table, facets],
            queryFn: async () => api.queryAssigneeFacets({ table, facets }),
          }),
        },
        query: ({ search }) => ({
          queryKey: ['assignee-options', search],
          queryFn: async () => api.assigneeOptions({ search }),
        }),
      },
      editor: { searchable: true },
    }),

    // Path D — counts from option query entries
    filter.option('skillId', {
      source: {
        query: ({ search }) => ({
          queryKey: ['skill-options', search],
          queryFn: async () => api.skillOptions({ search }),
          // entries carry count: number
        }),
      },
    }),

    // Boolean — global path
    filter.boolean('isActive', {
      source: { facet: true },
    }),
  ],
}
```

---

## Re-fetch behavior summary

| Change                     | Path A query | Path B rows  | Path B facets | Path C query |
|----------------------------|:------------:|:------------:|:-------------:|:------------:|
| filters change             | ✓ re-fetch   | ✓ re-fetch   | ✓ re-fetch    | ✓ re-fetch   |
| search changes             | ✓ re-fetch   | ✓ re-fetch   | ✓ re-fetch    | ✓ re-fetch   |
| pagination change          | — cached     | ✓ re-fetch   | — omitted     | — cached     |
| sort change                | — cached     | ✓ re-fetch   | — omitted     | — cached     |
| filter search (per-filter) | — n/a        | — n/a        | — n/a         | ✓ re-fetch   |

> **Path B mechanics:** on pagination/sort-only changes, `ctx.facets` is omitted from the request.
> The server skips facet computation entirely and returns rows only. The client keeps its previously
> resolved facets. This gives Path B the same facet caching behavior as Path A with no extra query.

---

## Open questions

**1. `source.facets` context breaking change**

Current shape: `{ table: TableSourceRequestContext, facets }` — includes pagination/sort.
Proposed shape: `{ filters, search, context, facets }` — strips pagination/sort.

This is the right semantic but breaks existing `source.facets` implementations (playground).
Confirm this is an acceptable breaking change.

**2. Path B as explicit opt-in vs automatic fallback**

Current proposal: Path B activates automatically when `source.facets` is absent and filters have
`source.facet`. Alternative: require an explicit `embeddedFacets: true` flag on the source to opt in.

Explicit is safer (no surprise `ctx.facets` in query context). Implicit is more convenient.

**3. `limit` on the shorthand form**

Currently `facet: 'exclude-self'` is a string shorthand. To set a `limit`, you'd need the object
form `{ mode: 'exclude-self', limit: 8 }`. Is that acceptable or should the shorthand be extended?

**4. Path B stale facets on pagination/sort**

When only pagination or sort changes (Path B), the main query re-fetches and a new response with facets
arrives. Since facets didn't logically change, should we skip updating `embeddedFacets` when we can
detect the filter context didn't change? Or accept the minor redundancy?

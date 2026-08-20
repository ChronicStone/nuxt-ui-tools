# Table Data Modes

Current source modes:

- `client`
- `remote`

## Client Mode

Use client mode when the dataset can be loaded locally and queried in-memory.

Example:

```ts
source: {
  mode: 'client',
  query: () => ({
    queryKey: ['employees'],
    queryFn: async () => [
      { id: '1', fullName: 'Emma Martin', email: 'emma@example.com' },
      { id: '2', fullName: 'Luca Sato', email: 'luca@example.com' },
    ],
  }),
}
```

What you return:

- an array of rows
- or an object with `rows` and `rowCount`

Client mode also includes built-in data-layer execution for:

- filtering
- search
- sorting
- pagination
- facet counts for filters that opt into `source.facet`

## Remote Mode

Use remote mode when filtering, sorting, pagination, or option counts should be server-backed.

Example:

```ts
source: {
  mode: 'remote',
  query: (request) => ({
    queryKey: ['employees', request],
    queryFn: async () => api.queryTable({ request }),
  }),
}
```

What your `request` contains:

- pagination
- sorting
- resolved filters
- search
- context

What your API may return for offset pagination:

```ts
// compact table-native shape
{
  rows: EmployeeRow[],
  rowCount: number
}

// resource-style shape, accepted directly (for example drizzle-resource)
{
  rows: EmployeeRow[],
  pageInfo: {
    mode: 'offset',
    pageIndex: number,
    pageSize: number,
    hasNextPage: boolean,
    count: 'exact',
    rowCount: number,
  },
  facets?: TableFacetResult[],
}
```

Cursor sources return the matching `pageInfo: { mode: 'cursor', nextCursor, ... }` shape. This lets
query-resource backends pass their page result straight through without an adapter that only moves
`pageInfo.rowCount` to the root.

Remote mode can also provide:

- remote facets
- remote filter-option queries

Remote facet counts are configured on the filter with `source.facet` and implemented on the source with `source.facets(...)`.

## Route prefetch

Pair a table page with the `defineQueryPrefetch(...)` macro when links should warm the exact
destination state before navigation:

```ts
defineQueryPrefetch('employees', ({ route }) =>
  prefetchTable({ route, schema: employeesSchema() }),
)
```

`prefetchTable(...)` resolves the route's `l`, `p.*`, `s.*`, and `f.*` query keys and stages context,
source/facet/option, then page-context queries in dependency order. The mounted table reuses the
same TanStack Query cache entries.

## Choosing Between Them

Use client mode for:

- local datasets
- simpler setups
- built-in client-side query behavior
- client-computed facet counts when filters opt into `source.facet`

Use remote mode for:

- large datasets
- server-backed filtering/sorting/pagination
- dynamic facet and option loading

# Table Pagination

The schema supports numbered offset pages, cursor-backed incremental loading, and complete unpaginated results. Omitted pagination keeps the existing offset behavior.

## Offset pagination

```ts
pagination: {
  mode: 'offset',
  defaultSize: { table: 20, grid: 12 },
  sizeOptions: { table: [20, 50, 100], grid: [12, 24, 48] },
  showPageSizePicker: true,
  showPagesList: true,
  showPagesCount: true,
}
```

The source receives `{ mode: 'offset', pageIndex, pageSize, count: 'exact' }`. Page and size remain URL-backed as `?p.page=3&p.size=50`, and `<UiDataListPagination />` renders the numbered footer.

## Cursor pagination

Cursor mode is for remote sources and accumulates pages with TanStack Query. The request and response are structurally compatible with Drizzle Resource 2.0 without adding it as a dependency.

```ts
const schema = defineTableSchema({
  tableKey: 'employees',
  rowKey: 'id',
  pagination: { mode: 'cursor', pageSize: 24, count: 'none' },
  source: {
    mode: 'remote',
    query: (request) => ({
      queryKey: ['employees', request],
      queryFn: async () => api.listEmployees(request),
    }),
  },
})
```

Each request contains:

```ts
{
  mode: 'cursor',
  cursor: string | null,
  pageSize: 24,
  count: 'none' | 'exact',
}
```

Return one page at a time:

```ts
{
  rows,
  pageInfo: {
    mode: 'cursor',
    pageSize: 24,
    nextCursor: 'opaque-cursor-or-null',
    count: 'none',
    rowCount: null,
  },
}
```

Use `<UiDataListInfiniteLoader />` inside `<UiDataListContent>` for automatic loading, or set `:auto="false"` for a load-more button. Cursor values and accumulated pages are never written to the URL. Changing search, filters, sorting, or page size resets accumulation to a null cursor.

`table.data.loadedRowCount` is always the rendered row count. `table.data.totalRowCount` is `null` with `count: 'none'` and the exact filtered total with `count: 'exact'`.

## No pagination

```ts
pagination: false
```

The source receives `{ mode: 'none' }`. Client data is not sliced, no `p.*` URL keys are created, and neither the numbered footer nor infinite loader renders.

# Table Schema Surface

The current schema sections are:

```ts
defineTableSchema({
  tableKey,
  rowKey,
  source,
  defaultLayout,
  pagination,
  context,
  pageContext,
  filters,
  table,
  grid,
  selection,
  actions,
  toolbarActions,
  rowActions,
  controls,
  persistence,
})
```

## Minimal Example

```ts
const schema = defineTableSchema({
  tableKey: 'employees',
  rowKey: 'id',
  source: {
    mode: 'client',
    query: () => ({
      queryKey: ['employees'],
      queryFn: async () => rows,
    }),
  },
  table: {
    columns: (column) => [
      column.field('fullName', { label: 'Employee' }),
    ],
  },
})
```

## Most Common Sections

In most setups you will use:

- `source`
- `filters`
- `pagination`
- `table`
- optionally `grid`

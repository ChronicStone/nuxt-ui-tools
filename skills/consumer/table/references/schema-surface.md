# Table Schema Surface

The current schema sections are:

```ts
defineTableSchema({
  tableKey,
  rowKey,
  source: tableSource({ ... }),
  defaultLayout,
  rowLabel,
  empty,
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
  source: tableSource({
    mode: 'client',
    query: () => ({
      queryKey: ['employees'],
      queryFn: async () => rows,
    }),
  }),
  table: {
    columns: (column) => [column.field('fullName', { label: 'Employee' })],
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

## Record Names And First Use

- `rowLabel: (row) => row.name` names each record for assistive technology: the row checkbox reads "Select {name}", the row-actions button "Actions for {name}", and the mobile actions sheet is titled with it. Without it the controls name the row by its position on the page. See `selection.md`.
- `empty: { icon, title, description, action }` is what the list shows while it has no record at all, including a first action. See `layouts.md`.
- `table.summary` reads each record as one compact row below `md`. See `layouts.md`.

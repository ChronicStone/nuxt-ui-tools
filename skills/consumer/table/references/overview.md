# Table Overview

The table surface is schema-driven.

The normal consumer flow is:

1. define a table schema with `defineTableSchema(...)`
2. describe source, filters, columns, sorting, pagination, and layouts in that schema
3. create a table instance with `useTable(schema)`
4. render it with `DataList`

## Main Public APIs

- `defineTableSchema`
- `useTable`
- `DataList`

## What You Usually Write

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
      column.field('email', { label: 'Email' }),
    ],
  },
})

const table = useTable(schema)
```

```vue
<DataList :table="table" size="sm" />
```

## Coverage Map

Use these references depending on the question:

- `getting-started.md`
- `data-modes.md`
- `url-state.md`
- `schema-surface.md`
- `layouts.md`
- `pagination.md`
- `sorting.md`
- `filters.md`
- `columns.md`
- `selection.md`
- `context.md`
- `actions.md`
- `slots.md`
- `patterns.md`

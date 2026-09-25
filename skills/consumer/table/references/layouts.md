# Table Layouts

Current layout surface:

- `defaultLayout`
- `table`
- `grid`

## Default Layout

```ts
defaultLayout: 'table'
```

or:

```ts
defaultLayout: 'grid'
```

## Table Layout Config

```ts
table: {
  defaultSorting: {
    key: 'hiredAt',
    dir: 'desc',
  },
  columns: (column) => [
    column.field('fullName', { label: 'Employee' }),
  ],
}
```

## Grid Layout Config

```ts
grid: {
  enabled: true,
  gridSize: 3,
  itemSize: 'md',
  defaultSorting: {
    key: 'fullName',
    dir: 'asc',
  },
  renderItem: ({ row }) => `${row.fullName} - ${row.department.name}`,
}
```

## Common Dual-Layout Setup

```ts
const schema = defineTableSchema({
  tableKey: 'employees',
  rowKey: 'id',
  defaultLayout: 'table',
  source: tableSource({
    mode: 'client',
    query: () => ({
      queryKey: ['employees'],
      queryFn: async () => rows,
    }),
  }),
  table: {
    columns: (column) => [
      column.field('fullName', { label: 'Employee' }),
      column.field('email', { label: 'Email' }),
    ],
  },
  grid: {
    enabled: true,
    gridSize: 3,
    renderItem: ({ row }) => `${row.fullName} - ${row.email}`,
  },
})
```

When the active layout changes, the table runtime keeps using the same table instance and updates URL-backed layout state through the `l` query param.

## Responsive Layouts

`table.enabled` and `grid.enabled` accept responsive values. Disabling the table below a breakpoint switches phones to the grid while desktop keeps the table and the layout toggle:

```ts
table: {
  enabled: 'false md:true',
  columns: (column) => [/* ... */],
},
grid: {
  gridSize: '1 md:2 xl:3',
  renderItem: ({ row }) => h(EmployeeCard, { employee: row }),
},
```

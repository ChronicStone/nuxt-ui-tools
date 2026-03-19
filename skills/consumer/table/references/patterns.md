# Table Patterns

## Good Pattern

```ts
const schema = defineTableSchema({
  tableKey: 'employees',
  rowKey: 'id',
  source: { ... },
  filters: { ... },
  table: {
    columns: (column) => [
      column.field('fullName', { label: 'Employee' }),
    ],
  },
})
```

Keep behavior in the schema instead of rebuilding table logic outside the package surface.

## Good Pattern: Remote Data + URL State

```ts
const schema = defineTableSchema({
  tableKey: 'employees',
  rowKey: 'id',
  source: {
    mode: 'remote',
    query: (request) => ({
      queryKey: ['employees', request],
      queryFn: async () => api.queryEmployees(request),
    }),
  },
  filters: {
    search: {
      fields: ['fullName', 'email'],
    },
  },
  table: {
    columns: (column) => [column.field('fullName', { label: 'Employee' })],
  },
})
```

This lets the table surface own filtering, sorting, and pagination state instead of scattering that state across unrelated page code.

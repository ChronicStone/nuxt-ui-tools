# Table Pagination

Pagination is configured through the `pagination` section.

## Example

```ts
pagination: {
  defaultSize: {
    table: 20,
    grid: 12,
  },
  sizeOptions: {
    table: [10, 20, 50, 100],
    grid: [12, 24, 48],
  },
  showPageSizePicker: true,
  showPagesList: true,
  showPagesCount: true,
}
```

This produces a page-size picker and URL-backed pagination state for both layouts.

## URL Result

```txt
?p.page=3&p.size=50
```

## What Changes Between Layouts

With the config above:

- table layout defaults to `20`
- grid layout defaults to `12`
- switching layout keeps using the same `p.page` and `p.size` keys

## Common Pattern

```ts
const schema = defineTableSchema({
  tableKey: 'employees',
  rowKey: 'id',
  source: {
    mode: 'remote',
    query: (request) => ({
      queryKey: ['employees', request.pagination],
      queryFn: async () => api.listEmployees(request),
    }),
  },
  pagination: {
    defaultSize: { table: 20, grid: 12 },
    sizeOptions: { table: [20, 50, 100], grid: [12, 24, 48] },
  },
  table: {
    columns: (column) => [column.field('fullName', { label: 'Employee' })],
  },
})
```

# Table Context

The schema supports:

- `context`
- `pageContext`

Use `context` for shared data needed before the main table query runs.

Use `pageContext` for data that depends on:

- current rows
- resolved context

## Example

```ts
const schema = defineTableSchema({
  tableKey: 'employees',
  rowKey: 'id',
  context: [
    {
      key: 'viewer',
      query: () => ({
        queryKey: ['viewer'],
        queryFn: async () => api.getViewer(),
      }),
    },
  ],
  pageContext: [
    {
      key: 'salaryStats',
      query: ({ rows, context }) => ({
        queryKey: ['salary-stats', context.viewer.companyId, rows.map((row) => row.id)],
        queryFn: async () => api.getSalaryStats(rows.map((row) => row.id)),
      }),
    },
  ],
  filters: {
    static: [
      {
        key: 'companyId',
        operator: 'is',
        value: (context) => context.viewer.companyId,
      },
    ],
  },
  source: tableSource({
    mode: 'remote',
    query: (request) => ({
      queryKey: ['employees', request],
      queryFn: async () => api.listEmployees(request),
    }),
  }),
  table: {
    columns: (column) => [column.field('fullName', { label: 'Employee' })],
  },
})
```

In this example:

- `context.viewer` is typed in static filters, which are resolved before the main query
- `pageContext.salaryStats` is resolved from the current page rows and shared context

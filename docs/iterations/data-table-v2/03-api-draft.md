# API Draft

The API now has a single builder.

## Builder

```ts
defineTableSchema({
  tableKey: 'users',
  rowKey: 'id',
  source: {
    mode: 'remote',
    query: (ctx) => ({
      queryKey: ['users', ctx.context.organisationId],
      queryFn: async () => ({
        rows: [],
        rowCount: 0,
      }),
    }),
  },
  context: [
    {
      key: 'organisationId',
      query: () => ({
        queryKey: ['organisation'],
        queryFn: async () => 'org_123',
      }),
    },
  ],
  pageContext: [
    {
      key: 'summary',
      query: ({ rows, context }) => ({
        queryKey: ['summary', context.organisationId, rows.length],
        queryFn: async () => `${context.organisationId}:${rows.length}`,
      }),
    },
  ],
  filters: {
    ui: (filter) => [
      filter.option('status', {
        label: 'Status',
        options: {
          query: () => ({
            queryKey: ['statuses'],
            queryFn: async () => [{ label: 'Active', value: 'active' }],
          }),
        },
      }),
    ],
  },
})
```

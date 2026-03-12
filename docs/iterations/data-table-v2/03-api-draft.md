# API Draft

The API is now split across two sibling builders with matching ergonomics.

## Base builder

```ts
defineTable({
  tableKey: 'users',
  rowKey: 'id',
  source: {
    mode: 'remote',
    loader: async (ctx) => ({
      rows: [],
      rowCount: 0,
    }),
  },
  context: [
    {
      key: 'organisationId',
      loader: async () => 'org_123',
    },
  ],
  pageContext: [
    {
      key: 'summary',
      loader: async ({ rows, context }) => `${context.organisationId}:${rows.length}`,
    },
  ],
  filters: {
    ui: (filter) => [
      filter.option('status', {
        label: 'Status',
        options: {
          loader: async () => [
            { label: 'Active', value: 'active' },
          ],
        },
      }),
    ],
  },
})
```

## Query builder

```ts
defineQueryTable({
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
            queryFn: async () => [
              { label: 'Active', value: 'active' },
            ],
          }),
        },
      }),
    ],
  },
})
```

## Shared rule

Everything outside async resolver return types should stay aligned between the two builders unless a later runtime constraint proves otherwise.

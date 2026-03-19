# Table Actions

Current action-related schema sections are:

- `actions`
- `toolbarActions`
- `rowActions`

## Example Shape

```ts
rowActions: [
  {
    key: 'open-profile',
    label: 'Open profile',
  },
]
```

```ts
toolbarActions: [
  {
    key: 'refresh',
    label: 'Refresh',
  },
]
```

## Typical Setup

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
  toolbarActions: [
    {
      key: 'refresh',
      label: 'Refresh',
      action: async ({ request }) => {
        await refreshEmployees(request)
      },
    },
  ],
  rowActions: ({ row }) => [
    {
      key: `open-${row.id}`,
      label: 'Open profile',
      action: async () => {
        await navigateTo(`/employees/${row.id}`)
      },
    },
  ],
  table: {
    columns: (column) => [column.field('fullName', { label: 'Employee' })],
  },
})
```

## When To Use Each Section

- `actions`: bulk actions that depend on selected rows
- `toolbarActions`: actions shown at the table level
- `rowActions`: per-row actions

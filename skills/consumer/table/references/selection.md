# Table Selection

Selection is configured through `selection` and related table behavior.

## Example

```ts
selection: {
  mode: 'auto',
}
```

## What `mode` Means

- `false`: disable selection
- `true`: always enable selection
- `'auto'`: enable selection when the current schema and actions make it useful

## Typical Usage With Bulk Actions

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
  selection: {
    mode: 'auto',
  },
  actions: [
    {
      key: 'archive',
      label: 'Archive selected',
      requiresSelection: true,
      action: async ({ selectedRows }) => {
        await archiveEmployees(selectedRows.map((row) => row.id))
      },
    },
  ],
  table: {
    columns: (column) => [column.field('fullName', { label: 'Employee' })],
  },
})
```

Selection is most useful when your table supports:

- row selection
- bulk workflows
- action toolbars

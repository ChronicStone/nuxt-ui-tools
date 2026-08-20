# Table Selection

Selection is configured through `selection` and related table behavior.

## Example

```ts
selection: {
  mode: 'auto',
  scope: 'all',
}
```

## What `mode` Means

- `false`: disable selection
- `true`: always enable selection
- `'auto'`: enable selection when the current schema and actions make it useful

## What `scope` Means

`scope` controls what the header "select all" checkbox targets in client tables:

- `'page'`: only the current paginated page
- `'all'`: all filtered rows across the current client dataset

Example:

```ts
selection: {
  mode: 'auto',
  scope: 'all',
}
```

Important rule:

- `scope` is only meaningful for client tables
- remote tables stay page-scoped
- if `scope` is omitted, client tables default to `'all'`

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
    scope: 'all',
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

With the default `'auto'` mode, the selection column is omitted when the schema has
no bulk actions. Toolbar and row actions do not imply row selection. Set
`selection.mode` to `true` when an application needs selection for a custom workflow
that is not represented by bulk actions.

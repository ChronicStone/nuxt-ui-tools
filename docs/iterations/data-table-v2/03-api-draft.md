# API Draft

This file is a compact draft view of the current API. The fully detailed source of truth is [`07-current-spec.md`](./07-current-spec.md).

## Schema

```ts
defineTableSchema({
  tableKey: 'users',
  rowKey: 'id',

  source: {
    mode: 'remote',
    query: ctx => ...,
    serializer: 'elasticsearch'
  },

  views: ['BUYER', 'SELLER'],
  defaultLayout: 'table',

  context: [
    {
      key: 'watchlist',
      loader: () => ...
    }
  ],

  pageContext: [
    {
      key: 'stats',
      loader: ({ rows }) => ...
    }
  ],

  filters: {
    search: {
      fields: ['name', 'email'],
      placeholder: 'Search users...'
    },
    static: [
      {
        key: 'organisationId',
        operator: 'is',
        value: () => organisationId.value
      }
    ],
    ui: filter => [
      filter.text('name', {
        label: 'Name',
        operators: ['contains', 'is']
      }),
      filter.option('status', {
        label: 'Status',
        operators: ['is', 'isAnyOf'],
        options: {
          loader: async () => [...]
        }
      })
    ]
  },

  table: {
    columns: column => [
      column.field('name', {
        label: 'Name',
        sortable: true,
        cellProps: ({ row, value }) => ({
          'data-user-id': row.id,
          'data-user-name': value
        }),
        render: ({ row, value }) => `${row.id}: ${value}`
      }),
      column.composite('fullName', {
        label: 'Full name',
        sortableKey: 'lastName',
        render: ({ row }) => `${row.firstName} ${row.lastName}`
      }),
      column.display('actions', {
        label: '',
        render: ({ row }) => ...
      })
    ]
  },

  grid: {
    renderItem: ({ row }) => ...,
    defaultSorting: {
      key: 'createdAt',
      dir: 'desc'
    },
    sorting: [
      {
        key: 'createdAt',
        label: 'Created at'
      }
    ]
  },

  selection: {
    mode: 'auto'
  },

  actions: [
    {
      key: 'delete',
      label: 'Delete',
      action: ({ selected, tableApi }) => ...
    }
  ],

  toolbarActions: [
    {
      key: 'create',
      label: 'Create',
      action: ({ tableApi }) => ...
    }
  ],

  rowActions: ({ row, tableApi }) => ...,

  controls: {
    refresh: false,
    layout: { table: true, grid: 'false lg:true' }
  },

  persistence: {
    state: true,
    preferences: true
  }
})
```

Notes:

- filter `key` is the target row property path, not a column id
- filter UI definitions live under `filters.ui`
- `column.field(...)` is property-backed:
  - it does not expose `sortableKey`
  - field callbacks receive the whole `row`
  - field callbacks receive a typed `value` resolved from the field path
  - this applies to `render(...)` and other row-aware column callbacks such as `cellProps(...)`, `colSpan(...)`, and `rowSpan(...)`
- `column.composite(...)` remains the place for free-form derived columns and therefore keeps typed `sortableKey`

## Runtime

```ts
const table = useTable(schema)
```

```vue
<DataList :schema="schema" />
```

or:

```vue
<DataList :table="table" />
```

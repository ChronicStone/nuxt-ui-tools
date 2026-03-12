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
        columnId: 'organisationId',
        operator: 'is',
        value: () => organisationId.value
      }
    ],
    dynamic: filter => [
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

  columns: column => [
    column.field('name', {
      label: 'Name',
      sortable: true
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
  ],

  table: {
    columns: column => [
      column.field('name', {
        label: 'Name',
        sortable: true
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

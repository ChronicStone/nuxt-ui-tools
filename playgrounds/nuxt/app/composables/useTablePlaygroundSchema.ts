import {
  createTableDebugSnapshot,
  defineTableSchema,
  useTable,
  type ExtractTableRow,
  type ExtractTableContextData,
  type ExtractTablePageContextData,
} from '@nuxt-ui-tools/table'

export const tablePlaygroundSchema = defineTableSchema({
  tableKey: 'playground-users',
  rowKey: 'id',
  source: {
    mode: 'remote',
    loader: async () => ({
      rows: [
        {
          id: 'usr_1',
          name: 'Ada Lovelace',
          email: 'ada@analytical.test',
          status: 'active',
          createdAt: '2026-03-12',
          isArchived: false,
          orders: 42,
        },
      ],
      rowCount: 1,
    }),
  },
  views: ['all', 'active'],
  defaultLayout: 'table',
  context: [
    {
      key: 'organisationId',
      loader: async () => 'org_demo',
    },
    {
      key: 'canManageUsers',
      loader: async () => true,
    },
  ],
  pageContext: [
    {
      key: 'rowSummary',
      loader: async ({ rows }) => `${rows.length} visible rows`,
    },
  ],
  filters: {
    search: {
      fields: ['name', 'email'],
      placeholder: 'Search users',
    },
    static: [
      {
        key: 'status',
        operator: 'is',
        value: () => 'active',
      },
    ],
    ui: (filter) => [
      filter.text('name', {
        label: 'Name',
        operators: ['contains', 'is'],
      }),
      filter.option('status', {
        label: 'Status',
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
        ],
      }),
      filter.boolean('isArchived', {
        label: 'Archived',
      }),
      filter.number('orders', {
        label: 'Orders',
      }),
      filter.date('createdAt', {
        label: 'Created at',
      }),
    ],
  },
  table: {
    columns: (column) => [
      column.field('name', {
        label: 'Name',
        sortable: true,
        cellProps: ({ row, value }) => ({
          'data-user-id': row.id,
          'data-user-name': value,
        }),
        render: ({ value, context, pageContext }) =>
          `${value} / ${context.organisationId} / ${pageContext.rowSummary}`,
      }),
      column.field('email', {
        label: 'Email',
      }),
      column.composite('statusSummary', {
        label: 'Status summary',
        sortableKey: 'status',
        render: ({ row, context, pageContext }) =>
          `${row.status} / ${context.organisationId} / ${pageContext.rowSummary}`,
      }),
      column.display('actions', {
        label: 'Actions',
        render: ({ row }) => `View ${row.id}`,
      }),
      column.field('status', {
        label: 'Status',
      }),
    ],
  },
  grid: {
    renderItem: ({ row }) => row.name,
    defaultSorting: {
      key: 'createdAt',
      dir: 'desc',
    },
  },
  selection: {
    mode: 'auto',
  },
  actions: [
    {
      key: 'archive-selected',
      label: 'Archive selected',
      requiresSelection: true,
    },
  ],
  toolbarActions: [
    {
      key: 'invite-user',
      label: 'Invite user',
    },
  ],
  rowActions: ({ row, context, pageContext }) => [
    {
      key: 'open-profile',
      label: `Open ${row.name}`,
      visible: () => context.canManageUsers && pageContext.rowSummary.length > 0,
    },
  ],
  controls: {
    refresh: true,
    layout: {
      table: true,
      grid: true,
    },
  },
  persistence: {
    state: true,
    preferences: true,
  },
})

export type TablePlaygroundRow = ExtractTableRow<typeof tablePlaygroundSchema>
export type TablePlaygroundContext = ExtractTableContextData<typeof tablePlaygroundSchema>
export type TablePlaygroundPageContext = ExtractTablePageContextData<typeof tablePlaygroundSchema>

export const tablePlayground = useTable(tablePlaygroundSchema)
export const tablePlaygroundSnapshot = createTableDebugSnapshot(tablePlayground)

export const tablePlaygroundPreviewContext: TablePlaygroundContext = {
  organisationId: 'org_demo',
  canManageUsers: true,
}

export const tablePlaygroundPreviewPageContext: TablePlaygroundPageContext = {
  rowSummary: '1 visible row',
}

export const tablePlaygroundPreviewRow: TablePlaygroundRow = {
  id: 'usr_1',
  name: 'Ada Lovelace',
  email: 'ada@analytical.test',
  status: 'active',
  createdAt: '2026-03-12',
  isArchived: false,
  orders: 42,
}

export const tablePlaygroundRowActions =
  typeof tablePlaygroundSchema.rowActions === 'function'
    ? tablePlaygroundSchema.rowActions({
        row: tablePlaygroundPreviewRow,
        context: tablePlaygroundPreviewContext,
        pageContext: tablePlaygroundPreviewPageContext,
      })
    : (tablePlaygroundSchema.rowActions ?? [])

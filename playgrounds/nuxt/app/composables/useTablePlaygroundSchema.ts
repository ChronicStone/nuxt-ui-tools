import { defineTableSchema, type ExtractTableContextData } from '@nuxt-ui-tools/table'

export const tableSchema = defineTableSchema({
  tableKey: 'playground-users',
  rowKey: 'id',
  defaultLayout: 'table',
  pagination: {
    defaultSize: {
      table: 20,
      grid: 12,
    },
    sizeOptions: {
      table: [10, 20, 50],
      grid: [12, 24, 48],
    },
    showPageSizePicker: true,
    showPagesList: true,
    showPagesCount: true,
  },
  source: {
    mode: 'remote',
    query: ({ context }) => ({
      queryKey: ['users', context.organisationId],
      queryFn: async () => ({
        rows: [
          {
            id: 'usr_1',
            name: 'Ada Lovelace',
            email: 'ada@analytical.test',
            organisationId: context.organisationId,
            status: 'active' as const,
            verified: true,
            score: 98,
            createdAt: new Date('2026-03-10T08:00:00.000Z'),
            organisation: {
              status: 'active' as const,
            },
          },
          {
            id: 'usr_2',
            name: 'Grace Hopper',
            email: 'grace@compiler.test',
            organisationId: context.organisationId,
            status: 'inactive' as const,
            verified: false,
            score: 73,
            createdAt: new Date('2026-03-08T10:30:00.000Z'),
            organisation: {
              status: 'inactive' as const,
            },
          },
        ],
        rowCount: 2,
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
  filters: {
    search: {
      fields: ['name', 'email'],
      placeholder: 'Search users',
    },
    ui: (filter) => [
      filter.text('name', {
        label: 'Name',
        operators: ['contains', 'is'],
      }),
      filter.option('organisation.status', {
        label: 'Organisation status',
        defaultOperator: 'isAnyOf',
        options: {
          query: () => ({
            queryKey: ['statuses'],
            queryFn: async () => [
              { label: 'Active', value: 'active' as const },
              { label: 'Inactive', value: 'inactive' as const },
            ],
          }),
        },
      }),
      filter.boolean('verified', {
        label: 'Verified',
      }),
      filter.number('score', {
        label: 'Score',
        operators: ['is', 'gte', 'lte', 'between'],
      }),
      filter.date('createdAt', {
        label: 'Created at',
        operators: ['is', 'before', 'after', 'between'],
      }),
    ],
  },
  table: {
    defaultSorting: {
      key: 'createdAt',
      dir: 'desc',
    },
    columns: (column) => [
      column.field('name', {
        label: 'Name',
        render: ({ value, context }) => `${value} (${context.organisationId})`,
      }),
      column.field('email', {
        label: 'Email',
      }),
      column.field('organisation.status', {
        label: 'Organisation status',
      }),
      column.field('score', {
        label: 'Score',
      }),
    ],
  },
  grid: {
    enabled: true,
    defaultSorting: {
      key: 'name',
      dir: 'asc',
    },
  },
})

export type PlaygroundTableContext = ExtractTableContextData<typeof tableSchema>

export const tablePlaygroundSummary = {
  builder: 'defineTableSchema',
  asyncContract: 'tanstack-query-only',
  contextKeys: Object.keys({ organisationId: '' satisfies PlaygroundTableContext['organisationId'] extends string ? '' : never }),
  sourceMode: tableSchema.source.mode,
  filterKeys: tableSchema.filters?.ui?.map(filter => filter.key),
  resolvedFilters: true,
}

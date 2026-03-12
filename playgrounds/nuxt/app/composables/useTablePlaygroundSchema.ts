import { defineTable, type ExtractTableContextData as ExtractBaseContextData } from '@nuxt-ui-tools/table'
import {
  defineQueryTable,
  type ExtractTableContextData as ExtractQueryContextData,
} from '@nuxt-ui-tools/table-query'

export const baseTableSchema = defineTable({
  tableKey: 'playground-users-base',
  rowKey: 'id',
  source: {
    mode: 'remote',
    loader: async ({ context }) => ({
      rows: [
        {
          id: 'usr_1',
          name: 'Ada Lovelace',
          email: 'ada@analytical.test',
          organisationId: context.organisationId,
          status: 'active' as const,
        },
      ],
      rowCount: 1,
    }),
  },
  context: [
    {
      key: 'organisationId',
      loader: async () => 'org_base',
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
      }),
      filter.option('status', {
        label: 'Status',
        options: {
          loader: async () => [
            { label: 'Active', value: 'active' as const },
            { label: 'Inactive', value: 'inactive' as const },
          ],
        },
      }),
    ],
  },
  table: {
    columns: (column) => [
      column.field('name', {
        label: 'Name',
        render: ({ value, context }) => `${value} (${context.organisationId})`,
      }),
      column.field('email', {
        label: 'Email',
      }),
    ],
  },
})

export const queryTableSchema = defineQueryTable({
  tableKey: 'playground-users-query',
  rowKey: 'id',
  source: {
    mode: 'remote',
    query: ({ context }) => ({
      queryKey: ['users', context.organisationId],
      queryFn: async () => ({
        rows: [
          {
            id: 'usr_2',
            name: 'Grace Hopper',
            email: 'grace@compiler.test',
            organisationId: context.organisationId,
            status: 'active' as const,
          },
        ],
        rowCount: 1,
      }),
    }),
  },
  context: [
    {
      key: 'organisationId',
      query: () => ({
        queryKey: ['organisation'],
        queryFn: async () => 'org_query',
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
              { label: 'Active', value: 'active' as const },
              { label: 'Inactive', value: 'inactive' as const },
            ],
          }),
        },
      }),
    ],
  },
  table: {
    columns: (column) => [
      column.field('name', {
        label: 'Name',
        render: ({ value, context }) => `${value} (${context.organisationId})`,
      }),
      column.field('email', {
        label: 'Email',
      }),
    ],
  },
})

export type BaseTableContext = ExtractBaseContextData<typeof baseTableSchema>
export type QueryTableContext = ExtractQueryContextData<typeof queryTableSchema>

export const tablePlaygroundSummary = {
  base: {
    builder: 'defineTable',
    asyncContract: 'promise-only',
    contextKeys: Object.keys({ organisationId: '' satisfies BaseTableContext['organisationId'] extends string ? '' : never }),
    sourceMode: baseTableSchema.source.mode,
  },
  query: {
    builder: 'defineQueryTable',
    asyncContract: 'query-options-only',
    contextKeys: Object.keys({ organisationId: '' satisfies QueryTableContext['organisationId'] extends string ? '' : never }),
    sourceMode: queryTableSchema.source.mode,
  },
}

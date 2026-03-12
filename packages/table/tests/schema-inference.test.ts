import { describe, expectTypeOf, it } from 'vitest'

import { defineTableSchema } from '../src'
import type {
  ExtractTableContextData,
  ExtractTablePageContextData,
  ExtractTableRow,
} from '../src'

const schema = defineTableSchema({
  tableKey: 'users',
  rowKey: 'id',
  source: {
    mode: 'remote',
    query: () => ({
      queryKey: ['users'],
      queryFn: async () => ({
        rows: [
          {
            id: 1,
            name: 'Ada',
            status: 'active' as const,
            organisation: {
              id: 'org_1',
              status: 'active' as const,
            },
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
        queryFn: async () => 'org_123' as string,
      }),
    },
  ],
  pageContext: [
    {
      key: 'rowCountLabel',
      query: ({ rows, context }) => ({
        queryKey: ['summary', rows.length, context.organisationId],
        queryFn: async () => `${rows.length}:${context.organisationId}`,
      }),
    },
  ],
  filters: {
    search: {
      fields: ['name', 'organisation.status'],
    },
    ui: (filter) => [
      filter.text('name', {
        label: 'Name',
      }),
      filter.option('organisation.status', {
        label: 'Status',
        defaultOperator: 'isAnyOf',
        options: [
          { label: 'Active', value: 'active' as const },
          { label: 'Inactive', value: 'inactive' as const },
        ],
      }),
    ],
  },
  table: {
    columns: (column) => [
      column.field('name', {
        label: 'Name',
        render: (params) => {
          expectTypeOf(params.value).toEqualTypeOf<string>()
          expectTypeOf(params.context.organisationId).toEqualTypeOf<string>()
          expectTypeOf(params.pageContext.rowCountLabel).toEqualTypeOf<string>()

          return `${params.value}:${params.context.organisationId}:${params.pageContext.rowCountLabel}`
        },
      }),
      column.composite('statusSummary', {
        label: 'Status',
        sortableKey: 'organisation.status',
        render: (params) => {
          expectTypeOf(params.row.organisation.status).toEqualTypeOf<'active'>()

          return params.row.organisation.status
        },
      }),
    ],
    defaultSorting: {
      key: 'organisation.status',
      dir: 'desc',
    },
  },
})

type ContextData = ExtractTableContextData<typeof schema>
type PageContextData = ExtractTablePageContextData<typeof schema>
type Row = ExtractTableRow<typeof schema>
type SourceContext = Parameters<typeof schema.source.query>[0]

describe('defineTableSchema inference', () => {
  it('infers context and page context data from query definitions', () => {
    expectTypeOf<ContextData['organisationId']>().toEqualTypeOf<string>()
    expectTypeOf<PageContextData['rowCountLabel']>().toEqualTypeOf<string>()
  })

  it('infers the row shape from the source query result', () => {
    expectTypeOf<Row['name']>().toEqualTypeOf<string>()
    expectTypeOf<Row['organisation']['status']>().toEqualTypeOf<'active'>()
  })

  it('exposes search fields on the source query context', () => {
    expectTypeOf<SourceContext['search']['value']>().toEqualTypeOf<string>()
    expectTypeOf<SourceContext['search']['fields']>().toMatchTypeOf<string[]>()
  })

  it('keeps nested sort keys inferred through the schema surface', () => {
    type DefaultSortingObject = Extract<
      NonNullable<NonNullable<typeof schema.table>['defaultSorting']>,
      { key: string }
    >

    type DefaultSortingKey = Extract<DefaultSortingObject['key'], 'organisation.status'>

    expectTypeOf<DefaultSortingKey>().toEqualTypeOf<'organisation.status'>()
    expectTypeOf<
      Extract<DefaultSortingObject['dir'], 'desc'>
    >().toEqualTypeOf<'desc'>()
  })
})

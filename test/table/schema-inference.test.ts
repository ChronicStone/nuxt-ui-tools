import { queryOptions } from '@tanstack/vue-query'
import { describe, expectTypeOf, it } from 'vitest'

import { defineTableSchema, tableSource } from '#ui-tools/table'
import type {
  ExtractTableContextData,
  ExtractTablePageContextData,
  ExtractTableRow,
} from '#ui-tools/table/types'

interface DemoEmployeeRow {
  id: string
  email: string
  organisation: {
    id: string
    status: 'active' | 'inactive'
  }
}

interface DemoEmployeeListResult {
  rows: DemoEmployeeRow[]
  rowCount: number
}

function getDemoEmployeeList(): DemoEmployeeListResult {
  return {
    rowCount: 1,
    rows: [
      {
        email: 'ada@example.com',
        id: 'user_1',
        organisation: {
          id: 'org_1',
          status: 'active',
        },
      },
    ],
  }
}

const schema = defineTableSchema({
  context: [
    {
      key: 'organisationId',
      query: () => ({
        queryFn: () => 'org_123',
        queryKey: ['organisation'],
      }),
    },
  ],
  filters: {
    search: {
      fields: ['name', 'organisation.status'],
    },
    static: [
      {
        key: 'organisation.id',
        operator: 'is',
        value: (context) => {
          expectTypeOf(context.organisationId).toEqualTypeOf<string>()
          return context.organisationId
        },
      },
    ],
    ui: (filter) => [
      filter.text('name', {
        editor: {
          inputType: 'search',
          placeholder: 'Search users',
        },
        label: 'Name',
      }),
      filter.option('organisation.status', {
        behavior: {
          defaultOperator: 'isAnyOf',
        },
        editor: {
          selection: {
            mode: 'multiple',
          },
        },
        label: 'Status',
        source: {
          options: [
            { label: 'Active', value: 'active' as const },
            { label: 'Inactive', value: 'inactive' as const },
          ],
        },
      }),
    ],
  },
  pageContext: [
    {
      key: 'rowCountLabel',
      query: ({ rows, context }) => ({
        queryFn: () => `${rows.length}:${context.organisationId}`,
        queryKey: ['summary', rows.length, context.organisationId],
      }),
    },
  ],
  rowKey: 'id',
  source: tableSource({
    facets: true,
    mode: 'remote',
    query: (ctx) => ({
      queryFn: () => ({
        rowCount: 1,
        rows: [
          {
            id: 1,
            name: 'Ada',
            organisation: {
              id: 'org_1',
              status: 'active' as const,
            },
            status: 'active' as const,
          },
        ],
      }),
      queryKey: ['users', ctx.search.value, ctx.facets],
    }),
  }),
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
        render: (params) => {
          expectTypeOf(params.row.organisation.status).toEqualTypeOf<'active'>()

          return params.row.organisation.status
        },
        sortableKey: 'organisation.status',
      }),
    ],
    defaultSorting: {
      dir: 'desc',
      key: 'organisation.status',
    },
  },
  tableKey: 'users',
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

  it('exposes optional global facet descriptors on the source query context', () => {
    expectTypeOf<SourceContext['facets']>().toMatchTypeOf<
      | {
          key: string
          mode?: 'exclude-self' | 'include-self'
          limit?: number
        }[]
      | undefined
    >()
  })

  it('keeps nested sort keys inferred through the schema surface', () => {
    type DefaultSortingObject = Extract<
      NonNullable<NonNullable<typeof schema.table>['defaultSorting']>,
      { key: string }
    >

    type DefaultSortingKey = Extract<DefaultSortingObject['key'], 'organisation.status'>

    expectTypeOf<DefaultSortingKey>().toEqualTypeOf<'organisation.status'>()
    expectTypeOf<Extract<DefaultSortingObject['dir'], 'desc'>>().toEqualTypeOf<'desc'>()
  })

  it('keeps interface-backed query rows inferred without requiring an index signature', () => {
    const interfaceSchema = defineTableSchema({
      rowKey: 'id',
      source: tableSource({
        query: () => ({
          queryFn: getDemoEmployeeList,
          queryKey: ['demo-users'],
        }),
      }),
      table: {
        columns: (column) => [
          column.field('email', {
            render: (params) => {
              expectTypeOf(params.row.id).toEqualTypeOf<string>()
              expectTypeOf(params.row.organisation.status).toMatchTypeOf<'active' | 'inactive'>()
              expectTypeOf(params.value).toEqualTypeOf<string>()

              return params.value
            },
          }),
        ],
      },
      tableKey: 'demo-users',
    })

    type InterfaceRow = ExtractTableRow<typeof interfaceSchema>

    expectTypeOf<InterfaceRow['email']>().toEqualTypeOf<string>()
    expectTypeOf<InterfaceRow['organisation']['status']>().toMatchTypeOf<'active' | 'inactive'>()
  })

  it('infers rows from external query options and route unions', () => {
    const adminQuery = queryOptions({
      queryFn: () => ({ rows: [{ id: 'admin-1', scope: 'admin' as const }] }),
      queryKey: ['admin-accounts'],
    })
    const clientQuery = queryOptions({
      queryFn: () => ({ rows: [{ id: 'client-1', scope: 'client' as const }] }),
      queryKey: ['client-accounts'],
    })
    const useClientRoute = true
    const externalSchema = defineTableSchema({
      rowKey: 'id',
      source: tableSource({
        mode: 'remote',
        query: () => (useClientRoute ? clientQuery : adminQuery),
      }),
      table: {
        columns: (column) => [
          column.field('scope', {
            label: 'Scope',
            render: ({ row, value }) => {
              expectTypeOf(row.id).toEqualTypeOf<string>()
              expectTypeOf(value).toEqualTypeOf<'admin' | 'client'>()

              return value
            },
          }),
        ],
      },
      tableKey: 'external-accounts',
    })

    type ExternalRow = ExtractTableRow<typeof externalSchema>

    expectTypeOf<ExternalRow['scope']>().toEqualTypeOf<'admin' | 'client'>()
  })

  it('infers remote option values from the page loader into resolveSelected', () => {
    defineTableSchema({
      filters: {
        ui: (filter) => [
          filter.option('organisation.status', {
            label: 'Status',
            source: {
              remote: {
                load: ({ page, search }) => {
                  expectTypeOf(page.index).toEqualTypeOf<number>()
                  expectTypeOf(page.cursor).toEqualTypeOf<string | null>()
                  return {
                    queryFn: async () => ({
                      hasMore: false,
                      options: [{ label: 'Active', value: 'active' as const }],
                    }),
                    queryKey: ['statuses', search, page.index],
                  }
                },
                pagination: { size: 20, type: 'page' },
                resolveSelected: ({ values }) => {
                  expectTypeOf(values).toEqualTypeOf<readonly 'active'[]>()
                  return { queryFn: async () => [], queryKey: ['statuses', 'selected', values] }
                },
              },
            },
          }),
        ],
      },
      rowKey: 'id',
      source: tableSource({
        query: () => ({ queryFn: getDemoEmployeeList, queryKey: ['demo-users'] }),
      }),
      table: { columns: (column) => [column.field('email', { label: 'Email' })] },
      tableKey: 'remote-status',
    })
  })
})

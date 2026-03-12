import { useTable } from '@lib/composables'
import { defineTableSchema } from '@lib/core'
import type {
  ExtractTableContextData,
  ExtractTablePageContextData,
  TableDefaultSort,
  TableFieldValue,
  TableGridSortOption,
} from '@lib/types'

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false

type Assert<T extends true> = T

const schema = defineTableSchema({
  tableKey: 'users',
  rowKey: 'id',
  source: {
    mode: 'remote',
    loader: async () => ({
      rows: [
        {
          id: 1,
          name: 'Ada',
          status: 'active' as const,
          createdAt: new Date().toISOString(),
          archived: false,
        },
      ],
      rowCount: 1,
    }),
  },
  context: [
    {
      key: 'organisationId',
      loader: async () => 'org_123',
    },
  ],
  pageContext: [
    {
      key: 'rowCountLabel',
      loader: async ({ rows, context }) => {
        const _pageContextRowId: number = rows[0]!.id
        const _pageContextContextValue: string = context.organisationId

        return `${_pageContextRowId}-${_pageContextContextValue}-${rows.length} rows`
      },
    },
  ],
  filters: {
    search: {
      fields: ['name'],
    },
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
      filter.boolean('archived', {
        label: 'Archived',
      }),
    ],
  },
  table: {
    columns: (column) => [
      column.composite('fullName', {
        label: 'Full Name',
        render: ({ row }) => `Full name: ${row.name}`,
      }),
      column.field('id', {
        label: 'ID',
        render: ({ value }) => `#${value}`,
      }),
      column.field('name', {
        label: 'Name',
        sortable: true,
        pinned: 'left',
        cellProps: ({ row, value }) => ({
          'data-row-id': row.id,
          'data-name': value,
        }),
        colSpan: ({ value }) => value.length,
        render: ({ row, value, context, pageContext }) => {
          const _fieldValue: string = value
          const _fieldRowStatus: 'active' = row.status
          const _fieldContextValue: string = context.organisationId
          const _fieldPageContextValue: string = pageContext.rowCountLabel

          return `${_fieldValue}-${_fieldRowStatus}-${_fieldContextValue}-${_fieldPageContextValue}`
        },
      }),
      column.composite('statusLabel', {
        label: 'Status',
        render: ({ row, context, pageContext }) =>
          `${row.status}-${context.organisationId}-${pageContext.rowCountLabel}`,
      }),
      column.display('actions', {
        render: ({ row }) => row.id,
      }),
    ],
    defaultSorting: {
      key: 'id',
      dir: 'desc',
    },
  },
  grid: {
    renderItem: ({ row, context, pageContext }) => `${row.status}-${context.organisationId}-${pageContext.rowCountLabel}`,
    sortOptions: [
      {
        key: 'name',
        label: 'Name',
      },
    ],
  },
})

const table = useTable(schema)

type Row = (typeof table.runtime.rows)[number]
type PageContextLoaderInput = Parameters<
  NonNullable<NonNullable<typeof schema.pageContext>[number]['loader']>
>[0]
type ContextData = ExtractTableContextData<typeof schema>
type PageContextData = ExtractTablePageContextData<typeof schema>
type NameColumn = Extract<
  NonNullable<NonNullable<typeof schema.table>['columns']>[number],
  { key: 'name' }
>
type NameColumnRender = NonNullable<NameColumn['render']>
type NameColumnRenderParams = Parameters<NameColumnRender>[0]
type NameColumnCellProps = NonNullable<NameColumn['cellProps']>
type NameColumnCellPropsParams = Parameters<NameColumnCellProps>[0]
type NameColumnColSpan = NonNullable<NameColumn['colSpan']>
type NameColumnColSpanParams = Parameters<NameColumnColSpan>[0]
type TableDefaultSorting = NonNullable<NonNullable<typeof schema.table>['defaultSorting']>
type GridSortOptions = NonNullable<NonNullable<typeof schema.grid>['sortOptions']>

type _rowCheck = Assert<Equal<Row['status'], 'active'>>

declare const contextData: ContextData
declare const pageContextData: PageContextData
declare const tableDefaultSorting: TableDefaultSorting
declare const gridSortOptions: GridSortOptions
declare const pageContextLoaderInput: PageContextLoaderInput
declare const nameColumnRenderParams: NameColumnRenderParams
declare const nameColumnCellPropsParams: NameColumnCellPropsParams
declare const nameColumnColSpanParams: NameColumnColSpanParams

const _pageContextRowId: number = pageContextLoaderInput.rows[0]!.id
const _fieldRenderRowId: number = nameColumnRenderParams.row.id
const _fieldRenderValue: TableFieldValue<Row, 'name'> = nameColumnRenderParams.value
const _fieldCellPropsRowId: number = nameColumnCellPropsParams.row.id
const _fieldCellPropsValue: TableFieldValue<Row, 'name'> = nameColumnCellPropsParams.value
const _fieldColSpanValue: TableFieldValue<Row, 'name'> = nameColumnColSpanParams.value
const _contextValue: string = contextData.organisationId
const _pageContextValue: string = pageContextData.rowCountLabel
const _defaultSortingValue: TableDefaultSort<'id' | 'name' | 'status' | 'createdAt' | 'archived'> =
  tableDefaultSorting
const _gridSortOptionsValue: readonly TableGridSortOption<
  'id' | 'name' | 'status' | 'createdAt' | 'archived'
>[] = gridSortOptions

export {}

import type { TableBulkAction, TableRowAction, TableToolbarAction } from './actions'
import type { TableContextDataFromItems, TableContextItem, TablePageContextItem } from './context'
import type { TableFiltersSchema } from './filters'
import type {
  TableControlsSchema,
  TableGridSchema,
  TablePaginationSchema,
  TablePersistenceOptions,
  TableSelectionSchema,
  TableTableSchema,
} from './layout'
import type { InferTableSourceRow, NormalizeTableSource, TableSource } from './source'
import type {
  TableKnownFieldPath,
  TableLayout,
  TableRowKey,
  TableSortKey,
  GenericObject,
} from './utils'

export interface TableSchema<
  TRow extends GenericObject = GenericObject,
  TContextItems extends TableContextItem[] = TableContextItem[],
  TPageContextItems extends TablePageContextItem<TRow, TableContextDataFromItems<TContextItems>>[] =
    TablePageContextItem<TRow, TableContextDataFromItems<TContextItems>>[],
  TFilterKey extends string = TableKnownFieldPath<TRow>,
  TSortKey extends string = TableSortKey<TRow>,
> {
  tableKey: string
  rowKey: TableRowKey<TRow>
  source: TableSource<TRow, TableContextDataFromItems<TContextItems>>
  defaultLayout?: TableLayout
  pagination?: TablePaginationSchema
  context?: TContextItems
  pageContext?: TPageContextItems
  filters?: TableFiltersSchema<TRow, TableContextDataFromItems<TContextItems>, TFilterKey>
  table?: TableTableSchema<
    TRow,
    TableContextDataFromItems<TContextItems>,
    TableContextDataFromItems<TPageContextItems>,
    TSortKey
  >
  grid?: TableGridSchema<
    TRow,
    TableContextDataFromItems<TContextItems>,
    TableContextDataFromItems<TPageContextItems>,
    TSortKey
  >
  selection?: TableSelectionSchema
  actions?: TableBulkAction<
    TRow,
    TableContextDataFromItems<TContextItems>,
    TableContextDataFromItems<TPageContextItems>
  >[]
  toolbarActions?: TableToolbarAction<
    TRow,
    TableContextDataFromItems<TContextItems>,
    TableContextDataFromItems<TPageContextItems>
  >[]
  rowActions?:
    | TableRowAction<
        TRow,
        TableContextDataFromItems<TContextItems>,
        TableContextDataFromItems<TPageContextItems>
      >[]
    | ((params: {
        row: TRow
        context: TableContextDataFromItems<TContextItems>
        pageContext: TableContextDataFromItems<TPageContextItems>
      }) => TableRowAction<
        TRow,
        TableContextDataFromItems<TContextItems>,
        TableContextDataFromItems<TPageContextItems>
      >[])
  controls?: TableControlsSchema
  persistence?: TablePersistenceOptions
}

export type BuildTableSchema<
  TSource extends TableSource<any, any, any> = TableSource<any, any, any>,
  TContextItems extends TableContextItem[] = TableContextItem[],
  TPageContextItems extends TablePageContextItem<
    InferTableSourceRow<TSource>,
    TableContextDataFromItems<TContextItems>
  >[] = TablePageContextItem<
    InferTableSourceRow<TSource>,
    TableContextDataFromItems<TContextItems>
  >[],
  TFilterKey extends string = TableKnownFieldPath<InferTableSourceRow<TSource>>,
  TSortKey extends string = TableKnownFieldPath<InferTableSourceRow<TSource>>,
> = Omit<
  TableSchema<InferTableSourceRow<TSource>, TContextItems, TPageContextItems, TFilterKey, TSortKey>,
  'source'
> & {
  source: ValidateTableSource<TSource, TableContextDataFromItems<TContextItems>>
}

type ValidateTableSource<TSource, TContext extends GenericObject> =
  TSource extends NormalizeTableSource<TSource, TContext>
    ? TSource
    : NormalizeTableSource<TSource, TContext>

type ResolveCollection<TCollection> = TCollection extends (...args: never[]) => infer TResult
  ? TResult
  : TCollection

export type ResolvedTableSchema<TSchema> = Omit<TSchema, 'table' | 'filters'> & {
  table?: TSchema extends { table?: infer TTable }
    ? TTable extends { columns?: infer TColumns }
      ? Omit<TTable, 'columns'> & {
          columns?: ResolveCollection<TColumns>
        }
      : TTable
    : never
  filters?: TSchema extends { filters?: infer TFilters }
    ? TFilters extends { ui?: infer TUi }
      ? Omit<TFilters, 'ui'> & {
          ui?: ResolveCollection<TUi>
        }
      : TFilters
    : never
}

export type TableSchemaView = ResolvedTableSchema<TableSchema>

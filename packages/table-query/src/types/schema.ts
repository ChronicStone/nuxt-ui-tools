import type {
  TableBulkAction,
  TableColumnCollection,
  TableControlsSchema,
  TableDefaultSort,
  TableGridSortOption,
  TableKnownFieldPath,
  TableLayout,
  TablePersistenceOptions,
  TableRowAction,
  TableRowKey,
  TableRowRenderParams,
  TableSelectionSchema,
  TableSortKey,
  TableToolbarAction,
  TableViewValue,
  GenericObject,
} from './utils'
import type {
  TableContextDataFromItems,
  TableContextItem,
  TablePageContextItem,
} from './context'
import type { TableFiltersSchema } from './filters'
import type { InferTableSourceFilterKey, InferTableSourceRow, InferTableSourceSortKey, TableSource } from './source'

type TableResolvedPageContextData<TItems extends readonly unknown[]> =
  TableContextDataFromItems<TItems>

export interface TableGridSchema<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
  TView extends string = string,
  TSortKey extends string = TableSortKey<TRow>,
> {
  enabled?: TableViewValue<TView, boolean | string | (() => boolean | string)>
  renderItem?: (
    params: TableRowRenderParams<TRow, TContext, TPageContext, TView>,
  ) => unknown
  renderSkeleton?: TableViewValue<
    TView,
    (params: { view?: TView, layout?: 'grid' }) => unknown
  >
  gridSize?: TableViewValue<TView, number | string | (() => number | string)>
  itemSize?: TableViewValue<TView, number | string | (() => number | string)>
  sortOptions?: TableViewValue<TView, readonly TableGridSortOption<TSortKey, TView>[]>
  defaultSorting?: TableViewValue<TView, TableDefaultSort<TSortKey>>
}

export interface TableTableSchema<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
  TView extends string = string,
  TSortKey extends string = TableSortKey<TRow>,
> {
  enabled?: TableViewValue<TView, boolean | string | (() => boolean | string)>
  columns?: TableColumnCollection<TRow, TContext, TPageContext, TView, string, TSortKey>
  treeMode?: TableViewValue<TView, boolean>
  childrenKey?: TableSortKey<TRow>
  defaultSorting?: TableViewValue<TView, TableDefaultSort<TSortKey>>
  selection?: TableViewValue<TView, boolean | 'auto'>
}

export interface TableSchema<
  TRow extends GenericObject = GenericObject,
  TContextItems extends readonly TableContextItem[] = readonly TableContextItem[],
  TPageContextItems extends readonly TablePageContextItem<
    TRow,
    TableContextDataFromItems<TContextItems>
  >[] = readonly TablePageContextItem<TRow, TableContextDataFromItems<TContextItems>>[],
  TView extends string = string,
  TFilterKey extends TableKnownFieldPath<TRow> = TableKnownFieldPath<TRow>,
  TSortKey extends string = TableSortKey<TRow>,
> {
  tableKey: string
  rowKey: TableRowKey<TRow>
  source: TableSource<TRow, TFilterKey, TSortKey>
  views?: readonly TView[]
  defaultLayout?: TableLayout
  context?: TContextItems
  pageContext?: TPageContextItems
  filters?: TableFiltersSchema<TRow, TableContextDataFromItems<TContextItems>, TFilterKey>
  table?: TableTableSchema<
    TRow,
    TableContextDataFromItems<TContextItems>,
    TableContextDataFromItems<TPageContextItems>,
    TView,
    TSortKey
  >
  grid?: TableGridSchema<
    TRow,
    TableContextDataFromItems<TContextItems>,
    TableContextDataFromItems<TPageContextItems>,
    TView,
    TSortKey
  >
  selection?: TableSelectionSchema
  actions?: readonly TableBulkAction<
    TRow,
    TableContextDataFromItems<TContextItems>,
    TableContextDataFromItems<TPageContextItems>
  >[]
  toolbarActions?: readonly TableToolbarAction<
    TRow,
    TableContextDataFromItems<TContextItems>,
    TableContextDataFromItems<TPageContextItems>
  >[]
  rowActions?:
    | readonly TableRowAction<
        TRow,
        TableContextDataFromItems<TContextItems>,
        TableContextDataFromItems<TPageContextItems>
      >[]
    | ((params: {
        row: TRow
        context: TableContextDataFromItems<TContextItems>
        pageContext: TableContextDataFromItems<TPageContextItems>
      }) => readonly TableRowAction<
        TRow,
        TableContextDataFromItems<TContextItems>,
        TableContextDataFromItems<TPageContextItems>
      >[])
  controls?: TableControlsSchema
  persistence?: TablePersistenceOptions
}

export type TableSchemaInput<
  TSource extends TableSource<any, any, any> = TableSource<any, any, any>,
  TFilterKey extends string = TableKnownFieldPath<InferTableSourceRow<TSource>>,
  TSortKey extends string = TableKnownFieldPath<InferTableSourceRow<TSource>>,
  TContextItems extends readonly TableContextItem[] = readonly TableContextItem[],
  TPageContextItems extends readonly TablePageContextItem<
    InferTableSourceRow<TSource>,
    TableContextDataFromItems<TContextItems>
  >[] = readonly TablePageContextItem<
    InferTableSourceRow<TSource>,
    TableContextDataFromItems<TContextItems>
  >[],
  TView extends string = string,
> = {
  tableKey: string
  rowKey: TableRowKey<InferTableSourceRow<TSource>>
  source: TSource
  views?: readonly TView[]
  defaultLayout?: TableLayout
  context?: TContextItems
  pageContext?: TPageContextItems
  filters?: TableFiltersSchema<
    InferTableSourceRow<TSource>,
    TableContextDataFromItems<TContextItems>,
    TFilterKey
  >
  table?: TableTableSchema<
    InferTableSourceRow<TSource>,
    TableContextDataFromItems<TContextItems>,
    TableResolvedPageContextData<TPageContextItems>,
    TView,
    TSortKey
  >
  grid?: TableGridSchema<
    InferTableSourceRow<TSource>,
    TableContextDataFromItems<TContextItems>,
    TableResolvedPageContextData<TPageContextItems>,
    TView,
    TSortKey
  >
  selection?: TableSelectionSchema
  actions?: readonly TableBulkAction<
    InferTableSourceRow<TSource>,
    TableContextDataFromItems<TContextItems>,
    TableResolvedPageContextData<TPageContextItems>
  >[]
  toolbarActions?: readonly TableToolbarAction<
    InferTableSourceRow<TSource>,
    TableContextDataFromItems<TContextItems>,
    TableResolvedPageContextData<TPageContextItems>
  >[]
  rowActions?:
    | readonly TableRowAction<
        InferTableSourceRow<TSource>,
        TableContextDataFromItems<TContextItems>,
        TableResolvedPageContextData<TPageContextItems>
      >[]
    | ((params: {
        row: InferTableSourceRow<TSource>
        context: TableContextDataFromItems<TContextItems>
        pageContext: TableResolvedPageContextData<TPageContextItems>
      }) => readonly TableRowAction<
        InferTableSourceRow<TSource>,
        TableContextDataFromItems<TContextItems>,
        TableResolvedPageContextData<TPageContextItems>
      >[])
  controls?: TableControlsSchema
  persistence?: TablePersistenceOptions
}

type ResolveCollection<TCollection> = TCollection extends (...args: never[]) => infer TResult
  ? TResult
  : TCollection

export type ResolvedTableSchema<TSchema> =
  Omit<TSchema, 'table' | 'filters'> & {
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

export type ResolveSchemaKey<TCandidate extends string, TFallback extends string> = [TCandidate] extends [
  never,
]
  ? TFallback
  : string extends TCandidate
    ? TFallback
    : TCandidate

export type BuildTableSchemaInput<
  TSource extends TableSource<any, any, any>,
  TContextItems extends readonly TableContextItem[],
  TPageContextItems extends readonly TablePageContextItem<
    InferTableSourceRow<TSource>,
    TableContextDataFromItems<TContextItems>
  >[],
  TView extends string,
> = TableSchemaInput<
  TSource,
  InferTableSourceFilterKey<TSource> extends never
    ? TableKnownFieldPath<InferTableSourceRow<TSource>>
    : InferTableSourceFilterKey<TSource>,
  ResolveSchemaKey<
    InferTableSourceSortKey<TSource>,
    TableKnownFieldPath<InferTableSourceRow<TSource>>
  >,
  TContextItems,
  TPageContextItems,
  TView
>

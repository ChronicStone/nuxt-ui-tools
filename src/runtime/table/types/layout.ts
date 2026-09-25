import type {
  TableColumnCollection,
  TableSummaryRequest,
  TableSummaryScope,
  TableSummaryValue,
} from './columns'
import type {
  GenericObject,
  TableDefaultSort,
  TableGridSortOption,
  TableLayout,
  TableRowRenderParams,
  RenderableType,
  TableSortKey,
  TableTextValue,
} from './utils'

export interface TablePersistenceOptions {
  state?: boolean
  preferences?: boolean
}

export type TableLayoutControl<TLayout extends TableLayout = TableLayout> =
  | boolean
  | string
  | Partial<Record<TLayout, boolean | string>>
  | (() => boolean | string | Partial<Record<TLayout, boolean | string>>)

export interface TableControlsSchema {
  refresh?: TableLayoutControl
  layout?: TableLayoutControl
  columns?: TableLayoutControl
  filters?: TableLayoutControl
  sort?: TableLayoutControl
  actions?: TableLayoutControl
}

export interface TableSelectionSchema {
  mode?: false | true | 'auto'
  scope?: 'page' | 'all'
}

export interface PaginationConfig {
  sizeOptions?: number[] | { [key in TableLayout]: number[] }
  defaultSize?: number | { [key in TableLayout]: number }
  showPageSizePicker?: boolean
  showPagesList?: boolean
  showPagesCount?: boolean
}

export type TableOffsetPaginationSchema = PaginationConfig & {
  mode?: 'offset'
}

export interface TableCursorPaginationSchema {
  mode: 'cursor'
  pageSize?: number | Partial<Record<TableLayout, number>>
  count?: 'none' | 'exact'
}

export type TablePaginationSchema =
  | false
  | TableOffsetPaginationSchema
  | TableCursorPaginationSchema

export type TableGridMode = 'flow' | 'contained'

export interface TableGridSchema<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
  TSortKey extends string = TableSortKey<TRow>,
> {
  enabled?: boolean | string | (() => boolean | string)
  mode?: TableGridMode
  renderItem?: (params: TableRowRenderParams<TRow, TContext, TPageContext>) => RenderableType
  renderSkeleton?: (params: { layout?: 'grid' }) => RenderableType
  gridSize?: number | string | (() => number | string)
  itemSize?: number | string | (() => number | string)
  sortOptions?: TableGridSortOption<TSortKey>[]
  defaultSorting?: TableDefaultSort<TSortKey>
}

export interface TableTableSchema<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
  TSortKey extends string = TableSortKey<TRow>,
> {
  enabled?: boolean | string | (() => boolean | string)
  columns?: TableColumnCollection<TRow, TContext, TPageContext, string, TSortKey>
  treeMode?: boolean
  childrenKey?: TableSortKey<TRow>
  defaultSorting?: TableDefaultSort<TSortKey>
  selection?: boolean | 'auto'
  summaries?: TableSummariesSchema<TRow>
}

export interface TableSummariesSchema<TRow extends GenericObject = GenericObject> {
  /** Rows the aggregates describe; defaults to `filtered`. */
  scope?: TableSummaryScope
  /** Scopes the footer toggle offers; defaults to all three when selection is enabled. */
  scopes?: TableSummaryScope[]
  /** Footer label; defaults to a localized "Total". */
  label?: TableTextValue
  /** Resolves every column summary at once, typically from the server; merged over derived values. */
  resolve?: (context: {
    scope: TableSummaryScope
    rows: TRow[]
    request: TableSummaryRequest<TRow>
  }) => Record<string, TableSummaryValue> | Promise<Record<string, TableSummaryValue>>
}

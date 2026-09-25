import type { TableSourceRequestContext } from './source'
import type {
  GenericObject,
  RenderableType,
  TableColumnAlign,
  TableColumnPinned,
  TableKnownFieldPath,
  TableFieldValue,
  TableRowRenderParams,
  TableSortKey,
  TableTextValue,
  TableRuntimeRecord,
} from './utils'

/** Placeholder shape drawn in a column while its first page loads. */
export type TableColumnSkeletonKind =
  | 'text'
  | 'avatar'
  | 'icon'
  | 'dot'
  | 'check'
  | 'badge'
  | 'number'
  | 'progress'
  | 'none'

/** Tunes a placeholder shape so it mirrors the content the column renders. */
export interface TableColumnSkeletonConfig {
  kind: TableColumnSkeletonKind
  /** Adds a shorter caption line under the main one. Avatars default to two lines. */
  lines?: 1 | 2
  /** Draws the avatar or icon as a circle instead of a rounded square. */
  avatar?: 'circle' | 'square'
  /** Share of the cell taken by the main line: a fixed fraction, or a `[min, max]` range varied per row. */
  width?: number | readonly [number, number]
  /** Number of badges drawn side by side. */
  count?: number
}

export type TableColumnSkeleton = TableColumnSkeletonKind | TableColumnSkeletonConfig

export type TableSummaryKind = 'sum' | 'avg' | 'count' | 'min' | 'max'
export type TableSummaryScope = 'page' | 'filtered' | 'selection'
export type TableSummaryValue = string | number | boolean | Date | null | undefined

export type TableSummaryRequest<TRow extends GenericObject = GenericObject> =
  TableSourceRequestContext<TRow>

export interface TableSummaryContext<TRow extends GenericObject = GenericObject> {
  rows: TRow[]
  scope: TableSummaryScope
  columnKey: string
  request: TableSummaryRequest<TRow>
}

export interface TableColumnSummaryConfig<TRow extends GenericObject = GenericObject> {
  /** Derived aggregate computed from the rows in scope. */
  kind?: TableSummaryKind
  /** Custom (possibly async) resolver; wins over `kind`. */
  resolve?: (context: TableSummaryContext<TRow>) => TableSummaryValue | Promise<TableSummaryValue>
  /** Formats the resolved value for display. */
  format?: (value: TableSummaryValue, context: TableSummaryContext<TRow>) => string | number
  /** Renders the cell content; receives the loading state. */
  render?: (params: {
    value: TableSummaryValue
    loading: boolean
    scope: TableSummaryScope
  }) => RenderableType
}

export type TableColumnSummary<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = TableRuntimeRecord,
  TPageContext extends GenericObject = TableRuntimeRecord,
  TData = unknown,
> =
  | TableSummaryKind
  | TableColumnSummaryConfig<TRow>
  | ((context: TableSummaryContext<TRow>) => TableSummaryValue | Promise<TableSummaryValue>)
  | TableSummaryCellDefinition<TRow, TContext, TPageContext, TData>[]

export interface TableSummaryCellContext<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = TableRuntimeRecord,
  TPageContext extends GenericObject = TableRuntimeRecord,
  TData = unknown,
> {
  data: TData | undefined
  rows: TRow[]
  allRows: TRow[] | undefined
  filteredRows: TRow[] | undefined
  selectedRows: TRow[]
  request: TableSourceRequestContext<TRow, TContext>
  context: TContext
  pageContext: TPageContext
}

export interface TableSummaryCellDefinition<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = TableRuntimeRecord,
  TPageContext extends GenericObject = TableRuntimeRecord,
  TData = unknown,
> {
  condition?: (context: TableSummaryCellContext<TRow, TContext, TPageContext, TData>) => boolean
  render: (context: TableSummaryCellContext<TRow, TContext, TPageContext, TData>) => RenderableType
}

export interface TableColumnCellDataAttributes {
  [key: `data-${string}`]: string | number | boolean | undefined
}

export type TableColumnCellProps = TableRuntimeRecord & TableColumnCellDataAttributes

interface TableColumnBase<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
  TKey extends string = string,
  TParams extends TableRowRenderParams<TRow, TContext, TPageContext> = TableRowRenderParams<
    TRow,
    TContext,
    TPageContext
  >,
  TData = unknown,
> {
  key: TKey
  label?: TableTextValue | (() => RenderableType)
  icon?: string
  width?: number | string
  minWidth?: number | string
  maxWidth?: number | string
  sortable?: boolean
  pinned?: TableColumnPinned
  align?: TableColumnAlign
  labelAlign?: TableColumnAlign
  ellipsis?: boolean | TableRuntimeRecord
  resizable?: boolean
  condition?: () => boolean
  enabled?: boolean
  required?: boolean
  /** Footer aggregate for this column. */
  summary?: TableColumnSummary<TRow, TContext, TPageContext, TData>
  /** Placeholder shape rendered while the first page loads. */
  skeleton?: TableColumnSkeleton
  /** Maximum wrapped lines before clamping; defaults to 3, `ellipsis: true` forces one line. */
  lines?: number
  visible?: boolean | ((context: TContext) => boolean)
  cellProps?: (params: TParams) => TableColumnCellProps
  colSpan?: (params: TParams) => number
  rowSpan?: (params: TParams) => number
  labelRowSpan?: (params: TParams) => number
  meta?: {
    pageContext?: TPageContext
  }
}

export type TableFieldRenderParams<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
  TField extends TableKnownFieldPath<TRow> = TableKnownFieldPath<TRow>,
> = TableRowRenderParams<TRow, TContext, TPageContext> & {
  value: TableFieldValue<TRow, TField>
}

interface TableFieldColumnBase<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
  TField extends TableKnownFieldPath<TRow> = TableKnownFieldPath<TRow>,
  TData = unknown,
> extends TableColumnBase<
  TRow,
  TContext,
  TPageContext,
  TField,
  TableFieldRenderParams<TRow, TContext, TPageContext, TField>,
  TData
> {
  kind: 'field'
  field: TField
  render?: (params: TableFieldRenderParams<TRow, TContext, TPageContext, TField>) => RenderableType
}

export type TableFieldColumn<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
  TField extends TableKnownFieldPath<TRow> = TableKnownFieldPath<TRow>,
  TData = unknown,
> = TableFieldColumnBase<TRow, TContext, TPageContext, TField, TData>

type TableAnyFieldColumn<
  TRow extends GenericObject,
  TContext extends GenericObject,
  TPageContext extends GenericObject,
  TData,
> = {
  [TField in TableKnownFieldPath<TRow>]: TableFieldColumn<
    TRow,
    TContext,
    TPageContext,
    TField,
    TData
  >
}[TableKnownFieldPath<TRow>]

export interface TableCompositeColumn<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
  TKey extends string = string,
  TSortKey extends string = TableSortKey<TRow>,
  TData = unknown,
> extends TableColumnBase<
  TRow,
  TContext,
  TPageContext,
  TKey,
  TableRowRenderParams<TRow, TContext, TPageContext>,
  TData
> {
  kind: 'composite'
  sortableKey?: TSortKey
  render: (params: TableRowRenderParams<TRow, TContext, TPageContext>) => RenderableType
}

export interface TableDisplayColumn<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
  TKey extends string = string,
  TData = unknown,
> extends TableColumnBase<
  TRow,
  TContext,
  TPageContext,
  TKey,
  TableRowRenderParams<TRow, TContext, TPageContext>,
  TData
> {
  kind: 'display'
  render: (params: TableRowRenderParams<TRow, TContext, TPageContext>) => RenderableType
}

export type TableColumn<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
  TKey extends string = string,
  TSortKey extends string = TableSortKey<TRow>,
  TData = unknown,
> =
  | TableAnyFieldColumn<TRow, TContext, TPageContext, TData>
  | TableCompositeColumn<TRow, TContext, TPageContext, TKey, TSortKey, TData>
  | TableDisplayColumn<TRow, TContext, TPageContext, TKey, TData>

export type TableFieldColumnOptions<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
  TField extends TableKnownFieldPath<TRow> = TableKnownFieldPath<TRow>,
  TData = unknown,
> = Omit<TableFieldColumn<TRow, TContext, TPageContext, TField, TData>, 'field' | 'key' | 'kind'>

export type TableCompositeColumnOptions<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
  TKey extends string = string,
  TSortKey extends string = TableSortKey<TRow>,
  TData = unknown,
> = Omit<TableCompositeColumn<TRow, TContext, TPageContext, TKey, TSortKey, TData>, 'key' | 'kind'>

export type TableDisplayColumnOptions<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
  TKey extends string = string,
  TData = unknown,
> = Omit<TableDisplayColumn<TRow, TContext, TPageContext, TKey, TData>, 'key' | 'kind'>

export interface TableColumnBuilder<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
  TSortKey extends string = TableSortKey<TRow>,
  TData = unknown,
> {
  field<TField extends TableKnownFieldPath<TRow> & string>(
    field: TField,
    options?: TableFieldColumnOptions<TRow, TContext, TPageContext, TField, TData>,
  ): TableFieldColumn<TRow, TContext, TPageContext, TField, TData>
  composite<TKey extends string>(
    key: TKey,
    options: TableCompositeColumnOptions<TRow, TContext, TPageContext, TKey, TSortKey, TData>,
  ): TableCompositeColumn<TRow, TContext, TPageContext, TKey, TSortKey, TData>
  display<TKey extends string>(
    key: TKey,
    options: TableDisplayColumnOptions<TRow, TContext, TPageContext, TKey, TData>,
  ): TableDisplayColumn<TRow, TContext, TPageContext, TKey, TData>
}

export type TableColumnCollection<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
  TKey extends string = string,
  TSortKey extends string = TableSortKey<TRow>,
  TData = unknown,
> =
  | TableColumn<TRow, TContext, TPageContext, TKey, TSortKey, TData>[]
  | ((
      column: TableColumnBuilder<TRow, TContext, TPageContext, TSortKey, TData>,
    ) => TableColumn<TRow, TContext, TPageContext, TKey, TSortKey, TData>[])

import type {
  GenericObject,
  RenderableType,
  TableColumnAlign,
  TableColumnPinned,
  TableKnownFieldPath,
  TableFieldValue,
  TableRowRenderParams,
  TableSortKey,
} from './utils'

export interface TableColumnCellDataAttributes {
  [key: `data-${string}`]: string | number | boolean | undefined
}

export type TableColumnCellProps = Record<string, unknown> & TableColumnCellDataAttributes

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
> {
  key: TKey
  label?: string | (() => RenderableType)
  icon?: string
  width?: number | string
  minWidth?: number | string
  sortable?: boolean
  pinned?: TableColumnPinned
  align?: TableColumnAlign
  labelAlign?: TableColumnAlign
  ellipsis?: boolean | Record<string, unknown>
  resizable?: boolean
  condition?: () => boolean
  enabled?: boolean
  required?: boolean
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
> extends TableColumnBase<
  TRow,
  TContext,
  TPageContext,
  Extract<TField, string>,
  TableFieldRenderParams<TRow, TContext, TPageContext, TField>
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
> = TableFieldColumnBase<TRow, TContext, TPageContext, TField>

type TableAnyFieldColumn<
  TRow extends GenericObject,
  TContext extends GenericObject,
  TPageContext extends GenericObject,
> = {
  [TField in TableKnownFieldPath<TRow>]: TableFieldColumn<TRow, TContext, TPageContext, TField>
}[TableKnownFieldPath<TRow>]

export interface TableCompositeColumn<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
  TKey extends string = string,
  TSortKey extends string = TableSortKey<TRow>,
> extends TableColumnBase<TRow, TContext, TPageContext, TKey> {
  kind: 'composite'
  sortableKey?: TSortKey
  render: (params: TableRowRenderParams<TRow, TContext, TPageContext>) => RenderableType
}

export interface TableDisplayColumn<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
  TKey extends string = string,
> extends TableColumnBase<TRow, TContext, TPageContext, TKey> {
  kind: 'display'
  render: (params: TableRowRenderParams<TRow, TContext, TPageContext>) => RenderableType
}

export type TableColumn<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
  TKey extends string = string,
  TSortKey extends string = TableSortKey<TRow>,
> =
  | TableAnyFieldColumn<TRow, TContext, TPageContext>
  | TableCompositeColumn<TRow, TContext, TPageContext, TKey, TSortKey>
  | TableDisplayColumn<TRow, TContext, TPageContext, TKey>

export type TableFieldColumnOptions<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
  TField extends TableKnownFieldPath<TRow> = TableKnownFieldPath<TRow>,
> = Omit<TableFieldColumn<TRow, TContext, TPageContext, TField>, 'field' | 'key' | 'kind'>

export type TableCompositeColumnOptions<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
  TKey extends string = string,
  TSortKey extends string = TableSortKey<TRow>,
> = Omit<TableCompositeColumn<TRow, TContext, TPageContext, TKey, TSortKey>, 'key' | 'kind'>

export type TableDisplayColumnOptions<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
  TKey extends string = string,
> = Omit<TableDisplayColumn<TRow, TContext, TPageContext, TKey>, 'key' | 'kind'>

export interface TableColumnBuilder<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
  TSortKey extends string = TableSortKey<TRow>,
> {
  field<TField extends TableKnownFieldPath<TRow>>(
    field: TField,
    options?: TableFieldColumnOptions<TRow, TContext, TPageContext, TField>,
  ): TableFieldColumn<TRow, TContext, TPageContext, TField>
  composite<TKey extends string>(
    key: TKey,
    options: TableCompositeColumnOptions<TRow, TContext, TPageContext, TKey, TSortKey>,
  ): TableCompositeColumn<TRow, TContext, TPageContext, TKey, TSortKey>
  display<TKey extends string>(
    key: TKey,
    options: TableDisplayColumnOptions<TRow, TContext, TPageContext, TKey>,
  ): TableDisplayColumn<TRow, TContext, TPageContext, TKey>
}

export type TableColumnCollection<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
  TKey extends string = string,
  TSortKey extends string = TableSortKey<TRow>,
> =
  | TableColumn<TRow, TContext, TPageContext, TKey, TSortKey>[]
  | ((
      column: TableColumnBuilder<TRow, TContext, TPageContext, TSortKey>,
    ) => TableColumn<TRow, TContext, TPageContext, TKey, TSortKey>[])

import type {
  GenericObject,
  RenderableType,
  TableColumnAlign,
  TableColumnPinned,
  TableKnownFieldPath,
  TableFieldValue,
  TableRowRenderParams,
  TableSortKey,
  TableViewValue,
} from './utils'

export interface TableColumnCellDataAttributes {
  [key: `data-${string}`]: string | number | boolean | undefined
}

export type TableColumnCellProps = Record<string, unknown> & TableColumnCellDataAttributes

interface TableColumnBase<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
  TView extends string = string,
  TKey extends string = string,
  TParams extends TableRowRenderParams<TRow, TContext, TPageContext, TView> = TableRowRenderParams<
    TRow,
    TContext,
    TPageContext,
    TView
  >,
> {
  key: TKey
  label?: string | (() => RenderableType)
  width?: number | string
  minWidth?: number | string
  sortable?: boolean
  pinned?: TableColumnPinned
  align?: TableColumnAlign
  labelAlign?: TableColumnAlign
  ellipsis?: boolean | Record<string, unknown>
  resizable?: boolean
  condition?: () => boolean
  views?: readonly TView[]
  enabled?: TableViewValue<TView, boolean>
  required?: TableViewValue<TView, boolean>
  visible?: boolean | ((context: TContext) => boolean)
  cellProps?: (params: TParams) => TableColumnCellProps
  colSpan?: (params: TParams) => number
  rowSpan?: (params: TParams) => number
  labelRowSpan?: (params: TParams) => number
}

export type TableFieldRenderParams<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
  TView extends string = string,
  TField extends TableKnownFieldPath<TRow> = TableKnownFieldPath<TRow>,
> = TableRowRenderParams<TRow, TContext, TPageContext, TView> & {
  value: TableFieldValue<TRow, TField>
}

interface TableFieldColumnBase<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
  TView extends string = string,
  TField extends TableKnownFieldPath<TRow> = TableKnownFieldPath<TRow>,
> extends TableColumnBase<
  TRow,
  TContext,
  TPageContext,
  TView,
  Extract<TField, string>,
  TableFieldRenderParams<TRow, TContext, TPageContext, TView, TField>
> {
  kind: 'field'
  field: TField
  render?: (
    params: TableFieldRenderParams<TRow, TContext, TPageContext, TView, TField>,
  ) => RenderableType
}

export type TableFieldColumn<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
  TView extends string = string,
  TField extends TableKnownFieldPath<TRow> = TableKnownFieldPath<TRow>,
> = TableFieldColumnBase<TRow, TContext, TPageContext, TView, TField>

type TableAnyFieldColumn<
  TRow extends GenericObject,
  TContext extends GenericObject,
  TPageContext extends GenericObject,
  TView extends string,
> = {
  [TField in TableKnownFieldPath<TRow>]: TableFieldColumn<
    TRow,
    TContext,
    TPageContext,
    TView,
    TField
  >
}[TableKnownFieldPath<TRow>]

export interface TableCompositeColumn<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
  TView extends string = string,
  TKey extends string = string,
  TSortKey extends string = TableSortKey<TRow>,
> extends TableColumnBase<TRow, TContext, TPageContext, TView, TKey> {
  kind: 'composite'
  sortableKey?: TSortKey
  render: (params: TableRowRenderParams<TRow, TContext, TPageContext, TView>) => RenderableType
}

export interface TableDisplayColumn<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
  TView extends string = string,
  TKey extends string = string,
> extends TableColumnBase<TRow, TContext, TPageContext, TView, TKey> {
  kind: 'display'
  render: (params: TableRowRenderParams<TRow, TContext, TPageContext, TView>) => RenderableType
}

export type TableColumn<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
  TView extends string = string,
  TKey extends string = string,
  TSortKey extends string = TableSortKey<TRow>,
> =
  | TableAnyFieldColumn<TRow, TContext, TPageContext, TView>
  | TableCompositeColumn<TRow, TContext, TPageContext, TView, TKey, TSortKey>
  | TableDisplayColumn<TRow, TContext, TPageContext, TView, TKey>

export type TableFieldColumnOptions<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
  TView extends string = string,
  TField extends TableKnownFieldPath<TRow> = TableKnownFieldPath<TRow>,
> = Omit<TableFieldColumn<TRow, TContext, TPageContext, TView, TField>, 'field' | 'key' | 'kind'>

export type TableCompositeColumnOptions<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
  TView extends string = string,
  TKey extends string = string,
  TSortKey extends string = TableSortKey<TRow>,
> = Omit<TableCompositeColumn<TRow, TContext, TPageContext, TView, TKey, TSortKey>, 'key' | 'kind'>

export type TableDisplayColumnOptions<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
  TView extends string = string,
  TKey extends string = string,
> = Omit<TableDisplayColumn<TRow, TContext, TPageContext, TView, TKey>, 'key' | 'kind'>

export interface TableColumnBuilder<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
  TView extends string = string,
  TSortKey extends string = TableSortKey<TRow>,
> {
  field<TField extends TableKnownFieldPath<TRow>>(
    field: TField,
    options?: TableFieldColumnOptions<TRow, TContext, TPageContext, TView, TField>,
  ): TableFieldColumn<TRow, TContext, TPageContext, TView, TField>
  composite<TKey extends string>(
    key: TKey,
    options: TableCompositeColumnOptions<TRow, TContext, TPageContext, TView, TKey, TSortKey>,
  ): TableCompositeColumn<TRow, TContext, TPageContext, TView, TKey, TSortKey>
  display<TKey extends string>(
    key: TKey,
    options: TableDisplayColumnOptions<TRow, TContext, TPageContext, TView, TKey>,
  ): TableDisplayColumn<TRow, TContext, TPageContext, TView, TKey>
}

export type TableColumnCollection<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
  TView extends string = string,
  TKey extends string = string,
  TSortKey extends string = TableSortKey<TRow>,
> =
  | readonly TableColumn<TRow, TContext, TPageContext, TView, TKey, TSortKey>[]
  | ((
      column: TableColumnBuilder<TRow, TContext, TPageContext, TView, TSortKey>,
    ) => readonly TableColumn<TRow, TContext, TPageContext, TView, TKey, TSortKey>[])

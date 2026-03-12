import type {
  GenericObject,
  MaybePromise,
  NestedPaths,
  Prettify,
  RenderableType,
  TypeFromPath,
  UnionToIntersection,
} from '@nuxt-ui-tools/shared'

export type {
  GenericObject,
  MaybePromise,
  NestedPaths,
  Prettify,
  RenderableType,
  TypeFromPath,
  UnionToIntersection,
}

export type TableLayout = 'table' | 'grid'

export type TableColumnPinned = 'left' | 'right'

export type TableColumnAlign = 'left' | 'center' | 'right'

export type TableFieldPath<TRow extends GenericObject> = NestedPaths<TRow> | (string & {})

export type TableKnownFieldPath<TRow extends GenericObject> = Extract<NestedPaths<TRow>, string>

export type TableFieldValue<
  TRow extends GenericObject,
  TField extends TableFieldPath<TRow>,
> = TField extends string
  ? TypeFromPath<TRow, TField>
  : never

export type TableSortKey<TRow extends GenericObject> = TableFieldPath<TRow> | (string & {})

export type TableRowKey<TRow extends GenericObject> =
  | TableFieldPath<TRow>
  | readonly TableFieldPath<TRow>[]

export type TableSortingDirection = 'asc' | 'desc'

export interface TableSortingRule<TKey extends string = string> {
  key: TKey
  dir: TableSortingDirection
}

export interface TablePaginationState {
  page: number
  pageSize: number
}

export interface TableRowRenderParams<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
  TView extends string = string,
> {
  row: TRow
  index: number
  context: TContext
  pageContext: TPageContext
  view?: TView
  layout?: TableLayout
}

export type TableViewValue<TView extends string, TValue> =
  | TValue
  | Partial<Record<TView | '#default', TValue>>

export interface TableGridSortOption<
  TKey extends string = string,
  TView extends string = string,
> {
  label: string | (() => RenderableType)
  key: TKey
  views?: readonly TView[]
}

export type TableDefaultSort<TKey extends string = string> =
  | TKey
  | {
      key: TKey
      dir: TableSortingDirection
    }

export type TableSchemaRefLike<TValue> = {
  value: TValue
}

export type TableSchemaSource<TSchema> = TSchema | TableSchemaRefLike<TSchema> | (() => TSchema)

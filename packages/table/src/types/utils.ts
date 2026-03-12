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

export type TableSchemaRefLike<TValue> = {
  value: TValue
}

export type TableSchemaSource<TSchema> = TSchema | TableSchemaRefLike<TSchema> | (() => TSchema)

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

export interface TableSortOption<
  TKey extends string = string,
  TView extends string = string,
> {
  label: string | (() => RenderableType)
  key: TKey
  direction?: TableSortingDirection
  views?: readonly TView[]
}

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

export type TableResolvedSchema<TSchema> = TSchema extends () => infer TValue
  ? TValue
  : TSchema extends TableSchemaRefLike<infer TValue>
    ? TValue
    : TSchema

export type ExtractTableSourceResult<TSource> = TSource extends {
  loader: (...args: never[]) => MaybePromise<infer TResult>
}
  ? TResult
  : TSource extends {
        query: (...args: never[]) => MaybePromise<infer TResult>
      }
    ? TResult
    : never

export type ExtractTableRow<TSchema> = TableResolvedSchema<TSchema> extends {
  source: infer TSource
}
  ? InferTableSourceRow<TSource>
  : never

type SourceRowFromMetadata<TSource> = TSource extends { __rowType?: infer TRow }
  ? TRow extends GenericObject
    ? TRow
    : never
  : never

export type InferTableSourceRow<TSource> = [SourceRowFromMetadata<TSource>] extends [never]
  ? TableRowsFromSourceResult<ExtractTableSourceResult<TSource>>
  : SourceRowFromMetadata<TSource>

export type TableRowsFromSourceResult<TResult> = TResult extends readonly (infer TRow)[]
  ? TRow extends GenericObject
    ? TRow
    : never
  : TResult extends { rows: readonly (infer TRow)[] }
    ? TRow extends GenericObject
      ? TRow
      : never
    : never

export type ExtractTableView<TSchema> =
  TableResolvedSchema<TSchema> extends { views?: readonly (infer TView)[] }
    ? TView extends string
      ? TView
      : never
    : never

export type ExtractTableContextData<TSchema> = Prettify<
  TableResolvedSchema<TSchema> extends { context?: infer TItems extends readonly unknown[] }
    ? MergeContextItemUnion<TItems[number]>
    : {}
>

export type ExtractTablePageContextData<TSchema> = Prettify<
  TableResolvedSchema<TSchema> extends { pageContext?: infer TItems extends readonly unknown[] }
    ? MergeContextItemUnion<TItems[number]>
    : {}
>

type MergeContextItem<TItem> = TItem extends {
  key: infer TKey extends string
}
  ? {
      [K in TKey]:
        TItem extends { loader?: (...args: any[]) => MaybePromise<infer TValue> }
          ? Awaited<TValue>
          : TItem extends { query?: (...args: any[]) => MaybePromise<infer TValue> }
            ? Awaited<TValue>
            : never
    }
  : TItem extends {
  key: infer TKey extends string
  loader: (...args: any[]) => MaybePromise<infer TValue>
}
  ? { [K in TKey]: Awaited<TValue> }
  : {}

type MergeContextItemUnion<TItem> = UnionToIntersection<MergeContextItem<TItem>>

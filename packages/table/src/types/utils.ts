import type {
  MaybePromise,
  NestedPaths,
  Prettify,
  RenderableType,
  UnionToIntersection,
} from '@nuxt-ui-tools/shared'
import type { ComputedRef, Ref } from 'vue'

export type {
  ComputedRef,
  MaybePromise,
  NestedPaths,
  Prettify,
  Ref,
  RenderableType,
  UnionToIntersection,
}

export type GenericObject = object

export type TypeFromPath<TValue, TPath extends string> =
  TPath extends `${infer THead}.${infer TRest}`
    ? THead extends keyof TValue
      ? TypeFromPath<TValue[THead], TRest>
      : never
    : TPath extends keyof TValue
      ? TValue[TPath]
      : never

export type TableLayout = 'table' | 'grid'

export type TableColumnPinned = 'left' | 'right'

export type TableColumnAlign = 'left' | 'center' | 'right'

type FallbackIfNever<TValue, TFallback> = [TValue] extends [never] ? TFallback : TValue

export type TableFieldPath<TRow extends GenericObject> = FallbackIfNever<
  Extract<NestedPaths<TRow>, string>,
  string
>

export type TableKnownFieldPath<TRow extends GenericObject> = TableFieldPath<TRow>

export type TableFieldValue<
  TRow extends GenericObject,
  TField extends TableFieldPath<TRow>,
> = TField extends string ? TypeFromPath<TRow, TField> : never

export type TableSortKey<TRow extends GenericObject> = TableFieldPath<TRow>

export type TableRowKey<TRow extends GenericObject> = TableFieldPath<TRow> | TableFieldPath<TRow>[]

export type TableSortingDirection = 'asc' | 'desc'

export interface TableSortingRule<TKey extends string = string> {
  key: TKey
  dir: TableSortingDirection
}

export interface TablePaginationState {
  pageIndex: number
  pageSize: number
}

export interface TableRowRenderParams<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
> {
  row: TRow
  index: number
  context: TContext
  pageContext: TPageContext
  layout?: TableLayout
}

export interface TableGridSortOption<TKey extends string = string> {
  label: string | (() => RenderableType)
  key: TKey
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

export type MaybeComputedRef<TValue> = TValue | Ref<TValue> | ComputedRef<TValue> | (() => TValue)

export type TableSchemaSource<TSchema> = TSchema | TableSchemaRefLike<TSchema> | (() => TSchema)

export type TableRowsFromSourceResult<TResult> = TResult extends (infer TRow)[]
  ? TRow
  : TResult extends { rows: (infer TRow)[] }
    ? TRow
    : never

export type TableResolvedSchema<TSchema> = TSchema extends () => infer TValue
  ? TValue
  : TSchema extends { value: infer TValue }
    ? TValue
    : TSchema

type MergeContextItem<TItem> = TItem extends {
  key: infer TKey extends string
  query: (...args: any[]) => import('@tanstack/vue-query').UseQueryOptions<infer TValue>
}
  ? { [K in TKey]: Awaited<TValue> }
  : {}

type MergeContextItemUnion<TItem> = UnionToIntersection<MergeContextItem<TItem>>

type ExtractSourceResult<TSchema> =
  TableResolvedSchema<TSchema> extends {
    source: infer TSource
  }
    ? import('./source').ExtractTableSourceResult<TSource>
    : never

export type ExtractTableRow<TSchema> = TableRowsFromSourceResult<ExtractSourceResult<TSchema>>

export type ExtractTableContextData<TSchema> = Prettify<
  TableResolvedSchema<TSchema> extends { context?: infer TItems extends unknown[] }
    ? MergeContextItemUnion<TItems[number]>
    : {}
>

export type ExtractTablePageContextData<TSchema> = Prettify<
  TableResolvedSchema<TSchema> extends { pageContext?: infer TItems extends unknown[] }
    ? MergeContextItemUnion<TItems[number]>
    : {}
>

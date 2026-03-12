import type { MaybePromise, Prettify, UnionToIntersection } from '@nuxt-ui-tools/table-core'

export type * from '@nuxt-ui-tools/table-core'

export type ExtractTableSourceResult<TSource> = TSource extends {
  loader: (...args: never[]) => Promise<infer TResult> | infer TResult
}
  ? Awaited<TResult>
  : never

type SourceRowFromMetadata<TSource> = TSource extends { __rowType?: infer TRow }
  ? TRow
  : never

export type TableRowsFromSourceResult<TResult> = TResult extends readonly (infer TRow)[]
  ? TRow
  : TResult extends { rows: readonly (infer TRow)[] }
    ? TRow
    : never

type InferSourceRow<TSource> = [SourceRowFromMetadata<TSource>] extends [never]
  ? TableRowsFromSourceResult<ExtractTableSourceResult<TSource>>
  : SourceRowFromMetadata<TSource>

export type TableResolvedSchema<TSchema> = TSchema extends () => infer TValue
  ? TValue
  : TSchema extends { value: infer TValue }
    ? TValue
    : TSchema

type MergeContextItem<TItem> = TItem extends {
  key: infer TKey extends string
  loader: (...args: any[]) => MaybePromise<infer TValue>
}
  ? { [K in TKey]: Awaited<TValue> }
  : {}

type MergeContextItemUnion<TItem> = UnionToIntersection<MergeContextItem<TItem>>

export type ExtractTableRow<TSchema> = TableResolvedSchema<TSchema> extends {
  source: infer TSource
}
  ? InferSourceRow<TSource>
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

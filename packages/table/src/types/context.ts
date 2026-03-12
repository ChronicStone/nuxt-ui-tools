import type {
  GenericObject,
  MaybePromise,
  Prettify,
  TableViewValue,
  UnionToIntersection,
} from './utils'

export interface TableContextItem<
  TKey extends string = string,
  TValue = unknown,
> {
  key: TKey
  loader?: () => MaybePromise<TValue>
  query?: () => MaybePromise<TValue>
  views?: readonly string[]
  condition?: TableViewValue<string, boolean | (() => boolean)>
}

export interface TablePageContextItem<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TKey extends string = string,
  TValue = unknown,
> {
  key: TKey
  loader?: (context: {
    rows: readonly TRow[]
    context: TContext
  }) => MaybePromise<TValue>
  query?: (context: {
    rows: readonly TRow[]
    context: TContext
  }) => MaybePromise<TValue>
  views?: readonly string[]
  condition?: TableViewValue<string, boolean | (() => boolean)>
}

type ContextItemRecord<TItem> = TItem extends {
  key: infer TKey extends string
}
  ? {
      [K in TKey]:
        TItem extends { loader?: (...args: any[]) => MaybePromise<infer TValue> }
          ? Awaited<TValue>
          : TItem extends { query?: (...args: any[]) => MaybePromise<infer TValue> }
            ? Awaited<TValue>
            : TItem extends TableContextItem<any, infer TValue>
              ? Awaited<TValue>
              : TItem extends TablePageContextItem<any, any, any, infer TValue>
                ? Awaited<TValue>
                : never
    }
  : {}

export type TableContextDataFromItems<
  TItems extends readonly unknown[],
> = Prettify<UnionToIntersection<ContextItemRecord<TItems[number]>>>

export type InferTableContextItems<TItems> =
  TItems extends readonly unknown[]
    ? {
      [TIndex in keyof TItems]: TItems[TIndex] extends {
          key: infer TKey extends string
          loader?: () => MaybePromise<infer TValue>
          query?: () => MaybePromise<infer TValue>
        }
          ? TableContextItem<TKey, TValue>
          : never
      }
    : readonly TableContextItem[]

export type InferTablePageContextItems<
  TItems,
  TRow extends GenericObject,
  TContext extends GenericObject,
> = TItems extends readonly unknown[]
    ? {
      [TIndex in keyof TItems]: TItems[TIndex] extends {
        key: infer TKey extends string
        loader?: (context: {
          rows: readonly TRow[]
          context: TContext
        }) => MaybePromise<infer TValue>
        query?: (context: {
          rows: readonly TRow[]
          context: TContext
        }) => MaybePromise<infer TValue>
      }
        ? TablePageContextItem<TRow, TContext, TKey, TValue>
        : never
    }
  : readonly TablePageContextItem<TRow, TContext>[]

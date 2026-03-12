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
  loader: () => MaybePromise<TValue>
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
  loader: (ctx: {
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
        TItem extends { loader: (...args: any[]) => MaybePromise<infer TValue> }
          ? Awaited<TValue>
          : never
    }
  : {}

export type TableContextDataFromItems<
  TItems extends readonly unknown[],
> = Prettify<UnionToIntersection<ContextItemRecord<TItems[number]>>>

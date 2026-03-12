import type {
  GenericObject,
  Prettify,
  TableViewValue,
  UnionToIntersection,
} from './utils'
import type { TableQueryDefinition } from './source'

export interface TableContextItem<
  TKey extends string = string,
  TValue = unknown,
> {
  key: TKey
  query: () => TableQueryDefinition<TValue>
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
  query: (ctx: {
    rows: readonly TRow[]
    context: TContext
  }) => TableQueryDefinition<TValue>
  views?: readonly string[]
  condition?: TableViewValue<string, boolean | (() => boolean)>
}

type ContextItemRecord<TItem> = TItem extends {
  key: infer TKey extends string
}
  ? {
      [K in TKey]:
        TItem extends { query: (...args: any[]) => TableQueryDefinition<infer TValue> }
          ? Awaited<TValue>
          : never
    }
  : {}

export type TableContextDataFromItems<
  TItems extends readonly unknown[],
> = Prettify<UnionToIntersection<ContextItemRecord<TItems[number]>>>

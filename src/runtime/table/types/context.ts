import type { TableQueryDefinition } from './source'
import type { GenericObject, Prettify, UnionToIntersection } from './utils'

export interface TableContextItem<TKey extends string = string, TValue = unknown> {
  key: TKey
  query: () => TableQueryDefinition<TValue>
  condition?: () => boolean
}

export interface TablePageContextItem<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TKey extends string = string,
  TValue = unknown,
> {
  key: TKey
  query: (ctx: { rows: TRow[]; context: TContext }) => TableQueryDefinition<TValue>
  condition?: () => boolean
}

type ContextItemRecord<TItem> = TItem extends {
  key: infer TKey extends string
}
  ? {
      [K in TKey]: TItem extends { query: (...args: any[]) => infer TQuery }
        ? TQuery extends { queryFn?: (...args: never[]) => Promise<infer TValue> | (infer TValue) }
          ? Awaited<TValue>
          : TQuery extends TableQueryDefinition<infer TValue>
            ? Awaited<TValue>
            : never
        : never
    }
  : {}

export type TableContextDataFromItems<TItems extends unknown[]> = Prettify<
  UnionToIntersection<ContextItemRecord<TItems[number]>>
>

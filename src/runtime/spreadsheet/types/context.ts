import type { DeepPrettify, PathToObject, UnionToIntersection } from '../../shared/types/utils'
import type { SpreadsheetQueryDefinition } from './shared'

export interface SpreadsheetContextItem<
  TKey extends string = string,
  TResult = unknown,
> {
  key: TKey
  query: () => SpreadsheetQueryDefinition<TResult>
}

type InferContextItemData<TItem> =
  TItem extends SpreadsheetContextItem<infer TKey, infer TResult>
    ? PathToObject<TKey, TResult>
    : never

export type SpreadsheetContextDataFromItems<
  TItems extends readonly SpreadsheetContextItem<string, unknown>[],
> = DeepPrettify<UnionToIntersection<InferContextItemData<TItems[number]>>>

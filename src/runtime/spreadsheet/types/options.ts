import type { LazyTextValue } from '#ui-tools/shared/types/utils'

export type SpreadsheetPrimitiveOption = string | number | boolean

export interface SpreadsheetOptionEntry<TValue = unknown> {
  label: LazyTextValue
  value: TValue
}

export type SpreadsheetOptionItem<TValue = unknown> =
  | SpreadsheetPrimitiveOption
  | SpreadsheetOptionEntry<TValue>

export type InferSpreadsheetOptionValue<TOption> =
  TOption extends SpreadsheetOptionEntry<infer TValue>
    ? TValue
    : TOption extends SpreadsheetPrimitiveOption
      ? TOption
      : never

type InferSpreadsheetOptionsSourceItem<TSource> =
  TSource extends readonly (infer TOption)[]
    ? TOption
    : TSource extends (...args: infer _Args) => readonly (infer TOption)[]
      ? TOption
      : never

export type InferSpreadsheetOptionsSourceValue<TSource> =
  InferSpreadsheetOptionValue<InferSpreadsheetOptionsSourceItem<TSource>>

type SpreadsheetOptionsResolverFn<TParams, TOption extends SpreadsheetOptionItem> = {
  bivarianceHack: (params: TParams) => readonly TOption[]
}['bivarianceHack']

export type SpreadsheetOptionsSource<
  TParams,
  TOption extends SpreadsheetOptionItem = SpreadsheetOptionItem,
> =
  | readonly TOption[]
  | SpreadsheetOptionsResolverFn<TParams, TOption>

export type SpreadsheetPrimitiveOption = string | number | boolean

export interface SpreadsheetOptionEntry<TValue = unknown> {
  label: string
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

type SpreadsheetOptionsResolverFn<TParams, TOption extends SpreadsheetOptionItem> = {
  bivarianceHack: (params: TParams) => readonly TOption[]
}['bivarianceHack']

export type SpreadsheetOptionsSource<
  TParams,
  TOption extends SpreadsheetOptionItem = SpreadsheetOptionItem,
> =
  | readonly TOption[]
  | SpreadsheetOptionsResolverFn<TParams, TOption>

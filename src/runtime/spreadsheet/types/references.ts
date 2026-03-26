import type { SpreadsheetQueryDefinition } from './shared'

export interface SpreadsheetStandardOption<TValue = unknown> {
  label: string
  value: TValue
}

type SpreadsheetOptionLabelResolver<TOption> = {
  bivarianceHack: (option: TOption) => string
}['bivarianceHack']

type SpreadsheetOptionValueResolver<TOption, TValue> = {
  bivarianceHack: (option: TOption) => TValue
}['bivarianceHack']

type SpreadsheetReferenceOptionsResolver<TOption> = {
  bivarianceHack: (params: {
    context: Record<string, unknown>
    row: Record<string, unknown>
    search: string
  }) => SpreadsheetQueryDefinition<readonly TOption[]>
}['bivarianceHack']

type SpreadsheetReferenceSelectBaseConfig<TOption> = {
  source: string
  options?: readonly TOption[]
  getOptions?: SpreadsheetReferenceOptionsResolver<TOption>
}

export interface SpreadsheetReferenceDefinition<
  TField extends string = string,
  TValue = unknown,
  TOption = unknown,
> {
  kind: 'select'
  field: TField
  source: string
  options?: readonly TOption[]
  getOptions?: SpreadsheetReferenceOptionsResolver<TOption>
  optionValue?: SpreadsheetOptionValueResolver<TOption, TValue>
  optionLabel?: SpreadsheetOptionLabelResolver<TOption>
}

export type SpreadsheetReferenceSelectConfig<
  TOption,
  TValue = TOption extends SpreadsheetStandardOption<infer TResolvedValue>
    ? TResolvedValue
    : unknown,
> = SpreadsheetReferenceSelectBaseConfig<TOption> & (
  TOption extends SpreadsheetStandardOption<any>
    ? {
        optionLabel?: SpreadsheetOptionLabelResolver<TOption>
        optionValue?: SpreadsheetOptionValueResolver<TOption, TValue>
      }
    : {
        optionLabel: SpreadsheetOptionLabelResolver<TOption>
        optionValue: SpreadsheetOptionValueResolver<TOption, TValue>
      }
)

export type SpreadsheetReferenceValue<
  _TOption,
  TValue,
> = TValue

export interface SpreadsheetReferenceBuilder {
  select: <
    TField extends string,
    const TOption,
    TValue = TOption extends SpreadsheetStandardOption<infer TResolvedValue>
      ? TResolvedValue
      : unknown,
  >(
    field: TField,
    config: SpreadsheetReferenceSelectConfig<TOption, TValue>,
  ) => SpreadsheetReferenceDefinition<
    TField,
    SpreadsheetReferenceValue<TOption, TValue>,
    TOption
  >
}

export type InferSpreadsheetReferenceValue<TReference> =
  TReference extends SpreadsheetReferenceDefinition<any, infer TValue, any>
    ? TValue
    : never

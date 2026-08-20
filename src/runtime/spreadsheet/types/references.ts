import type {
  InferSpreadsheetOptionValue,
  SpreadsheetOptionItem,
  SpreadsheetOptionsSource,
} from './options'
import type {
  SpreadsheetReferenceSourcePath,
  SpreadsheetReferenceValueAtPath,
  SpreadsheetResolutionQueryResolver,
  SpreadsheetResolvedSelectionValue,
} from './resolution'
import type { SpreadsheetRecord } from './shared'
import type { SpreadsheetFieldRulesInput } from './validation'

type SpreadsheetReferenceSelectBaseConfig<TOption extends SpreadsheetOptionItem> = {
  source: string
  options?: SpreadsheetOptionsSource<
    {
      context: SpreadsheetRecord
    },
    TOption
  >
  getOptions?: SpreadsheetResolutionQueryResolver<SpreadsheetRecord, SpreadsheetRecord, TOption>
}

export interface SpreadsheetReferenceDefinition<
  TField extends string = string,
  TValue = unknown,
  TOption extends SpreadsheetOptionItem = SpreadsheetOptionItem,
  TSource extends string = string,
  TRulesInput extends SpreadsheetFieldRulesInput<TValue> | undefined =
    | SpreadsheetFieldRulesInput<TValue>
    | undefined,
> {
  kind: 'select'
  field: TField
  source: TSource
  options?: SpreadsheetOptionsSource<
    {
      context: SpreadsheetRecord
    },
    TOption
  >
  getOptions?: SpreadsheetResolutionQueryResolver<SpreadsheetRecord, SpreadsheetRecord, TOption>
  rules?: SpreadsheetFieldRulesInput<TValue>
  __rulesInput?: TRulesInput
}

export type SpreadsheetReferenceSelectConfig<
  TRow,
  TSource extends SpreadsheetReferenceSourcePath<TRow>,
  TOption extends SpreadsheetOptionItem,
  TValue = SpreadsheetResolvedSelectionValue<
    SpreadsheetReferenceValueAtPath<TRow, TSource>,
    InferSpreadsheetOptionValue<TOption>
  >,
  TRulesInput extends SpreadsheetFieldRulesInput<TValue> | undefined =
    | SpreadsheetFieldRulesInput<TValue>
    | undefined,
> = Omit<SpreadsheetReferenceSelectBaseConfig<TOption>, 'source'> & {
  source: TSource
  rules?: TRulesInput
}

export type SpreadsheetReferenceValue<TSourceValue, TValue> = SpreadsheetResolvedSelectionValue<
  TSourceValue,
  TValue
>

export interface SpreadsheetReferenceBuilder<TRow = SpreadsheetRecord> {
  select: <
    TField extends string,
    TSource extends SpreadsheetReferenceSourcePath<TRow>,
    const TOption extends SpreadsheetOptionItem,
    TValue = SpreadsheetReferenceValue<
      SpreadsheetReferenceValueAtPath<TRow, TSource>,
      InferSpreadsheetOptionValue<TOption>
    >,
    TRulesInput extends SpreadsheetFieldRulesInput<TValue> | undefined =
      | SpreadsheetFieldRulesInput<TValue>
      | undefined,
  >(
    field: TField,
    config: SpreadsheetReferenceSelectConfig<TRow, TSource, TOption, TValue, TRulesInput>,
  ) => SpreadsheetReferenceDefinition<TField, TValue, TOption, TSource, TRulesInput>
}

export type InferSpreadsheetReferenceValue<TReference> =
  TReference extends SpreadsheetReferenceDefinition<string, infer TValue, SpreadsheetOptionItem>
    ? TValue
    : never

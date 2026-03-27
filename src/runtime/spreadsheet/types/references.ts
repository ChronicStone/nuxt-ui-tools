import type { SpreadsheetQueryDefinition } from './shared'
import type {
  InferSpreadsheetOptionValue,
  SpreadsheetOptionItem,
  SpreadsheetOptionsSource,
} from './options'
import type { SpreadsheetFieldRulesInput } from './validation'
import type { NestedPaths } from '../../shared/types/utils'

type SpreadsheetReferencePath<TRow> = Extract<NestedPaths<TRow>, string>

type SpreadsheetReferenceValueAtPath<TRow, TPath extends string> = TPath extends `${infer TKey}.${infer TRest}`
  ? TKey extends keyof TRow
    ? SpreadsheetReferenceValueAtPath<NonNullable<TRow[TKey]>, TRest>
    : never
  : TPath extends keyof TRow
    ? TRow[TPath]
    : never

type SpreadsheetReferenceResolvedValue<TSourceValue, TValue> =
  NonNullable<TSourceValue> extends readonly unknown[]
    ? TValue[]
    : TValue

type SpreadsheetReferenceOptionsResolver<TOption> = {
  bivarianceHack: (params: {
    context: Record<string, unknown>
    row: Record<string, unknown>
    search: string
  }) => SpreadsheetQueryDefinition<readonly TOption[]>
}['bivarianceHack']

type SpreadsheetReferenceSelectBaseConfig<TOption extends SpreadsheetOptionItem> = {
  source: string
  options?: SpreadsheetOptionsSource<{
    context: Record<string, unknown>
  }, TOption>
  getOptions?: SpreadsheetReferenceOptionsResolver<TOption>
}

export interface SpreadsheetReferenceDefinition<
  TField extends string = string,
  TValue = unknown,
  TOption extends SpreadsheetOptionItem = SpreadsheetOptionItem,
  TSource extends string = string,
  TRulesInput extends SpreadsheetFieldRulesInput<TValue> | undefined = SpreadsheetFieldRulesInput<TValue> | undefined,
> {
  kind: 'select'
  field: TField
  source: TSource
  options?: SpreadsheetOptionsSource<{
    context: Record<string, unknown>
  }, TOption>
  getOptions?: SpreadsheetReferenceOptionsResolver<TOption>
  rules?: SpreadsheetFieldRulesInput<TValue>
  __rulesInput?: TRulesInput
}

export type SpreadsheetReferenceSelectConfig<
  TRow,
  TSource extends SpreadsheetReferencePath<TRow>,
  TOption extends SpreadsheetOptionItem,
  TValue = SpreadsheetReferenceValue<
    SpreadsheetReferenceValueAtPath<TRow, TSource>,
    InferSpreadsheetOptionValue<TOption>
  >,
  TRulesInput extends SpreadsheetFieldRulesInput<TValue> | undefined = SpreadsheetFieldRulesInput<TValue> | undefined,
> = Omit<SpreadsheetReferenceSelectBaseConfig<TOption>, 'source'> & {
  source: TSource
  rules?: TRulesInput
}

export type SpreadsheetReferenceValue<
  TSourceValue,
  TValue,
> = SpreadsheetReferenceResolvedValue<TSourceValue, TValue>

export interface SpreadsheetReferenceBuilder<
  TRow = Record<string, unknown>,
> {
  select: <
    TField extends string,
    TSource extends SpreadsheetReferencePath<TRow>,
    const TOption extends SpreadsheetOptionItem,
    TValue = SpreadsheetReferenceValue<
      SpreadsheetReferenceValueAtPath<TRow, TSource>,
      InferSpreadsheetOptionValue<TOption>
    >,
    TRulesInput extends SpreadsheetFieldRulesInput<TValue> | undefined = SpreadsheetFieldRulesInput<TValue> | undefined,
  >(
    field: TField,
    config: SpreadsheetReferenceSelectConfig<TRow, TSource, TOption, TValue, TRulesInput>,
  ) => SpreadsheetReferenceDefinition<
    TField,
    TValue,
    TOption,
    TSource,
    TRulesInput
  >
}

export type InferSpreadsheetReferenceValue<TReference> =
  TReference extends SpreadsheetReferenceDefinition<any, infer TValue, any>
    ? TValue
    : never

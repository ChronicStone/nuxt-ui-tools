import type { NestedPaths } from '../../shared/types/utils'
import type { SpreadsheetContextDataFromItems, SpreadsheetContextItem } from './context'
import type { SpreadsheetQueryDefinition } from './shared'
import type {
  InferSpreadsheetOptionValue,
  SpreadsheetOptionItem,
  SpreadsheetOptionsSource,
} from './options'
import type { SpreadsheetFieldRulesInput } from './validation'

export type SpreadsheetResolvedSelectionValue<
  TSourceValue,
  TValue,
> = NonNullable<TSourceValue> extends readonly unknown[]
  ? TValue[]
  : TValue

export type SpreadsheetResolutionQueryResolver<
  TContext,
  TRow,
  TOption extends SpreadsheetOptionItem,
> = {
  bivarianceHack: (params: {
    context: TContext
    row: TRow
    search: string
  }) => SpreadsheetQueryDefinition<readonly TOption[]>
}['bivarianceHack']

export interface SpreadsheetColumnResolveDefinition<
  TContext = unknown,
  TSourceValue = unknown,
  TOption extends SpreadsheetOptionItem = SpreadsheetOptionItem,
  TValue = SpreadsheetResolvedSelectionValue<TSourceValue, InferSpreadsheetOptionValue<TOption>>,
> {
  options: SpreadsheetOptionsSource<{ context: TContext }, TOption>
  getOptions?: SpreadsheetResolutionQueryResolver<TContext, Record<string, unknown>, TOption>
  __sourceValueType?: TSourceValue
  __valueType?: TValue
}

export type InferSpreadsheetColumnResolveValue<TResolve> =
  TResolve extends SpreadsheetColumnResolveDefinition<unknown, unknown, SpreadsheetOptionItem, infer TValue>
    ? TValue
    : never

type SpreadsheetReferencePath<TRow> = Extract<NestedPaths<TRow>, string>

export type SpreadsheetReferenceValueAtPath<TRow, TPath extends string> =
  TPath extends `${infer TKey}.${infer TRest}`
    ? TKey extends keyof TRow
      ? SpreadsheetReferenceValueAtPath<NonNullable<TRow[TKey]>, TRest>
      : never
    : TPath extends keyof TRow
      ? TRow[TPath]
      : never

export interface SpreadsheetResolutionDefinition<
  TScope extends 'column' | 'reference' = 'column' | 'reference',
  TTargetField extends string = string,
  TSourceField extends string = string,
  TSourceValue = unknown,
  TValue = unknown,
  TOption extends SpreadsheetOptionItem = SpreadsheetOptionItem,
  TContext = Record<string, unknown>,
  TRow = Record<string, unknown>,
  TRulesInput extends SpreadsheetFieldRulesInput<TValue> | undefined = SpreadsheetFieldRulesInput<TValue> | undefined,
> {
  kind: 'select'
  scope: TScope
  targetField: TTargetField
  sourceField: TSourceField
  options?: SpreadsheetOptionsSource<{ context: TContext }, TOption>
  getOptions?: SpreadsheetResolutionQueryResolver<TContext, TRow, TOption>
  rules?: SpreadsheetFieldRulesInput<TValue>
  __rulesInput?: TRulesInput
  __sourceValueType?: TSourceValue
  __valueType?: TValue
}

export type SpreadsheetReferenceSourcePath<TRow> = SpreadsheetReferencePath<TRow>

export type SpreadsheetSchemaContextData<TSchema> =
  TSchema extends {
    context?: infer TContextItems extends readonly SpreadsheetContextItem<string, unknown>[]
  }
    ? SpreadsheetContextDataFromItems<TContextItems>
    : Record<string, unknown>

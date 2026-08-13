import type { SpreadsheetIssueLevel } from './shared'

export type SpreadsheetLazyMessage<
  TValue,
  TParams extends unknown[] = [],
  TMeta extends Record<string, unknown> = {},
> = string | (() => string) | ((ctx: SpreadsheetMessageContext<TValue, TParams, TMeta>) => string)

export type SpreadsheetValidatorResult<TMeta extends Record<string, unknown> = {}> =
  | boolean
  | ({ $valid: boolean } & TMeta)

export type SpreadsheetMessageContext<
  TValue,
  TParams extends unknown[] = [],
  TMeta extends Record<string, unknown> = {},
> = {
  [key: string]: unknown
  $valid?: boolean
  value: TValue
  params: TParams
} & Partial<TMeta>

export interface SpreadsheetRuleOverrides<
  TValue,
  TParams extends unknown[] = [],
  TMeta extends Record<string, unknown> = {},
> {
  message?: SpreadsheetLazyMessage<TValue, TParams, TMeta>
}

export interface SpreadsheetRuleFlags {
  required?: true
}

export interface SpreadsheetRuleExecutionResult<
  TMeta extends Record<string, unknown> = Record<string, unknown>,
> {
  $valid: boolean
  $message: string | null
  $meta: TMeta
}

export interface SpreadsheetRule<
  TValue,
  TFlags extends SpreadsheetRuleFlags = SpreadsheetRuleFlags,
> {
  readonly flags?: TFlags
  readonly $rule: true
  readonly name?: string
  readonly level: SpreadsheetIssueLevel
  readonly validate: {
    bivarianceHack: (value: TValue) => SpreadsheetRuleExecutionResult
  }['bivarianceHack']
}

export type SpreadsheetFieldRules<TValue> = readonly SpreadsheetRule<TValue, SpreadsheetRuleFlags>[]

export interface SpreadsheetRuleBuilder {
  validate: <TValue, TMeta extends Record<string, unknown> = {}>(options: {
    name?: string
    validator: (value: TValue) => SpreadsheetValidatorResult<TMeta>
    message: SpreadsheetLazyMessage<TValue, [], TMeta>
  }) => SpreadsheetRule<TValue>
  required: CreateSpreadsheetRuleReturn<unknown, [], {}, { required: true }>
  maxLength: CreateSpreadsheetRuleReturn<string, [max: number], { max: number }>
  minLength: CreateSpreadsheetRuleReturn<string, [min: number], { min: number }>
  number: CreateSpreadsheetRuleReturn<number, [], {}>
  min: CreateSpreadsheetRuleReturn<number, [min: number], { min: number }>
  max: CreateSpreadsheetRuleReturn<number, [max: number], { max: number }>
  between: CreateSpreadsheetRuleReturn<
    number,
    [min: number, max: number],
    {
      min: number
      max: number
    }
  >
  oneOf: <const TValues extends readonly unknown[]>(
    values: TValues,
    overrides?: SpreadsheetRuleOverrides<
      SpreadsheetWidenLiteral<TValues[number]>,
      [TValues],
      { values: TValues }
    >,
  ) => SpreadsheetRule<SpreadsheetWidenLiteral<TValues[number]>>
}

export type SpreadsheetFieldRulesInput<TValue> =
  | SpreadsheetFieldRules<TValue>
  | ((rules: SpreadsheetRuleBuilder) => SpreadsheetFieldRules<TValue>)

export type CreateSpreadsheetRuleReturn<
  TValue,
  TParams extends unknown[],
  TMeta extends Record<string, unknown>,
  TFlags extends SpreadsheetRuleFlags = {},
> = TParams extends []
  ? (
      overrides?: SpreadsheetRuleOverrides<TValue, TParams, TMeta>,
    ) => SpreadsheetRule<TValue, TFlags>
  : (
      ...args: [...TParams, overrides?: SpreadsheetRuleOverrides<TValue, TParams, TMeta>]
    ) => SpreadsheetRule<TValue, TFlags>

export type SpreadsheetWidenLiteral<TValue> = TValue extends string
  ? string
  : TValue extends number
    ? number
    : TValue extends boolean
      ? boolean
      : TValue

export type CreateSpreadsheetRule = <
  TValue,
  TParams extends unknown[],
  TMeta extends Record<string, unknown> = {},
  TFlags extends SpreadsheetRuleFlags = {},
>(options: {
  name?: string
  flags?: TFlags
  validator: (value: TValue, ...params: TParams) => SpreadsheetValidatorResult<TMeta>
  message: SpreadsheetLazyMessage<TValue, TParams, TMeta>
}) => CreateSpreadsheetRuleReturn<TValue, TParams, TMeta, TFlags>

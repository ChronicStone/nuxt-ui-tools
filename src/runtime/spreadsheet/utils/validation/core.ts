import type {
  CreateSpreadsheetRule,
  CreateSpreadsheetRuleReturn,
  SpreadsheetFieldRules,
  SpreadsheetFieldRulesInput,
  SpreadsheetLazyMessage,
  SpreadsheetRule,
  SpreadsheetRuleBuilder,
  SpreadsheetRuleFlags,
  SpreadsheetRuleOverrides,
  SpreadsheetValidatorResult,
} from '../../types/validation'
import { useUiToolsLocale } from '#ui-tools/i18n'

function isSpreadsheetRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
}

function isSpreadsheetRuleOverride(
  value: unknown,
): value is SpreadsheetRuleOverrides<unknown, unknown[], Record<string, unknown>> {
  return isSpreadsheetRecord(value) && 'message' in value
}

function resolveSpreadsheetRuleFactoryInput(input: unknown[]) {
  const lastItem = input.at(-1)
  if (!isSpreadsheetRuleOverride(lastItem))
    return {
      params: input,
      overrides: undefined,
    }

  return {
    params: input.slice(0, -1),
    overrides: lastItem,
  }
}

function createSpreadsheetRuleInstance<
  TValue,
  TParams extends unknown[],
  TMeta extends Record<string, unknown>,
  TFlags extends SpreadsheetRuleFlags,
>(options: {
  flags?: TFlags
  name?: string
  validator: (value: TValue, ...params: TParams) => SpreadsheetValidatorResult<TMeta>
  params: TParams
  message: SpreadsheetLazyMessage<TValue, TParams, TMeta>
}) {
  return {
    $rule: true,
    flags: options.flags,
    name: options.name,
    level: 'error',
    validate(value) {
      const messageResolver: Function | string = options.message
      const rawResult = options.validator(value, ...options.params)

      if (typeof rawResult === 'boolean') {
        if (rawResult)
          return {
            $valid: true,
            $message: null,
            $meta: Object.fromEntries([]),
          }

        return {
          $valid: false,
          $message: typeof messageResolver === 'function'
            ? String(messageResolver({
            $valid: false,
            value,
            params: options.params,
            }))
            : messageResolver,
          $meta: Object.fromEntries([]),
        }
      }

      const metaEntries = Object.entries(rawResult).filter(([key]) => key !== '$valid')
      const result = {
        $valid: rawResult.$valid,
        $message: null,
        $meta: Object.fromEntries(metaEntries),
      }

      if (result.$valid)
        return {
          $valid: true,
          $message: null,
          $meta: result.$meta,
        }

      return {
        ...result,
        $message: typeof messageResolver === 'function'
          ? String(messageResolver({
              value,
              params: options.params,
              ...rawResult,
            }))
          : messageResolver,
      }
    },
  } satisfies SpreadsheetRule<TValue, TFlags>
}

function createRule<
  TValue,
  TParams extends unknown[],
  TMeta extends Record<string, unknown> = {},
  TFlags extends SpreadsheetRuleFlags = {},
>(options: {
  flags?: TFlags
  name?: string
  validator: (value: TValue, ...params: TParams) => SpreadsheetValidatorResult<TMeta>
  message: SpreadsheetLazyMessage<TValue, TParams, TMeta>
}): CreateSpreadsheetRuleReturn<TValue, TParams, TMeta, TFlags>
function createRule(options: {
  flags?: SpreadsheetRuleFlags
  name?: string
  validator: (value: unknown, ...params: unknown[]) => SpreadsheetValidatorResult<Record<string, unknown>>
  message: SpreadsheetLazyMessage<unknown, unknown[], Record<string, unknown>>
}) {
  return (...input: unknown[]) => {
    const { params, overrides } = resolveSpreadsheetRuleFactoryInput(input)

    return createSpreadsheetRuleInstance({
      flags: options.flags,
      name: options.name,
      validator: options.validator,
      params,
      message: overrides?.message ?? options.message,
    })
  }
}

function validate<
  TValue,
  TMeta extends Record<string, unknown> = {},
>(options: {
  name?: string
  validator: (value: TValue) => SpreadsheetValidatorResult<TMeta>
  message: SpreadsheetLazyMessage<TValue, [], TMeta>
}): SpreadsheetRule<TValue>
function validate(options: {
  name?: string
  validator: (value: unknown) => SpreadsheetValidatorResult<Record<string, unknown>>
  message: SpreadsheetLazyMessage<unknown, [], Record<string, unknown>>
}) {
  const createInlineRule = createRule({
    name: options.name,
    validator: options.validator,
    message: options.message,
  })

  return createInlineRule()
}

function createNumericValueGuard(value: number) {
  return !Number.isNaN(value) && Number.isFinite(value)
}

const createSpreadsheetRuleBuilder = () => {
  const { t } = useUiToolsLocale()

  return ({
    validate,
    required: createRule<unknown, [], {}, { required: true }>({
      name: 'required',
      flags: { required: true },
      validator: (value: unknown) => value != null && value !== '',
      message: () => t('spreadsheet.validation.required'),
    }),
    maxLength: createRule<string, [max: number], { max: number }>({
      name: 'maxLength',
      validator: (value: string, max: number) => ({
        $valid: value.length <= max,
        max,
      }),
      message: ({ value, params: [max] }) =>
        t('spreadsheet.validation.maxLength', { max, length: value.length }),
    }),
    minLength: createRule<string, [min: number], { min: number }>({
      name: 'minLength',
      validator: (value: string, min: number) => ({
        $valid: value.length >= min,
        min,
      }),
      message: ({ value, params: [min] }) =>
        t('spreadsheet.validation.minLength', { min, length: value.length }),
    }),
    number: createRule<number, [], {}>({
      name: 'number',
      validator: (value: number) => createNumericValueGuard(value),
      message: () => t('spreadsheet.validation.number'),
    }),
    min: createRule<number, [min: number], { min: number }>({
      name: 'min',
      validator: (value: number, min: number) => ({
        $valid: createNumericValueGuard(value) && value >= min,
        min,
      }),
      message: ({ value, params: [min] }) =>
        t('spreadsheet.validation.min', { value, min }),
    }),
    max: createRule<number, [max: number], { max: number }>({
      name: 'max',
      validator: (value: number, max: number) => ({
        $valid: createNumericValueGuard(value) && value <= max,
        max,
      }),
      message: ({ value, params: [max] }) =>
        t('spreadsheet.validation.max', { value, max }),
    }),
    between: createRule<number, [min: number, max: number], { min: number, max: number }>({
      name: 'between',
      validator: (value: number, min: number, max: number) => ({
        $valid: createNumericValueGuard(value) && value >= min && value <= max,
        min,
        max,
      }),
      message: ({ value, params: [min, max] }) =>
        t('spreadsheet.validation.between', { value, min, max }),
    }),
    oneOf(values, overrides) {
      const ruleFactory = createRule<
        typeof values[number] extends string ? string
          : typeof values[number] extends number ? number
            : typeof values[number] extends boolean ? boolean
              : typeof values[number],
        [typeof values],
        { values: typeof values }
      >({
        name: 'oneOf',
        validator: (value, allowedValues) => ({
          $valid: allowedValues.includes(value),
          values: allowedValues,
        }),
        message: ({ value, params: [allowedValues] }) =>
          t('spreadsheet.validation.oneOf', {
            value: String(value),
            values: allowedValues.map(String).join(', '),
          }),
      })

      return ruleFactory(values, overrides)
    },
  }) satisfies SpreadsheetRuleBuilder
}

export const createSheetRule = createRule as CreateSpreadsheetRule

export function resolveSpreadsheetRules<TValue>(
  rules: SpreadsheetFieldRulesInput<TValue> | undefined,
) {
  if (!rules) return []
  if (typeof rules === 'function') return rules(createSpreadsheetRuleBuilder())
  return rules
}

export function resolveSpreadsheetRelationRules<TRow, TValue>(params: {
  row: TRow
  rules: (rules: SpreadsheetRuleBuilder, row: TRow) => SpreadsheetFieldRules<TValue>
}) {
  return params.rules(createSpreadsheetRuleBuilder(), params.row)
}

export function executeSpreadsheetRules<TValue>(params: {
  value: TValue
  rules: SpreadsheetFieldRulesInput<TValue> | undefined
}) {
  const rules = resolveSpreadsheetRules(params.rules)
  if (!rules.length) return []

  return rules
    .flatMap((rule: SpreadsheetRule<TValue>, index: number) => {
      const result = rule.validate(params.value)
      if (result.$valid) return []

      return [{
        ruleKey: rule.name,
        level: rule.level,
        code: rule.name ?? `rule.${index}`,
        message: result.$message ?? '',
      }]
    })
}

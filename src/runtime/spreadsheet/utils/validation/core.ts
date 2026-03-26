import type {
  CreateSpreadsheetRuleReturn,
  SpreadsheetFieldRules,
  SpreadsheetLazyMessage,
  SpreadsheetRule,
  SpreadsheetRuleOverrides,
  SpreadsheetSheetRules,
  SpreadsheetValidatorResult,
} from '../../types/validation'

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
>(options: {
  name?: string
  validator: (value: TValue, ...params: TParams) => SpreadsheetValidatorResult<TMeta>
  params: TParams
  message: SpreadsheetLazyMessage<TValue, TParams, TMeta>
}) {
  return {
    $rule: true,
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
  } satisfies SpreadsheetRule<TValue>
}

function createRule<
  TValue,
  TParams extends unknown[],
  TMeta extends Record<string, unknown> = {},
>(options: {
  name?: string
  validator: (value: TValue, ...params: TParams) => SpreadsheetValidatorResult<TMeta>
  message: SpreadsheetLazyMessage<TValue, TParams, TMeta>
}): CreateSpreadsheetRuleReturn<TValue, TParams, TMeta>
function createRule(options: {
  name?: string
  validator: (value: unknown, ...params: unknown[]) => SpreadsheetValidatorResult<Record<string, unknown>>
  message: SpreadsheetLazyMessage<unknown, unknown[], Record<string, unknown>>
}) {
  return (...input: unknown[]) => {
    const { params, overrides } = resolveSpreadsheetRuleFactoryInput(input)

    return createSpreadsheetRuleInstance({
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

export const sheetRules: SpreadsheetSheetRules = {
  createRule,
  validate,
  required: createRule<unknown, [], {}>({
    name: 'required',
    validator: (value: unknown) => value != null && value !== '',
    message: () => 'This field is required',
  }),
  maxLength: createRule<string, [max: number], { max: number }>({
    name: 'maxLength',
    validator: (value: string, max: number) => ({
      $valid: value.length <= max,
      max,
    }),
    message: ({ value, params: [max] }) => `Max ${max} characters, got ${value.length}`,
  }),
  minLength: createRule<string, [min: number], { min: number }>({
    name: 'minLength',
    validator: (value: string, min: number) => ({
      $valid: value.length >= min,
      min,
    }),
    message: ({ value, params: [min] }) => `Min ${min} characters, got ${value.length}`,
  }),
  number: createRule<number, [], {}>({
    name: 'number',
    validator: (value: number) => createNumericValueGuard(value),
    message: () => 'This field must be a valid number',
  }),
  min: createRule<number, [min: number], { min: number }>({
    name: 'min',
    validator: (value: number, min: number) => ({
      $valid: createNumericValueGuard(value) && value >= min,
      min,
    }),
    message: ({ value, params: [min] }) => `${value} must be greater than or equal to ${min}`,
  }),
  max: createRule<number, [max: number], { max: number }>({
    name: 'max',
    validator: (value: number, max: number) => ({
      $valid: createNumericValueGuard(value) && value <= max,
      max,
    }),
    message: ({ value, params: [max] }) => `${value} must be lower than or equal to ${max}`,
  }),
  between: createRule<number, [min: number, max: number], { min: number, max: number }>({
    name: 'between',
    validator: (value: number, min: number, max: number) => ({
      $valid: createNumericValueGuard(value) && value >= min && value <= max,
      min,
      max,
    }),
    message: ({ value, params: [min, max] }) => `${value} must be between ${min} and ${max}`,
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
        `${String(value)} must be one of ${allowedValues.map(String).join(', ')}`,
    })

    return ruleFactory(values, overrides)
  },
}

export function executeSpreadsheetRules<TValue>(params: {
  value: TValue
  rules: SpreadsheetFieldRules<TValue> | undefined
}) {
  if (!params.rules) return []

  return Object.entries(params.rules)
    .flatMap(([ruleKey, rule]) => {
      const result = rule.validate(params.value)
      if (result.$valid) return []

      return [{
        ruleKey,
        level: rule.level,
        code: rule.name ?? ruleKey,
        message: result.$message ?? '',
      }]
    })
}

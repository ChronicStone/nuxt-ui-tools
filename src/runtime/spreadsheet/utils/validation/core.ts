import { useUiToolsLocale } from '#ui-tools/i18n'
import { isBoolean, isFunction } from '#ui-tools/shared/utils/predicate'

import { isNullish } from '../../../shared/utils/predicate'
import type { SpreadsheetRecord, SpreadsheetValue } from '../../types'
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
  SpreadsheetRuleExecutionResult,
  SpreadsheetValidatorResult,
} from '../../types/validation'
import { isSpreadsheetRecord } from '../object'

type SpreadsheetMessageResolver = (context: {
  [key: string]: SpreadsheetValue
  $valid?: boolean
  value: SpreadsheetValue
  params: SpreadsheetValue[]
}) => string

function isSpreadsheetMessageResolver(
  value: SpreadsheetValue,
): value is SpreadsheetMessageResolver {
  return isFunction(value)
}

function isSpreadsheetRuleFactory<TValue>(
  value: SpreadsheetFieldRulesInput<TValue>,
): value is (rules: SpreadsheetRuleBuilder) => SpreadsheetFieldRules<TValue> {
  return isFunction(value)
}

function resolveSpreadsheetMessage(
  value: SpreadsheetValue,
  context: {
    [key: string]: SpreadsheetValue
    $valid?: boolean
    value: SpreadsheetValue
    params: SpreadsheetValue[]
  },
): string {
  if (isSpreadsheetMessageResolver(value)) {
    return value(context)
  }
  return String(value)
}

function isSpreadsheetRuleOverride(
  value: SpreadsheetValue,
): value is SpreadsheetRuleOverrides<SpreadsheetValue, SpreadsheetValue[], SpreadsheetRecord> {
  return isSpreadsheetRecord(value) && 'message' in value
}

function resolveSpreadsheetRuleFactoryInput(input: SpreadsheetValue[]) {
  const lastItem = input.at(-1)
  if (!isSpreadsheetRuleOverride(lastItem)) {
    return {
      overrides: undefined,
      params: input,
    }
  }

  return {
    overrides: lastItem,
    params: input.slice(0, -1),
  }
}

function createSpreadsheetRuleInstance<
  TValue,
  TParams extends unknown[],
  TMeta extends SpreadsheetRecord,
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
    level: 'error',
    name: options.name,
    validate(value): SpreadsheetRuleExecutionResult<SpreadsheetRecord> {
      const messageResolver = options.message
      const rawResult = options.validator(value, ...options.params)

      if (isBoolean(rawResult)) {
        if (rawResult) {
          return {
            $message: null,
            $meta: Object.fromEntries([]),
            $valid: true,
          }
        }

        return {
          $message: resolveSpreadsheetMessage(messageResolver, {
            $valid: false,
            value,
            params: options.params,
          }),
          $meta: Object.fromEntries([]),
          $valid: false,
        }
      }

      const metaEntries = Object.entries(rawResult).filter(([key]) => key !== '$valid')
      const result = {
        $message: null,
        $meta: Object.fromEntries(metaEntries),
        $valid: rawResult.$valid,
      }

      if (result.$valid) {
        return {
          $message: null,
          $meta: result.$meta,
          $valid: true,
        }
      }

      return {
        ...result,
        $message: resolveSpreadsheetMessage(messageResolver, {
          params: options.params,
          value,
          ...rawResult,
        }),
      }
    },
  } satisfies SpreadsheetRule<TValue, TFlags>
}

function createRule<
  TValue,
  TParams extends unknown[],
  TMeta extends SpreadsheetRecord = {},
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
  validator: (
    value: SpreadsheetValue,
    ...params: SpreadsheetValue[]
  ) => SpreadsheetValidatorResult<SpreadsheetRecord>
  message: SpreadsheetLazyMessage<SpreadsheetValue, SpreadsheetValue[], SpreadsheetRecord>
}) {
  return (...input: SpreadsheetValue[]) => {
    const { params, overrides } = resolveSpreadsheetRuleFactoryInput(input)

    return createSpreadsheetRuleInstance({
      flags: options.flags,
      message: overrides?.message ?? options.message,
      name: options.name,
      params,
      validator: options.validator,
    })
  }
}

function validate<TValue, TMeta extends SpreadsheetRecord = {}>(options: {
  name?: string
  validator: (value: TValue) => SpreadsheetValidatorResult<TMeta>
  message: SpreadsheetLazyMessage<TValue, [], TMeta>
}): SpreadsheetRule<TValue>
function validate(options: {
  name?: string
  validator: (value: SpreadsheetValue) => SpreadsheetValidatorResult<SpreadsheetRecord>
  message: SpreadsheetLazyMessage<SpreadsheetValue, [], SpreadsheetRecord>
}) {
  const createInlineRule = createRule({
    message: options.message,
    name: options.name,
    validator: options.validator,
  })

  return createInlineRule()
}

function createNumericValueGuard(value: number) {
  return !Number.isNaN(value) && Number.isFinite(value)
}

function createSpreadsheetRuleBuilder() {
  const { t } = useUiToolsLocale()

  return {
    between: createRule<number, [min: number, max: number], { min: number; max: number }>({
      message: ({ value, params: [min, max] }) =>
        t('spreadsheet.validation.between', { value, min, max }),
      name: 'between',
      validator: (value: number, min: number, max: number) => ({
        $valid: createNumericValueGuard(value) && value >= min && value <= max,
        min,
        max,
      }),
    }),
    max: createRule<number, [max: number], { max: number }>({
      message: ({ value, params: [max] }) => t('spreadsheet.validation.max', { value, max }),
      name: 'max',
      validator: (value: number, max: number) => ({
        $valid: createNumericValueGuard(value) && value <= max,
        max,
      }),
    }),
    maxLength: createRule<string, [max: number], { max: number }>({
      message: ({ value, params: [max] }) =>
        t('spreadsheet.validation.maxLength', { max, length: value.length }),
      name: 'maxLength',
      validator: (value: string, max: number) => ({
        $valid: value.length <= max,
        max,
      }),
    }),
    min: createRule<number, [min: number], { min: number }>({
      message: ({ value, params: [min] }) => t('spreadsheet.validation.min', { value, min }),
      name: 'min',
      validator: (value: number, min: number) => ({
        $valid: createNumericValueGuard(value) && value >= min,
        min,
      }),
    }),
    minLength: createRule<string, [min: number], { min: number }>({
      message: ({ value, params: [min] }) =>
        t('spreadsheet.validation.minLength', { min, length: value.length }),
      name: 'minLength',
      validator: (value: string, min: number) => ({
        $valid: value.length >= min,
        min,
      }),
    }),
    number: createRule<number, [], {}>({
      message: () => t('spreadsheet.validation.number'),
      name: 'number',
      validator: (value: number) => createNumericValueGuard(value),
    }),
    oneOf(values, overrides) {
      const ruleFactory = createRule<
        (typeof values)[number] extends string
          ? string
          : (typeof values)[number] extends number
            ? number
            : (typeof values)[number] extends boolean
              ? boolean
              : (typeof values)[number],
        [typeof values],
        { values: typeof values }
      >({
        message: ({ value, params: [allowedValues] }) =>
          t('spreadsheet.validation.oneOf', {
            value: String(value),
            values: allowedValues.map(String).join(', '),
          }),
        name: 'oneOf',
        validator: (value, allowedValues) => ({
          $valid: allowedValues.includes(value),
          values: allowedValues,
        }),
      })

      return ruleFactory(values, overrides)
    },
    required: createRule<unknown, [], {}, { required: true }>({
      flags: { required: true },
      message: () => t('spreadsheet.validation.required'),
      name: 'required',
      validator: (value: SpreadsheetValue) => !isNullish(value) && value !== '',
    }),
    validate,
  } satisfies SpreadsheetRuleBuilder
}

export const createSheetRule: CreateSpreadsheetRule = createRule

export function resolveSpreadsheetRules<TValue>(
  rules: SpreadsheetFieldRulesInput<TValue> | undefined,
) {
  if (!rules) {
    return []
  }
  if (isSpreadsheetRuleFactory(rules)) {
    return rules(createSpreadsheetRuleBuilder())
  }
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
  if (!rules.length) {
    return []
  }

  return rules.flatMap((rule: SpreadsheetRule<TValue>, index: number) => {
    const result = rule.validate(params.value)
    if (result.$valid) {
      return []
    }

    return [
      {
        code: rule.name ?? `rule.${index}`,
        level: rule.level,
        message: result.$message ?? '',
        ruleKey: rule.name,
      },
    ]
  })
}

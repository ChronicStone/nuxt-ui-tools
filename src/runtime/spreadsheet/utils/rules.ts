import type { UiToolsTranslator } from '#ui-tools/i18n'

import type {
  SpreadsheetIssueLevel,
  SpreadsheetRule,
  SpreadsheetRuleBuilder,
  SpreadsheetRuleMessage,
  SpreadsheetRuleOptions,
} from '../types'
import { isSpreadsheetMessageFunction } from './guards'

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/u

function resolveMessage<TValue>(
  message: SpreadsheetRuleMessage<TValue, unknown>,
  value: TValue,
  ctx: unknown,
) {
  if (isSpreadsheetMessageFunction(message)) return String(message({ ctx, value }))
  return typeof message === 'string' || typeof message === 'number'
    ? String(message)
    : String(message())
}

function createRule<TValue>(params: {
  name: string
  level?: SpreadsheetIssueLevel
  required?: boolean
  message: SpreadsheetRuleMessage<TValue, unknown>
  test: (value: TValue, ctx: unknown) => boolean
}): SpreadsheetRule<TValue> {
  return {
    check(value, context) {
      return params.test(value, context.ctx)
        ? null
        : resolveMessage(params.message, value, context.ctx)
    },
    level: params.level ?? 'error',
    name: params.name,
    required: params.required ?? false,
  }
}

function withOptions<TValue>(
  options: SpreadsheetRuleOptions<TValue, unknown> | undefined,
  fallback: SpreadsheetRuleMessage<TValue, unknown>,
) {
  return { level: options?.level, message: options?.message ?? fallback }
}

function isEmpty(value: unknown) {
  return (
    value === null ||
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  )
}

const pad = (part: number) => String(part).padStart(2, '0')

function todayIso() {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/** The `v` of `rules: (v) => [...]`, with messages from the locale. */
export function createSpreadsheetRuleBuilder(
  t: UiToolsTranslator,
): SpreadsheetRuleBuilder<unknown> {
  return {
    between: (min, max, options) =>
      createRule({
        name: 'between',
        ...withOptions(options, ({ value }) =>
          t('spreadsheet.issues.between', { max, min, value: String(value) }),
        ),
        test: (value: number) => value >= min && value <= max,
      }),
    email: (options) =>
      createRule({
        name: 'email',
        ...withOptions(options, () => t('spreadsheet.issues.email')),
        test: (value: string) => EMAIL.test(value),
      }),
    max: (max, options) =>
      createRule({
        name: 'max',
        ...withOptions(options, ({ value }) =>
          t('spreadsheet.issues.max', { max, value: String(value) }),
        ),
        test: (value: number) => value <= max,
      }),
    maxLength: (max, options) =>
      createRule({
        name: 'maxLength',
        ...withOptions(options, () => t('spreadsheet.issues.maxLength', { max })),
        test: (value: string) => value.length <= max,
      }),
    min: (min, options) =>
      createRule({
        name: 'min',
        ...withOptions(options, ({ value }) =>
          t('spreadsheet.issues.min', { min, value: String(value) }),
        ),
        test: (value: number) => value >= min,
      }),
    minLength: (min, options) =>
      createRule({
        name: 'minLength',
        ...withOptions(options, () => t('spreadsheet.issues.minLength', { min })),
        test: (value: string) => value.length >= min,
      }),
    notFuture: (options) =>
      createRule({
        name: 'notFuture',
        ...withOptions(options, () => t('spreadsheet.issues.notFuture')),
        test: (value: string) => value.slice(0, 10) <= todayIso(),
      }),
    pattern: (pattern, options) =>
      createRule({
        name: 'pattern',
        ...withOptions(options, () => t('spreadsheet.issues.pattern')),
        test: (value: string) => {
          pattern.lastIndex = 0
          return pattern.test(value)
        },
      }),
    required: (options) =>
      createRule({
        name: 'required',
        required: true,
        ...withOptions(options, () => t('spreadsheet.issues.required')),
        test: (value: unknown) => !isEmpty(value),
      }),
    validate: (options) =>
      createRule({
        level: options.level,
        message: options.message,
        name: options.name ?? 'validate',
        test: (value, ctx) => options.validator(value, { ctx }),
      }),
  }
}

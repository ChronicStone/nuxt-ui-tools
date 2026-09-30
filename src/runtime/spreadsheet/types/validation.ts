import type { LazyTextValue } from '#ui-tools/shared/types/utils'

import type { SpreadsheetIssueLevel } from './shared'

/** Message of a failed rule: text, lazy text, or a function of the value and the context. */
export type SpreadsheetRuleMessage<TValue, TContext = unknown> =
  | LazyTextValue
  | ((params: { value: TValue; ctx: TContext }) => string)

export interface SpreadsheetRuleOptions<TValue, TContext = unknown> {
  message?: SpreadsheetRuleMessage<TValue, TContext>
  /** `error` (default) keeps the row out of the import; `warning` and `info` only inform. */
  level?: SpreadsheetIssueLevel
}

/**
 * A rule checks one value. Rules run on non-empty values only, except `required`; on a column
 * with `multiple`, they run on each item.
 */
export interface SpreadsheetRule<TValue> {
  readonly name: string
  readonly level: SpreadsheetIssueLevel
  /** The rule also runs on empty values. */
  readonly required: boolean
  /** Returns the message when the value fails, `null` when it passes. */
  check(value: TValue, context: { ctx: unknown }): string | null
}

export interface SpreadsheetRuleBuilder<TContext> {
  /** The value must not be empty. Prefer the column's `required` flag unless you need a level. */
  required: (options?: SpreadsheetRuleOptions<unknown, TContext>) => SpreadsheetRule<unknown>
  /** A rule of your own. */
  validate: <TValue>(options: {
    name?: string
    validator: (value: TValue, context: { ctx: TContext }) => boolean
    message: SpreadsheetRuleMessage<TValue, TContext>
    level?: SpreadsheetIssueLevel
  }) => SpreadsheetRule<TValue>
  email: (options?: SpreadsheetRuleOptions<string, TContext>) => SpreadsheetRule<string>
  pattern: (
    pattern: RegExp,
    options?: SpreadsheetRuleOptions<string, TContext>,
  ) => SpreadsheetRule<string>
  minLength: (
    min: number,
    options?: SpreadsheetRuleOptions<string, TContext>,
  ) => SpreadsheetRule<string>
  maxLength: (
    max: number,
    options?: SpreadsheetRuleOptions<string, TContext>,
  ) => SpreadsheetRule<string>
  min: (min: number, options?: SpreadsheetRuleOptions<number, TContext>) => SpreadsheetRule<number>
  max: (max: number, options?: SpreadsheetRuleOptions<number, TContext>) => SpreadsheetRule<number>
  between: (
    min: number,
    max: number,
    options?: SpreadsheetRuleOptions<number, TContext>,
  ) => SpreadsheetRule<number>
  /** ISO dates only: the date must not be after today. */
  notFuture: (options?: SpreadsheetRuleOptions<string, TContext>) => SpreadsheetRule<string>
}

/**
 * Rules of a column. The function form also receives the row so far (the columns declared before
 * this one) and the context, for rules that depend on another column.
 */
export type SpreadsheetRulesInput<TValue, TContext, TRow = unknown> =
  | readonly SpreadsheetRule<TValue>[]
  | ((
      rules: SpreadsheetRuleBuilder<TContext>,
      params: { row: TRow; ctx: TContext },
    ) => readonly SpreadsheetRule<TValue>[])

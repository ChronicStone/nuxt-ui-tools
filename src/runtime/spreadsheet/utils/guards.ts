import type {
  SpreadsheetContextCallback,
  SpreadsheetHeaderMatcher,
  SpreadsheetRowCallback,
  SpreadsheetOptionEntry,
  SpreadsheetOptionItem,
  SpreadsheetOptionsResolver,
  SpreadsheetOptionsSource,
  SpreadsheetRule,
  SpreadsheetRuleBuilder,
  SpreadsheetRuleMessage,
  SpreadsheetRecord,
  SpreadsheetRowKey,
} from '../types'

/*
 * Schema options hold values or callbacks. These guards tell them apart where TypeScript's own
 * narrowing cannot, because the callbacks are stored with erased parameter types.
 */

export function isSpreadsheetContextCallback<TResult>(
  value: unknown,
): value is SpreadsheetContextCallback<unknown, TResult> {
  return typeof value === 'function'
}

export function isSpreadsheetRowCallback<TResult>(
  value: unknown,
): value is SpreadsheetRowCallback<unknown, SpreadsheetRecord, TResult> {
  return typeof value === 'function'
}

export function isSpreadsheetRuleList(
  value:
    | readonly SpreadsheetRule<unknown>[]
    | {
        bivarianceHack(
          rules: SpreadsheetRuleBuilder<unknown>,
          params: { row: unknown; ctx: unknown },
        ): readonly SpreadsheetRule<unknown>[]
      }['bivarianceHack'],
): value is readonly SpreadsheetRule<unknown>[] {
  return Array.isArray(value)
}

export function isSpreadsheetMatcherList(
  value: SpreadsheetHeaderMatcher | readonly SpreadsheetHeaderMatcher[],
): value is readonly SpreadsheetHeaderMatcher[] {
  return Array.isArray(value)
}

export function isSpreadsheetOptionsResolver(
  value: SpreadsheetOptionsSource<unknown, SpreadsheetOptionItem, unknown>,
): value is SpreadsheetOptionsResolver<unknown, SpreadsheetOptionItem, unknown> {
  return typeof value === 'function'
}

export function isSpreadsheetOptionList(value: unknown): value is readonly SpreadsheetOptionItem[] {
  return Array.isArray(value)
}

export function isSpreadsheetOptionEntry(
  value: SpreadsheetOptionItem,
): value is SpreadsheetOptionEntry {
  return typeof value === 'object' && value !== null && 'value' in value
}

export function isSpreadsheetMessageFunction<TValue>(
  value: SpreadsheetRuleMessage<TValue, unknown>,
): value is (params: { value: TValue; ctx: unknown }) => string {
  return typeof value === 'function'
}

export function isSpreadsheetKeyTuple(
  value: SpreadsheetRowKey,
): value is readonly (string | number)[] {
  return Array.isArray(value)
}

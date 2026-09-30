import type { QueryFnDefinition } from '#ui-tools/shared/types/query'
import type { RemoteOptionsLoader } from '#ui-tools/shared/types/remote-options'
import type { LazyTextValue, MaybePromise } from '#ui-tools/shared/types/utils'

export type SpreadsheetPrimitiveOption = string | number | boolean

/** An option with a label; `aliases` are the other exact names this value has in files. */
export interface SpreadsheetOptionEntry<TValue = unknown> {
  value: TValue
  label: LazyTextValue
  aliases?: readonly string[]
}

export type SpreadsheetOptionItem = SpreadsheetPrimitiveOption | SpreadsheetOptionEntry

export type InferSpreadsheetOptionValue<TOption> =
  TOption extends SpreadsheetOptionEntry<infer TValue>
    ? TValue
    : TOption extends SpreadsheetPrimitiveOption
      ? TOption
      : never

/**
 * Where a `select` column finds its options. The same sources as a form select:
 *
 * - a list of values or `{ value, label, aliases }`
 * - a TanStack query returning that list
 * - a `defineRemoteOptions` loader, for lists too large to load at once
 * - a function of the context returning a list or a query
 */
export type SpreadsheetOptionsSource<TContext, TOption, TRow = unknown> =
  | readonly TOption[]
  | QueryFnDefinition<readonly TOption[]>
  | RemoteOptionsLoader<TOption>
  | SpreadsheetOptionsResolver<TContext, TOption, TRow>

/**
 * Options from the context, or from the row so far: `({ row }) => scalesOf(row.productId)`. A
 * function reading `row` runs for each distinct set of values it reads and must return a list.
 */
export type SpreadsheetOptionsResolver<TContext, TOption, TRow = unknown> = {
  bivarianceHack(params: {
    ctx: TContext
    row: TRow
  }): readonly TOption[] | QueryFnDefinition<readonly TOption[]>
}['bivarianceHack']

/** Creates an option for a value that isn't in the list. Runs when the user imports. */
export interface SpreadsheetOptionsCreate<TContext, TOption> {
  handler: {
    bivarianceHack(params: { label: string; ctx: TContext }): MaybePromise<TOption>
  }['bivarianceHack']
}

/** Options with a creation handler, as in form option configs. */
export interface SpreadsheetOptionsConfig<TContext, TOption, TRow = unknown> {
  source: SpreadsheetOptionsSource<TContext, TOption, TRow>
  /** Enables `unknown: 'create'`: each new value is created once, before the rows are sent. */
  create?: SpreadsheetOptionsCreate<TContext, TOption>
}

export type SpreadsheetOptionsInput<TContext, TOption, TRow = unknown> =
  | SpreadsheetOptionsSource<TContext, TOption, TRow>
  | SpreadsheetOptionsConfig<TContext, TOption, TRow>

/** An option as the runtime uses it: resolved label and the keys it matches exactly. */
export interface SpreadsheetResolvedOption {
  value: unknown
  label: string
  aliases: readonly string[]
}

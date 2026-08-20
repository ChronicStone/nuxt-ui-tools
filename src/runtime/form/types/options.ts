import type { FormValue } from './'
import type { FormFieldCallback, FormFieldCallbackParams } from './callbacks'
import type { FormQueryOptions } from './context'
import type { FormMaybePromise, FormText } from './utils'

/**
 * Primitive value accepted by option-based fields.
 */
export type FormOptionValue = string | number | boolean

/**
 * Standard option shape used by select, radio, checkbox group, and autocomplete fields.
 */
export interface FormOption<TValue extends FormOptionValue = FormOptionValue> {
  /** Value written to the field when this option is selected. */
  value: TValue
  /** User-facing option label. */
  label?: FormText
  /** Optional option description for richer Nuxt UI item renderers. */
  description?: FormText
  /** Disables the option without removing it from the list. */
  disabled?: boolean
}

/**
 * Authored option item accepted by option-based fields.
 */
export type FormOptionItem<TValue extends FormOptionValue = FormOptionValue> =
  | TValue
  | FormOption<TValue>

/**
 * A static, sync-derived, promise-backed, or TanStack Query-backed option source.
 */
export type FormOptionsSource<TOption, TContext = {}, TDeps = {}, TValue = FormValue> =
  | readonly TOption[]
  | FormQueryOptions<readonly TOption[]>
  | FormFieldCallback<
      readonly TOption[] | Promise<readonly TOption[]> | FormQueryOptions<readonly TOption[]>,
      TContext,
      TDeps,
      TValue,
      TOption
    >

/**
 * Option creation hook for fields that can create a missing option from user input.
 */
export interface FormCreateOptionParams<
  TContext = {},
  TDeps = {},
  TValue = FormValue,
  TOption = FormValue,
> extends FormFieldCallbackParams<TContext, TDeps, TValue, TOption> {
  /** User-entered label that should be converted into a concrete option. */
  label: string
}

export interface FormCreateOption<TOption, TContext = {}, TDeps = {}, TValue = FormValue> {
  /** Label shown by the create affordance. */
  label?: FormText
  /** Selects the newly-created option immediately. Defaults to `true`. */
  selectOnCreation?: boolean
  /** Option field paths to refresh after creation. Supports `$parent` relative paths. */
  revalidateFieldOptions?: readonly string[]
  /** Creates an option and returns it. Return `null` when creation was cancelled. */
  handler: (
    params: FormCreateOptionParams<TContext, TDeps, TValue, TOption>,
  ) => FormMaybePromise<TOption | null>
}

export interface FormOptionsChangeParams<
  TContext = {},
  TDeps = {},
  TValue = FormValue,
  TOption = FormValue,
> extends FormFieldCallbackParams<TContext, TDeps, TValue, TOption> {
  /** Previously resolved normalized options. */
  previousOptions: readonly TOption[]
}

/**
 * Shared option configuration for option-based fields.
 */
export interface FormOptionConfig<TOption, TContext = {}, TDeps = {}, TValue = FormValue> {
  /** Static, sync-derived, promise-backed, or query-backed options. */
  source: FormOptionsSource<TOption, TContext, TDeps, TValue>
  /** Optional creation behavior for missing options. */
  create?: FormCreateOption<TOption, TContext, TDeps, TValue>
  /** Enables the field-level refresh affordance. Matches shared-ui `allowOptionsRefresh`. */
  allowOptionsRefresh?: boolean
  /** Clears current values that no longer exist in resolved options. Defaults to `true`. */
  clearOnInvalid?: boolean
  /** Runs when resolved source options change, excluding locally-created options. */
  onOptionsChange?: (
    options: readonly TOption[],
    params: FormOptionsChangeParams<TContext, TDeps, TValue, TOption>,
  ) => void
  /** Disable the field while its option source has no usable data yet. */
  disableOnLoading?: boolean
}

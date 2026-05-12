import type { FormQueryOptions } from './context'
import type { FormFieldCallback } from './callbacks'
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
export type FormOptionsSource<TOption, TContext = {}, TDeps = {}, TValue = unknown> =
  | readonly TOption[]
  | FormQueryOptions<readonly TOption[]>
  | FormFieldCallback<
      | readonly TOption[]
      | Promise<readonly TOption[]>
      | FormQueryOptions<readonly TOption[]>,
      TContext,
      TDeps,
      TValue,
      TOption
    >

/**
 * Option creation hook for fields that can create a missing option from user input.
 */
export interface FormCreateOption<TOption, TContext = {}, TDeps = {}, TValue = unknown> {
  /** Label shown by the create affordance. */
  label?: FormText
  /** Creates an option and returns it. Return `null` when creation was cancelled. */
  handler: FormFieldCallback<FormMaybePromise<TOption | null>, TContext, TDeps, TValue, TOption>
}

/**
 * Shared option configuration for option-based fields.
 */
export interface FormOptionConfig<TOption, TContext = {}, TDeps = {}, TValue = unknown> {
  /** Static, sync-derived, promise-backed, or query-backed options. */
  source: FormOptionsSource<TOption, TContext, TDeps, TValue>
  /** Optional creation behavior for missing options. */
  create?: FormCreateOption<TOption, TContext, TDeps, TValue>
  /** Disable the field while its option source has no usable data yet. */
  disableOnLoading?: boolean
}

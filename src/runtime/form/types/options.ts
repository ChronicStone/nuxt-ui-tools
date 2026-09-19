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
export type FormOptionsSource<
  TOption,
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
  TValue = FormValue,
> =
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
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
  TValue = FormValue,
  TOption = FormValue,
> extends FormFieldCallbackParams<TContext, TDeps, TValue, TOption> {
  /** User-entered label that should be converted into a concrete option. */
  label: string
}

export interface FormCreateOption<
  TOption,
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
  TValue = FormValue,
> {
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
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
  TValue = FormValue,
  TOption = FormValue,
> extends FormFieldCallbackParams<TContext, TDeps, TValue, TOption> {
  /** Previously resolved normalized options. */
  previousOptions: readonly TOption[]
}

/**
 * Shared option configuration for option-based fields.
 */
export interface FormOptionConfig<
  TOption,
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
  TValue = FormValue,
> {
  /** Local option configs never declare a mode; `mode: 'remote'` selects the remote config. */
  mode?: never
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

/**
 * Page envelope returned by an index-paginated remote option source.
 */
export interface FormRemoteOptionsPage<TOption> {
  options: readonly TOption[]
  hasMore: boolean
}

/**
 * Page envelope returned by a cursor-paginated remote option source.
 */
export interface FormRemoteCursorOptionsPage<TOption> {
  options: readonly TOption[]
  nextCursor: string | null
}

export type FormRemoteOptionsResult<TOption> =
  | FormRemoteOptionsPage<TOption>
  | FormRemoteCursorOptionsPage<TOption>

export interface FormRemoteOptionsRequest<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
  TValue = FormValue,
  TOption = FormValue,
> extends FormFieldCallbackParams<TContext, TDeps, TValue, TOption> {
  /** Current debounced search term. Empty when the menu lists unfiltered options. */
  search: string
  /** Requested page. `cursor` is set for cursor pagination and `index` for page pagination. */
  page: { index: number; cursor: string | null; size: number }
  /** Parent option whose direct children are requested. Undefined for root pages. */
  parent?: NoInfer<TOption>
}

export interface FormRemoteSelectedRequest<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
  TValue = FormValue,
  TOption = FormValue,
> extends FormFieldCallbackParams<TContext, TDeps, TValue, TOption> {
  /** Selected values that are not present in the loaded pages. */
  values: readonly FormOptionValue[]
}

export type FormRemoteSource<TResult> = FormQueryOptions<TResult> | Promise<TResult>

export interface FormRemotePagination {
  type: 'page' | 'cursor'
  /** Page size forwarded to the source. */
  size: number
  /** Distance from the list end that triggers the next page, in pixels or one viewport height. */
  prefetchDistance?: number | 'viewport'
}

export interface FormRemoteSearch {
  /** Debounce applied to typed search terms, in milliseconds. Defaults to 250. */
  debounce?: number
  /** Minimum term length before a search request runs. Defaults to 0. */
  minLength?: number
}

/**
 * Remote option configuration: server-side search, pagination, and selected-value hydration.
 */
export interface FormRemoteOptionConfig<
  TOption,
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
  TValue = FormValue,
> {
  mode: 'remote'
  /** Loads one page of options for the current search, page, and optional parent. */
  source: (
    request: FormRemoteOptionsRequest<TContext, TDeps, TValue, TOption>,
  ) => FormRemoteSource<FormRemoteOptionsResult<TOption>>
  /** Hydrates selected values that the loaded pages do not contain. */
  resolveSelected?: (
    request: FormRemoteSelectedRequest<TContext, TDeps, TValue, TOption>,
  ) => FormRemoteSource<readonly TOption[]>
  pagination: FormRemotePagination
  search?: FormRemoteSearch
  /** Dependency aliases whose changes reset the loaded pages and re-run selected hydration. */
  refreshOn?: readonly string[]
  /** Clears selected values the latest successful selected hydration did not return. Defaults to `false`. */
  clearOnInvalid?: boolean
  /** Optional creation behavior for missing options. */
  create?: FormCreateOption<TOption, TContext, TDeps, TValue>
  /** Enables the field-level refresh affordance. */
  allowOptionsRefresh?: boolean
  /** Disable the field while its option source has no usable data yet. */
  disableOnLoading?: boolean
}

export type FormAnyOptionConfig<
  TOption,
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
  TValue = FormValue,
> =
  | FormOptionConfig<TOption, TContext, TDeps, TValue>
  | FormRemoteOptionConfig<TOption, TContext, TDeps, TValue>
  | FormOptionsSource<TOption, TContext, TDeps, TValue>

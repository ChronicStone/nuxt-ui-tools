import type { QueryKey } from '@tanstack/vue-query'
import type { VNodeChild } from 'vue'

import type {
  RemoteOptionsLoader,
  RemoteOptionsPageRequest,
  RemoteOptionsPagination,
  RemoteOptionsResult,
  RemoteOptionsSearch,
} from '../../shared/types/remote-options'
import type { FormValue } from './'
import type { FormDependencies, FormFieldCallback, FormFieldCallbackParams } from './callbacks'
import type { FormQueryOptions } from './context'
import type { FormMaybePromise, FormText } from './utils'

/** Colors a `chip` option dot can take. */
export type FormOptionChipColor =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'info'
  | 'warning'
  | 'error'
  | 'neutral'

/**
 * Picture drawn before an option label, passed to the Nuxt UI avatar. Use it for people and
 * organisations: `text` is the fallback shown when `src` is missing or fails to load.
 */
export interface FormOptionAvatar {
  /** Image URL. */
  src?: string
  /** Accessible description of the image. Defaults to the option label. */
  alt?: string
  /** Fallback text shown when there is no image, such as initials. */
  text?: string
}

/** Colored dot drawn before an option label, for statuses and categories. */
export interface FormOptionChip {
  /** Color of the dot. Defaults to `primary`. */
  color?: FormOptionChipColor
}

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
  /** Iconify icon drawn before the label. */
  icon?: string
  /**
   * Picture drawn before the label, for people and organisations. Only one leading visual shows,
   * in the order `icon`, `avatar`, `chip`.
   */
  avatar?: FormOptionAvatar
  /**
   * Colored dot drawn before the label, for statuses and categories. Only one leading visual
   * shows, in the order `icon`, `avatar`, `chip`.
   */
  chip?: FormOptionChip
  /**
   * Secondary text at the end of the option, such as a code (`EUR`) or a count. It also follows
   * the label in the closed control of a select.
   */
  suffix?: FormText
}

/**
 * Option as the engine resolved it: the shared shape every option-based field renders from,
 * whatever the authored option looked like (a primitive, a record, or a record with its own keys).
 */
export interface ResolvedFormOption {
  value: FormOptionValue
  label: string
  description?: string
  disabled?: boolean
  icon?: string
  avatar?: FormOptionAvatar
  chip?: FormOptionChip
  /** Secondary text at the end of the option, already resolved. */
  suffix?: string
  /**
   * The option exactly as the schema or the source gave it, so render functions can read any
   * data it carries. A primitive option is the primitive itself. The load-more row has none.
   */
  item?: FormOptionItem
  /** Heading the option is listed under, for the fields that group their options. */
  group?: string
  children?: readonly ResolvedFormOption[]
  /** True when the option has children that load on demand. */
  lazy?: boolean
}

/** What a field hands `renderOption` for each option it lists. */
export interface FormOptionRenderContext<TOption = FormOptionItem> {
  /** The resolved option: label, description, icon, avatar, chip and suffix as the field reads them. */
  option: ResolvedFormOption
  /** The option exactly as authored or returned by the source, with any custom data it carries. */
  item: TOption
  /** True when the option is part of the field value. */
  selected: boolean
  /** True when the option cannot be chosen. */
  disabled: boolean
}

/** What a field hands `renderValue` for the option it shows in the closed control. */
export interface FormOptionValueRenderContext<TOption = FormOptionItem> {
  /** The resolved option: label, description, icon, avatar, chip and suffix as the field reads them. */
  option: ResolvedFormOption
  /** The option exactly as authored or returned by the source, with any custom data it carries. */
  item: TOption
}

/**
 * Content render functions of the option-based fields, declared on the field next to its
 * `options`. A field typed with its option type (`FormSelectField<Ctx, Deps, Value, Currency>`)
 * hands them that type. In an inline schema the option type is not inferred into the callback, so
 * annotate the parameter with the context of your option type to read its custom data.
 *
 * @example
 * ```ts
 * interface Currency extends FormOption<'EUR' | 'USD'> {
 *   symbol: string
 * }
 *
 * // Each currency is listed as its symbol, then its name.
 * {
 *   type: 'select',
 *   key: 'currency',
 *   options: [{ value: 'EUR', label: 'Euro', symbol: '€' }],
 *   renderOption: ({ item, option }: FormOptionRenderContext<Currency>) =>
 *     h('span', [item.symbol, ' ', option.label]),
 * }
 * ```
 */
export interface FormOptionRenderers<TOption = FormOptionItem> {
  /**
   * Replaces the content of each option in the list: label, description, leading visual and
   * suffix. The control keeps its own selection indicator and keyboard behavior.
   */
  renderOption?(context: FormOptionRenderContext<TOption>): VNodeChild
}

/** Renderers of the fields that show the chosen option in a closed control. */
export interface FormOptionValueRenderers<
  TOption = FormOptionItem,
> extends FormOptionRenderers<TOption> {
  /**
   * Replaces how the chosen option reads in the closed control, in single selection. Multiple
   * selection keeps its comma-separated labels.
   */
  renderValue?(context: FormOptionValueRenderContext<TOption>): VNodeChild
}

/**
 * Option grouping of the fields that list options under headings, declared on the field next to
 * its `options`.
 *
 * @example
 * ```ts
 * // Rows from the API, each with a `section` to list the options under.
 * { type: 'select', options: () => queryOptions({ queryKey: ['plans'], queryFn: fetchPlans }), groupKey: 'section' }
 * ```
 */
export interface FormOptionGrouping {
  /**
   * Property of the options that holds the heading they are listed under. Options written inline
   * in the schema group by their `group` without it. The records a function, a promise or a query
   * returns group only when this names the property, so records that already carry a `group` for
   * another purpose are never regrouped by surprise. `false` lists every option together, even
   * inline options that carry a `group`.
   */
  groupKey?: string | false
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
  TDeps = FormDependencies,
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
  TDeps = FormDependencies,
  TValue = FormValue,
  TOption = FormValue,
> extends FormFieldCallbackParams<TContext, TDeps, TValue, TOption> {
  /**
   * User-entered label that should be converted into a concrete option. Empty when the explicit
   * create action runs without a search term, such as a creator that opens its own form.
   */
  label: string
}

export interface FormCreateOption<
  TOption,
  TContext = NonNullable<unknown>,
  TDeps = FormDependencies,
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
  TDeps = FormDependencies,
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
  TDeps = FormDependencies,
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
  /**
   * Clears current values that no longer exist in resolved options. Defaults to `true`, which
   * shorthand sources (arrays, functions, promises, query options) always use. Values are kept
   * while the source is pending or failed.
   */
  clearOnInvalid?: boolean
  /** Runs when resolved source options change, excluding locally-created options. */
  onOptionsChange?: (
    options: readonly TOption[],
    params: FormOptionsChangeParams<TContext, TDeps, TValue, TOption>,
  ) => void
  /** Disable the field while its option source has no usable data yet. */
  disableOnLoading?: boolean
}

export interface FormRemoteOptionsRequest<
  TContext = NonNullable<unknown>,
  TDeps = FormDependencies,
  TValue = FormValue,
  TOption = FormValue,
> extends FormFieldCallbackParams<TContext, TDeps, TValue, TOption> {
  /** Current debounced search term. Empty when the menu lists unfiltered options. */
  search: string
  /** Requested page. `cursor` is set for cursor pagination and `index` for page pagination. */
  page: RemoteOptionsPageRequest
  /** Parent option whose direct children are requested. Undefined for root pages. */
  parent?: NoInfer<TOption>
}

export interface FormRemoteSelectedRequest<
  TContext = NonNullable<unknown>,
  TDeps = FormDependencies,
  TValue = FormValue,
  TOption = FormValue,
> extends FormFieldCallbackParams<TContext, TDeps, TValue, TOption> {
  /** Selected values that are not present in the loaded pages. */
  values: readonly FormOptionValue[]
}

export type FormRemoteSource<TResult> = FormQueryOptions<TResult> | Promise<TResult>

/**
 * Remote option configuration: server-side search, pagination, and selected-value hydration.
 */
export interface FormRemoteOptionConfig<
  TOption,
  TContext = NonNullable<unknown>,
  TDeps = FormDependencies,
  TValue = FormValue,
> {
  mode: 'remote'
  /**
   * Loads one page of options for the current search, page, and optional parent. Named apart from
   * a local config's `source` so an object-form local source keeps typed callback parameters.
   */
  load: (
    request: FormRemoteOptionsRequest<TContext, TDeps, TValue, TOption>,
  ) => FormRemoteSource<RemoteOptionsResult<TOption>>
  /** Hydrates selected values that the loaded pages do not contain. */
  resolveSelected?: (
    request: FormRemoteSelectedRequest<TContext, TDeps, TValue, TOption>,
  ) => FormRemoteSource<readonly TOption[]>
  pagination: RemoteOptionsPagination
  search?: RemoteOptionsSearch
  /** Identity of the first page, so reusable loaders follow external scope changes. */
  queryKeyFor?: (request: { search: string; page: RemoteOptionsPageRequest }) => QueryKey
  /** Identity of selected labels, including scope absent from the page endpoint. */
  selectedQueryKeyFor?: (request: { values: readonly FormOptionValue[] }) => QueryKey
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

/** Reuses one remote loader while keeping field-specific refresh and creation behavior local. */
export interface FormRemoteLoaderOptionConfig<
  TOption,
  TContext = NonNullable<unknown>,
  TDeps = FormDependencies,
  TValue = FormValue,
> extends Omit<
  FormRemoteOptionConfig<TOption, TContext, TDeps, TValue>,
  'load' | 'resolveSelected' | 'pagination' | 'search' | 'queryKeyFor' | 'selectedQueryKeyFor'
> {
  loader: RemoteOptionsLoader<TOption>
  load?: never
  resolveSelected?: never
  pagination?: never
  search?: never
  queryKeyFor?: never
  selectedQueryKeyFor?: never
}

export type FormAnyOptionConfig<
  TOption,
  TContext = NonNullable<unknown>,
  TDeps = FormDependencies,
  TValue = FormValue,
> =
  | FormOptionConfig<TOption, TContext, TDeps, TValue>
  | FormRemoteOptionConfig<TOption, TContext, TDeps, TValue>
  | FormRemoteLoaderOptionConfig<TOption, TContext, TDeps, TValue>
  | FormOptionsSource<TOption, TContext, TDeps, TValue>

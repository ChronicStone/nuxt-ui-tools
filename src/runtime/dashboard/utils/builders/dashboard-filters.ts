import type { QueryCodec, StaticQueryStateOptions } from '../../../query-state'
import { isFunction } from '../../../shared/utils/predicate'
import type {
  DashboardComparison,
  DashboardDateRange,
  DashboardOption,
  DashboardOptionValue,
  DashboardFilterDefault,
  DashboardFilterDefinition,
  DashboardFilterFormatOptions,
  DashboardFilterItems,
  DashboardFilterKind,
  DashboardFilterLike,
  DashboardFilterListOptions,
  DashboardFilterMultipleOptions,
  DashboardFilterOptions,
  DashboardFilterPreset,
  DashboardFilterPresets,
  DashboardRemoteOptionsConfig,
  DashboardRuntimeFilter,
} from '../../types'
import {
  createListCodec,
  createOptionValueCodec,
  createSafeCodec,
  dateRangeCodec,
  localDateCodec,
  optionalBooleanCodec,
  optionalNumberCodec,
  optionalStringCodec,
} from '../codecs'

/** Options of a single-value filter whose values carry no label of their own. */
type SingleOptions<TValue> = DashboardFilterOptions<DashboardFilterDefault<TValue>, TValue> &
  DashboardFilterFormatOptions<TValue> & { multiple?: false }

/** Options of a `multiple` filter: the value is an always-defined array. */
type MultipleOptions<TItem> = DashboardFilterOptions<
  DashboardFilterDefault<readonly TItem[]>,
  TItem[]
> &
  DashboardFilterMultipleOptions & { multiple: true }

/** Options of a filter holding one value, or a list with `multiple: true`. */
type FilterOptions<TItem> =
  | SingleOptions<TItem>
  | (MultipleOptions<TItem> & DashboardFilterFormatOptions<TItem>)

/** The same, for filters picked from a list. */
type ListFilterOptions<TItem> = FilterOptions<TItem> & DashboardFilterListOptions

/** Options of filters whose items carry their own labels (`f.options`, `f.remote`). */
type LabeledFilterOptions<TItem> = (
  | (DashboardFilterOptions<DashboardFilterDefault<TItem>, TItem> & { multiple?: false })
  | MultipleOptions<TItem>
) &
  DashboardFilterListOptions

/**
 * Value of a filter declared with `TOptions`: an array with `multiple: true`; otherwise defined once
 * a default is declared (a value, or a getter that never returns `undefined`).
 *
 * Builders infer the whole options object rather than overloading on its shape: every overload
 * would contextually type a default or presets getter on its own, and the first one tried fixes
 * the getter's result (widening `() => 2026` to `() => number`).
 */
type FilterValue<TItem, TOptions> = TOptions extends { multiple: true }
  ? TItem[]
  : TOptions extends { defaultValue: infer TDefault }
    ? undefined extends (TDefault extends () => infer TResult ? TResult : TDefault)
      ? TItem | undefined
      : TItem
    : TItem | undefined

type AnyFilterOptions = DashboardFilterOptions<unknown> &
  DashboardFilterListOptions &
  DashboardFilterMultipleOptions & {
    format?: (value: never) => string
    multiple?: boolean
  }

function defineFilter(
  kind: DashboardFilterKind,
  codec: StaticQueryStateOptions['codec'],
  options: AnyFilterOptions & {
    items?: DashboardFilterItems
    remote?: DashboardRemoteOptionsConfig
  } = {},
): DashboardRuntimeFilter {
  const multiple = options.multiple === true
  const { defaultValue, items, presets } = options
  const unset = multiple ? [] : undefined
  const resolveDefault = isFunction(defaultValue)
    ? () => defaultValue() ?? unset
    : () => defaultValue ?? unset
  // Reads the default until the dashboard binds the filter to its state.
  let read: () => unknown = resolveDefault
  return {
    bind(next) {
      read = next
    },
    codec: multiple ? createListCodec(codec) : codec,
    columns: options.columns,
    defaultValue: isFunction(defaultValue) ? unset : (defaultValue ?? unset),
    enabled: options.enabled,
    format: options.format,
    headless: options.headless === true,
    historyMode: options.historyMode,
    // Fixed lists become getters too, so the option list reads every list the same way.
    items: items === undefined || isItemsGetter(items) ? items : () => items,
    kind,
    label: options.label,
    max: options.max,
    multiple,
    omitDefault: options.omitDefault,
    placeholder: options.placeholder,
    presets: presets === undefined || isPresetsGetter(presets) ? presets : () => presets,
    remote: options.remote,
    resolveDefault,
    searchable: options.searchable,
    sync: options.sync,
    urlKey: options.urlKey,
    get value() {
      return read()
    },
  }
}

function isItemsGetter(items: DashboardFilterItems): items is () => readonly DashboardOption[] {
  return !Array.isArray(items)
}

function isPresetsGetter(
  presets: DashboardFilterPresets<unknown>,
): presets is () => readonly DashboardFilterPreset<unknown>[] {
  return !Array.isArray(presets)
}

function stringFilter(): DashboardFilterDefinition<string | undefined> & { readonly kind: 'string' }
function stringFilter<const TOptions extends FilterOptions<string>>(
  options: TOptions,
): DashboardFilterDefinition<FilterValue<string, TOptions>> & { readonly kind: 'string' }
function stringFilter(options?: AnyFilterOptions): DashboardFilterLike {
  return defineFilter('string', optionalStringCodec, options)
}

function numberFilter(): DashboardFilterDefinition<number | undefined> & { readonly kind: 'number' }
function numberFilter<const TOptions extends FilterOptions<number>>(
  options: TOptions,
): DashboardFilterDefinition<FilterValue<number, TOptions>> & { readonly kind: 'number' }
function numberFilter(options?: AnyFilterOptions): DashboardFilterLike {
  return defineFilter('number', optionalNumberCodec, options)
}

/** Items of `f.boolean()`. Labels come from `format`, else the localized "Yes" / "No". */
const BOOLEAN_ITEMS: readonly DashboardOption<boolean>[] = [
  { label: 'true', value: true },
  { label: 'false', value: false },
]

function booleanFilter(): DashboardFilterDefinition<boolean | undefined> & {
  readonly kind: 'boolean'
}
function booleanFilter<const TOptions extends SingleOptions<boolean>>(
  options: TOptions,
): DashboardFilterDefinition<FilterValue<boolean, TOptions>> & { readonly kind: 'boolean' }
function booleanFilter(options?: AnyFilterOptions): DashboardFilterLike {
  return defineFilter('boolean', optionalBooleanCodec, { ...options, items: BOOLEAN_ITEMS })
}

function dateFilter(): DashboardFilterDefinition<Date | undefined> & { readonly kind: 'date' }
function dateFilter<const TOptions extends SingleOptions<Date>>(
  options: TOptions,
): DashboardFilterDefinition<FilterValue<Date, TOptions>> & { readonly kind: 'date' }
function dateFilter(options?: AnyFilterOptions): DashboardFilterLike {
  return defineFilter('date', localDateCodec, options)
}

function dateRangeFilter(): DashboardFilterDefinition<DashboardDateRange | undefined> & {
  readonly kind: 'dateRange'
}
function dateRangeFilter<const TOptions extends SingleOptions<DashboardDateRange>>(
  options: TOptions,
): DashboardFilterDefinition<FilterValue<DashboardDateRange, TOptions>> & {
  readonly kind: 'dateRange'
}
function dateRangeFilter(options?: AnyFilterOptions): DashboardFilterLike {
  return defineFilter('dateRange', dateRangeCodec, options)
}

function enumFilter<const TValues extends readonly DashboardOptionValue[]>(
  values: TValues,
): DashboardFilterDefinition<TValues[number] | undefined> & { readonly kind: 'enum' }
function enumFilter<
  const TValues extends readonly DashboardOptionValue[],
  const TOptions extends ListFilterOptions<TValues[number]>,
>(
  values: TValues,
  options: TOptions,
): DashboardFilterDefinition<FilterValue<TValues[number], TOptions>> & { readonly kind: 'enum' }
function enumFilter(
  values: readonly DashboardOptionValue[],
  options?: AnyFilterOptions,
): DashboardFilterLike {
  const items = values.map((value) => ({ label: String(value), value }))
  return defineFilter('enum', createOptionValueCodec(values), { ...options, items })
}

function optionsFilter<const TItems extends readonly DashboardOption[]>(
  items: TItems,
): DashboardFilterDefinition<TItems[number]['value'] | undefined> & { readonly kind: 'options' }
function optionsFilter<
  const TItems extends readonly DashboardOption[],
  const TOptions extends LabeledFilterOptions<TItems[number]['value']>,
>(
  items: TItems,
  options: TOptions,
): DashboardFilterDefinition<FilterValue<TItems[number]['value'], TOptions>> & {
  readonly kind: 'options'
}
function optionsFilter(
  items: () => readonly DashboardOption<string>[],
): DashboardFilterDefinition<string | undefined> & { readonly kind: 'options' }
function optionsFilter<const TOptions extends LabeledFilterOptions<string>>(
  items: () => readonly DashboardOption<string>[],
  options: TOptions,
): DashboardFilterDefinition<FilterValue<string, TOptions>> & { readonly kind: 'options' }
function optionsFilter(
  items: DashboardFilterItems,
  options?: AnyFilterOptions,
): DashboardFilterLike {
  // Items read from data are only known once it loads: their values are ids kept as strings.
  const codec = isItemsGetter(items)
    ? optionalStringCodec
    : createOptionValueCodec(items.map((item) => item.value))
  return defineFilter('options', codec, { ...options, items })
}

type RemoteSource = DashboardRemoteOptionsConfig

function remoteFilter<const TConfig extends RemoteSource & LabeledFilterOptions<string>>(
  config: TConfig,
): DashboardFilterDefinition<FilterValue<string, TConfig>> & { readonly kind: 'remote' }
function remoteFilter<const TOptions extends LabeledFilterOptions<string>>(
  source: RemoteSource,
  options: TOptions,
): DashboardFilterDefinition<FilterValue<string, TOptions>> & { readonly kind: 'remote' }
function remoteFilter(
  config: RemoteSource & AnyFilterOptions,
  extra?: AnyFilterOptions,
): DashboardFilterLike {
  const { load, pagination, queryKey, resolveSelected, search, ...options } = config
  const remote = { load, pagination, queryKey, resolveSelected, search }
  return defineFilter('remote', optionalStringCodec, {
    searchable: true,
    ...options,
    ...extra,
    remote,
  })
}

/** Values of `f.comparison`, in menu order. */
export const DASHBOARD_COMPARISONS = [
  'previous',
  'year',
  'none',
] as const satisfies readonly DashboardComparison[]

function comparisonFilter(): DashboardFilterDefinition<DashboardComparison | undefined> & {
  readonly kind: 'comparison'
}
function comparisonFilter<
  const TOptions extends DashboardFilterOptions<
    DashboardFilterDefault<DashboardComparison>,
    DashboardComparison
  >,
>(
  options: TOptions,
): DashboardFilterDefinition<FilterValue<DashboardComparison, TOptions>> & {
  readonly kind: 'comparison'
}
function comparisonFilter(options?: AnyFilterOptions): DashboardFilterLike {
  // Labels are localized by the control; these are fallbacks.
  const items = DASHBOARD_COMPARISONS.map((value) => ({ label: value, value }))
  return defineFilter('comparison', createOptionValueCodec(DASHBOARD_COMPARISONS), {
    ...options,
    items,
  })
}

function customFilter<TValue>(
  codec: QueryCodec<TValue>,
): DashboardFilterDefinition<TValue | undefined> & { readonly kind: 'custom' }
function customFilter<TValue, const TOptions extends SingleOptions<TValue>>(
  codec: QueryCodec<TValue>,
  options: TOptions,
): DashboardFilterDefinition<FilterValue<TValue, TOptions>> & { readonly kind: 'custom' }
function customFilter(
  codec: StaticQueryStateOptions['codec'],
  options?: AnyFilterOptions,
): DashboardFilterLike {
  return defineFilter('custom', createSafeCodec(codec), options)
}

/**
 * The `f` builder handed to every `filters` callback. Each method declares one typed filter: its
 * value is `dashboard.filters.<key>`, and its control `dashboard.controls.<key>` drives it from any
 * component.
 *
 * Every filter accepts `defaultValue` (a value or a getter; it narrows away `undefined`), `sync`
 * (URL, memory, or an external store), `urlKey`, `omitDefault`, `historyMode`, `presets`, and the
 * filter presentation: `label`, `placeholder`, `headless`. Filters picked from a list also accept
 * `columns` and `searchable`; `multiple: true` turns the value into an always-defined array, capped
 * by `max`.
 */
export const dashboardFilterBuilder = {
  /** `true` / `false`. Its filter lists both, labeled by `format` or the localized Yes / No. */
  boolean: booleanFilter,
  /**
   * Comparison period: `'previous'`, `'year'`, or `'none'`. Its filter carries localized labels;
   * `resolveDashboardComparisonRange(range, mode)` turns it into the range to fetch.
   */
  comparison: comparisonFilter,
  custom: customFilter,
  date: dateFilter,
  /** Inclusive date range, serialized as `YYYY-MM-DD..YYYY-MM-DD`. */
  dateRange: dateRangeFilter,
  /** Value(s) from a literal list, e.g. `f.enum([2024, 2025, 2026], { defaultValue: 2026 })`. */
  enum: enumFilter,
  /** Number, or `number[]` with `multiple: true`. */
  number: numberFilter,
  /**
   * Value(s) from labeled items: `{ value, label, icon?, avatar?, hint?, description? }`. Pass a
   * getter to read the items from data, e.g. `f.options(() => products.data?.map(toOption) ?? [])`;
   * their values are strings.
   */
  options: optionsFilter,
  /**
   * Id(s) picked from a remote, searchable, paginated option source:
   * `f.remote(remoteTableOptions(query, { ... }), { label: 'Account' })`.
   */
  remote: remoteFilter,
  /** String, or `string[]` with `multiple: true`. */
  string: stringFilter,
}

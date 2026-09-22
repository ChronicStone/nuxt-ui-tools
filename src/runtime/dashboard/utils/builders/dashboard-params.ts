import type { QueryCodec, StaticQueryStateOptions } from '../../../query-state'
import { isFunction } from '../../../shared/utils/predicate'
import type {
  DashboardComparison,
  DashboardDateRange,
  DashboardOption,
  DashboardOptionValue,
  DashboardParamDefault,
  DashboardParamDefinition,
  DashboardParamFormatOptions,
  DashboardParamItems,
  DashboardParamKind,
  DashboardParamLike,
  DashboardParamListOptions,
  DashboardParamMultipleOptions,
  DashboardParamOptions,
  DashboardParamPreset,
  DashboardParamPresets,
  DashboardRemoteOptionsConfig,
  DashboardRuntimeParam,
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
} from '../params/codecs'

/** Options of a single-value param whose values carry no label of their own. */
type SingleOptions<TValue> = DashboardParamOptions<DashboardParamDefault<TValue>, TValue> &
  DashboardParamFormatOptions<TValue> & { multiple?: false }

/** Options of a `multiple` param: the value is an always-defined array. */
type MultipleOptions<TItem> = DashboardParamOptions<
  DashboardParamDefault<readonly TItem[]>,
  TItem[]
> &
  DashboardParamMultipleOptions & { multiple: true }

/** Options of a param holding one value, or a list with `multiple: true`. */
type ParamOptions<TItem> =
  | SingleOptions<TItem>
  | (MultipleOptions<TItem> & DashboardParamFormatOptions<TItem>)

/** The same, for params picked from a list. */
type ListParamOptions<TItem> = ParamOptions<TItem> & DashboardParamListOptions

/** Options of params whose items carry their own labels (`p.options`, `p.remote`). */
type LabeledParamOptions<TItem> = (
  | (DashboardParamOptions<DashboardParamDefault<TItem>, TItem> & { multiple?: false })
  | MultipleOptions<TItem>
) &
  DashboardParamListOptions

/**
 * Value of a param declared with `TOptions`: an array with `multiple: true`; otherwise defined once
 * a default is declared (a value, or a getter that never returns `undefined`).
 *
 * Builders infer the whole options object rather than overloading on its shape: every overload
 * would contextually type a default or presets getter on its own, and the first one tried fixes
 * the getter's result (widening `() => 2026` to `() => number`).
 */
type ParamValue<TItem, TOptions> = TOptions extends { multiple: true }
  ? TItem[]
  : TOptions extends { defaultValue: infer TDefault }
    ? undefined extends (TDefault extends () => infer TResult ? TResult : TDefault)
      ? TItem | undefined
      : TItem
    : TItem | undefined

type AnyParamOptions = DashboardParamOptions<unknown> &
  DashboardParamListOptions &
  DashboardParamMultipleOptions & {
    format?: (value: never) => string
    multiple?: boolean
  }

function defineParam(
  kind: DashboardParamKind,
  codec: StaticQueryStateOptions['codec'],
  options: AnyParamOptions & {
    items?: DashboardParamItems
    remote?: DashboardRemoteOptionsConfig
  } = {},
): DashboardRuntimeParam {
  const multiple = options.multiple === true
  const { defaultValue, items, presets } = options
  const unset = multiple ? [] : undefined
  return {
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
    resolveDefault: isFunction(defaultValue)
      ? () => defaultValue() ?? unset
      : () => defaultValue ?? unset,
    searchable: options.searchable,
    sync: options.sync,
    urlKey: options.urlKey,
  }
}

function isItemsGetter(items: DashboardParamItems): items is () => readonly DashboardOption[] {
  return !Array.isArray(items)
}

function isPresetsGetter(
  presets: DashboardParamPresets<unknown>,
): presets is () => readonly DashboardParamPreset<unknown>[] {
  return !Array.isArray(presets)
}

function stringParam(): DashboardParamDefinition<string | undefined> & { readonly kind: 'string' }
function stringParam<const TOptions extends ParamOptions<string>>(
  options: TOptions,
): DashboardParamDefinition<ParamValue<string, TOptions>> & { readonly kind: 'string' }
function stringParam(options?: AnyParamOptions): DashboardParamLike {
  return defineParam('string', optionalStringCodec, options)
}

function numberParam(): DashboardParamDefinition<number | undefined> & { readonly kind: 'number' }
function numberParam<const TOptions extends ParamOptions<number>>(
  options: TOptions,
): DashboardParamDefinition<ParamValue<number, TOptions>> & { readonly kind: 'number' }
function numberParam(options?: AnyParamOptions): DashboardParamLike {
  return defineParam('number', optionalNumberCodec, options)
}

/** Items of `p.boolean()`. Labels come from `format`, else the localized "Yes" / "No". */
const BOOLEAN_ITEMS: readonly DashboardOption<boolean>[] = [
  { label: 'true', value: true },
  { label: 'false', value: false },
]

function booleanParam(): DashboardParamDefinition<boolean | undefined> & {
  readonly kind: 'boolean'
}
function booleanParam<const TOptions extends SingleOptions<boolean>>(
  options: TOptions,
): DashboardParamDefinition<ParamValue<boolean, TOptions>> & { readonly kind: 'boolean' }
function booleanParam(options?: AnyParamOptions): DashboardParamLike {
  return defineParam('boolean', optionalBooleanCodec, { ...options, items: BOOLEAN_ITEMS })
}

function dateParam(): DashboardParamDefinition<Date | undefined> & { readonly kind: 'date' }
function dateParam<const TOptions extends SingleOptions<Date>>(
  options: TOptions,
): DashboardParamDefinition<ParamValue<Date, TOptions>> & { readonly kind: 'date' }
function dateParam(options?: AnyParamOptions): DashboardParamLike {
  return defineParam('date', localDateCodec, options)
}

function dateRangeParam(): DashboardParamDefinition<DashboardDateRange | undefined> & {
  readonly kind: 'dateRange'
}
function dateRangeParam<const TOptions extends SingleOptions<DashboardDateRange>>(
  options: TOptions,
): DashboardParamDefinition<ParamValue<DashboardDateRange, TOptions>> & {
  readonly kind: 'dateRange'
}
function dateRangeParam(options?: AnyParamOptions): DashboardParamLike {
  return defineParam('dateRange', dateRangeCodec, options)
}

function enumParam<const TValues extends readonly DashboardOptionValue[]>(
  values: TValues,
): DashboardParamDefinition<TValues[number] | undefined> & { readonly kind: 'enum' }
function enumParam<
  const TValues extends readonly DashboardOptionValue[],
  const TOptions extends ListParamOptions<TValues[number]>,
>(
  values: TValues,
  options: TOptions,
): DashboardParamDefinition<ParamValue<TValues[number], TOptions>> & { readonly kind: 'enum' }
function enumParam(
  values: readonly DashboardOptionValue[],
  options?: AnyParamOptions,
): DashboardParamLike {
  const items = values.map((value) => ({ label: String(value), value }))
  return defineParam('enum', createOptionValueCodec(values), { ...options, items })
}

function optionsParam<const TItems extends readonly DashboardOption[]>(
  items: TItems,
): DashboardParamDefinition<TItems[number]['value'] | undefined> & { readonly kind: 'options' }
function optionsParam<
  const TItems extends readonly DashboardOption[],
  const TOptions extends LabeledParamOptions<TItems[number]['value']>,
>(
  items: TItems,
  options: TOptions,
): DashboardParamDefinition<ParamValue<TItems[number]['value'], TOptions>> & {
  readonly kind: 'options'
}
function optionsParam(
  items: () => readonly DashboardOption<string>[],
): DashboardParamDefinition<string | undefined> & { readonly kind: 'options' }
function optionsParam<const TOptions extends LabeledParamOptions<string>>(
  items: () => readonly DashboardOption<string>[],
  options: TOptions,
): DashboardParamDefinition<ParamValue<string, TOptions>> & { readonly kind: 'options' }
function optionsParam(items: DashboardParamItems, options?: AnyParamOptions): DashboardParamLike {
  // Items read from data are only known once it loads: their values are ids kept as strings.
  const codec = isItemsGetter(items)
    ? optionalStringCodec
    : createOptionValueCodec(items.map((item) => item.value))
  return defineParam('options', codec, { ...options, items })
}

type RemoteSource = DashboardRemoteOptionsConfig

function remoteParam<const TConfig extends RemoteSource & LabeledParamOptions<string>>(
  config: TConfig,
): DashboardParamDefinition<ParamValue<string, TConfig>> & { readonly kind: 'remote' }
function remoteParam<const TOptions extends LabeledParamOptions<string>>(
  source: RemoteSource,
  options: TOptions,
): DashboardParamDefinition<ParamValue<string, TOptions>> & { readonly kind: 'remote' }
function remoteParam(
  config: RemoteSource & AnyParamOptions,
  extra?: AnyParamOptions,
): DashboardParamLike {
  const { load, pagination, queryKey, resolveSelected, search, ...options } = config
  const remote = { load, pagination, queryKey, resolveSelected, search }
  return defineParam('remote', optionalStringCodec, {
    searchable: true,
    ...options,
    ...extra,
    remote,
  })
}

/** Values of `p.comparison`, in menu order. */
export const DASHBOARD_COMPARISONS = [
  'previous',
  'year',
  'none',
] as const satisfies readonly DashboardComparison[]

function comparisonParam(): DashboardParamDefinition<DashboardComparison | undefined> & {
  readonly kind: 'comparison'
}
function comparisonParam<
  const TOptions extends DashboardParamOptions<
    DashboardParamDefault<DashboardComparison>,
    DashboardComparison
  >,
>(
  options: TOptions,
): DashboardParamDefinition<ParamValue<DashboardComparison, TOptions>> & {
  readonly kind: 'comparison'
}
function comparisonParam(options?: AnyParamOptions): DashboardParamLike {
  // Labels are localized by the filter handle; these are fallbacks.
  const items = DASHBOARD_COMPARISONS.map((value) => ({ label: value, value }))
  return defineParam('comparison', createOptionValueCodec(DASHBOARD_COMPARISONS), {
    ...options,
    items,
  })
}

function customParam<TValue>(
  codec: QueryCodec<TValue>,
): DashboardParamDefinition<TValue | undefined> & { readonly kind: 'custom' }
function customParam<TValue, const TOptions extends SingleOptions<TValue>>(
  codec: QueryCodec<TValue>,
  options: TOptions,
): DashboardParamDefinition<ParamValue<TValue, TOptions>> & { readonly kind: 'custom' }
function customParam(
  codec: StaticQueryStateOptions['codec'],
  options?: AnyParamOptions,
): DashboardParamLike {
  return defineParam('custom', createSafeCodec(codec), options)
}

/**
 * The `p` builder handed to every `params` callback and filter factory. Each method declares one
 * typed param; its filter handle (`dashboard.filters.<key>`) drives it from any control.
 *
 * Every param accepts `defaultValue` (a value or a getter; it narrows away `undefined`), `sync`
 * (URL, memory, or an external store), `urlKey`, `omitDefault`, `historyMode`, `presets`, and the
 * filter presentation: `label`, `placeholder`, `headless`. Params picked from a list also accept
 * `columns` and `searchable`; `multiple: true` turns the value into an always-defined array, capped
 * by `max`.
 */
export const dashboardParamBuilder = {
  /** `true` / `false`. Its filter lists both, labeled by `format` or the localized Yes / No. */
  boolean: booleanParam,
  /**
   * Comparison period: `'previous'`, `'year'`, or `'none'`. Its filter carries localized labels;
   * `resolveDashboardComparisonRange(range, mode)` turns it into the range to fetch.
   */
  comparison: comparisonParam,
  custom: customParam,
  date: dateParam,
  /** Inclusive date range, serialized as `YYYY-MM-DD..YYYY-MM-DD`. */
  dateRange: dateRangeParam,
  /** Value(s) from a literal list, e.g. `p.enum([2024, 2025, 2026], { defaultValue: 2026 })`. */
  enum: enumParam,
  /** Number, or `number[]` with `multiple: true`. */
  number: numberParam,
  /**
   * Value(s) from labeled items: `{ value, label, icon?, avatar?, hint?, description? }`. Pass a
   * getter to read the items from data, e.g. `p.options(() => products.data?.map(toOption) ?? [])`;
   * their values are strings.
   */
  options: optionsParam,
  /**
   * Id(s) picked from a remote, searchable, paginated option source:
   * `p.remote(remoteTableOptions(query, { ... }), { label: 'Account' })`.
   */
  remote: remoteParam,
  /** String, or `string[]` with `multiple: true`. */
  string: stringParam,
}

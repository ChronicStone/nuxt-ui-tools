import type { QueryCodec, StaticQueryStateOptions } from '../../../query-state'
import type {
  DashboardComparison,
  DashboardDateRange,
  DashboardOption,
  DashboardOptionValue,
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

type ResolveParamValue<TValue, TDefault> = undefined extends TDefault ? TValue | undefined : TValue

/** Options of a single-value param whose values carry no label of their own. */
type SingleOptions<TDefault, TValue> = DashboardParamOptions<TDefault, TValue> &
  DashboardParamFormatOptions<TValue> & { multiple?: false }

/** Options of a `multiple` param: the value is an always-defined array. */
type MultipleOptions<TItem> = DashboardParamOptions<readonly TItem[], TItem[]> &
  DashboardParamMultipleOptions & { multiple: true }

/** Options of a single-value param picked from a list. */
type SingleListOptions<TDefault, TValue> = SingleOptions<TDefault, TValue> &
  DashboardParamListOptions

/** Options of a `multiple` param picked from a list. */
type MultipleListOptions<TItem> = MultipleOptions<TItem> &
  DashboardParamFormatOptions<TItem> &
  DashboardParamListOptions

/** Options of params whose items carry their own labels (`p.options`, `p.remote`). */
type LabeledSingleOptions<TDefault, TValue> = DashboardParamOptions<TDefault, TValue> &
  DashboardParamListOptions & { multiple?: false }
type LabeledMultipleOptions<TItem> = MultipleOptions<TItem> & DashboardParamListOptions

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
  const { items, presets } = options
  return {
    codec: multiple ? createListCodec(codec) : codec,
    columns: options.columns,
    defaultValue: options.defaultValue ?? (multiple ? [] : undefined),
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

function stringParam(
  options: MultipleOptions<string> & DashboardParamFormatOptions<string>,
): DashboardParamDefinition<string[]> & { readonly kind: 'string' }
function stringParam<const TDefault extends string | undefined = undefined>(
  options?: SingleOptions<TDefault, string>,
): DashboardParamDefinition<ResolveParamValue<string, TDefault>> & { readonly kind: 'string' }
function stringParam(options?: AnyParamOptions): DashboardParamLike {
  return defineParam('string', optionalStringCodec, options)
}

function numberParam(
  options: MultipleOptions<number> & DashboardParamFormatOptions<number>,
): DashboardParamDefinition<number[]> & { readonly kind: 'number' }
function numberParam<const TDefault extends number | undefined = undefined>(
  options?: SingleOptions<TDefault, number>,
): DashboardParamDefinition<ResolveParamValue<number, TDefault>> & { readonly kind: 'number' }
function numberParam(options?: AnyParamOptions): DashboardParamLike {
  return defineParam('number', optionalNumberCodec, options)
}

/** Items of `p.boolean()`. Labels come from `format`, else the localized "Yes" / "No". */
const BOOLEAN_ITEMS: readonly DashboardOption<boolean>[] = [
  { label: 'true', value: true },
  { label: 'false', value: false },
]

function booleanParam<const TDefault extends boolean | undefined = undefined>(
  options?: SingleOptions<TDefault, boolean>,
): DashboardParamDefinition<ResolveParamValue<boolean, TDefault>> & { readonly kind: 'boolean' }
function booleanParam(options?: AnyParamOptions): DashboardParamLike {
  return defineParam('boolean', optionalBooleanCodec, { ...options, items: BOOLEAN_ITEMS })
}

function dateParam<const TDefault extends Date | undefined = undefined>(
  options?: SingleOptions<TDefault, Date>,
): DashboardParamDefinition<ResolveParamValue<Date, TDefault>> & { readonly kind: 'date' }
function dateParam(options?: AnyParamOptions): DashboardParamLike {
  return defineParam('date', localDateCodec, options)
}

function dateRangeParam<const TDefault extends DashboardDateRange | undefined = undefined>(
  options?: SingleOptions<TDefault, DashboardDateRange>,
): DashboardParamDefinition<ResolveParamValue<DashboardDateRange, TDefault>> & {
  readonly kind: 'dateRange'
}
function dateRangeParam(options?: AnyParamOptions): DashboardParamLike {
  return defineParam('dateRange', dateRangeCodec, options)
}

function enumParam<const TValues extends readonly DashboardOptionValue[]>(
  values: TValues,
  options: MultipleListOptions<TValues[number]>,
): DashboardParamDefinition<TValues[number][]> & { readonly kind: 'enum' }
function enumParam<
  const TValues extends readonly DashboardOptionValue[],
  const TDefault extends TValues[number] | undefined = undefined,
>(
  values: TValues,
  options?: SingleListOptions<TDefault, TValues[number]>,
): DashboardParamDefinition<ResolveParamValue<TValues[number], TDefault>> & {
  readonly kind: 'enum'
}
function enumParam(
  values: readonly DashboardOptionValue[],
  options?: AnyParamOptions,
): DashboardParamLike {
  const items = values.map((value) => ({ label: String(value), value }))
  return defineParam('enum', createOptionValueCodec(values), { ...options, items })
}

function optionsParam<const TItems extends readonly DashboardOption[]>(
  items: TItems,
  options: LabeledMultipleOptions<TItems[number]['value']>,
): DashboardParamDefinition<TItems[number]['value'][]> & { readonly kind: 'options' }
function optionsParam<
  const TItems extends readonly DashboardOption[],
  const TDefault extends TItems[number]['value'] | undefined = undefined,
>(
  items: TItems,
  options?: LabeledSingleOptions<TDefault, TItems[number]['value']>,
): DashboardParamDefinition<ResolveParamValue<TItems[number]['value'], TDefault>> & {
  readonly kind: 'options'
}
function optionsParam(
  items: () => readonly DashboardOption<string>[],
  options: LabeledMultipleOptions<string>,
): DashboardParamDefinition<string[]> & { readonly kind: 'options' }
function optionsParam<const TDefault extends string | undefined = undefined>(
  items: () => readonly DashboardOption<string>[],
  options?: LabeledSingleOptions<TDefault, string>,
): DashboardParamDefinition<ResolveParamValue<string, TDefault>> & { readonly kind: 'options' }
function optionsParam(items: DashboardParamItems, options?: AnyParamOptions): DashboardParamLike {
  // Items read from data are only known once it loads: their values are ids kept as strings.
  const codec = isItemsGetter(items)
    ? optionalStringCodec
    : createOptionValueCodec(items.map((item) => item.value))
  return defineParam('options', codec, { ...options, items })
}

type RemoteSource = DashboardRemoteOptionsConfig

function remoteParam(
  config: RemoteSource & LabeledMultipleOptions<string>,
): DashboardParamDefinition<string[]> & { readonly kind: 'remote' }
function remoteParam(
  source: RemoteSource,
  options: LabeledMultipleOptions<string>,
): DashboardParamDefinition<string[]> & { readonly kind: 'remote' }
function remoteParam<const TDefault extends string | undefined = undefined>(
  source: RemoteSource,
  options?: LabeledSingleOptions<TDefault, string>,
): DashboardParamDefinition<ResolveParamValue<string, TDefault>> & { readonly kind: 'remote' }
function remoteParam<const TDefault extends string | undefined = undefined>(
  config: RemoteSource & LabeledSingleOptions<TDefault, string>,
): DashboardParamDefinition<ResolveParamValue<string, TDefault>> & { readonly kind: 'remote' }
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

function comparisonParam<const TDefault extends DashboardComparison | undefined = undefined>(
  options?: DashboardParamOptions<TDefault, DashboardComparison>,
): DashboardParamDefinition<ResolveParamValue<DashboardComparison, TDefault>> & {
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

function customParam<TValue, const TDefault extends TValue | undefined = undefined>(
  codec: QueryCodec<TValue>,
  options?: SingleOptions<TDefault, TValue>,
): DashboardParamDefinition<ResolveParamValue<TValue, TDefault>> & { readonly kind: 'custom' }
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
 * Every param accepts `defaultValue` (narrows away `undefined`), `sync` (URL, memory, or an
 * external store), `urlKey`, `omitDefault`, `historyMode`, and the filter presentation: `label`,
 * `placeholder`, `headless`. Params picked from a list also accept `columns` and `searchable`;
 * `multiple: true` turns the value into an always-defined array, capped by `max`.
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
   * `p.remote(remoteTableOptions({ ... }), { label: 'Account' })`.
   */
  remote: remoteParam,
  /** String, or `string[]` with `multiple: true`. */
  string: stringParam,
}

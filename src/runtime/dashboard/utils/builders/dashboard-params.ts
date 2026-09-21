import type { QueryCodec, StaticQueryStateOptions } from '../../../query-state'
import type {
  DashboardComparison,
  DashboardDateRange,
  DashboardOption,
  DashboardOptionValue,
  DashboardParamDefinition,
  DashboardParamKind,
  DashboardParamLike,
  DashboardParamOptions,
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

type DashboardMultipleOption = { multiple?: boolean }

function defineParam(
  kind: DashboardParamKind,
  codec: StaticQueryStateOptions['codec'],
  options: DashboardParamOptions<unknown> &
    DashboardMultipleOption & {
      items?: readonly DashboardOption[]
      remote?: DashboardRemoteOptionsConfig
    } = {},
): DashboardRuntimeParam {
  const multiple = options.multiple === true
  return {
    codec: multiple ? createListCodec(codec) : codec,
    defaultValue: options.defaultValue ?? (multiple ? [] : undefined),
    historyMode: options.historyMode,
    items: options.items,
    kind,
    multiple,
    omitDefault: options.omitDefault,
    remote: options.remote,
    urlKey: options.urlKey,
  }
}

function stringParam<const TDefault extends string | undefined = undefined>(
  options?: DashboardParamOptions<TDefault>,
): DashboardParamDefinition<ResolveParamValue<string, TDefault>> & { readonly kind: 'string' }
function stringParam(options?: DashboardParamOptions<unknown>): DashboardParamLike {
  return defineParam('string', optionalStringCodec, options)
}

function numberParam<const TDefault extends number | undefined = undefined>(
  options?: DashboardParamOptions<TDefault>,
): DashboardParamDefinition<ResolveParamValue<number, TDefault>> & { readonly kind: 'number' }
function numberParam(options?: DashboardParamOptions<unknown>): DashboardParamLike {
  return defineParam('number', optionalNumberCodec, options)
}

function booleanParam<const TDefault extends boolean | undefined = undefined>(
  options?: DashboardParamOptions<TDefault>,
): DashboardParamDefinition<ResolveParamValue<boolean, TDefault>> & { readonly kind: 'boolean' }
function booleanParam(options?: DashboardParamOptions<unknown>): DashboardParamLike {
  return defineParam('boolean', optionalBooleanCodec, options)
}

function dateParam<const TDefault extends Date | undefined = undefined>(
  options?: DashboardParamOptions<TDefault>,
): DashboardParamDefinition<ResolveParamValue<Date, TDefault>> & { readonly kind: 'date' }
function dateParam(options?: DashboardParamOptions<unknown>): DashboardParamLike {
  return defineParam('date', localDateCodec, options)
}

function dateRangeParam<const TDefault extends DashboardDateRange | undefined = undefined>(
  options?: DashboardParamOptions<TDefault>,
): DashboardParamDefinition<ResolveParamValue<DashboardDateRange, TDefault>> & {
  readonly kind: 'dateRange'
}
function dateRangeParam(options?: DashboardParamOptions<unknown>): DashboardParamLike {
  return defineParam('dateRange', dateRangeCodec, options)
}

function enumParam<const TValues extends readonly DashboardOptionValue[]>(
  values: TValues,
  options: DashboardParamOptions<readonly TValues[number][]> & { multiple: true },
): DashboardParamDefinition<TValues[number][]> & { readonly kind: 'enum' }
function enumParam<
  const TValues extends readonly DashboardOptionValue[],
  const TDefault extends TValues[number] | undefined = undefined,
>(
  values: TValues,
  options?: DashboardParamOptions<TDefault> & { multiple?: false },
): DashboardParamDefinition<ResolveParamValue<TValues[number], TDefault>> & {
  readonly kind: 'enum'
}
function enumParam(
  values: readonly DashboardOptionValue[],
  options?: DashboardParamOptions<unknown> & DashboardMultipleOption,
): DashboardParamLike {
  const items = values.map((value) => ({ label: String(value), value }))
  return defineParam('enum', createOptionValueCodec(values), { ...options, items })
}

function optionsParam<const TItems extends readonly DashboardOption[]>(
  items: TItems,
  options: DashboardParamOptions<readonly TItems[number]['value'][]> & { multiple: true },
): DashboardParamDefinition<TItems[number]['value'][]> & { readonly kind: 'options' }
function optionsParam<
  const TItems extends readonly DashboardOption[],
  const TDefault extends TItems[number]['value'] | undefined = undefined,
>(
  items: TItems,
  options?: DashboardParamOptions<TDefault> & { multiple?: false },
): DashboardParamDefinition<ResolveParamValue<TItems[number]['value'], TDefault>> & {
  readonly kind: 'options'
}
function optionsParam(
  items: readonly DashboardOption[],
  options?: DashboardParamOptions<unknown> & DashboardMultipleOption,
): DashboardParamLike {
  const codec = createOptionValueCodec(items.map((item) => item.value))
  return defineParam('options', codec, { ...options, items })
}

function remoteParam(
  config: DashboardRemoteOptionsConfig &
    DashboardParamOptions<readonly string[]> & { multiple: true },
): DashboardParamDefinition<string[]> & { readonly kind: 'remote' }
function remoteParam<const TDefault extends string | undefined = undefined>(
  config: DashboardRemoteOptionsConfig & DashboardParamOptions<TDefault> & { multiple?: false },
): DashboardParamDefinition<ResolveParamValue<string, TDefault>> & { readonly kind: 'remote' }
function remoteParam(
  config: DashboardRemoteOptionsConfig & DashboardParamOptions<unknown> & DashboardMultipleOption,
): DashboardParamLike {
  const { load, pagination, queryKey, resolveSelected, search, ...options } = config
  const remote = { load, pagination, queryKey, resolveSelected, search }
  return defineParam('remote', optionalStringCodec, { ...options, remote })
}

/** Values of `p.comparison`, in menu order. */
export const DASHBOARD_COMPARISONS = [
  'previous',
  'year',
  'none',
] as const satisfies readonly DashboardComparison[]

function comparisonParam<const TDefault extends DashboardComparison | undefined = undefined>(
  options?: DashboardParamOptions<TDefault>,
): DashboardParamDefinition<ResolveParamValue<DashboardComparison, TDefault>> & {
  readonly kind: 'comparison'
}
function comparisonParam(options?: DashboardParamOptions<unknown>): DashboardParamLike {
  // Labels are localized by the option handle; these are fallbacks.
  const items = DASHBOARD_COMPARISONS.map((value) => ({ label: value, value }))
  return defineParam('comparison', createOptionValueCodec(DASHBOARD_COMPARISONS), {
    ...options,
    items,
  })
}

function customParam<TValue, const TDefault extends TValue | undefined = undefined>(
  codec: QueryCodec<TValue>,
  options?: DashboardParamOptions<TDefault>,
): DashboardParamDefinition<ResolveParamValue<TValue, TDefault>> & { readonly kind: 'custom' }
function customParam(
  codec: StaticQueryStateOptions['codec'],
  options?: DashboardParamOptions<unknown>,
): DashboardParamLike {
  return defineParam('custom', createSafeCodec(codec), options)
}

/**
 * The `p` builder handed to every `params` callback. Each method declares one typed, URL-synced
 * param; the engine renders no controls, the app binds `v-model` to the resulting value.
 *
 * Every param accepts `defaultValue` (narrows away `undefined`), `urlKey`, `omitDefault`, and
 * `historyMode`. Option-backed params (`enum`, `options`, `remote`) also accept `multiple: true`,
 * which turns the value into an always-defined array.
 */
export const dashboardParamBuilder = {
  boolean: booleanParam,
  /**
   * Comparison period: `'previous'`, `'year'`, or `'none'`. Its option handle carries localized
   * labels; `resolveDashboardComparisonRange(range, mode)` turns it into the range to fetch.
   */
  comparison: comparisonParam,
  custom: customParam,
  date: dateParam,
  /** Inclusive date range, serialized as `YYYY-MM-DD..YYYY-MM-DD`. */
  dateRange: dateRangeParam,
  /** Value(s) from a literal list, e.g. `p.enum([2024, 2025, 2026], { defaultValue: 2026 })`. */
  enum: enumParam,
  number: numberParam,
  /** Value(s) from labeled items: `{ value, label, icon?, avatar?, description? }`. */
  options: optionsParam,
  /** Id(s) picked from a remote, searchable, paginated option source. */
  remote: remoteParam,
  string: stringParam,
}

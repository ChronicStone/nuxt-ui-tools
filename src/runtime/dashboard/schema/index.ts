import type { LazyTextValue } from '../../shared/types/utils'
import type {
  DashboardDeriveMap,
  DashboardDerivedResources,
  DashboardEmptyMap,
  DashboardKeyError,
  DashboardParamBuilder,
  DashboardParamEntries,
  DashboardParamLike,
  DashboardParamMap,
  DashboardParamValues,
  DashboardReservedKey,
  DashboardSchema,
  DashboardScopeGuard,
  DashboardScopeInput,
  DashboardSourceMap,
  DashboardView,
  DashboardViewBuilder,
  DashboardViewMap,
  DashboardViewsInput,
} from '../types'

type DashboardViewsGuard<TQueries, TDerive, TViews> = [
  Extract<keyof TViews, DashboardReservedKey | keyof TQueries | keyof TDerive>,
] extends [never]
  ? unknown
  : {
      views: DashboardKeyError<`View key "${Extract<keyof TViews, DashboardReservedKey | keyof TQueries | keyof TDerive> & string}" is reserved or collides with a root query or derived value.`>
    }

/** Shared params a view reads that the root does not declare, or declares with another type. */
type DashboardSharedMismatch<TParams, TShared> = {
  [K in keyof TShared]: K extends keyof TParams
    ? DashboardParamValues<TParams>[K] extends DashboardParamValues<TShared>[K]
      ? never
      : K
    : K
}[keyof TShared]

type DashboardSharedErrors<TParams, TViews> = {
  [K in keyof TViews]: TViews[K] extends { readonly shared?: infer TShared }
    ? DashboardSharedMismatch<TParams, Exclude<TShared, undefined>> extends infer TBad
      ? [TBad] extends [never]
        ? never
        : `View "${K & string}" reads the shared param "${TBad & string}", which the root params do not declare with the same type.`
      : never
    : never
}[keyof TViews]

type DashboardSharedGuard<TParams, TViews> = [DashboardSharedErrors<TParams, TViews>] extends [
  never,
]
  ? unknown
  : { views: DashboardKeyError<DashboardSharedErrors<TParams, TViews>> }

/**
 * Declares a dashboard: typed params, staged queries, derived values, and optional views (tabs).
 * Nothing runs here — `useDashboard(schema)` instantiates it.
 *
 * Keys are checked at compile time: a query, derived value, or view named after a runtime member
 * (`params`, `filters`, `filtered`, `resetFilters`, `options`, `state`, `refreshing`, `refresh`,
 * `updatedAt`, `autoRefresh`, `view`, `schema`) or after a sibling is a type error.
 *
 * @example
 * ```ts
 * const schema = defineDashboardSchema({
 *   key: 'sales',
 *   params: (p) => ({ period: p.enum([7, 30, 90], { defaultValue: 30, label: 'Period' }) }),
 *   queries: ({ essential, background, params }) => ({
 *     summary: essential.query(() => ({
 *       queryKey: ['sales', 'summary', params.period],
 *       queryFn: () => api.sales.summary({ days: params.period }),
 *     })),
 *     channels: background.query({
 *       defaultValue: [],
 *       query: () => ({
 *         queryKey: ['sales', 'channels', params.period],
 *         queryFn: () => api.sales.channels({ days: params.period }),
 *       }),
 *     }),
 *   }),
 *   derive: ({ data }) => ({
 *     channelCount: () => data.channels.length,
 *   }),
 * })
 * ```
 */
export function defineDashboardSchema<
  const TParams extends DashboardParamMap = DashboardEmptyMap,
  const TQueries extends DashboardSourceMap = DashboardEmptyMap,
  const TDerive extends DashboardDeriveMap = DashboardEmptyMap,
  const TViews extends DashboardViewMap = DashboardEmptyMap,
>(
  schema: {
    /** Stable identity, used in default query keys and devtools labels. */
    key: string
    /** Prefix prepended to every URL key this dashboard owns. */
    urlPrefix?: string
    /**
     * Default auto-refresh interval in seconds (`0`: off). `dashboard.autoRefresh` changes it at
     * runtime and keeps it in the URL (`refresh`).
     */
    autoRefresh?: number
    /**
     * Views (tabs): a map of `defineDashboardView` views, or a callback declaring them inline with
     * the `view(...)` builder. Each view owns params and queries; queries of a view never fetch
     * until the view is opened once, then stay warm.
     */
    views?: DashboardViewsInput<
      TViews,
      DashboardViewBuilder<TParams, TQueries & DashboardDerivedResources<TDerive>>
    >
    /** View shown when the URL does not select one. Defaults to the first declared view. */
    defaultView?: NoInfer<keyof TViews & string>
  } & DashboardScopeInput<DashboardEmptyMap, DashboardEmptyMap, TParams, TQueries, TDerive> &
    DashboardScopeGuard<TQueries, TDerive> &
    DashboardViewsGuard<TQueries, TDerive, TViews> &
    DashboardSharedGuard<TParams, TViews>,
): DashboardSchema<TParams, TQueries, TDerive, TViews> {
  return schema
}

/**
 * Declares one filter on its own, so it can live in its own file and be reused by several
 * dashboards and views. The factory receives the `p` builder and runs when `useDashboard()` does
 * (inside component setup), so it may call composables such as `useNuxtApp()` or `useI18n()`.
 *
 * Use the result wherever a param is expected: `params: { account: accountFilter }`.
 *
 * @example
 * ```ts
 * export const accountFilter = defineDashboardFilter((p) => {
 *   const { $api } = useNuxtApp()
 *   return p.remote(
 *     remoteTableOptions({
 *       query: (request) => $api.accounts.query.queryOptions({ body: request }),
 *       search: ['name'],
 *       option: (account) => ({ label: account.name, value: account.id }),
 *     }),
 *     { label: 'Account', placeholder: 'All accounts' },
 *   )
 * })
 * ```
 */
export function defineDashboardFilter<const TParam extends DashboardParamLike>(
  factory: (p: DashboardParamBuilder) => TParam,
) {
  return factory
}

/**
 * Declares a group of filters shared by several scopes, e.g. the period every view reads. Entries
 * are filters from `defineDashboardFilter` or inline factories; spread the group into a params map
 * or use it as is.
 *
 * @example
 * ```ts
 * export const periodFilters = defineDashboardFilters({
 *   year: yearFilter,
 *   months: (p) => p.enum(MONTHS, { multiple: true, columns: 3, label: 'Months' }),
 * })
 * ```
 */
export function defineDashboardFilters<const TParams extends DashboardParamMap>(
  params: DashboardParamEntries<TParams>,
) {
  return params
}

/**
 * Declares one view (tab) on its own, so each tab can live in its own file. `shared` lists the
 * root params the view reads: its queries, derived values, and handle see them next to the view's
 * own params, and `defineDashboardSchema` checks that the root declares them.
 *
 * Components under the dashboard get the typed view handle with `useDashboardView(view)`.
 *
 * @example
 * ```ts
 * export const consumptionView = defineDashboardView({
 *   label: 'Consumption',
 *   shared: periodFilters,
 *   params: { account: accountFilter },
 *   queries: ({ essential, params }) => {
 *     const overview = () => api.consumption.queryOptions({ year: params.year, account: params.account })
 *     return {
 *       summary: essential.query({ query: overview, select: (data) => data.summary }),
 *       months: essential.query({ query: overview, select: (data) => data.months }),
 *     }
 *   },
 * })
 * ```
 */
export function defineDashboardView<
  const TShared extends DashboardParamMap = DashboardEmptyMap,
  const TParams extends DashboardParamMap = DashboardEmptyMap,
  const TQueries extends DashboardSourceMap = DashboardEmptyMap,
  const TDerive extends DashboardDeriveMap = DashboardEmptyMap,
>(
  view: {
    /** Tab label. The lazy form keeps it translation-friendly. */
    label?: LazyTextValue
    /** Root params this view reads (a filter group, or a map of filters). */
    shared?: DashboardParamEntries<TShared>
  } & DashboardScopeInput<TShared, DashboardEmptyMap, TParams, TQueries, TDerive> &
    DashboardScopeGuard<TQueries, TDerive>,
): DashboardView<TParams, TQueries, TDerive, TShared> {
  return view
}

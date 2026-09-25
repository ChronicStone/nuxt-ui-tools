import type { LazyTextValue } from '../../shared/types/utils'
import type {
  DashboardCondition,
  DashboardDeriveMap,
  DashboardEmptyMap,
  DashboardFilterMap,
  DashboardKeyError,
  DashboardReservedKey,
  DashboardSchema,
  DashboardScopeGuard,
  DashboardScopeInput,
  DashboardSourceMap,
  DashboardView,
  DashboardBadgesContext,
  DashboardDerivedResources,
  DashboardViewBadges,
  DashboardViewMap,
} from '../types'

type DashboardViewsGuard<TQueries, TDerive, TViews> = [
  Extract<keyof TViews, DashboardReservedKey | keyof TQueries | keyof TDerive>,
] extends [never]
  ? unknown
  : {
      views: DashboardKeyError<`View key "${Extract<keyof TViews, DashboardReservedKey | keyof TQueries | keyof TDerive> & string}" is reserved or collides with a root query or derived value.`>
    }

/**
 * Declares a dashboard: its filters, staged queries and derived values, and its views (tabs).
 * Nothing runs here — `useDashboard()` instantiates it.
 *
 * Wrap it in a function taking what the dashboard is about (an account, the workspace): the page
 * passes it, and the function hands it on to its views. Filters are the state the user controls;
 * they are declared inline, with the `f` builder.
 *
 * Keys are checked at compile time: a query, derived value, or view named after a runtime member
 * (`filters`, `controls`, `filtered`, `resetFilters`, `state`, `refreshing`, `refresh`, `updatedAt`,
 * `autoRefresh`, `view`, `schema`) or after a sibling is a type error.
 *
 * @example
 * ```ts
 * export function accountSchema(params: { accountId: string }) {
 *   return defineDashboardSchema({
 *     key: 'account',
 *     views: {
 *       activity: accountActivityView(params),
 *       invoices: accountInvoicesView(params),
 *     },
 *   })
 * }
 * ```
 */
export function defineDashboardSchema<
  const TFilters extends DashboardFilterMap = DashboardEmptyMap,
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
     * Views (tabs), each declared with `defineDashboardView`. A view's queries never fetch until
     * the view is opened once, then stay warm.
     */
    views?: TViews
    /** View shown when the URL does not select one. Defaults to the first declared view. */
    defaultView?: NoInfer<keyof TViews & string>
    /**
     * Counts or short texts shown after the view tabs' labels, read from the root queries and
     * derived values, so a tab can count what waits in it before it is opened. Read lazily: badges
     * follow the data. `null`, `undefined`, `0`, and `''` show nothing.
     *
     * @example
     * ```ts
     * badges: ({ data }) => ({
     *   invoices: data.account?.unpaidInvoices,
     *   access: data.account?.pendingInvitations,
     * })
     * ```
     */
    badges?: (
      context: DashboardBadgesContext<TFilters, TQueries & DashboardDerivedResources<TDerive>>,
    ) => DashboardViewBadges<NoInfer<keyof TViews & string>>
  } & DashboardScopeInput<TFilters, TQueries, TDerive> &
    DashboardScopeGuard<TQueries, TDerive> &
    DashboardViewsGuard<TQueries, TDerive, TViews>,
): DashboardSchema<NoInfer<TFilters>, NoInfer<TQueries>, NoInfer<TDerive>, NoInfer<TViews>> {
  return schema
}

/**
 * Declares one view (tab), self-contained: its label, its filters, its queries and derived values.
 * Wrap it in a function taking what it needs from the dashboard's input, and give it its own file.
 *
 * A filter key names one state across the dashboard: two views declaring `year` share its value,
 * so it survives a tab change. Components under the dashboard get the typed view handle with
 * `useDashboardView(consumptionView)`.
 *
 * @example
 * ```ts
 * export function consumptionView(params: { workspace: Workspace }) {
 *   const { $api, $i18n } = useNuxtApp()
 *   return defineDashboardView({
 *     label: () => $i18n.t('dashboard.tabs.consumption'),
 *     enabled: () => canRead(params.workspace, 'consumption'),
 *     filters: (f) => ({
 *       year: f.enum([2025, 2026], { defaultValue: 2026, label: () => $i18n.t('filters.year') }),
 *     }),
 *     queries: ({ essential, filters }) => {
 *       const overview = () => $api.consumption.queryOptions({ query: { year: filters.year } })
 *       return {
 *         summary: essential.query({ query: overview, select: (data) => data.summary }),
 *         months: essential.query({ query: overview, select: (data) => data.months }),
 *       }
 *     },
 *   })
 * }
 * ```
 */
export function defineDashboardView<
  const TFilters extends DashboardFilterMap = DashboardEmptyMap,
  const TQueries extends DashboardSourceMap = DashboardEmptyMap,
  const TDerive extends DashboardDeriveMap = DashboardEmptyMap,
>(
  view: {
    /** Tab label. The lazy form keeps it translation-friendly. */
    label?: LazyTextValue
    /**
     * Availability of the view, read lazily: a disabled view has no tab, is never the current view
     * (the URL falls back to an enabled one), and its queries report `disabled`.
     */
    enabled?: DashboardCondition
  } & DashboardScopeInput<TFilters, TQueries, TDerive> &
    DashboardScopeGuard<TQueries, TDerive>,
): DashboardView<NoInfer<TFilters>, NoInfer<TQueries>, NoInfer<TDerive>> {
  // The result is `NoInfer`: declared inline in a schema's `views`, the view would otherwise take
  // the contextual `DashboardViewMap` as an inference candidate, and a view without queries would
  // infer the open map instead of an empty one.
  return view
}

import type {
  DashboardDeriveMap,
  DashboardDerivedResources,
  DashboardEmptyMap,
  DashboardKeyError,
  DashboardParamMap,
  DashboardReservedKey,
  DashboardSchema,
  DashboardScopeGuard,
  DashboardScopeInput,
  DashboardSourceMap,
  DashboardViewBuilder,
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
 * Declares a dashboard: typed URL-synced params, staged queries, derived values, and optional
 * views (tabs). Nothing runs here — `useDashboard(schema)` instantiates it.
 *
 * Keys are checked at compile time: a query, derived value, or view named after a runtime member
 * (`params`, `options`, `state`, `refreshing`, `refresh`, `updatedAt`, `autoRefresh`, `view`,
 * `schema`) or after a sibling is a type error.
 *
 * @example
 * ```ts
 * const schema = defineDashboardSchema({
 *   key: 'sales',
 *   params: (p) => ({ period: p.enum([7, 30, 90], { defaultValue: 30 }) }),
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
     * Views (tabs). Each view owns params and queries; queries of a view never fetch until the
     * view is opened once, then stay warm.
     */
    views?: (
      view: DashboardViewBuilder<TParams, TQueries & DashboardDerivedResources<TDerive>>,
    ) => TViews
    /** View shown when the URL does not select one. Defaults to the first declared view. */
    defaultView?: NoInfer<keyof TViews & string>
  } & DashboardScopeInput<DashboardEmptyMap, DashboardEmptyMap, TParams, TQueries, TDerive> &
    DashboardScopeGuard<TQueries, TDerive> &
    DashboardViewsGuard<TQueries, TDerive, TViews>,
): DashboardSchema<TParams, TQueries, TDerive, TViews> {
  return schema
}

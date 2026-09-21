import type { DashboardResourceState } from '../types'

/**
 * Combines the states of several sources the way a dependent value experiences them: any error
 * wins, then any pending source. Idle sources were not requested (gated by `requires`, or a
 * deferred query nobody activated), so they do not hold the value back unless all are idle.
 */
export function combineDashboardStates(
  states: readonly DashboardResourceState[],
): DashboardResourceState {
  if (states.includes('error')) return 'error'
  if (states.includes('loading')) return 'loading'
  if (states.length > 0 && states.every((state) => state === 'idle')) return 'idle'
  return 'ready'
}

/** Refreshes sources in parallel and reports every failure at once. */
export async function refreshDashboardSources(
  sources: readonly { refresh: () => Promise<void> }[],
) {
  const results = await Promise.allSettled(sources.map((source) => source.refresh()))
  const errors = results.flatMap((result) => (result.status === 'rejected' ? [result.reason] : []))
  if (errors.length > 0) throw new AggregateError(errors, 'Dashboard refresh failed')
}

/** URL segment of the current view. A root param cannot use it while the dashboard has views. */
export const DASHBOARD_VIEW_URL_KEY = 'view'

/** Joins the non-empty segments of a URL key with dots. */
export function joinDashboardUrlKey(...segments: readonly (string | undefined)[]) {
  return segments.filter(Boolean).join('.')
}

/**
 * URL key prefix of one scope, named after what it holds: none for the root (`year`), the view
 * key for a view (`consumption.currency`). `urlPrefix` namespaces both when set.
 */
export function resolveDashboardScopePrefix(urlPrefix: string | undefined, viewKey?: string) {
  return joinDashboardUrlKey(urlPrefix, viewKey)
}

/** URL key of the current view: `view`, or `<urlPrefix>.view`. */
export function resolveDashboardViewKey(urlPrefix: string | undefined) {
  return joinDashboardUrlKey(urlPrefix, DASHBOARD_VIEW_URL_KEY)
}

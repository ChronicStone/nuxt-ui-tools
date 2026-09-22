import { isFunction } from '../../shared/utils/predicate'
import type { DashboardCondition, DashboardResourceState } from '../types'

/**
 * Combines the states of several sources the way a dependent value experiences them: any error
 * wins, then any pending source. Idle sources were not requested (gated by `requires`, or a
 * deferred query nobody activated), so they do not hold the value back unless all are idle.
 * Disabled sources are not part of the dashboard: they are left out, and only when every source is
 * disabled is the combination disabled too.
 */
export function combineDashboardStates(
  states: readonly DashboardResourceState[],
): DashboardResourceState {
  const live = states.filter((state) => state !== 'disabled')
  if (live.length === 0) return states.length > 0 ? 'disabled' : 'ready'
  if (live.includes('error')) return 'error'
  if (live.includes('loading')) return 'loading'
  if (live.every((state) => state === 'idle')) return 'idle'
  return 'ready'
}

/** Whether an `enabled` condition holds: a boolean, a getter, or no condition at all. */
export function resolveDashboardCondition(condition: DashboardCondition | undefined): boolean {
  if (condition === undefined) return true
  return isConditionGetter(condition) ? condition() : condition
}

function isConditionGetter(condition: DashboardCondition): condition is () => boolean {
  return isFunction(condition)
}

/** Oldest defined timestamp of a set of sources: they are all at least this fresh. */
export function resolveDashboardUpdatedAt(values: readonly (number | undefined)[]) {
  let oldest: number | undefined
  for (const value of values) {
    if (value !== undefined && (oldest === undefined || value < oldest)) oldest = value
  }
  return oldest
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

/** URL segment of the auto-refresh interval. A root param cannot use it. */
export const DASHBOARD_REFRESH_URL_KEY = 'refresh'

/** URL key of the auto-refresh interval: `refresh`, or `<urlPrefix>.refresh`. */
export function resolveDashboardRefreshKey(urlPrefix: string | undefined) {
  return joinDashboardUrlKey(urlPrefix, DASHBOARD_REFRESH_URL_KEY)
}

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

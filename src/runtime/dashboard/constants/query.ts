import type { DashboardStage } from '../types'

/** Default TanStack Query options applied to dashboard queries. */
export const DASHBOARD_QUERY_DEFAULTS = {
  refetchOnWindowFocus: false,
  /** How long fetched data is considered fresh (ms), per stage. */
  staleTime: {
    background: 60_000,
    deferred: 60_000,
    essential: 30_000,
  } satisfies Record<DashboardStage, number>,
}

export const DASHBOARD_REMOTE_OPTIONS_DEFAULTS = {
  pageSize: 25,
  searchDebounce: 250,
  selectedStaleTime: 300_000,
  staleTime: 30_000,
}

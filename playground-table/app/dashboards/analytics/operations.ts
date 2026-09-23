import { defineDashboardView } from '#ui-tools/dashboard'

import { dashboardApi as api, OPERATIONS_SEGMENTS, sum, YEARS } from '../../data/dashboard'

/** Sortable columns of the operations accounts table. */
export const OPERATIONS_SORT_KEYS = ['name', 'sessions', 'success', 'change', 'delay'] as const
export type OperationsSortKey = (typeof OPERATIONS_SORT_KEYS)[number]

const dayFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })

/** `YYYY-MM-DD` → "12 mars": the picked day, on its chip. */
function formatDay(iso: string) {
  const [year, month, day] = iso.split('-').map(Number)
  return year && month && day ? dayFormat.format(new Date(year, month - 1, day)) : iso
}

/**
 * Opérations: every operational block. A day picked on the sessions chart narrows the accounts
 * table, whose sort and segment tab are filters of its query, so they stay in the URL.
 */
export function operationsView() {
  return defineDashboardView({
    label: 'Opérations',
    filters: (f) => ({
      year: f.enum(YEARS, { defaultValue: 2026, label: 'Année' }),
      /**
       * Period the KPIs and the daily chart compare against. Not `compare`: the consumption view
       * declares that key as a yes / no toggle, and one key names one filter.
       */
      comparison: f.comparison({ defaultValue: 'previous', label: 'Comparer à' }),
      /** Day picked on the sessions chart (`YYYY-MM-DD`). */
      day: f.string({ format: formatDay, label: 'Journée' }),
    }),
    queries: ({ background, deferred, essential, filters }) => ({
      kpis: essential.query(() => ({
        queryFn: () => api.operations.summary({ compare: filters.comparison, year: filters.year }),
        queryKey: ['operations', 'kpis', filters.year, filters.comparison],
      })),
      daily: essential.query({
        defaultValue: [],
        query: () => ({
          queryFn: () => api.operations.daily({ compare: filters.comparison, year: filters.year }),
          queryKey: ['operations', 'daily', filters.year, filters.comparison],
        }),
      }),
      alerts: essential.query({
        defaultValue: [],
        query: () => ({ queryFn: api.operations.alerts, queryKey: ['operations', 'alerts'] }),
      }),
      activity: background.query({
        defaultValue: [],
        query: () => ({ queryFn: api.operations.activity, queryKey: ['operations', 'activity'] }),
      }),
      accounts: deferred.query({
        defaultValue: [],
        filters: (f) => ({
          sort: f.enum(OPERATIONS_SORT_KEYS, { defaultValue: 'sessions' }),
          order: f.enum(['desc', 'asc'], { defaultValue: 'desc' }),
          segment: f.enum(OPERATIONS_SEGMENTS, { defaultValue: 'all' }),
        }),
        query: ({ filters: own }) => ({
          queryFn: () =>
            api.operations.accounts({ day: filters.day, segment: own.segment, year: filters.year }),
          queryKey: ['operations', 'accounts', filters.year, filters.day, own.segment],
        }),
      }),
    }),
    derive: ({ data }) => ({
      sessionsTotal: () => sum(data.daily.map((row) => row.sessions)),
      /** Monthly certificates of the year, as chart rows. */
      certificatesByMonth: () =>
        (data.kpis?.certificatesTrend ?? []).map((value, month) => ({ month, value })),
    }),
  })
}

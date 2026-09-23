import { defineDashboardView } from '#ui-tools/dashboard'

import {
  DASHBOARD_ACCOUNT_OPTIONS,
  DASHBOARD_MONTHS,
  DASHBOARD_YEARS,
  demoDashboardApi,
  monthLabel,
} from '../../demo-dashboard-api'

const api = demoDashboardApi.candidates

/** Candidates tab: a year, months (a 3-column grid), and several accounts. */
export function candidatesView() {
  return defineDashboardView({
    label: 'Candidates & certifications',
    filters: (f) => ({
      year: f.enum(DASHBOARD_YEARS, { defaultValue: 2026, label: 'Year' }),
      months: f.enum(DASHBOARD_MONTHS, {
        columns: 3,
        format: monthLabel,
        label: 'Months',
        multiple: true,
      }),
      accounts: f.remote(DASHBOARD_ACCOUNT_OPTIONS, { label: 'Accounts', multiple: true }),
    }),
    queries: ({ background, deferred, essential, filters }) => ({
      summary: essential.query(() => ({
        queryFn: () => api.summary(filters),
        queryKey: ['candidates', 'summary', filters.year, filters.months, filters.accounts],
      })),
      registrations: essential.query({
        defaultValue: [],
        query: () => ({
          queryFn: () => api.registrations(filters),
          queryKey: ['candidates', 'registrations', filters.year, filters.months, filters.accounts],
        }),
      }),
      funnel: background.query({
        defaultValue: [],
        query: () => ({
          queryFn: () => api.funnel(filters),
          queryKey: ['candidates', 'funnel', filters.year, filters.months, filters.accounts],
        }),
      }),
      perAccount: background.query({
        defaultValue: [],
        query: () => ({
          queryFn: () => api.perAccount(filters),
          queryKey: ['candidates', 'per-account', filters.year, filters.months, filters.accounts],
        }),
      }),
      proctoring: background.query({
        defaultValue: [],
        query: () => ({
          queryFn: () => api.proctoring(filters),
          queryKey: ['candidates', 'proctoring', filters.year, filters.months, filters.accounts],
        }),
      }),
      performance: deferred.query({
        defaultValue: [],
        query: () => ({
          queryFn: () => api.performance(filters),
          queryKey: ['candidates', 'performance', filters.accounts],
        }),
      }),
      edof: deferred.query({
        defaultValue: [],
        query: () => ({ queryFn: api.edof, queryKey: ['candidates', 'edof'] }),
      }),
      cefr: deferred.query({
        defaultValue: [],
        query: () => ({ queryFn: api.cefr, queryKey: ['candidates', 'cefr'] }),
      }),
      delay: deferred.query({
        defaultValue: [],
        query: () => ({ queryFn: api.delay, queryKey: ['candidates', 'delay'] }),
      }),
    }),
  })
}

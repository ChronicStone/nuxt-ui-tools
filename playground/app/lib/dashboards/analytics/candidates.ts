import { defineDashboardView } from '#ui-tools/dashboard'

import { DASHBOARD_MONTHS, demoDashboardApi, monthLabel } from '../../demo-dashboard-api'
import { accountsFilter, periodFilters } from './filters'

const api = demoDashboardApi.candidates

/** Candidates tab: the shared year, then months (a 3-column grid) and several accounts. */
export const candidatesView = defineDashboardView({
  label: 'Candidates & certifications',
  shared: periodFilters,
  params: {
    months: (p) =>
      p.enum(DASHBOARD_MONTHS, { columns: 3, format: monthLabel, label: 'Months', multiple: true }),
    accounts: accountsFilter,
  },
  queries: ({ background, deferred, essential, params }) => ({
    summary: essential.query(() => ({
      queryFn: () => api.summary(params),
      queryKey: ['candidates', 'summary', params.year, params.months, params.accounts],
    })),
    registrations: essential.query({
      defaultValue: [],
      query: () => ({
        queryFn: () => api.registrations(params),
        queryKey: ['candidates', 'registrations', params.year, params.months, params.accounts],
      }),
    }),
    funnel: background.query({
      defaultValue: [],
      query: () => ({
        queryFn: () => api.funnel(params),
        queryKey: ['candidates', 'funnel', params.year, params.months, params.accounts],
      }),
    }),
    perAccount: background.query({
      defaultValue: [],
      query: () => ({
        queryFn: () => api.perAccount(params),
        queryKey: ['candidates', 'per-account', params.year, params.months, params.accounts],
      }),
    }),
    proctoring: background.query({
      defaultValue: [],
      query: () => ({
        queryFn: () => api.proctoring(params),
        queryKey: ['candidates', 'proctoring', params.year, params.months, params.accounts],
      }),
    }),
    performance: deferred.query({
      defaultValue: [],
      query: () => ({
        queryFn: () => api.performance(params),
        queryKey: ['candidates', 'performance', params.accounts],
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

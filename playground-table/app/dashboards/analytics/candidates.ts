import { defineDashboardView } from '#ui-tools/dashboard'

import { CERT_ROWS, dashboardApi as api, MONTH_INDEXES, MONTHS, YEARS } from '../../data/dashboard'

/** Candidats et certifications (identity4): the year, months, and accounts. */
export function candidatesView() {
  return defineDashboardView({
    label: 'Candidats et certifications',
    filters: (f) => ({
      year: f.enum(YEARS, { defaultValue: 2026, label: 'Année' }),
      months: f.enum(MONTH_INDEXES, {
        columns: 3,
        format: (month) => MONTHS[month],
        label: 'Mois',
        multiple: true,
      }),
      accounts: f.options(
        CERT_ROWS.map((row) => ({ label: row.name, value: row.id })),
        { label: 'Comptes', multiple: true, searchable: true },
      ),
    }),
    queries: ({ background, deferred, essential, filters }) => ({
      summary: essential.query(() => ({
        queryFn: () => api.candidates.summary(filters),
        queryKey: ['candidates', 'summary', filters.year, filters.months, filters.accounts],
      })),
      registrations: essential.query({
        defaultValue: [],
        query: () => ({
          queryFn: () => api.candidates.registrations(filters),
          queryKey: ['candidates', 'registrations', filters.year, filters.months, filters.accounts],
        }),
      }),
      funnel: essential.query({
        defaultValue: [],
        query: () => ({
          queryFn: () => api.candidates.funnel(filters),
          queryKey: ['candidates', 'funnel', filters.year, filters.months, filters.accounts],
        }),
      }),
      perAccount: background.query({
        defaultValue: [],
        query: () => ({
          queryFn: () => api.candidates.perAccount(filters),
          queryKey: ['candidates', 'per-account', filters.year, filters.months, filters.accounts],
        }),
      }),
      proctoring: background.query({
        defaultValue: [],
        query: () => ({
          queryFn: () => api.candidates.proctoring(filters),
          queryKey: ['candidates', 'proctoring', filters.year, filters.months, filters.accounts],
        }),
      }),
      performance: deferred.query({
        defaultValue: [],
        query: () => ({
          queryFn: () => api.candidates.performance(filters),
          queryKey: ['candidates', 'performance', filters.year, filters.months, filters.accounts],
        }),
      }),
      edof: deferred.query({
        defaultValue: [],
        query: () => ({
          queryFn: () => api.candidates.edof(filters),
          queryKey: ['candidates', 'edof', filters.year, filters.months, filters.accounts],
        }),
      }),
      cefr: deferred.query({
        defaultValue: [],
        query: () => ({ queryFn: api.candidates.cefr, queryKey: ['candidates', 'cefr'] }),
      }),
      delay: deferred.query({
        defaultValue: [],
        query: () => ({
          queryFn: () => api.candidates.delay(filters),
          queryKey: ['candidates', 'delay', filters.year, filters.months, filters.accounts],
        }),
      }),
    }),
  })
}

import { defineDashboardSchema } from '#ui-tools/dashboard'

import {
  CERT_ROWS,
  CURRENCIES,
  dashboardApi as api,
  MONTH_INDEXES,
  PRODUCT_IDS,
  YEARS,
} from '../data/dashboard'

function sum(values: readonly (number | null)[]) {
  return values.reduce<number>((total, value) => total + (value ?? 0), 0)
}

function cumulate(values: readonly (number | null)[]) {
  let total = 0
  return values.map((value) => (value === null ? null : (total += value)))
}

/**
 * Tableau de bord (identity4, Atelier): a shared `year`, a consumption view (currency, one remote
 * account, comparison toggle, tracked product lines) and a candidates view (months and accounts).
 */
export const analyticsDashboard = defineDashboardSchema({
  key: 'analytics',
  params: (p) => ({
    year: p.enum(YEARS, { defaultValue: 2026 }),
  }),
  views: (view) => ({
    consumption: view({
      label: 'Consommation',
      params: (p) => ({
        account: p.remote({
          load: api.accounts.search,
          pagination: { size: 20, type: 'page' },
          resolveSelected: ({ values }) => api.accounts.byIds(values),
          search: { debounce: 200 },
        }),
        compare: p.boolean({ defaultValue: true }),
        currency: p.enum(CURRENCIES, { defaultValue: 'EUR' }),
      }),
      queries: ({ background, deferred, essential, params }) => ({
        summary: essential.query(() => ({
          queryFn: () => api.consumption.summary(params),
          queryKey: ['analytics', 'summary', params.year, params.account, params.currency],
        })),
        months: essential.query({
          defaultValue: [],
          query: () => ({
            queryFn: () => api.consumption.months(params),
            queryKey: ['analytics', 'months', params.year, params.account],
          }),
        }),
        adminModes: essential.query({
          defaultValue: [],
          query: () => ({
            queryFn: () => api.consumption.adminModes(params),
            queryKey: ['analytics', 'modes', params.year, params.account],
          }),
        }),
        billing: background.query({
          defaultValue: [],
          query: () => ({
            queryFn: () => api.consumption.billing(params),
            queryKey: ['analytics', 'billing', params.year, params.account, params.currency],
          }),
        }),
        topProducts: background.query({
          defaultValue: [],
          query: () => ({
            queryFn: () => api.consumption.topProducts(params),
            queryKey: ['analytics', 'products', params.year, params.account],
          }),
        }),
        topCountries: background.query({
          defaultValue: [],
          query: () => ({
            queryFn: () => api.consumption.topCountries(params),
            queryKey: ['analytics', 'countries', params.year, params.account],
          }),
        }),
        topAccounts: background.query({
          defaultValue: [],
          query: () => ({
            queryFn: () => api.consumption.topAccounts(params),
            queryKey: ['analytics', 'top-accounts', params.year, params.account],
          }),
        }),
        productLines: deferred.query({
          defaultValue: [],
          params: (p) => ({
            tracked: p.enum(PRODUCT_IDS, { defaultValue: ['en-gen', 'en-biz'], multiple: true }),
          }),
          query: ({ params: widget }) => ({
            queryFn: () =>
              api.consumption.productLines({
                account: params.account,
                products: widget.tracked,
                year: params.year,
              }),
            queryKey: ['analytics', 'lines', params.year, params.account, widget.tracked],
          }),
        }),
        accountTypes: deferred.query({
          defaultValue: [],
          query: () => ({
            queryFn: api.consumption.accountTypes,
            queryKey: ['analytics', 'account-types'],
          }),
        }),
        margin: deferred.query({
          defaultValue: [],
          query: () => ({
            queryFn: () => api.consumption.margin(params),
            queryKey: ['analytics', 'margin', params.year],
          }),
        }),
      }),
      derive: ({ data }) => ({
        cumulative: () => {
          const current = cumulate(data.months.map((row) => row.used))
          const previous = cumulate(data.months.map((row) => row.previous))
          return data.months.map((row, index) => ({
            current: current[index] ?? null,
            month: row.month,
            previous: previous[index] ?? null,
          }))
        },
        projection: () => {
          const used = data.months.filter((row) => row.used !== null)
          return used.length ? (sum(used.map((row) => row.used)) / used.length) * 12 : 0
        },
      }),
    }),

    candidates: view({
      label: 'Candidats et certifications',
      params: (p) => ({
        accounts: p.options(
          CERT_ROWS.map((row) => ({ label: row.name, value: row.id })),
          { multiple: true },
        ),
        months: p.enum(MONTH_INDEXES, { multiple: true }),
      }),
      queries: ({ background, deferred, essential, params }) => ({
        summary: essential.query(() => ({
          queryFn: () => api.candidates.summary(params),
          queryKey: ['candidates', 'summary', params.year, params.months, params.accounts],
        })),
        registrations: essential.query({
          defaultValue: [],
          query: () => ({
            queryFn: () => api.candidates.registrations(params),
            queryKey: ['candidates', 'registrations', params.year, params.months, params.accounts],
          }),
        }),
        funnel: essential.query({
          defaultValue: [],
          query: () => ({
            queryFn: () => api.candidates.funnel(params),
            queryKey: ['candidates', 'funnel', params.year, params.months, params.accounts],
          }),
        }),
        perAccount: background.query({
          defaultValue: [],
          query: () => ({
            queryFn: () => api.candidates.perAccount(params),
            queryKey: ['candidates', 'per-account', params.year, params.months, params.accounts],
          }),
        }),
        proctoring: background.query({
          defaultValue: [],
          query: () => ({
            queryFn: () => api.candidates.proctoring(params),
            queryKey: ['candidates', 'proctoring', params.year, params.months, params.accounts],
          }),
        }),
        performance: deferred.query({
          defaultValue: [],
          query: () => ({
            queryFn: () => api.candidates.performance(params),
            queryKey: ['candidates', 'performance', params.year, params.months, params.accounts],
          }),
        }),
        edof: deferred.query({
          defaultValue: [],
          query: () => ({
            queryFn: () => api.candidates.edof(params),
            queryKey: ['candidates', 'edof', params.year, params.months, params.accounts],
          }),
        }),
        cefr: deferred.query({
          defaultValue: [],
          query: () => ({ queryFn: api.candidates.cefr, queryKey: ['candidates', 'cefr'] }),
        }),
        delay: deferred.query({
          defaultValue: [],
          query: () => ({
            queryFn: () => api.candidates.delay(params),
            queryKey: ['candidates', 'delay', params.year, params.months, params.accounts],
          }),
        }),
      }),
    }),
  }),
})

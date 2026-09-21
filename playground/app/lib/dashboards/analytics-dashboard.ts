import { defineDashboardSchema } from '#ui-tools/dashboard'

import {
  DASHBOARD_MONTHS,
  DASHBOARD_PRODUCTS,
  DASHBOARD_YEARS,
  demoDashboardApi,
  monthLabel,
} from '../demo-dashboard-api'

const api = demoDashboardApi

const accountPicker = {
  load: api.accounts.search,
  pagination: { size: 12, type: 'page' },
  resolveSelected: ({ values }: { values: readonly string[] }) => api.accounts.byIds(values),
  search: { debounce: 200 },
} as const

function sum(values: readonly (number | null)[]) {
  return values.reduce<number>((total, value) => total + (value ?? 0), 0)
}

function cumulate(values: readonly (number | null)[]) {
  let total = 0
  return values.map((value) => (value === null ? null : (total += value)))
}

/**
 * The analytics dashboard from the identity4 design exploration: a shared `year`, a consumption view
 * with currency / account / comparison params, and a candidates view with month and account filters.
 */
export const analyticsDashboard = defineDashboardSchema({
  key: 'analytics',
  params: (p) => ({
    year: p.enum(DASHBOARD_YEARS, { defaultValue: 2026 }),
  }),
  views: (view) => ({
    consumption: view({
      label: 'Consumption',
      params: (p) => ({
        account: p.remote(accountPicker),
        compare: p.boolean({ defaultValue: true }),
        currency: p.options(
          [
            { icon: 'i-lucide-euro', label: 'EUR', value: 'EUR' },
            { icon: 'i-lucide-dollar-sign', label: 'USD', value: 'USD' },
          ],
          { defaultValue: 'EUR' },
        ),
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
        billing: background.query({
          defaultValue: [],
          query: () => ({
            queryFn: () => api.consumption.billing(params),
            queryKey: ['analytics', 'billing', params.year, params.account, params.currency],
          }),
        }),
        adminModes: background.query({
          defaultValue: [],
          query: () => ({
            queryFn: api.consumption.adminModes,
            queryKey: ['analytics', 'admin-modes'],
          }),
        }),
        topProducts: background.query({
          defaultValue: [],
          query: () => ({
            queryFn: () => api.consumption.topProducts(params),
            queryKey: ['analytics', 'top-products', params.year],
          }),
        }),
        topCountries: background.query({
          defaultValue: [],
          query: () => ({
            queryFn: api.consumption.topCountries,
            queryKey: ['analytics', 'top-countries'],
          }),
        }),
        topAccounts: background.query({
          defaultValue: [],
          query: () => ({
            queryFn: () => api.consumption.topAccounts(params),
            queryKey: ['analytics', 'top-accounts', params.year],
          }),
        }),
        productLines: deferred.query({
          defaultValue: [],
          params: (p) => ({
            tracked: p.enum(
              DASHBOARD_PRODUCTS.map((product) => product.value),
              { defaultValue: ['en-gen', 'en-biz'], multiple: true },
            ),
          }),
          query: ({ params: widget }) => ({
            queryFn: () =>
              api.consumption.productLines({ products: widget.tracked, year: params.year }),
            queryKey: ['analytics', 'product-lines', params.year, widget.tracked],
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
        projection: () =>
          data.months.length
            ? (sum(data.months.map((row) => row.used)) / data.months.length) * 12
            : 0,
        averageMargin: () =>
          data.billing.length
            ? sum(data.billing.map((row) => row.margin)) / data.billing.length
            : 0,
        billedTotal: () => sum(data.billing.map((row) => row.billed)),
      }),
    }),

    candidates: view({
      label: 'Candidates & certifications',
      params: (p) => ({
        accounts: p.remote({ ...accountPicker, multiple: true }),
        months: p.options(
          DASHBOARD_MONTHS.map((month) => ({ label: monthLabel(month), value: month })),
          { multiple: true },
        ),
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
        funnel: background.query({
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
            queryKey: ['candidates', 'performance', params.accounts],
          }),
        }),
        edof: deferred.query({
          defaultValue: [],
          query: () => ({ queryFn: api.candidates.edof, queryKey: ['candidates', 'edof'] }),
        }),
        cefr: deferred.query({
          defaultValue: [],
          query: () => ({ queryFn: api.candidates.cefr, queryKey: ['candidates', 'cefr'] }),
        }),
        delay: deferred.query({
          defaultValue: [],
          query: () => ({ queryFn: api.candidates.delay, queryKey: ['candidates', 'delay'] }),
        }),
      }),
      derive: ({ data }) => ({
        registered: () => sum(data.registrations.map((row) => row.current)),
      }),
    }),
  }),
})

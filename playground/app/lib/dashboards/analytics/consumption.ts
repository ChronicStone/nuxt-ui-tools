import { defineDashboardView } from '#ui-tools/dashboard'

import { DASHBOARD_PRODUCTS, demoDashboardApi } from '../../demo-dashboard-api'
import { accountFilter, currencyFilter, periodFilters } from './filters'

const api = demoDashboardApi.consumption

function sum(values: readonly (number | null)[]) {
  return values.reduce<number>((total, value) => total + (value ?? 0), 0)
}

function cumulate(values: readonly (number | null)[]) {
  let total = 0
  return values.map((value) => (value === null ? null : (total += value)))
}

/** Consumption tab: the shared year, then an account, a currency, and the comparison year. */
export const consumptionView = defineDashboardView({
  label: 'Consumption',
  shared: periodFilters,
  params: (p, { params }) => ({
    account: accountFilter,
    currency: currencyFilter,
    compare: p.boolean({
      defaultValue: true,
      format: (on) => (on ? String(params.year - 1) : 'None'),
      label: 'Compare with',
    }),
  }),
  queries: ({ background, deferred, essential, params }) => ({
    summary: essential.query(() => ({
      queryFn: () => api.summary(params),
      queryKey: ['analytics', 'summary', params.year, params.account, params.currency],
    })),
    months: essential.query({
      defaultValue: [],
      query: () => ({
        queryFn: () => api.months(params),
        queryKey: ['analytics', 'months', params.year, params.account],
      }),
    }),
    billing: background.query({
      defaultValue: [],
      query: () => ({
        queryFn: () => api.billing(params),
        queryKey: ['analytics', 'billing', params.year, params.account, params.currency],
      }),
    }),
    adminModes: background.query({
      defaultValue: [],
      query: () => ({ queryFn: api.adminModes, queryKey: ['analytics', 'admin-modes'] }),
    }),
    topProducts: background.query({
      defaultValue: [],
      query: () => ({
        queryFn: () => api.topProducts(params),
        queryKey: ['analytics', 'top-products', params.year],
      }),
    }),
    topCountries: background.query({
      defaultValue: [],
      query: () => ({ queryFn: api.topCountries, queryKey: ['analytics', 'top-countries'] }),
    }),
    topAccounts: background.query({
      defaultValue: [],
      query: () => ({
        queryFn: () => api.topAccounts(params),
        queryKey: ['analytics', 'top-accounts', params.year],
      }),
    }),
    productLines: deferred.query({
      defaultValue: [],
      params: {
        tracked: (p) =>
          p.options(DASHBOARD_PRODUCTS, {
            defaultValue: ['en-gen', 'en-biz'],
            label: 'Tracked products',
            max: 4,
            multiple: true,
          }),
      },
      query: ({ params: widget }) => ({
        queryFn: () => api.productLines({ products: widget.tracked, year: params.year }),
        queryKey: ['analytics', 'product-lines', params.year, widget.tracked],
      }),
    }),
    accountTypes: deferred.query({
      defaultValue: [],
      query: () => ({ queryFn: api.accountTypes, queryKey: ['analytics', 'account-types'] }),
    }),
    margin: deferred.query({
      defaultValue: [],
      query: () => ({
        queryFn: () => api.margin(params),
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
      data.months.length ? (sum(data.months.map((row) => row.used)) / data.months.length) * 12 : 0,
    averageMargin: () =>
      data.billing.length ? sum(data.billing.map((row) => row.margin)) / data.billing.length : 0,
    billedTotal: () => sum(data.billing.map((row) => row.billed)),
  }),
})

import { defineDashboardView } from '#ui-tools/dashboard'

import {
  DASHBOARD_ACCOUNT_OPTIONS,
  DASHBOARD_PRODUCT_PRESETS,
  DASHBOARD_PRODUCTS,
  DASHBOARD_YEARS,
  demoDashboardApi,
} from '../../demo-dashboard-api'

const api = demoDashboardApi.consumption

function sum(values: readonly (number | null)[]) {
  return values.reduce<number>((total, value) => total + (value ?? 0), 0)
}

function cumulate(values: readonly (number | null)[]) {
  let total = 0
  return values.map((value) => (value === null ? null : (total += value)))
}

/** Consumption tab: a year, an account, a currency, and the year it compares with. */
export function consumptionView() {
  return defineDashboardView({
    label: 'Consumption',
    filters: (f) => {
      const year = f.enum(DASHBOARD_YEARS, { defaultValue: 2026, label: 'Year' })
      return {
        year,
        account: f.remote(DASHBOARD_ACCOUNT_OPTIONS, {
          label: 'Account',
          placeholder: 'All accounts',
        }),
        currency: f.options(
          [
            { icon: 'i-lucide-euro', label: 'EUR', value: 'EUR' },
            { icon: 'i-lucide-dollar-sign', label: 'USD', value: 'USD' },
          ],
          { defaultValue: 'EUR', label: 'Currency' },
        ),
        compare: f.boolean({
          defaultValue: true,
          format: (on) => (on ? String(year.value - 1) : 'None'),
          label: 'Compare with',
        }),
      }
    },
    queries: ({ background, deferred, essential, filters }) => ({
      summary: essential.query(() => ({
        queryFn: () => api.summary(filters),
        queryKey: ['analytics', 'summary', filters.year, filters.account, filters.currency],
      })),
      months: essential.query({
        defaultValue: [],
        query: () => ({
          queryFn: () => api.months(filters),
          queryKey: ['analytics', 'months', filters.year, filters.account],
        }),
      }),
      billing: background.query({
        defaultValue: [],
        query: () => ({
          queryFn: () => api.billing(filters),
          queryKey: ['analytics', 'billing', filters.year, filters.account, filters.currency],
        }),
      }),
      adminModes: background.query({
        defaultValue: [],
        query: () => ({ queryFn: api.adminModes, queryKey: ['analytics', 'admin-modes'] }),
      }),
      topProducts: background.query({
        defaultValue: [],
        query: () => ({
          queryFn: () => api.topProducts(filters),
          queryKey: ['analytics', 'top-products', filters.year],
        }),
      }),
      topCountries: background.query({
        defaultValue: [],
        query: () => ({ queryFn: api.topCountries, queryKey: ['analytics', 'top-countries'] }),
      }),
      topAccounts: background.query({
        defaultValue: [],
        query: () => ({
          queryFn: () => api.topAccounts(filters),
          queryKey: ['analytics', 'top-accounts', filters.year],
        }),
      }),
      productLines: deferred.query({
        defaultValue: [],
        filters: (f) => ({
          tracked: f.options(DASHBOARD_PRODUCTS, {
            defaultValue: ['en-gen', 'en-biz'],
            label: 'Tracked products',
            multiple: true,
            presets: DASHBOARD_PRODUCT_PRESETS.map((preset) => ({
              hint: String(preset.products.length),
              label: preset.label,
              value: [...preset.products],
            })),
          }),
        }),
        query: ({ filters: own }) => ({
          queryFn: () => api.productLines({ products: own.tracked, year: filters.year }),
          queryKey: ['analytics', 'product-lines', filters.year, own.tracked],
        }),
      }),
      accountTypes: deferred.query({
        defaultValue: [],
        query: () => ({ queryFn: api.accountTypes, queryKey: ['analytics', 'account-types'] }),
      }),
      margin: deferred.query({
        defaultValue: [],
        query: () => ({
          queryFn: () => api.margin(filters),
          queryKey: ['analytics', 'margin', filters.year],
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
        data.billing.length ? sum(data.billing.map((row) => row.margin)) / data.billing.length : 0,
      billedTotal: () => sum(data.billing.map((row) => row.billed)),
    }),
  })
}

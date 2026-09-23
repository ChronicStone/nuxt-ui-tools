import { defineDashboardView } from '#ui-tools/dashboard'

import {
  CURRENCIES,
  dashboardApi as api,
  PRODUCT_PRESETS,
  PRODUCTS,
  sum,
  YEARS,
} from '../../data/dashboard'

function cumulate(values: readonly (number | null)[]) {
  let total = 0
  return values.map((value) => (value === null ? null : (total += value)))
}

/**
 * Consommation (identity4): the year, the currency, one remote account, the comparison toggle,
 * and the product lines a chart tracks.
 */
export function consumptionView() {
  return defineDashboardView({
    label: 'Consommation',
    filters: (f) => {
      const year = f.enum(YEARS, { defaultValue: 2026, label: 'Année' })
      return {
        year,
        currency: f.enum(CURRENCIES, { defaultValue: 'EUR', label: 'Devise' }),
        account: f.remote(
          {
            load: api.accounts.search,
            pagination: { size: 20, type: 'page' },
            resolveSelected: ({ values }) => api.accounts.byIds(values),
            search: { debounce: 200 },
          },
          { label: 'Compte', placeholder: 'Tous les comptes' },
        ),
        compare: f.boolean({
          defaultValue: true,
          format: (on) => (on ? String(year.value - 1) : 'Aucune'),
          label: 'Comparer à',
        }),
      }
    },
    queries: ({ background, deferred, essential, filters }) => ({
      summary: essential.query(() => ({
        queryFn: () => api.consumption.summary(filters),
        queryKey: ['analytics', 'summary', filters.year, filters.account, filters.currency],
      })),
      months: essential.query({
        defaultValue: [],
        query: () => ({
          queryFn: () => api.consumption.months(filters),
          queryKey: ['analytics', 'months', filters.year, filters.account],
        }),
      }),
      adminModes: essential.query({
        defaultValue: [],
        query: () => ({
          queryFn: () => api.consumption.adminModes(filters),
          queryKey: ['analytics', 'modes', filters.year, filters.account],
        }),
      }),
      billing: background.query({
        defaultValue: [],
        query: () => ({
          queryFn: () => api.consumption.billing(filters),
          queryKey: ['analytics', 'billing', filters.year, filters.account, filters.currency],
        }),
      }),
      topProducts: background.query({
        defaultValue: [],
        query: () => ({
          queryFn: () => api.consumption.topProducts(filters),
          queryKey: ['analytics', 'products', filters.year, filters.account],
        }),
      }),
      topCountries: background.query({
        defaultValue: [],
        query: () => ({
          queryFn: () => api.consumption.topCountries(filters),
          queryKey: ['analytics', 'countries', filters.year, filters.account],
        }),
      }),
      topAccounts: background.query({
        defaultValue: [],
        query: () => ({
          queryFn: () => api.consumption.topAccounts(filters),
          queryKey: ['analytics', 'top-accounts', filters.year, filters.account],
        }),
      }),
      productLines: deferred.query({
        defaultValue: [],
        filters: (f) => ({
          tracked: f.options(
            PRODUCTS.map((product) => ({
              hint: product.version,
              label: product.label,
              value: product.id,
            })),
            {
              defaultValue: ['en-gen', 'en-biz'],
              label: 'Produits suivis',
              multiple: true,
              presets: PRODUCT_PRESETS.map((preset) => ({
                hint: `${preset.products.length} produits`,
                label: preset.label,
                value: preset.products,
              })),
            },
          ),
        }),
        query: ({ filters: own }) => ({
          queryFn: () =>
            api.consumption.productLines({
              account: filters.account,
              products: own.tracked,
              year: filters.year,
            }),
          queryKey: ['analytics', 'lines', filters.year, filters.account, own.tracked],
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
          queryFn: () => api.consumption.margin(filters),
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
      projection: () => {
        const used = data.months.filter((row) => row.used !== null)
        return used.length ? (sum(used.map((row) => row.used)) / used.length) * 12 : 0
      },
      billedTotal: () => sum(data.billing.map((row) => row.billed)),
      averageMargin: () => {
        const margins = data.billing.flatMap((row) => (row.margin === null ? [] : [row.margin]))
        return margins.length ? sum(margins) / margins.length : 0
      },
    }),
  })
}

import { defineDashboardFilter, defineDashboardFilters } from '#ui-tools/dashboard'

import { DASHBOARD_YEARS, demoDashboardApi } from '../../demo-dashboard-api'

/** Searchable, paginated account source shared by the single and the multiple account filters. */
const accounts = {
  load: demoDashboardApi.accounts.search,
  pagination: { size: 12, type: 'page' },
  resolveSelected: ({ values }: { values: readonly string[] }) =>
    demoDashboardApi.accounts.byIds(values),
  search: { debounce: 200 },
} as const

export const yearFilter = defineDashboardFilter((p) =>
  p.enum(DASHBOARD_YEARS, { defaultValue: 2026, label: 'Year' }),
)

export const accountFilter = defineDashboardFilter((p) =>
  p.remote(accounts, { label: 'Account', placeholder: 'All accounts' }),
)

export const accountsFilter = defineDashboardFilter((p) =>
  p.remote(accounts, { label: 'Accounts', multiple: true }),
)

export const currencyFilter = defineDashboardFilter((p) =>
  p.options(
    [
      { icon: 'i-lucide-euro', label: 'EUR', value: 'EUR' },
      { icon: 'i-lucide-dollar-sign', label: 'USD', value: 'USD' },
    ],
    { defaultValue: 'EUR', label: 'Currency' },
  ),
)

/** The period every view reads. */
export const periodFilters = defineDashboardFilters({ year: yearFilter })

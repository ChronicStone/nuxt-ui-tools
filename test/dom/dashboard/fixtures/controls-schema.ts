import {
  defineDashboardFilter,
  defineDashboardFilters,
  defineDashboardSchema,
  defineDashboardView,
} from '#ui-tools/dashboard'
import type { InferDashboard } from '#ui-tools/dashboard'

import { deferredSource } from '../harness'

export const ACCOUNTS = [
  { id: 'a1', name: 'Acme' },
  { id: 'a2', name: 'Globex' },
  { id: 'a3', name: 'Initech' },
]

export function createControlsSchema() {
  const accounts = deferredSource<{ id: string; name: string }[]>()
  const periodFilters = defineDashboardFilters({
    year: defineDashboardFilter((p) => p.enum([2025, 2026], { defaultValue: 2026, label: 'Year' })),
  })
  const usageView = defineDashboardView({
    label: 'Usage',
    shared: periodFilters,
    params: {
      account: (p) =>
        p.remote(
          {
            load: ({ search }) =>
              accounts.fn(search).then((rows) => ({
                hasMore: false,
                options: rows.map((row) => ({ label: row.name, value: row.id })),
              })),
          },
          { label: 'Account', placeholder: 'All accounts' },
        ),
      months: (p) =>
        p.enum([1, 2, 3, 4, 5, 6], {
          columns: 3,
          format: (month) => `M${month}`,
          label: 'Months',
          multiple: true,
          presets: [{ hint: '3', label: 'First quarter', value: [1, 2, 3] }],
        }),
      compare: (p) => p.boolean({ defaultValue: true, label: 'Compare' }),
      day: (p) => p.string({ label: 'Day' }),
      tenant: (p) => p.string({ headless: true, label: 'Tenant' }),
    },
  })
  const funnelView = defineDashboardView({ label: 'Funnel', shared: periodFilters })
  const schema = defineDashboardSchema({
    key: 'controls',
    params: periodFilters,
    views: { funnel: funnelView, usage: usageView },
  })
  return { accounts, schema }
}

export type ControlsDashboard = InferDashboard<ReturnType<typeof createControlsSchema>['schema']>

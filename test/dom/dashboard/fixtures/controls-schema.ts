import { defineDashboardSchema, defineDashboardView } from '#ui-tools/dashboard'
import type { InferDashboard } from '#ui-tools/dashboard'

import { deferredSource } from '../harness'

export const ACCOUNTS = [
  { id: 'a1', name: 'Acme' },
  { id: 'a2', name: 'Globex' },
  { id: 'a3', name: 'Initech' },
]

type AccountSource = ReturnType<typeof deferredSource<{ id: string; name: string }[]>>

function funnelView() {
  return defineDashboardView({
    label: 'Funnel',
    filters: (f) => ({ year: f.enum([2025, 2026], { defaultValue: 2026, label: 'Year' }) }),
  })
}

function usageView(params: { accounts: AccountSource }) {
  return defineDashboardView({
    label: 'Usage',
    filters: (f) => ({
      year: f.enum([2025, 2026], { defaultValue: 2026, label: 'Year' }),
      account: f.remote(
        {
          load: ({ search }) =>
            params.accounts.fn(search).then((rows) => ({
              hasMore: false,
              options: rows.map((row) => ({ label: row.name, value: row.id })),
            })),
        },
        { label: 'Account', placeholder: 'All accounts' },
      ),
      months: f.enum([1, 2, 3, 4, 5, 6], {
        columns: 3,
        format: (month) => `M${month}`,
        label: 'Months',
        multiple: true,
        presets: [{ hint: '3', label: 'First quarter', value: [1, 2, 3] }],
      }),
      compare: f.boolean({ defaultValue: true, label: 'Compare' }),
      day: f.string({ label: 'Day' }),
      tenant: f.string({ headless: true, label: 'Tenant' }),
    }),
  })
}

export function controlsSchema(params: { accounts: AccountSource }) {
  return defineDashboardSchema({
    key: 'controls',
    views: { funnel: funnelView(), usage: usageView(params) },
  })
}

export function createControlsSchema() {
  const accounts = deferredSource<{ id: string; name: string }[]>()
  return { accounts, schema: controlsSchema({ accounts }) }
}

export type ControlsDashboard = InferDashboard<typeof controlsSchema>

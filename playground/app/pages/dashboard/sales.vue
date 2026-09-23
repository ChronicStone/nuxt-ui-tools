<script setup lang="ts">
import { defineDashboardSchema, useDashboard, useDashboardFormat } from '#ui-tools/dashboard'

import { DASHBOARD_YEARS, demoDashboardApi } from '../../lib/demo-dashboard-api'

const api = demoDashboardApi.consumption

// A small dashboard fits in one file: filters, queries, and derived values, typed end to end.
const salesSchema = defineDashboardSchema({
  key: 'sales',
  filters: (f) => ({
    year: f.enum(DASHBOARD_YEARS, { defaultValue: 2026, label: 'Year' }),
  }),
  queries: ({ background, essential, filters }) => ({
    summary: essential.query(() => ({
      queryFn: () => api.summary({ currency: 'EUR', year: filters.year }),
      queryKey: ['sales', 'summary', filters.year],
    })),
    months: essential.query({
      defaultValue: [],
      query: () => ({
        queryFn: () => api.months({ year: filters.year }),
        queryKey: ['sales', 'months', filters.year],
      }),
    }),
    accounts: background.query({
      defaultValue: [],
      query: () => ({
        queryFn: () => api.topAccounts({ year: filters.year }),
        queryKey: ['sales', 'accounts', filters.year],
      }),
    }),
  }),
  derive: ({ data }) => ({
    best: () => data.months.reduce((best, row) => Math.max(best, row.used), 0),
  }),
})

const dashboard = useDashboard(salesSchema)
const format = useDashboardFormat()
</script>

<template>
  <PlaygroundContent mode="fixed">
    <NutDashboardPage :dashboard title="Sales">
      <NutDashboardGrid>
        <NutDashboardStat
          size="12 md:4"
          :source="dashboard.summary"
          label="Units"
          :value="(summary) => summary.units"
          :compare="(summary) => summary.unitsPrevious"
          format="integer"
        />
        <NutDashboardStat
          size="12 md:4"
          :source="dashboard.best"
          label="Best month"
          :value="(best) => best"
          format="integer"
          caption="units in a single month"
        />
        <NutDashboardStat
          size="12 md:4"
          :source="dashboard.summary"
          label="Accounts"
          :value="(summary) => summary.accounts"
          format="integer"
        />
        <NutDashboardBarChart
          size="12 lg:8"
          :source="dashboard.months"
          title="Units per month"
          :x="(row) => format.month(row.month + 1)"
          :series="[{ key: 'used', label: 'Units', value: (row) => row.used }]"
          :legend="false"
          format="integer"
          totals
        />
        <NutDashboardList
          size="12 lg:4"
          :source="dashboard.accounts"
          title="Top accounts"
          leading="avatar"
          :label="(row) => row.name"
          :value="(row) => row.units"
          format="integer"
        />
      </NutDashboardGrid>
    </NutDashboardPage>
  </PlaygroundContent>
</template>

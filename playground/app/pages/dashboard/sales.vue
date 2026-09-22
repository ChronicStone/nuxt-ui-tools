<script setup lang="ts">
import { defineDashboardSchema, useDashboard, useDashboardFormat } from '#ui-tools/dashboard'

import { DASHBOARD_YEARS, demoDashboardApi } from '../../lib/demo-dashboard-api'

const api = demoDashboardApi.consumption

// A small dashboard fits in one file: params, queries, and derived values, typed end to end.
const salesDashboard = defineDashboardSchema({
  key: 'sales',
  params: (p) => ({
    year: p.enum(DASHBOARD_YEARS, { defaultValue: 2026, label: 'Year' }),
  }),
  queries: ({ background, essential, params }) => ({
    summary: essential.query(() => ({
      queryFn: () => api.summary({ currency: 'EUR', year: params.year }),
      queryKey: ['sales', 'summary', params.year],
    })),
    months: essential.query({
      defaultValue: [],
      query: () => ({
        queryFn: () => api.months({ year: params.year }),
        queryKey: ['sales', 'months', params.year],
      }),
    }),
    accounts: background.query({
      defaultValue: [],
      query: () => ({
        queryFn: () => api.topAccounts({ year: params.year }),
        queryKey: ['sales', 'accounts', params.year],
      }),
    }),
  }),
  derive: ({ data }) => ({
    best: () => data.months.reduce((best, row) => Math.max(best, row.used), 0),
  }),
})

const dashboard = useDashboard(salesDashboard)
const format = useDashboardFormat()
</script>

<template>
  <PlaygroundContent mode="document">
    <div class="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
      <header class="flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-2xl font-semibold tracking-tight text-highlighted">Sales</h1>
        <NutDashboardFilters :dashboard />
      </header>

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
    </div>
  </PlaygroundContent>
</template>

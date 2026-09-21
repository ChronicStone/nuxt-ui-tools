<script setup lang="ts">
import { defineDashboardSchema, useDashboard } from '#ui-tools/dashboard'

import { demoDashboardApi, monthLabel } from '../../lib/demo-dashboard-api'

const api = demoDashboardApi.consumption

const salesDashboard = defineDashboardSchema({
  key: 'sales',
  params: (p) => ({
    year: p.enum([2024, 2025, 2026], { defaultValue: 2026 }),
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
const nf = new Intl.NumberFormat('en').format
</script>

<template>
  <PlaygroundContent mode="document">
    <div class="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
      <header class="flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-2xl font-semibold tracking-tight text-highlighted">Sales</h1>
        <USelect
          v-model="dashboard.params.year"
          v-bind="dashboard.options.year.menu"
          class="w-28"
        />
      </header>

      <NutDashboardGrid>
        <NutDashboardStat
          size="12 md:4"
          :source="dashboard.summary"
          label="Units"
          :value="(summary) => summary.units"
          :delta="
            (summary) => ((summary.units - summary.unitsPrevious) / summary.unitsPrevious) * 100
          "
        />
        <NutDashboardStat
          size="12 md:4"
          :source="dashboard.best"
          label="Best month"
          :value="(best) => best"
          caption="units in a single month"
        />
        <NutDashboardStat
          size="12 md:4"
          :source="dashboard.summary"
          label="Accounts"
          :value="(summary) => summary.accounts"
        />
        <NutDashboardBarChart
          size="12 lg:8"
          :source="dashboard.months"
          title="Units per month"
          :x="(row) => monthLabel(row.month)"
          :series="[{ key: 'used', label: 'Units', value: (row) => row.used }]"
          :legend="false"
        />
        <NutDashboardList
          size="12 lg:4"
          :source="dashboard.accounts"
          title="Top accounts"
          leading="avatar"
          :label="(row) => row.name"
          :value="(row) => nf(row.units)"
        />
      </NutDashboardGrid>
    </div>
  </PlaygroundContent>
</template>

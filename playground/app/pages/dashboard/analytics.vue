<script setup lang="ts">
import { useDashboard } from '#ui-tools/dashboard'

import { analyticsDashboard } from '../../lib/dashboards/analytics/schema'

// The page creates the dashboard; tab components read their view with `useDashboardView`.
const dashboard = useDashboard(analyticsDashboard)
</script>

<template>
  <PlaygroundContent mode="document">
    <div class="mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
      <header class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold tracking-tight text-highlighted">Dashboard</h1>
          <p class="mt-1 text-sm text-muted">
            Standalone filters and views, typed injection, staged queries, and state-aware blocks.
          </p>
        </div>
        <NutDashboardRefresh :dashboard />
      </header>

      <NutDashboardViewTabs :dashboard />

      <NutDashboardFilters :dashboard>
        <template #trailing>
          <UButton
            class="ms-auto"
            color="neutral"
            variant="outline"
            size="sm"
            icon="i-lucide-download"
            label="Export"
          />
        </template>
      </NutDashboardFilters>

      <DashboardAnalyticsConsumption v-if="dashboard.view.current === 'consumption'" />
      <DashboardAnalyticsCandidates v-else />
    </div>
  </PlaygroundContent>
</template>

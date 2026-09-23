<script setup lang="ts">
import { useDashboard } from '#ui-tools/dashboard'

import { analyticsSchema } from '../../lib/dashboards/analytics/schema'

const dashboard = useDashboard(analyticsSchema)
</script>

<template>
  <PlaygroundContent mode="fixed">
    <NutDashboardPage
      :dashboard
      title="Dashboard"
      :actions="[{ icon: 'i-lucide-download', label: 'Export' }]"
    >
      <template #consumption><DashboardAnalyticsConsumption /></template>
      <template #candidates><DashboardAnalyticsCandidates /></template>
    </NutDashboardPage>
  </PlaygroundContent>
</template>

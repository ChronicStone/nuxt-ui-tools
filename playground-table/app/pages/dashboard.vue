<script setup lang="ts">
import { useDashboard } from '#ui-tools/dashboard'

import { analyticsSchema } from '../dashboards/analytics'

const dashboard = useDashboard(analyticsSchema)
</script>

<template>
  <NutDashboardPage
    :dashboard
    title="Tableau de bord"
    :actions="[{ icon: 'i-lucide-download', label: 'Exporter' }]"
  >
    <template #consumption><DashboardConsumption /></template>
    <template #candidates><DashboardCandidates /></template>
    <template #operations><DashboardOperations /></template>
  </NutDashboardPage>
</template>

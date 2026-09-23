<script setup lang="ts">
import { useDashboard } from '#ui-tools/dashboard'

import { operationsSchema } from '../../lib/dashboards/operations'

// Operational blocks on the stock theme: no dashboard tokens or class overrides in this app.
const dashboard = useDashboard(operationsSchema)
</script>

<template>
  <PlaygroundContent mode="fixed">
    <NutDashboardPage :dashboard title="Operations">
      <DashboardOperationsOverview />
    </NutDashboardPage>
  </PlaygroundContent>
</template>

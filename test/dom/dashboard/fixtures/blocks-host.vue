<script setup lang="ts">
import DashboardBarChart from '#ui-tools/dashboard/components/dashboard-bar-chart.vue'
import DashboardFunnel from '#ui-tools/dashboard/components/dashboard-funnel.vue'
import DashboardGrid from '#ui-tools/dashboard/components/dashboard-grid.vue'
import DashboardList from '#ui-tools/dashboard/components/dashboard-list.vue'
import DashboardStat from '#ui-tools/dashboard/components/dashboard-stat.vue'
import DashboardWidget from '#ui-tools/dashboard/components/dashboard-widget.vue'

import type { BlockScenario, BlocksDashboard } from './blocks-schema'

defineProps<{ dashboard: BlocksDashboard; scenario: BlockScenario }>()
</script>

<template>
  <DashboardGrid v-if="scenario === 'stat'" columns="4">
    <DashboardStat
      size="2"
      :source="dashboard.summary"
      label="Revenue"
      :value="(data) => data.revenue"
      :format="(value) => `${value} €`"
      :delta="(data) => ((data.revenue - data.previous) / data.previous) * 100"
      :caption="(data) => `vs ${data.previous}`"
    />
  </DashboardGrid>

  <DashboardList
    v-else-if="scenario === 'list'"
    :source="dashboard.accounts"
    title="Top accounts"
    leading="avatar"
    :label="(row) => row.name"
    :description="(row) => row.kind"
    :delta="(row) => row.change"
    :value="(row) => row.units"
  />

  <DashboardList
    v-else-if="scenario === 'empty-list'"
    :source="dashboard.accounts"
    :empty="{ title: 'No account yet' }"
    :label="(row) => row.name"
  />

  <DashboardWidget v-else-if="scenario === 'widget'" :source="dashboard.growth" title="Growth">
    <template #default="{ data }">
      <output>{{ `${data.toFixed(1)}%` }}</output>
    </template>
  </DashboardWidget>

  <DashboardFunnel
    v-else-if="scenario === 'funnel'"
    :source="dashboard.steps"
    activation="mount"
    :label="(step) => step.label"
    :value="(step) => step.count"
  />

  <template v-else-if="scenario === 'panels'">
    <DashboardGrid variant="panels" columns="2">
      <DashboardStat
        size="1"
        :source="dashboard.summary"
        label="In a panel"
        :value="(data) => data.revenue"
      />
    </DashboardGrid>
    <DashboardGrid>
      <DashboardStat
        :source="dashboard.summary"
        label="Standalone"
        :value="(data) => data.revenue"
      />
    </DashboardGrid>
  </template>

  <DashboardList
    v-else-if="scenario === 'toolbar'"
    :source="dashboard.accounts"
    title="Accounts"
    :label="(row) => row.name"
  >
    <template #toolbar>
      <span data-test="chip">Active filter</span>
    </template>
    <template #footer>
      <span data-test="total">Total</span>
    </template>
  </DashboardList>

  <DashboardBarChart
    v-else-if="scenario === 'bar-chart'"
    :source="dashboard.months"
    title="Consumption"
    :x="(row) => row.month"
    :series="[
      { key: 'used', label: 'Used', value: (row) => row.used },
      { key: 'billed', label: 'Billed', value: (row) => row.billed },
    ]"
    :comparison="{ key: 'previous', label: '2025', value: (row) => row.billed / 2 }"
  />
</template>

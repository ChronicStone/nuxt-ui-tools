<script setup lang="ts">
import DashboardList from '#ui-tools/dashboard/components/dashboard-list.vue'
import DashboardStat from '#ui-tools/dashboard/components/dashboard-stat.vue'
import DashboardWidget from '#ui-tools/dashboard/components/dashboard-widget.vue'

import type { BlocksDashboard } from './blocks-schema'

defineProps<{ dashboard: BlocksDashboard }>()
</script>

<!-- Compile-time contract: accessors and slot scopes are typed from `:source`. -->
<template>
  <!-- @vue-expect-error `revenu` is not a field of the summary -->
  <DashboardStat :source="dashboard.summary" label="Revenue" :value="(data) => data.revenu" />

  <!-- @vue-expect-error rows are accounts, `title` does not exist -->
  <DashboardList :source="dashboard.accounts" :label="(row) => row.title" />

  <DashboardWidget :source="dashboard.growth">
    <template #default="{ data }">
      <!-- @vue-expect-error derived data is a number -->
      {{ data.toUpperCase() }}
    </template>
  </DashboardWidget>
</template>

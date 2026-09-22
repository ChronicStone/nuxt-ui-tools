<script setup lang="ts">
import DashboardFilter from '#ui-tools/dashboard/components/dashboard-filter.vue'
import DashboardFilters from '#ui-tools/dashboard/components/dashboard-filters.vue'
import DashboardViewTabs from '#ui-tools/dashboard/components/dashboard-view-tabs.vue'

import type { ControlsDashboard } from './controls-schema'

const { dashboard, scenario } = defineProps<{
  dashboard: ControlsDashboard
  scenario: 'bar' | 'slots' | 'button' | 'presets' | 'pair'
}>()
</script>

<template>
  <DashboardViewTabs :dashboard />

  <DashboardFilters v-if="scenario === 'bar'" :dashboard />

  <DashboardFilters v-else-if="scenario === 'slots'" :dashboard :exclude="['compare']">
    <template #account="{ filter }">
      <span data-custom-account>{{ filter.label }}: {{ filter.display }}</span>
    </template>
    <template #item="{ item, selected }">
      <span data-custom-item :data-on="selected || undefined">{{ item.label }}</span>
    </template>
    <template #trailing>
      <span data-trailing />
    </template>
  </DashboardFilters>

  <template v-else-if="scenario === 'pair'">
    <DashboardFilter
      :filter="dashboard.usage.filters.months"
      variant="button"
      label="Add"
      list="options"
      data-pair="options"
    />
    <DashboardFilter
      :filter="dashboard.usage.filters.months"
      variant="button"
      label="Presets"
      list="presets"
      data-pair="presets"
    />
  </template>

  <DashboardFilter
    v-else-if="scenario === 'presets'"
    :filter="dashboard.usage.filters.months"
    variant="button"
    list="presets"
    label="Presets"
  />

  <DashboardFilter
    v-else
    :filter="dashboard.usage.filters.months"
    variant="button"
    icon="i-lucide-plus"
    label="Add"
  >
    <template #footer>
      <button type="button" data-preset @click="dashboard.usage.params.months = [1, 2, 3]">
        Q1
      </button>
    </template>
  </DashboardFilter>

  <!-- Compile-time contract: bars take the keys of the filters they may show. -->
  <!-- @vue-expect-error `region` is not a filter of this dashboard -->
  <DashboardFilters v-if="false" :dashboard :only="['region']" />
</template>

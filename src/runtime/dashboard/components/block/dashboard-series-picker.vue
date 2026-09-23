<script setup lang="ts">
import { useUiToolsLocale } from '#ui-tools/i18n'

import type { DashboardFilterControl } from '../../types'
import DashboardFilter from '../dashboard-filter.vue'

/** Header controls of a chart whose series a filter picks: add from the options, pick a preset. */
defineProps<{ filter: DashboardFilterControl }>()

const { t } = useUiToolsLocale()
</script>

<template>
  <div class="flex items-center gap-1.5" data-series-picker>
    <DashboardFilter
      v-if="filter.items.length"
      :filter
      variant="button"
      icon="i-lucide-plus"
      :label="t('dashboard.series.add')"
      list="options"
    />
    <DashboardFilter
      v-if="filter.presets.length"
      :filter
      variant="button"
      icon="i-lucide-layers"
      :label="t('dashboard.filters.presets')"
      list="presets"
    />
  </div>
</template>

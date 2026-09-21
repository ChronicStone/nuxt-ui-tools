<script setup lang="ts">
import { computed } from 'vue'

import type { LazyTextValue } from '#ui-tools/shared/types/utils'
import { resolveTextValue } from '#ui-tools/shared/utils/render'

import { useDashboardUi } from '../composables/use-dashboard-ui'
import type { DashboardTotalUi } from '../types'
import { resolveDashboardClasses } from '../utils/ui'

const props = defineProps<{
  label: LazyTextValue
  value: LazyTextValue
  ui?: DashboardTotalUi
}>()

const appUi = useDashboardUi()
const label = computed(() => resolveTextValue(props.label))
const value = computed(() => resolveTextValue(props.value))
// Consecutive totals share one rule: only the first of a run draws the top border.
const classes = computed(() =>
  resolveDashboardClasses(
    {
      label: 'truncate text-[12.5px] text-muted',
      root: 'flex items-baseline justify-between gap-3 border-t border-[var(--nut-dash-grid)] pt-3 [&+&]:border-t-0 [&+&]:pt-1.5',
      value: 'shrink-0 text-sm font-semibold text-highlighted tabular-nums',
    },
    appUi.value.total,
    props.ui,
  ),
)
</script>

<template>
  <div :class="classes.root">
    <span :class="classes.label">{{ label }}</span>
    <b :class="classes.value">{{ value }}</b>
  </div>
</template>

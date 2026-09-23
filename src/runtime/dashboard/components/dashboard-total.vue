<script setup lang="ts">
import { computed } from 'vue'

import type { LazyTextValue } from '#ui-tools/shared/types/utils'
import { isNumber } from '#ui-tools/shared/utils/predicate'
import { resolveTextValue } from '#ui-tools/shared/utils/render'

import { DASHBOARD_MISSING_VALUE, useDashboardFormat } from '../composables/use-dashboard-format'
import { useDashboardUi } from '../composables/use-dashboard-ui'
import type { DashboardTotalUi, DashboardValueFormat } from '../types'
import { resolveDashboardClasses } from '../utils/ui'

const props = defineProps<{
  label: LazyTextValue
  /**
   * Numbers go through `format` (locale number format by default); text shows as is; `null` /
   * `undefined` show "—".
   */
  value: LazyTextValue | null | undefined
  format?: DashboardValueFormat
  ui?: DashboardTotalUi
}>()

const appUi = useDashboardUi()
const formats = useDashboardFormat()
const label = computed(() => resolveTextValue(props.label))
const value = computed(() => {
  const resolved = typeof props.value === 'function' ? props.value() : props.value
  if (resolved === null || resolved === undefined) return DASHBOARD_MISSING_VALUE
  return isNumber(resolved) ? formats.resolve(props.format)(resolved) : resolveTextValue(resolved)
})
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

<script setup lang="ts" generic="TRow">
import { computed } from 'vue'

import type { LazyTextValue } from '#ui-tools/shared/types/utils'
import { resolveTextValue } from '#ui-tools/shared/utils/render'

import { useDashboardFormat } from '../composables/use-dashboard-format'
import { useDashboardUi } from '../composables/use-dashboard-ui'
import type {
  DashboardBlockBaseProps,
  DashboardBlockUi,
  DashboardPairedBarsUi,
  DashboardSeriesColor,
  DashboardSourceLike,
  DashboardValueFormat,
} from '../types'
import { resolveDashboardColor } from '../utils/charts'
import { resolveDashboardClasses } from '../utils/ui'
import DashboardSkeleton from './block/dashboard-skeleton.vue'
import DashboardCard from './dashboard-card.vue'

const {
  source,
  card = true,
  label,
  total,
  value,
  totalLabel,
  valueLabel,
  format,
  colors,
  limit,
  rowKey,
  ui,
  ...block
} = defineProps<
  Omit<DashboardBlockBaseProps, 'ui'> & {
    source: DashboardSourceLike<readonly TRow[] | undefined>
    label: (row: TRow) => LazyTextValue
    /** Outer bar (e.g. registered). Scaled against the largest total. */
    total: (row: TRow) => number
    /** Inner bar, drawn inside the total (e.g. delivered). */
    value: (row: TRow) => number
    /** Legend labels. When both are set, a legend renders in the header. */
    totalLabel?: LazyTextValue
    valueLabel?: LazyTextValue
    format?: DashboardValueFormat
    /** `[total, value]` colors. */
    colors?: readonly [DashboardSeriesColor, DashboardSeriesColor]
    limit?: number
    rowKey?: (row: TRow, index: number) => PropertyKey
    ui?: DashboardBlockUi & DashboardPairedBarsUi
  }
>()

defineSlots<{
  'header-right'?: () => unknown
  toolbar?: () => unknown
  footer?: () => unknown
}>()

const formats = useDashboardFormat()
const appUi = useDashboardUi()
const classes = computed(() =>
  resolveDashboardClasses(
    {
      label: 'truncate text-[13px] text-default',
      row: 'grid grid-cols-[minmax(0,150px)_1fr_auto] items-center gap-3 py-1.5 max-sm:grid-cols-[minmax(0,110px)_1fr_auto]',
      track: 'h-3 overflow-hidden rounded-full bg-[var(--nut-dash-track)]',
      value: 'flex min-w-[130px] items-baseline justify-end gap-[5px] tabular-nums max-sm:min-w-0',
    },
    appUi.value.pairedBars,
    ui,
  ),
)

const totalColor = computed(() => resolveDashboardColor(colors?.[0] ?? 'series-4', 3))
const valueColor = computed(() => resolveDashboardColor(colors?.[1] ?? 'series-1', 0))
const legend = computed(() =>
  totalLabel && valueLabel
    ? [
        { color: totalColor.value, key: 'total', label: resolveTextValue(totalLabel) },
        { color: valueColor.value, key: 'value', label: resolveTextValue(valueLabel) },
      ]
    : undefined,
)
const rows = computed(() => {
  const data = source.data ?? []
  const visible = limit ? data.slice(0, limit) : data
  const largest = Math.max(0, ...visible.map((row) => total(row)))
  const formatValue = format ?? formats.number.value
  return visible.map((row, index) => {
    const outer = total(row)
    const inner = value(row)
    return {
      inner: formatValue(inner),
      innerWidth: outer > 0 ? `${Math.min(100, (inner / outer) * 100)}%` : '0%',
      key: rowKey?.(row, index) ?? index,
      label: resolveTextValue(label(row)),
      outer: formatValue(outer),
      outerWidth: largest > 0 ? `${(outer / largest) * 100}%` : '0%',
      ratio: outer > 0 ? formats.percent.value(Math.round((inner / outer) * 100)) : '',
    }
  })
})
</script>

<template>
  <DashboardCard v-bind="block" :card :ui :source :legend :is-empty="rows.length === 0">
    <template #skeleton>
      <DashboardSkeleton kind="paired" :count="limit ?? 8" />
    </template>
    <template v-if="$slots['header-right']" #header-right>
      <slot name="header-right" />
    </template>
    <template v-if="$slots.toolbar" #toolbar>
      <slot name="toolbar" />
    </template>
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>

    <ul class="flex flex-col">
      <li v-for="entry in rows" :key="entry.key" :class="classes.row">
        <span :class="classes.label" :title="entry.label">{{ entry.label }}</span>
        <div :class="classes.track">
          <div
            class="relative h-full rounded-full transition-[width] duration-500 ease-out"
            :style="{ background: totalColor, width: entry.outerWidth }"
          >
            <div
              class="absolute inset-y-0 start-0 rounded-full transition-[width] duration-500 ease-out"
              :style="{ background: valueColor, width: entry.innerWidth }"
            />
          </div>
        </div>
        <span :class="classes.value">
          <b class="text-[13.5px] font-semibold text-highlighted">{{ entry.inner }}</b>
          <span class="text-xs text-muted">/ {{ entry.outer }}</span>
          <small class="min-w-[34px] text-end text-[11.5px] text-dimmed max-sm:hidden">
            {{ entry.ratio }}
          </small>
        </span>
      </li>
    </ul>
  </DashboardCard>
</template>

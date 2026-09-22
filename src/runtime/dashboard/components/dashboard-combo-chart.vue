<script setup lang="ts" generic="TRow">
import { useMounted } from '@vueuse/core'
import { computed } from 'vue'

import type { LazyTextValue } from '#ui-tools/shared/types/utils'

import {
  resolveDashboardExpandedHeight,
  useDashboardChart,
} from '../composables/use-dashboard-chart'
import type {
  DashboardAxisOptions,
  DashboardBlockBaseProps,
  DashboardChartTotals,
  DashboardHighlight,
  DashboardReferenceLine,
  DashboardSelected,
  DashboardSelectEvent,
  DashboardSeries,
  DashboardSourceLike,
  DashboardValueFormat,
} from '../types'
import DashboardSkeleton from './block/dashboard-skeleton.vue'
import { dashboardChartRenderer } from './charts/renderer'
import DashboardCard from './dashboard-card.vue'
import DashboardTotal from './dashboard-total.vue'

const {
  source,
  card = true,
  menu = undefined,
  freshness = undefined,
  x,
  xFormat,
  xLabel,
  series,
  yAxis,
  y2Axis,
  format,
  reference,
  height = 250,
  legend = true,
  points = 12,
  highlight,
  selected,
  labels = false,
  totals,
  onSelect,
  ...block
} = defineProps<
  DashboardBlockBaseProps & {
    source: DashboardSourceLike<readonly TRow[] | undefined>
    x: (row: TRow, index: number) => string | number | Date
    xFormat?: (value: string | number | Date) => string
    /** Header of the category column in the table view and CSV export. */
    xLabel?: LazyTextValue
    /**
     * Mixed series: each one declares `type` (`'bar'` by default, `'line'`, `'area'`) and `axis`
     * (`'left'` by default, `'right'` for the secondary value axis).
     */
    series: readonly DashboardSeries<TRow>[]
    yAxis?: DashboardAxisOptions
    /** Secondary (right) value axis. */
    y2Axis?: DashboardAxisOptions
    format?: DashboardValueFormat
    reference?: DashboardReferenceLine | readonly DashboardReferenceLine[]
    height?: number
    legend?: boolean
    /** Expected number of x positions, drawn by the loading skeleton before data arrives. */
    points?: number
    /** Bars drawn at full strength (`max`, `min`, `last`, or an accessor); the others fade. */
    highlight?: DashboardHighlight<TRow>
    /** Rows shown as selected: their bars stay, the others fade (wins over `highlight`). */
    selected?: DashboardSelected<TRow>
    /** Prints each group's value above its bars (the stack total when `stacked`). */
    labels?: boolean
    /**
     * Footer totals of the solid series, formatted like their axis: `true` / `'sum'` adds each
     * series up, `'average'` averages it. Footer slot content follows them.
     */
    totals?: DashboardChartTotals
    /** A click on the chart selects the x position under the pointer. */
    onSelect?: (event: DashboardSelectEvent<TRow>) => void
  }
>()

defineSlots<{
  'header-right'?: () => unknown
  toolbar?: () => unknown
  footer?: () => unknown
}>()

const mounted = useMounted()
const seed = computed(() => series.map((entry) => entry.key).join('|'))
const skeletonSeries = computed(
  () => series.filter((entry) => (entry.type ?? 'bar') === 'bar').length,
)
const skeletonPoints = computed(() => source.data?.length || points)
const chart = useDashboardChart<TRow>({
  totals: () => totals,
  defaultType: 'bar',
  format: () => format,
  highlight: () => highlight,
  labels: () => labels,
  onSelect: () => onSelect,
  references: () => reference,
  rows: () => source.data ?? [],
  selected: () => selected,
  series: () => series,
  x: () => x,
  xFormat: () => xFormat,
  xLabel: () => xLabel,
  y2Axis: () => y2Axis,
  yAxis: () => yAxis,
})
</script>

<template>
  <DashboardCard
    v-bind="block"
    :card
    :menu
    :freshness
    :source
    :legend="legend ? chart.legend.value : undefined"
    :is-empty="chart.frame.value.data.length === 0 || chart.frame.value.series.length === 0"
    :tabulate="chart.tabulate"
  >
    <template #skeleton>
      <DashboardSkeleton
        kind="bars"
        :height
        :series="skeletonSeries"
        :count="skeletonPoints"
        :seed
      />
    </template>
    <template v-if="$slots['header-right']" #header-right>
      <slot name="header-right" />
    </template>
    <template v-if="$slots.toolbar" #toolbar>
      <slot name="toolbar" />
    </template>
    <template v-if="$slots.footer || chart.totals.value.length" #footer>
      <DashboardTotal
        v-for="total in chart.totals.value"
        :key="total.key"
        :label="total.label"
        :value="total.text"
      />
      <slot name="footer" />
    </template>

    <template #default="{ expanded }">
      <component
        :is="dashboardChartRenderer.xy"
        v-if="mounted"
        :frame="chart.frame.value"
        :height="expanded ? resolveDashboardExpandedHeight(height) : height"
        :selectable="chart.selectable.value"
        @select="chart.select"
      />
      <div v-else aria-hidden="true" :style="{ height: `${height}px` }" />
    </template>
  </DashboardCard>
</template>

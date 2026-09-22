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
  comparison,
  stacked = false,
  yAxis,
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
    /** Category of each row (month, account…). Rows are plotted in order. */
    x: (row: TRow, index: number) => string | number | Date
    xFormat?: (value: string | number | Date) => string
    /** Header of the category column in the table view and CSV export. */
    xLabel?: LazyTextValue
    series: readonly DashboardSeries<TRow>[]
    /** Dashed line drawn over the bars, e.g. the previous period. */
    comparison?: DashboardSeries<TRow>
    stacked?: boolean
    yAxis?: DashboardAxisOptions
    /** Value format for the axis and tooltips. */
    format?: DashboardValueFormat
    reference?: DashboardReferenceLine | readonly DashboardReferenceLine[]
    /** Chart height in pixels. */
    height?: number
    /** Series legend in the header. */
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
const allSeries = computed<readonly DashboardSeries<TRow>[]>(() =>
  comparison
    ? [...series, { color: 'series-2', ...comparison, dashed: true, type: 'line' }]
    : series,
)
const seed = computed(() => allSeries.value.map((entry) => entry.key).join('|'))
const skeletonSeries = computed(() => series.length)
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
  series: () => allSeries.value,
  stacked: () => stacked,
  x: () => x,
  xFormat: () => xFormat,
  xLabel: () => xLabel,
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

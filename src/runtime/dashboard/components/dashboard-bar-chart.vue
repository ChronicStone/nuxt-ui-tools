<script setup lang="ts" generic="TRow">
import { useMounted } from '@vueuse/core'
import { computed } from 'vue'

import { useDashboardChart } from '../composables/use-dashboard-chart'
import type {
  DashboardAxisOptions,
  DashboardBlockBaseProps,
  DashboardReferenceLine,
  DashboardSeries,
  DashboardSourceLike,
  DashboardValueFormat,
} from '../types'
import DashboardSkeleton from './block/dashboard-skeleton.vue'
import { dashboardChartRenderer } from './charts/renderer'
import DashboardCard from './dashboard-card.vue'

const {
  source,
  card = true,
  x,
  xFormat,
  series,
  comparison,
  stacked = false,
  yAxis,
  format,
  reference,
  height = 250,
  legend = true,
  points = 12,
  ...block
} = defineProps<
  DashboardBlockBaseProps & {
    source: DashboardSourceLike<readonly TRow[] | undefined>
    /** Category of each row (month, account…). Rows are plotted in order. */
    x: (row: TRow, index: number) => string | number | Date
    xFormat?: (value: string | number | Date) => string
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
  defaultType: 'bar',
  format: () => format,
  references: () => reference,
  rows: () => source.data ?? [],
  series: () => allSeries.value,
  stacked: () => stacked,
  x: () => x,
  xFormat: () => xFormat,
  yAxis: () => yAxis,
})
</script>

<template>
  <DashboardCard
    v-bind="block"
    :card
    :source
    :legend="legend ? chart.legend.value : undefined"
    :is-empty="chart.frame.value.data.length === 0 || chart.frame.value.series.length === 0"
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
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>

    <component :is="dashboardChartRenderer.xy" v-if="mounted" :frame="chart.frame.value" :height />
    <div v-else aria-hidden="true" :style="{ height: `${height}px` }" />
  </DashboardCard>
</template>

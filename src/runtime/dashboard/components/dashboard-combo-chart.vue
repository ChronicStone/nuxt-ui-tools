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
  yAxis,
  y2Axis,
  format,
  reference,
  height = 250,
  legend = true,
  points = 12,
  ...block
} = defineProps<
  DashboardBlockBaseProps & {
    source: DashboardSourceLike<readonly TRow[] | undefined>
    x: (row: TRow, index: number) => string | number | Date
    xFormat?: (value: string | number | Date) => string
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
  defaultType: 'bar',
  format: () => format,
  references: () => reference,
  rows: () => source.data ?? [],
  series: () => series,
  x: () => x,
  xFormat: () => xFormat,
  y2Axis: () => y2Axis,
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

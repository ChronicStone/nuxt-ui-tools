<script setup lang="ts" generic="TRow, TItem extends DashboardOptionValue = DashboardOptionValue">
import { useMounted } from '@vueuse/core'
import { computed } from 'vue'

import type { LazyTextValue } from '#ui-tools/shared/types/utils'

import {
  resolveDashboardExpandedHeight,
  useDashboardChart,
} from '../composables/use-dashboard-chart'
import { useDashboardSeriesPicker } from '../composables/use-dashboard-series-picker'
import type {
  DashboardAxisOptions,
  DashboardBlockBaseProps,
  DashboardChartTotals,
  DashboardFilterControl,
  DashboardOptionValue,
  DashboardReferenceLine,
  DashboardSelected,
  DashboardSelectEvent,
  DashboardSeries,
  DashboardSourceLike,
  DashboardValueFormat,
} from '../types'
import DashboardChips from './block/dashboard-chips.vue'
import DashboardSeriesPicker from './block/dashboard-series-picker.vue'
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
  seriesValue,
  comparison,
  area = false,
  yAxis,
  format,
  reference,
  height = 250,
  legend = true,
  points = 12,
  selected,
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
     * The series, or a multiple filter whose picks become the series (one per option, in pick
     * order): the chart then draws the picker and one removable chip per series.
     */
    series: readonly DashboardSeries<TRow>[] | DashboardFilterControl<unknown, TItem>
    /** With `series` bound to a filter: the value of one picked option's series in a row. */
    seriesValue?: (row: TRow, item: TItem) => number | null | undefined
    /** Dashed line, e.g. the previous period. */
    comparison?: DashboardSeries<TRow>
    /** Fills the area under every solid series. */
    area?: boolean
    yAxis?: DashboardAxisOptions
    format?: DashboardValueFormat
    reference?: DashboardReferenceLine | readonly DashboardReferenceLine[]
    height?: number
    legend?: boolean
    /** Expected number of x positions, drawn by the loading skeleton before data arrives. */
    points?: number
    /** Rows shown as selected: a band marks their x position. */
    selected?: DashboardSelected<TRow>
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
const picked = useDashboardSeriesPicker<TRow, TItem>({
  series: () => series,
  value: () => seriesValue,
})
const allSeries = computed<readonly DashboardSeries<TRow>[]>(() => {
  const solid = picked.series.value.map((entry, index) => ({
    ...entry,
    color: entry.color ?? `series-${(index % 6) + 1}`,
    type: entry.type ?? (area && !entry.dashed ? 'area' : 'line'),
  }))
  return comparison
    ? [{ color: 'series-2', ...comparison, dashed: true, type: 'line' }, ...solid]
    : solid
})
const seed = computed(() => allSeries.value.map((entry) => entry.key).join('|'))
const skeletonSeries = computed(() => picked.series.value.length || 1)
const skeletonPoints = computed(() => source.data?.length || points)
const chart = useDashboardChart<TRow>({
  totals: () => totals,
  defaultType: 'line',
  format: () => format,
  onSelect: () => onSelect,
  references: () => reference,
  rows: () => source.data ?? [],
  selected: () => selected,
  series: () => allSeries.value,
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
    :legend="legend && !picked.picker.value ? chart.legend.value : undefined"
    :is-empty="chart.frame.value.data.length === 0 || chart.frame.value.series.length === 0"
    :tabulate="chart.tabulate"
  >
    <template #skeleton>
      <DashboardSkeleton
        kind="lines"
        :height
        :series="skeletonSeries"
        :count="skeletonPoints"
        :seed
      />
    </template>
    <template v-if="$slots['header-right'] || picked.picker.value" #header-right>
      <DashboardSeriesPicker v-if="picked.picker.value" :filter="picked.picker.value" />
      <slot name="header-right" />
    </template>
    <template v-if="$slots.toolbar || picked.chips.value.length" #toolbar>
      <DashboardChips v-if="picked.chips.value.length" :chips="picked.chips.value" />
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

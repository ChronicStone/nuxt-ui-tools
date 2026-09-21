<script setup lang="ts">
import VisAxis from '@unovis/vue/components/axis'
import VisCrosshair from '@unovis/vue/components/crosshair'
import VisGroupedBar from '@unovis/vue/components/grouped-bar'
import VisStackedBar from '@unovis/vue/components/stacked-bar'
import VisTooltip from '@unovis/vue/components/tooltip'
import VisXYContainer from '@unovis/vue/containers/xy-container'
import { usePreferredReducedMotion } from '@vueuse/core'
import { computed } from 'vue'

import type {
  DashboardChartDatum,
  DashboardChartFrame,
  DashboardChartFrameAxis,
} from '../../../types'
import { renderDashboardChartTooltip } from '../../../utils/chart-frame'
import DashboardXyMarks from './dashboard-xy-marks.vue'
import { resolveDashboardXyLayer } from './xy-layers'

const props = defineProps<{
  frame: DashboardChartFrame
  height: number
}>()

const reducedMotion = usePreferredReducedMotion()
const duration = computed(() => (reducedMotion.value === 'reduce' ? 0 : 450))

// Resolved once per frame: accessors and filtered data keep their identity between renders.
const left = computed(() => resolveDashboardXyLayer(props.frame, 'left'))
const right = computed(() => resolveDashboardXyLayer(props.frame, 'right'))
const hasBars = computed(() => left.value.bars.count > 0)

const margin = computed(() => ({
  bottom: 24,
  left: 46,
  right: props.frame.right ? 46 : 8,
  top: 10,
}))
// Line-only charts keep their first and last points off the axis labels.
const padding = computed(() =>
  hasBars.value ? {} : { left: 8, right: props.frame.right ? 6 : 16 },
)

/**
 * Bar widths, as fractions of an x slot: each grouped bar takes ~26% (16px max), ~16% (12px max)
 * beyond two series, 1–2px apart; a stacked bar takes ~34% (24px max). unovis sizes bars from
 * `points + 1` slots, hence the correction.
 */
const barGeometry = computed(() => {
  const count = Math.max(1, left.value.bars.count)
  const points = Math.max(2, props.frame.data.length)
  const slots = (points + 1) / points
  if (props.frame.stacked) return { barMaxWidth: 24, barPadding: 1 - Math.min(0.9, 0.34 * slots) }
  const dense = count > 2
  const width = dense ? 12 : 16
  const gap = dense ? 2 : 1
  return {
    barPadding: count > 1 ? gap / (width + gap) : 0,
    groupMaxWidth: count * (width + gap),
    groupPadding: 1 - Math.min(0.9, (dense ? 0.16 : 0.26) * count * slots),
  }
})

const tickValues = computed(() => props.frame.labels.map((_, index) => index))
const x = (datum: DashboardChartDatum) => datum.index
// unovis types tick values as `number | Date`; dashboard axes are always numeric (indexes, values).
const formatX = (value: number | Date) =>
  value instanceof Date ? '' : (props.frame.labels[value] ?? '')
const formatAxis = (axis: DashboardChartFrameAxis | null) => (value: number | Date) =>
  value instanceof Date || !axis ? '' : axis.format(value)
const formatLeft = computed(() => formatAxis(props.frame.left))
const formatRight = computed(() => formatAxis(props.frame.right))
const tooltip = (datum: DashboardChartDatum) => renderDashboardChartTooltip(props.frame, datum)
</script>

<template>
  <div
    class="nut-dash-chart relative w-full"
    :class="hasBars && 'nut-dash-chart--bars'"
    :style="{ height: `${height}px` }"
  >
    <VisXYContainer
      :height="height"
      :margin="margin"
      :padding="padding"
      :auto-margin="false"
      :x-domain="frame.xDomain"
      :y-domain="frame.left.domain"
      :duration="duration"
    >
      <VisStackedBar
        v-if="frame.stacked && hasBars"
        :data="frame.data"
        :x="x"
        :y="left.bars.y"
        :color="left.bars.color"
        :bar-padding="barGeometry.barPadding"
        :bar-max-width="barGeometry.barMaxWidth"
        :rounded-corners="2"
      />
      <VisGroupedBar
        v-else-if="hasBars"
        :data="frame.data"
        :x="x"
        :y="left.bars.y"
        :color="left.bars.color"
        :group-padding="barGeometry.groupPadding"
        :group-max-width="barGeometry.groupMaxWidth"
        :bar-padding="barGeometry.barPadding"
        :bar-min-height="0"
        :rounded-corners="2"
      />
      <DashboardXyMarks :layer="left" :data="frame.data" />
      <VisAxis
        type="x"
        :tick-format="formatX"
        :tick-values="tickValues"
        :num-ticks="tickValues.length"
        :grid-line="false"
        :tick-line="false"
        :domain-line="false"
        :tick-text-hide-overlapping="true"
      />
      <VisAxis
        type="y"
        :tick-format="formatLeft"
        :tick-values="frame.left.ticks"
        :tick-line="false"
        :domain-line="false"
      />
      <VisCrosshair :data="frame.data" :template="tooltip" :hide-when-far-from-pointer="false" />
      <VisTooltip />
    </VisXYContainer>

    <!-- Secondary axis: a second container over the first, sharing its x domain and margins. -->
    <VisXYContainer
      v-if="frame.right"
      class="pointer-events-none !absolute inset-0"
      :height="height"
      :margin="margin"
      :padding="padding"
      :auto-margin="false"
      :x-domain="frame.xDomain"
      :y-domain="frame.right.domain"
      :duration="duration"
    >
      <DashboardXyMarks :layer="right" :data="frame.data" />
      <VisAxis
        type="y"
        position="right"
        :tick-format="formatRight"
        :tick-values="frame.right.ticks"
        :tick-text-color="right.lineColor"
        :grid-line="false"
        :tick-line="false"
        :domain-line="false"
      />
    </VisXYContainer>
  </div>
</template>

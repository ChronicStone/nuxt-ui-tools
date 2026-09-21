<script setup lang="ts">
import VisAxis from '@unovis/vue/components/axis'
import VisCrosshair from '@unovis/vue/components/crosshair'
import VisGroupedBar from '@unovis/vue/components/grouped-bar'
import VisPlotband from '@unovis/vue/components/plotband'
import VisStackedBar from '@unovis/vue/components/stacked-bar'
import VisTooltip from '@unovis/vue/components/tooltip'
import VisXYContainer from '@unovis/vue/containers/xy-container'
import { usePreferredReducedMotion } from '@vueuse/core'
import { computed } from 'vue'

import type {
  DashboardChartDatum,
  DashboardChartFrame,
  DashboardChartFrameAxis,
  DashboardChartValueLabel,
} from '../../../types'
import { renderDashboardChartTooltip } from '../../../utils/chart-frame'
import DashboardXyMarks from './dashboard-xy-marks.vue'
import { resolveDashboardXyLayer } from './xy-layers'

const props = defineProps<{
  frame: DashboardChartFrame
  height: number
  /** A click selects the x position under the pointer. */
  selectable?: boolean
}>()
const emit = defineEmits<{ select: [index: number] }>()

/**
 * Maps a click (or a tap: no hover needed) to the nearest x position, through the same margins,
 * padding, and domain the container plots with.
 */
function select(event: MouseEvent) {
  const box = event.currentTarget
  if (!props.selectable || !(box instanceof HTMLElement)) return
  const rect = box.getBoundingClientRect()
  const start = margin.value.left + (padding.value.left ?? 0)
  const width = rect.width - start - margin.value.right - (padding.value.right ?? 0)
  if (width <= 0) return
  const [from, to] = props.frame.xDomain
  const index = Math.round(from + ((event.clientX - rect.left - start) / width) * (to - from))
  if (index >= 0 && index < props.frame.data.length) emit('select', index)
}

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
// `VisCrosshair` declares only `data` and forwards its other attributes to unovis as written, so
// its config keys must be camelCase: a kebab-case binding would never reach it.
const crosshair = { hideWhenFarFromPointer: false, template: tooltip }

// Bars mark a selection by fading the rest; line-only charts get a band behind the picked x.
const bands = computed(() => (hasBars.value ? [] : props.frame.selection))
const bandColor = 'color-mix(in oklab, var(--ui-primary) 9%, transparent)'

/**
 * Places a value label above its bar group (below it for negative values), through the same
 * margins, padding, and domains the container plots with: HTML text stays crisp and themable.
 */
function labelStyle(label: DashboardChartValueLabel) {
  const start = margin.value.left + (padding.value.left ?? 0)
  const end = margin.value.right + (padding.value.right ?? 0)
  const [from, to] = props.frame.xDomain
  const [min, max] = props.frame.left.domain
  const fraction = to === from ? 0.5 : (label.index - from) / (to - from)
  const plot = props.height - margin.value.top - margin.value.bottom
  const ratio = max === min ? 0 : (label.value - min) / (max - min)
  return {
    left: `calc(${start}px + (100% - ${start + end}px) * ${fraction})`,
    top: `${margin.value.top + plot * (1 - ratio)}px`,
    transform: label.value < 0 ? 'translate(-50%, 4px)' : 'translate(-50%, calc(-100% - 4px))',
  }
}
</script>

<template>
  <div
    class="nut-dash-chart relative w-full"
    :class="[hasBars && 'nut-dash-chart--bars', selectable && 'cursor-pointer']"
    :style="{ height: `${height}px` }"
    @click="select"
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
      <VisPlotband
        v-for="index in bands"
        :key="`band-${index}`"
        axis="x"
        :from="index - 0.5"
        :to="index + 0.5"
        :color="bandColor"
      />
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
      <VisCrosshair :data="frame.data" v-bind="crosshair" />
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

    <span
      v-for="label in frame.valueLabels"
      :key="`label-${label.index}`"
      aria-hidden="true"
      class="pointer-events-none absolute text-[10.5px] leading-none whitespace-nowrap tabular-nums"
      :class="label.strong ? 'font-semibold text-highlighted' : 'text-muted'"
      :style="labelStyle(label)"
      data-value-label
    >
      {{ label.text }}
    </span>
  </div>
</template>

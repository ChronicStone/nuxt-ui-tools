<script setup lang="ts">
import { computed } from 'vue'

import { useDisplayAppUi } from '../../composables/use-display-config'
import { useDisplayNumber } from '../../composables/use-display-number'
import type { DisplayChartDatum, DisplayChartProps, DisplayChartSlot } from '../../types'
import { resolveDisplayClasses } from '../../utils/classes'
import { isDisplayContentEmpty, resolveDisplayText } from '../../utils/content'
import DisplayEmptyLine from '../parts/display-empty-line.vue'
import DisplayRender from '../parts/display-render'
import DisplaySkeleton from '../parts/display-skeleton.vue'

const {
  variant = 'bars',
  title = undefined,
  aside = undefined,
  data,
  format = undefined,
  height = 96,
  highlight = 'last',
  empty = undefined,
  loading = false,
  ui = undefined,
} = defineProps<DisplayChartProps>()

const SERIES = [
  'var(--nut-dash-s1)',
  'var(--nut-dash-s2)',
  'var(--nut-dash-s3)',
  'var(--nut-dash-s4)',
  'var(--nut-dash-s5)',
  'var(--nut-dash-s6)',
] as const

const formatNumber = useDisplayNumber()
const appUi = useDisplayAppUi('chart')
const formatValue = (value: number) => (format ? format(value) : formatNumber(value))
const maxValue = computed(() => Math.max(0, ...data.map((datum) => datum.value)))
const total = computed(() => data.reduce((sum, datum) => sum + Math.max(0, datum.value), 0))
const highlighted = computed(() => {
  if (highlight === false) return -1
  if (highlight === 'last') return data.length - 1
  if (highlight === 'max') return data.findIndex((datum) => datum.value === maxValue.value)
  return highlight
})
const line = computed(() => {
  if (data.length < 2) return undefined
  const min = Math.min(...data.map((datum) => datum.value))
  const span = maxValue.value - min || 1
  const points = data.map((datum, index) => {
    const x = (index / (data.length - 1)) * 300
    const y = 92 - ((datum.value - min) / span) * 80
    return `${x.toFixed(1)} ${y.toFixed(1)}`
  })
  return { area: `M${points.join(' L')} L300 100 L0 100 Z`, path: `M${points.join(' L')}` }
})
const slices = computed(() => {
  let offset = 25
  return data.map((datum, index) => {
    const share = total.value ? (Math.max(0, datum.value) / total.value) * 100 : 0
    const slice = { color: colorOf(datum, index), dash: `${share} ${100 - share}`, offset, share }
    offset = (offset - share + 100) % 100
    return slice
  })
})
const steps = computed(() => {
  const first = data[0]?.value ?? 0
  return data.map((datum, index) => {
    const previous = data[index - 1]?.value
    return {
      ...datum,
      rate: previous ? Math.round((datum.value / previous) * 100) : undefined,
      width: first ? (datum.value / first) * 100 : 0,
    }
  })
})
const classes = computed(() =>
  resolveDisplayClasses<DisplayChartSlot>(
    {
      aside: 'text-xs text-dimmed',
      axis: 'mt-1.5 flex gap-2 text-[10.5px] text-dimmed',
      bar: 'relative min-h-px flex-1 rounded-t-[3px] bg-[var(--nut-dash-muted)] transition-[height] duration-300',
      header: 'flex items-baseline justify-between gap-3 text-sm',
      legend: 'flex flex-col gap-1.5 text-xs text-muted',
      legendItem: 'inline-flex items-center gap-1.5',
      plot: 'mt-3',
      root: 'min-w-0',
      step: 'grid grid-cols-[minmax(4rem,7rem)_minmax(0,1fr)_auto_2.75rem] items-center gap-2 text-xs',
      stepLabel: 'truncate text-muted',
      stepRate: 'text-end text-[11px] text-dimmed tabular-nums',
      stepValue: 'text-end font-semibold text-highlighted tabular-nums',
      title: 'font-semibold text-toned',
    },
    appUi.value,
    ui,
  ),
)

function colorOf(datum: DisplayChartDatum, index: number) {
  return datum.tone
    ? `var(--nut-display-${datum.tone})`
    : (SERIES[index % SERIES.length] ?? SERIES[0])
}
</script>

<template>
  <DisplaySkeleton v-if="loading" layout="block" />
  <div v-else :class="classes.root" data-display="chart" :data-variant="variant">
    <div
      v-if="!isDisplayContentEmpty(title) || !isDisplayContentEmpty(aside)"
      :class="classes.header"
    >
      <span :class="classes.title"><DisplayRender :content="title" /></span>
      <span :class="classes.aside"><DisplayRender :content="aside" /></span>
    </div>
    <DisplayEmptyLine v-if="!data.length" :content="empty" :class="classes.plot" />
    <div v-else-if="variant === 'bars'" :class="classes.plot">
      <div
        class="flex items-end gap-2 border-b border-default pt-5"
        :style="{ height: `${height + 20}px` }"
      >
        <div
          v-for="(datum, index) in data"
          :key="index"
          :class="classes.bar"
          :style="{
            height: `${maxValue ? (datum.value / maxValue) * height : 0}px`,
            background:
              index === highlighted
                ? 'var(--nut-dash-s1)'
                : datum.tone
                  ? `var(--nut-display-${datum.tone})`
                  : undefined,
          }"
          :title="`${resolveDisplayText(datum.label)} : ${formatValue(datum.value)}`"
          :data-highlighted="index === highlighted || undefined"
        >
          <span
            v-if="index === highlighted"
            class="absolute -top-4.5 left-1/2 -translate-x-1/2 text-[11px] font-bold whitespace-nowrap text-highlighted tabular-nums"
          >
            {{ formatValue(datum.value) }}
          </span>
        </div>
      </div>
      <div :class="classes.axis">
        <span
          v-for="(datum, index) in data"
          :key="index"
          class="min-w-0 flex-1 truncate text-center"
        >
          {{ resolveDisplayText(datum.label) }}
        </span>
      </div>
    </div>
    <div v-else-if="variant === 'line' && line" :class="classes.plot">
      <svg
        viewBox="0 0 300 100"
        preserveAspectRatio="none"
        class="w-full"
        :style="{ height: `${height}px` }"
        role="img"
      >
        <path
          d="M0 25H300M0 50H300M0 75H300"
          stroke="var(--nut-dash-grid)"
          stroke-width="1"
          vector-effect="non-scaling-stroke"
        />
        <path :d="line.area" fill="var(--nut-dash-s1)" fill-opacity="0.14" />
        <path
          :d="line.path"
          fill="none"
          stroke="var(--nut-dash-s1)"
          stroke-width="2"
          stroke-linejoin="round"
          vector-effect="non-scaling-stroke"
        />
      </svg>
      <div :class="[classes.axis, 'justify-between']">
        <span
          >{{ resolveDisplayText(data[0]?.label) }} · {{ formatValue(data[0]?.value ?? 0) }}</span
        >
        <span class="font-semibold text-toned"
          >{{ resolveDisplayText(data.at(-1)?.label) }} ·
          {{ formatValue(data.at(-1)?.value ?? 0) }}</span
        >
      </div>
    </div>
    <div v-else-if="variant === 'donut'" :class="[classes.plot, 'flex items-center gap-4']">
      <svg width="96" height="96" viewBox="0 0 42 42" class="shrink-0" role="img">
        <circle
          cx="21"
          cy="21"
          r="15.915"
          fill="none"
          stroke="var(--nut-display-track)"
          stroke-width="5.5"
        />
        <circle
          v-for="(slice, index) in slices"
          :key="index"
          cx="21"
          cy="21"
          r="15.915"
          fill="none"
          :stroke="slice.color"
          stroke-width="5.5"
          :stroke-dasharray="slice.dash"
          :stroke-dashoffset="slice.offset"
        />
      </svg>
      <div :class="classes.legend">
        <span v-for="(datum, index) in data" :key="index" :class="classes.legendItem">
          <i class="size-2 shrink-0 rounded-[2px]" :style="{ background: slices[index]?.color }" />
          {{ resolveDisplayText(datum.label) }}
          <b class="font-semibold text-default tabular-nums"
            >{{ Math.round(slices[index]?.share ?? 0) }} %</b
          >
        </span>
      </div>
    </div>
    <div v-else-if="variant === 'funnel'" :class="[classes.plot, 'flex flex-col gap-1.5']">
      <div v-for="(step, index) in steps" :key="index" :class="classes.step">
        <span :class="classes.stepLabel">{{ resolveDisplayText(step.label) }}</span>
        <span
          class="h-4 rounded-[3px]"
          :style="{
            width: `${step.width}%`,
            background: step.tone ? `var(--nut-display-${step.tone})` : 'var(--nut-dash-s1)',
            opacity: step.tone ? 1 : 1 - index * 0.14,
          }"
        />
        <span :class="classes.stepValue">{{ formatValue(step.value) }}</span>
        <span :class="classes.stepRate">{{ step.rate === undefined ? '' : `${step.rate} %` }}</span>
      </div>
    </div>
  </div>
</template>

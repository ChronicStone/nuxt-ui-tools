<script setup lang="ts">
import { computed } from 'vue'

import type { DashboardSkeletonKind } from '../../types'
import { createDashboardSeededRandom } from '../../utils/charts'

const props = withDefaults(
  defineProps<{
    kind?: DashboardSkeletonKind
    /** Rows for list-like kinds, x points for charts. */
    count?: number
    /** Bars per group (`bars`), or lines (`lines`). */
    series?: number
    /** Chart height in pixels, x labels included. */
    height?: number
    /** Leading visual of `rows`. */
    leading?: 'avatar' | 'code'
    /** `donut` legend placement. */
    layout?: 'side' | 'stacked'
    /** Diameter of the `donut` ring. */
    diameter?: number
    /** Seed of the deterministic geometry: server and client paint the same ghost. */
    seed?: string
  }>(),
  {
    count: 0,
    diameter: 150,
    height: 250,
    kind: 'rows',
    layout: 'side',
    seed: 'dashboard',
    series: 1,
  },
)

const points = computed(
  () => props.count || (props.kind === 'bars' || props.kind === 'lines' ? 12 : 5),
)
const random = computed(() => createDashboardSeededRandom(`${props.kind}:${props.seed}`))

const groups = computed(() => {
  const next = random.value
  return Array.from({ length: points.value }, () =>
    Array.from({ length: Math.max(1, props.series) }, () => 28 + Math.round(next() * 58)),
  )
})

const linePath = computed(() => {
  const next = random.value
  const values = Array.from({ length: points.value }, (_, index) => 30 + index * 2.5 + next() * 22)
  const step = 100 / Math.max(1, values.length - 1)
  return values
    .map(
      (value, index) =>
        `${index === 0 ? 'M' : 'L'}${(index * step).toFixed(2)},${(100 - value).toFixed(2)}`,
    )
    .join(' ')
})

const widths = computed(() => {
  const next = random.value
  return Array.from({ length: points.value }, () => 38 + Math.round(next() * 40))
})

const funnelWidths = computed(() =>
  Array.from({ length: points.value }, (_, index) => Math.max(18, 100 - index * 19)),
)
</script>

<template>
  <!-- KPI: value, then delta and caption -->
  <div v-if="kind === 'stat'" class="flex flex-col gap-2.5 pt-1.5">
    <div class="nut-dash-ghost h-[26px] w-[58%] rounded-md" />
    <div class="flex items-center gap-2">
      <div class="nut-dash-ghost h-3 w-12 rounded-sm" />
      <div class="nut-dash-ghost h-3 w-[40%] rounded-sm opacity-70" />
    </div>
  </div>

  <!-- XY charts: y labels, gridlines, grouped bars or a smooth line, x labels -->
  <div
    v-else-if="kind === 'bars' || kind === 'lines'"
    class="flex flex-col"
    :style="{ height: `${height}px` }"
  >
    <div class="flex min-h-0 flex-1 gap-2">
      <div class="flex w-8 shrink-0 flex-col justify-between py-0.5">
        <div
          v-for="tick in 5"
          :key="tick"
          class="nut-dash-ghost ms-auto h-2 w-6 rounded-sm opacity-70"
        />
      </div>
      <div class="relative flex min-w-0 flex-1 items-end">
        <div
          v-for="line in 5"
          :key="line"
          class="absolute inset-x-0 border-t border-[var(--nut-dash-grid)]"
          :style="{ top: `${((line - 1) / 4) * 100}%` }"
        />
        <template v-if="kind === 'bars'">
          <div
            v-for="(group, index) in groups"
            :key="index"
            class="relative flex h-full flex-1 items-end justify-center gap-px"
          >
            <div
              v-for="(bar, barIndex) in group"
              :key="barIndex"
              class="nut-dash-ghost w-[min(14px,22%)] rounded-t-[2px]"
              :style="{ height: `${bar}%` }"
            />
          </div>
        </template>
        <svg
          v-else
          class="absolute inset-0 size-full overflow-visible"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path
            :d="linePath"
            fill="none"
            stroke="var(--nut-dash-ghost)"
            stroke-width="2.5"
            vector-effect="non-scaling-stroke"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
    </div>
    <div class="mt-2 flex ps-10">
      <div v-for="index in points" :key="index" class="flex flex-1 justify-center">
        <div class="nut-dash-ghost h-2 w-5 rounded-sm opacity-70" />
      </div>
    </div>
  </div>

  <!-- Donut: ring and legend -->
  <div
    v-else-if="kind === 'donut'"
    :class="
      layout === 'stacked'
        ? 'flex flex-col items-center gap-[18px]'
        : 'flex flex-wrap items-center gap-5'
    "
  >
    <div
      class="shrink-0 rounded-full border-[14px] border-[var(--nut-dash-ghost)]"
      :style="{ height: `${diameter}px`, width: `${diameter}px` }"
    />
    <div class="flex w-full min-w-40 flex-1 flex-col gap-3">
      <div
        v-for="(width, index) in widths.slice(0, 4)"
        :key="index"
        class="flex items-center gap-2"
      >
        <div class="nut-dash-ghost size-[9px] shrink-0 rounded-[3px]" />
        <div class="nut-dash-ghost h-2.5 rounded-sm" :style="{ width: `${width}%` }" />
        <div class="nut-dash-ghost ms-auto h-2.5 w-8 rounded-sm" />
      </div>
    </div>
  </div>

  <!-- Horizontal bars: label + meta, then a thin track -->
  <div v-else-if="kind === 'hbars'" class="flex flex-col gap-1">
    <div v-for="(width, index) in widths" :key="index" class="flex flex-col gap-2 py-1.5">
      <div class="flex items-center justify-between gap-3">
        <div class="nut-dash-ghost h-2.5 rounded-sm" :style="{ width: `${width}%` }" />
        <div class="nut-dash-ghost h-2.5 w-14 rounded-sm opacity-70" />
      </div>
      <div class="h-1.5 rounded-full bg-[var(--nut-dash-track)]">
        <div
          class="nut-dash-ghost h-full rounded-full"
          :style="{ width: `${100 - index * 14}%` }"
        />
      </div>
    </div>
  </div>

  <!-- Funnel: label + value, then decreasing thick bars -->
  <div v-else-if="kind === 'funnel'" class="flex flex-col gap-3.5 pt-1">
    <div v-for="(width, index) in funnelWidths" :key="index" class="flex flex-col gap-1.5">
      <div class="flex items-center gap-2.5">
        <div class="nut-dash-ghost h-2.5 w-24 rounded-sm" />
        <div class="nut-dash-ghost h-3 w-10 rounded-sm" />
        <div class="nut-dash-ghost ms-auto h-2.5 w-28 rounded-sm opacity-70" />
      </div>
      <div class="h-[22px] rounded-[5px] bg-[var(--nut-dash-track)]">
        <div class="nut-dash-ghost h-full rounded-[5px]" :style="{ width: `${width}%` }" />
      </div>
    </div>
  </div>

  <!-- Stacked bar: one bar, legend in two columns -->
  <div v-else-if="kind === 'stack'" class="flex flex-col gap-4 pt-1.5">
    <div class="nut-dash-ghost h-3.5 rounded-full" />
    <div class="grid grid-cols-2 gap-x-[18px] gap-y-2">
      <div
        v-for="(width, index) in widths.slice(0, 4)"
        :key="index"
        class="flex items-center gap-2"
      >
        <div class="nut-dash-ghost size-[9px] shrink-0 rounded-[3px]" />
        <div class="nut-dash-ghost h-2.5 rounded-sm" :style="{ width: `${width}%` }" />
      </div>
    </div>
  </div>

  <!-- Paired bars: label, track, numbers -->
  <div v-else-if="kind === 'paired'" class="flex flex-col">
    <div
      v-for="(width, index) in widths"
      :key="index"
      class="grid grid-cols-[minmax(0,150px)_1fr_auto] items-center gap-3 py-1.5"
    >
      <div class="nut-dash-ghost h-2.5 rounded-sm" :style="{ width: `${width}%` }" />
      <div class="h-3 rounded-full bg-[var(--nut-dash-track)]">
        <div class="nut-dash-ghost h-full rounded-full" :style="{ width: `${100 - index * 5}%` }" />
      </div>
      <div class="nut-dash-ghost h-2.5 w-24 rounded-sm opacity-70" />
    </div>
  </div>

  <!-- Ranked rows: leading, two text lines, value -->
  <div v-else class="flex flex-col divide-y divide-[var(--nut-dash-grid)]">
    <div v-for="(width, index) in widths" :key="index" class="flex items-center gap-3 py-[9px]">
      <div
        v-if="leading"
        :class="leading === 'avatar' ? 'size-[30px] rounded-[7px]' : 'h-[22px] w-8 rounded-[5px]'"
        class="nut-dash-ghost shrink-0"
      />
      <div class="flex min-w-0 flex-1 flex-col gap-1.5">
        <div class="nut-dash-ghost h-2.5 rounded-sm" :style="{ width: `${width}%` }" />
        <div v-if="leading === 'avatar'" class="nut-dash-ghost h-2 w-[30%] rounded-sm opacity-70" />
      </div>
      <div class="nut-dash-ghost h-3 w-10 shrink-0 rounded-sm" />
    </div>
  </div>
</template>

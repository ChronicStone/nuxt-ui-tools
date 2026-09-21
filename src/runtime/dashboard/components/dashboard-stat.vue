<script setup lang="ts" generic="TData">
import UIcon from '@nuxt/ui/components/Icon.vue'
import { twMerge } from 'tailwind-merge'
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'
import type { LazyTextValue } from '#ui-tools/shared/types/utils'
import { isNumber, isString } from '#ui-tools/shared/utils/predicate'
import { resolveTextValue } from '#ui-tools/shared/utils/render'

import { useDashboardFormat } from '../composables/use-dashboard-format'
import { useDashboardUi } from '../composables/use-dashboard-ui'
import type {
  DashboardBlockBaseProps,
  DashboardBlockUi,
  DashboardSeriesColor,
  DashboardSourceLike,
  DashboardStatUi,
  DashboardStatus,
  DashboardValueFormat,
} from '../types'
import { resolveDashboardColor } from '../utils/charts'
import { resolveDashboardSparkBars, resolveDashboardSparkline } from '../utils/sparkline'
import { resolveDashboardClasses } from '../utils/ui'
import DashboardSkeleton from './block/dashboard-skeleton.vue'
import DashboardCard from './dashboard-card.vue'

const {
  source,
  card = true,
  menu = undefined,
  freshness = undefined,
  value,
  format,
  delta,
  deltaFormat,
  invertDelta = false,
  caption,
  label,
  icon,
  trend,
  trendType = 'area',
  trendColor = 'series-1',
  compare,
  compareLabel,
  goal,
  status,
  ui,
  ...block
} = defineProps<
  Omit<DashboardBlockBaseProps, 'title' | 'subtitle' | 'ui'> & {
    source: DashboardSourceLike<TData>
    /** KPI label, shown above the value. */
    label: LazyTextValue
    /** Main value. Numbers go through `format` (locale number format by default). */
    value: (data: TData & ({} | null)) => LazyTextValue
    format?: DashboardValueFormat
    /**
     * Change indicator, in percent by default. `null` hides it. Defaults to the change from
     * `compare` when that is set.
     */
    delta?: (data: TData & ({} | null)) => number | null | undefined
    deltaFormat?: DashboardValueFormat
    /** A decrease is good news (e.g. a failure rate): colors the delta accordingly. */
    invertDelta?: boolean
    /** Secondary text after the delta. Wraps under it when space runs out. */
    caption?: string | ((data: TData & ({} | null)) => LazyTextValue | undefined)
    icon?: string
    /** Recent values, oldest first, drawn as a sparkline under the value. `null` leaves a gap. */
    trend?: (data: TData & ({} | null)) => readonly (number | null | undefined)[] | undefined
    /** How `trend` is drawn: a filled line (default), a bare line, or mini bars. */
    trendType?: 'area' | 'line' | 'bars'
    trendColor?: DashboardSeriesColor
    /**
     * The same measure over the comparison period (previous period, previous year). Gives the
     * default `delta`, and the default caption ("vs 1,204 previous period").
     */
    compare?: (data: TData & ({} | null)) => number | null | undefined
    /**
     * Caption shown with `compare`, as text or built from the formatted previous value. Defaults to
     * "vs <value> previous period".
     */
    compareLabel?: LazyTextValue | ((previous: string) => LazyTextValue)
    /**
     * Target of a numeric `value`: draws a progress bar with the goal and the completion. `null`
     * hides it.
     */
    goal?: (data: TData & ({} | null)) => number | null | undefined
    /** Status on the title row (a colored dot and label). `null` hides it. */
    status?: (data: TData & ({} | null)) => DashboardStatus | null | undefined
    ui?: DashboardBlockUi & DashboardStatUi
  }
>()

defineSlots<{
  value?: (props: { data: TData & ({} | null); value: string }) => unknown
  caption?: (props: { data: TData & ({} | null) }) => unknown
}>()

const { t } = useUiToolsLocale()
const formats = useDashboardFormat()
const appUi = useDashboardUi()

const ready = computed(() => {
  const data = source.data
  return data === undefined ? null : { data }
})
const resolved = computed(() => (ready.value ? value(ready.value.data) : undefined))
const formatValue = computed(() => format ?? formats.number.value)
const display = computed(() => {
  if (resolved.value === undefined) return ''
  return isNumber(resolved.value)
    ? formatValue.value(resolved.value)
    : resolveTextValue(resolved.value)
})
const previous = computed(() => {
  if (!ready.value || !compare) return null
  const amount = compare(ready.value.data)
  return isNumber(amount) && Number.isFinite(amount) ? amount : null
})
const change = computed(() => {
  if (!ready.value) return null
  const amount = delta
    ? delta(ready.value.data)
    : previous.value !== null && previous.value !== 0 && isNumber(resolved.value)
      ? ((resolved.value - previous.value) / Math.abs(previous.value)) * 100
      : null
  if (amount === null || amount === undefined || !Number.isFinite(amount)) return null
  const good = invertDelta ? amount <= 0 : amount >= 0
  return { good, label: (deltaFormat ?? formats.delta.value)(amount), up: amount >= 0 }
})
const captionText = computed(() => {
  if (!ready.value) return ''
  if (caption !== undefined)
    return isString(caption) ? caption : resolveTextValue(caption(ready.value.data))
  if (previous.value === null) return ''
  const before = formatValue.value(previous.value)
  if (compareLabel === undefined) return t('dashboard.compare.caption', { value: before })
  return resolveTextValue(
    isString(compareLabel) || isNumber(compareLabel) ? compareLabel : compareLabel(before),
  )
})
const sparkline = computed(() => {
  if (!ready.value || !trend || trendType === 'bars') return null
  return resolveDashboardSparkline(trend(ready.value.data) ?? [])
})
const sparkBars = computed(() => {
  if (!ready.value || !trend || trendType !== 'bars') return null
  return resolveDashboardSparkBars(trend(ready.value.data) ?? [])
})
const progress = computed(() => {
  if (!ready.value || !goal || !isNumber(resolved.value)) return null
  const target = goal(ready.value.data)
  if (!isNumber(target) || target <= 0) return null
  const completion = (resolved.value / target) * 100
  const filled = Math.round(Math.max(0, Math.min(100, completion)))
  return {
    completion: formats.percent.value(completion),
    filled,
    goal: t('dashboard.stat.goal', { value: formatValue.value(target) }),
    reached: completion >= 100,
  }
})
const statusInfo = computed(() => {
  const current = ready.value && status ? status(ready.value.data) : null
  if (!current) return null
  return {
    color: resolveDashboardColor(current.color, 0),
    label: resolveTextValue(current.label),
    tone: current.color,
  }
})

const classes = computed(() =>
  resolveDashboardClasses(
    {
      caption: 'min-w-0',
      delta: 'shrink-0 font-semibold tabular-nums',
      goal: 'mt-1.5 flex items-baseline justify-between gap-2 text-[11.5px] text-muted tabular-nums',
      label: 'text-[12.5px] font-normal tracking-normal text-muted',
      mark: 'me-0.5 text-[9px]',
      meta: 'mt-2.5 flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs leading-[1.35] text-muted',
      progress: 'mt-3.5 h-1.5 overflow-hidden rounded-full bg-[var(--nut-dash-track)]',
      status: 'inline-flex items-center gap-1.5 text-[11.5px] font-medium',
      trend: 'mt-3 h-8 w-full overflow-visible',
      value:
        'mt-1.5 text-[26px] leading-none font-semibold tracking-tight text-highlighted tabular-nums',
    },
    appUi.value.stat,
    ui,
  ),
)
const cardUi = computed<DashboardBlockUi>(() => ({
  ...ui,
  header: twMerge('mb-2.5', ui?.header),
  title: classes.value.label,
}))
const trendStroke = computed(() => resolveDashboardColor(trendColor, 0))
const extra = computed(() => (trend ? 'trend' : goal ? 'goal' : undefined))
</script>

<template>
  <DashboardCard
    v-bind="block"
    :card
    :menu
    :freshness
    :source
    :title="label"
    :ui="cardUi"
    :expandable="false"
  >
    <template #skeleton>
      <DashboardSkeleton kind="stat" :extra />
    </template>
    <template v-if="icon || statusInfo" #header-right>
      <span
        v-if="statusInfo"
        :data-status="statusInfo.tone"
        :class="classes.status"
        :style="{ color: statusInfo.color }"
      >
        <span aria-hidden="true" class="size-1.5 rounded-full bg-current" />
        {{ statusInfo.label }}
      </span>
      <UIcon v-if="icon" :name="icon" class="size-4 text-dimmed" />
    </template>

    <template v-if="ready">
      <div :class="classes.value">
        <slot name="value" :data="ready.data" :value="display">{{ display }}</slot>
      </div>
      <div v-if="change || captionText || $slots.caption" :class="classes.meta">
        <span
          v-if="change"
          :data-trend="change.good ? 'up' : 'down'"
          :class="[
            classes.delta,
            change.good ? 'text-[var(--nut-dash-up)]' : 'text-[var(--nut-dash-down)]',
          ]"
        >
          <span
            aria-hidden="true"
            :class="[
              classes.mark,
              change.good ? 'text-[var(--nut-dash-up-mark)]' : 'text-[var(--nut-dash-down)]',
            ]"
            >{{ change.up ? '▲' : '▼' }}</span
          >{{ change.label }}
        </span>
        <span :class="classes.caption">
          <slot name="caption" :data="ready.data">{{ captionText }}</slot>
        </span>
      </div>
      <svg
        v-if="sparkline"
        :class="classes.trend"
        viewBox="0 0 100 32"
        preserveAspectRatio="none"
        aria-hidden="true"
        data-sparkline
      >
        <path
          v-if="trendType === 'area'"
          :d="sparkline.area"
          :fill="trendStroke"
          fill-opacity="0.12"
        />
        <path
          :d="sparkline.line"
          fill="none"
          :stroke="trendStroke"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
          vector-effect="non-scaling-stroke"
        />
      </svg>
      <svg
        v-if="sparkBars"
        :class="classes.trend"
        viewBox="0 0 100 32"
        preserveAspectRatio="none"
        aria-hidden="true"
        data-sparkline="bars"
      >
        <rect
          v-for="(bar, index) in sparkBars"
          :key="index"
          :x="bar.x"
          :y="bar.y"
          :width="bar.width"
          :height="bar.height"
          rx="1"
          :fill="trendStroke"
          :fill-opacity="bar.last ? 1 : 0.35"
        />
      </svg>
      <template v-if="progress">
        <div
          role="progressbar"
          :aria-valuenow="progress.filled"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-label="progress.goal"
          :class="classes.progress"
        >
          <i
            class="block h-full rounded-full transition-[width] duration-500 ease-out"
            :style="{
              background: progress.reached ? 'var(--nut-dash-up-mark)' : trendStroke,
              width: `${progress.filled}%`,
            }"
          />
        </div>
        <div :class="classes.goal">
          <span>{{ progress.goal }}</span>
          <b class="font-semibold text-highlighted">{{ progress.completion }}</b>
        </div>
      </template>
    </template>
  </DashboardCard>
</template>

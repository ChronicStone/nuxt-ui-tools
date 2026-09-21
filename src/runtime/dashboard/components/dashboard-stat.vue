<script setup lang="ts" generic="TData">
import UIcon from '@nuxt/ui/components/Icon.vue'
import { twMerge } from 'tailwind-merge'
import { computed } from 'vue'

import type { LazyTextValue } from '#ui-tools/shared/types/utils'
import { isNumber } from '#ui-tools/shared/utils/predicate'
import { resolveTextValue } from '#ui-tools/shared/utils/render'

import { useDashboardFormat } from '../composables/use-dashboard-format'
import { useDashboardUi } from '../composables/use-dashboard-ui'
import type {
  DashboardBlockBaseProps,
  DashboardBlockUi,
  DashboardSourceLike,
  DashboardStatUi,
  DashboardValueFormat,
} from '../types'
import { resolveDashboardClasses } from '../utils/ui'
import DashboardSkeleton from './block/dashboard-skeleton.vue'
import DashboardCard from './dashboard-card.vue'

const {
  source,
  card = true,
  value,
  format,
  delta,
  deltaFormat,
  invertDelta = false,
  caption,
  label,
  icon,
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
    /** Change indicator, in percent by default. `null` hides it. */
    delta?: (data: TData & ({} | null)) => number | null | undefined
    deltaFormat?: DashboardValueFormat
    /** A decrease is good news (e.g. a failure rate): colors the delta accordingly. */
    invertDelta?: boolean
    /** Secondary text after the delta. Wraps under it when space runs out. */
    caption?: string | ((data: TData & ({} | null)) => LazyTextValue | undefined)
    icon?: string
    ui?: DashboardBlockUi & DashboardStatUi
  }
>()

defineSlots<{
  value?: (props: { data: TData & ({} | null); value: string }) => unknown
  caption?: (props: { data: TData & ({} | null) }) => unknown
}>()

const formats = useDashboardFormat()
const appUi = useDashboardUi()

const ready = computed(() => {
  const data = source.data
  return data === undefined ? null : { data }
})
const display = computed(() => {
  if (!ready.value) return ''
  const resolved = value(ready.value.data)
  return isNumber(resolved)
    ? (format ?? formats.number.value)(resolved)
    : resolveTextValue(resolved)
})
const change = computed(() => {
  if (!ready.value || !delta) return null
  const amount = delta(ready.value.data)
  if (amount === null || amount === undefined || !Number.isFinite(amount)) return null
  const good = invertDelta ? amount <= 0 : amount >= 0
  return { good, label: (deltaFormat ?? formats.delta.value)(amount), up: amount >= 0 }
})
const captionText = computed(() => {
  if (!ready.value || caption === undefined) return ''
  return typeof caption === 'function' ? resolveTextValue(caption(ready.value.data)) : caption
})

const classes = computed(() =>
  resolveDashboardClasses(
    {
      caption: 'min-w-0',
      delta: 'shrink-0 font-semibold tabular-nums',
      label: 'text-[12.5px] font-normal tracking-normal text-muted',
      mark: 'me-0.5 text-[9px]',
      meta: 'mt-2.5 flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs leading-[1.35] text-muted',
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
</script>

<template>
  <DashboardCard v-bind="block" :card :source :title="label" :ui="cardUi">
    <template #skeleton>
      <DashboardSkeleton kind="stat" />
    </template>
    <template v-if="icon" #header-right>
      <UIcon :name="icon" class="size-4 text-dimmed" />
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
    </template>
  </DashboardCard>
</template>

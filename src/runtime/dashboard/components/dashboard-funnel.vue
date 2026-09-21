<script setup lang="ts" generic="TRow">
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'
import type { LazyTextValue } from '#ui-tools/shared/types/utils'
import { resolveTextValue } from '#ui-tools/shared/utils/render'

import { useDashboardFormat } from '../composables/use-dashboard-format'
import { useDashboardUi } from '../composables/use-dashboard-ui'
import type {
  DashboardBlockBaseProps,
  DashboardBlockUi,
  DashboardFunnelUi,
  DashboardSeriesColor,
  DashboardSourceLike,
  DashboardValueFormat,
} from '../types'
import { resolveDashboardColor } from '../utils/charts'
import { resolveDashboardClasses } from '../utils/ui'
import DashboardSkeleton from './block/dashboard-skeleton.vue'
import DashboardCard from './dashboard-card.vue'

const {
  source,
  card = true,
  label,
  value,
  format,
  colors,
  ui,
  ...block
} = defineProps<
  Omit<DashboardBlockBaseProps, 'ui'> & {
    source: DashboardSourceLike<readonly TRow[] | undefined>
    label: (row: TRow) => LazyTextValue
    value: (row: TRow) => number
    format?: DashboardValueFormat
    /** Colors per step, in order. Defaults to the palette. */
    colors?: readonly DashboardSeriesColor[]
    ui?: DashboardBlockUi & DashboardFunnelUi
  }
>()

defineSlots<{
  'header-right'?: () => unknown
  toolbar?: () => unknown
  footer?: () => unknown
}>()

const { t } = useUiToolsLocale()
const formats = useDashboardFormat()
const appUi = useDashboardUi()
const classes = computed(() =>
  resolveDashboardClasses(
    {
      label: 'font-medium text-default',
      note: 'ms-auto shrink-0 text-xs text-muted',
      step: 'flex flex-col gap-1.5',
      track: 'h-[22px] overflow-hidden rounded-[5px] bg-[var(--nut-dash-track)]',
      value: 'text-[15px] font-semibold text-highlighted tabular-nums',
    },
    appUi.value.funnel,
    ui,
  ),
)

const steps = computed(() => {
  const data = source.data ?? []
  const values = data.map((row) => value(row))
  const first = values[0] ?? 0
  return data.map((row, index) => {
    const amount = values[index] ?? 0
    const previous = values[index - 1]
    return {
      color: resolveDashboardColor(colors?.[index], index),
      label: resolveTextValue(label(row)),
      note:
        previous === undefined
          ? t('dashboard.funnel.base')
          : t('dashboard.funnel.fromPrevious', {
              value: previous > 0 ? formats.percent.value((amount / previous) * 100) : '—',
            }),
      value: (format ?? formats.number.value)(amount),
      width: first > 0 ? `${(amount / first) * 100}%` : '0%',
    }
  })
})
</script>

<template>
  <DashboardCard v-bind="block" :card :ui :source :is-empty="steps.length === 0">
    <template #skeleton>
      <DashboardSkeleton kind="funnel" :count="4" />
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

    <ol class="flex flex-col gap-3.5 pt-1">
      <li v-for="(step, index) in steps" :key="index" :class="classes.step">
        <div class="flex items-baseline gap-2.5 text-[13px]">
          <b :class="classes.label">{{ step.label }}</b>
          <span :class="classes.value">{{ step.value }}</span>
          <small :class="classes.note">{{ step.note }}</small>
        </div>
        <div :class="classes.track">
          <i
            class="block h-full min-w-1.5 rounded-[5px] transition-[width] duration-500 ease-out"
            :style="{ background: step.color, width: step.width }"
          />
        </div>
      </li>
    </ol>
  </DashboardCard>
</template>

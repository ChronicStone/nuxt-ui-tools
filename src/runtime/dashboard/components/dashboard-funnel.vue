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
  DashboardDataTable,
  DashboardFunnelUi,
  DashboardSelectEvent,
  DashboardSeriesColor,
  DashboardSourceLike,
  DashboardValueFormat,
} from '../types'
import { resolveDashboardColor } from '../utils/charts'
import { toDashboardCell } from '../utils/export'
import {
  DASHBOARD_ROW_BUTTON,
  DASHBOARD_SELECTABLE_ROW,
  resolveDashboardClasses,
} from '../utils/ui'
import DashboardSkeleton from './block/dashboard-skeleton.vue'
import DashboardCard from './dashboard-card.vue'

const {
  source,
  card = true,
  menu = undefined,
  freshness = undefined,
  label,
  value,
  format,
  colors,
  onSelect,
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
    /** Makes each step a button. */
    onSelect?: (event: DashboardSelectEvent<TRow>) => void
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
    const ratio = previous === undefined || previous <= 0 ? null : (amount / previous) * 100
    return {
      amount,
      color: resolveDashboardColor(colors?.[index], index),
      index,
      label: resolveTextValue(label(row)),
      note:
        previous === undefined
          ? t('dashboard.funnel.base')
          : t('dashboard.funnel.fromPrevious', {
              value: ratio === null ? '—' : formats.percent.value(ratio),
            }),
      ratio,
      row,
      value: (format ?? formats.number.value)(amount),
      width: first > 0 ? `${(amount / first) * 100}%` : '0%',
    }
  })
})

function tabulate(): DashboardDataTable {
  return {
    columns: [
      { key: 'label', label: t('dashboard.table.label'), numeric: false },
      { key: 'value', label: t('dashboard.table.value'), numeric: true },
      { key: 'share', label: t('dashboard.table.share'), numeric: true },
    ],
    rows: steps.value.map((step) => [
      toDashboardCell(step.label),
      toDashboardCell(step.amount, step.value),
      toDashboardCell(
        step.ratio === null ? null : Math.round(step.ratio * 10) / 10,
        step.ratio === null ? '' : formats.percent.value(step.ratio),
      ),
    ]),
  }
}
</script>

<template>
  <DashboardCard
    v-bind="block"
    :card
    :menu
    :freshness
    :ui
    :source
    :is-empty="steps.length === 0"
    :tabulate
  >
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
      <li
        v-for="step in steps"
        :key="step.index"
        :class="[classes.step, onSelect && [DASHBOARD_SELECTABLE_ROW, 'py-1']]"
      >
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
        <button
          v-if="onSelect"
          type="button"
          :class="DASHBOARD_ROW_BUTTON"
          :aria-label="step.label"
          @click="onSelect({ index: step.index, row: step.row })"
        />
      </li>
    </ol>
  </DashboardCard>
</template>

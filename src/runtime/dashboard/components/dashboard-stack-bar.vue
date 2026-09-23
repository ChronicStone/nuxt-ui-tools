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
  DashboardSelectEvent,
  DashboardSeriesColor,
  DashboardSourceLike,
  DashboardStackBarUi,
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
  text,
  color,
  legendColumns = 2,
  onSelect,
  ui,
  ...block
} = defineProps<
  Omit<DashboardBlockBaseProps, 'ui'> & {
    source: DashboardSourceLike<readonly TRow[] | undefined>
    label: (row: TRow) => LazyTextValue
    value: (row: TRow) => number
    /** Legend value text. Defaults to the share in percent. */
    text?: (row: TRow, share: number) => LazyTextValue
    color?: (row: TRow, index: number) => DashboardSeriesColor | undefined
    /** Legend columns from the `sm` breakpoint (one column below). */
    legendColumns?: 1 | 2
    /** Makes each segment and legend entry selectable. */
    onSelect?: (event: DashboardSelectEvent<TRow>) => void
    ui?: DashboardBlockUi & DashboardStackBarUi
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
      item: 'flex min-w-0 items-center gap-2',
      legend: [
        'grid grid-cols-1 gap-x-[18px] gap-y-2 text-[13px]',
        legendColumns === 2 && 'sm:grid-cols-2',
      ]
        .filter(Boolean)
        .join(' '),
      track: 'mt-1.5 mb-4 flex h-3.5 gap-0.5 overflow-hidden rounded-full',
    },
    appUi.value.stackBar,
    ui,
  ),
)

const parts = computed(() => {
  const data = source.data ?? []
  const values = data.map((row) => value(row))
  const total = values.reduce((sum, amount) => sum + amount, 0)
  return data.map((row, index) => {
    const amount = values[index] ?? 0
    const share = total > 0 ? (amount / total) * 100 : 0
    return {
      amount,
      color: resolveDashboardColor(color?.(row, index), index),
      index,
      label: resolveTextValue(label(row)),
      row,
      share,
      text: text ? resolveTextValue(text(row, share)) : formats.percent(share),
      width: `${share}%`,
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
    rows: parts.value.map((part) => [
      toDashboardCell(part.label),
      toDashboardCell(part.amount, formats.number(part.amount)),
      toDashboardCell(Math.round(part.share * 10) / 10, formats.percent(part.share)),
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
    :is-empty="parts.length === 0"
    :tabulate
  >
    <template #skeleton>
      <DashboardSkeleton kind="stack" />
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

    <div :class="classes.track">
      <i
        v-for="part in parts"
        :key="part.index"
        class="block h-full transition-[width] duration-500 ease-out"
        :class="onSelect && 'cursor-pointer'"
        :style="{ background: part.color, width: part.width }"
        :title="`${part.label} · ${part.text}`"
        @click="onSelect?.({ index: part.index, row: part.row })"
      />
    </div>
    <ul :class="classes.legend">
      <li
        v-for="part in parts"
        :key="part.index"
        :class="[classes.item, onSelect && DASHBOARD_SELECTABLE_ROW]"
      >
        <span
          aria-hidden="true"
          class="size-[9px] shrink-0 rounded-[3px]"
          :style="{ background: part.color }"
        />
        <span class="min-w-0 flex-1 truncate text-muted">{{ part.label }}</span>
        <b class="shrink-0 font-semibold whitespace-nowrap text-highlighted tabular-nums">
          {{ part.text }}
        </b>
        <button
          v-if="onSelect"
          type="button"
          :class="DASHBOARD_ROW_BUTTON"
          :aria-label="part.label"
          @click="onSelect({ index: part.index, row: part.row })"
        />
      </li>
    </ul>
  </DashboardCard>
</template>

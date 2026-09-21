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
  DashboardPairedBarsUi,
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
  total,
  value,
  totalLabel,
  valueLabel,
  format,
  colors,
  limit,
  rowKey,
  onSelect,
  ui,
  ...block
} = defineProps<
  Omit<DashboardBlockBaseProps, 'ui'> & {
    source: DashboardSourceLike<readonly TRow[] | undefined>
    label: (row: TRow) => LazyTextValue
    /** Outer bar (e.g. registered). Scaled against the largest total. */
    total: (row: TRow) => number
    /** Inner bar, drawn inside the total (e.g. delivered). */
    value: (row: TRow) => number
    /** Legend labels. When both are set, a legend renders in the header. */
    totalLabel?: LazyTextValue
    valueLabel?: LazyTextValue
    format?: DashboardValueFormat
    /** `[total, value]` colors. */
    colors?: readonly [DashboardSeriesColor, DashboardSeriesColor]
    /** Rows shown in the card. The expand dialog, table view, and CSV export show them all. */
    limit?: number
    rowKey?: (row: TRow, index: number) => PropertyKey
    /** Makes each row a button. */
    onSelect?: (event: DashboardSelectEvent<TRow>) => void
    ui?: DashboardBlockUi & DashboardPairedBarsUi
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
      label: 'truncate text-[13px] text-default',
      row: 'grid grid-cols-[minmax(0,150px)_1fr_auto] items-center gap-3 py-1.5 max-sm:grid-cols-[minmax(0,110px)_1fr_auto]',
      track: 'h-3 overflow-hidden rounded-full bg-[var(--nut-dash-track)]',
      value: 'flex min-w-[130px] items-baseline justify-end gap-[5px] tabular-nums max-sm:min-w-0',
    },
    appUi.value.pairedBars,
    ui,
  ),
)

const totalColor = computed(() => resolveDashboardColor(colors?.[0] ?? 'series-4', 3))
const valueColor = computed(() => resolveDashboardColor(colors?.[1] ?? 'series-1', 0))
const legend = computed(() =>
  totalLabel && valueLabel
    ? [
        { color: totalColor.value, key: 'total', label: resolveTextValue(totalLabel) },
        { color: valueColor.value, key: 'value', label: resolveTextValue(valueLabel) },
      ]
    : undefined,
)
const formatValue = computed(() => format ?? formats.number.value)
const entries = computed(() =>
  (source.data ?? []).map((row, index) => {
    const outer = total(row)
    const inner = value(row)
    return {
      index,
      inner,
      innerWidth: outer > 0 ? `${Math.min(100, (inner / outer) * 100)}%` : '0%',
      key: rowKey?.(row, index) ?? index,
      label: resolveTextValue(label(row)),
      outer,
      ratio: outer > 0 ? formats.percent.value(Math.round((inner / outer) * 100)) : '',
      row,
    }
  }),
)
function visible(expanded: boolean) {
  const shown = limit && !expanded ? entries.value.slice(0, limit) : entries.value
  const largest = Math.max(0, ...shown.map((entry) => entry.outer))
  return shown.map((entry) => ({
    ...entry,
    outerWidth: largest > 0 ? `${(entry.outer / largest) * 100}%` : '0%',
  }))
}

function tabulate(): DashboardDataTable {
  return {
    columns: [
      { key: 'label', label: t('dashboard.table.label'), numeric: false },
      {
        key: 'value',
        label: resolveTextValue(valueLabel, t('dashboard.table.value')),
        numeric: true,
      },
      {
        key: 'total',
        label: resolveTextValue(totalLabel, t('dashboard.table.total')),
        numeric: true,
      },
    ],
    rows: entries.value.map((entry) => [
      toDashboardCell(entry.label),
      toDashboardCell(entry.inner, formatValue.value(entry.inner)),
      toDashboardCell(entry.outer, formatValue.value(entry.outer)),
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
    :legend
    :is-empty="entries.length === 0"
    :tabulate
  >
    <template #skeleton>
      <DashboardSkeleton kind="paired" :count="limit ?? 8" />
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

    <template #default="{ expanded }">
      <ul class="flex flex-col">
        <li
          v-for="entry in visible(expanded)"
          :key="entry.key"
          :class="[classes.row, onSelect && DASHBOARD_SELECTABLE_ROW]"
        >
          <span :class="classes.label" :title="entry.label">{{ entry.label }}</span>
          <div :class="classes.track">
            <div
              class="relative h-full rounded-full transition-[width] duration-500 ease-out"
              :style="{ background: totalColor, width: entry.outerWidth }"
            >
              <div
                class="absolute inset-y-0 start-0 rounded-full transition-[width] duration-500 ease-out"
                :style="{ background: valueColor, width: entry.innerWidth }"
              />
            </div>
          </div>
          <span :class="classes.value">
            <b class="text-[13.5px] font-semibold text-highlighted">
              {{ formatValue(entry.inner) }}
            </b>
            <span class="text-xs text-muted">/ {{ formatValue(entry.outer) }}</span>
            <small class="min-w-[34px] text-end text-[11.5px] text-dimmed max-sm:hidden">
              {{ entry.ratio }}
            </small>
          </span>
          <button
            v-if="onSelect"
            type="button"
            :class="DASHBOARD_ROW_BUTTON"
            :aria-label="entry.label"
            @click="onSelect({ index: entry.index, row: entry.row })"
          />
        </li>
      </ul>
    </template>
  </DashboardCard>
</template>

<script setup lang="ts" generic="TRow">
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'
import type { LazyTextValue } from '#ui-tools/shared/types/utils'
import { resolveTextValue } from '#ui-tools/shared/utils/render'

import { useDashboardFormat } from '../composables/use-dashboard-format'
import { useDashboardUi } from '../composables/use-dashboard-ui'
import type {
  DashboardBarsUi,
  DashboardBlockBaseProps,
  DashboardBlockUi,
  DashboardDataTable,
  DashboardRowActions,
  DashboardSelected,
  DashboardSelectEvent,
  DashboardSeriesColor,
  DashboardSourceLike,
  DashboardValueFormat,
} from '../types'
import { fadeDashboardColor, resolveDashboardColor } from '../utils/charts'
import { toDashboardCell } from '../utils/export'
import {
  DASHBOARD_ROW_BUTTON,
  DASHBOARD_SELECTABLE_ROW,
  DASHBOARD_SELECTED_ROW,
  resolveDashboardClasses,
} from '../utils/ui'
import DashboardRowActionsMenu from './block/dashboard-row-actions.vue'
import DashboardSkeleton from './block/dashboard-skeleton.vue'
import DashboardCard from './dashboard-card.vue'

const {
  source,
  card = true,
  menu = undefined,
  freshness = undefined,
  label,
  tag,
  value,
  meta,
  format,
  max,
  color,
  emphasis = 'all',
  limit,
  rowKey,
  selected,
  rowActions,
  onSelect,
  ui,
  ...block
} = defineProps<
  Omit<DashboardBlockBaseProps, 'ui'> & {
    source: DashboardSourceLike<readonly TRow[] | undefined>
    label: (row: TRow) => LazyTextValue
    /** Small monospace tag after the label (version, code…). */
    tag?: (row: TRow) => LazyTextValue | undefined
    /** Bar length. */
    value: (row: TRow) => number
    /** Right-aligned text. Defaults to the formatted value. */
    meta?: (row: TRow) => LazyTextValue
    format?: DashboardValueFormat
    /** Value of a full bar. Defaults to the largest value. */
    max?: number
    color?: DashboardSeriesColor
    /** `first`: only the leading row takes `color`, the others use the muted tone. */
    emphasis?: 'all' | 'first'
    /** Rows shown in the card. The expand dialog, table view, and CSV export show them all. */
    limit?: number
    rowKey?: (row: TRow, index: number) => PropertyKey
    /** Rows shown as selected: their bars keep `color`, the others fade. */
    selected?: DashboardSelected<TRow>
    /** Actions of each row: inline icon buttons and a `⋮` menu after the value. */
    rowActions?: DashboardRowActions<TRow>
    /** Makes each row a button. */
    onSelect?: (event: DashboardSelectEvent<TRow>) => void
    ui?: DashboardBlockUi & DashboardBarsUi
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
      fill: 'block h-full rounded-full transition-[width] duration-500 ease-out',
      label: 'min-w-0 truncate font-medium text-default',
      meta: 'shrink-0 text-xs text-muted tabular-nums',
      row: 'flex flex-col gap-[5px] py-1.5 text-[13px]',
      tag: 'ms-1.5 font-mono text-[11px] font-normal text-dimmed',
      track: 'h-1.5 overflow-hidden rounded-full bg-[var(--nut-dash-track)]',
    },
    appUi.value.bars,
    ui,
  ),
)

const fill = computed(() => resolveDashboardColor(color, 0))
const entries = computed(() =>
  (source.data ?? []).map((row, index) => {
    const amount = value(row)
    return {
      actions: rowActions?.(row, index) ?? [],
      amount,
      index,
      key: rowKey?.(row, index) ?? index,
      label: resolveTextValue(label(row)),
      meta: meta ? resolveTextValue(meta(row)) : (format ?? formats.number.value)(amount),
      row,
      selected: selected?.(row, index) ?? false,
      tag: tag ? resolveTextValue(tag(row)) : '',
    }
  }),
)
const anySelected = computed(() => entries.value.some((entry) => entry.selected))
// Bars scale to the largest value on screen, so the dialog may draw them shorter than the card.
function visible(expanded: boolean) {
  const shown = limit && !expanded ? entries.value.slice(0, limit) : entries.value
  const full = max ?? Math.max(0, ...shown.map((entry) => entry.amount))
  return shown.map((entry) => ({
    ...entry,
    color: anySelected.value
      ? entry.selected
        ? fill.value
        : fadeDashboardColor(fill.value)
      : emphasis === 'first' && entry.index > 0
        ? 'var(--nut-dash-muted)'
        : fill.value,
    width: full > 0 ? `${Math.max(0, Math.min(100, (entry.amount / full) * 100))}%` : '0%',
  }))
}

function tabulate(): DashboardDataTable {
  return {
    columns: [
      { key: 'label', label: t('dashboard.table.label'), numeric: false },
      { key: 'value', label: t('dashboard.table.value'), numeric: true },
    ],
    rows: entries.value.map((entry) => [
      toDashboardCell(entry.tag ? `${entry.label} ${entry.tag}` : entry.label),
      toDashboardCell(entry.amount, (format ?? formats.number.value)(entry.amount)),
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
    :is-empty="entries.length === 0"
    :tabulate
  >
    <template #skeleton>
      <DashboardSkeleton kind="hbars" :count="limit ?? 5" />
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
          :data-selected="entry.selected || undefined"
          :class="[
            classes.row,
            onSelect && DASHBOARD_SELECTABLE_ROW,
            entry.selected && DASHBOARD_SELECTED_ROW,
          ]"
        >
          <div class="flex items-baseline justify-between gap-2.5">
            <span :class="classes.label">
              {{ entry.label }}<small v-if="entry.tag" :class="classes.tag">{{ entry.tag }}</small>
            </span>
            <span :class="classes.meta">{{ entry.meta }}</span>
            <DashboardRowActionsMenu
              v-if="entry.actions.length"
              :actions="entry.actions"
              :label="entry.label"
              class="-my-1.5 self-center"
            />
          </div>
          <div :class="classes.track">
            <i :class="classes.fill" :style="{ background: entry.color, width: entry.width }" />
          </div>
          <button
            v-if="onSelect"
            type="button"
            :class="DASHBOARD_ROW_BUTTON"
            :aria-label="entry.label"
            :aria-pressed="selected ? entry.selected : undefined"
            @click="onSelect({ index: entry.index, row: entry.row })"
          />
        </li>
      </ul>
    </template>
  </DashboardCard>
</template>

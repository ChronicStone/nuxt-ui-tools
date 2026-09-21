<script setup lang="ts" generic="TRow">
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'
import type { LazyTextValue } from '#ui-tools/shared/types/utils'
import { isNumber } from '#ui-tools/shared/utils/predicate'
import { resolveTextValue } from '#ui-tools/shared/utils/render'

import { useDashboardFormat } from '../composables/use-dashboard-format'
import { useDashboardUi } from '../composables/use-dashboard-ui'
import type {
  DashboardAlertAction,
  DashboardAlertSeverity,
  DashboardAlertsUi,
  DashboardBlockBaseProps,
  DashboardBlockUi,
  DashboardDataTable,
  DashboardRowActions,
  DashboardSelected,
  DashboardSelectEvent,
  DashboardSourceLike,
  DashboardValueFormat,
} from '../types'
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
  severity,
  label,
  description,
  value,
  format,
  icon,
  action,
  order = 'severity',
  limit,
  rowKey,
  selected,
  rowActions,
  onSelect,
  empty,
  ui,
  ...block
} = defineProps<
  Omit<DashboardBlockBaseProps, 'ui'> & {
    source: DashboardSourceLike<readonly TRow[] | undefined>
    severity: (row: TRow) => DashboardAlertSeverity
    /** What needs attention. */
    label: (row: TRow) => LazyTextValue
    description?: (row: TRow) => LazyTextValue | undefined
    /** Trailing figure (a count, an amount). Numbers go through `format`. */
    value?: (row: TRow) => LazyTextValue | null | undefined
    format?: DashboardValueFormat
    /** Icon of the row. Defaults to the severity's icon. */
    icon?: (row: TRow) => string | undefined
    /** Button at the end of the row (a link or a handler). */
    action?: (row: TRow) => DashboardAlertAction | null | undefined
    /** `severity` (default): most severe first, ties in source order. `source`: as received. */
    order?: 'severity' | 'source'
    /** Rows shown in the card. The expand dialog, table view, and CSV export show them all. */
    limit?: number
    rowKey?: (row: TRow, index: number) => PropertyKey
    /** Rows shown as selected (the value a `select` handler stored). */
    selected?: DashboardSelected<TRow>
    /** More actions of each row: inline icon buttons and a `⋮` menu after its `action`. */
    rowActions?: DashboardRowActions<TRow>
    /** Makes each row a button (next to its `action`). */
    onSelect?: (event: DashboardSelectEvent<TRow>) => void
    ui?: DashboardBlockUi & DashboardAlertsUi
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
      action: 'relative z-[1] shrink-0',
      description: 'block truncate text-xs text-muted',
      icon: 'grid size-8 shrink-0 place-items-center rounded-lg',
      label: 'block truncate text-[13px] font-medium text-default',
      row: 'flex min-w-0 items-center gap-3 py-2.5',
      value: 'shrink-0 text-sm font-semibold text-highlighted tabular-nums',
    },
    appUi.value.alerts,
    ui,
  ),
)

const rank: Record<DashboardAlertSeverity, number> = { error: 0, info: 2, success: 3, warning: 1 }
const icons: Record<DashboardAlertSeverity, string> = {
  error: 'i-lucide-octagon-alert',
  info: 'i-lucide-info',
  success: 'i-lucide-circle-check',
  warning: 'i-lucide-triangle-alert',
}

const entries = computed(() => {
  const rows = (source.data ?? []).map((row, index) => {
    const level = severity(row)
    const raw = value?.(row)
    const button = action?.(row)
    return {
      action: button ? { ...button, label: resolveTextValue(button.label) } : null,
      actions: rowActions?.(row, index) ?? [],
      color: `var(--ui-${level})`,
      description: description ? resolveTextValue(description(row)) : '',
      icon: icon?.(row) ?? icons[level],
      index,
      key: rowKey?.(row, index) ?? index,
      label: resolveTextValue(label(row)),
      level,
      raw,
      row,
      selected: selected?.(row, index) ?? false,
      value:
        raw === null || raw === undefined
          ? ''
          : isNumber(raw)
            ? (format ?? formats.number.value)(raw)
            : resolveTextValue(raw),
    }
  })
  // `rows` is a fresh array, and the sort is stable: equal severities keep their source order.
  return order === 'severity' ? rows.sort((a, b) => rank[a.level] - rank[b.level]) : rows
})
const visible = (expanded: boolean) =>
  limit && !expanded ? entries.value.slice(0, limit) : entries.value

// "All clear" is good news: the empty state says so unless the app sets its own.
const emptyContent = computed(() => ({
  icon: 'i-lucide-circle-check',
  title: t('dashboard.alerts.empty'),
  ...empty,
}))

function tabulate(): DashboardDataTable {
  const columns = [
    { key: 'severity', label: t('dashboard.table.severity'), numeric: false },
    { key: 'label', label: t('dashboard.table.label'), numeric: false },
    description && { key: 'description', label: t('dashboard.table.description'), numeric: false },
    value && { key: 'value', label: t('dashboard.table.value'), numeric: true },
  ]
  return {
    columns: columns.filter((column) => column !== undefined),
    rows: entries.value.map((entry) =>
      [
        toDashboardCell(t(`dashboard.alerts.severity.${entry.level}`)),
        toDashboardCell(entry.label),
        description && toDashboardCell(entry.description),
        value && toDashboardCell(isNumber(entry.raw) ? entry.raw : entry.value, entry.value),
      ].filter((cell) => cell !== undefined),
    ),
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
    :empty="emptyContent"
    :is-empty="entries.length === 0"
    :tabulate
  >
    <template #skeleton>
      <DashboardSkeleton kind="rows" leading="icon" :count="limit ?? 4" />
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
      <ul class="flex flex-col divide-y divide-[var(--nut-dash-grid)]">
        <li
          v-for="entry in visible(expanded)"
          :key="entry.key"
          :data-severity="entry.level"
          :data-selected="entry.selected || undefined"
          :class="[
            classes.row,
            onSelect && DASHBOARD_SELECTABLE_ROW,
            entry.selected && DASHBOARD_SELECTED_ROW,
          ]"
        >
          <span
            :class="classes.icon"
            :style="{
              background: `color-mix(in oklab, ${entry.color} 12%, transparent)`,
              color: entry.color,
            }"
          >
            <UIcon :name="entry.icon" class="size-4" />
            <span class="sr-only">{{ t(`dashboard.alerts.severity.${entry.level}`) }}</span>
          </span>
          <div class="min-w-0 flex-1">
            <b :class="classes.label">{{ entry.label }}</b>
            <small v-if="entry.description" :class="classes.description">
              {{ entry.description }}
            </small>
          </div>
          <span v-if="entry.value" :class="classes.value">{{ entry.value }}</span>
          <button
            v-if="onSelect"
            type="button"
            :class="DASHBOARD_ROW_BUTTON"
            :aria-label="entry.label"
            :aria-pressed="selected ? entry.selected : undefined"
            @click="onSelect({ index: entry.index, row: entry.row })"
          />
          <UButton
            v-if="entry.action"
            color="neutral"
            variant="outline"
            size="xs"
            :label="entry.action.label"
            :icon="entry.action.icon"
            :to="entry.action.to"
            :class="classes.action"
            @click="entry.action.onClick"
          />
          <DashboardRowActionsMenu
            v-if="entry.actions.length"
            :actions="entry.actions"
            :label="entry.label"
          />
        </li>
      </ul>
    </template>
  </DashboardCard>
</template>

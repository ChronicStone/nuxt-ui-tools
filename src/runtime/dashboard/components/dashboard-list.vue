<script setup lang="ts" generic="TRow">
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

import { useUiToolsLocale } from '#ui-tools/i18n'
import type { LazyTextValue } from '#ui-tools/shared/types/utils'
import { isNumber } from '#ui-tools/shared/utils/predicate'
import { resolveTextValue } from '#ui-tools/shared/utils/render'

import { useDashboardFormat } from '../composables/use-dashboard-format'
import { useDashboardUi } from '../composables/use-dashboard-ui'
import type {
  DashboardBlockBaseProps,
  DashboardBlockUi,
  DashboardDataTable,
  DashboardListUi,
  DashboardRowActions,
  DashboardSelected,
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
  DASHBOARD_SELECTED_ROW,
  resolveDashboardClasses,
} from '../utils/ui'
import DashboardRing from './block/dashboard-ring.vue'
import DashboardRowActionsMenu from './block/dashboard-row-actions.vue'
import DashboardSkeleton from './block/dashboard-skeleton.vue'
import DashboardCard from './dashboard-card.vue'

const {
  source,
  card = true,
  menu = undefined,
  freshness = undefined,
  label,
  description,
  value,
  format,
  percent,
  delta,
  leading,
  leadingText,
  icon,
  color,
  limit,
  rowKey,
  selected,
  to,
  rowActions,
  onSelect,
  ui,
  ...block
} = defineProps<
  Omit<DashboardBlockBaseProps, 'ui'> & {
    source: DashboardSourceLike<readonly TRow[] | undefined>
    label: (row: TRow) => LazyTextValue
    description?: (row: TRow) => LazyTextValue | undefined
    /** Trailing value. Numbers go through `format`. */
    value?: (row: TRow) => LazyTextValue
    format?: DashboardValueFormat
    /** Share in percent, shown before the value (inside the ring with `leading: 'ring'`). */
    percent?: (row: TRow) => number | null | undefined
    /** Change in percent, colored by sign. */
    delta?: (row: TRow) => number | null | undefined
    /**
     * Leading visual: initials avatar, a short monospace code chip (country, currency…), or a
     * progress ring filled to `percent`.
     */
    leading?: 'avatar' | 'code' | 'ring'
    /** Avatar initials or code text. Defaults to the label initials. */
    leadingText?: (row: TRow) => string
    icon?: (row: TRow) => string | undefined
    /** Ring color of `leading: 'ring'`. Defaults to the palette order. */
    color?: (row: TRow, index: number) => DashboardSeriesColor | undefined
    /** Rows shown in the card. The expand dialog, table view, and CSV export show them all. */
    limit?: number
    rowKey?: (row: TRow, index: number) => PropertyKey
    /** Rows shown as selected (the value a `select` handler stored). */
    selected?: DashboardSelected<TRow>
    /** Makes each row a link to what this returns (rows returning `undefined` stay plain). */
    to?: (row: TRow, index: number) => RouteLocationRaw | undefined
    /** Actions of each row: inline icon buttons and a `⋮` menu at the end of the row. */
    rowActions?: DashboardRowActions<TRow>
    /** Makes each row a button. */
    onSelect?: (event: DashboardSelectEvent<TRow>) => void
    ui?: DashboardBlockUi & DashboardListUi
  }
>()

defineSlots<{
  item?: (props: { row: TRow; index: number }) => unknown
  trailing?: (props: { row: TRow; index: number }) => unknown
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
      avatar:
        'grid size-[30px] shrink-0 place-items-center rounded-[7px] bg-elevated text-[11px] font-semibold text-muted',
      code: 'grid h-[22px] min-w-8 shrink-0 place-items-center rounded-[5px] bg-elevated px-1.5 font-mono text-[11px] font-semibold text-muted',
      delta: 'shrink-0 text-xs font-semibold tabular-nums',
      description: 'block truncate text-xs text-muted',
      label: 'block truncate font-medium text-default',
      ring: 'text-[9.5px] font-semibold tracking-tight whitespace-nowrap text-default tabular-nums',
      row: 'flex min-w-0 items-center gap-3 py-[9px] text-[13px]',
      share: 'shrink-0 text-xs text-muted tabular-nums',
      value: 'shrink-0 font-semibold text-highlighted tabular-nums',
    },
    appUi.value.list,
    ui,
  ),
)

const entries = computed(() =>
  (source.data ?? []).map((row, index) => {
    const text = resolveTextValue(label(row))
    const raw = value?.(row)
    const change = delta?.(row)
    const share = percent?.(row)
    return {
      actions: rowActions?.(row, index) ?? [],
      change: isNumber(change) ? { good: change >= 0, label: formats.delta(change) } : null,
      color: resolveDashboardColor(color?.(row, index), index),
      delta: change,
      description: description ? resolveTextValue(description(row)) : '',
      icon: icon?.(row),
      index,
      key: rowKey?.(row, index) ?? index,
      label: text,
      leading:
        leading === 'avatar' || leading === 'code' ? (leadingText?.(row) ?? initials(text)) : '',
      percent: share,
      raw,
      row,
      selected: selected?.(row, index) ?? false,
      target: to?.(row, index),
      share: isNumber(share) ? formats.percent(share) : '',
      value: isNumber(raw) ? formats.resolve(format)(raw) : resolveTextValue(raw),
    }
  }),
)
const visible = (expanded: boolean) =>
  limit && !expanded ? entries.value.slice(0, limit) : entries.value

function tabulate(): DashboardDataTable {
  const columns = [
    { key: 'label', label: t('dashboard.table.label'), numeric: false },
    description && { key: 'description', label: t('dashboard.table.description'), numeric: false },
    percent && { key: 'share', label: t('dashboard.table.share'), numeric: true },
    delta && { key: 'change', label: t('dashboard.table.change'), numeric: true },
    value && { key: 'value', label: t('dashboard.table.value'), numeric: true },
  ]
  return {
    columns: columns.filter((column) => column !== undefined),
    rows: entries.value.map((entry) =>
      [
        toDashboardCell(entry.label),
        description && toDashboardCell(entry.description),
        percent && toDashboardCell(entry.percent, entry.share),
        delta && toDashboardCell(entry.delta, entry.change?.label ?? ''),
        value && toDashboardCell(isNumber(entry.raw) ? entry.raw : entry.value, entry.value),
      ].filter((cell) => cell !== undefined),
    ),
  }
}

function initials(text: string) {
  return text
    .split(/\s+/u)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
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
      <DashboardSkeleton
        kind="rows"
        :count="limit ?? 6"
        :leading="leading === 'ring' ? 'icon' : leading"
      />
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
          :data-selected="entry.selected || undefined"
          :class="[
            classes.row,
            (onSelect || entry.target !== undefined) && DASHBOARD_SELECTABLE_ROW,
            entry.selected && DASHBOARD_SELECTED_ROW,
          ]"
        >
          <slot name="item" :row="entry.row" :index="entry.index">
            <span v-if="leading === 'avatar'" :class="classes.avatar">{{ entry.leading }}</span>
            <span v-else-if="leading === 'code'" :class="classes.code">{{ entry.leading }}</span>
            <DashboardRing
              v-else-if="leading === 'ring'"
              :ratio="(entry.percent ?? 0) / 100"
              :color="entry.color"
              :size="40"
              :thickness="3"
            >
              <span :class="classes.ring">{{ entry.share }}</span>
            </DashboardRing>
            <UIcon v-else-if="entry.icon" :name="entry.icon" class="size-4 shrink-0 text-dimmed" />
            <div class="min-w-0 flex-1">
              <b :class="classes.label">{{ entry.label }}</b>
              <small v-if="entry.description" :class="classes.description">
                {{ entry.description }}
              </small>
            </div>
            <span v-if="entry.share && leading !== 'ring'" :class="classes.share">
              {{ entry.share }}
            </span>
            <span
              v-if="entry.change"
              :data-trend="entry.change.good ? 'up' : 'down'"
              :class="[
                classes.delta,
                entry.change.good ? 'text-[var(--nut-dash-up)]' : 'text-[var(--nut-dash-down)]',
              ]"
            >
              {{ entry.change.label }}
            </span>
            <span :class="classes.value">
              <slot name="trailing" :row="entry.row" :index="entry.index">{{ entry.value }}</slot>
            </span>
          </slot>
          <button
            v-if="onSelect"
            type="button"
            :class="DASHBOARD_ROW_BUTTON"
            :aria-label="entry.label"
            :aria-pressed="selected ? entry.selected : undefined"
            @click="onSelect({ index: entry.index, row: entry.row })"
          />
          <UButton
            v-else-if="entry.target !== undefined"
            :to="entry.target"
            variant="link"
            :aria-label="entry.label"
            :class="DASHBOARD_ROW_BUTTON"
            data-row-link
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

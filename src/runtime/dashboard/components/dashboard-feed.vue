<script setup lang="ts" generic="TRow">
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'
import type { LazyTextValue } from '#ui-tools/shared/types/utils'
import { resolveTextValue } from '#ui-tools/shared/utils/render'

import { useDashboardTime } from '../composables/use-dashboard-time'
import { useDashboardUi } from '../composables/use-dashboard-ui'
import type {
  DashboardBlockBaseProps,
  DashboardBlockUi,
  DashboardDataTable,
  DashboardFeedUi,
  DashboardRowActions,
  DashboardSelected,
  DashboardSelectEvent,
  DashboardSeriesColor,
  DashboardSourceLike,
  DashboardTimeValue,
} from '../types'
import { resolveDashboardColor } from '../utils/charts'
import { toDashboardCell } from '../utils/export'
import { startOfDashboardDay, toDashboardTime } from '../utils/time'
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
  description,
  time,
  icon,
  color,
  avatar,
  groupBy,
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
    /** What happened. */
    label: (row: TRow) => LazyTextValue
    description?: (row: TRow) => LazyTextValue | undefined
    /** When it happened: a `Date`, epoch milliseconds, or an ISO string. Shown relative to now. */
    time: (row: TRow) => DashboardTimeValue
    /** Icon on the timeline rail. Without `icon` or `avatar`, the rail shows a dot. */
    icon?: (row: TRow) => string | undefined
    /** Tint of the icon or dot: a palette slot, a Nuxt UI color, or any CSS color. */
    color?: (row: TRow) => DashboardSeriesColor | undefined
    /** Image URL shown on the rail instead of the icon (who did it). */
    avatar?: (row: TRow) => string | undefined
    /** `day`: a heading per day (`Today`, `Yesterday`, then the date). Rows keep source order. */
    groupBy?: 'day'
    /** Events shown in the card. The expand dialog, table view, and CSV export show them all. */
    limit?: number
    rowKey?: (row: TRow, index: number) => PropertyKey
    /** Events shown as selected (the value a `select` handler stored). */
    selected?: DashboardSelected<TRow>
    /** Actions of each event: inline icon buttons and a `⋮` menu after its time. */
    rowActions?: DashboardRowActions<TRow>
    /** Makes each event a button. */
    onSelect?: (event: DashboardSelectEvent<TRow>) => void
    ui?: DashboardBlockUi & DashboardFeedUi
  }
>()

defineSlots<{
  'header-right'?: () => unknown
  toolbar?: () => unknown
  footer?: () => unknown
}>()

const { t } = useUiToolsLocale()
const clock = useDashboardTime()
const appUi = useDashboardUi()
const classes = computed(() =>
  resolveDashboardClasses(
    {
      description: 'mt-0.5 block text-xs text-muted',
      group: 'pt-1 pb-2.5 text-[11px] font-semibold tracking-wide text-dimmed uppercase',
      item: 'flex min-w-0 gap-3',
      label: 'min-w-0 flex-1 text-[13px] text-default',
      marker: 'relative z-[1] grid size-7 shrink-0 place-items-center overflow-hidden rounded-full',
      time: 'shrink-0 text-[11.5px] text-dimmed tabular-nums',
    },
    appUi.value.feed,
    ui,
  ),
)

const entries = computed(() =>
  (source.data ?? []).map((row, index) => {
    const at = toDashboardTime(time(row))
    return {
      actions: rowActions?.(row, index) ?? [],
      at,
      avatar: avatar?.(row),
      color: resolveDashboardColor(color?.(row) ?? 'neutral', 0),
      day: startOfDashboardDay(at),
      description: description ? resolveTextValue(description(row)) : '',
      icon: icon?.(row),
      index,
      key: rowKey?.(row, index) ?? index,
      label: resolveTextValue(label(row)),
      row,
      selected: selected?.(row, index) ?? false,
    }
  }),
)

type Entry = (typeof entries.value)[number]

/** Consecutive events of the same day share a heading. */
function groups(expanded: boolean) {
  const shown = limit && !expanded ? entries.value.slice(0, limit) : entries.value
  if (groupBy !== 'day') return [{ entries: shown, key: 'all', time: undefined }]
  const grouped: { key: string; time: number | undefined; entries: Entry[] }[] = []
  for (const entry of shown) {
    const last = grouped.at(-1)
    if (last?.time === entry.day) last.entries.push(entry)
    else grouped.push({ entries: [entry], key: String(entry.day), time: entry.day })
  }
  return grouped
}

function tabulate(): DashboardDataTable {
  const columns = [
    { key: 'time', label: t('dashboard.table.time'), numeric: false },
    { key: 'label', label: t('dashboard.table.label'), numeric: false },
    description && { key: 'description', label: t('dashboard.table.description'), numeric: false },
  ]
  return {
    columns: columns.filter((column) => column !== undefined),
    rows: entries.value.map((entry) =>
      [
        toDashboardCell(
          Number.isFinite(entry.at) ? new Date(entry.at).toISOString() : '',
          clock.absolute(entry.at),
        ),
        toDashboardCell(entry.label),
        description && toDashboardCell(entry.description),
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
    :is-empty="entries.length === 0"
    :tabulate
  >
    <template #skeleton>
      <DashboardSkeleton kind="feed" :count="limit ?? 5" />
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
      <div class="flex flex-col">
        <section v-for="group in groups(expanded)" :key="group.key">
          <h3 v-if="group.time !== undefined" :class="classes.group">
            {{ clock.day(group.time) }}
          </h3>
          <ol class="flex flex-col">
            <li
              v-for="(entry, position) in group.entries"
              :key="entry.key"
              :data-selected="entry.selected || undefined"
              :class="[
                classes.item,
                onSelect && DASHBOARD_SELECTABLE_ROW,
                entry.selected && DASHBOARD_SELECTED_ROW,
              ]"
            >
              <!-- Rail: the marker, then a line down to the next event of the group -->
              <div class="relative flex w-7 shrink-0 flex-col items-center">
                <span v-if="entry.avatar" :class="classes.marker" class="bg-elevated">
                  <img :src="entry.avatar" alt="" class="size-full object-cover" />
                </span>
                <span
                  v-else-if="entry.icon"
                  :class="classes.marker"
                  :style="{
                    background: `color-mix(in oklab, ${entry.color} 12%, var(--ui-bg))`,
                    color: entry.color,
                  }"
                >
                  <UIcon :name="entry.icon" class="size-3.5" />
                </span>
                <span v-else :class="classes.marker">
                  <span class="size-2 rounded-full" :style="{ background: entry.color }" />
                </span>
                <span
                  v-if="position < group.entries.length - 1"
                  aria-hidden="true"
                  class="w-px flex-1 bg-[var(--nut-dash-grid)]"
                />
              </div>
              <div class="flex min-w-0 flex-1 items-baseline gap-3 pt-[5px] pb-3.5">
                <div :class="classes.label">
                  {{ entry.label }}
                  <small v-if="entry.description" :class="classes.description">
                    {{ entry.description }}
                  </small>
                </div>
                <time
                  :datetime="
                    Number.isFinite(entry.at) ? new Date(entry.at).toISOString() : undefined
                  "
                  :title="clock.absolute(entry.at)"
                  :class="classes.time"
                  data-allow-mismatch="text"
                >
                  {{ clock.relative(entry.at) }}
                </time>
                <DashboardRowActionsMenu
                  v-if="entry.actions.length"
                  :actions="entry.actions"
                  :label="entry.label"
                  class="-my-1 self-center"
                />
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
          </ol>
        </section>
      </div>
    </template>
  </DashboardCard>
</template>

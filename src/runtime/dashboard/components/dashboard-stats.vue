<script setup lang="ts" generic="TData">
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'
import { useResponsiveValue } from '#ui-tools/shared/composables/use-responsive-value'
import { isNumber, isString } from '#ui-tools/shared/utils/predicate'
import { resolveTextValue } from '#ui-tools/shared/utils/render'

import { useDashboardFormat } from '../composables/use-dashboard-format'
import { useDashboardUi } from '../composables/use-dashboard-ui'
import type {
  DashboardBlockBaseProps,
  DashboardBlockUi,
  DashboardDataTable,
  DashboardSourceLike,
  DashboardStatsItem,
  DashboardStatsUi,
} from '../types'
import { resolveDashboardColor } from '../utils/charts'
import { toDashboardCell } from '../utils/export'
import { resolveDashboardClasses } from '../utils/ui'
import DashboardSkeleton from './block/dashboard-skeleton.vue'
import DashboardCard from './dashboard-card.vue'

const {
  source,
  card = true,
  menu = undefined,
  freshness = undefined,
  items,
  columns,
  variant = 'plain',
  ui,
  ...block
} = defineProps<
  Omit<DashboardBlockBaseProps, 'ui'> & {
    source: DashboardSourceLike<TData>
    /** Figures read from the source data, in display order. */
    items: readonly DashboardStatsItem<TData & ({} | null)>[]
    /**
     * Column count, responsive: `"2 md:4"`. Defaults to one column per figure (up to 4), two on
     * small screens.
     */
    columns?: string
    /**
     * `plain`: figures side by side. `divided`: 1px rules between them. `tiles`: each figure in its
     * own bordered box.
     */
    variant?: 'plain' | 'divided' | 'tiles'
    ui?: DashboardBlockUi & DashboardStatsUi
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

const variants = {
  divided: {
    item: 'bg-default px-4 py-1',
    root: '-mx-4 gap-px bg-[var(--nut-dash-grid)]',
  },
  plain: { item: '', root: 'gap-x-6 gap-y-5' },
  tiles: { item: 'rounded-lg border border-default p-3.5', root: 'gap-3' },
} as const

const classes = computed(() =>
  resolveDashboardClasses(
    {
      caption: 'min-w-0',
      delta: 'shrink-0 font-semibold tabular-nums',
      icon: 'grid size-7 shrink-0 place-items-center rounded-md',
      item: `flex min-w-0 flex-col ${variants[variant].item}`,
      label: 'min-w-0 truncate text-xs text-muted',
      meta: 'mt-1 flex min-w-0 flex-wrap items-baseline gap-x-1.5 text-[11.5px] text-muted',
      progress: 'mt-2.5 h-1.5 overflow-hidden rounded-full bg-[var(--nut-dash-track)]',
      grid: `grid ${variants[variant].root}`,
      status:
        'inline-flex shrink-0 items-center rounded-full px-1.5 py-px text-[10.5px] font-semibold',
      value:
        'mt-1.5 flex min-w-0 items-center gap-2 text-xl leading-tight font-semibold tracking-tight text-highlighted tabular-nums',
    },
    appUi.value.stats,
    ui,
  ),
)

const columnCount = computed(() => {
  if (columns) return columns
  const count = Math.max(1, Math.min(items.length, 4))
  return count > 2 ? `2 md:${count}` : String(count)
})
const gridColumns = useResponsiveValue(() => columnCount.value, 'grid-cols')

const entries = computed(() => {
  const data = source.data
  if (data === undefined) return []
  return items.map((item, index) => {
    const raw = item.value(data)
    const amount = item.delta?.(data)
    const done = item.progress?.(data)
    const status = item.status?.(data)
    const caption =
      item.caption === undefined || isString(item.caption) || isNumber(item.caption)
        ? item.caption
        : item.caption(data)
    const good = isNumber(amount) ? (item.invertDelta ? amount <= 0 : amount >= 0) : false
    return {
      caption: resolveTextValue(caption),
      change: isNumber(amount) && Number.isFinite(amount) ? amount : null,
      color: resolveDashboardColor(item.color, index),
      delta:
        isNumber(amount) && Number.isFinite(amount)
          ? { good, label: formats.delta(amount), up: amount >= 0 }
          : null,
      icon: item.icon,
      key: item.key,
      label: resolveTextValue(item.label),
      progress: isNumber(done) ? Math.round(Math.max(0, Math.min(100, done))) : null,
      raw,
      status: status
        ? { color: resolveDashboardColor(status.color, 0), label: resolveTextValue(status.label) }
        : null,
      value:
        raw === null || raw === undefined
          ? '–'
          : isNumber(raw)
            ? formats.resolve(item.format)(raw)
            : resolveTextValue(raw),
    }
  })
})

function tabulate(): DashboardDataTable {
  const hasDelta = items.some((item) => item.delta)
  return {
    columns: [
      { key: 'label', label: t('dashboard.table.label'), numeric: false },
      { key: 'value', label: t('dashboard.table.value'), numeric: true },
      ...(hasDelta ? [{ key: 'change', label: t('dashboard.table.change'), numeric: true }] : []),
    ],
    rows: entries.value.map((entry) => [
      toDashboardCell(entry.label),
      toDashboardCell(isNumber(entry.raw) ? entry.raw : entry.value, entry.value),
      ...(hasDelta ? [toDashboardCell(entry.change, entry.delta?.label ?? '')] : []),
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
      <DashboardSkeleton kind="stats" :count="items.length" />
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

    <div :class="classes.grid" :style="gridColumns ?? undefined" :data-variant="variant">
      <div v-for="entry in entries" :key="entry.key" :class="classes.item" data-stats-item>
        <div class="flex min-w-0 items-center gap-2">
          <span
            v-if="entry.icon"
            :class="classes.icon"
            :style="{
              background: `color-mix(in oklab, ${entry.color} 12%, transparent)`,
              color: entry.color,
            }"
          >
            <UIcon :name="entry.icon" class="size-3.5" />
          </span>
          <span :class="classes.label">{{ entry.label }}</span>
        </div>
        <div :class="classes.value">
          <span class="truncate">{{ entry.value }}</span>
          <span
            v-if="entry.status"
            :class="classes.status"
            :style="{
              background: `color-mix(in oklab, ${entry.status.color} 14%, transparent)`,
              color: entry.status.color,
            }"
          >
            {{ entry.status.label }}
          </span>
        </div>
        <div v-if="entry.delta || entry.caption" :class="classes.meta">
          <span
            v-if="entry.delta"
            :data-trend="entry.delta.good ? 'up' : 'down'"
            :class="[
              classes.delta,
              entry.delta.good ? 'text-[var(--nut-dash-up)]' : 'text-[var(--nut-dash-down)]',
            ]"
          >
            {{ entry.delta.up ? '▲' : '▼' }} {{ entry.delta.label }}
          </span>
          <span v-if="entry.caption" :class="classes.caption">{{ entry.caption }}</span>
        </div>
        <div
          v-if="entry.progress !== null"
          role="progressbar"
          :aria-valuenow="entry.progress"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-label="entry.label"
          :class="classes.progress"
        >
          <i
            class="block h-full rounded-full transition-[width] duration-500 ease-out"
            :style="{ background: entry.color, width: `${entry.progress}%` }"
          />
        </div>
      </div>
    </div>
  </DashboardCard>
</template>

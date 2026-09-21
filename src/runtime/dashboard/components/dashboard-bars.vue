<script setup lang="ts" generic="TRow">
import { computed } from 'vue'

import type { LazyTextValue } from '#ui-tools/shared/types/utils'
import { resolveTextValue } from '#ui-tools/shared/utils/render'

import { useDashboardFormat } from '../composables/use-dashboard-format'
import { useDashboardUi } from '../composables/use-dashboard-ui'
import type {
  DashboardBarsUi,
  DashboardBlockBaseProps,
  DashboardBlockUi,
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
  tag,
  value,
  meta,
  format,
  max,
  color,
  emphasis = 'all',
  limit,
  rowKey,
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
    limit?: number
    rowKey?: (row: TRow, index: number) => PropertyKey
    ui?: DashboardBlockUi & DashboardBarsUi
  }
>()

defineSlots<{
  'header-right'?: () => unknown
  toolbar?: () => unknown
  footer?: () => unknown
}>()

const formats = useDashboardFormat()
const appUi = useDashboardUi()
const classes = computed(() =>
  resolveDashboardClasses(
    {
      fill: 'block h-full rounded-full transition-[width] duration-500 ease-out',
      label: 'min-w-0 truncate font-medium text-default',
      meta: 'shrink-0 text-xs text-muted tabular-nums',
      row: 'flex flex-col gap-[5px] py-1.5',
      tag: 'ms-1.5 font-mono text-[11px] font-normal text-dimmed',
      track: 'h-1.5 overflow-hidden rounded-full bg-[var(--nut-dash-track)]',
    },
    appUi.value.bars,
    ui,
  ),
)

const fill = computed(() => resolveDashboardColor(color, 0))
const rows = computed(() => {
  const data = source.data ?? []
  const visible = limit ? data.slice(0, limit) : data
  const values = visible.map((row) => value(row))
  const full = max ?? Math.max(0, ...values)
  return visible.map((row, index) => {
    const amount = values[index] ?? 0
    return {
      color: emphasis === 'first' && index > 0 ? 'var(--nut-dash-muted)' : fill.value,
      key: rowKey?.(row, index) ?? index,
      label: resolveTextValue(label(row)),
      meta: meta ? resolveTextValue(meta(row)) : (format ?? formats.number.value)(amount),
      tag: tag ? resolveTextValue(tag(row)) : '',
      width: full > 0 ? `${Math.max(0, Math.min(100, (amount / full) * 100))}%` : '0%',
    }
  })
})
</script>

<template>
  <DashboardCard v-bind="block" :card :ui :source :is-empty="rows.length === 0">
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

    <ul class="flex flex-col">
      <li v-for="entry in rows" :key="entry.key" :class="classes.row">
        <div class="flex items-baseline justify-between gap-2.5">
          <span :class="classes.label">
            {{ entry.label }}<small v-if="entry.tag" :class="classes.tag">{{ entry.tag }}</small>
          </span>
          <span :class="classes.meta">{{ entry.meta }}</span>
        </div>
        <div :class="classes.track">
          <i :class="classes.fill" :style="{ background: entry.color, width: entry.width }" />
        </div>
      </li>
    </ul>
  </DashboardCard>
</template>

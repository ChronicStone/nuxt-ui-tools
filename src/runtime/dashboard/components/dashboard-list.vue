<script setup lang="ts" generic="TRow">
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed } from 'vue'

import type { LazyTextValue } from '#ui-tools/shared/types/utils'
import { isNumber } from '#ui-tools/shared/utils/predicate'
import { resolveTextValue } from '#ui-tools/shared/utils/render'

import { useDashboardFormat } from '../composables/use-dashboard-format'
import { useDashboardUi } from '../composables/use-dashboard-ui'
import type {
  DashboardBlockBaseProps,
  DashboardBlockUi,
  DashboardListUi,
  DashboardSourceLike,
  DashboardValueFormat,
} from '../types'
import { resolveDashboardClasses } from '../utils/ui'
import DashboardSkeleton from './block/dashboard-skeleton.vue'
import DashboardCard from './dashboard-card.vue'

const {
  source,
  card = true,
  label,
  description,
  value,
  format,
  percent,
  delta,
  leading,
  leadingText,
  icon,
  limit,
  rowKey,
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
    /** Share in percent, shown before the value. */
    percent?: (row: TRow) => number | null | undefined
    /** Change in percent, colored by sign. */
    delta?: (row: TRow) => number | null | undefined
    /** Leading visual: initials avatar, or a short monospace code chip (country, currency…). */
    leading?: 'avatar' | 'code'
    /** Avatar initials or code text. Defaults to the label initials. */
    leadingText?: (row: TRow) => string
    icon?: (row: TRow) => string | undefined
    limit?: number
    rowKey?: (row: TRow, index: number) => PropertyKey
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
      row: 'flex min-w-0 items-center gap-3 py-[9px]',
      share: 'shrink-0 text-xs text-muted tabular-nums',
      value: 'shrink-0 font-semibold text-highlighted tabular-nums',
    },
    appUi.value.list,
    ui,
  ),
)

const rows = computed(() => {
  const data = source.data ?? []
  const visible = limit ? data.slice(0, limit) : data
  return visible.map((row, index) => {
    const text = resolveTextValue(label(row))
    const raw = value?.(row)
    const change = delta?.(row)
    const share = percent?.(row)
    return {
      change: isNumber(change) ? { good: change >= 0, label: formats.delta.value(change) } : null,
      description: description ? resolveTextValue(description(row)) : '',
      icon: icon?.(row),
      index,
      key: rowKey?.(row, index) ?? index,
      label: text,
      leading: leading ? (leadingText?.(row) ?? initials(text)) : '',
      row,
      share: isNumber(share) ? formats.percent.value(share) : '',
      value: isNumber(raw) ? (format ?? formats.number.value)(raw) : resolveTextValue(raw),
    }
  })
})

function initials(text: string) {
  return text
    .split(/\s+/u)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
}
</script>

<template>
  <DashboardCard v-bind="block" :card :ui :source :is-empty="rows.length === 0">
    <template #skeleton>
      <DashboardSkeleton kind="rows" :count="limit ?? 6" :leading />
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

    <ul class="flex flex-col divide-y divide-[var(--nut-dash-grid)]">
      <li v-for="entry in rows" :key="entry.key" :class="classes.row">
        <slot name="item" :row="entry.row" :index="entry.index">
          <span v-if="leading === 'avatar'" :class="classes.avatar">{{ entry.leading }}</span>
          <span v-else-if="leading === 'code'" :class="classes.code">{{ entry.leading }}</span>
          <UIcon v-else-if="entry.icon" :name="entry.icon" class="size-4 shrink-0 text-dimmed" />
          <div class="min-w-0 flex-1">
            <b :class="classes.label">{{ entry.label }}</b>
            <small v-if="entry.description" :class="classes.description">
              {{ entry.description }}
            </small>
          </div>
          <span v-if="entry.share" :class="classes.share">{{ entry.share }}</span>
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
      </li>
    </ul>
  </DashboardCard>
</template>

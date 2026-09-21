<script setup lang="ts" generic="TRow">
import { computed } from 'vue'

import type { LazyTextValue } from '#ui-tools/shared/types/utils'
import { resolveTextValue } from '#ui-tools/shared/utils/render'

import { useDashboardFormat } from '../composables/use-dashboard-format'
import { useDashboardUi } from '../composables/use-dashboard-ui'
import type {
  DashboardBlockBaseProps,
  DashboardBlockUi,
  DashboardSeriesColor,
  DashboardSourceLike,
  DashboardStackBarUi,
} from '../types'
import { resolveDashboardColor } from '../utils/charts'
import { resolveDashboardClasses } from '../utils/ui'
import DashboardSkeleton from './block/dashboard-skeleton.vue'
import DashboardCard from './dashboard-card.vue'

const {
  source,
  card = true,
  label,
  value,
  text,
  color,
  legendColumns = 2,
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
    ui?: DashboardBlockUi & DashboardStackBarUi
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
      color: resolveDashboardColor(color?.(row, index), index),
      label: resolveTextValue(label(row)),
      text: text ? resolveTextValue(text(row, share)) : formats.percent.value(share),
      width: `${share}%`,
    }
  })
})
</script>

<template>
  <DashboardCard v-bind="block" :card :ui :source :is-empty="parts.length === 0">
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
        v-for="(part, index) in parts"
        :key="index"
        class="block h-full transition-[width] duration-500 ease-out"
        :style="{ background: part.color, width: part.width }"
        :title="`${part.label} · ${part.text}`"
      />
    </div>
    <ul :class="classes.legend">
      <li v-for="(part, index) in parts" :key="index" :class="classes.item">
        <span
          aria-hidden="true"
          class="size-[9px] shrink-0 rounded-[3px]"
          :style="{ background: part.color }"
        />
        <span class="min-w-0 flex-1 truncate text-muted">{{ part.label }}</span>
        <b class="shrink-0 font-semibold whitespace-nowrap text-highlighted tabular-nums">
          {{ part.text }}
        </b>
      </li>
    </ul>
  </DashboardCard>
</template>

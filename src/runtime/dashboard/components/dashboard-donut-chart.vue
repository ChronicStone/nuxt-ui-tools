<script setup lang="ts" generic="TRow">
import { useMounted } from '@vueuse/core'
import { computed } from 'vue'

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
  DashboardDonutUi,
  DashboardSelected,
  DashboardSelectEvent,
  DashboardSeriesColor,
  DashboardSourceLike,
} from '../types'
import { fadeDashboardColor, resolveDashboardColor } from '../utils/charts'
import { toDashboardCell } from '../utils/export'
import {
  DASHBOARD_ROW_BUTTON,
  DASHBOARD_SELECTABLE_ROW,
  resolveDashboardClasses,
} from '../utils/ui'
import DashboardSkeleton from './block/dashboard-skeleton.vue'
import { dashboardChartRenderer } from './charts/renderer'
import DashboardCard from './dashboard-card.vue'

const {
  source,
  card = true,
  menu = undefined,
  freshness = undefined,
  label,
  value,
  color,
  text,
  center,
  centerLabel,
  layout = 'side',
  legendColumns = 1,
  diameter = 150,
  thickness = 14,
  gap = 3,
  selected,
  onSelect,
  ui,
  ...block
} = defineProps<
  Omit<DashboardBlockBaseProps, 'ui'> & {
    source: DashboardSourceLike<readonly TRow[] | undefined>
    label: (row: TRow) => LazyTextValue
    value: (row: TRow) => number
    color?: (row: TRow, index: number) => DashboardSeriesColor | undefined
    /** Legend value text. Defaults to the share in percent. */
    text?: (row: TRow, share: number) => LazyTextValue
    /** Big value in the middle of the ring. Numbers go through the locale number format. */
    center?: (rows: readonly TRow[]) => LazyTextValue
    centerLabel?: LazyTextValue
    /** `side`: legend next to the ring. `stacked`: ring centered above the legend. */
    layout?: 'side' | 'stacked'
    /** Legend columns of the `stacked` layout. */
    legendColumns?: 1 | 2
    /** Ring diameter in pixels. */
    diameter?: number
    thickness?: number
    /** Space between segments, in pixels along the ring. */
    gap?: number
    /** Segments shown as selected: the others fade. */
    selected?: DashboardSelected<TRow>
    /** Makes each segment and legend entry selectable. */
    onSelect?: (event: DashboardSelectEvent<TRow>) => void
    ui?: DashboardBlockUi & DashboardDonutUi
  }
>()

defineSlots<{
  'header-right'?: () => unknown
  toolbar?: () => unknown
  footer?: () => unknown
}>()

const { t } = useUiToolsLocale()
const mounted = useMounted()
const formats = useDashboardFormat()
const appUi = useDashboardUi()
const classes = computed(() =>
  resolveDashboardClasses(
    {
      center:
        'block text-[22px] leading-tight font-semibold tracking-[-0.02em] text-highlighted tabular-nums',
      centerLabel: 'text-[11.5px] text-muted',
      item: 'flex min-w-0 items-center gap-2',
      legend:
        layout === 'stacked'
          ? `grid w-full gap-x-4 gap-y-2 text-[13px] ${legendColumns === 2 ? 'grid-cols-2' : 'grid-cols-1'}`
          : 'flex min-w-40 flex-1 flex-col gap-2 text-[13px]',
    },
    appUi.value.donut,
    ui,
  ),
)

const rows = computed(() => source.data ?? [])
const segments = computed(() => {
  const values = rows.value.map((row) => value(row))
  const total = values.reduce((sum, amount) => sum + amount, 0)
  const picked = rows.value.map((row, index) => selected?.(row, index) ?? false)
  const anyPicked = picked.includes(true)
  return rows.value.map((row, index) => {
    const amount = values[index] ?? 0
    const share = total > 0 ? (amount / total) * 100 : 0
    const base = resolveDashboardColor(color?.(row, index), index)
    const faded = anyPicked && !picked[index]
    return {
      color: faded ? fadeDashboardColor(base) : base,
      faded,
      index,
      label: resolveTextValue(label(row)),
      row,
      selected: picked[index] ?? false,
      share,
      swatch: base,
      text: text ? resolveTextValue(text(row, share)) : formats.percent(share),
      value: amount,
    }
  })
})
const padAngle = computed(() => gap / Math.max(1, (diameter - thickness) / 2))
const centerText = computed(() => {
  if (!center) return ''
  const resolved = center(rows.value)
  return isNumber(resolved) ? formats.number(resolved) : resolveTextValue(resolved)
})

function select(index: number) {
  const segment = segments.value[index]
  if (segment) onSelect?.({ index, row: segment.row })
}

function tabulate(): DashboardDataTable {
  return {
    columns: [
      { key: 'label', label: t('dashboard.table.label'), numeric: false },
      { key: 'value', label: t('dashboard.table.value'), numeric: true },
      { key: 'share', label: t('dashboard.table.share'), numeric: true },
    ],
    rows: segments.value.map((segment) => [
      toDashboardCell(segment.label),
      toDashboardCell(segment.value, formats.number(segment.value)),
      toDashboardCell(Math.round(segment.share * 10) / 10, formats.percent(segment.share)),
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
    :is-empty="segments.length === 0"
    :tabulate
  >
    <template #skeleton>
      <DashboardSkeleton kind="donut" :layout :diameter />
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

    <div
      :class="
        layout === 'stacked'
          ? 'flex flex-col items-center gap-[18px]'
          : 'flex flex-wrap items-center gap-[18px]'
      "
    >
      <div class="relative shrink-0" :style="{ height: `${diameter}px`, width: `${diameter}px` }">
        <component
          :is="dashboardChartRenderer.donut"
          v-if="mounted"
          :segments
          :size="diameter"
          :thickness
          :pad-angle="padAngle"
          :selectable="Boolean(onSelect)"
          @select="select"
        />
        <div
          v-if="centerText || centerLabel"
          class="pointer-events-none absolute inset-0 grid place-items-center text-center"
        >
          <div>
            <b :class="classes.center">{{ centerText }}</b>
            <small v-if="centerLabel" :class="classes.centerLabel">
              {{ resolveTextValue(centerLabel) }}
            </small>
          </div>
        </div>
      </div>
      <ul :class="classes.legend">
        <li
          v-for="segment in segments"
          :key="segment.index"
          :data-selected="segment.selected || undefined"
          :class="[
            classes.item,
            onSelect && DASHBOARD_SELECTABLE_ROW,
            segment.faded && 'opacity-55',
          ]"
        >
          <span
            aria-hidden="true"
            class="size-[9px] shrink-0 rounded-[3px]"
            :style="{ background: segment.swatch }"
          />
          <span class="min-w-0 flex-1 truncate text-muted">{{ segment.label }}</span>
          <b class="shrink-0 font-semibold text-highlighted tabular-nums">{{ segment.text }}</b>
          <button
            v-if="onSelect"
            type="button"
            :class="DASHBOARD_ROW_BUTTON"
            :aria-label="segment.label"
            :aria-pressed="selected ? segment.selected : undefined"
            @click="select(segment.index)"
          />
        </li>
      </ul>
    </div>
  </DashboardCard>
</template>

<script setup lang="ts">
import { twMerge } from 'tailwind-merge'
import { computed } from 'vue'

import { useResponsiveValue } from '#ui-tools/shared/composables/use-responsive-value'

import {
  provideDashboardGrid,
  useDashboardGridContext,
  useDashboardUi,
} from '../composables/use-dashboard-ui'
import type { DashboardGridUi, DashboardMenu } from '../types'
import { parseDashboardSpan, resolveDashboardCellStyle } from '../utils/grid'

const props = withDefaults(
  defineProps<{
    /** Column count, responsive: `"2 md:3 xl:5"`. Defaults to `12`. */
    columns?: string
    /**
     * `cards`: separate cards with a gap. `panels`: one bordered surface whose cells are separated by
     * 1px rules.
     */
    variant?: 'cards' | 'panels'
    /** Gap between cards, any CSS length. Defaults to `1rem`; ignored by `panels`. */
    gap?: string
    /** Grid span when this grid is nested in another grid, responsive. */
    size?: string
    /**
     * A row that is not full (a block hidden because its source is disabled, or a short last row)
     * shares its free width between its cells, in proportion to their span. Defaults to `true`;
     * `false` keeps every cell at its span.
     */
    fill?: boolean
    /** Card menu of every block inside that does not set its own `menu`. */
    menu?: DashboardMenu
    /** `freshness` of every block inside that does not set its own. */
    freshness?: boolean
    ui?: DashboardGridUi
  }>(),
  {
    columns: '12',
    fill: true,
    freshness: undefined,
    gap: '1rem',
    menu: undefined,
    variant: 'cards',
  },
)

// Read before providing: a nested grid is itself a cell of its parent.
const parent = useDashboardGridContext()
const resolvedColumns = useResponsiveValue(() => props.columns, 'integer')
const trackCount = computed(() => parseDashboardSpan(resolvedColumns.value) ?? 12)
const gap = computed(() => (props.variant === 'panels' ? '1px' : props.gap))

provideDashboardGrid({
  columns: () => trackCount.value,
  fill: () => props.fill,
  freshness: () => props.freshness,
  gap: () => gap.value,
  menu: () => props.menu,
  panels: () => props.variant === 'panels',
})

const appUi = useDashboardUi()
const span = useResponsiveValue(() => props.size ?? '', 'integer')
const style = computed(() =>
  [
    'display: flex',
    'flex-wrap: wrap',
    `gap: ${gap.value}`,
    parent &&
      resolveDashboardCellStyle({
        columns: parent.columns.value,
        fill: parent.fill.value,
        gap: parent.gap.value,
        span: parseDashboardSpan(span.value),
      }),
  ]
    .filter(Boolean)
    .join('; '),
)
// A grid whose blocks all render nothing (disabled sources) collapses instead of leaving a frame.
const classes = computed(() =>
  twMerge(
    'min-w-0 empty:hidden',
    props.variant === 'panels' && [
      'overflow-hidden rounded-lg border border-default bg-(--ui-border)',
      appUi.value.grid?.panels,
      props.ui?.panels,
    ],
    appUi.value.grid?.root,
    props.ui?.root,
  ),
)
</script>

<template>
  <div :style="style" :class="classes" :data-variant="variant">
    <slot />
  </div>
</template>

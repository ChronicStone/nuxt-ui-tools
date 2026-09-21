<script setup lang="ts">
import { twMerge } from 'tailwind-merge'
import { computed } from 'vue'

import { useResponsiveValue } from '#ui-tools/shared/composables/use-responsive-value'

import { provideDashboardGrid, useDashboardUi } from '../composables/use-dashboard-ui'
import type { DashboardGridUi } from '../types'

const props = withDefaults(
  defineProps<{
    /** Column count, responsive: `"2 md:3 xl:5"`. Defaults to `12`. */
    columns?: string
    /**
     * `cards`: separate cards with a gap. `panels`: one bordered surface whose cells are separated by
     * 1px rules (rows should be full for the rules to read as a grid).
     */
    variant?: 'cards' | 'panels'
    /** Gap between cards, any CSS length. Defaults to `1rem`; ignored by `panels`. */
    gap?: string
    /** Grid span when this grid is nested in another grid, responsive. */
    size?: string
    ui?: DashboardGridUi
  }>(),
  { columns: '12', gap: '1rem', variant: 'cards' },
)

provideDashboardGrid(() => props.variant === 'panels')

const appUi = useDashboardUi()
const columns = useResponsiveValue(() => props.columns, 'grid-cols')
const span = useResponsiveValue(() => props.size ?? '', 'col')
const style = computed(() =>
  [
    'display: grid',
    columns.value,
    props.variant === 'cards' && `gap: ${props.gap}`,
    span.value ?? 'grid-column: 1 / -1',
  ]
    .filter(Boolean)
    .join('; '),
)
const classes = computed(() =>
  twMerge(
    'min-w-0',
    props.variant === 'panels' && [
      'gap-px overflow-hidden rounded-lg border border-default bg-(--ui-border)',
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

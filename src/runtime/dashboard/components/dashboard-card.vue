<script setup lang="ts">
import { twMerge } from 'tailwind-merge'
import { computed, useTemplateRef } from 'vue'

import { resolveTextValue } from '#ui-tools/shared/utils/render'

import { useDashboardBlock } from '../composables/use-dashboard-block'
import { useDashboardGridContext, useDashboardUi } from '../composables/use-dashboard-ui'
import type {
  DashboardBlockBaseProps,
  DashboardLegendItem,
  DashboardSkeletonKind,
  DashboardSourceLike,
} from '../types'
import { resolveDashboardClasses } from '../utils/ui'
import DashboardBlockState from './block/dashboard-block-state.vue'
import DashboardSkeleton from './block/dashboard-skeleton.vue'
import DashboardLegend from './dashboard-legend.vue'

const props = withDefaults(
  defineProps<
    DashboardBlockBaseProps & {
      /** Source whose state drives the card: skeleton, error with retry, empty, refresh bar. */
      source?: DashboardSourceLike
      /** Whether the ready source has nothing to show. Blocks compute it from their typed data. */
      isEmpty?: boolean
      legend?: readonly DashboardLegendItem[]
      /** Skeleton drawn while the source loads when no `#skeleton` slot is given. */
      skeleton?: DashboardSkeletonKind
    }
  >(),
  { card: true, isEmpty: false, skeleton: 'rows' },
)

const slots = defineSlots<{
  default?: () => unknown
  skeleton?: () => unknown
  'header-right'?: () => unknown
  /** Row under the header (active filters, chips…), kept visible in every phase. */
  toolbar?: () => unknown
  footer?: () => unknown
}>()

const root = useTemplateRef<HTMLElement>('root')
const block = useDashboardBlock({
  activation: () => props.activation,
  empty: () => props.isEmpty,
  root,
  rows: () => props.rows,
  size: () => props.size,
  source: () => props.source,
})

const appUi = useDashboardUi()
const grid = useDashboardGridContext()
const panel = computed(() => grid?.panels.value ?? false)

const classes = computed(() => {
  const app = appUi.value
  const parts = resolveDashboardClasses(
    {
      actions: 'flex max-w-full shrink-0 flex-wrap items-center gap-x-3.5 gap-y-1.5',
      body: 'min-w-0 flex-1',
      footer: 'mt-3 flex flex-col',
      header: 'mb-3.5 flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-2',
      root: '',
      subtitle: 'truncate text-xs font-normal tracking-normal text-muted',
      title:
        'flex min-w-0 items-baseline gap-2 text-sm font-semibold tracking-[-0.01em] text-highlighted',
      toolbar: '-mt-1 mb-3.5 flex min-w-0 flex-wrap items-center gap-1.5',
    },
    app.card,
    props.ui,
  )
  // Chrome layers: card defaults, app card, then panel cells drop their own border and radius.
  parts.root = twMerge(
    'relative flex min-w-0 flex-col',
    props.card && ['rounded-lg border border-default bg-default px-6 py-5.5', app.card?.root],
    props.card && panel.value && ['rounded-none border-0 shadow-none', app.grid?.panel],
    props.ui?.root,
  )
  return parts
})

const title = computed(() => resolveTextValue(props.title))
const subtitle = computed(() => resolveTextValue(props.subtitle))
const phase = computed(() => block.phase.value)
const pending = computed(() => phase.value === 'loading' || phase.value === 'idle')
const busy = computed(() => phase.value === 'loading' || block.refreshing.value)
const hasHeader = computed(() =>
  Boolean(title.value || subtitle.value || props.legend?.length || slots['header-right']),
)
</script>

<template>
  <section
    ref="root"
    :style="block.style.value"
    :data-phase="phase"
    :data-panel="panel || undefined"
    :aria-busy="busy"
    :class="classes.root"
  >
    <div
      v-if="block.refreshing.value"
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-0 top-0 h-0.5 overflow-hidden"
    >
      <div class="nut-dash-progress h-full w-1/3 rounded-full bg-primary" />
    </div>

    <header v-if="hasHeader" :class="classes.header">
      <h2 :class="classes.title">
        <span class="truncate">{{ title }}</span>
        <small v-if="subtitle" :class="classes.subtitle">{{ subtitle }}</small>
      </h2>
      <div v-if="legend?.length || $slots['header-right']" :class="classes.actions">
        <DashboardLegend v-if="legend?.length" :items="legend" />
        <slot name="header-right" />
      </div>
    </header>

    <div v-if="$slots.toolbar" :class="classes.toolbar">
      <slot name="toolbar" />
    </div>

    <div :class="classes.body">
      <div v-if="phase === 'content'" class="nut-dash-enter">
        <slot />
      </div>
      <DashboardBlockState
        v-else-if="phase === 'error' || phase === 'empty'"
        :kind="phase"
        :empty
        @retry="block.retry"
      />
      <div v-else aria-hidden="true" :class="phase === 'loading' && 'nut-dash-shimmer'">
        <slot name="skeleton">
          <DashboardSkeleton :kind="skeleton" />
        </slot>
      </div>
    </div>

    <footer v-if="$slots.footer && phase === 'content'" :class="classes.footer">
      <slot name="footer" />
    </footer>
    <footer
      v-else-if="$slots.footer && pending"
      aria-hidden="true"
      :class="[classes.footer, phase === 'loading' && 'nut-dash-shimmer']"
    >
      <div class="flex items-center justify-between border-t border-[var(--nut-dash-grid)] pt-3">
        <div class="nut-dash-ghost h-2.5 w-24 rounded-sm opacity-70" />
        <div class="nut-dash-ghost h-3 w-14 rounded-sm" />
      </div>
    </footer>
  </section>
</template>

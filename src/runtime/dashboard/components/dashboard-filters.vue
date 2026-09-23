<script setup lang="ts" generic="TTarget extends DashboardFiltersTarget">
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'
import { isObject } from '#ui-tools/shared/utils/predicate'

import { useDashboardUi } from '../composables/use-dashboard-ui'
import type {
  DashboardFilterControl,
  DashboardFilterKeysOf,
  DashboardFiltersTarget,
  DashboardFiltersUi,
  DashboardOption,
  DashboardOptionValue,
} from '../types'
import { hasDashboardFilterMenu } from '../utils/filters'
import { resolveDashboardClasses } from '../utils/ui'
import DashboardFilter from './dashboard-filter.vue'

/**
 * Filter bar of a dashboard: one `UiDashboardFilter` per filter on screen (the root's, then the
 * current view's; a view handle shows its own), in declaration order, and "Reset" once one differs
 * from its default. A key declared by the root and the view is one filter, shown once. Headless
 * filters are skipped, and filters without a menu (dates, free text, drill-down values without
 * presets) only show while they are set.
 *
 * Replace one filter with its own slot (`#account`), every filter with `#filter`, or the menu rows
 * of every pill with `#item`.
 *
 * @example
 * ```vue
 * <UiDashboardFilters :dashboard>
 *   <template #account="{ filter }">
 *     <UiDashboardFilter :filter icon="i-lucide-building-2" />
 *   </template>
 * </UiDashboardFilters>
 * ```
 */
const {
  dashboard,
  only,
  exclude,
  reset = true,
  ui,
} = defineProps<{
  dashboard: TTarget
  /** Shows these filters only, in this order. */
  only?: readonly (DashboardFilterKeysOf<TTarget> & string)[]
  /** Hides these filters. */
  exclude?: readonly (DashboardFilterKeysOf<TTarget> & string)[]
  /** Shows "Reset" once a filter differs from its default. Defaults to `true`. */
  reset?: boolean
  ui?: DashboardFiltersUi
}>()

defineSlots<
  {
    [TKey in DashboardFilterKeysOf<TTarget> & string]?: (props: {
      filter: DashboardFilterControl
    }) => unknown
  } & {
    /** Renders every filter that has no slot of its own. */
    filter?: (props: { filter: DashboardFilterControl }) => unknown
    /** Content of the menu rows of every pill. */
    item?: (props: {
      item: DashboardOption<DashboardOptionValue>
      selected: boolean
      disabled: boolean
      filter: DashboardFilterControl
    }) => unknown
    /** Replaces the "Reset" button. */
    reset?: (props: { filtered: boolean; reset: () => void }) => unknown
    leading?: () => unknown
    trailing?: () => unknown
  }
>()

const { t } = useUiToolsLocale()
const appUi = useDashboardUi()
const classes = computed(() =>
  resolveDashboardClasses(
    {
      reset:
        'inline-flex h-8 flex-none items-center gap-1.5 rounded-[7px] px-2 text-[13px] font-medium whitespace-nowrap text-muted transition-colors outline-none hover:text-default focus-visible:ring-2 focus-visible:ring-primary',
      root: 'flex min-w-0 items-center gap-2 overflow-x-auto [scrollbar-width:none] lg:flex-wrap lg:overflow-visible',
    },
    appUi.value.filters,
    ui,
  ),
)

/** Controls on screen, by key: the target's own, then the current view's. */
const controls = computed<ReadonlyMap<string, DashboardFilterControl>>(() => {
  const all = new Map<string, DashboardFilterControl>(Object.entries(dashboard.controls))
  const current = dashboard.view?.current
  const view: unknown = current ? Reflect.get(dashboard, current) : undefined
  if (isFiltersTarget(view)) {
    for (const [key, control] of Object.entries(view.controls))
      if (!all.has(key)) all.set(key, control)
  }
  return all
})

const filters = computed<DashboardFilterControl[]>(() => {
  const all = controls.value
  const keys = only ?? [...all.keys()]
  return keys.flatMap((key) => {
    const filter = all.get(key)
    if (!filter || filter.headless || !filter.enabled || exclude?.includes(key)) return []
    return hasDashboardFilterMenu(filter) || filter.changed ? [filter] : []
  })
})

function resetFilters() {
  dashboard.resetFilters()
}

function isFiltersTarget(value: unknown): value is DashboardFiltersTarget {
  return isObject(value) && 'controls' in value && 'resetFilters' in value
}
</script>

<template>
  <div
    :class="classes.root"
    role="toolbar"
    :aria-label="t('dashboard.filters.label')"
    data-dashboard-filters
  >
    <slot name="leading" />
    <template v-for="filter in filters" :key="filter.key">
      <slot :name="filter.key" :filter>
        <slot name="filter" :filter>
          <DashboardFilter :filter>
            <template v-if="$slots.item" #item="slotProps">
              <slot name="item" v-bind="slotProps" />
            </template>
          </DashboardFilter>
        </slot>
      </slot>
    </template>
    <slot name="reset" :filtered="dashboard.filtered" :reset="resetFilters">
      <button
        v-if="reset && dashboard.filtered"
        type="button"
        :class="classes.reset"
        data-dashboard-filters-reset
        @click="resetFilters"
      >
        <UIcon name="i-lucide-rotate-ccw" class="size-3.5" />
        {{ t('dashboard.filters.reset') }}
      </button>
    </slot>
    <slot name="trailing" />
  </div>
</template>

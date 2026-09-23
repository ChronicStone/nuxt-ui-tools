<script setup lang="ts" generic="TDashboard extends DashboardPageTarget">
import UButton from '@nuxt/ui/components/Button.vue'
import type { ButtonProps } from '@nuxt/ui/components/Button.vue'
import { twMerge } from 'tailwind-merge'
import { computed, onBeforeUnmount, shallowRef, useTemplateRef, watch } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'
import type { LazyTextValue } from '#ui-tools/shared/types/utils'
import { isObject, isString } from '#ui-tools/shared/utils/predicate'
import { resolveTextValue } from '#ui-tools/shared/utils/render'

import { useDashboardTime } from '../composables/use-dashboard-time'
import { useDashboardUi } from '../composables/use-dashboard-ui'
import type {
  DashboardPageTarget,
  DashboardPageUi,
  DashboardViewController,
  DashboardViewKeysOf,
} from '../types'
import { resolveDashboardClasses } from '../utils/ui'
import DashboardViewScope from './block/dashboard-view-scope.vue'
import DashboardFilters from './dashboard-filters.vue'
import DashboardRefresh from './dashboard-refresh.vue'
import DashboardRelativeTime from './dashboard-relative-time.vue'
import DashboardViewTabs from './dashboard-view-tabs.vue'

/**
 * A whole dashboard page: the title over today's date and when the data was fetched, page actions
 * and the refresh control, the view tabs and the filter bar pinned while the page scrolls, and the
 * current view, rendered from the slot named after it. The page scrolls on its own, so give it a
 * height (`h-full` in a layout that sizes its main area).
 *
 * @example
 * ```vue
 * <!-- const dashboard = useDashboard(salesSchema) -->
 * <UiDashboardPage :dashboard title="Sales">
 *   <template #overview><SalesOverview /></template>
 *   <template #accounts><SalesAccounts /></template>
 * </UiDashboardPage>
 * ```
 */
const {
  dashboard,
  title = undefined,
  description = undefined,
  actions = [],
  refresh = true,
  tabs = true,
  filters = true,
  sticky = true,
  ui,
} = defineProps<{
  dashboard: TDashboard
  title?: LazyTextValue
  /**
   * Line under the title. Defaults to today's date and when the data on screen was fetched;
   * `false` removes it.
   */
  description?: LazyTextValue | false
  /** Buttons before the refresh control. A button with an icon shows only the icon on phones. */
  actions?: readonly ButtonProps[]
  /** The refresh control and its auto-refresh menu. Defaults to `true`. */
  refresh?: boolean
  /** The view tabs, while two views or more are enabled. Defaults to `true`. */
  tabs?: boolean
  /** The filter bar. Defaults to `true`. */
  filters?: boolean
  /** Keeps the tabs and the filter bar pinned while the page scrolls. Defaults to `true`. */
  sticky?: boolean
  ui?: DashboardPageUi
}>()

defineSlots<
  {
    [TKey in DashboardViewKeysOf<TDashboard>]?: () => unknown
  } & {
    /** Content of a dashboard without views, or of a view without its own slot. */
    default?: (props: { view: DashboardViewKeysOf<TDashboard> | undefined }) => unknown
    title?: () => unknown
    description?: () => unknown
    /** Replaces the page actions and the refresh control. */
    actions?: () => unknown
    /** Replaces the view tabs. */
    tabs?: () => unknown
    /** Replaces the filter bar, e.g. with a `UiDashboardFilters` that customizes some filters. */
    filters?: () => unknown
  }
>()

const { t } = useUiToolsLocale()
const time = useDashboardTime()
const appUi = useDashboardUi()
const classes = computed(() =>
  resolveDashboardClasses(
    {
      actions: 'flex min-h-[34px] items-center gap-2',
      body: 'flex flex-col gap-4 px-4 pt-1 pb-12 lg:gap-6 lg:px-7 lg:pb-15',
      description: 'col-span-full mt-1 text-[12.5px] font-light text-muted md:text-[13.5px]',
      filters: 'px-4 py-3 lg:px-7 lg:py-4',
      header:
        'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 bg-default px-4 pt-4 pb-3.5 lg:px-7 lg:pt-[22px] lg:pb-[18px]',
      root: 'h-full overflow-auto bg-muted',
      tabs: 'bg-default px-2 lg:px-7',
      title:
        'm-0 min-w-0 truncate text-2xl leading-[1.1] font-light tracking-[-0.04em] text-highlighted md:text-[30px]',
      toolbar: [
        'z-20 bg-muted transition-shadow duration-200 data-[stuck]:shadow-[0_10px_24px_-18px_rgb(0_0_0/0.35)]',
        sticky && 'sticky top-0',
      ]
        .filter(Boolean)
        .join(' '),
    },
    appUi.value.page,
    ui,
  ),
)

const views = computed(() => (hasViews(dashboard) ? dashboard : undefined))
const current = computed(() => views.value?.view.current)

// The band is stuck once the marker just above it scrolls past the top of the scroll container.
const marker = useTemplateRef<HTMLElement>('marker')
const stuck = shallowRef(false)
let observer: IntersectionObserver | undefined
watch(
  () => (sticky ? marker.value : null),
  (element) => {
    observer?.disconnect()
    observer = undefined
    stuck.value = false
    if (!element || typeof IntersectionObserver === 'undefined') return
    observer = new IntersectionObserver(
      ([entry]) => {
        stuck.value = Boolean(
          entry &&
          !entry.isIntersecting &&
          entry.boundingClientRect.top < (entry.rootBounds?.top ?? 0),
        )
      },
      { root: scrollContainer(element) },
    )
    observer.observe(element)
  },
  { flush: 'post', immediate: true },
)
onBeforeUnmount(() => observer?.disconnect())

function hasViews(target: TDashboard): target is TDashboard & {
  readonly view: DashboardViewController<DashboardViewKeysOf<TDashboard>>
} {
  return isObject(target.view) && 'items' in target.view
}

/** The nearest ancestor that scrolls, or the viewport. */
function scrollContainer(element: HTMLElement): HTMLElement | null {
  for (let node = element.parentElement; node; node = node.parentElement) {
    if (/auto|scroll/u.test(getComputedStyle(node).overflowY)) return node
  }
  return null
}

/** Hides the label of an action with an icon on phones; a class replacer function is kept as is. */
function actionUi(action: ButtonProps) {
  const label = action.ui?.label
  if (!action.icon || (label !== undefined && !isString(label))) return action.ui
  return { ...action.ui, label: twMerge(label, 'max-sm:sr-only') }
}
</script>

<template>
  <!-- Without a dashboard (its schema threw during setup), render nothing: that error stays the one reported. -->
  <div v-if="dashboard" :class="classes.root" data-dashboard-page>
    <header :class="classes.header">
      <h1 :class="classes.title">
        <slot name="title">{{ title === undefined ? '' : resolveTextValue(title) }}</slot>
      </h1>
      <div :class="classes.actions">
        <slot name="actions">
          <UButton
            v-for="(action, index) in actions"
            :key="index"
            color="neutral"
            variant="outline"
            size="md"
            v-bind="action"
            :ui="actionUi(action)"
          />
          <DashboardRefresh v-if="refresh" :dashboard :updated="false" size="md" />
        </slot>
      </div>
      <p v-if="description !== false" :class="classes.description" data-allow-mismatch="text">
        <slot name="description">
          <template v-if="description !== undefined">{{ resolveTextValue(description) }}</template>
          <template v-else>
            {{ time.today() }} ·
            <template v-if="dashboard.updatedAt !== undefined">
              {{ t('dashboard.page.updated') }}
              <DashboardRelativeTime :value="dashboard.updatedAt" />
            </template>
            <template v-else>{{ t('dashboard.page.loading') }}</template>
          </template>
        </slot>
      </p>
    </header>

    <div ref="marker" aria-hidden="true" />
    <div :class="classes.toolbar" :data-stuck="stuck || undefined">
      <slot name="tabs">
        <DashboardViewTabs v-if="tabs && views" :dashboard="views" :class="classes.tabs" />
      </slot>
      <slot name="filters">
        <DashboardFilters v-if="filters" :dashboard :class="classes.filters" />
      </slot>
    </div>

    <div :class="classes.body">
      <DashboardViewScope v-if="current" :key="current" :dashboard :view="current">
        <slot v-if="$slots[current]" :name="current" />
        <slot v-else :view="current" />
      </DashboardViewScope>
      <slot v-else :view="current" />
    </div>
  </div>
</template>

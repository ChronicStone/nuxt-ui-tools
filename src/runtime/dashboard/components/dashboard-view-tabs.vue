<script setup lang="ts" generic="TKey extends string">
import { computed, nextTick, onMounted, useTemplateRef, watch } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { useDashboardUi } from '../composables/use-dashboard-ui'
import type { DashboardViewController, DashboardViewTabsUi } from '../types'
import { resolveDashboardClasses } from '../utils/ui'

/**
 * Tabs of a dashboard's views, bound to `dashboard.view` (the URL follows). Underlined tabs in a
 * strip that scrolls sideways when they overflow, keeping the current one in view.
 *
 * @example
 * ```vue
 * <UiDashboardViewTabs :dashboard />
 * ```
 */
const { dashboard, ui } = defineProps<{
  dashboard: { readonly view: DashboardViewController<TKey> }
  ui?: DashboardViewTabsUi
}>()

defineSlots<{
  /** Content of one tab. */
  tab?: (props: { item: { value: TKey; label: string }; active: boolean }) => unknown
}>()

/** Room kept between a revealed tab and the strip edge, in pixels. */
const EDGE = 16

const { t } = useUiToolsLocale()
const appUi = useDashboardUi()
const strip = useTemplateRef<HTMLElement>('strip')
const classes = computed(() =>
  resolveDashboardClasses(
    {
      root: 'flex min-w-0 gap-0.5 overflow-x-auto border-b border-default [scrollbar-width:none]',
      tab: 'relative inline-flex h-10 flex-none items-center px-3 text-sm font-medium whitespace-nowrap text-muted transition-colors outline-none hover:text-default focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset data-[active]:text-highlighted data-[active]:after:absolute data-[active]:after:inset-x-2 data-[active]:after:-bottom-px data-[active]:after:h-0.5 data-[active]:after:rounded-full data-[active]:after:bg-primary',
    },
    appUi.value.viewTabs,
    ui,
  ),
)

/** Scrolls the strip, and only the strip, so the current tab is fully visible. */
function reveal(behavior: ScrollBehavior) {
  const element = strip.value
  const tab = element?.querySelector('[aria-current="page"]')
  if (!element || !tab) return
  const bounds = element.getBoundingClientRect()
  const box = tab.getBoundingClientRect()
  const overflow =
    box.left < bounds.left + EDGE
      ? box.left - bounds.left - EDGE
      : Math.max(0, box.right - bounds.right + EDGE)
  if (overflow) element.scrollBy({ behavior, left: overflow })
}

onMounted(() => reveal('instant'))
watch(
  () => dashboard.view.current,
  async () => {
    await nextTick()
    reveal('smooth')
  },
)
</script>

<template>
  <nav
    ref="strip"
    :class="classes.root"
    :aria-label="t('dashboard.filters.views')"
    data-dashboard-view-tabs
  >
    <button
      v-for="item in dashboard.view.items"
      :key="item.value"
      type="button"
      :class="classes.tab"
      :data-active="dashboard.view.current === item.value || undefined"
      :aria-current="dashboard.view.current === item.value ? 'page' : undefined"
      @click="dashboard.view.current = item.value"
    >
      <slot name="tab" :item :active="dashboard.view.current === item.value">
        {{ item.label }}
      </slot>
    </button>
  </nav>
</template>

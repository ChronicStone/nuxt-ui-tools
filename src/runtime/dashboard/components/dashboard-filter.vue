<script setup lang="ts" generic="TValue, TItem extends DashboardOptionValue">
import UIcon from '@nuxt/ui/components/Icon.vue'
import UPopover from '@nuxt/ui/components/Popover.vue'
import { createReusableTemplate } from '@vueuse/core'
import { computed, shallowRef, watch } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { useDashboardUi } from '../composables/use-dashboard-ui'
import type {
  DashboardFilterHandle,
  DashboardFilterUi,
  DashboardOption,
  DashboardOptionValue,
} from '../types'
import { DASHBOARD_FILTER_CLASSES, hasDashboardFilterMenu } from '../utils/filters'
import { resolveDashboardClasses } from '../utils/ui'
import DashboardFilterMenu from './filter/dashboard-filter-menu.vue'

/**
 * Control of one filter handle. The `pill` variant reads "Name value ⌄" in a filter bar, turns
 * accent once the filter differs from its default, and offers a clear button; the `button` variant
 * is a small action (a card header "+ Add"). Its menu lists the options densely: checkboxes for
 * multiple filters, search and infinite loading for remote lists. Filters without options (dates,
 * free text) render a pill without a menu.
 *
 * Every part has a slot, and every class a `ui` key, so the default renderer can be adjusted or
 * replaced piece by piece.
 *
 * @example
 * ```vue
 * <UiDashboardFilter :filter="dashboard.filters.account" />
 * <UiDashboardFilter :filter="usage.filters.tracked" variant="button" icon="i-lucide-plus" label="Add" />
 * ```
 */
const {
  filter,
  variant = 'pill',
  label,
  icon,
  clearable = true,
  align,
  list = 'all',
  ui,
} = defineProps<{
  filter: DashboardFilterHandle<TValue, TItem>
  variant?: 'pill' | 'button'
  /** Name on the pill, or the text of the button. Defaults to the filter label. */
  label?: string
  /** Leading icon of the trigger. */
  icon?: string
  /** An active pill shows a button restoring the default value. Defaults to `true`. */
  clearable?: boolean
  /** Menu alignment against the trigger. Defaults to `start` for pills, `end` for buttons. */
  align?: 'start' | 'center' | 'end'
  /**
   * What the menu lists: options and presets (default), the options only, or the presets only (a
   * "Presets" button next to the filter).
   */
  list?: 'all' | 'options' | 'presets'
  ui?: DashboardFilterUi
}>()

defineSlots<{
  /** Replaces the whole trigger. The menu still opens from it. */
  trigger?: (props: {
    filter: DashboardFilterHandle<TValue, TItem>
    active: boolean
    display: string
  }) => unknown
  /** Replaces the name and value inside the pill. */
  label?: (props: { filter: DashboardFilterHandle<TValue, TItem>; display: string }) => unknown
  /** Replaces the content of each menu row. */
  item?: (props: {
    item: DashboardOption<TItem>
    selected: boolean
    disabled: boolean
    filter: DashboardFilterHandle<TValue, TItem>
  }) => unknown
  /** Content above the option list. */
  header?: (props: { filter: DashboardFilterHandle<TValue, TItem> }) => unknown
  /** Content below the option list (presets, actions). */
  footer?: (props: { filter: DashboardFilterHandle<TValue, TItem> }) => unknown
  /** Replaces "No results". */
  empty?: (props: { filter: DashboardFilterHandle<TValue, TItem> }) => unknown
}>()

const { t } = useUiToolsLocale()
const appUi = useDashboardUi()
// One menu, rendered by either trigger; the button variant titles it with the filter name.
const [DefineMenu, ReuseMenu] = createReusableTemplate<{ title?: string }>()
const classes = computed(() =>
  resolveDashboardClasses(DASHBOARD_FILTER_CLASSES, appUi.value.filter, ui),
)
const name = computed(() => label ?? filter.label)
const active = computed(() => variant === 'pill' && filter.changed)
/** Filters without options or presets (dates, free text) show their value without a menu. */
const listed = computed(() => hasDashboardFilterMenu(filter))
const content = computed(() => ({
  align: align ?? (variant === 'button' ? 'end' : 'start'),
  side: 'bottom' as const,
  sideOffset: 6,
}))

// Each control owns its menu, so two controls on one handle (an "Add" button and a "Presets"
// button) open independently; the handle hears about it to start loading a remote list.
const open = shallowRef<boolean>(false)
watch(open, (value) => {
  filter.open = value
})

function close() {
  open.value = false
}
</script>

<template>
  <DefineMenu v-slot="{ title }">
    <DashboardFilterMenu :filter :classes :title :list @picked="close">
      <template v-if="$slots.item" #item="slotProps">
        <slot name="item" v-bind="slotProps" />
      </template>
      <template v-if="$slots.header" #header="slotProps">
        <slot name="header" v-bind="slotProps" />
      </template>
      <template v-if="$slots.footer" #footer="slotProps">
        <slot name="footer" v-bind="slotProps" />
      </template>
      <template v-if="$slots.empty" #empty="slotProps">
        <slot name="empty" v-bind="slotProps" />
      </template>
    </DashboardFilterMenu>
  </DefineMenu>

  <UPopover
    v-if="variant === 'button'"
    v-model:open="open"
    :content
    :ui="{ content: classes.content }"
  >
    <slot name="trigger" :filter :active :display="filter.display">
      <button type="button" :class="classes.button" data-dashboard-filter-button>
        <UIcon v-if="icon" :name="icon" class="size-3.5 flex-none" />
        {{ name }}
      </button>
    </slot>
    <template #content>
      <ReuseMenu :title="list === 'presets' ? t('dashboard.filters.presets') : filter.label" />
    </template>
  </UPopover>

  <span
    v-else
    :class="classes.root"
    :data-active="active || undefined"
    :data-dashboard-filter="filter.key"
  >
    <UPopover v-if="listed" v-model:open="open" :content :ui="{ content: classes.content }">
      <slot name="trigger" :filter :active :display="filter.display">
        <button type="button" :class="classes.trigger">
          <UIcon v-if="icon" :name="icon" class="size-3.5 flex-none text-muted" />
          <slot name="label" :filter :display="filter.display">
            <span :class="classes.label">{{ name }}</span>
            <span :class="classes.value">{{ filter.display }}</span>
          </slot>
          <UIcon
            v-if="!active || !clearable"
            name="i-lucide-chevron-down"
            :class="classes.chevron"
          />
        </button>
      </slot>
      <template #content>
        <ReuseMenu />
      </template>
    </UPopover>
    <slot v-else name="trigger" :filter :active :display="filter.display">
      <span :class="classes.trigger">
        <UIcon v-if="icon" :name="icon" class="size-3.5 flex-none text-muted" />
        <slot name="label" :filter :display="filter.display">
          <span :class="classes.label">{{ name }}</span>
          <span :class="classes.value">{{ filter.display }}</span>
        </slot>
      </span>
    </slot>
    <button
      v-if="active && clearable"
      type="button"
      :class="classes.clear"
      :aria-label="t('dashboard.filters.clear', { label: name })"
      data-dashboard-filter-clear
      @click="filter.reset()"
    >
      <UIcon name="i-lucide-x" class="size-3" />
    </button>
  </span>
</template>

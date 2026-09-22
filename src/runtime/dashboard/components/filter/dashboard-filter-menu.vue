<script setup lang="ts" generic="TValue, TItem extends DashboardOptionValue">
import UIcon from '@nuxt/ui/components/Icon.vue'
import { useEventListener } from '@vueuse/core'
import { computed, nextTick, useTemplateRef, watch } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import type {
  DashboardFilterHandle,
  DashboardFilterPreset,
  DashboardFilterUi,
  DashboardOption,
  DashboardOptionValue,
} from '../../types'

/** Viewport heights ahead of the list end at which the next remote page starts loading. */
const PREFETCH_VIEWPORTS = 3

/**
 * Option list of a filter: search, dense rows (checkboxes for multiple filters, a check mark for
 * single ones), infinite loading of remote pages ahead of the scroll, and the empty / clear rows.
 * Arrow keys move between rows.
 */
const {
  filter,
  classes,
  title,
  list = 'all',
} = defineProps<{
  filter: DashboardFilterHandle<TValue, TItem>
  classes: Required<DashboardFilterUi>
  /** Heading above the list. */
  title?: string
  /** What the menu lists: the options, the presets, or both (presets under the options). */
  list?: 'all' | 'options' | 'presets'
}>()

const emit = defineEmits<{
  /** A single filter took a value: the picker can close. */
  picked: []
}>()

defineSlots<{
  item?: (props: {
    item: DashboardOption<TItem>
    selected: boolean
    disabled: boolean
    filter: DashboardFilterHandle<TValue, TItem>
  }) => unknown
  header?: (props: { filter: DashboardFilterHandle<TValue, TItem> }) => unknown
  footer?: (props: { filter: DashboardFilterHandle<TValue, TItem> }) => unknown
  empty?: (props: { filter: DashboardFilterHandle<TValue, TItem> }) => unknown
}>()

const { t } = useUiToolsLocale()
const listbox = useTemplateRef<HTMLElement>('listbox')
const showOptions = computed(() => list !== 'presets')
const showPresets = computed(() => list !== 'options' && filter.presets.length > 0)
const searching = computed(() => filter.search.trim() !== '')
/** A single filter without a default can go back to "all": its first row clears it. */
const clearRow = computed(
  () => !filter.multiple && filter.defaultValue === undefined && !searching.value,
)
const full = computed(
  () => filter.multiple && filter.max !== undefined && filter.selected.length >= filter.max,
)
const grid = computed(() =>
  filter.columns && filter.columns > 1
    ? { gridTemplateColumns: `repeat(${filter.columns}, minmax(0, 1fr))` }
    : undefined,
)

function pick(item: DashboardOption<TItem>) {
  filter.toggle(item.value)
  if (!filter.multiple) emit('picked')
}

function clear() {
  filter.reset()
  if (!filter.multiple) emit('picked')
}

function apply(preset: DashboardFilterPreset<TValue>) {
  preset.apply()
  emit('picked')
}

/** Loads the next page once the scroll position nears the end of the list. */
function loadAhead() {
  const element = listbox.value
  if (!element || element.clientHeight === 0) return
  if (!filter.hasMore || filter.loadingMore || filter.loading || filter.error) return
  const remaining = element.scrollHeight - element.scrollTop - element.clientHeight
  if (remaining <= element.clientHeight * PREFETCH_VIEWPORTS) filter.loadMore()
}

useEventListener(listbox, 'scroll', loadAhead, { passive: true })
// A short first page, or a page that just arrived, may leave the list within reach of its end.
watch(
  () => [filter.items.length, filter.hasMore, filter.loadingMore] as const,
  async () => {
    await nextTick()
    loadAhead()
  },
  { immediate: true },
)

/** Arrow keys, Home, and End move the focus between rows. */
function onKeydown(event: KeyboardEvent) {
  const rows = [
    ...(listbox.value?.querySelectorAll<HTMLElement>('[data-filter-row]:not(:disabled)') ?? []),
  ]
  const current = rows.findIndex((row) => row === document.activeElement)
  const target = new Map([
    ['ArrowDown', current + 1],
    ['ArrowUp', current - 1],
    ['End', rows.length - 1],
    ['Home', 0],
  ]).get(event.key)
  if (target === undefined || rows.length === 0) return
  event.preventDefault()
  rows[Math.max(0, Math.min(rows.length - 1, target))]?.focus()
}

function focusFirstRow(event: KeyboardEvent) {
  if (event.key !== 'ArrowDown') return
  event.preventDefault()
  listbox.value?.querySelector<HTMLElement>('[data-filter-row]:not(:disabled)')?.focus()
}
</script>

<template>
  <div v-if="title" :class="classes.title">{{ title }}</div>
  <label v-if="showOptions && filter.searchable" :class="classes.search" data-filter-search>
    <UIcon name="i-lucide-search" class="size-3.5 flex-none text-dimmed" />
    <input
      v-model="filter.search"
      type="search"
      :placeholder="t('dashboard.filters.search')"
      :aria-label="t('dashboard.filters.search')"
      class="min-w-0 flex-1 border-0 bg-transparent text-[13px] outline-none placeholder:text-dimmed"
      autocomplete="off"
      @keydown="focusFirstRow"
    />
  </label>
  <slot name="header" :filter />
  <div
    v-if="showOptions"
    ref="listbox"
    role="listbox"
    :aria-label="filter.label"
    :aria-multiselectable="filter.multiple || undefined"
    :class="[classes.list, grid && 'grid']"
    :style="grid"
    data-filter-list
    @keydown="onKeydown"
  >
    <button
      v-if="clearRow"
      type="button"
      role="option"
      :aria-selected="filter.selected.length === 0"
      :class="classes.item"
      :data-selected="filter.selected.length === 0 || undefined"
      data-filter-row
      data-filter-clear-row
      @click="clear"
    >
      <span class="truncate">{{ filter.placeholder }}</span>
      <UIcon v-if="filter.selected.length === 0" name="i-lucide-check" :class="classes.tick" />
    </button>
    <button
      v-for="item in filter.items"
      :key="String(item.value)"
      type="button"
      role="option"
      :aria-selected="filter.isSelected(item.value)"
      :disabled="item.disabled || (full && !filter.isSelected(item.value))"
      :class="classes.item"
      :data-selected="filter.isSelected(item.value) || undefined"
      data-filter-row
      @click="pick(item)"
    >
      <slot
        name="item"
        :item
        :selected="filter.isSelected(item.value)"
        :disabled="Boolean(item.disabled || (full && !filter.isSelected(item.value)))"
        :filter
      >
        <span
          v-if="filter.multiple"
          :class="classes.check"
          :data-checked="filter.isSelected(item.value) || undefined"
          aria-hidden="true"
        >
          <UIcon name="i-lucide-check" class="size-3" />
        </span>
        <UIcon v-if="item.icon" :name="item.icon" class="size-3.5 flex-none text-muted" />
        <img
          v-else-if="item.avatar?.src"
          :src="item.avatar.src"
          :alt="item.avatar.alt ?? ''"
          :class="classes.avatar"
        />
        <span v-else-if="item.avatar?.text" :class="classes.avatar" aria-hidden="true">
          {{ item.avatar.text }}
        </span>
        <span class="min-w-0 flex-1 truncate">{{ item.label }}</span>
        <span v-if="item.hint" :class="classes.hint">{{ item.hint }}</span>
        <UIcon
          v-if="!filter.multiple && filter.isSelected(item.value)"
          name="i-lucide-check"
          :class="classes.tick"
        />
      </slot>
    </button>
    <div
      v-if="filter.loading || filter.loadingMore"
      :class="classes.note"
      class="col-span-full"
      data-filter-loading
    >
      {{ t('dashboard.filters.loading') }}
    </div>
    <div v-else-if="filter.error" :class="classes.note" class="col-span-full text-error">
      <span class="truncate">{{ t('dashboard.filters.loadError') }}</span>
      <button
        type="button"
        class="ms-2 font-medium underline-offset-2 hover:underline"
        @click="filter.refresh()"
      >
        {{ t('dashboard.filters.retry') }}
      </button>
    </div>
    <div v-else-if="filter.items.length === 0" :class="classes.note" class="col-span-full">
      <slot name="empty" :filter>{{ t('dashboard.filters.empty') }}</slot>
    </div>
  </div>
  <template v-if="showOptions && filter.multiple && filter.selected.length > 0">
    <div :class="classes.separator" role="separator" />
    <button type="button" :class="classes.item" data-filter-clear-selection @click="clear">
      <UIcon name="i-lucide-x" class="size-3.5 flex-none text-muted" />
      <span class="truncate">{{ t('dashboard.filters.clearSelection') }}</span>
    </button>
  </template>
  <template v-if="showPresets">
    <template v-if="showOptions">
      <div :class="classes.separator" role="separator" />
      <div :class="classes.title">{{ t('dashboard.filters.presets') }}</div>
    </template>
    <button
      v-for="preset in filter.presets"
      :key="preset.label"
      type="button"
      :class="classes.item"
      :data-selected="preset.active || undefined"
      data-filter-preset
      @click="apply(preset)"
    >
      <UIcon :name="preset.icon ?? 'i-lucide-layers'" class="size-3.5 flex-none text-muted" />
      <span class="min-w-0 flex-1 truncate">{{ preset.label }}</span>
      <span v-if="preset.hint" :class="classes.hint">{{ preset.hint }}</span>
      <UIcon v-if="preset.active" name="i-lucide-check" :class="classes.tick" />
    </button>
  </template>
  <slot name="footer" :filter />
</template>

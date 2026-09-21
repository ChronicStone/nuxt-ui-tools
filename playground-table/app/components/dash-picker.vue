<script setup lang="ts">
import { createReusableTemplate } from '@vueuse/core'

/**
 * Popover picker of the dashboard. The `filter` variant is a filter-bar pill ("Compte  Tous ⌄")
 * that turns accent and offers a clear button once it filters; the `button` variant is a small
 * card-header action. Items use the global `dash-it` classes so page-provided slot content is
 * styled too.
 */
const open = defineModel<boolean>('open', { default: false })
const search = defineModel<string>('search', { default: '' })

const { variant = 'filter', ...props } = defineProps<{
  /** Trigger text: the filter's current value, or the button label. */
  label: string
  /** Filter name shown before its value. */
  name?: string
  /** Leading icon of the `button` variant. */
  icon?: string
  /** Popover heading. Filter pills already name their list, so they usually go without. */
  title?: string
  /** The filter narrows the view: the pill stands out and offers a clear button. */
  active?: boolean
  searchable?: boolean
  variant?: 'filter' | 'button'
}>()
const emit = defineEmits<{ clear: []; more: [] }>()

const [DefineContent, ReuseContent] = createReusableTemplate()

/** Asks for the next page when the list is scrolled near its end. */
function onListScroll(event: Event) {
  const target = event.target
  if (!(target instanceof HTMLElement)) return
  if (target.scrollTop + target.clientHeight >= target.scrollHeight - 48) emit('more')
}
</script>

<template>
  <DefineContent>
    <div v-if="props.title" class="dash-pop-title">{{ props.title }}</div>
    <label v-if="props.searchable" class="dash-search">
      <UIcon name="i-lucide-search" class="size-3.5 text-dimmed" />
      <input v-model="search" placeholder="Rechercher…" autofocus />
    </label>
    <div class="dash-pop-list" @scroll.passive="onListScroll">
      <slot />
    </div>
  </DefineContent>

  <UPopover
    v-if="variant === 'button'"
    v-model:open="open"
    :content="{ align: 'end', side: 'bottom', sideOffset: 6 }"
    :ui="{ content: 'dash-pop' }"
  >
    <button type="button" class="dash-btn dash-btn--sm">
      <UIcon v-if="props.icon" :name="props.icon" class="size-3.5" />
      {{ props.label }}
    </button>
    <template #content>
      <ReuseContent />
    </template>
  </UPopover>

  <span v-else class="dash-filter" :class="{ on: props.active }">
    <UPopover
      v-model:open="open"
      :content="{ align: 'start', side: 'bottom', sideOffset: 6 }"
      :ui="{ content: 'dash-pop' }"
    >
      <button type="button" class="dash-filter-trigger">
        <span v-if="props.name" class="dash-filter-name">{{ props.name }}</span>
        <span class="dash-filter-value">{{ props.label }}</span>
        <UIcon v-if="!props.active" name="i-lucide-chevron-down" class="dash-filter-chev" />
      </button>
      <template #content>
        <ReuseContent />
      </template>
    </UPopover>
    <button
      v-if="props.active"
      type="button"
      class="dash-filter-x"
      :aria-label="`Effacer le filtre ${props.name ?? props.label}`"
      @click="emit('clear')"
    >
      <UIcon name="i-lucide-x" class="size-3" />
    </button>
  </span>
</template>

<style>
/* Filter-bar pill: "Name value ⌄"; accent with a clear button once it filters the view. */
.dash-filter {
  display: inline-flex;
  flex: none;
  align-items: center;
  height: 32px;
  border: 1px solid var(--ui-border);
  border-radius: 7px;
  background: var(--ex-surface);
  font-size: 13px;
  white-space: nowrap;
  transition:
    background 0.12s,
    border-color 0.12s;
}
.dash-filter:hover {
  background: var(--ex-row-hover);
}
.dash-filter.on {
  border-color: var(--ex-accent-line);
  background: var(--ex-selection);
}
.dash-filter-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 100%;
  padding: 0 9px 0 11px;
  border-radius: 6px;
  outline: none;
}
.dash-filter-trigger:focus-visible,
.dash-filter-x:focus-visible {
  box-shadow: 0 0 0 2px var(--ui-primary);
}
.dash-filter.on .dash-filter-trigger {
  padding-right: 4px;
}
.dash-filter-name {
  color: var(--ex-ink-soft);
}
.dash-filter-value {
  max-width: 200px;
  overflow: hidden;
  color: var(--ui-text);
  font-weight: 500;
  text-overflow: ellipsis;
}
.dash-filter.on .dash-filter-value {
  color: var(--nut-dl-accent-ink);
}
.dash-filter-chev {
  width: 14px;
  height: 14px;
  flex: none;
  color: var(--ui-text-dimmed);
}
.dash-filter-x {
  display: inline-grid;
  place-items: center;
  width: 20px;
  height: 20px;
  margin: 0 5px 0 1px;
  border-radius: 50%;
  color: var(--nut-dl-accent-ink);
  outline: none;
}
.dash-filter-x:hover {
  background: var(--ex-selection-2);
}
.dash-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--ui-border);
  border-radius: 7px;
  background: var(--ex-surface);
  color: var(--ui-text);
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  transition: background 0.12s;
}
.dash-btn:hover {
  background: var(--ex-row-hover);
}
.dash-btn--sm {
  height: 28px;
  padding: 0 10px;
  font-size: 12.5px;
  gap: 6px;
}
/* Dense menu rows; touch screens get taller ones. */
.dash-pop {
  min-width: max(160px, var(--reka-popover-trigger-width, 0px));
  max-width: min(320px, calc(100vw - 24px));
  padding: 4px;
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  background: var(--ex-surface);
  box-shadow: 0 10px 30px -12px rgb(31 29 26 / 0.2);
  font-size: 13px;
}
.dash-pop-title {
  padding: 4px 8px 2px;
  color: var(--ui-text-muted);
  font-size: 11.5px;
  font-weight: 500;
}
.dash-pop-list {
  max-height: 300px;
  overflow: auto;
}
.dash-search {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  margin: 0 0 4px;
  padding: 0 8px;
  border: 1px solid var(--ui-border);
  border-radius: 6px;
  background: var(--ex-surface);
}
.dash-search:focus-within {
  border-color: var(--ui-primary);
  box-shadow: 0 0 0 3px rgb(255 150 0 / 0.3);
}
.dash-search input {
  flex: 1;
  min-width: 0;
  background: none;
  border: 0;
  outline: 0;
  font-size: 13px;
}
.dash-it {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 28px;
  padding: 0 8px;
  border-radius: 4px;
  color: var(--ui-text);
  font-size: 13px;
  text-align: start;
  outline: none;
}
.dash-it:hover,
.dash-it:focus-visible {
  background: var(--ex-row-hover);
}
@media (pointer: coarse) {
  .dash-it {
    height: 36px;
  }
}
.dash-it.on {
  font-weight: 500;
}
.dash-it > .dash-it-ic {
  width: 14px;
  height: 14px;
  color: var(--ex-ink-soft);
  flex: none;
}
.dash-it > .dash-it-check {
  width: 14px;
  height: 14px;
  margin-left: auto;
  color: var(--nut-dl-accent-ink);
  flex: none;
}
.dash-it > span:not([class]) {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dash-it small {
  margin-left: auto;
  color: var(--ui-text-dimmed);
  font-size: 11px;
  white-space: nowrap;
}
.dash-it-av {
  display: inline-grid;
  place-items: center;
  width: 18px;
  height: 18px;
  flex: none;
  border-radius: 4px;
  background: var(--ui-bg-muted);
  font-size: 8.5px;
  font-weight: 600;
  color: var(--ex-ink-soft);
}
.dash-chk {
  display: inline-grid;
  place-items: center;
  width: 14px;
  height: 14px;
  flex: none;
  border: 1px solid var(--ui-border-accented);
  border-radius: 4px;
  background: var(--ex-surface);
  color: transparent;
  transition:
    background 0.12s,
    border-color 0.12s;
}
.dash-chk.on {
  background: var(--ui-primary);
  border-color: var(--ui-primary);
  color: #1f1d1a;
}
.dash-grid3 {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.dash-hr {
  height: 1px;
  margin: 4px 0;
  background: var(--ui-border-muted);
}
.dash-more {
  display: flex;
  justify-content: center;
  padding: 6px;
  color: var(--ui-text-dimmed);
  font-size: 12px;
}
</style>

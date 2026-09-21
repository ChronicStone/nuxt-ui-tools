<script setup lang="ts">
/**
 * Header filter of the dashboard: a select-style button whose popover holds any list. Items use
 * the global `dash-it` classes so page-provided slot content is styled too.
 */
const open = defineModel<boolean>('open', { default: false })
const search = defineModel<string>('search', { default: '' })

const props = defineProps<{
  /** Trigger text. */
  label: string
  icon: string
  /** Popover heading. */
  title: string
  /** A selection is active: the trigger stands out and offers a clear button. */
  active?: boolean
  searchable?: boolean
  /** Trigger variant: `select` (filter button) or `button` (small action button). */
  variant?: 'select' | 'button'
}>()
const emit = defineEmits<{ clear: []; more: [] }>()

/** Asks for the next page when the list is scrolled near its end. */
function onListScroll(event: Event) {
  const target = event.target
  if (!(target instanceof HTMLElement)) return
  if (target.scrollTop + target.clientHeight >= target.scrollHeight - 48) emit('more')
}
</script>

<template>
  <UPopover
    v-model:open="open"
    :content="{ align: variant === 'button' ? 'end' : 'start', side: 'bottom', sideOffset: 6 }"
    :ui="{ content: 'dash-pop' }"
  >
    <button v-if="variant === 'button'" type="button" class="dash-btn dash-btn--sm">
      <UIcon :name="icon" class="size-3.5" />
      {{ label }}
    </button>
    <button v-else type="button" class="dash-sel" :class="{ has: props.active }">
      <UIcon :name="icon" class="size-[15px] shrink-0 text-dimmed" />
      <span class="dash-sel-label">{{ label }}</span>
      <span
        v-if="props.active"
        role="button"
        tabindex="0"
        class="dash-sel-x"
        aria-label="Effacer"
        @click.stop="emit('clear')"
        @keydown.enter.stop="emit('clear')"
      >
        <UIcon name="i-lucide-x" class="size-[11px]" />
      </span>
      <UIcon v-else name="i-lucide-chevron-down" class="size-3.5 shrink-0 text-dimmed" />
    </button>

    <template #content>
      <div class="dash-pop-title">{{ title }}</div>
      <label v-if="searchable" class="dash-search">
        <UIcon name="i-lucide-search" class="size-3.5 text-dimmed" />
        <input v-model="search" placeholder="Rechercher…" autofocus />
      </label>
      <div class="dash-pop-list" @scroll.passive="onListScroll">
        <slot />
      </div>
    </template>
  </UPopover>
</template>

<style>
.dash-sel {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 34px;
  padding: 0 10px 0 12px;
  border: 1px solid var(--ui-border);
  border-radius: 7px;
  background: var(--ex-surface);
  color: #45413b;
  font-size: 13px;
  white-space: nowrap;
  transition: background 0.12s;
}
.dash-sel:hover {
  background: #faf7f2;
}
.dash-sel.has {
  color: var(--ui-text);
  border-color: #d3cbc0;
}
.dash-sel-label {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dash-sel-x {
  display: inline-grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  color: var(--ui-text-dimmed);
}
.dash-sel-x:hover {
  background: var(--ui-bg-muted);
  color: var(--ui-text);
}
.dash-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 34px;
  padding: 0 13px;
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
  background: #faf7f2;
}
.dash-btn--sm {
  height: 28px;
  padding: 0 10px;
  font-size: 12.5px;
  gap: 6px;
}
.dash-pop {
  min-width: 260px;
  max-width: min(340px, calc(100vw - 24px));
  padding: 6px 6px 4px;
  border: 1px solid var(--ui-border);
  border-radius: 9px;
  background: var(--ex-surface);
  box-shadow: 0 10px 30px -12px rgb(31 29 26 / 0.2);
  font-size: 13px;
}
.dash-pop-title {
  padding: 10px 12px 8px;
  color: #6b655d;
  font-size: 12.5px;
  font-weight: 600;
}
.dash-pop-list {
  max-height: 360px;
  overflow: auto;
}
.dash-search {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  margin: 4px 6px 8px;
  padding: 0 10px;
  border: 1px solid var(--ui-border);
  border-radius: 7px;
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
  gap: 12px;
  width: 100%;
  height: 44px;
  padding: 0 12px;
  border-radius: 5px;
  color: var(--ui-text);
  font-size: 14px;
  text-align: start;
}
.dash-it:hover {
  background: #faf7f2;
}
.dash-it.on {
  font-weight: 500;
}
.dash-it > .dash-it-ic {
  width: 16px;
  height: 16px;
  color: #6b655d;
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
  width: 22px;
  height: 22px;
  flex: none;
  border-radius: 6px;
  background: var(--ui-bg-muted);
  font-size: 9.5px;
  font-weight: 600;
  color: #6b655d;
}
.dash-chk {
  display: inline-grid;
  place-items: center;
  width: 18px;
  height: 18px;
  flex: none;
  border: 1px solid #d3cbc0;
  border-radius: 5px;
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
  margin: 5px 0;
  background: var(--ui-border-muted);
}
.dash-more {
  display: flex;
  justify-content: center;
  padding: 8px;
  color: var(--ui-text-dimmed);
  font-size: 12px;
}
</style>

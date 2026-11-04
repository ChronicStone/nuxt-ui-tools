<script setup lang="ts">
/**
 * The fold header of a group of rows: chevron, label and count, with room for a checkbox before
 * them. It holds no state, so a table's row groups and a hand-built grid read the same.
 */
defineProps<{
  collapsed?: boolean
  /** Names the chevron for assistive technology. */
  toggleLabel: string
}>()

defineSlots<{
  /** Sits before the chevron, usually a checkbox. A click in it does not fold the group. */
  leading?: () => unknown
  /** The group's name. */
  default?: () => unknown
  /** Shown after the name, usually a count. */
  summary?: () => unknown
}>()

const emit = defineEmits<{ toggle: [] }>()
</script>

<template>
  <div
    class="nut-dl-group"
    :data-collapsed="collapsed || undefined"
    :data-selectable="$slots.leading ? true : undefined"
    @click="emit('toggle')"
  >
    <span v-if="$slots.leading" class="nut-dl-group__check"><slot name="leading" /></span>
    <button
      type="button"
      class="nut-dl-group__toggle"
      :aria-expanded="!collapsed"
      :aria-label="toggleLabel"
      @click.stop="emit('toggle')"
    >
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="m4 6 4 4 4-4" />
      </svg>
    </button>
    <span class="nut-dl-group__label"><slot /></span>
    <span v-if="$slots.summary" class="nut-dl-group__summary"><slot name="summary" /></span>
  </div>
</template>

<style>
.nut-dl-group {
  --nut-dl-group-gutter: var(--nut-dl-gutter, 0px);
  position: sticky;
  left: 0;
  display: inline-flex;
  align-items: center;
  gap: var(--nut-group-gap, 6px);
  height: 100%;
  min-height: 32px;
  max-width: 100%;
  padding-inline: var(--nut-dl-group-gutter);
  box-sizing: border-box;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
  color: var(--ui-text-highlighted);
}
/* The chevron starts where the first column's content does, below it. */
.nut-dl-group__check {
  display: inline-flex;
  flex: none;
  align-items: center;
  margin-right: -6px;
  width: calc(
    var(--nut-dl-select-w, 44px) - var(--nut-dl-group-gutter) + var(--nut-dl-cell-x, 0px)
  );
}
.nut-dl-group__toggle {
  display: grid;
  flex: none;
  place-items: center;
  width: var(--nut-group-toggle, 22px);
  height: 22px;
  padding: 0;
  border: 0;
  border-radius: calc(var(--ui-radius) * 1.5);
  background: transparent;
  color: var(--ui-text-muted);
  cursor: pointer;
  outline: none;
}
.nut-dl-group__toggle:hover {
  background: var(--nut-dl-toggle-hover, var(--ui-bg-accented));
}
.nut-dl-group__toggle:focus-visible {
  box-shadow: 0 0 0 2px var(--ui-primary);
}
.nut-dl-group__toggle svg {
  width: 16px;
  height: 16px;
  transition: transform 0.16s ease;
}
.nut-dl-group[data-collapsed] .nut-dl-group__toggle svg {
  transform: rotate(-90deg);
}
.nut-dl-group__label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.nut-dl-group__summary {
  flex: none;
  font-size: 12px;
  font-weight: 500;
  color: var(--ui-text-muted);
  font-variant-numeric: tabular-nums;
}
@media (prefers-reduced-motion: reduce) {
  .nut-dl-group__toggle svg {
    transition: none;
  }
}
</style>

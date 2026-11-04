<script setup lang="ts">
/**
 * What a group's header row shows, in the table and between the cards of the grid alike: the
 * group's checkbox where its rows have one, the chevron, the label and the summary.
 */
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { useTableInternals } from '../../composables/use-table-internals'
import type { TableGroup } from '../../types'
import TableCell from './table-cell'
import TableSelectionControl from './table-selection-control.vue'

const props = defineProps<{
  group: TableGroup
  /** Whether the rows beneath it carry checkboxes. */
  selectable?: boolean
}>()

const { groups, selection } = useTableInternals()
const { t } = useUiToolsLocale()

const collapsed = computed(() => groups.isCollapsed(props.group))
const params = computed(() => ({ rows: props.group.rows, value: props.group.value }))
const checked = computed(() => selection.getRowsSelectionState({ rowIds: props.group.rowIds }))
const showCheckbox = computed(() => props.selectable && selection.selectionEnabled.value)

function renderLabel() {
  const label = groups.config.value?.label
  if (label) return label(params.value)
  return props.group.value === undefined ? t('table.groups.empty') : String(props.group.value)
}

function renderSummary() {
  const summary = groups.config.value?.summary
  return summary ? summary(params.value) : props.group.rows.length
}

function toggleSelection() {
  const { rowIds } = props.group
  if (checked.value === true) selection.unselectRows({ rowIds })
  else selection.selectRows({ rowIds })
}
</script>

<template>
  <div
    class="nut-dl-group"
    :data-collapsed="collapsed || undefined"
    :data-selectable="showCheckbox || undefined"
    @click="groups.toggle(group)"
  >
    <span v-if="showCheckbox" class="nut-dl-group__check">
      <TableSelectionControl
        :model-value="checked"
        :label="t('table.groups.select')"
        @toggle="toggleSelection"
      />
    </span>
    <button
      type="button"
      class="nut-dl-group__toggle"
      :aria-expanded="!collapsed"
      :aria-label="t('table.groups.toggle')"
      @click.stop="groups.toggle(group)"
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
    <span class="nut-dl-group__label">
      <TableCell :index="0" :render="renderLabel" :row="group" />
    </span>
    <span class="nut-dl-group__summary">
      <TableCell :index="0" :render="renderSummary" :row="group" />
    </span>
  </div>
</template>

<style>
.nut-dl-group {
  --nut-dl-group-gutter: var(--nut-dl-gutter, 0px);
  position: sticky;
  left: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
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
  width: 22px;
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
.nut-dl-row.nut-dl-row--group {
  background: var(--nut-dl-head-bg);
}
.nut-dl-row.nut-dl-row--group:hover {
  background: color-mix(in srgb, var(--nut-dl-head-fg) 7%, var(--nut-dl-head-bg));
}
/* Not a `.nut-dl-td`: that clips its content, and the header must stay in view while columns scroll. */
.nut-dl-group-cell {
  background: inherit;
  border-bottom: 1px solid var(--nut-dl-line);
  height: var(--nut-dl-head-h);
  padding: 0;
}
.nut-dl-grid__group {
  border-bottom: 1px solid var(--ui-border);
}
@media (prefers-reduced-motion: reduce) {
  .nut-dl-group__toggle svg {
    transition: none;
  }
}
</style>

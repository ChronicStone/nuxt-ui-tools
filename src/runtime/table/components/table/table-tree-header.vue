<script setup lang="ts">
/**
 * The control column's header, laid out like a row's cell so its buttons sit above the chevrons
 * and checkboxes beneath: one button that opens every branch (or closes them all), then the
 * select-all checkbox.
 */
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { useTableInternals } from '../../composables/use-table-internals'
import TableSelectionControl from './table-selection-control.vue'

const { t } = useUiToolsLocale()
const { selection, tree } = useTableInternals()

const state = computed(() => tree.expansion.state.value)
const label = computed(() =>
  state.value.allExpanded ? t('table.tree.collapseAll') : t('table.tree.expandAll'),
)
const checkState = computed(() =>
  selection.allSelected.value
    ? true
    : selection.partiallySelected.value
      ? ('indeterminate' as const)
      : false,
)

function toggle() {
  if (state.value.allExpanded) tree.expansion.collapseAll()
  else tree.expansion.expandAll()
}
</script>

<template>
  <div class="nut-dl-tree-head">
    <span class="nut-dl-tree__node">
      <button
        v-if="state.branchCount > 0"
        type="button"
        class="nut-dl-tree__toggle"
        :aria-label="label"
        :title="label"
        @click="toggle"
      >
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" aria-hidden="true">
          <path
            v-if="state.allExpanded"
            d="m7 20 5-5 5 5M7 4l5 5 5-5"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            v-else
            d="m7 15 5 5 5-5M7 9l5-5 5 5"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
      <span v-else class="nut-dl-tree__slot" aria-hidden="true" />
    </span>
    <span class="nut-dl-tree__check">
      <TableSelectionControl
        v-if="selection.selectionEnabled.value"
        :model-value="checkState"
        :ariaLabel="t('table.tree.selectAll')"
        @toggle="selection.toggleAllRows({ selected: !selection.allSelected.value })"
      />
    </span>
  </div>
</template>

<style>
.nut-dl-tree-head {
  display: flex;
  align-items: center;
  height: 100%;
}
</style>

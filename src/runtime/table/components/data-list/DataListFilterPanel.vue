<script setup lang="ts">
import { useTableInternals } from '../../composables/use-table-internals'
import type { DataListControlSize, DataListFilterPanelUi } from '../../types'
import FilterPanel from '../filters/panel/FilterPanel.vue'

defineProps<{ size?: DataListControlSize; ui?: DataListFilterPanelUi }>()
const internals = useTableInternals()
</script>

<template>
  <FilterPanel v-if="internals.filterPresentation.hasPanelFilters.value" :size="size" :ui="ui">
    <template v-if="$slots.trigger" #trigger="scope">
      <slot name="trigger" v-bind="scope" />
    </template>
  </FilterPanel>
</template>

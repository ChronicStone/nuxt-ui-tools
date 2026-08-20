<script setup lang="ts">
import { computed } from 'vue'

import { useDataListUi } from '../../composables/use-data-list-ui'
import { useTableInternals } from '../../composables/use-table-internals'
import type {
  DataListControlSize,
  DataListFilterPanelCommitMode,
  DataListFilterPanelMode,
  DataListFilterPanelUi,
} from '../../types'
import FilterPanel from '../filters/panel/FilterPanel.vue'

const props = defineProps<{
  size?: DataListControlSize
  ui?: DataListFilterPanelUi
  mode?: DataListFilterPanelMode
  commitMode?: DataListFilterPanelCommitMode
}>()
const internals = useTableInternals()
const dataListUi = useDataListUi()
const config = computed(() => dataListUi.ui.value.filterPanel)
const resolvedSize = computed(() => props.size ?? config.value?.size)
const resolvedUi = computed(() => ({ ...config.value?.ui, ...props.ui }))
const resolvedMode = computed(() => props.mode ?? config.value?.mode ?? 'drawer')
const resolvedCommitMode = computed(() => props.commitMode ?? config.value?.commitMode ?? 'submit')
</script>

<template>
  <FilterPanel
    v-if="internals.filterPresentation.hasPanelFilters.value"
    :size="resolvedSize"
    :ui="resolvedUi"
    :mode="resolvedMode"
    :commit-mode="resolvedCommitMode"
  >
    <template v-if="$slots.trigger" #trigger="scope">
      <slot name="trigger" v-bind="scope" />
    </template>
  </FilterPanel>
</template>

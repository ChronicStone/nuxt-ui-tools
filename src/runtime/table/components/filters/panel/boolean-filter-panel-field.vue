<script setup lang="ts">
import { computed, ref } from 'vue'

import { isBoolean } from '../../../../shared/utils/predicate'
import { useTableFilterOptions } from '../../../composables/use-table-filter-options'
import { useTableInternals } from '../../../composables/use-table-internals'
import type {
  DataListControlSize,
  DataListFilterPanelUi,
  TableBooleanFilterDefinition,
} from '../../../types'
import { resolveBooleanFilterUi } from '../../../utils'
import FilterPanelChips from './filter-panel-chips.vue'
import FilterPanelFieldShell from './filter-panel-field-shell.vue'

const props = defineProps<{
  definition: TableBooleanFilterDefinition
  size: DataListControlSize
  ui?: DataListFilterPanelUi
}>()

const internals = useTableInternals()
const searchQuery = ref<string>('')

const optionSource = useTableFilterOptions({
  active: internals.filterPresentation.panelOpen,
  definition: props.definition,
  filters: internals.filters,
  queryContent: internals.queryContent,
  schema: internals.schema,
  searchQuery,
})

const filterUi = computed(() => resolveBooleanFilterUi(props.definition, 'is'))
const current = computed(() => {
  const value = internals.filterPresentation.getPanelDraftFilterState({
    key: props.definition.key,
  })?.value
  return value === true || value === false ? value : undefined
})
const isActive = computed(() => current.value !== undefined)
const entries = computed(() =>
  optionSource.filteredEntries.value
    .filter((entry) => isBoolean(entry.value))
    .map((entry) => ({
      count: entry.count,
      icon: entry.value === true ? filterUi.value.icons.true : filterUi.value.icons.false,
      label: entry.value === true ? filterUi.value.labels.true : filterUi.value.labels.false,
      selected: current.value === entry.value,
      value: entry.value as boolean,
    })),
)

function toggle(value: string | number | boolean) {
  if (current.value === value) {
    internals.filterPresentation.clearPanelFilter({ key: props.definition.key })
    return
  }
  internals.filterPresentation.setPanelScalarFilterValue({
    key: props.definition.key,
    value: value === true,
  })
}
</script>

<template>
  <FilterPanelFieldShell
    :label="internals.filters.getFilterLabelText({ label: definition.label })"
    :active="isActive"
    :size="size"
    :ui="ui"
  >
    <FilterPanelChips
      :entries="entries"
      :loading="optionSource.isLoading.value"
      :count-loading="optionSource.isCountLoading.value"
      show-counts
      :ui="ui"
      @toggle="toggle"
    />
  </FilterPanelFieldShell>
</template>

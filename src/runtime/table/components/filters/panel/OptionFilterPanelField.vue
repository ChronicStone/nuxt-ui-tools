<script setup lang="ts">
import UPopover from '@nuxt/ui/components/Popover.vue'
import { computed, ref } from 'vue'

import { useOptionFilterEditorState } from '../../../composables/use-option-filter-editor-state'
import { useTableInternals } from '../../../composables/use-table-internals'
import type {
  TableFilterOperator,
  TableOptionFilterDefinition,
  TableOptionFilterOperator,
} from '../../../types'
import FilterMatchModeButton from '../shared/FilterMatchModeButton.vue'
import FilterOptionPickerContent from '../shared/FilterOptionPickerContent.vue'
import FilterPanelFieldShell from './FilterPanelFieldShell.vue'
import FilterPanelInputTrigger from './FilterPanelInputTrigger.vue'

const props = defineProps<{
  definition: TableOptionFilterDefinition
}>()

const internals = useTableInternals()
const searchQuery = ref<string>('')
const pendingOperator = ref<TableOptionFilterOperator>(resolveInitialOperator())
const isOpen = ref<boolean>(false)

const selectedValues = computed(() => {
  const value = internals.filterPresentation.getPanelDraftFilterState({
    key: props.definition.key,
  })?.value
  if (Array.isArray(value)) return value.filter(isPrimitiveValue)
  return isPrimitiveValue(value) ? [value] : []
})

const state = useOptionFilterEditorState({
  definition: props.definition,
  operator: pendingOperator,
  selectedValues,
  searchQuery,
  active: internals.filterPresentation.panelOpen,
  filters: internals.filters,
  queryContent: internals.queryContent,
  schema: internals.schema,
  setSelectedValues,
})

const isActive = computed(
  () =>
    internals.filterPresentation.getPanelDraftFilterState({ key: props.definition.key }) != null,
)
const operatorItems = computed(() =>
  internals.filters.getFilterOperatorOptions({
    key: props.definition.key,
  }),
)

function resolveInitialOperator() {
  const operator = internals.filterPresentation.getPanelFilterOperator({
    key: props.definition.key,
  })
  return operator === 'is' || operator === 'isNot' ? operator : 'isAnyOf'
}

function handleOperatorChange(operator: TableFilterOperator) {
  pendingOperator.value = operator === 'is' || operator === 'isNot' ? operator : 'isAnyOf'

  if (state.filterUi.value.clearOnOperatorChange) {
    internals.filterPresentation.clearPanelFilter({ key: props.definition.key })
    return
  }

  if (!selectedValues.value.length) return

  internals.filterPresentation.setPanelOptionFilterValues({
    key: props.definition.key,
    values: selectedValues.value,
    operator: pendingOperator.value,
  })
}

function setSelectedValues(values: Array<string | number | boolean>) {
  internals.filterPresentation.setPanelOptionFilterValues({
    key: props.definition.key,
    values,
    operator: pendingOperator.value,
  })
}

function handleSelectEntry(options: { value: string | number | boolean }) {
  state.toggleValue(options.value)
}

function handleToggleTreeEntry(entryId: string) {
  const entry = state.visibleTreeEntries.value.find((item) => item.id === entryId)
  if (!entry) return
  state.toggleTreeEntry(entry)
}

function isPrimitiveValue(value: unknown): value is string | number | boolean {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
}
</script>

<template>
  <FilterPanelFieldShell
    :label="internals.filters.getFilterLabelText({ label: definition.label })"
    :active="isActive"
  >
    <template #actions>
      <FilterMatchModeButton
        v-if="operatorItems.length > 1"
        :label="operatorItems.find((item) => item.value === pendingOperator)?.label ?? 'is any of'"
        :items="operatorItems"
        variant="compact"
        @select="handleOperatorChange"
      />
    </template>

    <UPopover
      v-model:open="isOpen"
      mode="click"
      :content="{ side: 'bottom', align: 'start', sideOffset: 8 }"
      :ui="{
        content:
          'w-[var(--reka-popover-trigger-width)] max-w-[var(--reka-popover-trigger-width)] overflow-hidden p-0 shadow-none',
      }"
    >
      <FilterPanelInputTrigger
        :value="state.triggerSummary.value"
        :placeholder="state.filterUi.value.labels.searchPlaceholder"
      />

      <template #content>
        <FilterOptionPickerContent
          v-model:search-query="searchQuery"
          :flat-radio-value="state.flatRadioValue.value"
          :tree-radio-value="state.treeRadioValue.value"
          :state="state"
          @update:flat-radio-value="state.flatRadioValue.value = $event"
          @update:tree-radio-value="state.treeRadioValue.value = $event"
          @select-entry="handleSelectEntry"
          @toggle-tree-entry="handleToggleTreeEntry"
          @toggle-expanded="state.toggleExpanded"
        />
      </template>
    </UPopover>
  </FilterPanelFieldShell>
</template>

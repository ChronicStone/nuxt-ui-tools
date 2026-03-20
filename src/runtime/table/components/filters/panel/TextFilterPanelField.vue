<script setup lang="ts">
import UInput from '@nuxt/ui/components/Input.vue'
import { computed, ref } from 'vue'

import { useTableInternals } from '../../../composables/use-table-internals'
import type { TableFilterOperator, TableTextFilterDefinition, TableTextFilterOperator } from '../../../types'
import { resolveTextFilterUi } from '../../../utils'
import FilterMatchModeButton from '../shared/FilterMatchModeButton.vue'
import FilterPanelFieldShell from './FilterPanelFieldShell.vue'

const props = defineProps<{
  definition: TableTextFilterDefinition
}>()

const internals = useTableInternals()
const pendingOperator = ref<TableTextFilterOperator>(resolveInitialOperator())

const operatorItems = computed(() =>
  internals.filters.getFilterOperatorOptions({
    key: props.definition.key,
  }),
)

const filterUi = computed(() => resolveTextFilterUi(props.definition, pendingOperator.value))

const localValue = computed({
  get: () => {
    const value = internals.filterPresentation.getPanelDraftFilterState({ key: props.definition.key })?.value
    return value == null ? '' : String(value)
  },
  set: (value: string) => {
    internals.filterPresentation.setPanelScalarFilterValue({
      key: props.definition.key,
      value: value.trim() || undefined,
      operator: pendingOperator.value,
    })
  },
})

const isActive = computed(() =>
  internals.filterPresentation.getPanelDraftFilterState({ key: props.definition.key }) != null,
)

function resolveInitialOperator() {
  const operator = internals.filterPresentation.getPanelFilterOperator({ key: props.definition.key })
  return operator === 'is' || operator === 'isNot' ? operator : 'contains'
}

function handleOperatorChange(operator: TableFilterOperator) {
  pendingOperator.value = operator === 'is' || operator === 'isNot' ? operator : 'contains'

  if (filterUi.value.clearOnOperatorChange) {
    internals.filterPresentation.clearPanelFilter({ key: props.definition.key })
    return
  }

  if (!localValue.value.trim()) return

  internals.filterPresentation.setPanelScalarFilterValue({
    key: props.definition.key,
    value: localValue.value.trim(),
    operator: pendingOperator.value,
  })
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
        :label="operatorItems.find((item) => item.value === pendingOperator)?.label ?? 'contains'"
        :items="operatorItems"
        variant="compact"
        @select="handleOperatorChange"
      />
    </template>

    <UInput
      v-model="localValue"
      :type="filterUi.inputType"
      :icon="filterUi.leadingIcon"
      :placeholder="filterUi.placeholder"
      :autocomplete="filterUi.autocomplete"
      :highlight="filterUi.input.highlight"
      :fixed="filterUi.input.fixed"
      color="neutral"
      variant="outline"
      class="w-full"
    />
  </FilterPanelFieldShell>
</template>

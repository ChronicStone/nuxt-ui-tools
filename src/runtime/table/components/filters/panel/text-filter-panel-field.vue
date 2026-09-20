<script setup lang="ts">
import UInput from '@nuxt/ui/components/Input.vue'
import { computed, ref } from 'vue'

import { isNullish } from '../../../../shared/utils/predicate'
import { useTableInternals } from '../../../composables/use-table-internals'
import type {
  DataListControlSize,
  DataListFilterPanelUi,
  TableFilterOperator,
  TableTextFilterDefinition,
  TableTextFilterOperator,
} from '../../../types'
import { resolveTextFilterUi } from '../../../utils'
import FilterMatchModeButton from '../shared/filter-match-mode-button.vue'
import FilterPanelFieldShell from './filter-panel-field-shell.vue'

const props = defineProps<{
  definition: TableTextFilterDefinition
  size: DataListControlSize
  ui?: DataListFilterPanelUi
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
    const value = internals.filterPresentation.getPanelDraftFilterState({
      key: props.definition.key,
    })?.value
    return isNullish(value) ? '' : String(value)
  },
  set: (value: string) => {
    internals.filterPresentation.setPanelScalarFilterValue({
      key: props.definition.key,
      operator: pendingOperator.value,
      value: value.trim() || undefined,
    })
  },
})

const isActive = computed(
  () =>
    !isNullish(
      internals.filterPresentation.getPanelDraftFilterState({ key: props.definition.key }),
    ),
)

function resolveInitialOperator() {
  const operator = internals.filterPresentation.getPanelFilterOperator({
    key: props.definition.key,
  })
  return operator === 'is' || operator === 'isNot' ? operator : 'contains'
}

function handleOperatorChange(operator: TableFilterOperator) {
  pendingOperator.value = operator === 'is' || operator === 'isNot' ? operator : 'contains'

  if (filterUi.value.clearOnOperatorChange) {
    internals.filterPresentation.clearPanelFilter({ key: props.definition.key })
    return
  }

  if (!localValue.value.trim()) {
    return
  }

  internals.filterPresentation.setPanelScalarFilterValue({
    key: props.definition.key,
    operator: pendingOperator.value,
    value: localValue.value.trim(),
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
    <template #actions>
      <FilterMatchModeButton
        v-if="operatorItems.length"
        :label="operatorItems.find((item) => item.value === pendingOperator)?.label ?? 'contains'"
        :items="operatorItems"
        :selected="pendingOperator"
        :size="size"
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
      :size="size"
      color="neutral"
      variant="outline"
      class="w-full"
    />
  </FilterPanelFieldShell>
</template>

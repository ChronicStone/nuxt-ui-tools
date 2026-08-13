<script setup lang="ts">
import { computed } from 'vue'

import { useDataListUi } from '../../composables/use-data-list-ui'
import { useTableInternals } from '../../composables/use-table-internals'
import type { DataListAddFilterUi, DataListControlSize, TableUiFilterDefinition } from '../../types'
import { getFilterLabelText } from '../../utils'
import DynamicFilterPicker from '../filters/shared/DynamicFilterPicker.vue'

const internals = useTableInternals()
const props = defineProps<{
  size?: DataListControlSize
  ui?: DataListAddFilterUi
}>()
const dataListUi = useDataListUi()
const definitions = computed(() => internals.filterPresentation.dormantDynamicDefinitions.value)
const sessionDefinition = computed(
  () => internals.filterPresentation.dynamicSessionDefinition.value,
)
const resolvedSize = computed(
  () => props.size ?? dataListUi.ui.value.addFilter?.size ?? dataListUi.controlSize.value,
)
const resolvedUi = computed<DataListAddFilterUi>(() => ({
  ...dataListUi.ui.value.addFilter?.ui,
  ...props.ui,
}))

function getLabel(definition: TableUiFilterDefinition) {
  return getFilterLabelText({ label: definition.label })
}
</script>

<template>
  <DynamicFilterPicker
    v-if="definitions.length || sessionDefinition"
    :definitions="definitions"
    :session-definition="sessionDefinition"
    :get-label="getLabel"
    :size="resolvedSize"
    :ui="resolvedUi"
    @select="internals.filterPresentation.activateDynamicFilter({ key: $event })"
    @release="internals.filterPresentation.releaseDynamicSession({ key: $event })"
  >
    <template v-if="$slots.trigger" #trigger="scope">
      <slot name="trigger" v-bind="scope" />
    </template>
  </DynamicFilterPicker>
</template>

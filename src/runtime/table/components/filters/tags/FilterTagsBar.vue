<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import { computed } from 'vue'

import { useDataListUi } from '../../../composables/use-data-list-ui'
import { useTableInternals } from '../../../composables/use-table-internals'
import type { TableUiFilterDefinition } from '../../../types'
import { getFilterLabelText, mergeDataListUiClass } from '../../../utils'
import DynamicFilterPicker from '../shared/DynamicFilterPicker.vue'
import { resolveFilterTagComponent } from './registry'

const internals = useTableInternals()
const dataListUi = useDataListUi()
const props = withDefaults(defineProps<{ showAdd?: boolean; showClear?: boolean }>(), {
  showAdd: true,
  showClear: true,
})

const visibleDefinitions = computed(() => [
  ...internals.filterPresentation.tagDefinitions.value,
  ...internals.filterPresentation.activeDynamicDefinitions.value,
])
const dynamicSessionDefinition = computed(
  () => internals.filterPresentation.dynamicSessionDefinition.value,
)

function getFilterLabel(definition: TableUiFilterDefinition) {
  return getFilterLabelText({ label: definition.label })
}
</script>

<template>
  <div
    v-if="
      visibleDefinitions.length ||
      internals.filterPresentation.dormantDynamicDefinitions.value.length ||
      internals.filters.hasActiveUiFilters.value
    "
    :class="mergeDataListUiClass('contents', undefined, dataListUi.ui.value.filterTags?.ui?.root)"
  >
    <component
      :is="resolveFilterTagComponent(definition)"
      v-for="definition in visibleDefinitions"
      :key="definition.key"
      :definition="definition"
      :dynamic="
        internals.filterPresentation.activeDynamicDefinitions.value.some(
          (item) => item.key === definition.key,
        )
      "
      @dismiss="internals.filterPresentation.releaseDynamicSession({ key: definition.key })"
    >
      <template v-if="$slots.filter" #trigger="scope">
        <slot name="filter" v-bind="scope" :filter="definition" />
      </template>
    </component>

    <component
      :is="resolveFilterTagComponent(dynamicSessionDefinition)"
      v-if="dynamicSessionDefinition"
      :key="`dynamic-session:${dynamicSessionDefinition.key}`"
      :definition="dynamicSessionDefinition"
      dynamic
      session
      :activation-token="
        internals.filterPresentation.getDynamicActivationToken({
          key: dynamicSessionDefinition.key,
        })
      "
      @dismiss="
        internals.filterPresentation.releaseDynamicSession({ key: dynamicSessionDefinition.key })
      "
      @session-closed="
        internals.filterPresentation.releaseDynamicSession({ key: dynamicSessionDefinition.key })
      "
    >
      <template v-if="$slots.filter" #trigger="scope">
        <slot name="filter" v-bind="scope" :filter="dynamicSessionDefinition" />
      </template>
    </component>

    <DynamicFilterPicker
      v-else-if="
        props.showAdd && internals.filterPresentation.dormantDynamicDefinitions.value.length
      "
      :definitions="internals.filterPresentation.dormantDynamicDefinitions.value"
      :get-label="getFilterLabel"
      :size="
        dataListUi.ui.value.addFilter?.size ??
        dataListUi.ui.value.filterTags?.size ??
        dataListUi.controlSize.value
      "
      :ui="{
        ...dataListUi.ui.value.addFilter?.ui,
        trigger: dataListUi.ui.value.filterTags?.ui?.addTrigger,
      }"
      @select="internals.filterPresentation.activateDynamicFilter({ key: $event })"
    >
      <template v-if="$slots['add-filter-trigger']" #trigger="scope">
        <slot name="add-filter-trigger" v-bind="scope" />
      </template>
    </DynamicFilterPicker>

    <UButton
      v-if="props.showClear && internals.filters.hasActiveUiFilters.value"
      color="neutral"
      variant="outline"
      :size="dataListUi.ui.value.filterTags?.size ?? dataListUi.controlSize.value"
      icon="i-lucide-x"
      :ui="{
        base: mergeDataListUiClass(
          'shrink-0 border-dashed',
          undefined,
          dataListUi.ui.value.filterTags?.ui?.clearTrigger,
        ),
      }"
      @click="internals.filters.clearAllFilters()"
    >
      <slot name="clear-filter-label" />
    </UButton>
  </div>
</template>

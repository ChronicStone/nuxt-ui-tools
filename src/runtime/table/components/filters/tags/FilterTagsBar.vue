<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import { computed } from 'vue'

import { useTableInternals } from '../../../composables/use-table-internals'
import type { TableUiFilterDefinition } from '../../../types'
import { getFilterLabelText } from '../../../utils'
import DynamicFilterPicker from '../shared/DynamicFilterPicker.vue'
import { resolveFilterTagComponent } from './registry'

const internals = useTableInternals()

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
    class="contents"
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
    />

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
    />

    <DynamicFilterPicker
      v-else-if="internals.filterPresentation.dormantDynamicDefinitions.value.length"
      :definitions="internals.filterPresentation.dormantDynamicDefinitions.value"
      :get-label="getFilterLabel"
      @select="internals.filterPresentation.activateDynamicFilter({ key: $event })"
    />

    <UButton
      v-if="internals.filters.hasActiveUiFilters.value"
      color="neutral"
      variant="outline"
      size="md"
      icon="i-lucide-x"
      class="shrink-0 border-dashed"
      @click="internals.filters.clearAllFilters()"
    />
  </div>
</template>

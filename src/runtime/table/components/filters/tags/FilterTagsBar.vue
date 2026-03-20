<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import { computed } from 'vue'

import { useTableInternals } from '../../../composables/use-table-internals'
import type { TableUiFilterDefinition } from '../../../types'
import DynamicFilterPicker from '../shared/DynamicFilterPicker.vue'
import { resolveFilterTagComponent } from './registry'

const internals = useTableInternals()

const visibleDefinitions = computed(() => [
  ...internals.filterPresentation.tagDefinitions.value,
  ...internals.filterPresentation.activeDynamicDefinitions.value,
])

function getFilterLabel(definition: TableUiFilterDefinition) {
  return typeof definition.label === 'function' ? '' : definition.label
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
      :dynamic="internals.filterPresentation.activeDynamicDefinitions.value.some(item => item.key === definition.key)"
      :activation-token="internals.filterPresentation.getDynamicActivationToken({ key: definition.key })"
      @dismiss="internals.filterPresentation.dismissDynamicFilter({ key: definition.key })"
    />

    <DynamicFilterPicker
      v-if="internals.filterPresentation.dormantDynamicDefinitions.value.length"
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

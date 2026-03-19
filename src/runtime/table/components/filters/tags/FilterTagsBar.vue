<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import { computed, ref } from 'vue'

import { useTableInternals } from '../../../composables/use-table-internals'
import type { TableUiFilterDefinition } from '../../../types'
import { resolveFilterTagComponent } from './registry'

const internals = useTableInternals()

const filterDefinitions = computed(() => internals.filters.definitions.value)

const inlineDefinitions = computed(() =>
  filterDefinitions.value.filter((d) => (d.display ?? 'inline') === 'inline'),
)

const dynamicDefinitions = computed(() =>
  filterDefinitions.value.filter((d) => d.display === 'dynamic'),
)

const activeDynamicKeys = ref<Set<string>>(new Set())

const visibleDynamicDefinitions = computed(() =>
  dynamicDefinitions.value.filter(
    (d) =>
      activeDynamicKeys.value.has(d.key) ||
      internals.filters.getFilterState({ key: d.key }) != null,
  ),
)

const visibleDefinitions = computed(() => [
  ...inlineDefinitions.value,
  ...visibleDynamicDefinitions.value,
])

const availableDynamicDefinitions = computed(() =>
  dynamicDefinitions.value.filter(
    (d) =>
      !activeDynamicKeys.value.has(d.key) &&
      internals.filters.getFilterState({ key: d.key }) == null,
  ),
)

function activateDynamicFilter(key: string) {
  activeDynamicKeys.value = new Set([...activeDynamicKeys.value, key])
}

function getFilterLabel(definition: TableUiFilterDefinition) {
  return typeof definition.label === 'function' ? '' : definition.label
}
</script>

<template>
  <div
    v-if="visibleDefinitions.length || internals.filters.hasActiveUiFilters.value"
    class="flex flex-wrap items-center gap-2"
  >
    <component
      :is="resolveFilterTagComponent(definition)"
      v-for="definition in visibleDefinitions"
      :key="definition.key"
      :definition="definition"
    />

    <UButton
      v-if="availableDynamicDefinitions.length"
      color="neutral"
      variant="outline"
      size="md"
      icon="i-lucide-plus"
      label="Add filter"
      class="shrink-0 border-dashed"
      :items="[
        availableDynamicDefinitions.map((d) => ({
          label: getFilterLabel(d),
          onSelect: () => activateDynamicFilter(d.key),
        })),
      ]"
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

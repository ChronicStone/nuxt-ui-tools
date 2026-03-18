<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import { computed, ref } from 'vue'

import { useTableInternals } from '../../../composables/use-table-internals'
import type { TableUiFilterDefinition } from '../../../types'
import BooleanFilterTag from './BooleanFilterTag.vue'
import DateFilterTag from './DateFilterTag.vue'
import NumberFilterTag from './NumberFilterTag.vue'
import OptionFilterTag from './OptionFilterTag.vue'
import TextFilterTag from './TextFilterTag.vue'

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

function getFilterComponent(options: { definition: TableUiFilterDefinition }) {
  switch (options.definition.kind) {
    case 'option':
      return OptionFilterTag
    case 'boolean':
      return BooleanFilterTag
    case 'date':
      return DateFilterTag
    case 'number':
      return NumberFilterTag
    default:
      return TextFilterTag
  }
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
      :is="getFilterComponent({ definition })"
      v-for="definition in visibleDefinitions"
      :key="definition.key"
      :definition="definition as any"
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

<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import { computed } from 'vue'

import { useTableInternals } from '../../composables/use-table-internals'
import DateFilterPopover from './DateFilterPopover.vue'
import OptionFilterPopover from './OptionFilterPopover.vue'
import TextFilterPopover from './TextFilterPopover.vue'

const internals = useTableInternals()

const filterDefinitions = computed(() => internals.filters.definitions.value)

function getFilterComponent(options: { definition: any }) {
  if (options.definition.kind === 'option' || options.definition.kind === 'boolean') {
    return OptionFilterPopover
  }

  if (options.definition.kind === 'date') {
    return DateFilterPopover
  }

  return TextFilterPopover
}
</script>

<template>
  <template v-if="filterDefinitions.length || internals.filters.hasActiveUiFilters.value">
    <component
      :is="getFilterComponent({ definition })"
      v-for="definition in filterDefinitions"
      :key="definition.key"
      :definition="definition"
    />

    <UButton
      v-if="internals.filters.hasActiveUiFilters.value"
      color="neutral"
      variant="outline"
      size="md"
      icon="i-lucide-x"
      label="Reset"
      class="shrink-0 border-dashed"
      @click="internals.filters.clearAllFilters()"
    />
  </template>
</template>

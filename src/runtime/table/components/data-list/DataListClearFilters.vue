<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import { computed } from 'vue'

import { useDataListUi } from '../../composables/use-data-list-ui'
import { useTableInternals } from '../../composables/use-table-internals'
import type { DataListClearFiltersUi, DataListControlSize } from '../../types'

const props = defineProps<{
  label?: string
  size?: DataListControlSize
  ui?: DataListClearFiltersUi
}>()
const internals = useTableInternals()
const dataListUi = useDataListUi()
const resolvedSize = computed(
  () => props.size ?? dataListUi.ui.value.clearFilters?.size ?? dataListUi.controlSize.value,
)
const resolvedUi = computed<DataListClearFiltersUi>(() => ({
  ...dataListUi.ui.value.clearFilters?.ui,
  ...props.ui,
}))
</script>

<template>
  <slot
    v-if="internals.filters.hasActiveUiFilters.value"
    :clear="internals.filters.clearAllFilters"
    :trigger-props="{ type: 'button', onClick: internals.filters.clearAllFilters }"
  >
    <UButton
      color="neutral"
      variant="ghost"
      :size="resolvedSize"
      :label="label"
      :icon="label ? undefined : 'i-lucide-x'"
      :ui="resolvedUi"
      @click="internals.filters.clearAllFilters()"
    />
  </slot>
</template>

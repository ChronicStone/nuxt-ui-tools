<script setup lang="ts">
import { computed } from 'vue'

import { useDataListUi } from '../../composables/use-data-list-ui'
import { useTableInternals } from '../../composables/use-table-internals'
import type { DataListControlSize, DataListSearchUi } from '../../types'
import SearchQueryInput from '../utils/SearchQueryInput.vue'

const props = defineProps<{
  placeholder?: string
  size?: DataListControlSize
  width?: string
  ui?: DataListSearchUi
}>()
const internals = useTableInternals()
const dataListUi = useDataListUi()
const resolvedSize = computed(
  () => props.size ?? dataListUi.ui.value.search?.size ?? dataListUi.controlSize.value,
)
const resolvedWidth = computed(() => props.width ?? dataListUi.ui.value.search?.width ?? '21rem')
const resolvedUi = computed<DataListSearchUi>(() => ({
  ...dataListUi.ui.value.search?.ui,
  ...props.ui,
}))
const loading = computed(
  () =>
    internals.queryContent.status.value.isFetching &&
    !internals.queryContent.status.value.isPending,
)
</script>

<template>
  <SearchQueryInput
    v-model="internals.filters.searchQuery.value"
    :loading="loading"
    :placeholder="placeholder ?? internals.filters.searchPlaceholder.value"
    :size="resolvedSize"
    :ui="resolvedUi"
    :style="{ width: resolvedWidth, maxWidth: '100%' }"
  />
</template>

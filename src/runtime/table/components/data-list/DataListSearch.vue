<script setup lang="ts">
import { computed } from 'vue'

import { useDataListUi } from '../../composables/use-data-list-ui'
import { useTableInternals } from '../../composables/use-table-internals'
import type { DataListControlSize, DataListSearchProps, DataListSearchUi } from '../../types'
import { mergeDataListProps } from '../../utils'
import SearchQueryInput from '../utils/SearchQueryInput.vue'

const props = defineProps<{
  placeholder?: string
  size?: DataListControlSize
  width?: string
  ui?: DataListSearchUi
  props?: DataListSearchProps
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
const resolvedProps = computed<DataListSearchProps>(() =>
  mergeDataListProps(dataListUi.ui.value.search?.props, props.props),
)
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
    :input-props="resolvedProps.input"
    :style="{ width: resolvedWidth, maxWidth: '100%' }"
  />
</template>

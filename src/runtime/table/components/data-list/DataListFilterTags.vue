<script setup lang="ts">
import { computed } from 'vue'

import { provideDataListUi, useDataListUi } from '../../composables/use-data-list-ui'
import { useTableInternals } from '../../composables/use-table-internals'
import type { DataListControlSize, DataListFilterTagsUi } from '../../types'
import { mergeDataListUiClass } from '../../utils'
import FilterTagsBar from '../filters/tags/FilterTagsBar.vue'

const props = withDefaults(
  defineProps<{
    showAdd?: boolean
    showClear?: boolean
    size?: DataListControlSize
    ui?: DataListFilterTagsUi
  }>(),
  {
    showAdd: false,
    showClear: false,
  },
)
const dataListUi = useDataListUi()
const internals = useTableInternals()
provideDataListUi(
  computed(() => ({
    ...dataListUi.ui.value,
    filterTags: {
      ...dataListUi.ui.value.filterTags,
      size: props.size ?? dataListUi.ui.value.filterTags?.size,
      ui: {
        ...dataListUi.ui.value.filterTags?.ui,
        ...props.ui,
      },
    },
  })),
)
</script>

<template>
  <div
    :class="
      mergeDataListUiClass('contents', dataListUi.ui.value.filterTags?.ui?.root, props.ui?.root)
    "
  >
    <slot
      :definitions="internals.filterPresentation.tagDefinitions.value"
      :active-filters="internals.filters.activeUiFilters.value"
      :clear="internals.filters.clearAllFilters"
    >
      <FilterTagsBar :show-add="showAdd" :show-clear="showClear">
        <template v-if="$slots.filter" #filter="scope">
          <slot name="filter" v-bind="scope" />
        </template>
        <template v-if="$slots['add-filter-trigger']" #add-filter-trigger="scope">
          <slot name="add-filter-trigger" v-bind="scope" />
        </template>
        <template v-if="$slots['clear-filter-label']" #clear-filter-label>
          <slot name="clear-filter-label" />
        </template>
      </FilterTagsBar>
    </slot>
  </div>
</template>

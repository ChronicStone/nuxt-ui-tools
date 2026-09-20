<script setup lang="ts">
import { computed } from 'vue'

import { useDataListBreakpoint } from '../../composables/use-data-list-breakpoint'
import { provideDataListUi, useDataListUi } from '../../composables/use-data-list-ui'
import { useTableInternals } from '../../composables/use-table-internals'
import type { DataListControlSize, DataListFilterTagsUi } from '../../types'
import { mergeDataListUiClass } from '../../utils'
import FilterSheet from '../filters/sheet/filter-sheet.vue'
import FilterTagsBar from '../filters/tags/filter-tags-bar.vue'

const props = withDefaults(
  defineProps<{
    showAdd?: boolean
    showClear?: boolean
    /** `sheet` collapses the tags into a bottom sheet on mobile; `tags` keeps inline tags everywhere. */
    mobile?: 'sheet' | 'tags'
    size?: DataListControlSize
    ui?: DataListFilterTagsUi
  }>(),
  {
    mobile: 'sheet',
    showAdd: false,
    showClear: false,
  },
)
const dataListUi = useDataListUi()
const internals = useTableInternals()
const { isMobile } = useDataListBreakpoint()
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
      <FilterSheet v-if="isMobile && mobile === 'sheet'" :show-clear="showClear" />
      <FilterTagsBar v-else :show-add="showAdd" :show-clear="showClear">
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

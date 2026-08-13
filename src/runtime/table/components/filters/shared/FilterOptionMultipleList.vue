<script setup lang="ts">
import { computed } from 'vue'

import { useDataListUi } from '../../../composables/use-data-list-ui'
import type { TableResolvedFilterOptionEntry } from '../../../types'
import { mergeDataListUiClass } from '../../../utils'
import FilterOptionRow from './FilterOptionRow.vue'

interface FilterOptionMultipleListSection {
  key: string
  entries: Array<TableResolvedFilterOptionEntry & { selected?: boolean; icon?: string }>
  dividerBefore?: boolean
}

const props = defineProps<{
  sections: FilterOptionMultipleListSection[]
  showCounts: boolean
  countLoading: boolean
  selectedIcon?: string
  truncate?: boolean
}>()

const emit = defineEmits<{
  select: [
    options: {
      event: MouseEvent
      entry: TableResolvedFilterOptionEntry & { selected?: boolean; icon?: string }
      index: number
      sectionKey: string
    },
  ]
}>()

const dataListUi = useDataListUi()
const ui = computed(() => dataListUi.ui.value.filterTags?.ui)
</script>

<template>
  <div :class="mergeDataListUiClass('grid gap-0.5', undefined, ui?.list)">
    <template v-for="section in props.sections" :key="section.key">
      <div
        v-if="section.dividerBefore && section.entries.length"
        :class="mergeDataListUiClass('my-1 border-t border-default', undefined, ui?.listDivider)"
      />

      <button
        v-for="(entry, index) in section.entries"
        :key="entry.value == null ? entry.label : String(entry.value)"
        type="button"
        :class="mergeDataListUiClass('block w-full', undefined, ui?.option)"
        @click="emit('select', { event: $event, entry, index, sectionKey: section.key })"
      >
        <FilterOptionRow
          :label="entry.label"
          :count="props.showCounts ? entry.count : undefined"
          :count-loading="props.showCounts && props.countLoading"
          :selected="entry.selected ?? false"
          :leading-icon="entry.icon"
          :selected-icon="props.selectedIcon"
          :truncate="props.truncate"
        />
      </button>
    </template>
  </div>
</template>

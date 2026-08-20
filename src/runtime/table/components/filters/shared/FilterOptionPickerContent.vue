<script setup lang="ts">
import type { useOptionFilterEditorState } from '../../../composables/use-option-filter-editor-state'
import type { DataListControlSize, DataListFilterEditorUi } from '../../../types'
import FilterOptionLoadingList from './FilterOptionLoadingList.vue'
import FilterOptionMultipleList from './FilterOptionMultipleList.vue'
import FilterOptionSingleList from './FilterOptionSingleList.vue'
import FilterOptionTreeContent from './FilterOptionTreeContent.vue'
import FilterSearchablePanel from './FilterSearchablePanel.vue'

interface FilterOptionMultipleListSection {
  key: string
  entries: Array<ReturnType<typeof useOptionFilterEditorState>['displayEntries']['value'][number]>
  dividerBefore?: boolean
}

const props = defineProps<{
  state: ReturnType<typeof useOptionFilterEditorState>
  sections?: FilterOptionMultipleListSection[]
  size?: DataListControlSize
  ui?: DataListFilterEditorUi
}>()

const searchQuery = defineModel<string>('searchQuery', { default: '' })
const flatRadioValue = defineModel<string | undefined>('flatRadioValue', { default: undefined })
const treeRadioValue = defineModel<string | undefined>('treeRadioValue', { default: undefined })

const emit = defineEmits<{
  selectEntry: [
    options: {
      event: MouseEvent
      value: string | number | boolean
      index: number
      sectionKey: string
    },
  ]
  toggleTreeEntry: [entryId: string]
  toggleExpanded: [entryId: string]
}>()

function handleSelect(options: {
  event: MouseEvent
  entry: { value?: string | number | boolean }
  index: number
  sectionKey: string
}) {
  if (options.entry.value == null) return

  emit('selectEntry', {
    event: options.event,
    value: options.entry.value,
    index: options.index,
    sectionKey: options.sectionKey,
  })
}
</script>

<template>
  <FilterSearchablePanel
    v-model:search-query="searchQuery"
    :searchable="props.state.filterUi.value.searchable"
    :search-placeholder="props.state.filterUi.value.labels.searchPlaceholder"
    :search-loading="props.state.optionSource.isStaleLoading.value"
    :show-empty="
      !props.state.optionSource.isLoading.value &&
      !props.state.displayEntries.value.length &&
      !props.state.visibleTreeEntries.value.length
    "
    :empty-label="props.state.filterUi.value.labels.empty"
    :size="props.size"
    :ui="props.ui"
  >
    <template v-if="props.state.filterUi.value.presentation === 'tree'">
      <FilterOptionLoadingList
        v-if="props.state.optionSource.isLoading.value"
        :size="props.size"
        :ui="props.ui"
        indicator="checkbox"
      />
      <FilterOptionTreeContent
        v-else
        v-model="treeRadioValue"
        :entries="props.state.visibleTreeEntries.value"
        :items="props.state.treeRadioItems.value"
        :multiple="props.state.filterUi.value.selection.mode === 'multiple'"
        :count-loading="
          props.state.filterUi.value.row.showCounts && props.state.optionSource.isCountLoading.value
        "
        :selected-icon="props.state.filterUi.value.row.selectedIcon"
        :size="props.size"
        :ui="props.ui"
        @toggle-entry="emit('toggleTreeEntry', $event)"
        @toggle-expanded="emit('toggleExpanded', $event)"
      />
    </template>

    <template v-else-if="props.state.filterUi.value.selection.mode === 'multiple'">
      <FilterOptionLoadingList
        v-if="props.state.optionSource.isLoading.value"
        :size="props.size"
        :ui="props.ui"
        indicator="checkbox"
      />
      <FilterOptionMultipleList
        v-else
        :sections="props.sections ?? [{ key: 'default', entries: props.state.displayEntries.value }]"
        :show-counts="props.state.filterUi.value.row.showCounts"
        :count-loading="props.state.optionSource.isCountLoading.value"
        :selected-icon="props.state.filterUi.value.row.selectedIcon"
        :truncate="props.state.filterUi.value.row.truncate"
        :size="props.size"
        :ui="props.ui"
        @select="handleSelect($event)"
      />
    </template>

    <template v-else>
      <FilterOptionLoadingList
        v-if="props.state.optionSource.isLoading.value"
        :size="props.size"
        :ui="props.ui"
        indicator="radio"
      />
      <FilterOptionSingleList
        v-else
        v-model="flatRadioValue"
        :items="props.state.flatRadioItems.value"
        :count-loading="
          props.state.filterUi.value.row.showCounts && props.state.optionSource.isCountLoading.value
        "
        :size="props.size"
        :ui="props.ui"
      />
    </template>
  </FilterSearchablePanel>
</template>

<script setup lang="ts">
import { isNullish } from '../../../../shared/utils/predicate'
import type { useOptionFilterEditorState } from '../../../composables/use-option-filter-editor-state'
import type { DataListControlSize, DataListFilterEditorUi } from '../../../types'
import FilterOptionListEnd from './filter-option-list-end.vue'
import FilterOptionLoadingList from './filter-option-loading-list.vue'
import FilterOptionMultipleList from './filter-option-multiple-list.vue'
import FilterOptionSingleList from './filter-option-single-list.vue'
import FilterOptionTreeContent from './filter-option-tree-content.vue'
import FilterSearchablePanel from './filter-searchable-panel.vue'

interface FilterOptionMultipleListSection {
  key: string
  entries: ReturnType<typeof useOptionFilterEditorState>['displayEntries']['value'][number][]
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
  if (isNullish(options.entry.value)) {
    return
  }

  emit('selectEntry', {
    event: options.event,
    index: options.index,
    sectionKey: options.sectionKey,
    value: options.entry.value,
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
          props.state.optionSource.showCounts.value && props.state.optionSource.isCountLoading.value
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
        :sections="
          props.sections ?? [{ key: 'default', entries: props.state.displayEntries.value }]
        "
        :show-counts="props.state.optionSource.showCounts.value"
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
          props.state.optionSource.showCounts.value && props.state.optionSource.isCountLoading.value
        "
        :size="props.size"
        :ui="props.ui"
      />
    </template>

    <FilterOptionListEnd
      v-if="
        props.state.optionSource.remote.enabled.value && !props.state.optionSource.isLoading.value
      "
      :remote="props.state.optionSource.remote"
      :indicator="
        props.state.filterUi.value.selection.mode === 'multiple' ||
        props.state.filterUi.value.presentation === 'tree'
          ? 'checkbox'
          : 'radio'
      "
      :size="props.size"
      :ui="props.ui"
    />
  </FilterSearchablePanel>
</template>

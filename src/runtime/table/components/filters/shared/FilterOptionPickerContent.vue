<script setup lang="ts">
import USkeleton from '@nuxt/ui/components/Skeleton.vue'

import type { useOptionFilterEditorState } from '../../../composables/use-option-filter-editor-state'
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
}>()

const searchQuery = defineModel<string>('searchQuery', {
  default: '',
})

const flatRadioValue = defineModel<string | undefined>('flatRadioValue', {
  default: undefined,
})

const treeRadioValue = defineModel<string | undefined>('treeRadioValue', {
  default: undefined,
})

const emit = defineEmits<{
  selectEntry: [options: { event: MouseEvent; value: string | number | boolean; index: number; sectionKey: string }]
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
  >
    <template v-if="props.state.filterUi.value.presentation === 'tree'">
      <template v-if="props.state.optionSource.isLoading.value">
        <div class="grid gap-0.5">
          <div v-for="i in 5" :key="i" class="flex items-center gap-3 rounded-md px-3 py-2">
            <USkeleton class="size-4 shrink-0 rounded-full" />
            <USkeleton class="h-3.5 min-w-0 flex-1" />
            <USkeleton class="h-3.5 w-6 shrink-0" />
          </div>
        </div>
      </template>

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
        @toggle-entry="emit('toggleTreeEntry', $event)"
        @toggle-expanded="emit('toggleExpanded', $event)"
      />
    </template>

    <template v-else-if="props.state.filterUi.value.selection.mode === 'multiple'">
      <template v-if="props.state.optionSource.isLoading.value">
        <div class="grid gap-0.5">
          <div v-for="i in 5" :key="i" class="flex items-center gap-3 rounded-md px-3 py-2">
            <USkeleton class="size-4 shrink-0 rounded-md" />
            <USkeleton class="h-3.5 min-w-0 flex-1" />
            <USkeleton class="h-3.5 w-6 shrink-0" />
          </div>
        </div>
      </template>

      <FilterOptionMultipleList
        v-else
        :sections="
          props.sections ??
          [{ key: 'default', entries: props.state.displayEntries.value }]
        "
        :show-counts="props.state.filterUi.value.row.showCounts"
        :count-loading="props.state.optionSource.isCountLoading.value"
        :selected-icon="props.state.filterUi.value.row.selectedIcon"
        :truncate="props.state.filterUi.value.row.truncate"
        @select="handleSelect($event)"
      />
    </template>

    <template v-else>
      <template v-if="props.state.optionSource.isLoading.value">
        <div class="grid gap-0.5">
          <div v-for="i in 5" :key="i" class="flex items-center gap-3 rounded-md px-3 py-2">
            <USkeleton class="size-4 shrink-0 rounded-full" />
            <USkeleton class="h-3.5 min-w-0 flex-1" />
            <USkeleton class="h-3.5 w-6 shrink-0" />
          </div>
        </div>
      </template>

      <FilterOptionSingleList
        v-else
        v-model="flatRadioValue"
        :items="props.state.flatRadioItems.value"
        :count-loading="
          props.state.filterUi.value.row.showCounts && props.state.optionSource.isCountLoading.value
        "
      />
    </template>
  </FilterSearchablePanel>
</template>

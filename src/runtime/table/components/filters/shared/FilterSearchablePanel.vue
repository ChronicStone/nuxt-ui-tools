<script setup lang="ts">
import UInput from '@nuxt/ui/components/Input.vue'
import UScrollArea from '@nuxt/ui/components/ScrollArea.vue'

import type { DataListControlSize, DataListFilterEditorUi } from '../../../types'
import { mergeDataListUiClass } from '../../../utils'

const {
  searchable = false,
  autofocus = false,
  searchPlaceholder = 'Search...',
  searchLoading = false,
  showEmpty = false,
  emptyLabel = 'No matching options.',
  maxHeightClass = 'max-h-80',
  size,
  ui,
} = defineProps<{
  searchable?: boolean
  autofocus?: boolean
  searchPlaceholder?: string
  searchLoading?: boolean
  showEmpty?: boolean
  emptyLabel?: string
  maxHeightClass?: string
  size?: DataListControlSize
  ui?: DataListFilterEditorUi
}>()

const searchQuery = defineModel<string>('searchQuery', {
  default: '',
})
</script>

<template>
  <div :class="mergeDataListUiClass('bg-default', undefined, ui?.editor)">
    <div
      v-if="searchable"
      :class="
        mergeDataListUiClass('w-full border-b border-default p-2', undefined, ui?.searchHeader)
      "
    >
      <UInput
        v-model="searchQuery"
        icon="i-lucide-search"
        :placeholder="searchPlaceholder"
        class="w-full"
        :loading="searchLoading"
        variant="ghost"
        :autofocus="autofocus"
        :size="size"
        :ui="{ root: ui?.search, base: ui?.searchInput }"
      />
    </div>

    <UScrollArea
      type="hover"
      :class="mergeDataListUiClass(`p-2 ${maxHeightClass}`, undefined, ui?.scrollArea)"
      :ui="{
        root: mergeDataListUiClass(maxHeightClass, undefined, ui?.scrollArea),
        viewport: mergeDataListUiClass(maxHeightClass, undefined, ui?.scrollViewport),
      }"
    >
      <slot />

      <div
        v-if="showEmpty"
        :class="
          mergeDataListUiClass('px-3 py-8 text-center text-sm text-muted', undefined, ui?.empty)
        "
      >
        <slot name="empty">
          {{ emptyLabel }}
        </slot>
      </div>
    </UScrollArea>
  </div>
</template>
